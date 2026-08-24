"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = ["beranda", "fitur", "cara-kerja", "testimoni"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const links = [
    { id: "beranda", label: "Beranda" },
    { id: "fitur", label: "Fitur" },
    { id: "cara-kerja", label: "Cara Kerja" },
    { id: "testimoni", label: "Testimoni" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/75 backdrop-blur-md shadow-md"
          : "bg-transparent"
        }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#beranda" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <RouteIconNav scrolled={scrolled} />
          <span className={scrolled ? "text-[#0B2540]" : "text-white"}>SafeRoute</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${activeSection === l.id
                  ? scrolled
                    ? "text-[#0B2540]"
                    : "text-white"
                  : scrolled
                    ? "text-neutral-500 hover:text-[#0B2540]"
                    : "text-neutral-300 hover:text-white"
                }`}
            >
              {l.label}
              <span
                className={`absolute bottom-0 left-1/2 h-0.5 rounded-full bg-[#0B2540] transition-all duration-300 ${activeSection === l.id
                    ? "w-6 -translate-x-1/2 opacity-100"
                    : "w-0 -translate-x-1/2 opacity-0"
                  } ${!scrolled && activeSection === l.id ? "bg-white" : ""}`}
              />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className={`rounded-xl border px-5 py-2 text-sm font-semibold transition-all duration-300 ${scrolled
                ? "border-[#0B2540] text-[#0B2540] hover:bg-[#0B2540] hover:text-white"
                : "border-white/60 text-white hover:bg-white/10"
              }`}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-[#0B2540] px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0e2f52] hover:shadow-lg hover:shadow-[#0B2540]/20"
          >
            Register
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d={mobileOpen ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"}
              stroke={scrolled ? "#0B2540" : "white"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-white px-6 pb-4 pt-2 md:hidden">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${activeSection === l.id ? "text-[#0B2540] bg-[#0B2540]/5" : "text-neutral-600"
                }`}
            >
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex gap-2">
            <Link href="/login" className="flex-1 rounded-xl border border-[#0B2540] py-2.5 text-center text-sm font-semibold text-[#0B2540]">Login</Link>
            <Link href="/register" className="flex-1 rounded-xl bg-[#0B2540] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#0e2f52]">Register</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <Footer />
    </>
  );
}

function HeroSection() {
  return (
    <section id="beranda" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/hero-city.png" alt="City" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2540]/90 via-[#0B2540]/70 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-32 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Temukan Jalur Teraman Untuk Perjalanan Anda.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-300">
            Navigasi cerdas yang tidak hanya mencari jalan tercepat, namun juga jalan teraman berdasarkan data kriminalitas, penerangan jalan, dan laporan warga real-time.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="group flex items-center gap-2 rounded-xl bg-[#0B2540] border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0e2f52]">
              Mulai Navigasi
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <a href="#fitur" className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="2" /></svg>
              Lihat Peta Keamanan
            </a>
          </div>
        </div>
        <div className="hidden md:flex justify-end">
          <div className="w-[380px] overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl shadow-black/40">
            <Image src="/map-preview.png" alt="Peta Keamanan" width={380} height={280} className="w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl">
          <Image src="/about-people.png" alt="Pengguna SafeRoute" width={520} height={400} className="w-full object-cover" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0B2540] md:text-4xl">Tentang SafeRoute</h2>
          <p className="mt-5 text-sm leading-relaxed text-neutral-600">
            Di dunia yang bergerak serba cepat, keamanan seringkali menjadi perhatian kedua. SafeRoute hadir untuk mengubah paradigma tersebut. Kami percaya bahwa setiap langkah perjalanan Anda harus diiringi dengan rasa tenang.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            Sistem cerdas kami secara kontinu menganalisis ribuan titik data keamanan — mulai dari kriminalitas hingga jalur terpencil — untuk menyajikan rute terbaik. Bersama SafeRoute, Anda tidak hanya sampai tujuan, tapi tiba dengan aman.
          </p>
          <a href="#fitur" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5C4B] hover:underline">
            Pelajari Lebih Lanjut
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: "realtime", title: "Data Real-time", desc: "Informasi kejadian dan kondisi diperbarui secara langsung." },
  { icon: "report", title: "Lapor Cepat", desc: "Laporkan kejadian Anda dalam detik lengkap dengan foto dan lokasi." },
  { icon: "verify", title: "Verifikasi & Moderasi", desc: "Setiap laporan melewati proses verifikasi sebelum ditampilkan." },
  { icon: "community", title: "Komunitas Aman", desc: "Jaringan keamanan kolektif dari laporan warga yang terverifikasi." },
];

