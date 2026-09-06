"use client";

import type { CSSProperties, ReactNode } from "react";

// ── Palet warna (mengikuti Hero) ─────────────────────────────
const COLORS = {
  navy: "#0B2540",
  teal: "#0D5C4B",
  amber: "#E8930A",
} as const;

const FONT: CSSProperties = { fontFamily: '"Nunito", ui-sans-serif, sans-serif' };

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

// ── Ikon kecil untuk chip di bawah gambar ────────────────────
const MapIcon = () => (
  <svg {...iconProps}>
    <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z" />
    <path d="M9 7v13M15 4v13" />
  </svg>
);
const RadarIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" opacity="0.5" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...iconProps}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const FlagIcon = () => (
  <svg {...iconProps}>
    <path d="M5 21V4" />
    <path d="M5 5h11l-2.5 3.5L16 12H5" />
  </svg>
);
const ChatIcon = () => (
  <svg {...iconProps}>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

// ── Ilustrasi vektor untuk tiap fitur ─────────────────────────
// Semua ilustrasi memakai palet navy/teal/amber yang sama,
// hanya arah gradasi & aksennya yang berbeda per kartu.

function MapIllustration() {
  return (
    <svg viewBox="0 0 340 220" className="h-full w-full">
      <circle cx="270" cy="40" r="70" fill="white" opacity="0.06" />
      <circle cx="40" cy="190" r="60" fill="white" opacity="0.05" />
      <path
        d="M -10 190 C 80 190, 90 120, 160 110 S 260 60, 350 40"
        fill="none"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M -10 190 C 80 190, 90 120, 160 110 S 260 60, 350 40"
        fill="none"
        stroke="#E8930A"
        strokeWidth="3"
        strokeDasharray="8 10"
        strokeLinecap="round"
      />
      <circle cx="210" cy="85" r="16" fill="#E8930A" opacity="0.25" />
      <circle cx="210" cy="85" r="8" fill="#E8930A" />
      <path d="M210 80 v6 M210 89 v0.5" stroke="#0B2540" strokeWidth="1.6" strokeLinecap="round" />
      <g transform="translate(268,42)">
        <path d="M0 0c0-11-9-20-20-20s-20 9-20 20c0 15 20 34 20 34s20-19 20-34z" fill="white" />
        <circle cx="-20" cy="-2" r="7" fill="#0B2540" />
      </g>
      <g transform="translate(62,120)">
        <ellipse cx="14" cy="82" rx="30" ry="7" fill="black" opacity="0.15" />
        <rect x="0" y="55" width="11" height="30" rx="5" fill="#0B2540" />
        <rect x="17" y="55" width="11" height="30" rx="5" fill="#0B2540" />
        <path
          d="M-6 20 h40 a6 6 0 0 1 6 6 v26 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 v-26 a6 6 0 0 1 6 -6z"
          fill="#E8930A"
        />
        <path d="M32 26 q18 -6 22 -26" stroke="#E8930A" strokeWidth="9" strokeLinecap="round" fill="none" />
        <rect x="46" y="-10" width="16" height="26" rx="3" fill="white" />
        <path d="M50 -3c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="#0D5C4B" />
        <path d="M50 -3l4-5 4 5" stroke="#0D5C4B" strokeWidth="1.3" fill="none" />
        <circle cx="14" cy="6" r="14" fill="white" />
        <path d="M0 2a14 14 0 0 1 28 0c0 -6 -6 -11 -14 -11s-14 5 -14 11z" fill="#0B2540" />
      </g>
    </svg>
  );
}

function AiIllustration() {
  return (
    <svg viewBox="0 0 340 220" className="h-full w-full">
      <circle cx="60" cy="30" r="60" fill="white" opacity="0.05" />
      <g transform="translate(40,60) rotate(-8)">
        <rect x="0" y="16" width="86" height="108" rx="10" fill="white" opacity="0.5" />
        <rect x="10" y="6" width="86" height="108" rx="10" fill="white" />
        <rect x="24" y="24" width="58" height="7" rx="3" fill="#0B2540" />
        <rect x="24" y="40" width="58" height="5" rx="2.5" fill="#C9D3D8" />
        <rect x="24" y="52" width="58" height="5" rx="2.5" fill="#C9D3D8" />
        <rect x="24" y="64" width="40" height="5" rx="2.5" fill="#C9D3D8" />
        <rect x="24" y="84" width="30" height="16" rx="4" fill="#E8930A" opacity="0.9" />
      </g>
      <g transform="translate(190,95)">
        <circle r="46" fill="none" stroke="white" strokeWidth="1.5" opacity="0.18" />
        <circle r="30" fill="none" stroke="white" strokeWidth="1.5" opacity="0.28" />
        <circle r="26" fill="#E8930A" opacity="0.16" />
        <circle r="16" fill="#E8930A" />
        <rect x="-5" y="-5" width="10" height="10" rx="2" fill="white" />
        <circle cx="-2.4" cy="-1.6" r="1.4" fill="#0B2540" />
        <circle cx="2.4" cy="-1.6" r="1.4" fill="#0B2540" />
        <path d="M0 -18 v-8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-28" r="3" fill="white" />
      </g>
      <path d="M126 90 Q160 70 168 78" fill="none" stroke="white" strokeWidth="2" strokeDasharray="3 6" opacity="0.5" />
      <g transform="translate(275,70)">
        <circle r="20" fill="#E8930A" opacity="0.18" />
        <path d="M0-18c9 0 16 7 16 16 0 12-16 27-16 27s-16-15-16-27c0-9 7-16 16-16z" fill="white" />
        <circle cy="-2" r="5.5" fill="#0B2540" />
      </g>
    </svg>
  );
}

function VerifyIllustration() {
  return (
    <svg viewBox="0 0 340 220" className="h-full w-full">
      <circle cx="280" cy="180" r="70" fill="white" opacity="0.05" />
      <g transform="translate(190,42)">
        <path d="M45 0 L88 16 V60 C88 96 45 118 45 118 C45 118 2 96 2 60 V16 Z" fill="#E8930A" />
        <path
          d="M45 10 L79 23 V58 C79 87 45 106 45 106 C45 106 11 87 11 58 V23 Z"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.5"
        />
        <path d="M27 56 L40 70 L66 40" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g fill="white" opacity="0.7">
        <path d="M270 30 l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path d="M255 110 l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </g>
      <g transform="translate(48,90)">
        <ellipse cx="14" cy="92" rx="32" ry="7" fill="black" opacity="0.15" />
        <rect x="0" y="62" width="11" height="32" rx="5" fill="#062033" />
        <rect x="17" y="62" width="11" height="32" rx="5" fill="#062033" />
        <path
          d="M-6 26 h40 a6 6 0 0 1 6 6 v28 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 v-28 a6 6 0 0 1 6 -6z"
          fill="white"
        />
        <circle cx="14" cy="10" r="15" fill="white" />
        <path d="M-1 6a15 15 0 0 1 30 0c0-6.5-6.5-12-15-12S-1-0.5-1 6z" fill="#062033" />
        <g transform="translate(38,4) rotate(6)">
          <rect x="0" y="0" width="46" height="30" rx="5" fill="white" />
          <rect x="4" y="4" width="14" height="14" rx="7" fill="#0D5C4B" />
          <rect x="22" y="6" width="20" height="4" rx="2" fill="#E8930A" />
          <rect x="22" y="13" width="20" height="3" rx="1.5" fill="#C9D3D8" />
          <rect x="4" y="22" width="38" height="4" rx="2" fill="#E8930A" opacity="0.6" />
        </g>
      </g>
    </svg>
  );
}

function ReportIllustration() {
  return (
    <svg viewBox="0 0 340 220" className="h-full w-full">
      <circle cx="60" cy="40" r="60" fill="white" opacity="0.06" />
      <g transform="translate(220,20)">
        <rect x="-3" y="40" width="6" height="80" fill="#062033" />
        <g transform="rotate(-6)">
          <path d="M0 0 L46 76 H-46 Z" fill="white" />
          <path d="M0 0 L46 76 H-46 Z" fill="none" stroke="#0B2540" strokeWidth="5" strokeLinejoin="round" />
          <path d="M0 22 v22" stroke="#0B2540" strokeWidth="6" strokeLinecap="round" />
          <circle cx="0" cy="56" r="3.4" fill="#0B2540" />
        </g>
      </g>
      <g transform="translate(50,86)">
        <ellipse cx="16" cy="98" rx="34" ry="7" fill="black" opacity="0.15" />
        <rect x="2" y="68" width="12" height="32" rx="6" fill="#062033" />
        <rect x="20" y="68" width="12" height="32" rx="6" fill="#062033" />
        <path
          d="M-4 30 h44 a6 6 0 0 1 6 6 v30 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 v-30 a6 6 0 0 1 6 -6z"
          fill="white"
        />
        <circle cx="18" cy="12" r="15" fill="white" />
        <path d="M3 8a15 15 0 0 1 30 0c0-6.5-6.7-12-15-12S3 1.5 3 8z" fill="#062033" />
        <path d="M42 40 q28 -8 46 -30" stroke="white" strokeWidth="9" strokeLinecap="round" fill="none" />
        <rect x="-16" y="46" width="17" height="27" rx="3" fill="white" />
        <rect x="-12" y="51" width="9" height="3" rx="1.5" fill="#0D5C4B" />
        <rect x="-12" y="57" width="9" height="3" rx="1.5" fill="#C9D3D8" />
        <path d="M-9 66 l3 4 5 -7" stroke="#0D5C4B" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function ChatIllustration() {
  return (
    <svg viewBox="0 0 340 220" className="h-full w-full">
      <circle cx="280" cy="50" r="60" fill="white" opacity="0.06" />
      <g transform="translate(30,40)">
        <path
          d="M0 14 a14 14 0 0 1 14 -14 h96 a14 14 0 0 1 14 14 v46 a14 14 0 0 1 -14 14 h-70 l-16 16 v-16 h-10 a14 14 0 0 1 -14 -14z"
          fill="white"
        />
        <rect x="16" y="20" width="80" height="6" rx="3" fill="#C9D3D8" />
        <rect x="16" y="34" width="60" height="6" rx="3" fill="#C9D3D8" />
        <rect x="16" y="48" width="40" height="6" rx="3" fill="#E8930A" />
      </g>
      <g transform="translate(150,118)">
        <path
          d="M124 14 a14 14 0 0 0 -14 -14 h-86 a14 14 0 0 0 -14 14 v40 a14 14 0 0 0 14 14 h64 l14 14 v-14 h8 a14 14 0 0 0 14 -14z"
          fill="#0B2540"
        />
        <rect x="24" y="20" width="70" height="6" rx="3" fill="white" opacity="0.85" />
        <rect x="24" y="34" width="46" height="6" rx="3" fill="white" opacity="0.5" />
      </g>
      <g transform="translate(266,58)">
        <circle r="22" fill="white" />
        <path d="M-13 -2a13 13 0 0 1 26 0v6" stroke="#0B2540" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="-16" y="-2" width="6" height="12" rx="3" fill="#0B2540" />
        <rect x="10" y="-2" width="6" height="12" rx="3" fill="#0B2540" />
        <path d="M13 10 v4 a5 5 0 0 1 -5 5 h-5" stroke="#0B2540" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </g>
      <circle cx="284" cy="40" r="6" fill="#34D399" stroke="white" strokeWidth="2.5" />
    </svg>
  );
}

// ── Data fitur ────────────────────────────────────────────────
type Feature = {
  span: string;
  gradient: string;
  badge: string;
  iconBg: string;
  icon: ReactNode;
  title: string;
  desc: string;
  illustration: ReactNode;
};

const features: Feature[] = [
  {
    span: "lg:col-span-1",
    gradient: "linear-gradient(135deg, #0D5C4B, #0B2540)",
    badge: "Real-time",
    iconBg: COLORS.amber,
    icon: <MapIcon />,
    title: "Peta Interaktif Titik Rawan",
    desc: "Lihat jalan dan area rawan langsung di peta — disusun dari analisis AI dan laporan warga.",
    illustration: <MapIllustration />,
  },
  {
    span: "lg:col-span-1",
    gradient: "linear-gradient(135deg, #0B2540, #158A6F)",
    badge: "Otomatis",
    iconBg: COLORS.teal,
    icon: <RadarIcon />,
    title: "Pemindaian Berita dengan AI",
    desc: "AI membaca berita kriminal lokal dan menandai titik rawan baru, tanpa perlu input manual.",
    illustration: <AiIllustration />,
  },
  {
    span: "lg:col-span-1",
    gradient: "linear-gradient(225deg, #0B2540, #0D5C4B)",
    badge: "Terverifikasi",
    iconBg: COLORS.amber,
    icon: <ShieldIcon />,
    title: "Verifikasi Ketat Setiap Akun",
    desc: "Registrasi melalui verifikasi identitas, agar setiap laporan berasal dari pengguna yang sah.",
    illustration: <VerifyIllustration />,
  },
  {
    span: "lg:col-span-2",
    gradient: "linear-gradient(135deg, #E8930A, #0B2540)",
    badge: "Live",
    iconBg: COLORS.teal,
    icon: <FlagIcon />,
    title: "Lapor Kejadian Secara Real-Time",
    desc: "Pengguna terverifikasi bisa melaporkan kejadian lengkap dengan lokasi dan detail kejadian, langsung dari jalan.",
    illustration: <ReportIllustration />,
  },
  {
    span: "lg:col-span-1",
    gradient: "linear-gradient(135deg, #0D5C4B, #1AA37F)",
    badge: "Online",
    iconBg: COLORS.navy,
    icon: <ChatIcon />,
    title: "Chat Langsung dengan Admin",
    desc: "Tanyakan status laporan atau minta bantuan langsung lewat chat real-time.",
    illustration: <ChatIllustration />,
  },
];

// ── Satu kartu fitur ──────────────────────────────────────────
function FeatureCard({ feature, aosDelay }: { feature: Feature; aosDelay: number }) {
  return (
    <div className={`group ${feature.span}`} data-aos="fade-up" data-aos-duration="500" data-aos-delay={aosDelay}>
      <div
        className="relative h-52 overflow-hidden rounded-3xl shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-xl sm:h-56"
        style={{ backgroundImage: feature.gradient }}
      >
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.05]">
          {feature.illustration}
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/25">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <span className="text-[11px] font-bold text-white">{feature.badge}</span>
        </div>
      </div>

      <div className="relative px-1">
        <div
          className="-mt-6 ml-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:-translate-y-1"
          style={{ backgroundColor: feature.iconBg }}
        >
          {feature.icon}
        </div>
        <h3 className="mt-3 text-lg font-extrabold text-neutral-900 sm:text-xl">{feature.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{feature.desc}</p>
      </div>
    </div>
  );
}

// ── Komponen utama ────────────────────────────────────────────
export default function FeaturesSection() {
  return (
    <section id="fitur" className="bg-white py-24" style={FONT}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: `${COLORS.navy}99` }}
            data-aos="fade-up"
            data-aos-duration="500"
          >
            Fitur Kami
          </p>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: COLORS.navy }}
            data-aos="fade-up"
            data-aos-duration="500"
            data-aos-delay="60"
          >
            Semua yang Anda butuhkan untuk perjalanan yang lebih aman
          </h2>
          <p
            className="mx-auto mt-3 max-w-lg text-sm text-neutral-500 sm:text-base"
            data-aos="fade-up"
            data-aos-duration="500"
            data-aos-delay="120"
          >
            Dari memetakan risiko hingga menghubungkan Anda dengan admin —
            lima fitur inti SafeRoute bekerja bersama.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.slice(0, 3).map((f, i) => (
            <FeatureCard key={f.title} feature={f} aosDelay={i * 80} />
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.slice(3).map((f, i) => (
            <FeatureCard key={f.title} feature={f} aosDelay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}