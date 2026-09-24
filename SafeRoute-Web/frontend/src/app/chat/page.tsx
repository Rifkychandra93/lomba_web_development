"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { ChatSidebar } from "@/src/components/chat/ChatSidebar";
import { ChatArea } from "@/src/components/chat/ChatArea";
import {
  PoliceStation,
  fetchNearbyPoliceFromOSM,
  isInsideDepok,
  DEPOK_CENTER_LAT,
  DEPOK_CENTER_LNG,
} from "@/src/services/policeStation.service";

const DEFAULT_LOCATION_NAME = "Margonda, Depok, Jawa Barat";

export default function ChatPage() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  }>({
    lat: DEPOK_CENTER_LAT,
    lng: DEPOK_CENTER_LNG,
    name: DEFAULT_LOCATION_NAME,
  });

  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<PoliceStation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadNearbyStations = async (lat: number, lng: number) => {
    setLoading(true);

    // Validate location coordinates; if outside Depok, anchor strictly to Depok Center
    let targetLat = lat;
    let targetLng = lng;
    if (!isInsideDepok(targetLat, targetLng)) {
      targetLat = DEPOK_CENTER_LAT;
      targetLng = DEPOK_CENTER_LNG;
    }

    try {
      let placeName = DEFAULT_LOCATION_NAME;
      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}`,
          { headers: { "User-Agent": "SafeRoute-Depok/1.0" } }
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

      setUserLocation({ lat: targetLat, lng: targetLng, name: placeName });

      const data = await fetchNearbyPoliceFromOSM(targetLat, targetLng);
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
          // Check if GPS is inside Depok bounds
          if (isInsideDepok(latitude, longitude)) {
            loadNearbyStations(latitude, longitude);
          } else {
            // Outside Depok, clamp to Depok Center for SafeRoute project scale
            loadNearbyStations(DEPOK_CENTER_LAT, DEPOK_CENTER_LNG);
          }
        },
        (error) => {
          console.warn("Geolocation error/denied, using Depok center location:", error.message);
          loadNearbyStations(DEPOK_CENTER_LAT, DEPOK_CENTER_LNG);
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      loadNearbyStations(DEPOK_CENTER_LAT, DEPOK_CENTER_LNG);
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


