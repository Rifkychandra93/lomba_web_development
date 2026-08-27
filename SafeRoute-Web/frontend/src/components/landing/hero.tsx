"use client"

import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section id="beranda" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/hero-city.png" alt="City" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2540]/90 via-[#0B2540]/70 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-32 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Temukan Jalur Teraman Untuk Perjalanan Anda.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-300">
            Navigasi cerdas yang tidak hanya mencari jalan tercepat, namun juga jalan teraman berdasarkan data kriminalitas, penerangan jalan, dan laporan warga real-time.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="group flex items-center gap-2 rounded-xl bg-[#0B2540] border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0e2f52]">
              Mulai Navigasi
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <a href="#fitur" className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="2" /></svg>
              Lihat Peta Keamanan
            </a>
          </div>
        </div>
        <div className="hidden md:flex justify-end">
          <div className="w-[380px] overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl shadow-black/40">
            <Image src="/map-preview.png" alt="Peta Keamanan" width={380} height={280} className="w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}