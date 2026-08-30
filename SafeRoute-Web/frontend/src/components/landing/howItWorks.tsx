"use client";

import { useEffect, useId, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Search, ShieldAlert, Siren, Wifi, TrendingUp, type LucideIcon } from "lucide-react";

/**
 * ---------------------------------------------------------------------------
 * Types & data
 * ---------------------------------------------------------------------------
 */
type StatLive = { type: "live"; icon: LucideIcon; title: string; subtitle: string };
type StatRisk = { type: "risk"; levels: { label: string; color: string; weight: number }[] };
type StatCounter = { type: "counter"; icon: LucideIcon; value: string; label: string };
type Stat = StatLive | StatRisk | StatCounter;

interface Step {
  id: string;
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
  accentSoft: string;
  stat: Stat;
}

const STEPS: Step[] = [
  {
    id: "cari-lokasi",
    num: "01",
    icon: Search,
    title: "Cari Lokasi",
    desc: "Masukkan destinasi Anda dan dapatkan rute dengan analisis keamanan.",
    accent: "#2563EB",
    accentSoft: "#EFF6FF",
    stat: {
      type: "live",
      icon: Wifi,
      title: "GPS Aktif",
      subtitle: "Lokasi Anda terkunci otomatis",
    },
  },
  {
    id: "lihat-risiko",
    num: "02",
    icon: ShieldAlert,
    title: "Lihat Risiko",
    desc: "Setiap rute menampilkan info risiko keamanan berdasarkan data real-time.",
    accent: "#D97706",
    accentSoft: "#FFFBEB",
    stat: {
      type: "risk",
      levels: [
        { label: "Aman", color: "#16A34A", weight: 3 },
        { label: "Waspada", color: "#D97706", weight: 2 },
        { label: "Berisiko", color: "#DC2626", weight: 1 },
      ],
    },
  },
  {
    id: "lapor-kejadian",
    num: "03",
    icon: Siren,
    title: "Lapor Kejadian",
    desc: "Bantu pengguna lain dengan melaporkan insiden keamanan di sekitar Anda.",
    accent: "#E11D48",
    accentSoft: "#FFF1F2",
    stat: {
      type: "counter",
      icon: TrendingUp,
      value: "128",
      label: "laporan hari ini",
    },
  },
];

// Jalur penghubung antar kartu: melengkung naik di tengah, mengikuti kartu
// tengah yang posisinya lebih tinggi (lihat CARD_OFFSET).
const ROUTE_PATH = "M100,150 Q500,40 900,150";
const CARD_OFFSET = ["md:mt-10", "md:mt-0", "md:mt-10"];

/**
 * ---------------------------------------------------------------------------
 * Hook kecil khusus animasi jalur (AOS tidak menganimasikan SVG stroke,
 * jadi bagian ini tetap pakai IntersectionObserver ringan).
 * ---------------------------------------------------------------------------
 */
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);
  return [ref, inView];
}

/**
 * ---------------------------------------------------------------------------
 * Sub-komponen
 * ---------------------------------------------------------------------------
 */

interface IconBlobProps {
  Icon: LucideIcon;
  accent: string;
  accentSoft: string;
  delay?: number;
}

/** Ilustrasi vector blob organik di balik ikon, dengan animasi mengambang + cincin berdenyut. */
function IconBlob({ Icon, accent, accentSoft, delay = 0 }: IconBlobProps) {
  return (
    <div className="relative mx-auto -mt-16 mb-5 h-24 w-24" data-aos="zoom-in" data-aos-delay={delay}>
      <span
        className="sr-pulse-ring absolute inset-0 rounded-full"
        style={{ backgroundColor: accent, animationDelay: `${delay}ms` }}
      />
      <div className="sr-float relative flex h-full w-full items-center justify-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full drop-shadow-sm">
          <path
            fill={accentSoft}
            d="M42.7,-53.9C54.9,-45.4,64.3,-32.1,68.5,-17.4C72.7,-2.7,71.7,13.4,64.6,26.2C57.5,39,44.3,48.5,29.9,55.3C15.5,62.1,-0.1,66.2,-15.4,63.6C-30.7,61,-45.7,51.7,-55.4,38.4C-65.1,25.1,-69.5,7.8,-66.9,-8.1C-64.3,-24,-54.7,-38.5,-42,-47.3C-29.3,-56.1,-14.6,-59.2,0.5,-59.9C15.7,-60.6,31.4,-58.9,42.7,-53.9Z"
            transform="translate(100 100)"
          />
        </svg>
        <Icon size={30} strokeWidth={2} color={accent} className="relative" />
      </div>
    </div>
  );
}

