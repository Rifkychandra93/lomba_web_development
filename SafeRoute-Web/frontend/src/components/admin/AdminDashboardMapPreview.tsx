"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapIncidents } from "@/src/services/incident.service";

interface MapPoint {
  id: string;
  sourceType: "ML_CRAWLER" | "USER_REPORT";
  title: string;
  latitude: number;
  longitude: number;
  incidentType: string;
  riskLevel: string;
}

const DEPOK_CENTER: [number, number] = [-6.390, 106.825];

export default function AdminDashboardMapPreview() {
  const [incidents, setIncidents] = useState<MapPoint[]>([]);
  const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await getMapIncidents();
        if (res.success && res.data) {
          setIncidents(res.data as MapPoint[]);
        }
      } catch (e) {
        console.error("Gagal mengambil data peta:", e);
      }
    };
    fetchIncidents();
  }, []);

  const createCustomIcon = (type: string, riskLevel: string) => {
    let color = "bg-blue-600";
    if (riskLevel === "CRITICAL") color = "bg-rose-600";
    else if (riskLevel === "HIGH") color = "bg-orange-500";
    else if (riskLevel === "MEDIUM") color = "bg-amber-500";
    else if (riskLevel === "LOW") color = "bg-emerald-500";

    return L.divIcon({
      html: `<div class="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)] ${color}"></div>`,
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  return (
    <div className="w-full h-full relative bg-[#091527]">
      <MapContainer
        center={DEPOK_CENTER}
        zoom={12}
        className="h-full w-full z-0"
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
      >
        <TileLayer attribution="" url={tileLayerUrl} />
        {incidents.map((inc) => (
          <Marker 
            key={inc.id} 
            position={[inc.latitude, inc.longitude]} 
            icon={createCustomIcon(inc.incidentType, inc.riskLevel)}
          />
        ))}
      </MapContainer>
      
      {/* Overlay gradient to make it look integrated */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#091527]/40 to-transparent z-[100]" />
    </div>
  );
}
