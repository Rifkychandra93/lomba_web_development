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
    desc: "Memantau kondisi jalan dari data kriminalitas, penerangan, dan laporan warga secara terus-menerus, bukan sekadar snapshot statis.",
    accent: "#2563EB",
    accentSoft: "#EFF6FF",
    big: true,
  },
  {
    id: "rute",
    icon: Navigation,
    title: "Rute Tercepat & Teraman",
    desc: "Bukan cuma jalan terdekat — SafeRoute menyeimbangkan waktu tempuh dengan tingkat risiko di sepanjang jalur.",
    accent: "#16A34A",
    accentSoft: "#F0FDF4",
  },
  {
    id: "komunitas",
    icon: Users,
    title: "Komunitas Aktif 24 Jam",
    desc: "Ribuan pengguna saling melaporkan kondisi terkini, membuat data selalu segar setiap jam.",
    accent: "#D97706",
    accentSoft: "#FFFBEB",
  },
  {
    id: "notifikasi",
    icon: BellRing,
    title: "Notifikasi Instan",
    desc: "Dapat peringatan seketika saat memasuki area yang baru saja dilaporkan berisiko.",
    accent: "#E11D48",
    accentSoft: "#FFF1F2",
  },
  {
    id: "privasi",
    icon: Lock,
    title: "Privasi Terlindungi",
    desc: "Lokasi Anda terenkripsi dan tidak pernah dibagikan ke pihak lain tanpa izin.",
    accent: "#0B2540",
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
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
            Kenapa SafeRoute
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B2540]">
            Manfaat yang Anda Dapatkan
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Lebih dari sekadar navigasi — SafeRoute dirancang untuk membuat setiap perjalanan
            terasa lebih tenang dan terinformasi.
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