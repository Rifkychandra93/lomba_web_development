"use client";

import type { CSSProperties, ReactNode } from "react";

// ── Palet warna ───────────────────────────────────────────────
const COLORS = {
  navy: "#0B2540",
  teal: "#0D5C4B",
  amber: "#E8930A",
} as const;

// ── Data fitur ────────────────────────────────────────────────
type Feature = {
  title: string;
  desc: string;
  accent: string;
  icon: ReactNode;
};

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const features: Feature[] = [
  {
    title: "Peta Interaktif Titik Rawan",
    desc: "Heatmap risiko yang menandai area rawan di sepanjang kota, disusun dari data berita resmi dan laporan warga.",
    accent: COLORS.teal,
    icon: (
      <svg {...iconProps}>
        <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z" />
        <path d="M9 7v13" />
        <path d="M15 4v13" />
      </svg>
    ),
  },
  {
    title: "Lapor Kejadian",
    desc: "Kirim laporan lengkap dengan foto dan titik lokasi yang terisi otomatis, cukup dalam hitungan detik.",
    accent: COLORS.amber,
    icon: (
      <svg {...iconProps}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="M9 15h6" />
      </svg>
    ),
  },
  {
    title: "Notifikasi Titik Rawan",
    desc: "Peringatan otomatis saat rute yang Anda tempuh melewati area berisiko.",
    accent: COLORS.navy,
    icon: (
      <svg {...iconProps}>
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Riwayat Rute",
    desc: "Simpan dan cari kembali rute yang pernah Anda tempuh sebelumnya.",
    accent: COLORS.teal,
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: "Dashboard Verifikasi",
    desc: "Panel admin untuk meninjau dan memverifikasi setiap laporan sebelum tampil ke publik.",
    accent: COLORS.amber,
    icon: (
      <svg {...iconProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

// Sudut kanan-bawah kartu dipotong diagonal, bikin bentuknya
// kayak tiket/boarding pass, bukan kotak polos.
const TICKET_CLIP: CSSProperties = {
  clipPath:
    "polygon(0 0, 100% 0, 100% calc(100% - 26px), calc(100% - 26px) 100%, 0 100%)",
};

const BASE_DELAY_MS = 100;
const STEP_DELAY_MS = 110;

// ── Sub-komponen: satu kartu tiket fitur ─────────────────────
function FeatureTicket({ feature, align }: { feature: Feature; align: "left" | "right" }) {
  return (
    <div
      className={`relative border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 ${
        align === "right" ? "md:text-right" : "md:text-left"
      }`}
      style={{ ...TICKET_CLIP, borderColor: "#E2E6E9" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = feature.accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E6E9")}
    >
      <div
        className={`flex items-center gap-3 ${align === "right" ? "md:flex-row-reverse" : ""}`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${feature.accent}14`, color: feature.accent }}
        >
          {feature.icon}
        </div>
        <h3 className="text-sm font-bold text-neutral-900">{feature.title}</h3>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">{feature.desc}</p>
    </div>
  );
}

// ── Sub-komponen: satu titik pada jalur ──────────────────────
function FeatureStop({ feature, index }: { feature: Feature; index: number }) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={`relative flex flex-col gap-4 pl-12 md:mb-16 md:flex-row md:items-center md:gap-12 md:pl-0 ${
        isEven ? "" : "md:flex-row-reverse"
      }`}
      data-aos="fade-up"
      data-aos-duration="500"
      data-aos-delay={BASE_DELAY_MS + index * STEP_DELAY_MS}
    >
      {/* Titik penanda di garis jalur */}
      <span
        className="absolute left-4 top-6 z-10 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-white md:left-1/2 md:top-1/2 md:-translate-y-1/2"
        style={{ backgroundColor: feature.accent }}
      />

      <div className="md:w-1/2">
        <p
          className="mb-2 font-mono text-[11px] font-semibold tracking-wide"
          style={{ color: feature.accent }}
        >
          Titik {String(index + 1).padStart(2, "0")}
        </p>
        <FeatureTicket feature={feature} align={isEven ? "right" : "left"} />
      </div>

      <div className="hidden md:block md:w-1/2" />
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────
export default function FeaturesSection() {
  return (
    <section id="fitur" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: `${COLORS.navy}99` }}
          data-aos="fade-up"
          data-aos-duration="500"
        >
          Fitur Kami
        </p>

        <h2
          className="mt-3 text-3xl font-bold tracking-tight"
          style={{ color: COLORS.navy }}
          data-aos="fade-up"
          data-aos-duration="500"
          data-aos-delay="60"
        >
          Fitur Utama SafeRoute
        </h2>

        <p
          className="mx-auto mt-3 max-w-lg text-sm text-neutral-500"
          data-aos="fade-up"
          data-aos-duration="500"
          data-aos-delay="120"
        >
          Lima fitur inti yang bekerja bersama, dari memetakan risiko hingga
          memverifikasi setiap laporan yang masuk.
        </p>

        <div className="relative mt-20 text-left">
          {/* Garis jalur, di kiri untuk mobile, di tengah untuk desktop */}
          <div
            className="absolute left-4 top-0 bottom-0 w-px border-l-2 border-dashed md:left-1/2"
            style={{ borderColor: "#D8DEE3" }}
          />

          {features.map((feature, i) => (
            <FeatureStop key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}