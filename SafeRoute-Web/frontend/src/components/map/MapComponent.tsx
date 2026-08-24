"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Search,
  User,
  Plus,
  Minus,
  Layers,
  Locate,
  AlertTriangle,
  Navigation,
  MapPin,
  Shield,
  Activity,
  LogOut,
  Clock,
  Compass,
  X,
} from "lucide-react";
import { getMapIncidents } from "@/src/services/incident.service";
import { getCurrentUser } from "@/src/services/auth.service";

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
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Data Insiden Mock (Disesuaikan ke Depok)
const MOCK_INCIDENTS: MapPoint[] = [
  {
    id: "mock-1",
    sourceType: "ML_CRAWLER",
    title: "Begal Motor Sajam di Margonda",
    description: "Kejadian begal terjadi sekitar dini hari pukul 02:00 WIB. Pelaku berboncengan menggunakan senjata tajam.",
    latitude: -6.372,
    longitude: 106.832,
    address: "Jl. Margonda Raya, Beji, Kota Depok",
    incidentType: "BEGAL",
    riskLevel: "HIGH",
    detectedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "mock-2",
    sourceType: "ML_CRAWLER",
    title: "Tawuran Remaja di Depok Lama",
    description: "Tawuran antar kelompok remaja menggunakan batu dan petasan. Kepolisian telah membubarkan massa.",
    latitude: -6.390,
    longitude: 106.820,
    address: "Depok Lama, Pancoran Mas, Kota Depok",
    incidentType: "TAWURAN",
    riskLevel: "CRITICAL",
    detectedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "mock-3",
    sourceType: "USER_REPORT",
    title: "Pencurian Helm di Parkiran ITC Depok",
    description: "Helm fullface hilang diambil orang di area parkiran luar motor. Kejadian siang hari.",
    latitude: -6.390,
    longitude: 106.823,
    address: "ITC Depok, Depok Lama, Kota Depok",
    incidentType: "PENCURIAN",
    riskLevel: "MEDIUM",
    detectedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    reporterName: "Budi Santoso",
  },
  {
    id: "mock-4",
    sourceType: "ML_CRAWLER",
    title: "Aksi Pembacokan Geng Motor Jalan Juanda",
    description: "Korban mengalami luka di tangan setelah dihadang geng motor saat pulang kerja larut malam.",
    latitude: -6.389,
    longitude: 106.815,
    address: "Jl. Juanda, Depok I, Kota Depok",
    incidentType: "PEMBACOKAN",
    riskLevel: "CRITICAL",
    detectedAt: new Date().toISOString(),
  },
  {
    id: "mock-5",
    sourceType: "USER_REPORT",
    title: "Begal Sadis di Cisalak Pasar Rebo",
    description: "Korban diancam celurit dan motor matic berhasil dibawa kabur pelaku berjumlah 3 orang.",
    latitude: -6.372,
    longitude: 106.855,
    address: "Cisalak, Cimanggis, Kota Depok",
    incidentType: "BEGAL",
    riskLevel: "CRITICAL",
    detectedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reporterName: "Alvin Vino",
  },
];

// Koordinat Pusat Depok & Batas Wilayah
const DEPOK_CENTER: [number, number] = [-6.390, 106.825]; 
const DEPOK_BOUNDS: L.LatLngBoundsExpression = L.latLngBounds(
  [-6.33, 106.75], // Batas Utara-Barat (Cimanggis / Beji)
  [-6.45, 106.90]  // Batas Selatan-Timur (Pancoran Mas / Sawangan)
);
const DEPOK_MAX_ZOOM = 16;

