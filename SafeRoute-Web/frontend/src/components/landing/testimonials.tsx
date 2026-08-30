"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

/**
 * ---------------------------------------------------------------------------
 * Types & data
 * ---------------------------------------------------------------------------
 */
interface Testimonial {
  name: string;
  role: string;
  text: string;
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Alvian Vino",
    role: "Karyawan Swasta",
    text: "Sebagai pekerja yang sering pulang malam, SafeRoute membuat perjalanan saya jauh lebih aman. Saya bisa tahu area yang harus dihindari dan memilih jalan yang lebih terang. Sangat direkomendasikan!",
    stars: 5,
  },
  {
    name: "Muhammad Putra A.",
    role: "Mahasiswa",
    text: "Notifikasi real-time dari komunitas sangat membantu. Saya jadi bisa menghindari area yang sedang ada keributan. Aplikasi wajib untuk mahasiswa.",
    stars: 5,
  },
  {
    name: "Muhammad Dean R.",
    role: "Pengendara Motor",
    text: "Sangat akurat dalam membaca kondisi jalanan malam. Saya bisa lebih tenang saat mengantarkan penumpang dan saya bisa fokus mengendarai.",
    stars: 5,
  },
  {
    name: "Siti Rahmawati",
    role: "Perawat Shift Malam",
    text: "Pulang shift malam dari rumah sakit dulu selalu bikin was-was. Sekarang saya selalu cek tingkat risiko rute dulu sebelum jalan, rasanya jauh lebih tenang.",
    stars: 5,
  },
];

// Digandakan sekali untuk menciptakan loop tak terputus — begitu set pertama
// habis, set kedua yang identik langsung menyambung tanpa jeda yang terlihat.
const LOOP_ITEMS: Testimonial[] = [...TESTIMONIALS, ...TESTIMONIALS];

/**
 * ---------------------------------------------------------------------------
 * Hook kecil
 * ---------------------------------------------------------------------------
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/**
 * ---------------------------------------------------------------------------
 * Sub-komponen
 * ---------------------------------------------------------------------------
 */
function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t, ariaHidden = false }: { t: Testimonial; ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className="relative flex w-[300px] shrink-0 flex-col rounded-2xl border border-neutral-200/80 bg-white p-7 text-left shadow-md shadow-neutral-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/80 sm:w-[360px]"
    >
      <Quote className="absolute right-5 top-5 text-[#0B2540]/5" size={40} strokeWidth={1.5} fill="currentColor" />
      <StarRow count={t.stars} />
      <p className="relative mt-4 line-clamp-5 min-h-[110px] text-sm leading-relaxed text-neutral-600 italic">
        &ldquo;{t.text}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B2540] text-xs font-bold text-white">
          {t.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
          <p className="text-xs text-neutral-400">{t.role}</p>
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
export default function TestimonialsSection() {
  const reducedMotion = usePrefersReducedMotion();
  const duration = `${TESTIMONIALS.length * 7}s`;

  return (
    <section id="testimoni" className="bg-white py-24">
      <style>{`
        @keyframes sr-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .sr-marquee-track {
          animation: sr-marquee ${duration} linear infinite;
        }
        .sr-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .sr-marquee-track {
            animation: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#0B2540]">Apa Kata Pengguna</h2>
        <p className="mt-3 text-sm text-neutral-500">
          Dipercaya oleh ribuan pengguna untuk perjalanan yang lebih aman setiap hari.
        </p>
      </div>

      <div
        className="relative mt-14 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        {reducedMotion ? (
          <div className="flex gap-6 overflow-x-auto px-6 pb-2">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} t={t} />
            ))}
          </div>
        ) : (
          <div className="sr-marquee-track flex w-max gap-6 px-3">
            {LOOP_ITEMS.map((t, i) => (
              <TestimonialCard key={`${t.name}-${i}`} t={t} ariaHidden={i >= TESTIMONIALS.length} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}