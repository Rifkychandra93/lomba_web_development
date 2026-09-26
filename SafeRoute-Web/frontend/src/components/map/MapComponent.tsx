"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/src/lib/tokenStorage";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plus,
  Minus,
  Layers,
  Locate,
  AlertTriangle,
  Navigation,
  MapPin,
  Shield,
  ShieldCheck,
  Compass,
  X,
  ArrowLeft,
  ArrowUpDown,
  Pencil,
  Bike,
  Car,
  Footprints,
  Info,
  ChevronDown,
  Clock,
} from "lucide-react";
import { getMapIncidents } from "@/src/services/incident.service";
import { getCurrentUser } from "@/src/services/auth.service";
import { Navbar } from "../layout/Navbar";


interface MapPoint {
  id: string;
  sourceType: "ML_CRAWLER" | "USER_REPORT";
  title: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  incidentType: string;
  riskLevel: string;
  detectedAt: string;
  reporterName?: string;
  imageUrl?: string | null;
  news?: {
    publishedAt?: string | null;
    title?: string;
    url?: string;
    source?: string | null;
  } | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RouteOption {
  id: string;
  name: string;
  polyline: [number, number][];
  distance: number;
  duration: number;
  incidents: MapPoint[];
  riskScore: number;
}

interface NominatimSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface SelectedPoint {
  name: string;
  lat: number;
  lng: number;
}

type ClickMode = "none" | "start" | "dest" | "report";
type InputFocus = "start" | "dest";
type TravelMode = "MOTOR" | "MOBIL" | "JALAN_KAKI";

/* ============================================================================
 * CONSTANTS
 * ==========================================================================*/

const NOMINATIM_HEADERS = { "User-Agent": "SafeRoute-NextJS" };

const DEPOK_CENTER: [number, number] = [-6.39, 106.825];
const DEPOK_LAT_MIN = -6.45;
const DEPOK_LAT_MAX = -6.33;
const DEPOK_LNG_MIN = 106.75;
const DEPOK_LNG_MAX = 106.9;
const DEPOK_BOUNDS: L.LatLngBoundsExpression = L.latLngBounds(
  [DEPOK_LAT_MIN, DEPOK_LNG_MIN],
  [DEPOK_LAT_MAX, DEPOK_LNG_MAX]
);
const DEPOK_MAX_ZOOM = 16;
const DEPOK_MIN_ZOOM = 12;

const TILE_LAYERS: Array<{ label: string; url: string }> = [
  { label: "Standard Map", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
  { label: "Sleek Voyager", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" },
  { label: "Dark Mode", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" },
];

const TRAVEL_MODES: Array<{ id: TravelMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "MOTOR", label: "Sepeda Motor", icon: Bike },
  { id: "MOBIL", label: "Mobil", icon: Car },
  { id: "JALAN_KAKI", label: "Jalan Kaki", icon: Footprints },
];

// TODO(BE): OSRM demo server publik yang dipakai sekarang cuma punya profil
// "driving". Motor & Mobil masih aman dipakai bareng (jaringan jalannya sama),
// tapi buat rute Jalan Kaki yang akurat (gang, jalan setapak, dst) perlu
// routing engine dengan profil "foot" terpisah — belum terintegrasi.

const RISK_LEGEND: Array<{ level: string; label: string; dotClass: string }> = [
  { level: "CRITICAL", label: "Kritis", dotClass: "bg-rose-600" },
  { level: "HIGH", label: "Tinggi", dotClass: "bg-orange-500" },
  { level: "MEDIUM", label: "Sedang", dotClass: "bg-amber-500" },
  { level: "LOW", label: "Rendah", dotClass: "bg-emerald-500" },
];

/* ============================================================================
 * PURE HELPERS — semua rumus & threshold di bawah ini nilainya sama persis
 * dengan versi sebelumnya (punyamu & punya teman), cuma dipindah & didedup.
 * ==========================================================================*/

function isWithinDepokBounds(lat: number, lng: number): boolean {
  return lat >= DEPOK_LAT_MIN && lat <= DEPOK_LAT_MAX && lng >= DEPOK_LNG_MIN && lng <= DEPOK_LNG_MAX;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * TODO(BE): skor ini masih perkiraan sederhana di sisi klien, diturunkan dari
 * riskScore (jumlah insiden terboboti di sekitar rute). Idealnya skor
 * keselamatan 0-100 dihitung backend dari data historis + faktor lain
 * (penerangan jalan, keramaian, jam kejadian, dst), bukan cuma jumlah insiden.
 */
function getSafetyScore(riskScore: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - riskScore * 10)));
}

function getSafetyLevel(score: number): { label: string; dotClass: string; textClass: string } {
  if (score >= 80) return { label: "Level Hijau", dotClass: "bg-emerald-500", textClass: "text-emerald-400" };
  if (score >= 50) return { label: "Level Kuning", dotClass: "bg-amber-500", textClass: "text-amber-400" };
  return { label: "Level Merah", dotClass: "bg-rose-500", textClass: "text-rose-400" };
}

async function searchNominatim(query: string): Promise<NominatimSuggestion[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`,
      { headers: NOMINATIM_HEADERS }
    );
    return (await res.json()) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Coba beberapa level zoom, dari paling detail (jalan) ke paling umum
  // (kecamatan/kota). Titik yang nggak punya alamat presisi (gang kecil,
  // tanah kosong, tengah lapangan) tetap dapat nama area terdekat, bukan
  // jatuh ke koordinat mentah.
  const zoomLevels = [18, 16, 12];

  for (const zoom of zoomLevels) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1`
      );
      if (!res.ok) {
        console.error(`Reverse geocode (zoom ${zoom}) gagal, HTTP status:`, res.status);
        continue;
      }

      const data = await res.json();
      if (data?.display_name) return data.display_name;

      const addr = data?.address;
      if (addr) {
        const parts = [
          addr.road,
          addr.suburb || addr.village || addr.hamlet,
          addr.city || addr.town || addr.county,
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
      }
    } catch (e) {
      console.error(`Reverse geocode (zoom ${zoom}) error:`, e);
    }
  }

  // Semua level zoom gagal nemu nama — daripada nampilin koordinat mentah,
  // kasih label umum karena area yang dicakup aplikasi ini memang dibatasi Depok.
  console.warn("Reverse geocode tidak menemukan nama lokasi untuk titik ini:", lat, lng);
  return "Lokasi Terpilih di Kota Depok";
}

