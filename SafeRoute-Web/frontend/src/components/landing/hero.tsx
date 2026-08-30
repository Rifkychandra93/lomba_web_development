"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import { ShieldCheck } from "lucide-react";

export default function HeroSection() {
  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
  }, []);

  return (
    <section id="beranda" className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/hero-city.png" alt="City" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2540]/90 via-[#0B2540]/70 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-32 md:grid-cols-2 md:items-center">
        <div data-aos="fade-right">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Temukan Jalur Teraman Untuk Perjalanan Anda.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-300">
            Navigasi cerdas yang tidak hanya mencari jalan tercepat, namun juga jalan teraman
            berdasarkan data kriminalitas, penerangan jalan, dan laporan warga real-time.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl border border-white/20 bg-[#0B2540] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0e2f52]"
            >
              Mulai Navigasi
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#fitur"
              className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="2" />
              </svg>
              Lihat Peta Keamanan
            </a>
          </div>
        </div>

        <div className="hidden justify-end md:flex">
          <div className="relative w-[420px] lg:w-[460px]" data-aos="fade-left" data-aos-delay="150">
            {/* Rasio tetap 4:3 supaya crop selalu konsisten, berapa pun ukuran asli file map-preview.png */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl shadow-black/40">
              <Image src="/map-preview.png" alt="Peta Keamanan" fill className="object-cover" />
            </div>

            {/* Indikator live di sudut gambar */}
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#0B2540] shadow-md backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>

            {/* Kartu statistik mengambang, elemen penarik perhatian utama di area gambar */}
            <div
              className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-xl shadow-black/20"
              data-aos="zoom-in"
              data-aos-delay="450"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2540]">
                <ShieldCheck size={22} color="#fff" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-xl font-black leading-none text-[#0B2540]">98%</p>
                <p className="mt-1 text-xs text-neutral-500">Akurasi prediksi risiko</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}