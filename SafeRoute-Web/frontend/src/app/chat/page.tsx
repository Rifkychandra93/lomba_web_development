"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { ChatSidebar } from "@/src/components/chat/ChatSidebar";
import { ChatArea } from "@/src/components/chat/ChatArea";
import {
  PoliceStation,
  fetchNearbyPoliceFromOSM,
} from "@/src/services/policeStation.service";

const DEFAULT_LAT = -6.390;
const DEFAULT_LNG = 106.825;
const DEFAULT_LOCATION_NAME = "Depok, Jawa Barat";

export default function ChatPage() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    name: DEFAULT_LOCATION_NAME,
  });

  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<PoliceStation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadNearbyStations = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      let placeName = DEFAULT_LOCATION_NAME;
      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { "User-Agent": "SafeRoute-App/1.0" } }
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          if (revData && revData.display_name) {
            const parts = revData.display_name.split(",");
            placeName = parts.slice(0, 2).join(",").trim();
          }
        }
      } catch (e) {
        console.warn("Reverse geocode failed:", e);
      }

      setUserLocation({ lat, lng, name: placeName });

      const data = await fetchNearbyPoliceFromOSM(lat, lng);
      setStations(data);

      if (data.length > 0) {
        setSelectedStation(data[0]);
      }
    } catch (err) {
      console.error("Gagal memuat pos polisi terdekat:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocationAndFetch = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          loadNearbyStations(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation error/denied, using default location:", error.message);
          loadNearbyStations(DEFAULT_LAT, DEFAULT_LNG);
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      loadNearbyStations(DEFAULT_LAT, DEFAULT_LNG);
    }
  };

  useEffect(() => {
    getUserLocationAndFetch();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden text-slate-900 font-sans">
      <Navbar activePage="chat" />
      <main className="flex flex-1 overflow-hidden">
        <ChatSidebar
          stations={stations}
          selectedStationId={selectedStation?.id || null}
          onSelectStation={(station) => setSelectedStation(station)}
          userLocationName={userLocation.name}
          loading={loading}
          onRefreshLocation={getUserLocationAndFetch}
        />
        <ChatArea
          selectedStation={selectedStation}
          userLocation={userLocation}
        />
      </main>
      <Footer />
    </div>
  );
}