function MapController({ center, zoom, bounds }: { center?: [number, number]; zoom?: number; bounds?: L.LatLngBoundsExpression | null; }) {
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

function MapEventsHandler({ onClick }: { onClick: (lat: number, lng: number) => void; }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapComponent() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEPOK_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [tileLayerUrl, setTileLayerUrl] = useState<string>("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
  const [showTileSelector, setShowTileSelector] = useState(false);

  // State untuk Modal Warning
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [startPoint, setStartPoint] = useState<{ name: string; lat: number; lng: number; } | null>(null);
  const [destPoint, setDestPoint] = useState<{ name: string; lat: number; lng: number; } | null>(null);

  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [incidentsNearRoute, setIncidentsNearRoute] = useState<MapPoint[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [clickMode, setClickMode] = useState<"none" | "start" | "dest" | "report">("none");
  const [incidents, setIncidents] = useState<MapPoint[]>([]);

  const [startInput, setStartInput] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [destInput, setDestInput] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await getCurrentUser();
          setUser(res.data);
        } catch (e) {
          console.error("Gagal memuat profil user:", e);
        }
      }
    };

        const fetchIncidents = async () => {
      try {
        const res = await getMapIncidents();
        if (res.success && res.data && res.data.length > 0) {
          const rawIncidents = res.data as any[];
          
          const depokData = rawIncidents
            .filter((inc: any) => 
              inc.latitude > -6.45 && inc.latitude < -6.33 && inc.longitude > 106.75 && inc.longitude < 106.90
            )
            .map((inc: any) => ({
              ...inc,
              sourceType: inc.sourceType || "USER_REPORT",
            })) as MapPoint[];
            
          setIncidents(depokData.length > 0 ? depokData : MOCK_INCIDENTS);
        } else {
          setIncidents(MOCK_INCIDENTS);
        }
      } catch (e) {
        console.error("Gagal mengambil data peta, menggunakan mock data:", e);
        setIncidents(MOCK_INCIDENTS);
      }
    };

    fetchUser();
    fetchIncidents();
  }, []);

  const createCustomIcon = (type: string, riskLevel: string) => {
    let color = "bg-blue-600";
    let iconLabel = type.slice(0, 3);
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
  };

  const startIcon = L.divIcon({
    html: `<div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-4 border-white shadow-xl animate-pulse"><div class="h-2.5 w-2.5 rounded-full bg-white"></div></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const destIcon = L.divIcon({
    html: `<div class="flex flex-col items-center justify-center h-10 w-8"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-2 border-white shadow-xl text-white"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4 text-emerald-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div></div>`,
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 36],
  });

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=id`, { headers: { "User-Agent": "SafeRoute-NextJS" } });
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        
        if (lat > -6.45 && lat < -6.33 && lon > 106.75 && lon < 106.90) {
          setMapCenter([lat, lon]);
          setMapZoom(15);
          setDestPoint({ name: item.display_name, lat, lng: lon });
          setDestInput(item.display_name);
        } else {
          setShowLocationWarning(true); // Munculkan modal
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchSuggestions = async (query: string, setSuggestions: (data: any[]) => void) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`, { headers: { "User-Agent": "SafeRoute-NextJS" } });
      const data = await res.json();
      setSuggestions(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartNavigation = async () => {
    if (!startPoint || !destPoint) return;
    
    setRouteLoading(true);
    setIsNavigating(true);

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${destPoint.lng},${destPoint.lat}?overview=full&geometries=geojson`);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        
        setRoutePolyline(coords);
        setRouteDistance(route.distance);
        setRouteDuration(route.duration);

        const near = incidents.filter((inc) => {
          return coords.some((coord) => getDistanceFromLatLonInKm(coord[0], coord[1], inc.latitude, inc.longitude) < 0.5);
        });
        setIncidentsNearRoute(near);

        const latLngs = coords.map((c) => L.latLng(c[0], c[1]));
        setMapBounds(L.latLngBounds(latLngs));
      }
    } catch (e) {
      console.error("Routing OSRM error:", e);
    } finally {
      setRouteLoading(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (clickMode === "none") return;
    setRouteLoading(true);

    if (lat < -6.45 || lat > -6.33 || lng < 106.75 || lng > 106.90) {
      setShowLocationWarning(true); // Munculkan modal
      setClickMode("none");
      setRouteLoading(false);
      return;
    }

    let displayName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { "User-Agent": "SafeRoute-NextJS" } });
      const data = await res.json();
      if (data && data.display_name) displayName = data.display_name;
    } catch (e) {
      console.error(e);
    } finally {
      setRouteLoading(false);
    }

    if (clickMode === "start") {
      setStartPoint({ name: displayName, lat, lng });
      setStartInput(displayName);
    } else if (clickMode === "dest") {
      setDestPoint({ name: displayName, lat, lng });
      setDestInput(displayName);
    } else if (clickMode === "report") {
      router.push("/lapor");
    }
    setClickMode("none");
  };

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (lat < -6.45 || lat > -6.33 || lng < 106.75 || lng > 106.90) {
          setShowLocationWarning(true); // Munculkan modal
          return;
        }

        setMapCenter([lat, lng]);
        setMapZoom(15);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { "User-Agent": "SafeRoute-NextJS" } });
          const data = await res.json();
          const name = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setStartPoint({ name, lat, lng });
          setStartInput(name);
        } catch (e) {
          console.error(e);
        }
      }, (error) => {
        console.error(error);
        setShowLocationWarning(true);
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowUserDropdown(false);
    router.push("/login");
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 font-sans">
      <header className="z-[1000] flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
              <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.2" />
              <path d="M6 9c0 3 12 3 12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">SafeRoute</span>
        </div>

        <div className="flex h-full items-center gap-8">
          <Link href="/home" className={`relative flex h-full items-center px-1 text-sm font-semibold transition-all duration-200 ${true ? "text-[#0B2540]" : "text-slate-500 hover:text-slate-800"}`}>
            Peta
            <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-t-full bg-[#0B2540] animate-fade-in" />
          </Link>
          <Link href="/lapor" className={`relative flex h-full items-center px-1 text-sm font-semibold transition-all duration-200 ${false ? "text-[#0B2540]" : "text-slate-500 hover:text-slate-800"}`}>
            Lapor
          </Link>
          <Link href="/chat" className={`relative flex h-full items-center px-1 text-sm font-semibold transition-all duration-200 ${false ? "text-[#0B2540]" : "text-slate-500 hover:text-slate-800"}`}>
            Chat
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:flex items-center">
            <input
              type="text"
              placeholder="Cari lokasi di Depok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch()}
              className="w-56 rounded-full bg-slate-100 py-1.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-inner"
            />
            <button onClick={handleGlobalSearch} className="absolute right-3 text-slate-400 hover:text-blue-600 transition-colors">
              {loadingSuggestions ? (
                <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              <User className="h-5 w-5" />
            </button>
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-xl ring-1 ring-black/5 z-[2000] animate-fade-in">
                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Masuk sebagai</p>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <hr className="my-1.5 border-slate-100" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                      <LogOut className="h-4 w-4" /> Keluar Akun
                    </button>
                  </>
                ) : (
                  <div className="p-1">
                    <p className="px-2.5 py-1.5 text-[11px] text-slate-500 font-medium leading-relaxed">Masuk untuk melaporkan insiden kriminalitas di sekitar Anda.</p>
                    <Link href="/login" onClick={() => setShowUserDropdown(false)} className="mt-2 block w-full rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10">
                      Masuk / Daftar
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            className="h-full w-full" 
            zoomControl={false}
            maxBounds={DEPOK_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={12}
            maxZoom={DEPOK_MAX_ZOOM}
          >
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={tileLayerUrl} />
            <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />
            <MapEventsHandler onClick={handleMapClick} />

            {startPoint && (
              <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
                <Popup><div className="p-1 text-xs"><p className="font-bold text-slate-800">Titik Awal</p><p className="text-slate-500 mt-0.5">{startPoint.name}</p></div></Popup>
              </Marker>
            )}
            {destPoint && (
              <Marker position={[destPoint.lat, destPoint.lng]} icon={destIcon}>
                <Popup><div className="p-1 text-xs"><p className="font-bold text-slate-800">Tujuan Perjalanan</p><p className="text-slate-500 mt-0.5">{destPoint.name}</p></div></Popup>
              </Marker>
            )}

            {routePolyline.length > 0 && (
              <>
                {startPoint && destPoint && (
                  <Polyline positions={[[startPoint.lat, startPoint.lng], [destPoint.lat, destPoint.lng]]} color="#f97316" dashArray="8, 10" weight={2.5} opacity={0.8} />
                )}
                <Polyline positions={routePolyline} color="#15803d" weight={6} opacity={0.95} />
              </>
            )}

            {incidents.map((inc) => (
              <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={createCustomIcon(inc.incidentType, inc.riskLevel)}>
                <Popup className="custom-popup">
                  <div className="p-2.5 max-w-xs text-xs font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${inc.riskLevel === "CRITICAL" ? "bg-rose-600" : inc.riskLevel === "HIGH" ? "bg-orange-500" : inc.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"}`}>{inc.riskLevel}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{inc.sourceType === "ML_CRAWLER" ? "ML CRAWLER" : "LAPORAN WARGA"}</span>
                    </div>
                    <h4 className="mt-2 font-bold text-slate-800 text-sm leading-tight">{inc.title}</h4>
                    {inc.description && <p className="mt-1 text-slate-600 leading-normal text-[11px]">{inc.description}</p>}
                    {inc.address && <p className="mt-2 flex items-start gap-1 text-[10px] text-slate-500 italic"><MapPin className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" /><span>{inc.address}</span></p>}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                      <span>{new Date(inc.detectedAt).toLocaleDateString("id-ID")}</span>
                      {inc.reporterName && <span className="font-semibold text-slate-600">Oleh: {inc.reporterName}</span>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="absolute right-6 top-6 z-10 flex flex-col gap-3">
          <div className="relative">
            <button onClick={() => setShowTileSelector(!showTileSelector)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors" title="Pilih Tipe Peta">
              <Layers className="h-5 w-5" />
            </button>
            {showTileSelector && (
              <div className="absolute right-12 top-0 w-36 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-fade-in z-20">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe Peta</p>
                <button onClick={() => { setTileLayerUrl("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"); setShowTileSelector(false); }} className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 transition-colors mt-1 text-slate-700">Standard Map</button>
                <button onClick={() => { setTileLayerUrl("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"); setShowTileSelector(false); }} className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 transition-colors text-slate-700">Sleek Voyager</button>
                <button onClick={() => { setTileLayerUrl("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"); setShowTileSelector(false); }} className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 transition-colors text-slate-700">Dark Mode</button>
              </div>
            )}
          </div>

          <button onClick={handleLocateUser} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors" title="Lokasi Saya">
            <Locate className="h-5 w-5" />
          </button>
          <button onClick={() => setMapZoom((prev) => Math.min(prev + 1, DEPOK_MAX_ZOOM))} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors" title="Perbesar">
            <Plus className="h-5 w-5" />
          </button>
          <button onClick={() => setMapZoom((prev) => Math.max(prev - 1, 12))} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-colors" title="Perkecil">
            <Minus className="h-5 w-5" />
          </button>
        </div>

        {clickMode !== "none" && (
          <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-slate-900/90 border border-slate-800 px-6 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-bounce flex items-center gap-2">
            <Compass className="h-4 w-4 text-blue-400 animate-spin" />
            <span>{clickMode === "start" ? "Klik titik di peta untuk memilih Titik Awal" : clickMode === "dest" ? "Klik titik di peta untuk memilih Destinasi" : "Klik titik di peta untuk lokasi Laporan"}</span>
            <button onClick={() => setClickMode("none")} className="ml-2 rounded-full bg-white/20 hover:bg-white/30 px-2 py-0.5 text-[10px]">Batal</button>
          </div>
        )}

        {/* PANEL NAVIGASI KIRI */}
        <div className="absolute left-6 top-6 bottom-6 z-10 w-80 max-w-sm shrink-0 flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300">
          
          <div className="flex flex-col overflow-y-auto p-5">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              Navigasi Aman
            </h2>
            <p className="mt-1 text-[11px] text-slate-400 leading-normal font-medium">
              Pilih titik awal dan tujuan Anda untuk menganalisis tingkat keamanan rute perjalanan di Depok.
            </p>

            <div className="relative mt-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Titik Awal (Lokasi Anda)</label>
              <div className="flex gap-1.5 items-center">
                <div className="relative flex-1">
                  <input type="text" placeholder="Cari lokasi awal..." value={startInput} onChange={(e) => { setStartInput(e.target.value); fetchSuggestions(e.target.value, setStartSuggestions); }} className="w-full rounded-xl bg-slate-50 border border-slate-200/60 py-2.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-colors" />
                  {startInput && (<button onClick={() => { setStartInput(""); setStartPoint(null); setStartSuggestions([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">&times;</button>)}
                </div>
                <button onClick={() => setClickMode("start")} className={`rounded-xl border p-2.5 shadow-sm transition-all duration-200 ${clickMode === "start" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`} title="Pilih di Peta">
                  <MapPin className="h-4.5 w-4.5" />
                </button>
              </div>
              {startSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl z-20">
                  {startSuggestions.map((item, idx) => (
                    <button key={idx} onClick={() => { setStartPoint({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }); setStartInput(item.display_name); setStartSuggestions([]); }} className="w-full text-left rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors truncate text-slate-700 font-semibold border-b border-slate-50 last:border-b-0">
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative mt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tujuan Perjalanan</label>
              <div className="flex gap-1.5 items-center">
                <div className="relative flex-1">
                  <input type="text" placeholder="Cari lokasi tujuan..." value={destInput} onChange={(e) => { setDestInput(e.target.value); fetchSuggestions(e.target.value, setDestSuggestions); }} className="w-full rounded-xl bg-slate-50 border border-slate-200/60 py-2.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-colors" />
                  {destInput && (<button onClick={() => { setDestInput(""); setDestPoint(null); setDestSuggestions([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">&times;</button>)}
                </div>
                <button onClick={() => setClickMode("dest")} className={`rounded-xl border p-2.5 shadow-sm transition-all duration-200 ${clickMode === "dest" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`} title="Pilih di Peta">
                  <MapPin className="h-4.5 w-4.5" />
                </button>
              </div>
              {destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl z-20">
                  {destSuggestions.map((item, idx) => (
                    <button key={idx} onClick={() => { setDestPoint({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }); setDestInput(item.display_name); setDestSuggestions([]); }} className="w-full text-left rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors truncate text-slate-700 font-semibold border-b border-slate-50 last:border-b-0">
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleStartNavigation}
              disabled={routeLoading || !startPoint || !destPoint}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B2540] py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#13315c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {routeLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {routeLoading ? "Menghitung..." : "Mulai Navigasi"}
            </button>

            {isNavigating && !routeLoading && routePolyline.length > 0 && (
              <div className="mt-6 animate-fade-in space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex justify-between items-center shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-end gap-1">
                      <span className="text-xl font-black text-slate-900">{(routeDistance! / 1000).toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 font-semibold mb-1">km</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600 truncate">Via {startPoint?.name.split(',')[0]}</p>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3" /> 
                      {incidentsNearRoute.length === 0 ? "Terverifikasi Aman" : incidentsNearRoute.length <= 2 ? "Perlu Waspada" : "Rawan Tinggi"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-end justify-end gap-1">
                      <span className="text-xl font-black text-slate-900">{Math.round(routeDuration! / 60)}</span>
                      <span className="text-[10px] text-slate-500 font-semibold mb-1">mnt</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Perjalanan</p>
                  </div>
                </div>

                {incidentsNearRoute.length > 0 && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 flex justify-between items-center shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-black text-slate-900">{((routeDistance! * 1.2) / 1000).toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500 font-semibold mb-1">km</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 truncate">Rute Alternatif</p>
                      <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" /> {incidentsNearRoute.length} Insiden Dekat Rute
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-end justify-end gap-1">
                        <span className="text-xl font-black text-slate-900">{Math.round((routeDuration! * 1.2) / 60)}</span>
                        <span className="text-[10px] text-slate-500 font-semibold mb-1">mnt</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Lebih Lama</p>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Titik Rawan ({incidentsNearRoute.length})
                  </h4>
                  {incidentsNearRoute.length > 0 ? (
                    <div className="mt-3 max-h-40 overflow-y-auto flex flex-col gap-2 pr-1">
                      {incidentsNearRoute.map((inc) => (
                        <div key={inc.id} className="rounded-xl border border-slate-100 bg-white p-2.5 flex flex-col gap-1 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-slate-800 truncate max-w-[140px]">{inc.title}</span>
                            <span className={`rounded px-1 text-[8px] font-extrabold text-white ${inc.riskLevel === "CRITICAL" ? "bg-rose-600" : inc.riskLevel === "HIGH" ? "bg-orange-500" : "bg-amber-500"}`}>{inc.riskLevel}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 truncate flex items-center gap-0.5"><MapPin className="h-3 w-3 shrink-0" /> {inc.address}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs font-semibold text-slate-500 text-center flex flex-col items-center justify-center py-2">
                      <span>🎉 Tidak ada titik kejahatan terdeteksi di jalur ini!</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">Sistem menyarankan rute ini aman dilalui.</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isNavigating && (
              <div className="mt-8 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 rounded-2xl">
                <Compass className="h-8 w-8 text-slate-300" />
                <p className="mt-2.5 text-xs font-bold text-slate-500">Rute Belum Terbentuk</p>
                <p className="mt-1 text-[10px] text-slate-400">Masukkan titik awal dan tujuan Anda untuk menampilkan jalur teraman di peta.</p>
                <button onClick={handleLocateUser} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 px-4 py-2 text-xs font-bold text-blue-600 transition-colors shadow-sm">
                  <Locate className="h-3.5 w-3.5" /> Gunakan Lokasi GPS Saya
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0 bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wider uppercase">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-emerald-500" /> Sistem Aktif</span>
            <span className="flex items-center gap-1 font-extrabold text-blue-600"><Activity className="h-3 w-3 text-blue-500 animate-pulse" /> 106.8°E / 6.2°S</span>
          </div>
        </div>
      </div>

      {/* MODAL WARNING (Pengganti Alert) */}
      {showLocationWarning && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowLocationWarning(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
                <AlertTriangle className="h-7 w-7" />
              </div>
              
              <h3 className="text-lg font-extrabold text-slate-800">
                Lokasi di Luar Area Depok
              </h3>
              
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
                Sistem SafeRoute saat ini hanya tersedia untuk wilayah <span className="font-bold text-slate-700">Kota Depok</span>. 
                Silakan pilih atau cari lokasi lain yang masih berada di dalam area Depok.
              </p>
              
              <button
                onClick={() => setShowLocationWarning(false)}
                className="mt-5 w-full rounded-xl bg-[#0B2540] py-2.5 text-sm font-bold text-white hover:bg-[#13315c] transition-colors shadow-lg shadow-blue-900/10"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}