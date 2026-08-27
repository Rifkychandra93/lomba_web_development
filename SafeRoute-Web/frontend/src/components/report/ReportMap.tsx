"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, X } from "lucide-react";

interface ReportMapProps {
  lat: number | null;
  lng: number | null;
  address?: string;
  onMapClick: (lat: number, lng: number) => void;
}

const DEPOK_BOUNDS: L.LatLngBoundsExpression = L.latLngBounds(
  [-6.33, 106.75],
  [-6.45, 106.90]
);
const DEPOK_MAX_ZOOM = 16;
const DEPOK_MIN_ZOOM = 12;
const DEPOK_CENTER: [number, number] = [-6.390, 106.825];

const selectedIcon = L.divIcon({
  html: `
    <div class="relative">
      <div class="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div class="bg-[#0B2540] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
          Lokasi Kejadian
        </div>
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#0B2540]"></div>
      </div>
      <div class="w-8 h-8 bg-[#0B2540] border-4 border-white rounded-full shadow-xl flex items-center justify-center animate-bounce">
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const defaultIcon = L.divIcon({
  html: `<div class="w-6 h-6 bg-[#0B2540] border-2 border-white rounded-full shadow-md"></div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [map, center, zoom]);
  return null;
}

function MapClickHandler({
  onMapClick,
  setShowWarning,
}: {
  onMapClick: (lat: number, lng: number) => void;
  setShowWarning: (show: boolean) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      
      if (lat < -6.45 || lat > -6.33 || lng < 106.75 || lng > 106.90) {
        setShowWarning(true);
        return;
      }
      
      onMapClick(lat, lng);
    },
  });
  return null;
}

export default function ReportMap({ lat, lng, address, onMapClick }: ReportMapProps) {
  const [showWarning, setShowWarning] = useState(false);
  
  const mapCenter: [number, number] = lat !== null && lng !== null ? [lat, lng] : DEPOK_CENTER;
  const mapZoom = lat !== null ? 16 : 13;

  return (
    <>
      <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-neutral-200">

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
          style={{ cursor: "crosshair" }}
          maxBounds={DEPOK_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={DEPOK_MIN_ZOOM}
          maxZoom={DEPOK_MAX_ZOOM}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <MapController center={mapCenter} zoom={mapZoom} />
          
          <MapClickHandler 
            onMapClick={onMapClick} 
            setShowWarning={setShowWarning}
          />

          {lat !== null && lng !== null && (
            <Marker position={[lat, lng]} icon={selectedIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-[#0B2540]">Lokasi Terpilih</p>
                  {address && <p className="text-neutral-500 mt-0.5">{address}</p>}
                  <p className="text-neutral-400 mt-1 font-mono text-[10px]">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowWarning(false)}
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
                Silakan pilih lokasi lain yang masih berada di dalam area Depok.
              </p>
              
              <button
                onClick={() => setShowWarning(false)}
                className="mt-5 w-full rounded-xl bg-[#0B2540] py-2.5 text-sm font-bold text-white hover:bg-[#13315c] transition-colors shadow-lg shadow-blue-900/10"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}