function buildRouteOption(route: any, index: number, incidents: MapPoint[]): RouteOption {
  const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
  const near = incidents.filter((inc) =>
    coords.some((coord) => getDistanceFromLatLonInKm(coord[0], coord[1], inc.latitude, inc.longitude) < 0.5)
  );
  const riskScore = near.reduce((acc, inc) => {
    let weight = 1;
    if (inc.riskLevel === "CRITICAL") weight = 5;
    else if (inc.riskLevel === "HIGH") weight = 3;
    else if (inc.riskLevel === "MEDIUM") weight = 2;
    return acc + weight;
  }, 0);

  return {
    id: `route-${index}`,
    polyline: coords,
    distance: route.distance,
    duration: route.duration,
    incidents: near,
    riskScore,
    name: "",
  };
}

function isPseudoLoopRoute(primaryPoly: [number, number][], altPoly: [number, number][]): boolean {
  if (primaryPoly.length === 0 || altPoly.length === 0) return false;
  let overlapCount = 0;
  for (const pt of altPoly) {
    const nearPrimary = primaryPoly.some((p) => getDistanceFromLatLonInKm(pt[0], pt[1], p[0], p[1]) < 0.06);
    if (nearPrimary) overlapCount++;
  }
  return overlapCount / altPoly.length > 0.78;
}

function createIncidentIcon(type: string, riskLevel: string) {
  let color = "bg-blue-600";
  const iconLabel = type.slice(0, 3);
  if (riskLevel === "CRITICAL") color = "bg-rose-600 border-2 border-white shadow-rose-600/30";
  else if (riskLevel === "HIGH") color = "bg-orange-500 border-2 border-white shadow-orange-500/30";
  else if (riskLevel === "MEDIUM") color = "bg-amber-500 border-2 border-white shadow-amber-500/30";
  else if (riskLevel === "LOW") color = "bg-emerald-500 border-2 border-white shadow-emerald-500/30";

  return L.divIcon({
    html: `<div class="relative flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg ${color} transition-all duration-300 hover:scale-110"><span>${iconLabel}</span></div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Ikon start/dest sama persis setiap render, jadi cukup dibuat sekali di
// module scope alih-alih di-generate ulang tiap kali komponen render.
const START_ICON = L.divIcon({
  html: `<div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-4 border-white shadow-xl animate-pulse"><div class="h-2.5 w-2.5 rounded-full bg-white"></div></div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const DEST_ICON = L.divIcon({
  html: `<div class="flex flex-col items-center justify-center h-10 w-8"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-2 border-white shadow-xl text-white"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4 text-emerald-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div></div>`,
  className: "",
  iconSize: [32, 40],
  iconAnchor: [16, 36],
});

/* ============================================================================
 * HOOKS
 * ==========================================================================*/

/** Ambil profil user kalau ada token — dipertahankan untuk kebutuhan mendatang. */
function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    (async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
      } catch (e) {
        console.error("Gagal memuat profil user:", e);
      }
    })();
  }, []);
  return user;
}

/** Ambil & filter insiden untuk peta (exclude kebakaran, exclude lebih dari 30 hari). */
function useMapIncidentsData() {
  const [incidents, setIncidents] = useState<MapPoint[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await getMapIncidents();
        if (res.success && res.data) {
          const oneMonthAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const filtered = (res.data as any as MapPoint[]).filter((inc) => {
            if (inc.incidentType === "KEBAKARAN") return false;
            const targetDate = inc.news?.publishedAt || inc.detectedAt;
            if (targetDate) {
              const dt = new Date(targetDate).getTime();
              if (!isNaN(dt) && dt < oneMonthAgoMs) return false;
            }
            return true;
          });
          setIncidents(filtered);
        } else {
          setIncidents([]);
        }
      } catch (e) {
        console.error("Gagal mengambil data peta:", e);
        setIncidents([]);
      }
    })();
  }, []);
  return incidents;
}

/** Satu input alamat + daftar saran Nominatim — dipakai untuk titik awal & tujuan. */
function useAddressField() {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);

  const handleChange = (text: string) => {
    setValue(text);
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    void searchNominatim(text).then(setSuggestions);
  };

  const clear = () => {
    setValue("");
    setSuggestions([]);
  };

  return { value, setValue, suggestions, setSuggestions, handleChange, clear };
}