/** Kotak info besar di bagian bawah kartu — bentuk & isi berbeda sesuai jenis datanya. */
function StatBox({ stat, accent }: { stat: Stat; accent: string }) {
  if (stat.type === "live") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-neutral-50 p-4 text-left">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent }}>
          <stat.icon size={18} color="#fff" strokeWidth={2.2} />
          <span className="sr-pulse-dot absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#0B2540]">{stat.title}</p>
          <p className="text-xs text-neutral-500">{stat.subtitle}</p>
        </div>
      </div>
    );
  }

  if (stat.type === "risk") {
    return (
      <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4 text-left">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
          {stat.levels.map((lvl) => (
            <span
              key={lvl.label}
              className="sr-grow-bar h-full"
              style={{ backgroundColor: lvl.color, flexGrow: lvl.weight }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {stat.levels.map((lvl) => (
            <span key={lvl.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lvl.color }} />
              {lvl.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // stat.type === "counter"
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-neutral-50 p-4 text-left">
      <div>
        <p className="text-2xl font-black tabular-nums text-[#0B2540]">{stat.value}</p>
        <p className="text-xs text-neutral-500">{stat.label}</p>
      </div>
      <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent }}>
        <stat.icon size={18} color="#fff" strokeWidth={2.2} />
      </span>
    </div>
  );
}

/** Satu kartu langkah lengkap: nomor watermark, ilustrasi, teks, dan kotak info. */
function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div
      className={`relative rounded-3xl border border-black/5 bg-white p-6 pt-0 shadow-xl shadow-black/5 ${CARD_OFFSET[index]}`}
      data-aos="fade-up"
      data-aos-delay={index * 150}
    >
      <span className="pointer-events-none absolute right-5 top-4 select-none text-6xl font-black leading-none text-[#0B2540]/5">
        {step.num}
      </span>

      <IconBlob Icon={step.icon} accent={step.accent} accentSoft={step.accentSoft} delay={index * 150 + 100} />

      <div className="text-center">
        <p className="text-lg font-bold text-[#0B2540]">{step.title}</p>
        <p className="mx-auto mt-2 max-w-[240px] text-xs leading-relaxed text-neutral-500">{step.desc}</p>
      </div>

      <div className="mt-5">
        <StatBox stat={step.stat} accent={step.accent} />
      </div>
    </div>
  );
}

/** Jalur penghubung melengkung + titik yang bergerak, hanya tampil di md ke atas. */
function RouteLine({ active }: { active: boolean }) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 1000 200"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 w-full md:block"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={STEPS[0].accent} />
          <stop offset="50%" stopColor={STEPS[1].accent} />
          <stop offset="100%" stopColor={STEPS[2].accent} />
        </linearGradient>
      </defs>
      <path d={ROUTE_PATH} fill="none" stroke="#0B2540" strokeOpacity="0.08" strokeWidth="2.5" />
      <path
        d={ROUTE_PATH}
        pathLength={100}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        className={active ? "sr-route-draw" : ""}
        style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
      />
      {active && (
        <circle r="5" fill="#fff" stroke="#0B2540" strokeWidth="2.5">
          <animateMotion dur="5s" begin="1.6s" repeatCount="indefinite" path={ROUTE_PATH} />
        </circle>
      )}
    </svg>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Komponen utama
 * ---------------------------------------------------------------------------
 */
export default function HowItWorksSection() {
  const [lineRef, lineInView] = useInView<HTMLDivElement>({ threshold: 0.3 });

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
  }, []);

  return (
    <section
      id="cara-kerja"
      className="relative overflow-hidden bg-white py-24"
      style={{
        backgroundImage: "radial-gradient(rgba(11,37,64,0.06) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <style>{`
        @keyframes sr-draw-route { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        .sr-route-draw { animation: sr-draw-route 1.8s ease-out forwards; }

        @keyframes sr-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .sr-float { animation: sr-float 3s ease-in-out infinite; }

        @keyframes sr-pulse-ring { 0% { transform: scale(0.85); opacity: 0.35; } 100% { transform: scale(1.35); opacity: 0; } }
        .sr-pulse-ring { animation: sr-pulse-ring 2.2s ease-out infinite; }

        @keyframes sr-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .sr-pulse-dot { animation: sr-pulse-dot 1.6s ease-in-out infinite; }

        @keyframes sr-grow-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .sr-grow-bar { transform-origin: left; animation: sr-grow-bar 1s ease-out forwards; }

        @media (prefers-reduced-motion: reduce) {
          .sr-route-draw, .sr-float, .sr-pulse-ring, .sr-pulse-dot, .sr-grow-bar {
            animation: none !important;
            stroke-dashoffset: 0 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
          3 langkah mudah
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B2540]">Cara Kerja SafeRoute</h2>

        <div ref={lineRef} className="relative mt-20 grid gap-10 pt-10 md:grid-cols-3 md:gap-8">
          <RouteLine active={lineInView} />
          {STEPS.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}