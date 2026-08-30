"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = ["beranda", "fitur", "cara-kerja", "manfaat", "testimoni"];
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
    { id: "manfaat", label: "Keunggulan" },
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

function RouteIconNav({ scrolled }: { scrolled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={scrolled ? "text-[#0B2540]" : "text-white"}>
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M6 9c0 3 12 3 12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}