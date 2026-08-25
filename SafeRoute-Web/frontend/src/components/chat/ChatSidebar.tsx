import React from "react";
import { Search } from "lucide-react";

export function ChatSidebar() {
  return (
    <aside className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col w-[320px] bg-white">
      <div className="px-5 py-4">
        <h2 className="text-lg font-bold text-gray-900">Messages</h2>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
          <Search className="h-4 w-4 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Active Conversation */}
        <div className="flex cursor-pointer items-start gap-3 bg-[#EEF2FF] px-5 py-4 border-l-4 border-[#1D4ED8]">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D4ED8] text-sm font-bold text-white">
              AS
            </div>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#EEF2FF] bg-green-500"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="truncate text-sm font-semibold text-gray-900">
                Admin Support
              </h3>
              <span className="text-xs text-[#1D4ED8] font-medium">Just now</span>
            </div>
            <p className="mt-1 truncate text-xs text-gray-700">
              Kami sedang mengecek status laporan Anda.
            </p>
          </div>
        </div>

        {/* Inactive Conversation */}
        <div className="flex cursor-pointer items-start gap-3 px-5 py-4 hover:bg-gray-50 transition border-l-4 border-transparent">
          <div className="relative shrink-0">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="Avatar"
              className="h-10 w-10 rounded-full bg-gray-200 object-cover border border-gray-200"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="truncate text-sm font-medium text-gray-900">
                Petugas Lapangan
              </h3>
              <span className="text-xs text-gray-400">Yesterday</span>
            </div>
            <p className="mt-1 truncate text-xs text-gray-500">
              Perbaikan lampu jalan di Jl. Thamrin selesai.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
