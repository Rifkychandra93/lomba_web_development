"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  minDuration?: number;
  onFinish?: () => void;
}

/** Ikon yang sama persis dengan yang dipakai di Navbar — dua lingkaran terhubung jalur melengkung. */
function RouteIconLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="relative h-full w-full text-[#0B2540]">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" className="marker-pop" />
      <path
        id="splashRoutePath"
        d="M6 9c0 3 12 3 12 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="route-draw"
      />
      <circle
        cx="18"
        cy="18"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
        className="marker-pop-delay"
        style={{ transformOrigin: "18px 18px" }}
      />
      {/* titik yang berjalan di sepanjang jalur, memberi kesan hidup */}
      <circle r="1.4" fill="#E8930A" className="dot-travel" opacity="0">
        <animateMotion
          dur="1.8s"
          begin="1.6s"
          repeatCount="indefinite"
          path="M6 9c0 3 12 3 12 6"
        />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.8s" begin="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export default function SplashScreen({ minDuration = 2200, onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), minDuration);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, minDuration + 700);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [minDuration, onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-white font-sans transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
        exiting ? "scale-105 opacity-0 blur-sm" : "scale-100 opacity-100 blur-0"
      }`}
      role="status"
      aria-label="Memuat SafeRoute"
    >
      <style jsx>{`
        @keyframes logoIntro {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(14px);
          }
          60% {
            opacity: 1;
            transform: scale(1.04) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .logo-intro {
          animation: logoIntro 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes logoBreathe {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .logo-breathe {
          animation: logoBreathe 3.4s ease-in-out 0.9s infinite;
        }

        @keyframes ringSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .ring-spin {
          animation: ringSpin 7s linear infinite;
        }

        @keyframes ringExpand {
          0% {
            transform: scale(0.75);
            opacity: 0.55;
          }
          100% {
            transform: scale(2.3);
            opacity: 0;
          }
        }
        .ring-expand {
          animation: ringExpand 2.6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }

        @keyframes auroraDrift {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, -16px) scale(1.08);
          }
        }
        .aurora-a {
          animation: auroraDrift 9s ease-in-out infinite;
        }
        .aurora-b {
          animation: auroraDrift 11s ease-in-out infinite reverse;
        }

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.08);
          }
        }
        .glow-pulse {
          animation: glowPulse 3.4s ease-in-out infinite;
        }

        @keyframes routeDraw {
          from {
            stroke-dashoffset: 30;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .route-draw {
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: routeDraw 1s cubic-bezier(0.45, 0, 0.2, 1) 0.5s forwards;
        }

        @keyframes markerPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .marker-pop {
          transform-origin: 6px 6px;
          animation: markerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards;
        }
        .marker-pop-delay {
          animation: markerPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.4s backwards;
        }

        @keyframes textReveal {
          from {
            opacity: 0;
            transform: translateY(10px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .text-reveal {
          animation: textReveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.7s backwards;
        }
        .text-reveal-delay {
          animation: textReveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.95s backwards;
        }

        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .progress-fill {
          animation: progressFill ${minDuration - 300}ms cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
        }

        @keyframes shimmerSweep {
          0% {
            transform: translateX(-140%);
          }
          100% {
            transform: translateX(240%);
          }
        }
        .shimmer-sweep {
          animation: shimmerSweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes dotFade {
          0%,
          100% {
            opacity: 0.25;
          }
          50% {
            opacity: 1;
          }
        }
        .dot-1 {
          animation: dotFade 1.4s ease-in-out infinite;
        }
        .dot-2 {
          animation: dotFade 1.4s ease-in-out 0.2s infinite;
        }
        .dot-3 {
          animation: dotFade 1.4s ease-in-out 0.4s infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .logo-intro,
          .logo-breathe,
          .ring-spin,
          .ring-expand,
          .aurora-a,
          .aurora-b,
          .glow-pulse,
          .route-draw,
          .marker-pop,
          .marker-pop-delay,
          .text-reveal,
          .text-reveal-delay,
          .progress-fill,
          .shimmer-sweep,
          .dot-1,
          .dot-2,
          .dot-3 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>

      {/* Latar aurora — dua gumpalan cahaya lembut yang bergerak pelan, kesan lebih premium */}
      <div className="aurora-a pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[#0B2540]/[0.06] blur-[90px]" />
      <div className="aurora-b pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-[#E8930A]/[0.08] blur-[100px]" />

      {/* Grid halus */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#0B2540 1px, transparent 1px),
                             linear-gradient(90deg, #0B2540 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />
      <div className="glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0B2540]/5 blur-[100px]" />

      {/* Main content */}
      <div className="relative flex flex-col items-center px-6">
        {/* Logo — sama persis dengan ikon di Navbar, ditambah cincin berputar & efek berdenyut */}
        <div className="logo-intro logo-breathe relative flex h-16 w-16 items-center justify-center">
          <span className="ring-expand absolute inset-0 rounded-full border-2 border-[#0B2540]/15" />
          <span
            className="ring-spin absolute -inset-3 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(11,37,64,0.18) 18%, transparent 40%, transparent 60%, rgba(232,147,10,0.22) 78%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
              maskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            }}
          />
          <RouteIconLogo />
        </div>

        {/* Brand name — satu warna, sama seperti wordmark di Navbar */}
        <div className="mt-7 text-center">
          <h1 className="text-reveal text-[38px] font-bold tracking-tight text-[#0B2540] drop-shadow-sm">
            SafeRoute
          </h1>
          <p className="text-reveal-delay mt-2.5 text-[13px] font-medium tracking-wide text-[#0B2540]/45">
            Menuju tujuan, sepanjang jalan yang aman
          </p>
        </div>

        {/* Progress bar dengan efek shimmer */}
        <div className="mt-12 flex w-52 flex-col items-center gap-3">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#0B2540]/8">
            <div className="progress-fill absolute inset-y-0 left-0 overflow-hidden rounded-full bg-[#0B2540]">
              <div className="shimmer-sweep absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
          <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.35em] text-[#0B2540]/30">
            MEMUAT
            <span className="flex gap-0.5 normal-case tracking-normal">
              <span className="dot-1 h-1 w-1 rounded-full bg-[#0B2540]/40" />
              <span className="dot-2 h-1 w-1 rounded-full bg-[#0B2540]/40" />
              <span className="dot-3 h-1 w-1 rounded-full bg-[#0B2540]/40" />
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}