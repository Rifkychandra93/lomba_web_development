"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ReportMapProps {
  lat: number | null;
  lng: number | null;
  address?: string;
  onMapClick: (lat: number, lng: number) => void;
}

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

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ReportMap({ lat, lng, address, onMapClick }: ReportMapProps) {
  const defaultCenter: [number, number] = [-6.2088, 106.8456];
  const defaultZoom = 13;

  const mapCenter: [number, number] = lat !== null && lng !== null ? [lat, lng] : defaultCenter;

  return (
    <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-neutral-200">
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md">
        <p className="text-[10px] font-bold text-[#0B2540] uppercase tracking-wider">
          Klik Peta untuk Pilih Lokasi
        </p>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={lat !== null ? 16 : defaultZoom}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
        style={{ cursor: "crosshair" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapClickHandler onMapClick={onMapClick} />

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

      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-[#0B2540]/90 backdrop-blur-sm rounded-lg px-3 py-2">
        <p className="text-[10px] text-white/90 font-medium text-center">
          {lat !== null && lng !== null
            ? "Lokasi sudah dipilih. Klik lagi untuk mengubah."
            : "Klik pada peta untuk menandai titik kejadian"}
        </p>
      </div>
    </div>
  );
}