/** Semua state & aksi seputar memilih titik awal/tujuan (input, peta, GPS, tukar). */
function useLocationPlanner(setRouteLoading: (v: boolean) => void, onReportPinDropped: () => void) {
  const start = useAddressField();
  const dest = useAddressField();
  const [startPoint, setStartPoint] = useState<SelectedPoint | null>(null);
  const [destPoint, setDestPoint] = useState<SelectedPoint | null>(null);
  const [clickMode, setClickMode] = useState<ClickMode>("none");
  const [showOutOfBounds, setShowOutOfBounds] = useState(false);

  const selectStartSuggestion = (item: NominatimSuggestion) => {
    setStartPoint({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    start.setValue(item.display_name);
    start.setSuggestions([]);
  };

  const selectDestSuggestion = (item: NominatimSuggestion) => {
    setDestPoint({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    dest.setValue(item.display_name);
    dest.setSuggestions([]);
  };

  /** Cuma bersihin input & titik — TIDAK ngerombak rute yang lagi tampil (dipakai modal search mobile). */
  const clearStart = () => {
    start.clear();
    setStartPoint(null);
  };
  const clearDest = () => {
    dest.clear();
    setDestPoint(null);
  };

  /** Tukar titik awal & tujuan sekaligus, kembalikan pasangan titik barunya untuk dipakai hitung ulang rute. */
  const swapPoints = (): { newStart: SelectedPoint | null; newDest: SelectedPoint | null } => {
    const prevStart = startPoint;
    const prevStartValue = start.value;
    setStartPoint(destPoint);
    start.setValue(dest.value);
    setDestPoint(prevStart);
    dest.setValue(prevStartValue);
    return { newStart: destPoint, newDest: prevStart };
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (clickMode === "none") return;
    setRouteLoading(true);

    if (!isWithinDepokBounds(lat, lng)) {
      setShowOutOfBounds(true);
      setClickMode("none");
      setRouteLoading(false);
      return;
    }

    const displayName = await reverseGeocode(lat, lng);
    setRouteLoading(false);

    if (clickMode === "start") {
      setStartPoint({ name: displayName, lat, lng });
      start.setValue(displayName);
    } else if (clickMode === "dest") {
      setDestPoint({ name: displayName, lat, lng });
      dest.setValue(displayName);
    } else if (clickMode === "report") {
      onReportPinDropped();
    }
    setClickMode("none");
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        if (!isWithinDepokBounds(lat, lng)) {
          setShowOutOfBounds(true);
          return;
        }
        const name = await reverseGeocode(lat, lng);
        setStartPoint({ name, lat, lng });
        start.setValue(name);
      },
      (error) => {
        console.error(error);
        setShowOutOfBounds(true);
      }
    );
  };

  return {
    start,
    dest,
    startPoint,
    destPoint,
    clickMode,
    setClickMode,
    showOutOfBounds,
    setShowOutOfBounds,
    selectStartSuggestion,
    selectDestSuggestion,
    clearStart,
    clearDest,
    swapPoints,
    handleMapClick,
    locateMe,
  };
}

/** Hitung & kelola opsi rute (OSRM) dari satu titik awal ke satu tujuan. */
function useSafeRouting(incidents: MapPoint[]) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);

  const startNavigation = async (startPoint: SelectedPoint, destPoint: SelectedPoint) => {
    setRouteLoading(true);
    setIsNavigating(true);

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${destPoint.lng},${destPoint.lat}?overview=full&geometries=geojson&alternatives=3`
      );
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return;

      const rawRoutes: RouteOption[] = data.routes.map((route: any, index: number) =>
        buildRouteOption(route, index, incidents)
      );

      let routeOptions: RouteOption[] = [];
      routeOptions.push(rawRoutes[0]);
      for (let i = 1; i < rawRoutes.length; i++) {
        if (!isPseudoLoopRoute(rawRoutes[0].polyline, rawRoutes[i].polyline)) {
          routeOptions.push(rawRoutes[i]);
        }
      }

      if (routeOptions.length < 2 && routeOptions[0].riskScore > 0) {
        const midLat = (startPoint.lat + destPoint.lat) / 2;
        const midLng = (startPoint.lng + destPoint.lng) / 2;
        const dLat = destPoint.lat - startPoint.lat;
        const dLng = destPoint.lng - startPoint.lng;
        const len = Math.sqrt(dLat * dLat + dLng * dLng);

        if (len > 0.001) {
          const perpLat = -dLng / len;
          const perpLng = dLat / len;
          const offsets = [0.015, -0.015, 0.025, -0.025];

          for (const offset of offsets) {
            const wpLat = Math.max(DEPOK_LAT_MIN, Math.min(DEPOK_LAT_MAX, midLat + perpLat * offset));
            const wpLng = Math.max(DEPOK_LNG_MIN, Math.min(DEPOK_LNG_MAX, midLng + perpLng * offset));

            try {
              const altRes = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${wpLng},${wpLat};${destPoint.lng},${destPoint.lat}?overview=full&geometries=geojson`
              );
              const altData = await altRes.json();
              if (altData.routes && altData.routes.length > 0) {
                const altRoute = buildRouteOption(altData.routes[0], routeOptions.length, incidents);
                if (!isPseudoLoopRoute(routeOptions[0].polyline, altRoute.polyline)) {
                  routeOptions.push(altRoute);
                  break;
                }
              }
            } catch (altErr) {
              console.error("Alt route fetch error:", altErr);
            }
          }
        }
      }

      if (routeOptions.length > 1) {
        let fastestIndex = 0;
        let safestIndex = 0;
        for (let i = 1; i < routeOptions.length; i++) {
          if (routeOptions[i].duration < routeOptions[fastestIndex].duration) fastestIndex = i;
          if (routeOptions[i].riskScore < routeOptions[safestIndex].riskScore) safestIndex = i;
        }

        routeOptions.forEach((r, idx) => {
          if (idx === safestIndex && routeOptions[safestIndex].riskScore < routeOptions[fastestIndex].riskScore) {
            r.name = "Rute Teraman";
          } else if (idx === fastestIndex) {
            r.name =
              routeOptions[safestIndex].riskScore === routeOptions[fastestIndex].riskScore
                ? "Rute Tercepat & Teraman"
                : "Rute Tercepat";
          } else {
            r.name = `Alternatif ${idx + 1}`;
          }
        });
      } else if (routeOptions.length === 1) {
        routeOptions[0].name = routeOptions[0].riskScore === 0 ? "Rute Tercepat & Teraman" : "Rute Utama";
      }

      setRoutes(routeOptions);

      let safestIndex = 0;
      for (let i = 1; i < routeOptions.length; i++) {
        if (routeOptions[i].riskScore < routeOptions[safestIndex].riskScore) safestIndex = i;
      }
      setSelectedRouteId(routeOptions[safestIndex].id);

      const allCoords = routeOptions.flatMap((r) => r.polyline);
      setMapBounds(L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1]))));
    } catch (e) {
      console.error("Routing OSRM error:", e);
    } finally {
      setRouteLoading(false);
    }
  };

  /** Balikin ke kondisi "belum ada rute", dipakai tombol kembali di mobile. */
  const resetRoutes = () => {
    setIsNavigating(false);
    setRoutes([]);
    setSelectedRouteId(null);
    setMapBounds(null);
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;
  const fastestRoute = routes.length > 0 ? routes.reduce((min, r) => (r.duration < min.duration ? r : min), routes[0]) : null;
  const incidentsNearRoute = selectedRoute?.incidents ?? [];
  const safetyScore = selectedRoute ? getSafetyScore(selectedRoute.riskScore) : 0;
  const safetyLevel = getSafetyLevel(safetyScore);
  const incidentsAvoided =
    selectedRoute && fastestRoute && selectedRoute.id !== fastestRoute.id
      ? fastestRoute.incidents.length - selectedRoute.incidents.length
      : 0;
  const extraMinutes =
    selectedRoute && fastestRoute ? Math.max(0, Math.round((selectedRoute.duration - fastestRoute.duration) / 60)) : 0;

  return {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    routeLoading,
    setRouteLoading,
    isNavigating,
    mapBounds,
    incidentsNearRoute,
    startNavigation,
    resetRoutes,
    selectedRoute,
    fastestRoute,
    safetyScore,
    safetyLevel,
    incidentsAvoided,
    extraMinutes,
  };
}

