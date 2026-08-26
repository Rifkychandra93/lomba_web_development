import React from "react";
import Link from "next/link";
import { Search, User } from "lucide-react";

export function RouteIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#0B2540]">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M6 9c0 3 12 3 12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar({ activePage }: { activePage?: "peta" | "lapor" | "chat" }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6 bg-white">
      <div className="flex items-center gap-3">
        <RouteIcon />
        <span className="text-xl font-bold tracking-tight text-[#0B2540]">
          SafeRoute
        </span>
      </div>

      <nav className="flex h-full items-center gap-8">
        <div className="relative flex h-full items-center">
          <Link href="/home" className={`text-sm hover:text-gray-900 ${activePage === "peta" ? "text-[#0B2540] font-bold" : "text-gray-500 font-medium"}`}>
            Peta
          </Link>
          {activePage === "peta" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B2540]" />}
        </div>
        
        <div className="relative flex h-full items-center">
          <Link href="/lapor" className={`text-sm hover:text-gray-900 ${activePage === "lapor" ? "text-[#0B2540] font-bold" : "text-gray-500 font-medium"}`}>
            Lapor
          </Link>
          {activePage === "lapor" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B2540]" />}
        </div>
        
        <div className="relative flex h-full items-center">
          <Link href="/chat" className={`text-sm hover:text-gray-900 ${activePage === "chat" ? "text-[#0B2540] font-bold" : "text-gray-500 font-medium"}`}>
            Chat
          </Link>
          {activePage === "chat" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B2540]" />}
        </div>
      </nav>

      <div className="flex items-center gap-5">
        <button className="text-gray-500 hover:text-gray-900">
          <Search className="h-5 w-5" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
