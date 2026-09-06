"use client";

import { useEffect, useId, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  Search,
  Route,
  Siren,
  Wifi,
  TrendingUp,
  Flag,
  MapPin,
  type LucideIcon,
} from "lucide-react";

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
  num: number;
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
  accentSoft: string;
  stat: Stat;
}

const STEPS: Step[] = [
  {
    id: "cari-tujuan",
    num: 1,
    icon: Search,
    title: "Cari Tujuan Anda",
    desc:
      "Ketik alamat tujuan Anda di kolom pencarian. SafeRoute langsung mengenali lokasi Anda saat ini lewat GPS, tanpa perlu pengaturan tambahan.",
    accent: "#0B2540",
    accentSoft: "#EEF2F6",
    stat: {
      type: "live",
      icon: Wifi,
      title: "GPS Aktif",
      subtitle: "Lokasi Anda terkunci otomatis",
    },
  },
  {
    id: "pilih-rute",
    num: 2,
    icon: Route,
    title: "Pilih Rute Paling Aman",
    desc:
      "Setiap pilihan jalan diberi tanda Aman, Waspada, atau Berisiko berdasarkan data terbaru. Anda tinggal memilih rute yang paling nyaman untuk dilalui.",
    accent: "#E8930A",
    accentSoft: "#FFF7EC",
    stat: {
      type: "risk",
      levels: [
        { label: "Aman", color: "#0D5C4B", weight: 3 },
        { label: "Waspada", color: "#E8930A", weight: 2 },
        { label: "Berisiko", color: "#DC2626", weight: 1 },
      ],
    },
  },
  {
    id: "sampai-lapor",
    num: 3,
    icon: Siren,
    title: "Sampai & Bantu Laporkan",
    desc:
      "Setelah tiba dengan selamat, luangkan waktu sebentar untuk melaporkan kejadian yang Anda temui di jalan, agar pengguna lain bisa lebih waspada.",
    accent: "#0D5C4B",
    accentSoft: "#EAF6F2",
    stat: {
      type: "counter",
      icon: TrendingUp,
      value: "128",
      label: "laporan baru hari ini",
    },
  },
];

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
    <div className="relative mx-auto h-40 w-40" data-aos="zoom-in" data-aos-delay={delay}>
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
        <Icon size={48} strokeWidth={1.8} color={accent} className="relative" />
      </div>
    </div>
  );
}

/** Kotak info besar di bagian bawah kartu — bentuk & isi berbeda sesuai jenis datanya. */
function StatBox({ stat, accent }: { stat: Stat; accent: string }) {
  if (stat.type === "live") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-neutral-50 p-4 text-left">
        <span
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent }}
        >
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
      <span
        className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: accent }}
      >
        <stat.icon size={18} color="#fff" strokeWidth={2.2} />
      </span>
    </div>
  );
}

/**
 * Garis rute vertikal di tengah — menghubungkan tiap langkah dari titik awal
 * sampai titik tujuan, dengan penanda bulat bernomor di tiap langkah dan
 * satu titik yang terus "berjalan" turun untuk memperjelas arah alurnya.
 */
function RouteSpine({ inView }: { inView: boolean }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block"
      aria-hidden="true"
    >
      {/* garis putus-putus */}
      <div
        className="h-full w-full opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, #0B2540 0, #0B2540 6px, transparent 6px, transparent 14px)",
        }}
      />

      {/* penanda titik awal */}
      <span className="absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#0B2540] text-white shadow">
        <Flag size={12} strokeWidth={2.4} />
      </span>

      {/* penanda tujuan akhir */}
      <span className="absolute -bottom-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#0D5C4B] text-white shadow">
        <MapPin size={12} strokeWidth={2.4} />
      </span>

      {/* penanda bernomor tiap langkah */}
      {STEPS.map((step, i) => (
        <span
          key={step.id}
          className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white text-xs font-bold text-white shadow"
          style={{
            top: `${((i + 0.5) / STEPS.length) * 100}%`,
            backgroundColor: step.accent,
          }}
        >
          {step.num}
        </span>
      ))}

      {/* titik yang berjalan dari awal ke tujuan */}
      {inView && (
        <span
          className="sr-travel absolute -left-[5px] h-[10px] w-[10px] rounded-full border-2 border-white bg-[#0B2540] shadow"
        />
      )}
    </div>
  );
}

/** Satu baris langkah: ilustrasi di satu sisi, teks (rata kanan-kiri) di sisi lainnya. */
function StepRow({ step, index }: { step: Step; index: number }) {
  const reversed = index % 2 === 1;

  return (
    <div
      className={`relative flex flex-col items-center gap-8 md:gap-16 ${
        reversed ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <div className="md:w-[calc(50%-2.5rem)]" data-aos={reversed ? "fade-left" : "fade-right"}>
        <IconBlob Icon={step.icon} accent={step.accent} accentSoft={step.accentSoft} delay={index * 120} />
      </div>

      <div
        className="relative md:w-[calc(50%-2.5rem)]"
        data-aos={reversed ? "fade-right" : "fade-left"}
        data-aos-delay={index * 120 + 80}
      >
        <span
          className="pointer-events-none absolute -top-6 select-none text-7xl font-black leading-none text-[#0B2540]/5 md:-top-8"
          style={reversed ? { right: 0 } : { left: 0 }}
        >
          0{step.num}
        </span>

        <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: step.accent }}>
          Langkah {step.num}
        </p>
        <h3 className="relative mt-2 text-xl font-bold text-[#0B2540] md:text-2xl">{step.title}</h3>
        <p className="relative mt-3 text-justify text-sm leading-relaxed text-neutral-500">{step.desc}</p>

        <div className="relative mt-5">
          <StatBox stat={step.stat} accent={step.accent} />
        </div>
      </div>
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Komponen utama
 * ---------------------------------------------------------------------------
 */
export default function HowItWorksSection() {
  const gradientId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic" });
  }, []);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
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
        @keyframes sr-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .sr-float { animation: sr-float 3s ease-in-out infinite; }

        @keyframes sr-pulse-ring { 0% { transform: scale(0.85); opacity: 0.25; } 100% { transform: scale(1.3); opacity: 0; } }
        .sr-pulse-ring { animation: sr-pulse-ring 2.4s ease-out infinite; }

        @keyframes sr-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .sr-pulse-dot { animation: sr-pulse-dot 1.6s ease-in-out infinite; }

        @keyframes sr-grow-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .sr-grow-bar { transform-origin: left; animation: sr-grow-bar 1s ease-out forwards; }

        @keyframes sr-travel {
          0% { top: 4%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
        .sr-travel { animation: sr-travel 6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .sr-float, .sr-pulse-ring, .sr-pulse-dot, .sr-grow-bar, .sr-travel {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#0D5C4B]">
          Panduan singkat
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B2540]">
          Ikuti Rutenya, Sampai dengan Aman
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
          Tiga langkah sederhana ini menuntun Anda dari mencari tujuan sampai tiba dengan selamat.
        </p>

        <div ref={wrapperRef} className="relative mt-20 space-y-20 md:space-y-28">
          <RouteSpine inView={inView} />
          {STEPS.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}