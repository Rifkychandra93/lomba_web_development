"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  Paperclip,
  Send,
  Shield,
  PhoneCall,
  MapPin,
  AlertTriangle,
  Radio,
  CheckCheck,
  Building2,
  Navigation,
  ChevronLeft,
} from "lucide-react";
import { PoliceStation } from "@/src/services/policeStation.service";

interface ChatMessage {
  id: string;
  sender: "user" | "station";
  text: string;
  timestamp: string;
  locationAttachment?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface ChatAreaProps {
  selectedStation: PoliceStation | null;
  userLocation: { lat: number; lng: number; name: string } | null;
  onBack?: () => void;
}

export function ChatArea({ selectedStation, userLocation, onBack }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // When selected station changes, load dynamic greeting message
  useEffect(() => {
    if (!selectedStation) return;

    const initialGreeting: ChatMessage = {
      id: `init-${selectedStation.id}`,
      sender: "station",
      text: `Selamat datang di Pusat Layanan Siaga Darurat SafeRoute — ${selectedStation.name}.\n\nKami mendeteksi lokasi Anda berjarak sekitar ${selectedStation.distanceKm} km dari pos/markas kami (${selectedStation.address}). Apakah ada kejadian darurat atau bantuan keamanan yang Anda perlukan saat ini?`,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([initialGreeting]);
  }, [selectedStation]);

  const handleSendMessage = (customText?: string, locationAttach?: ChatMessage["locationAttachment"]) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() && !locationAttach) return;

    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: timeStr,
      locationAttachment: locationAttach,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage("");

    // Simulate automated station response after 1.2s
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      let responseText = `Laporan Anda telah diterima oleh Petugas Piket ${selectedStation?.name || "Polres/Polsek"}. Tim siaga sedang memverifikasi koordinat dan siap diterjunkan jika diperlukan.`;
      
      if (locationAttach) {
        responseText = `📌 Koordinat presisi GPS Anda [${locationAttach.lat.toFixed(5)}, ${locationAttach.lng.toFixed(5)}] (${locationAttach.address}) berhasil dipancarkan ke Sistem Komando ${selectedStation?.name}. Tetap di posisi aman!`;
      } else if (textToSend.toLowerCase().includes("darurat") || textToSend.toLowerCase().includes("lapor")) {
        responseText = `🚨 Status LAPORAN DARURAT diaktifkan untuk lokasi Anda. Bila memerlukan tindakan darurat langsung, tekan tombol Call Center 110 di atas. Petugas patroli terdekat (${selectedStation?.distanceKm} km) telah dikabarkan.`;
      }

      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: "station",
        text: responseText,
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, replyMsg]);
    }, 1200);
  };

  const handleShareLocation = () => {
    if (!userLocation) return;
    handleSendMessage(`[GPS LIVE] Membagikan lokasi saya kepada ${selectedStation?.name}`, {
      lat: userLocation.lat,
      lng: userLocation.lng,
      address: userLocation.name,
    });
  };

  if (!selectedStation) {
    return (
      <section className="flex flex-1 items-center justify-center bg-white p-8 text-center h-full">
        <div className="max-w-sm space-y-3">
          <Shield className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            Pilih Kantor Polisi Terdekat
          </h3>
          <p className="text-xs text-slate-500">
            Silakan pilih pos polisi atau polsek dari daftar untuk memulai kontak darurat berbasis lokasi OpenStreetMap.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col bg-white h-full overflow-hidden w-full">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3 bg-white shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0 transition"
              title="Kembali ke Daftar Pos Polisi"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="relative shrink-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              {selectedStation.type === "Polres" ? (
                <Building2 className="h-5 w-5" />
              ) : selectedStation.type === "Polsek" ? (
                <Shield className="h-5 w-5" />
              ) : (
                <Radio className="h-5 w-5" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {selectedStation.name}
              </h2>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-700 border border-blue-200 shrink-0">
                {selectedStation.type}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium truncate">
              <span className="flex items-center gap-0.5 text-emerald-600 font-bold shrink-0">
                <MapPin className="h-3 w-3" />
                {selectedStation.distanceKm} km
              </span>
              <span>•</span>
              <span className="text-slate-600 truncate">{selectedStation.address}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a
            href={`tel:${selectedStation.phone.replace(/[^0-9]/g, "") || "110"}`}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Telepon 110</span>
          </a>
          <button
            onClick={handleShareLocation}
            className="flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition"
          >
            <Navigation className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Kirim GPS</span>
          </button>
        </div>
      </header>


      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
        <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
          {/* Top Location Info Box */}
          <div className="text-center my-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-500">
              <Shield className="h-3 w-3 text-blue-600" />
              Terkoneksi langsung ke pos siaga {selectedStation.name} via OSM
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.sender === "station" ? (
                <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
                  <span className="text-[10px] font-bold text-slate-400 ml-1 mb-1">
                    {selectedStation.name} • {msg.timestamp}
                  </span>
                  <div className="rounded-2xl rounded-tl-xs bg-white border border-slate-200 p-4 text-xs leading-relaxed text-slate-800 shadow-2xs whitespace-pre-line font-medium">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 mr-1 mb-1">
                    Anda • {msg.timestamp}
                  </span>
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-blue-600 p-4 text-xs leading-relaxed text-white shadow-sm font-medium">
                    <p>{msg.text}</p>
                    {msg.locationAttachment && (
                      <div className="mt-2 rounded-xl bg-blue-700/80 border border-blue-500 p-2.5 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <MapPin className="h-3.5 w-3.5" />
                          Koordinat GPS Berhasil Dikirim
                        </div>
                        <p className="mt-1 text-blue-100 text-[10px]">
                          {msg.locationAttachment.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pt-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-[10px]">
                OSM
              </div>
              <span className="animate-pulse">{selectedStation.name} sedang mengetik balasan...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Action Pills & Input Box */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-4 px-6 space-y-3">
        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => handleSendMessage("🚨 LAPORAN DARURAT: Saya membutuhkan bantuan keamanan segera di titik lokasi saya!")}
            className="rounded-full bg-rose-50 border border-rose-200 px-4 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition whitespace-nowrap flex items-center gap-1.5 shrink-0"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Lapor Kejadian Darurat
          </button>
          <button
            onClick={handleShareLocation}
            className="rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition whitespace-nowrap flex items-center gap-1.5 shrink-0"
          >
            <MapPin className="h-3.5 w-3.5" />
            Kirim Koordinat GPS Live
          </button>
          <button
            onClick={() => handleSendMessage("Apakah ada unit patroli yang sedang bertugas di sekitar jalan ini?")}
            className="rounded-full bg-slate-100 border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition whitespace-nowrap shrink-0"
          >
            Cek Posisi Patroli
          </button>
        </div>

        {/* Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white transition border border-transparent focus-within:border-slate-200"
        >
          <button
            type="button"
            onClick={handleShareLocation}
            className="text-slate-400 hover:text-blue-600 transition shrink-0"
            title="Kirim Lokasi"
          >
            <MapPin className="h-5 w-5" />
          </button>
          <input
            type="text"
            placeholder={`Ketik pesan darurat ke ${selectedStation.name}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 bg-transparent py-1 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 shadow-sm"
          >
            <Send className="h-4 w-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </section>
  );
}

