"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, clearAuth } from "@/src/lib/tokenStorage";
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
  ArrowLeft,
  ArrowUpDown,
  Pencil,
  ChevronDown,
  Check,
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


const DEPOK_CENTER: [number, number] = [-6.390, 106.825]; 
const DEPOK_BOUNDS: L.LatLngBoundsExpression = L.latLngBounds(
  [-6.33, 106.75],
  [-6.45, 106.90] 
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

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRouteId && routes.length > 0) {
      const selected = routes.find((r) => r.id === selectedRouteId);
      if (selected) {
        setRoutePolyline(selected.polyline);
        setRouteDistance(selected.distance);
        setRouteDuration(selected.duration);
        setIncidentsNearRoute(selected.incidents);
      }
    } else {
      setRoutePolyline([]);
      setRouteDistance(null);
      setRouteDuration(null);
      setIncidentsNearRoute([]);
    }
  }, [selectedRouteId, routes]);


  const [clickMode, setClickMode] = useState<"none" | "start" | "dest" | "report">("none");
  const [incidents, setIncidents] = useState<MapPoint[]>([]);

  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeInputFocus, setActiveInputFocus] = useState<"start" | "dest">("dest");

  const [startInput, setStartInput] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [destInput, setDestInput] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
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
        if (res.success && res.data) {
          const oneMonthAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const filteredIncidents = (res.data as any as MapPoint[]).filter((inc) => {
            if (inc.incidentType === "KEBAKARAN") return false;
            const targetDate = inc.news?.publishedAt || inc.detectedAt;
            if (targetDate) {
              const dt = new Date(targetDate).getTime();
              if (!isNaN(dt) && dt < oneMonthAgoMs) return false;
            }
            return true;
          });
          setIncidents(filteredIncidents);
        } else {
          setIncidents([]);
        }
      } catch (e) {
        console.error("Gagal mengambil data peta:", e);
        setIncidents([]);
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
          setShowLocationWarning(true); 
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

  const buildRouteOption = (route: any, index: number): RouteOption => {
    const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
    const near = incidents.filter((inc) => {
      return coords.some((coord) => getDistanceFromLatLonInKm(coord[0], coord[1], inc.latitude, inc.longitude) < 0.5);
    });
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
      riskScore: riskScore,
      name: ""
    };
  };

  const isPseudoLoopRoute = (primaryPoly: [number, number][], altPoly: [number, number][]): boolean => {
    if (primaryPoly.length === 0 || altPoly.length === 0) return false;
    let overlapCount = 0;
    for (const pt of altPoly) {
      const nearPrimary = primaryPoly.some((p) => getDistanceFromLatLonInKm(pt[0], pt[1], p[0], p[1]) < 0.06);
      if (nearPrimary) overlapCount++;
    }
    const overlapRatio = overlapCount / altPoly.length;
    return overlapRatio > 0.78;
  };

  const handleStartNavigation = async (overrideStart = startPoint, overrideDest = destPoint) => {
    const sPoint = overrideStart || startPoint;
    const dPoint = overrideDest || destPoint;
    if (!sPoint || !dPoint) return;
    
    setRouteLoading(true);
    setIsNavigating(true);
    setIsMobileSearchOpen(false);

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${sPoint.lng},${sPoint.lat};${dPoint.lng},${dPoint.lat}?overview=full&geometries=geojson&alternatives=3`
      );
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const rawRoutes: RouteOption[] = data.routes.map((route: any, index: number) => buildRouteOption(route, index));

        let routeOptions: RouteOption[] = [];
        if (rawRoutes.length > 0) {
          routeOptions.push(rawRoutes[0]);
          for (let i = 1; i < rawRoutes.length; i++) {
            if (!isPseudoLoopRoute(rawRoutes[0].polyline, rawRoutes[i].polyline)) {
              routeOptions.push(rawRoutes[i]);
            }
          }
        }

        if (routeOptions.length < 2 && routeOptions[0].riskScore > 0) {
          const midLat = (sPoint.lat + dPoint.lat) / 2;
          const midLng = (sPoint.lng + dPoint.lng) / 2;
          const dLat = dPoint.lat - sPoint.lat;
          const dLng = dPoint.lng - sPoint.lng;
          const len = Math.sqrt(dLat * dLat + dLng * dLng);

          if (len > 0.001) {
            const perpLat = -dLng / len;
            const perpLng = dLat / len;
            const offsets = [0.015, -0.015, 0.025, -0.025];

            for (const offset of offsets) {
              const wpLat = Math.max(-6.45, Math.min(-6.33, midLat + perpLat * offset));
              const wpLng = Math.max(106.75, Math.min(106.90, midLng + perpLng * offset));

              try {
                const altRes = await fetch(
                  `https://router.project-osrm.org/route/v1/driving/${sPoint.lng},${sPoint.lat};${wpLng},${wpLat};${dPoint.lng},${dPoint.lat}?overview=full&geometries=geojson`
                );
                const altData = await altRes.json();
                if (altData.routes && altData.routes.length > 0) {
                  const altRoute = buildRouteOption(altData.routes[0], routeOptions.length);
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
          for (let i = 1; i < routeOptions.length; i++) {
            if (routeOptions[i].duration < routeOptions[fastestIndex].duration) {
              fastestIndex = i;
            }
          }

          let safestIndex = 0;
          for (let i = 1; i < routeOptions.length; i++) {
            if (routeOptions[i].riskScore < routeOptions[safestIndex].riskScore) {
              safestIndex = i;
            }
          }

          routeOptions.forEach((r, idx) => {
            if (idx === safestIndex && routeOptions[safestIndex].riskScore < routeOptions[fastestIndex].riskScore) {
              r.name = "Rute Teraman";
            } else if (idx === fastestIndex) {
              r.name = routeOptions[safestIndex].riskScore === routeOptions[fastestIndex].riskScore ? "Rute Tercepat & Teraman" : "Rute Tercepat";
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
          if (routeOptions[i].riskScore < routeOptions[safestIndex].riskScore) {
            safestIndex = i;
          }
        }
        setSelectedRouteId(routeOptions[safestIndex].id);

        const allCoords = routeOptions.flatMap((r) => r.polyline);
        const latLngs = allCoords.map((c) => L.latLng(c[0], c[1]));
        setMapBounds(L.latLngBounds(latLngs));
        setIsMobilePanelOpen(false);
      }
    } catch (e) {
      console.error("Routing OSRM error:", e);
    } finally {
      setRouteLoading(false);
    }
  };

  const handleSwapPoints = () => {
    const tempPoint = startPoint;
    const tempInput = startInput;
    setStartPoint(destPoint);
    setStartInput(destInput);
    setDestPoint(tempPoint);
    setDestInput(tempInput);

    if (destPoint && tempPoint) {
      handleStartNavigation(destPoint, tempPoint);
    }
  };

  const handleResetRoute = () => {
    setIsNavigating(false);
    setRoutes([]);
    setSelectedRouteId(null);
    setRoutePolyline([]);
    setMapBounds(null);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (clickMode === "none") return;
    setRouteLoading(true);

    if (lat < -6.45 || lat > -6.33 || lng < 106.75 || lng > 106.90) {
      setShowLocationWarning(true); 
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
          setShowLocationWarning(true); 
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
    clearAuth();
    setUser(null);
    setShowUserDropdown(false);
    router.push("/login");
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

            {routes.length > 0 && (
              <>
                {/* Render unselected routes in gray */}
                {routes
                  .filter((r) => r.id !== selectedRouteId)
                  .map((r) => (
                    <Polyline
                      key={r.id}
                      positions={r.polyline}
                      color="#94a3b8"
                      weight={6}
                      opacity={0.6}
                      eventHandlers={{
                        click: (e) => {
                          if (e.originalEvent) {
                            e.originalEvent.stopPropagation();
                          }
                          setSelectedRouteId(r.id);
                        },
                      }}
                    />
                  ))}
                {routes
                  .filter((r) => r.id === selectedRouteId)
                  .map((r) => (
                    <Polyline
                      key={r.id}
                      positions={r.polyline}
                      color="#2563eb"
                      weight={7}
                      opacity={0.95}
                      eventHandlers={{
                        click: (e) => {
                          if (e.originalEvent) {
                            e.originalEvent.stopPropagation();
                          }
                          setSelectedRouteId(r.id);
                        },
                      }}
                    />
                  ))}
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
                    {inc.imageUrl && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-slate-100">
                        <img src={inc.imageUrl} alt="Bukti Kejadian" className="w-full max-h-32 object-cover" />
                      </div>
                    )}
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

        {clickMode !== "none" && (
          <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-slate-900/90 border border-slate-800 px-6 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-bounce flex items-center gap-2">
            <Compass className="h-4 w-4 text-blue-400 animate-spin" />
            <span>{clickMode === "start" ? "Klik titik di peta untuk memilih Titik Awal" : clickMode === "dest" ? "Klik titik di peta untuk memilih Destinasi" : "Klik titik di peta untuk lokasi Laporan"}</span>
            <button onClick={() => setClickMode("none")} className="ml-2 rounded-full bg-white/20 hover:bg-white/30 px-2 py-0.5 text-[10px]">Batal</button>
          </div>
        )}

        {/* Mobile Top Floating Origin & Destination Card (Image 1 top UI style) */}
        {!isMobileSearchOpen && (
          <div className="md:hidden absolute left-3 right-3 top-3 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-3 shadow-xl border border-slate-200/80 animate-fade-in flex items-center justify-between gap-2">
            <div
              onClick={() => {
                setIsMobileSearchOpen(true);
                setActiveInputFocus("dest");
              }}
              className="flex-1 cursor-pointer flex flex-col gap-1 min-w-0"
            >
              {/* Origin row */}
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-emerald-200 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {startPoint ? startPoint.name.split(",")[0] : startInput ? startInput.split(",")[0] : "Lokasi Anda (Titik Awal)"}
                </span>
              </div>
              <div className="ml-1.5 h-2 w-0 border-l border-dashed border-slate-300" />
              {/* Destination row */}
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500 border-2 border-amber-200 shrink-0" />
                <span className="text-xs font-extrabold text-slate-900 truncate">
                  {destPoint ? destPoint.name.split(",")[0] : destInput ? destInput.split(",")[0] : "Cari Tujuan Anda..."}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwapPoints();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                title="Tukar Awal & Tujuan"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsMobileSearchOpen(true);
                  setActiveInputFocus("dest");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition"
                title="Cari / Ubah Rute"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Floating Back Button (Image 1 UI style) */}
        {isNavigating && !isMobileSearchOpen && (
          <button
            onClick={handleResetRoute}
            className="md:hidden absolute left-4 top-24 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl border border-slate-700 hover:bg-slate-800 active:scale-95 transition"
            title="Kembali ke Pencarian"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Mobile Search Overlay Modal (Image 2 UI style) */}
        {isMobileSearchOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-xl p-4 text-white animate-fade-in overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-sm font-extrabold text-white tracking-wide">Mau ke mana hari ini?</h2>
              <div className="w-9" />
            </div>

            {/* Input Container (Image 2 style) */}
            <div className="mt-4 rounded-2xl bg-slate-900 border border-slate-800 p-3.5 shadow-2xl flex items-center gap-3">
              {/* Left dots connector */}
              <div className="flex flex-col items-center justify-between py-1 self-stretch">
                <span className="h-4 w-4 rounded-full bg-emerald-500 border-2 border-emerald-300 shrink-0 flex items-center justify-center text-[9px] font-black text-white">
                  A
                </span>
                <span className="w-0.5 flex-1 border-l-2 border-dotted border-slate-600 my-1" />
                <span className="h-4 w-4 rounded-full bg-amber-500 border-2 border-amber-300 shrink-0 flex items-center justify-center text-[9px] font-black text-white">
                  B
                </span>
              </div>

              {/* Input Fields */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                {/* Start input */}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Pilih lokasi awal..."
                    value={startInput}
                    onFocus={() => setActiveInputFocus("start")}
                    onChange={(e) => {
                      setStartInput(e.target.value);
                      fetchSuggestions(e.target.value, setStartSuggestions);
                    }}
                    className={`w-full rounded-xl bg-slate-800/90 border py-2 pl-3 pr-7 text-xs font-semibold text-white outline-none transition ${
                      activeInputFocus === "start" ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-700/80"
                    }`}
                  />
                  {startInput && (
                    <button
                      onClick={() => {
                        setStartInput("");
                        setStartPoint(null);
                        setStartSuggestions([]);
                      }}
                      className="absolute right-2 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="h-px bg-slate-800" />

                {/* Dest input */}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Cari lokasi tujuan..."
                    value={destInput}
                    autoFocus
                    onFocus={() => setActiveInputFocus("dest")}
                    onChange={(e) => {
                      setDestInput(e.target.value);
                      fetchSuggestions(e.target.value, setDestSuggestions);
                    }}
                    className={`w-full rounded-xl bg-slate-800/90 border py-2 pl-3 pr-7 text-xs font-semibold text-white outline-none transition ${
                      activeInputFocus === "dest" ? "border-amber-500 ring-1 ring-amber-500" : "border-slate-700/80"
                    }`}
                  />
                  {destInput && (
                    <button
                      onClick={() => {
                        setDestInput("");
                        setDestPoint(null);
                        setDestSuggestions([]);
                      }}
                      className="absolute right-2 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons (Image 2 style) */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setClickMode(activeInputFocus);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 py-2.5 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>Pilih lewat peta</span>
              </button>
              <button
                onClick={() => {
                  handleLocateUser();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 py-2.5 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
              >
                <Locate className="h-3.5 w-3.5 text-blue-400" />
                <span>Lokasi Saya</span>
              </button>
            </div>

            {/* Suggestions List (Image 2 style) */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {activeInputFocus === "start" ? "Saran Titik Awal" : "Saran Lokasi Tujuan"}
              </p>

              {(activeInputFocus === "start" ? startSuggestions : destSuggestions).length > 0 ? (
                (activeInputFocus === "start" ? startSuggestions : destSuggestions).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const selectedPt = {
                        name: item.display_name,
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon),
                      };
                      if (activeInputFocus === "start") {
                        setStartPoint(selectedPt);
                        setStartInput(item.display_name);
                        setStartSuggestions([]);
                        if (destPoint) {
                          handleStartNavigation(selectedPt, destPoint);
                        }
                      } else {
                        setDestPoint(selectedPt);
                        setDestInput(item.display_name);
                        setDestSuggestions([]);
                        if (startPoint) {
                          handleStartNavigation(startPoint, selectedPt);
                        }
                      }
                    }}
                    className="w-full text-left rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3 flex items-start gap-3 hover:bg-slate-800 transition"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.display_name.split(",")[0]}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.display_name}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <Search className="h-6 w-6 mx-auto text-slate-600 mb-2 opacity-50" />
                  Ketik nama jalan atau lokasi di Depok...
                </div>
              )}
            </div>

            {/* Calculate Button if both points set */}
            {startPoint && destPoint && (
              <button
                onClick={() => handleStartNavigation()}
                className="mt-3 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-extrabold text-white shadow-lg transition"
              >
                Tampilkan Rute Aman
              </button>
            )}
          </div>
        )}

        {/* Mobile Bottom Sheet Drawer for Route Selection (Image 1 bottom UI style) */}
        {isNavigating && !isMobileSearchOpen && routes.length > 0 && (
          <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 rounded-t-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.15)] p-4 flex flex-col max-h-[60vh] animate-slide-up">
            {/* Grab handle bar */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-3 shrink-0" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">Pilih Rute Perjalanan</h3>
                <p className="text-[10px] text-slate-400">Analisis tingkat keamanan jalur Depok</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {routes.length} Pilihan Rute
              </span>
            </div>

            {/* Route list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {routes.map((r) => {
                const isSelected = r.id === selectedRouteId;
                const isSafest = r.name.includes("Teraman");
                const isFastest = r.name.includes("Tercepat");

                let safetyText = "Terverifikasi Aman";
                let safetyColor = "text-emerald-600";
                if (r.incidents.length > 0) {
                  safetyText = r.incidents.length <= 2 ? "Perlu Waspada" : "Rawan Tinggi";
                  safetyColor = r.incidents.length <= 2 ? "text-amber-600" : "text-rose-600";
                }

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`rounded-2xl border p-3 flex justify-between items-center cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-md"
                        : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${
                            isSafest ? "bg-emerald-500" : isFastest ? "bg-blue-600" : "bg-slate-600"
                          }`}
                        >
                          {r.name}
                        </span>
                        {r.incidents.length > 0 && (
                          <span className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" /> {r.incidents.length} titik rawan
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">{Math.round(r.duration / 60)} mnt</span>
                        <span className="text-xs font-bold text-slate-500">({(r.distance / 1000).toFixed(1)} km)</span>
                      </div>

                      <div className={`mt-1 flex items-center gap-1 text-[10px] font-bold ${safetyColor}`}>
                        <Shield className="h-3 w-3" />
                        <span>{safetyText}</span>
                      </div>
                    </div>

                    {/* Radio indicator */}
                    <div className="ml-3 shrink-0">
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Sticky Action Button */}
            <div className="mt-3 pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => {
                  alert("Navigasi SafeRoute dimulai! Tetap waspada dan ikuti rute di peta.");
                }}
                className="w-full rounded-2xl bg-[#0B2540] hover:bg-[#13315c] py-3.5 px-4 text-xs font-extrabold text-white shadow-xl flex items-center justify-between transition"
              >
                <span>Mulai Navigasi</span>
                <span className="rounded-xl bg-white/20 px-2.5 py-1 text-[11px] font-black">
                  {selectedRouteId && routes.find((r) => r.id === selectedRouteId)
                    ? `${Math.round((routes.find((r) => r.id === selectedRouteId)?.duration || 0) / 60)} mnt`
                    : ""}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Sidebar Panel (Desktop view) */}
        <div className="hidden md:flex absolute left-6 top-6 bottom-6 z-20 w-80 max-w-sm shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-600" />
                  Navigasi Aman
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">Analisis Rute Keamanan Depok</p>
              </div>
              <button
                onClick={() => setIsMobilePanelOpen(false)}
                className="md:hidden flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold transition"
                title="Tutup Panel"
              >
                ✕
              </button>
            </div>

            <div className="relative mt-5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Titik Awal (Lokasi Anda)</label>
              <div className="flex gap-1.5 items-center">
                <div className="relative flex-1">
                  <input type="text" placeholder="Cari lokasi awal..." value={startInput} onChange={(e) => { setStartInput(e.target.value); fetchSuggestions(e.target.value, setStartSuggestions); }} className="w-full rounded-xl bg-slate-50 border border-slate-200/60 py-2.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-colors" />
                  {startInput && (<button onClick={() => { setStartInput(""); setStartPoint(null); setStartSuggestions([]); setRoutes([]); setSelectedRouteId(null); setIsNavigating(false); setMapBounds(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">&times;</button>)}
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
                  {destInput && (<button onClick={() => { setDestInput(""); setDestPoint(null); setDestSuggestions([]); setRoutes([]); setSelectedRouteId(null); setIsNavigating(false); setMapBounds(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">&times;</button>)}
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
              onClick={() => handleStartNavigation()}
              disabled={routeLoading || !startPoint || !destPoint}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B2540] py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#13315c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {routeLoading ? "Menghitung..." : "Mulai Navigasi"}
            </button>

            {isNavigating && !routeLoading && routes.length > 0 && (
              <div className="mt-6 animate-fade-in space-y-3">
                {routes.map((r) => {
                  const isSelected = r.id === selectedRouteId;
                  const isSafest = r.name.includes("Teraman");
                  const isFastest = r.name.includes("Tercepat");
                  const isShortest = r.name.includes("Terpendek");
                  
                  let borderClass = isSelected 
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-md" 
                    : "border-slate-100 bg-white hover:bg-slate-50";
                  
                  let safetyText = "Terverifikasi Aman";
                  let safetyColor = "text-emerald-600";
                  if (r.incidents.length > 0) {
                    if (r.incidents.length <= 2) {
                      safetyText = "Perlu Waspada";
                      safetyColor = "text-amber-600";
                    } else {
                      safetyText = "Rawan Tinggi";
                      safetyColor = "text-rose-600";
                    }
                  }

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRouteId(r.id)}
                      className={`rounded-xl border p-3 flex justify-between items-center shadow-sm cursor-pointer transition-all duration-200 ${borderClass}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white ${
                            isSafest ? "bg-emerald-500" : isFastest ? "bg-blue-600" : isShortest ? "bg-amber-500" : "bg-slate-500"
                          }`}>
                            {r.name}
                          </span>
                          {r.incidents.length > 0 && (
                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" /> {r.incidents.length} Insiden
                            </span>
                          )}
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-xl font-black text-slate-900">{(r.distance / 1000).toFixed(1)}</span>
                          <span className="text-[10px] text-slate-500 font-semibold mb-1">km</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 truncate">
                          Via {startPoint?.name.split(',')[0]}
                        </p>
                        <span className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${safetyColor}`}>
                          <Shield className="h-3 w-3" />
                          {safetyText}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-end justify-end gap-1">
                          <span className="text-xl font-black text-slate-900">{Math.round(r.duration / 60)}</span>
                          <span className="text-[10px] text-slate-500 font-semibold mb-1">mnt</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Perjalanan</p>
                      </div>
                    </div>
                  );
                })}

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
                      <span>Tidak ada titik kejahatan terdeteksi di jalur ini!</span>
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
                <button onClick={handleLocateUser} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 px-4 py-2 text-xs font-bold text-blue-600 transition-colors shadow-sm"> Gunakan Lokasi GPS Saya
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0 bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wider uppercase">
          </div>
        </div>
      </div>

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