/** State kecil khusus UI mobile: modal search & fokus input mana yang lagi aktif. */
function useMobileNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeFocus, setActiveFocus] = useState<InputFocus>("dest");
  return { isSearchOpen, setIsSearchOpen, activeFocus, setActiveFocus };
}

/* ============================================================================
 * MAP HELPER COMPONENTS (leaflet)
 * ==========================================================================*/

function MapController({
  center,
  zoom,
  bounds,
}: {
  center?: [number, number];
  zoom?: number;
  bounds?: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: DEPOK_MAX_ZOOM });
    } else if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 1 });
    }
  }, [map, center, zoom, bounds]);
  return null;
}

function MapEventsHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* ============================================================================
 * SHARED SMALL COMPONENTS
 * ==========================================================================*/

function MapTileSwitcher({ activeUrl, onSelect }: { activeUrl: string; onSelect: (url: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors"
        title="Pilih Tipe Peta"
      >
        <Layers className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-12 top-0 w-36 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-fade-in z-20">
          <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe Peta</p>
          {TILE_LAYERS.map((tile) => (
            <button
              key={tile.url}
              onClick={() => {
                onSelect(tile.url);
                setIsOpen(false);
              }}
              className={`w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 transition-colors mt-1 ${
                activeUrl === tile.url ? "text-[#0B2540]" : "text-slate-700"
              }`}
            >
              {tile.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocationOutOfBoundsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">Lokasi di Luar Area Depok</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
            Sistem SafeRoute saat ini hanya tersedia untuk wilayah <span className="font-bold text-slate-700">Kota Depok</span>.
            Silakan pilih atau cari lokasi lain yang masih berada di dalam area Depok.
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-[#0B2540] py-2.5 text-sm font-bold text-white hover:bg-[#13315c] transition-colors shadow-lg shadow-blue-900/10"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

function IncidentPopupContent({ incident }: { incident: MapPoint }) {
  return (
    <div className="p-2.5 max-w-xs text-xs font-sans">
      <div className="flex items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${incident.riskLevel === "CRITICAL" ? "bg-rose-600" : incident.riskLevel === "HIGH" ? "bg-orange-500" : incident.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"}`}>
          {incident.riskLevel}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {incident.sourceType === "ML_CRAWLER" ? "ML CRAWLER" : "LAPORAN WARGA"}
        </span>
      </div>
      <h4 className="mt-2 font-bold text-slate-800 text-sm leading-tight">{incident.title}</h4>
      {incident.description && <p className="mt-1 text-slate-600 leading-normal text-[11px]">{incident.description}</p>}
      {incident.imageUrl && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-100">
          <img src={incident.imageUrl} alt="Bukti Kejadian" className="w-full max-h-32 object-cover" />
        </div>
      )}
      {incident.address && (
        <p className="mt-2 flex items-start gap-1 text-[10px] text-slate-500 italic">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
          <span>{incident.address}</span>
        </p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
        <span>{new Date(incident.detectedAt).toLocaleDateString("id-ID")}</span>
        {incident.reporterName && <span className="font-semibold text-slate-600">Oleh: {incident.reporterName}</span>}
      </div>
    </div>
  );
}

/** Panel "Titik Waspada Terpantau" — daftar ringkas dengan expand/collapse, bukan kotak scroll kecil. */
function NearbyIncidentsPanel({ incidents }: { incidents: MapPoint[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = 3;
  const visibleIncidents = expanded ? incidents : incidents.slice(0, visibleCount);

  const riskStyles: Record<string, { border: string; badge: string }> = {
    CRITICAL: { border: "border-l-rose-600", badge: "bg-rose-600" },
    HIGH: { border: "border-l-orange-500", badge: "bg-orange-500" },
    MEDIUM: { border: "border-l-amber-500", badge: "bg-amber-500" },
    LOW: { border: "border-l-emerald-500", badge: "bg-emerald-500" },
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> Titik Waspada Terpantau
        </h4>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">{incidents.length}</span>
      </div>

      {incidents.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {visibleIncidents.map((inc) => {
            const style = riskStyles[inc.riskLevel] ?? riskStyles.LOW;
            return (
              <div key={inc.id} className={`rounded-lg border border-slate-100 border-l-4 ${style.border} bg-slate-50/60 p-2.5`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-extrabold text-slate-800 leading-snug">{inc.title}</p>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-extrabold text-white ${style.badge}`}>
                    {inc.riskLevel}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[9px] text-slate-400">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{inc.address || "Lokasi tidak diketahui"}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(inc.news?.publishedAt || inc.detectedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            );
          })}

          {incidents.length > visibleCount && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-bold text-[#0B2540] hover:bg-slate-50 transition-colors"
            >
              {expanded ? "Tampilkan lebih sedikit" : `Lihat semua (${incidents.length})`}
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs font-semibold text-slate-500 text-center flex flex-col items-center justify-center py-2">
          <span>Tidak ada titik kejahatan terdeteksi di jalur ini!</span>
          <span className="text-[10px] text-slate-400 font-medium mt-1">Sistem menyarankan rute ini aman dilalui.</span>
        </p>
      )}
    </div>
  );
}

/* ============================================================================
 * DESKTOP SIDEBAR COMPONENTS (restyle sesuai referensi, palet navy/slate situs)
 * ==========================================================================*/

function LocationInputField({
  markerNode,
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onClear,
  suggestions,
  onSelectSuggestion,
  isPicking,
  onTogglePick,
  autoFocus,
}: {
  markerNode: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onFocus?: () => void;
  onClear: () => void;
  suggestions: NominatimSuggestion[];
  onSelectSuggestion: (item: NominatimSuggestion) => void;
  isPicking: boolean;
  onTogglePick: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative flex gap-2.5">
      <div className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center">{markerNode}</div>
      <div className="relative flex-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
        <div className="flex gap-1.5 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              autoFocus={autoFocus}
              className="w-full rounded-xl bg-slate-50 border border-slate-200/60 py-2.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#0B2540]/40 transition-colors"
            />
            {value && (
              <button
                onClick={onClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>
          <button
            onClick={onTogglePick}
            className={`rounded-xl border p-2.5 shadow-sm transition-all duration-200 ${
              isPicking ? "bg-[#0B2540] border-[#0B2540] text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            title="Pilih di Peta"
          >
            <MapPin className="h-4.5 w-4.5" />
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl z-20">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(item)}
                className="w-full text-left rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors truncate text-slate-700 font-semibold border-b border-slate-50 last:border-b-0"
              >
                {item.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TravelModeSelector({ value, onChange }: { value: TravelMode; onChange: (v: TravelMode) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Moda Perjalanan</label>
      <div className="grid grid-cols-3 gap-1.5">
        {TRAVEL_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-colors ${
                isSelected ? "border-[#0B2540] bg-[#0B2540]/5" : "border-slate-200 bg-slate-50 hover:bg-slate-100/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? "text-[#0B2540]" : "text-slate-400"}`} />
              <span className={`text-[10px] font-semibold leading-tight ${isSelected ? "text-[#0B2540]" : "text-slate-500"}`}>
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
      {value === "JALAN_KAKI" && (
        <p className="mt-1.5 flex items-start gap-1 text-[10px] italic text-slate-400">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          Estimasi rute jalan kaki masih menggunakan data jalan kendaraan.
        </p>
      )}
    </div>
  );
}

function SafetyAnalysisCard({
  route,
  safetyScore,
  safetyLevel,
  incidentsAvoided,
  extraMinutes,
}: {
  route: RouteOption;
  safetyScore: number;
  safetyLevel: { label: string; dotClass: string; textClass: string };
  incidentsAvoided: number;
  extraMinutes: number;
}) {
  // Skor & ikon butuh warna yang lebih pekat (600) supaya kontras cukup di atas
  // latar putih — dotClass/badge tetap dipakai apa adanya karena itu pil berwarna.
  const scoreColor = safetyLevel.textClass.replace("400", "600");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hasil Analisis Jalur</p>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${safetyLevel.dotClass}`}>{safetyLevel.label}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800 truncate">{route.name || "Rute Terpilih"}</p>
        <p className="shrink-0 text-[10px] font-semibold text-slate-400">
          {(route.distance / 1000).toFixed(1)} km &middot; {Math.round(route.duration / 60)} mnt
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
        <div>
          <span className={`text-3xl font-black ${scoreColor}`}>{safetyScore}</span>
          <span className="text-sm font-bold text-slate-300">/100</span>
          <p className="text-[10px] font-semibold text-slate-400">Skor Keselamatan</p>
        </div>
        <ShieldCheck className={`h-9 w-9 ${scoreColor}`} />
      </div>

      {incidentsAvoided > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-slate-600">
            Rute ini menghindari <span className="font-bold text-slate-800">{incidentsAvoided} titik rawan</span> lebih sedikit
            dibanding rute tercepat{extraMinutes > 0 ? `, dengan tambahan waktu ±${extraMinutes} menit` : ""}.
          </p>
        </div>
      )}
      {incidentsAvoided <= 0 && route.incidents.length === 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-slate-600">
            Rute ini sudah menjadi jalur tercepat sekaligus teraman yang tersedia saat ini.
          </p>
        </div>
      )}
    </div>
  );
}

function RouteOptionCard({
  route,
  isSelected,
  startPointName,
  onSelect,
}: {
  route: RouteOption;
  isSelected: boolean;
  startPointName?: string;
  onSelect: () => void;
}) {
  const isSafest = route.name.includes("Teraman");
  const isFastest = route.name.includes("Tercepat");

  const borderClass = isSelected
    ? "border-[#0B2540] bg-[#0B2540]/5 ring-1 ring-[#0B2540] shadow-md"
    : "border-slate-100 bg-white hover:bg-slate-50";

  let safetyText = "Terverifikasi Aman";
  let safetyColor = "text-emerald-600";
  if (route.incidents.length > 0) {
    if (route.incidents.length <= 2) {
      safetyText = "Perlu Waspada";
      safetyColor = "text-amber-600";
    } else {
      safetyText = "Rawan Tinggi";
      safetyColor = "text-rose-600";
    }
  }

  return (
    <div onClick={onSelect} className={`rounded-xl border p-3 flex justify-between items-center shadow-sm cursor-pointer transition-all duration-200 ${borderClass}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white ${isSafest ? "bg-emerald-500" : isFastest ? "bg-[#0B2540]" : "bg-slate-500"}`}>
            {route.name}
          </span>
          {route.incidents.length > 0 && (
            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" /> {route.incidents.length} Insiden
            </span>
          )}
        </div>
        <div className="flex items-end gap-1">
          <span className="text-xl font-black text-slate-900">{(route.distance / 1000).toFixed(1)}</span>
          <span className="text-[10px] text-slate-500 font-semibold mb-1">km</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-600 truncate">Via {startPointName?.split(",")[0]}</p>
        <span className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${safetyColor}`}>
          <Shield className="h-3 w-3" />
          {safetyText}
        </span>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-end justify-end gap-1">
          <span className="text-xl font-black text-slate-900">{Math.round(route.duration / 60)}</span>
          <span className="text-[10px] text-slate-500 font-semibold mb-1">mnt</span>
        </div>
        <p className="text-[10px] text-slate-400 font-semibold mt-1">Perjalanan</p>
      </div>
    </div>
  );
}

function RiskLegend({ incidents }: { incidents: MapPoint[] }) {
  return (
    <div className="shrink-0 bg-slate-50 border-t border-slate-100 px-5 py-3">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kategori Kerawanan di Peta</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {RISK_LEGEND.map((item) => {
          const count = incidents.filter((inc) => inc.riskLevel === item.level).length;
          return (
            <span key={item.level} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
              <span className={`h-2 w-2 rounded-full ${item.dotClass}`} />
              {item.label} ({count})
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-[9px] text-slate-400">Data dari laporan warga &amp; sistem deteksi ML SafeRoute.</p>
    </div>
  );
}

function DesktopSidebar({
  incidents,
  location,
  routing,
  travelMode,
  onTravelModeChange,
  onClearStart,
  onClearDest,
  onStart,
}: {
  incidents: MapPoint[];
  location: ReturnType<typeof useLocationPlanner>;
  routing: ReturnType<typeof useSafeRouting>;
  travelMode: TravelMode;
  onTravelModeChange: (v: TravelMode) => void;
  onClearStart: () => void;
  onClearDest: () => void;
  onStart: () => void;
}) {
  return (
    <div className="hidden md:flex absolute left-6 top-6 bottom-6 z-20 w-[22rem] max-w-sm shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col overflow-y-auto">
        <div className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-[#0B2540] uppercase tracking-wider">Navigasi Aman</h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-normal font-medium">
            Pilih titik awal dan tujuan Anda untuk menganalisis tingkat keamanan rute perjalanan di Depok.
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
            <span>{incidents.length} titik rawan terpantau di sekitar Depok</span>
          </div>

          <div className="relative mt-4">
            <div className="absolute left-[13px] top-6 bottom-6 w-px border-l-2 border-dashed border-slate-200" />

            <LocationInputField
              markerNode={<span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />}
              label="Titik Awal (Lokasi Anda)"
              placeholder="Cari lokasi awal..."
              value={location.start.value}
              onChange={location.start.handleChange}
              onClear={onClearStart}
              suggestions={location.start.suggestions}
              onSelectSuggestion={location.selectStartSuggestion}
              isPicking={location.clickMode === "start"}
              onTogglePick={() => location.setClickMode("start")}
            />

            <div className="mt-4">
              <LocationInputField
                markerNode={
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                }
                label="Tujuan Perjalanan"
                placeholder="Cari lokasi tujuan..."
                value={location.dest.value}
                onChange={location.dest.handleChange}
                onClear={onClearDest}
                suggestions={location.dest.suggestions}
                onSelectSuggestion={location.selectDestSuggestion}
                isPicking={location.clickMode === "dest"}
                onTogglePick={() => location.setClickMode("dest")}
              />
            </div>
          </div>

          <div className="mt-4">
            <TravelModeSelector value={travelMode} onChange={onTravelModeChange} />
          </div>

          <button
            onClick={onStart}
            disabled={routing.routeLoading || !location.startPoint || !location.destPoint}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B2540] py-3 text-sm font-bold text-white shadow-lg shadow-[#0B2540]/20 transition-all hover:bg-[#13315c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Navigation className="h-4 w-4" />
            {routing.routeLoading ? "Menghitung..." : "Mulai Navigasi Aman"}
          </button>
        </div>

        {routing.isNavigating && !routing.routeLoading && routing.routes.length > 0 && (
          <div className="px-5 pb-5 mt-5 animate-fade-in space-y-3">
            {routing.selectedRoute && (
              <SafetyAnalysisCard
                route={routing.selectedRoute}
                safetyScore={routing.safetyScore}
                safetyLevel={routing.safetyLevel}
                incidentsAvoided={routing.incidentsAvoided}
                extraMinutes={routing.extraMinutes}
              />
            )}

            <div className="space-y-2">
              {routing.routes.map((r) => (
                <RouteOptionCard
                  key={r.id}
                  route={r}
                  isSelected={r.id === routing.selectedRouteId}
                  startPointName={location.startPoint?.name}
                  onSelect={() => routing.setSelectedRouteId(r.id)}
                />
              ))}
            </div>

            <NearbyIncidentsPanel incidents={routing.incidentsNearRoute} />
          </div>
        )}

        {!routing.isNavigating && (
          <div className="px-5 pb-5">
            <div className="mt-2 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 rounded-2xl">
              <Compass className="h-8 w-8 text-slate-300" />
              <p className="mt-2.5 text-xs font-bold text-slate-500">Rute Belum Terbentuk</p>
              <p className="mt-1 text-[10px] text-slate-400">Masukkan titik awal dan tujuan Anda untuk menampilkan jalur teraman di peta.</p>
              <button onClick={location.locateMe} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B2540]/5 hover:bg-[#0B2540]/10 px-4 py-2 text-xs font-bold text-[#0B2540] transition-colors shadow-sm">
                Gunakan Lokasi GPS Saya
              </button>
            </div>
          </div>
        )}
      </div>

      <RiskLegend incidents={incidents} />
    </div>
  );
}

/* ============================================================================
 * MOBILE UI COMPONENTS — sekarang pakai komponen & palet yang sama persis
 * dengan sidebar desktop (LocationInputField, SafetyAnalysisCard,
 * RouteOptionCard) supaya tampilannya konsisten di semua ukuran layar.
 * ==========================================================================*/

function MobileRouteSummaryBar({
  startLabel,
  destLabel,
  onOpenSearch,
  onSwap,
}: {
  startLabel: string;
  destLabel: string;
  onOpenSearch: () => void;
  onSwap: () => void;
}) {
  return (
    <div className="md:hidden absolute left-3 right-3 top-3 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-3 shadow-xl border border-slate-200/80 animate-fade-in flex items-center justify-between gap-2">
      <div onClick={onOpenSearch} className="flex-1 cursor-pointer flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-emerald-200 shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate">{startLabel}</span>
        </div>
        <div className="ml-1.5 h-2 w-0 border-l border-dashed border-slate-300" />
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-900 border-2 border-slate-300 shrink-0" />
          <span className="text-xs font-extrabold text-slate-900 truncate">{destLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSwap();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          title="Tukar Awal & Tujuan"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
        <button
          onClick={onOpenSearch}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B2540] text-white shadow-sm hover:bg-[#13315c] transition"
          title="Cari / Ubah Rute"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function MobileSearchOverlay({
  location,
  mobile,
  onSelectStart,
  onSelectDest,
  onPickOnMap,
  onLocateMe,
  onStart,
}: {
  location: ReturnType<typeof useLocationPlanner>;
  mobile: ReturnType<typeof useMobileNav>;
  onSelectStart: (item: NominatimSuggestion) => void;
  onSelectDest: (item: NominatimSuggestion) => void;
  onPickOnMap: (field: InputFocus) => void;
  onLocateMe: () => void;
  onStart: () => void;
}) {
  return (
    <div className="md:hidden fixed inset-0 z-[100] flex flex-col bg-white p-4 animate-fade-in overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <button
          onClick={() => mobile.setIsSearchOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-extrabold text-[#0B2540] tracking-wide">Mau ke mana hari ini?</h2>
        <div className="w-9" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
        <LocationInputField
          markerNode={<span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />}
          label="Titik Awal"
          placeholder="Cari lokasi awal..."
          value={location.start.value}
          onChange={location.start.handleChange}
          onFocus={() => mobile.setActiveFocus("start")}
          onClear={location.clearStart}
          suggestions={location.start.suggestions}
          onSelectSuggestion={onSelectStart}
          isPicking={location.clickMode === "start"}
          onTogglePick={() => onPickOnMap("start")}
        />
        <LocationInputField
          markerNode={
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
              <MapPin className="h-3.5 w-3.5" />
            </span>
          }
          label="Tujuan Perjalanan"
          placeholder="Cari lokasi tujuan..."
          value={location.dest.value}
          onChange={location.dest.handleChange}
          onFocus={() => mobile.setActiveFocus("dest")}
          onClear={location.clearDest}
          suggestions={location.dest.suggestions}
          onSelectSuggestion={onSelectDest}
          isPicking={location.clickMode === "dest"}
          onTogglePick={() => onPickOnMap("dest")}
          autoFocus={mobile.activeFocus === "dest"}
        />
      </div>

      <button
        onClick={onLocateMe}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0B2540]/5 hover:bg-[#0B2540]/10 py-2.5 text-xs font-bold text-[#0B2540] transition-colors"
      >
        <Locate className="h-3.5 w-3.5" />
        Gunakan Lokasi GPS Saya
      </button>

      {location.startPoint && location.destPoint && (
        <button
          onClick={onStart}
          className="mt-4 w-full rounded-2xl bg-[#0B2540] hover:bg-[#13315c] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#0B2540]/20 transition"
        >
          Tampilkan Rute Aman
        </button>
      )}
    </div>
  );
}

function MobileRouteDrawer({
  routes,
  selectedRouteId,
  onSelect,
  startPointName,
  safetyScore,
  safetyLevel,
  incidentsAvoided,
  extraMinutes,
}: {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelect: (id: string) => void;
  startPointName?: string;
  safetyScore: number;
  safetyLevel: { label: string; dotClass: string; textClass: string };
  incidentsAvoided: number;
  extraMinutes: number;
}) {
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 rounded-t-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.15)] p-4 flex flex-col max-h-[75vh] animate-slide-up">
      <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />

      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 shrink-0">
        <div>
          <h3 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">Rute Perjalanan</h3>
          <p className="text-[10px] text-slate-400">Analisis tingkat keamanan jalur Depok</p>
        </div>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{routes.length} Pilihan</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {selectedRoute && (
          <SafetyAnalysisCard
            route={selectedRoute}
            safetyScore={safetyScore}
            safetyLevel={safetyLevel}
            incidentsAvoided={incidentsAvoided}
            extraMinutes={extraMinutes}
          />
        )}

        <div className="space-y-2">
          {routes.map((r) => (
            <RouteOptionCard
              key={r.id}
              route={r}
              isSelected={r.id === selectedRouteId}
              startPointName={startPointName}
              onSelect={() => onSelect(r.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ==========================================================================*/

export default function MapComponent() {
  const router = useRouter();
  useCurrentUser(); // dipertahankan untuk kebutuhan mendatang (mis. avatar di sidebar)
  const incidents = useMapIncidentsData();

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEPOK_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [tileLayerUrl, setTileLayerUrl] = useState<string>(TILE_LAYERS[0].url);
  const [travelMode, setTravelMode] = useState<TravelMode>("MOTOR");

  const routing = useSafeRouting(incidents);
  const location = useLocationPlanner(routing.setRouteLoading, () => router.push("/lapor"));
  const mobile = useMobileNav();

  // Bungkus startNavigation supaya modal search mobile ikut ketutup otomatis,
  // persis kayak perilaku sebelumnya.
  const runNavigation = async (start: SelectedPoint, dest: SelectedPoint) => {
    mobile.setIsSearchOpen(false);
    await routing.startNavigation(start, dest);
  };

  // Bersihin titik SEKALIGUS rute yang lagi tampil (dipakai tombol clear di sidebar desktop).
  const handleClearStart = () => {
    location.clearStart();
    routing.resetRoutes();
  };
  const handleClearDest = () => {
    location.clearDest();
    routing.resetRoutes();
  };

  const handleSelectStart = (item: NominatimSuggestion) => {
    location.selectStartSuggestion(item);
    const point: SelectedPoint = { name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    if (location.destPoint) void runNavigation(point, location.destPoint);
  };

  const handleSelectDest = (item: NominatimSuggestion) => {
    location.selectDestSuggestion(item);
    const point: SelectedPoint = { name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    if (location.startPoint) void runNavigation(location.startPoint, point);
  };

  const handleSwap = () => {
    const { newStart, newDest } = location.swapPoints();
    if (newStart && newDest) void runNavigation(newStart, newDest);
  };

  const handlePickOnMapFromMobile = (field: InputFocus) => {
    mobile.setIsSearchOpen(false);
    mobile.setActiveFocus(field);
    location.setClickMode(field);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 font-sans">
      <Navbar activePage="peta" />

      <div className="relative flex flex-1 w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            zoomControl={false}
            maxBounds={DEPOK_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={DEPOK_MIN_ZOOM}
            maxZoom={DEPOK_MAX_ZOOM}
          >
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={tileLayerUrl} />
            <MapController center={mapCenter} zoom={mapZoom} bounds={routing.mapBounds} />
            <MapEventsHandler onClick={location.handleMapClick} />

            {location.startPoint && (
              <Marker position={[location.startPoint.lat, location.startPoint.lng]} icon={START_ICON}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-slate-800">Titik Awal</p>
                    <p className="text-slate-500 mt-0.5">{location.startPoint.name}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            {location.destPoint && (
              <Marker position={[location.destPoint.lat, location.destPoint.lng]} icon={DEST_ICON}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-slate-800">Tujuan Perjalanan</p>
                    <p className="text-slate-500 mt-0.5">{location.destPoint.name}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {routing.routes.length > 0 && (
              <>
                {routing.routes
                  .filter((r) => r.id !== routing.selectedRouteId)
                  .map((r) => (
                    <Polyline
                      key={r.id}
                      positions={r.polyline}
                      color="#94a3b8"
                      weight={6}
                      opacity={0.6}
                      eventHandlers={{
                        click: (e) => {
                          if (e.originalEvent) e.originalEvent.stopPropagation();
                          routing.setSelectedRouteId(r.id);
                        },
                      }}
                    />
                  ))}
                {routing.routes
                  .filter((r) => r.id === routing.selectedRouteId)
                  .map((r) => (
                    <Polyline
                      key={r.id}
                      positions={r.polyline}
                      color="#2563eb"
                      weight={7}
                      opacity={0.95}
                      eventHandlers={{
                        click: (e) => {
                          if (e.originalEvent) e.originalEvent.stopPropagation();
                          routing.setSelectedRouteId(r.id);
                        },
                      }}
                    />
                  ))}
              </>
            )}

            {incidents.map((inc) => (
              <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={createIncidentIcon(inc.incidentType, inc.riskLevel)}>
                <Popup className="custom-popup">
                  <IncidentPopupContent incident={inc} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Kontrol peta desktop (zoom, layer, GPS) — disembunyikan di mobile karena mobile
            sudah punya tombol "Lokasi Saya" sendiri di dalam modal search. */}
        <div className="hidden md:flex absolute right-6 top-6 z-10 flex-col gap-3">
          <MapTileSwitcher activeUrl={tileLayerUrl} onSelect={setTileLayerUrl} />
          <button onClick={location.locateMe} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors" title="Lokasi Saya">
            <Locate className="h-5 w-5" />
          </button>
          <button onClick={() => setMapZoom((prev) => Math.min(prev + 1, DEPOK_MAX_ZOOM))} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors" title="Perbesar">
            <Plus className="h-5 w-5" />
          </button>
          <button onClick={() => setMapZoom((prev) => Math.max(prev - 1, DEPOK_MIN_ZOOM))} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors" title="Perkecil">
            <Minus className="h-5 w-5" />
          </button>
        </div>

        {location.clickMode !== "none" && (
          <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-slate-900/90 border border-slate-800 px-6 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-bounce flex items-center gap-2">
            <Compass className="h-4 w-4 text-blue-400 animate-spin" />
            <span>
              {location.clickMode === "start"
                ? "Klik titik di peta untuk memilih Titik Awal"
                : location.clickMode === "dest"
                ? "Klik titik di peta untuk memilih Destinasi"
                : "Klik titik di peta untuk lokasi Laporan"}
            </span>
            <button onClick={() => location.setClickMode("none")} className="ml-2 rounded-full bg-white/20 hover:bg-white/30 px-2 py-0.5 text-[10px]">
              Batal
            </button>
          </div>
        )}

        {/* ===================== MOBILE ===================== */}
        {!mobile.isSearchOpen && (
          <MobileRouteSummaryBar
            startLabel={location.startPoint?.name.split(",")[0] || location.start.value.split(",")[0] || "Lokasi Anda (Titik Awal)"}
            destLabel={location.destPoint?.name.split(",")[0] || location.dest.value.split(",")[0] || "Cari Tujuan Anda..."}
            onOpenSearch={() => {
              mobile.setIsSearchOpen(true);
              mobile.setActiveFocus("dest");
            }}
            onSwap={handleSwap}
          />
        )}

        {routing.isNavigating && !mobile.isSearchOpen && (
          <button
            onClick={routing.resetRoutes}
            className="md:hidden absolute left-4 top-24 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl border border-slate-700 hover:bg-slate-800 active:scale-95 transition"
            title="Kembali ke Pencarian"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {mobile.isSearchOpen && (
          <MobileSearchOverlay
            location={location}
            mobile={mobile}
            onSelectStart={handleSelectStart}
            onSelectDest={handleSelectDest}
            onPickOnMap={handlePickOnMapFromMobile}
            onLocateMe={location.locateMe}
            onStart={() => {
              if (location.startPoint && location.destPoint) void runNavigation(location.startPoint, location.destPoint);
            }}
          />
        )}

        {routing.isNavigating && !mobile.isSearchOpen && routing.routes.length > 0 && (
          <MobileRouteDrawer
            routes={routing.routes}
            selectedRouteId={routing.selectedRouteId}
            onSelect={routing.setSelectedRouteId}
            startPointName={location.startPoint?.name}
            safetyScore={routing.safetyScore}
            safetyLevel={routing.safetyLevel}
            incidentsAvoided={routing.incidentsAvoided}
            extraMinutes={routing.extraMinutes}
          />
        )}

        {/* ===================== DESKTOP ===================== */}
        <DesktopSidebar
          incidents={incidents}
          location={location}
          routing={routing}
          travelMode={travelMode}
          onTravelModeChange={setTravelMode}
          onClearStart={handleClearStart}
          onClearDest={handleClearDest}
          onStart={() => {
            if (location.startPoint && location.destPoint) void runNavigation(location.startPoint, location.destPoint);
          }}
        />
      </div>

      {location.showOutOfBounds && <LocationOutOfBoundsModal onClose={() => location.setShowOutOfBounds(false)} />}
    </div>
  );
}