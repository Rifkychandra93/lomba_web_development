"use client";

import { useEffect, useState } from "react";
import { Quote, BadgeCheck } from "lucide-react";

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

// Satu warna aksen konsisten untuk semua kartu, mengikuti warna utama SafeRoute.
const ACCENT = "#0B2540";

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
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#E8930A">
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
      className="group relative flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-7 pt-6 text-left shadow-md shadow-neutral-200/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-neutral-200/80 sm:w-[360px]"
    >
      {/* garis aksen di atas kartu */}
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: ACCENT }} />

      {/* blob lembut di belakang tanda kutip */}
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06] transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundColor: ACCENT }}
      />
      <Quote
        className="relative self-start"
        size={30}
        strokeWidth={0}
        fill={ACCENT}
        fillOpacity={0.12}
      />

      <StarRow count={t.stars} />

      <p className="relative mt-4 line-clamp-5 min-h-[110px] text-sm leading-relaxed text-neutral-600 italic">
        &ldquo;{t.text}&rdquo;
      </p>

      <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: ACCENT }}
        >
          {t.name.charAt(0)}
        </div>
        <div>
          <p className="flex items-center gap-1 text-sm font-semibold text-neutral-900">
            {t.name}
            <BadgeCheck size={14} strokeWidth={2.4} color={ACCENT} />
          </p>
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
        @keyframes sr-cta-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .sr-cta-float { animation: sr-cta-float 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sr-marquee-track, .sr-cta-float {
            animation: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#0D5C4B]">
          Apa kata mereka
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B2540]">Apa Kata Pengguna</h2>
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

      {/* CTA ajakan memakai aplikasi - lebar penuh, tidak terlalu tinggi */}
      <div className="mx-auto mt-16 max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2540] to-[#0D5C4B] px-8 py-10 text-center sm:px-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <span className="sr-cta-float pointer-events-none absolute -left-6 top-8 hidden h-16 w-16 rounded-full bg-white/15 sm:block" />
          <span className="sr-cta-float pointer-events-none absolute -right-4 bottom-6 hidden h-24 w-24 rounded-full bg-white/10 sm:block" style={{ animationDelay: "1.2s" }} />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Giliran Anda
            </p>
            <h3 className="mx-auto mt-3 max-w-xl text-2xl font-bold leading-snug text-white md:text-3xl">
              Jangan tunggu sampai terjadi apa-apa di jalan
            </h3>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/80">
              Gabung dengan ribuan pengguna lain, pilih rute paling aman, dan bantu sesama warga
              lewat laporan Anda. Semuanya gratis dan bisa dimulai sekarang.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#cara-kerja"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#0B2540] transition-transform duration-200 hover:translate-x-1"
              >
                Mulai Gunakan SafeRoute
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
              <a
                href="#manfaat"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
              >
                Lihat Keunggulannya
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}