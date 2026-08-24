"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MapComponent = dynamic(
  () => import("@/src/components/map/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 animate-bounce shadow-md shadow-blue-500/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-blue-600">
            <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.5" />
            <path d="M6 9c0 3 12 3 12 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-700 tracking-tight">Memuat Peta SafeRoute...</p>
        <p className="mt-1 text-xs text-slate-400 font-semibold">Menyiapkan modul navigasi aman...</p>
      </div>
    ),
  }
);

export default function HomePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        <p className="mt-4 text-xs font-semibold text-slate-500">Memeriksa autentikasi...</p>
      </div>
    );
  }

  return <MapComponent />;
}