"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/src/services/auth.service";
import { getToken, clearAuth } from "@/src/lib/tokenStorage";

export function RouteIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#0B2540]">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M6 9c0 3 12 3 12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function Navbar({ activePage }: { activePage?: "peta" | "lapor" | "chat" }) {
  
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const [navbarSearch, setNavbarSearch] = useState("");
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
      const handleScroll = () => {
        const scrollY = window.scrollY;
        setIsScrolled(scrollY > 20);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleNavbarSearch = async () => {
      if (!navbarSearch.trim()) return;
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            navbarSearch
          )}&limit=5&countrycodes=id`,
          { headers: { "User-Agent": "SafeRoute-NextJS" } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          router.push(`/home?lat=${item.lat}&lon=${item.lon}&zoom=15`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const loadUser = async () => {
          try {
            const res = await getCurrentUser();
            setUser(res.data);
            setIsLoading(false);
          } catch {
            clearAuth();
            router.replace("/login");
          }
        };
        loadUser();
      }, [router]);

    const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-[1000] flex h-16 shrink-0 items-center justify-between border-b px-6 transition-all duration-300 ${
          isScrolled 
           ? "bg-white/50 backdrop-blur-md shadow-md"
          : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <RouteIcon />
          <span className="text-xl font-bold tracking-tight text-[#0B2540]">
            SafeRoute
          </span>
        </div>

        <nav className="flex h-full items-center gap-8">
          <div className="relative flex h-full items-center">
            <Link href="/home" className={`text-sm hover:text-gray-900 ${activePage === "peta" ? "text-[#0B2540] font-bold" : "text-gray-500 font-medium"}`}>
              Peta
            </Link>
            {activePage === "peta" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B2540]" />}
          </div>
          
          <div className="relative flex h-full items-center">
            <Link href="/lapor" className={`text-sm hover:text-gray-900 ${activePage === "lapor" ? "text-[#0B2540] font-bold" : "text-gray-500 font-medium"}`}>
              Lapor
            </Link>
            {activePage === "lapor" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B2540]" />}
          </div>
          
          <div className="relative flex h-full items-center">
            <Link href="/chat" className={`text-sm hover:text-gray-900 ${activePage === "chat" ? "text-[#0B2540] font-bold" : "text-gray-500 font-medium"}`}>
              Chat
            </Link>
            {activePage === "chat" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B2540]" />}
          </div>
        </nav>

        <div className="flex items-center gap-5">
          <div className="relative hidden sm:flex items-center">
              <input
                type="text"
                placeholder="Cari lokasi tujuan..."
                value={navbarSearch}
                onChange={(e) => setNavbarSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNavbarSearch()}
                className={`w-56 rounded-full py-1.5 pl-4 pr-10 text-xs font-semibold text-neutral-700 outline-none transition-all focus:ring-2 focus:ring-[#0B2540]/20 focus:shadow-inner ${
                  isScrolled 
                    ? "bg-white/70 focus:bg-white border border-gray-200/50" 
                    : "bg-neutral-100 focus:bg-white"
                }`}
              />
              <button
                onClick={handleNavbarSearch}
                className="absolute right-3 text-neutral-400 hover:text-[#0B2540] transition-colors"
              >
                {loadingSuggestions ? (
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-neutral-300 border-t-[#0B2540]" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
         <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B2540]/10 text-[#0B2540] hover:bg-[#0B2540]/20 transition-colors"
              >
                <User className="h-5 w-5" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-100 bg-white p-2.5 shadow-xl ring-1 ring-black/5 z-[2000] animate-fade-in">
                  {user ? (
                    <>
                      <div className="px-3 py-2">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                          Masuk sebagai
                        </p>
                        <p className="text-xs font-bold text-neutral-800 truncate mt-0.5">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                      </div>
                      <hr className="my-1.5 border-neutral-100" />
                      <Link
                        href="/profile"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <User className="h-4 w-4 text-neutral-500" />
                        Profil Saya
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar Akun
                      </button>
                    </>
                  ) : (
                    <div className="p-1">
                      <p className="px-2.5 py-1.5 text-[11px] text-neutral-500 font-medium leading-relaxed">
                        Masuk untuk melaporkan insiden kriminalitas di sekitar Anda.
                      </p>
                      <Link
                        href="/login"
                        onClick={() => setShowUserDropdown(false)}
                        className="mt-2 block w-full rounded-xl bg-[#0B2540] py-2 text-center text-xs font-bold text-white hover:bg-[#0e2f52] transition-colors shadow-md shadow-[#0B2540]/10"
                      >
                        Masuk / Daftar
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </header>

      <div className="h-16" />
    </>
  );
}