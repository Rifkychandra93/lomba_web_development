"use client";

import { Nunito } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { Shield, Users, Route as RouteIcon } from "lucide-react";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

type Waypoint = {
  title: string;
  desc: string;
};

const waypoints: Waypoint[] = [
  {
    title: "Data terverifikasi ML",
    desc: "Bukan katanya-katanya. Tiap laporan disaring machine learning dulu sebelum tampil di peta.",
  },
  {
    title: "Update real-time",
    desc: "Titik rawan baru langsung masuk peta, tanpa nunggu laporan resmi turun.",
  },
  {
    title: "Rute teraman, otomatis",
    desc: "Sistem bandingkan tiap jalur dan kasih yang risikonya paling kecil, bukan cuma yang tercepat.",
  },
];

const ROUTE_SWITCH_INTERVAL = 3200;

function InteractiveRouteIllustration() {
  const [avoidRisk, setAvoidRisk] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setAvoidRisk((prev) => !prev);
    }, ROUTE_SWITCH_INTERVAL);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-visible rounded-[28px] border border-[#0B2540]/10 bg-white shadow-[0_20px_50px_-25px_rgba(11,37,64,0.35)]"
    >
      <style jsx>{`
        .route-line {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          transition: stroke-dashoffset 1.2s ease-out, opacity 0.5s ease-out;
        }
        .route-line.visible {
          stroke-dashoffset: 0;
        }
        .route-line.hidden-route {
          opacity: 0;
        }
        .pin {
          opacity: 0;
          transform: scale(0.5);
          transition: opacity 0.4s ease-out, transform 0.4s ease-out;
        }
        .pin.visible {
          opacity: 1;
          transform: scale(1);
        }
        .pin-pulse {
          animation: pulse 2.2s ease-in-out infinite;
          transform-origin: center;
        }
        .particle {
          animation: float 6s ease-in-out infinite;
        }
        .badge-float {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.45;
          }
          50% {
            transform: scale(2.1);
            opacity: 0;
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .route-line,
          .pin,
          .pin-pulse,
          .particle,
          .badge-float {
            transition: none !important;
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Particle decorations */}
      <div className="particle pointer-events-none absolute right-14 top-24 h-1.5 w-1.5 rounded-full bg-[#E8930A]/50" />
      <div
        className="particle pointer-events-none absolute right-16 bottom-16 h-2 w-2 rounded-full bg-[#0D5C4B]/30"
        style={{ animationDelay: "2.4s" }}
      />

      {/* Map SVG */}
      <svg viewBox="0 0 480 420" className="h-[420px] w-full">
        <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#0B254014" />
        </pattern>
        <rect width="480" height="420" fill="url(#dotGrid)" />

        {/* Background road */}
        <path
          d="M40 340 C 130 300, 150 200, 240 170 S 380 90, 440 60"
          stroke="#DCE2E6"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />

        {/* Main route */}
        <path
          d="M40 340 C 130 300, 150 200, 240 170 S 380 90, 440 60"
          className={`route-line stroke-[#E8930A] stroke-[4.5] ${isVisible ? "visible" : ""} ${
            avoidRisk ? "hidden-route" : ""
          }`}
          strokeLinecap="round"
          fill="none"
        />

        {/* Safe route (alternative) */}
        <path
          d="M40 340 C 90 260, 70 150, 190 120 S 360 40, 440 60"
          className={`route-line stroke-[#0D5C4B] stroke-[4.5] ${
            isVisible && avoidRisk ? "visible" : "hidden-route"
          }`}
          strokeLinecap="round"
          fill="none"
        />

        {/* Moving dot */}
        {isVisible && (
          <circle r="5" fill="#0B2540" opacity="0.9">
            <animateMotion
              dur="3.2s"
              repeatCount="indefinite"
              path={
                avoidRisk
                  ? "M40 340 C 90 260, 70 150, 190 120 S 360 40, 440 60"
                  : "M40 340 C 130 300, 150 200, 240 170 S 380 90, 440 60"
              }
            />
          </circle>
        )}

        {/* Start point */}
        <circle cx="40" cy="340" r="7" className={`pin fill-[#0B2540] ${isVisible ? "visible" : ""}`} />

        {/* Risk point */}
        <g className={`pin ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.25s" }}>
          <circle cx="240" cy="170" r="13" className="pin-pulse fill-[#E14B4B] opacity-40" />
          <circle
            cx="240"
            cy="170"
            r="8"
            fill={avoidRisk ? "#B8C0C7" : "#E14B4B"}
            stroke="white"
            strokeWidth="2.5"
            style={{ transition: "fill 0.4s ease-out" }}
          />
        </g>

        {/* Destination point */}
        <g className={`pin ${isVisible ? "visible" : ""}`} style={{ transitionDelay: "0.4s" }}>
          <circle cx="440" cy="60" r="9" fill="#0D5C4B" stroke="white" strokeWidth="2.5" />
        </g>
      </svg>

      {/* Badges - ALL MOVED TO BOTTOM */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-start gap-2">
        {/* Security Score Badge */}
        <div className="badge-float flex items-center gap-3 rounded-2xl border border-[#E2E6E9] bg-white px-3 py-2 shadow-md">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0D5C4B] opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0D5C4B]" />
          </span>
          <div>
            <p className="text-[8px] font-medium tracking-[0.06em] uppercase text-[#57687A]">
              Skor Keamanan
            </p>
            <p className="font-mono text-sm font-bold leading-none text-[#0B2540] transition-all duration-300">
              {avoidRisk ? "97" : "92"}
              <span className="text-[10px] font-medium text-[#57687A]">/100</span>
            </p>
          </div>
        </div>

        {/* Active Route Badge */}
        <div
          className="badge-float rounded-2xl border border-[#E2E6E9] bg-white px-3 py-2 shadow-md"
          style={{ animationDelay: "1s" }}
        >
          <p className="text-[8px] font-medium tracking-[0.06em] uppercase text-[#57687A]">
            Rute Aktif
          </p>
          <p
            className={`text-[11px] font-bold transition-colors duration-300 ${
              avoidRisk ? "text-[#0D5C4B]" : "text-[#E8930A]"
            }`}
          >
            {avoidRisk ? "Hindari Titik Rawan" : "Rute Tercepat"}
          </p>
        </div>

        {/* Reports Badge */}
        <div
          className="badge-float flex items-center gap-2 rounded-full border border-[#E2E6E9] bg-white px-3 py-1.5 shadow-md"
          style={{ animationDelay: "2s" }}
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8930A] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8930A]" />
          </span>
          <p className="text-[9px] font-semibold text-[#0B2540] whitespace-nowrap">
            1.284 laporan hari ini
          </p>
        </div>

        {/* Live Data Badge */}
        <div
          className="badge-float flex items-center gap-2 rounded-full border border-[#0D5C4B]/20 bg-white px-3 py-1.5 shadow-md"
          style={{ animationDelay: "0.5s" }}
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0D5C4B] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0D5C4B]" />
          </span>
          <p className="text-[9px] font-semibold text-[#0D5C4B] whitespace-nowrap">
            Data Real-time
          </p>
        </div>
      </div>
    </div>
  );
}

function Waypoints() {
  return (
    <div className="mt-7 space-y-5">
      {waypoints.map((wp, index) => (
        <div
          key={wp.title}
          data-aos="fade-up"
          data-aos-duration="500"
          data-aos-delay={220 + index * 100}
        >
          <p className="text-sm font-bold text-[#0B2540]">{wp.title}</p>
          <p className="mt-1 text-left text-[13.5px] leading-relaxed text-[#57687A]">{wp.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Compact inline stats (sits in the text column) ---------- */

type Stat = {
  icon: "shield" | "users" | "route";
  value: string;
  suffix?: string;
  label: string;
};

const stats: Stat[] = [
  { icon: "shield", value: "92", suffix: "/100", label: "Skor keamanan rata-rata" },
  { icon: "users", value: "1.284+", label: "Laporan terverifikasi" },
  { icon: "route", value: "50+", label: "Wilayah terpantau" },
];

function StatIcon({ type }: { type: Stat["icon"] }) {
  if (type === "shield") return <Shield size={16} strokeWidth={2} />;
  if (type === "users") return <Users size={16} strokeWidth={2} />;
  return <RouteIcon size={16} strokeWidth={2} />;
}

function StatsRow() {
  return (
    <div className="mt-8 grid grid-cols-3 gap-3">
      {stats.map((s, index) => (
        <div
          key={s.label}
          className="rounded-xl border border-[#0B2540]/10 bg-white px-3 py-3.5 shadow-sm"
          data-aos="fade-up"
          data-aos-duration="500"
          data-aos-delay={index * 100}
        >
          <div className="flex items-center gap-1.5 text-[#0D5C4B]">
            <StatIcon type={s.icon} />
          </div>
          <p className="mt-2 text-lg font-extrabold leading-none text-[#0B2540]">
            {s.value}
            {s.suffix && <span className="text-xs font-semibold text-[#57687A]">{s.suffix}</span>}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-[#57687A]">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function AboutSection() {
  return (
    <section
      className={`${nunito.variable} relative overflow-hidden bg-white py-24 font-sans`}
    >
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(#0B254014_1px,transparent_1px)] bg-[length:22px_22px] opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-start gap-16 md:grid-cols-2">
          {/* Left: illustration */}
          <div data-aos="fade-right" data-aos-duration="600">
            <InteractiveRouteIllustration />
          </div>

          {/* Right: all text content */}
          <div>
            <span
              className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[#0D5C4B]"
              data-aos="fade-up"
              data-aos-duration="500"
            >
              TENTANG SAFEROUTE
            </span>

            <h2
              className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-[#0B2540] md:text-[2.75rem]"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="80"
            >
              Rute paling aman, bukan cuma yang tercepat
            </h2>

            <p
              className="mt-5 text-left text-[15px] leading-relaxed text-[#57687A]"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="150"
            >
              SafeRoute menyaring ribuan laporan warga dan data keamanan lewat machine learning,
              lalu langsung menyarankan jalur paling aman ke tujuan Anda. Satu-satunya navigasi
              yang menomorsatukan keselamatan Anda, bukan cuma kecepatan.
            </p>

            <Waypoints />

            <StatsRow />

            {/* Button moved up - now sejajar dengan badge */}
            <div className="mt-8 flex items-center gap-4">
              <a
                href="#fitur"
                className="group inline-flex items-center gap-2 rounded-full bg-[#0B2540] px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:translate-x-1"
                data-aos="fade-up"
                data-aos-duration="500"
                data-aos-delay="550"
              >
                Lihat cara kerjanya
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <p className="text-xs text-[#57687A]">
                <span className="font-semibold text-[#0B2540]">100% gratis</span> • tanpa iklan
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}