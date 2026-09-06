"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearAuth, getUser } from "@/src/lib/tokenStorage";

interface ReportItem {
  id: string;
  title: string;
  category: "KRIMINAL" | "KECELAKAAN" | "INFRASTRUKTUR";
  location: string;
  source: "Warga" | "Berita";
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

export default function AdminDashboard() {
  const router = useRouter();
  const userJson = getUser();
  const currentUser = userJson ? JSON.parse(userJson) : null;

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: "REP-001",
      title: "Tindak Pembegalan Motor",
      category: "KRIMINAL",
      location: "Jl. Kaliurang KM 14",
      source: "Warga",
      status: "PENDING",
    },
    {
      id: "REP-002",
      title: "Kecelakaan Lalu Lintas Beruntun",
      category: "KECELAKAAN",
      location: "Tol Dalam Kota KM 12",
      source: "Berita",
      status: "PENDING",
    },
    {
      id: "REP-003",
      title: "Jalan Berlubang Dalam",
      category: "INFRASTRUKTUR",
      location: "Jl. Raya Bogor",
      source: "Warga",
      status: "PENDING",
    },
  ]);

  const [filterCategory, setFilterCategory] = useState("Semua");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
        setShowNotifMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleApprove = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "VERIFIED" } : r))
    );
  };

  const handleReject = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r))
    );
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "Semua" || report.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 shrink-0 bg-[#0B172A] text-white flex flex-col justify-between p-5 z-20 border-r border-slate-800">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-600/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M6 9c0 3 12 3 12 6" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SafeRoute</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { name: "Dashboard", icon: DashboardIcon },
              { name: "Peta Risiko", icon: MapIcon },
              { name: "Laporan Masuk", icon: InboxIcon },
              { name: "Verifikasi", icon: ShieldIcon },
              { name: "Data Berita", icon: NewsIcon },
              { name: "Pengguna", icon: UsersIcon },
              { name: "Pengaturan", icon: SettingsIcon },
            ].map((item) => {
              const isActive = activeTab === item.name;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${isActive
                      ? "bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Card */}
        <div className="pt-4 border-t border-slate-800/80">
          <div
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0 border border-blue-400/30">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition">
                  {currentUser?.name || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Admin SafeRoute</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Keluar Akun"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition shrink-0"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP NAVBAR / HEADER */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Left: Search bar */}
          <div className="relative w-80">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Center: Title */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              SafeRoute Admin
            </h1>
          </div>

          {/* Right: Action Icons & Profile Dropdown */}
          <div className="flex items-center gap-4" ref={profileMenuRef}>
            {/* Notification Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu((prev) => !prev)}
                className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Notification Popover */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h4 className="text-xs font-bold text-slate-900">Notifikasi Baru</h4>
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      3 Baru
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-semibold text-slate-800">Laporan Baru: Kriminalitas</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Jl. Kaliurang KM 14 • 5 menit lalu</p>
                    </div>
                    <div className="p-2.5 rounded-xl hover:bg-slate-50 transition">
                      <p className="font-semibold text-slate-800">Rute Aman Diperbarui</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Area Sudirman • 1 jam lalu</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help Button */}
            <button className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 cursor-pointer">
              <HelpIcon className="w-5 h-5" />
            </button>

            {/* Profile Avatar Button */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200 outline-none cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-base">
                  {currentUser?.name ? currentUser.name[0].toUpperCase() : "A"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {currentUser?.name || "Admin"}
                  </p>
                  <p className="text-[11px] font-semibold text-blue-600">ADMIN</p>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      TERHUBUNG SEBAGAI
                    </p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {currentUser?.name || "Administrator"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser?.email || "admin@saferoute.com"}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-extrabold bg-blue-100 text-blue-700 rounded-md">
                      ROLE: {currentUser?.role || "ADMIN"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      Profil Saya
                    </Link>

                    <Link
                      href="/home"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <MapIcon className="w-4 h-4 text-slate-500" />
                      Halaman Website Utama
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      Keluar Akun
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="p-8 space-y-6">
          {/* --- TOP 4 STAT CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat Card 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  TOTAL LAPORAN
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900">1,284</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUpIcon className="w-3.5 h-3.5" />
                    +12%
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <DocumentClipboardIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  MENUNGGU VERIFIKASI
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900">42</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md">
                    URGENT
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ClockAlertIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  LAPORAN TERVERIFIKASI
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900">1,156</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUpIcon className="w-3.5 h-3.5" />
                    +5%
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  TITIK RISIKO AKTIF
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900">18</span>
                  <span className="text-xs font-semibold text-red-500 flex items-center gap-0.5">
                    <TrendingDownIcon className="w-3.5 h-3.5" />
                    -2%
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <WarningTriangleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* --- MIDDLE ROW: MAP DISTRIBUTION & RECENT ACTIVITY --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PETA SEBARAN RISIKO (2 COLUMNS) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Peta Sebaran Risiko</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filter:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-xs font-semibold text-blue-600 bg-blue-50/60 border border-blue-100 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="KRIMINAL">Kriminal</option>
                    <option value="KECELAKAAN">Kecelakaan</option>
                    <option value="INFRASTRUKTUR">Infrastruktur</option>
                  </select>
                </div>
              </div>

              {/* Map Preview Container */}
              <div className="relative w-full h-[310px] rounded-xl bg-[#091527] overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center group">
                {/* Visual Map Grid Graphic */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: `radial-gradient(#3B82F6 1px, transparent 1px), radial-gradient(#1E3A8A 1px, #091527 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Glowing Map Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 50 100 Q 200 50 350 180 T 600 220" stroke="#3B82F6" strokeWidth="2" fill="none" />
                  <path d="M 100 280 Q 300 200 500 120 T 700 80" stroke="#06B6D4" strokeWidth="2" fill="none" />
                </svg>

                {/* Interactive Map Pins */}
                <div className="absolute top-1/3 left-1/4 animate-bounce">
                  <div className="h-4 w-4 bg-emerald-500 rounded-full shadow-[0_0_12px_#10B981]" />
                </div>
                <div className="absolute top-1/2 left-2/5">
                  <div className="h-5 w-5 bg-amber-400 rounded-full shadow-[0_0_15px_#F59E0B]" />
                </div>
                <div className="absolute bottom-1/3 right-1/3 animate-pulse">
                  <div className="h-6 w-6 bg-red-500 rounded-full shadow-[0_0_20px_#EF4444] flex items-center justify-center text-white text-[10px] font-bold">
                    !
                  </div>
                </div>

                {/* Overlay Card UI (Matching Image) */}
                <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl shadow-2xl max-w-xs text-white">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded">
                      VERIFIED INCIDENT REPORT
                    </span>
                    <span className="h-5 w-5 bg-cyan-500 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs">
                      ✓
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 leading-snug">
                    Fire Incident - 5th Ave & 34th St. FDNY on scene. Avoid area.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                    <span>Time: 10:35 PM</span>
                    <span>Report ID: #98232</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AKTIVITAS TERBARU (1 COLUMN) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 mb-5">Aktivitas Terbaru</h3>

              <div className="space-y-4 flex-1">
                {[
                  {
                    icon: WarningTriangleIcon,
                    iconBg: "bg-red-50 text-red-500",
                    title: "Laporan baru: Pencurian di Jl. Margonda",
                    time: "2 menit lalu",
                  },
                  {
                    icon: ShieldCheckIcon,
                    iconBg: "bg-blue-50 text-blue-600",
                    title: "Moderator Andi memverifikasi laporan #882",
                    time: "15 menit lalu",
                  },
                  {
                    icon: MapIcon,
                    iconBg: "bg-emerald-50 text-emerald-600",
                    title: "Sistem menandai rute aman baru di Area Sudirman",
                    time: "1 jam lalu",
                  },
                  {
                    icon: WarningTriangleIcon,
                    iconBg: "bg-red-50 text-red-500",
                    title: "Laporan baru: Pohon tumbang di Jl. Thamrin",
                    time: "2 jam lalu",
                  },
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
                      <div className={`h-9 w-9 rounded-full ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                          {act.title}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">{act.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* --- BOTTOM DATA TABLE: LAPORAN MENUNGGU VERIFIKASI --- */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden p-6">
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-base font-bold text-slate-900">
                Laporan Menunggu Verifikasi
              </h3>

              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative w-64">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari laporan..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() =>
                    setFilterCategory((prev) =>
                      prev === "Semua" ? "KRIMINAL" : prev === "KRIMINAL" ? "KECELAKAAN" : "Semua"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <FilterIcon className="w-3.5 h-3.5 text-slate-500" />
                  Filter
                </button>

                {/* Export Button */}
                <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-sm">
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">JUDUL LAPORAN</th>
                    <th className="pb-3 px-3">KATEGORI</th>
                    <th className="pb-3 px-3">LOKASI</th>
                    <th className="pb-3 px-3">SUMBER</th>
                    <th className="pb-3 px-3">STATUS</th>
                    <th className="pb-3 px-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredReports.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-3 font-bold text-slate-800">{row.title}</td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold ${row.category === "KRIMINAL"
                              ? "bg-rose-100 text-rose-700"
                              : row.category === "KECELAKAAN"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-slate-600 font-medium">{row.location}</td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold ${row.source === "Warga"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-blue-100 text-blue-700"
                            }`}
                        >
                          {row.source}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${row.status === "PENDING"
                              ? "bg-amber-50 text-amber-600 border border-amber-200"
                              : row.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-rose-50 text-rose-600 border border-rose-200"
                            }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReport(row)}
                            title="Lihat Detail"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(row.id)}
                            title="Setujui"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(row.id)}
                            title="Tolak"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Detail Laporan</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <p><span className="font-bold">ID:</span> {selectedReport.id}</p>
              <p><span className="font-bold">Judul:</span> {selectedReport.title}</p>
              <p><span className="font-bold">Kategori:</span> {selectedReport.category}</p>
              <p><span className="font-bold">Lokasi:</span> {selectedReport.location}</p>
              <p><span className="font-bold">Sumber:</span> {selectedReport.source}</p>
              <p><span className="font-bold">Status:</span> {selectedReport.status}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- SVG ICONS --- */
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function NewsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <line x1="7" y1="8" x2="13" y2="8" />
      <line x1="7" y1="12" x2="13" y2="12" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendingDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function DocumentClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function ClockAlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function WarningTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
