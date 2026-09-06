"use client";

import { useEffect, useState } from "react";
import { Shield, Route as RouteIcon } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
});

interface SplashScreenProps {
  minDuration?: number;
  onFinish?: () => void;
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
      className={`${jakarta.variable} fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white font-sans transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
        exiting ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
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

        @keyframes ringExpand {
          0% {
            transform: scale(0.75);
            opacity: 0.55;
          }
          100% {
            transform: scale(2.1);
            opacity: 0;
          }
        }
        .ring-expand {
          animation: ringExpand 2.6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }
        .ring-expand-delay {
          animation: ringExpand 2.6s cubic-bezier(0.25, 0.1, 0.25, 1) 1.3s infinite;
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
            stroke-dashoffset: 340;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .route-draw {
          stroke-dasharray: 340;
          stroke-dashoffset: 340;
          animation: routeDraw 1.6s cubic-bezier(0.45, 0, 0.2, 1) 0.5s forwards;
        }

        @keyframes markerPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.25);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .marker-pop {
          animation: markerPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.9s backwards;
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
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }
        .shimmer-sweep {
          animation: shimmerSweep 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .logo-intro,
          .logo-breathe,
          .ring-expand,
          .ring-expand-delay,
          .glow-pulse,
          .route-draw,
          .marker-pop,
          .text-reveal,
          .text-reveal-delay,
          .progress-fill,
          .shimmer-sweep {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Subtle background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#0B2540 1px, transparent 1px),
                             linear-gradient(90deg, #0B2540 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />
      <div className="glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8930A]/10 blur-[100px]" />

      {/* Main content */}
      <div className="relative flex flex-col items-center px-6">
        {/* Logo */}
        <div className="logo-intro logo-breathe relative flex h-32 w-32 items-center justify-center">
          <span className="ring-expand absolute inset-0 rounded-[28px] border-2 border-[#0B2540]/15" />
          <span className="ring-expand-delay absolute inset-0 rounded-[28px] border-2 border-[#E8930A]/25" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#0B2540] via-[#123456] to-[#1a3a5c] shadow-xl shadow-[#0B2540]/25">
            <svg viewBox="0 0 64 64" className="h-11 w-11" fill="none">
              <path
                d="M10 50 C 20 46, 22 32, 34 26 S 50 16, 54 10"
                stroke="#E8930A"
                strokeWidth="4"
                strokeLinecap="round"
                className="route-draw"
              />
              <circle cx="10" cy="50" r="4.5" fill="#ffffff" />
              <g className="marker-pop" style={{ transformOrigin: "54px 10px" }}>
                <circle cx="54" cy="10" r="7" fill="#ffffff" />
                <circle cx="54" cy="10" r="7" stroke="#E8930A" strokeWidth="2" fill="none" />
              </g>
            </svg>
            <Shield
              size={13}
              strokeWidth={2.5}
              className="marker-pop absolute right-[15px] top-[4px] text-[#0B2540]"
              style={{ transformOrigin: "54px 10px" }}
            />

            {/* Shimmer sweep */}
            <div className="absolute inset-0 overflow-hidden rounded-[26px]">
              <div className="shimmer-sweep absolute inset-y-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
          </div>

          <RouteIcon
            size={0}
            className="hidden"
          />
        </div>

        {/* Brand name */}
        <div className="mt-8 text-center">
          <h1 className="text-reveal text-[44px] font-extrabold tracking-tight text-[#0B2540]">
            Safe<span className="bg-gradient-to-r from-[#E8930A] to-[#f0a836] bg-clip-text text-transparent">Route</span>
          </h1>
          <p className="text-reveal-delay mt-2.5 text-[13px] font-semibold tracking-wide text-[#0B2540]/45">
            Menuju tujuan, sepanjang jalan yang aman
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-12 flex w-52 flex-col items-center gap-3">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#0B2540]/8">
            <div className="progress-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0B2540] to-[#E8930A]" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.35em] text-[#0B2540]/30">
            MEMUAT
          </p>
        </div>
      </div>
    </div>
  );
}