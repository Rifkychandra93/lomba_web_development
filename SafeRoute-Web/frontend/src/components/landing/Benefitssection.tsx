"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Radar, Navigation, Users, BellRing, Lock, type LucideIcon } from "lucide-react";

/**
 * ---------------------------------------------------------------------------
 * Types & data
 * ---------------------------------------------------------------------------
 * "big: true" menandai manfaat utama yang mendapat kartu berukuran 2x lebih
 * besar berikut ilustrasi radar — sisanya kartu standar di sampingnya.
 */
interface Benefit {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
  accentSoft: string;
  big?: boolean;
}

const BENEFITS: Benefit[] = [
  {
    id: "radar",
    icon: Radar,
    title: "Radar Keamanan Real-Time",
    desc: "Bukan sekadar potret sesaat — kondisi jalan terus dipantau dari data resmi dan laporan warga, jadi info yang Anda lihat selalu segar kapan pun dibutuhkan.",
    accent: "#0B2540",
    accentSoft: "#EEF2F6",
    big: true,
  },
  {
    id: "rute",
    icon: Navigation,
    title: "Rute Tercepat & Teraman",
    desc: "Sistem menyeimbangkan waktu tempuh dengan tingkat risiko sepanjang jalan, jadi Anda tidak perlu memilih antara cepat atau aman.",
    accent: "#0D5C4B",
    accentSoft: "#EAF6F2",
  },
  {
    id: "komunitas",
    icon: Users,
    title: "Komunitas Aktif 24 Jam",
    desc: "Setiap laporan yang Anda kirim langsung membantu warga lain di sekitar. Makin banyak yang ikut serta, makin akurat peta keamanan untuk semua.",
    accent: "#E8930A",
    accentSoft: "#FFF7EC",
  },
  {
    id: "notifikasi",
    icon: BellRing,
    title: "Notifikasi Instan",
    desc: "Begitu ada laporan baru di jalur yang sedang Anda lalui, peringatan langsung muncul — masih cukup waktu untuk berpindah jalur.",
    accent: "#E14B4B",
    accentSoft: "#FDEDED",
  },
  {
    id: "privasi",
    icon: Lock,
    title: "Privasi Terlindungi",
    desc: "Lokasi Anda dienkripsi dan tidak pernah dibagikan tanpa izin, jadi Anda bisa melapor dan mencari rute aman tanpa khawatir data disalahgunakan.",
    accent: "#334155",
    accentSoft: "#F1F5F9",
  },
];

/**
 * ---------------------------------------------------------------------------
 * Sub-komponen
 * ---------------------------------------------------------------------------
 */

/** Ilustrasi radar berputar — cincin konsentris, sapuan berotasi, dan beberapa titik laporan yang berdenyut. */
function RadarVisual({ accent }: { accent: string }) {
  const blips = [
    { top: "28%", left: "62%", delay: "0s" },
    { top: "58%", left: "32%", delay: "0.7s" },
    { top: "70%", left: "68%", delay: "1.4s" },
  ];

  return (
    <div className="relative mx-auto mt-6 h-40 w-40 shrink-0 sm:h-44 sm:w-44">
      {[1, 0.7, 0.4].map((scale) => (
        <span
          key={scale}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: accent, opacity: 0.15 + scale * 0.1, transform: `scale(${scale})` }}
        />
      ))}
      <div
        className="sr-radar-sweep absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(from 0deg, ${accent}55, transparent 35%)` }}
      />
      <div className="absolute inset-[38%] rounded-full" style={{ backgroundColor: accent }} />
      {blips.map((b, i) => (
        <span
          key={i}
          className="sr-radar-blip absolute h-2 w-2 rounded-full"
          style={{ top: b.top, left: b.left, backgroundColor: accent, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
}

/** Satu kartu manfaat. Kartu utama (big) menampilkan RadarVisual, kartu lain hanya ikon + teks. */
function BenefitCard({ benefit, delay }: { benefit: Benefit; delay: number }) {
  const Icon = benefit.icon;

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={delay}
      className={`flex flex-col rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-lg ${
        benefit.big ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: benefit.accentSoft }}
      >
        <Icon size={22} color={benefit.accent} strokeWidth={2.2} />
      </span>

      <p className={`mt-5 font-bold text-[#0B2540] ${benefit.big ? "text-xl" : "text-base"}`}>{benefit.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{benefit.desc}</p>

      {benefit.big && <RadarVisual accent={benefit.accent} />}
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Komponen utama
 * ---------------------------------------------------------------------------
 */
export default function BenefitsSection() {
  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
  }, []);

  return (
    <section id="manfaat" className="bg-white py-24">
      <style>{`
        @keyframes sr-radar-sweep { to { transform: rotate(360deg); } }
        .sr-radar-sweep { animation: sr-radar-sweep 4s linear infinite; }

        @keyframes sr-radar-blip {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.6); opacity: 0.3; }
        }
        .sr-radar-blip { animation: sr-radar-blip 2.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .sr-radar-sweep, .sr-radar-blip { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center" data-aos="fade-up">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#0D5C4B]">
            Kenapa SafeRoute
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B2540]">
            Keunggulan SafeRoute untuk Anda dan Sesama
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Lebih dari sekadar navigasi — SafeRoute membantu Anda memilih jalan yang lebih tenang,
            sekaligus menjaga warga lain tetap waspada lewat data yang sama-sama dibangun bersama.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-4 md:grid-rows-2">
          {BENEFITS.map((benefit, i) => (
            <BenefitCard key={benefit.id} benefit={benefit} delay={i * 100} />
          ))}
        </div>

      </div>
    </section>
  );
}