"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Shield,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  Info
} from "lucide-react";
import { getMapIncidents } from "@/src/services/incident.service";

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
  status?: string; // Additional field for admin verification
}

const DEPOK_CENTER: [number, number] = [-6.390, 106.825];
const DEPOK_BOUNDS: L.LatLngBoundsExpression = L.latLngBounds(
  [-6.33, 106.75],
  [-6.45, 106.90]
);

function MapController({ center, zoom, bounds }: { center?: [number, number]; zoom?: number; bounds?: L.LatLngBoundsExpression | null; }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 1 });
    }
  }, [map, center, zoom, bounds]);
  return null;
}

export default function AdminRiskMap() {
  const [incidents, setIncidents] = useState<MapPoint[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<MapPoint | null>(null);

  // Fallback to standard OSM but use CSS to make it look dark
  const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await getMapIncidents();
        if (res.success && res.data) {
          // Simulation of additional admin data (status)
          const dataWithStatus = (res.data as MapPoint[]).map(inc => ({
            ...inc,
            status: inc.sourceType === "USER_REPORT" ? "PENDING" : "VERIFIED"
          }));
          setIncidents(dataWithStatus);
        }
      } catch (e) {
        console.error("Gagal mengambil data peta:", e);
      }
    };
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

  const handleVerify = (id: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: "VERIFIED" } : inc));
    if (selectedIncident?.id === id) {
      setSelectedIncident(prev => prev ? { ...prev, status: "VERIFIED" } : null);
    }
  };

  const handleResolve = (id: string) => {
    setIncidents(prev => prev.filter(inc => inc.id !== id));
    setSelectedIncident(null);
  };

  return (
    <div className="flex h-full w-full relative bg-[#091527] overflow-hidden rounded-xl border border-slate-800">
      
      {/* Map Area */}
      <div className={`transition-all duration-300 h-full ${selectedIncident ? 'w-[calc(100%-350px)]' : 'w-full'}`}>
        <MapContainer
          center={DEPOK_CENTER}
          zoom={13}
          className="h-full w-full z-0"
          zoomControl={true}
          maxBounds={DEPOK_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={12}
          maxZoom={16}
        >
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url={tileLayerUrl} />
          
          {selectedIncident && (
            <MapController center={[selectedIncident.latitude, selectedIncident.longitude]} zoom={15} />
          )}

          {incidents.map((inc) => (
            <Marker 
              key={inc.id} 
              position={[inc.latitude, inc.longitude]} 
              icon={createCustomIcon(inc.incidentType, inc.riskLevel)}
              eventHandlers={{
                click: () => setSelectedIncident(inc),
              }}
            >
              {/* Optional small popup on hover, but click opens the side panel */}
            </Marker>
          ))}
        </MapContainer>

        {/* Legend Panel */}
        <div className="absolute bottom-6 left-6 z-[400] bg-white rounded-xl shadow-xl p-4 w-48 border border-slate-200">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Keterangan</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600"></span>
              <span className="text-xs font-semibold text-slate-700">Risiko Tinggi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-xs font-semibold text-slate-700">Risiko Sedang</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-slate-700">Aman / Terselesaikan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Panel - Detail Titik Risiko */}
      {selectedIncident && (
        <div className="w-[350px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col absolute right-0 top-0 z-[500] transition-transform duration-300">
          
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Detail Titik Risiko</h3>
            <button onClick={() => setSelectedIncident(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Header / Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1
                ${selectedIncident.riskLevel === "CRITICAL" || selectedIncident.riskLevel === "HIGH" ? "bg-rose-600" : 
                  selectedIncident.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-75"></span>
                {selectedIncident.riskLevel === "CRITICAL" ? "Risiko Kritis" : 
                 selectedIncident.riskLevel === "HIGH" ? "Risiko Tinggi" : 
                 selectedIncident.riskLevel === "MEDIUM" ? "Risiko Sedang" : "Aman"}
              </span>
              
              {selectedIncident.status === "VERIFIED" && (
                <span className="px-2 py-1 rounded-md text-[10px] font-bold text-blue-700 bg-blue-100 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Terverifikasi
                </span>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1">{selectedIncident.title}</h2>
            <p className="text-xs font-medium text-slate-500 flex items-start gap-1.5 mb-6">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {selectedIncident.address || "Lokasi tidak diketahui"}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1">Waktu Dilaporkan</p>
                <p className="text-xs font-semibold text-slate-800">
                  {new Date(selectedIncident.detectedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB<br/>
                  <span className="text-[10px] font-medium text-slate-500">{new Date(selectedIncident.detectedAt).toLocaleDateString("id-ID")}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1">Sumber</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedIncident.sourceType === 'ML_CRAWLER' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Shield className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {selectedIncident.sourceType === 'ML_CRAWLER' ? "AI Crawler" : "Laporan Warga"}
                    {selectedIncident.reporterName && <><br/><span className="text-[9px] text-slate-500 font-medium">{selectedIncident.reporterName}</span></>}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Deskripsi Kejadian</p>
              <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                {selectedIncident.description || "Tidak ada deskripsi detail untuk insiden ini."}
              </p>
            </div>

            {selectedIncident.imageUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                <img src={selectedIncident.imageUrl} alt="Bukti" className="w-full h-32 object-cover" />
              </div>
            )}

            {/* Mock Related Reports Section */}
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase">Laporan Terkait di Lokasi Ini (1)</p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Aktivitas Mencurigakan</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5">Kemarin, 22:10 WIB</p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-100 flex items-center gap-2 bg-slate-50">
            <button 
              onClick={() => handleVerify(selectedIncident.id)}
              disabled={selectedIncident.status === "VERIFIED"}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              {selectedIncident.status === "VERIFIED" ? "Terverifikasi" : "Verifikasi"}
            </button>
            <button 
              onClick={() => handleResolve(selectedIncident.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Tandai Selesai
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
