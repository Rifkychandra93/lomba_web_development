import React from "react";
import { MoreVertical, Paperclip, Send } from "lucide-react";

export function ChatArea() {
  return (
    <section className="flex flex-1 flex-col bg-white">
      {/* Chat Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D4ED8] text-sm font-bold text-white">
              AS
            </div>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"></div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Admin Support</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Typically replies in under 5 minutes
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <div className="flex flex-col space-y-5">
          <div className="text-center w-full flex justify-end mb-2">
             <span className="text-[11px] font-medium text-gray-400">10:02 AM</span>
          </div>

          {/* Message 1: User */}
          <div className="flex justify-end">
            <div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-[#1D4ED8] px-5 py-3.5 text-[13px] leading-relaxed text-white shadow-sm">
              Selamat pagi, bagaimana status laporan saya mengenai perbaikan lampu jalan di Jl. Sudirman?
            </div>
          </div>

          <div className="flex items-center justify-start gap-2 text-[11px] font-medium text-gray-500 mt-6 ml-2">
            Admin Support <span className="text-gray-300 mx-0.5">•</span> 10:03 AM
          </div>

          {/* Message 2: Admin */}
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl rounded-tl-sm bg-[#E0E7FF] px-5 py-3.5 text-[13px] leading-relaxed text-[#0B2540]">
              Selamat pagi! Kami sedang mengecek status laporan Anda. Mohon ditunggu sebentar.
            </div>
          </div>

          {/* Message 3: Admin */}
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-2xl rounded-tl-sm bg-[#E0E7FF] px-5 py-3.5 text-[13px] leading-relaxed text-[#0B2540]">
              Tim kami sudah menjadwalkan perbaikan untuk besok pagi.
            </div>
          </div>

          <div className="text-center w-full flex justify-end mt-4 mb-2">
             <span className="text-[11px] font-medium text-gray-400">10:04 AM</span>
          </div>

          {/* Message 4: User */}
          <div className="flex justify-end">
            <div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-[#1D4ED8] px-5 py-3.5 text-[13px] leading-relaxed text-white shadow-sm">
              Terima kasih informasinya.
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex items-center gap-2 mt-6 text-xs text-gray-400 font-medium">
            <span className="flex gap-1 text-gray-400 text-lg leading-none tracking-widest font-bold">
              ...
            </span>
            Admin Support is typing...
          </div>
        </div>
      </div>

      {/* Chat Input Footer */}
      <div className="shrink-0 border-t border-gray-200 bg-white p-4 px-6">
        <div className="mb-4 flex gap-2">
          <button className="rounded-full bg-[#EEF2FF] px-5 py-1.5 text-xs font-semibold text-[#1D4ED8] hover:bg-blue-100 transition">
            Cek status
          </button>
          <button className="rounded-full bg-[#EEF2FF] px-5 py-1.5 text-xs font-semibold text-[#1D4ED8] hover:bg-blue-100 transition">
            Terima kasih
          </button>
        </div>
        
        <div className="flex items-center gap-3 rounded-xl bg-[#F3F4F6] px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#1D4ED8] focus-within:bg-white transition border border-transparent focus-within:border-gray-200">
          <button className="text-gray-400 hover:text-gray-600 transition shrink-0">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="text"
            placeholder="Ketik pesan..."
            className="flex-1 bg-transparent py-1 text-sm text-gray-900 placeholder-gray-500 outline-none font-medium"
          />
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D4ED8] text-white hover:bg-blue-800 transition shrink-0 shadow-sm">
            <Send className="h-4 w-4 -ml-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
