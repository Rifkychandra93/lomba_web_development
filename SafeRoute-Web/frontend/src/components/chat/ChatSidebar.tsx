"use client";

import React, { useState } from "react";
import { Search, MapPin, Radio, Building2, RefreshCw, AlertCircle } from "lucide-react";
import { PoliceStation } from "@/src/services/policeStation.service";

interface ChatSidebarProps {
  stations: PoliceStation[];
  selectedStationId: string | null;
  onSelectStation: (station: PoliceStation) => void;
  userLocationName: string;
  loading: boolean;
  onRefreshLocation: () => void;
}

export function ChatSidebar({
  stations,
  selectedStationId,
  onSelectStation,
  userLocationName,
  loading,
  onRefreshLocation,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "Polsek" | "Polres" | "Pos Polisi">("ALL");

  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "ALL" || st.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStationIcon = (type: string) => {
    switch (type) {
      case "Polres":
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case "Polsek":
        return;
      default:
        return <Radio className="h-5 w-5 text-cyan-600" />;
    }
  };

  return (
    <aside className="w-80 md:w-96 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white h-full">
      {/* Sidebar Header & User Location Banner */}
      <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              SafeRoute 
            </h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Pos Polisi & Polsek Terdekat
            </p>
          </div>
        </div>

        {/* Location badge */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50/80 border border-blue-100 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700 truncate">
              Lokasi: <strong className="text-slate-900">{userLocationName}</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
            GPS Aktif
          </span>
        </div>

        {/* Search Input */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari Polsek / Polres terdekat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {(["ALL", "Polsek", "Polres", "Pos Polisi"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {filter === "ALL" ? "Semua Terdekat" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Police Station Card List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
              Mencari pos polisi terdekat
            </p>
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Tidak Ada Pos Polisi Ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Coba ganti kata kunci atau perbarui lokasi GPS Anda.
            </p>
          </div>
        ) : (
          filteredStations.map((station) => {
            const isSelected = selectedStationId === station.id;
            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`group relative flex cursor-pointer items-start gap-3 px-5 py-4 transition-all border-l-4 ${
                  isSelected
                    ? "bg-blue-50/70 border-blue-600"
                    : "bg-white border-transparent hover:bg-slate-50"
                }`}
              >
                {/* Station Icon / Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                        : "bg-slate-100 border-slate-200 text-slate-700 group-hover:border-blue-300 group-hover:bg-blue-50"
                    }`}
                  >
                    {getStationIcon(station.type)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow-2xs" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className={`truncate text-xs font-extrabold ${
                        isSelected ? "text-blue-950" : "text-slate-900 group-hover:text-blue-700"
                      }`}
                    >
                      {station.name}
                    </h3>
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                      <MapPin className="h-2.5 w-2.5" />
                      {station.distanceKm} km
                    </span>
                  </div>

                  <p className="mt-1 truncate text-[11px] text-slate-500 font-medium">
                    {station.address}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded ${
                        station.type === "Polres"
                          ? "bg-blue-100 text-blue-800"
                          : station.type === "Polsek"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {station.type}
                    </span>
                    <span className="text-slate-400 font-medium">
                      📞 {station.phone}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