function FeaturesSection() {
  return (
    <section id="fitur" className="bg-neutral-50 py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0B2540]/60">Kenapa SafeRoute</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B2540]">Manfaat yang Anda Dapatkan</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-500">SafeRoute membantu Anda melakukan perjalanan lebih aman dengan informasi terverifikasi dan real-time.</p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-neutral-200 bg-white p-7 text-left transition-all duration-300 hover:shadow-xl hover:shadow-[#0B2540]/5 hover:-translate-y-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2540]/5 text-[#0B2540] transition-colors group-hover:bg-[#0B2540] group-hover:text-white">
                <FeatureIcon type={f.icon} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { num: "1", icon: "search", title: "Cari Lokasi", desc: "Masukkan destinasi Anda dan dapatkan rute dengan analisis keamanan." },
  { num: "2", icon: "risk", title: "Lihat Risiko", desc: "Setiap rute menampilkan informasi risiko keamanan berdasarkan data real-time." },
  { num: "3", icon: "alert", title: "Lapor Kejadian", desc: "Bantu pengguna lain dengan melaporkan insiden keamanan di sekitar Anda." },
];

function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#0B2540]">Cara Kerja SafeRoute</h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B2540]/5 text-[#0B2540]">
                <StepIcon type={s.icon} />
              </div>
              <p className="text-lg font-bold text-[#0B2540]">{s.num}. {s.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Alvian Vino", role: "Karyawan Swasta", text: "Sebagai pekerja yang sering pulang malam, SafeRoute membuat perjalanan saya jauh lebih aman. Saya bisa tahu area yang harus dihindari dan memilih jalan yang lebih terang. Sangat direkomendasikan!", stars: 5 },
  { name: "Muhammad Putra A.", role: "Mahasiswa", text: "Notifikasi real-time dari komunitas sangat membantu. Saya jadi bisa menghindari area yang sedang ada keributan. Aplikasi wajib untuk mahasiswa.", stars: 5 },
  { name: "Muhammad Dean R.", role: "Pengendara Motor", text: "Sangat akurat dalam membaca kondisi jalanan malam. Saya bisa lebih tenang saat mengantarkan penumpang dan saya bisa fokus mengendarai.", stars: 5 },
];

function TestimonialsSection() {
  return (
    <section id="testimoni" className="bg-neutral-50 py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#0B2540]">Apa Kata Pengguna</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-neutral-200 bg-white p-7 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B2540] text-xs font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                  <p className="text-xs text-neutral-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-neutral-400 md:flex-row">
        <p>&copy; {new Date().getFullYear()} SafeRoute. Melindungi Langkah Anda.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-neutral-700 transition">Kebijakan Privasi</a>
          <a href="#" className="hover:text-neutral-700 transition">Syarat &amp; Ketentuan</a>
        </div>
      </div>
    </footer>
  );
}

function RouteIconNav({ scrolled }: { scrolled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={scrolled ? "text-[#0B2540]" : "text-white"}>
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M6 9c0 3 12 3 12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: string }) {
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "realtime") return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
  if (type === "report") return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" /></svg>;
  if (type === "verify") return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
  return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
}

function StepIcon({ type }: { type: string }) {
  const props = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "search") return <svg {...props}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
  if (type === "risk") return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>;
  return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></svg>;
}