"use client";

import { useState, useRef, useEffect, useMemo, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearAuth, getUser } from "@/src/lib/tokenStorage";
import { getAllReports, updateReportStatus } from "@/src/services/report.service";
import { getAllIncidents } from "@/src/services/incident.service";
import dynamic from "next/dynamic";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminRiskMap = dynamic(
  () => import("./AdminRiskMap"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#091527] animate-pulse rounded-xl" /> }
);

const AdminDashboardMapPreview = dynamic(
  () => import("./AdminDashboardMapPreview"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#091527] animate-pulse rounded-xl" /> }
);

const AdminLaporanMasuk = dynamic(
  () => import("./AdminLaporanMasuk"),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse" /> }
);

const AdminDataBerita = dynamic(
  () => import("./AdminDataBerita"),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse" /> }
);

const AdminPengguna = dynamic(
  () => import("./AdminPengguna"),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse" /> }
);

interface ReportItem {
  id: string;
  title: string;
  category: "KRIMINAL" | "KECELAKAAN" | "INFRASTRUKTUR";
  location: string;
  source: "Warga" | "Berita";
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

/**
 * Normalized shape used only to derive stats / charts / activity feed.
 * Combines reports + incidents so the dashboard visuals reflect real data
 * instead of hardcoded numbers.
 *
 * NOTE: `createdAt` is read defensively from a few common field names
 * (see `extractDate`). If your API uses a different field name, add it
 * there — everything downstream (trend %, line chart, activity feed)
 * updates automatically.
 */
interface RawRecord {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string | null;
  kind: "report" | "incident";
}

const CATEGORY_LABELS: Record<string, string> = {
  KRIMINAL: "Kriminalitas / Pencegahan",
  INFRASTRUKTUR: "Fasilitas & Infrastruktur",
  KECELAKAAN: "Kecelakaan",
};

const CATEGORY_COLORS: Record<string, string> = {
  KRIMINAL: "#e11d48",
  INFRASTRUKTUR: "#1e3a8a",
  KECELAKAAN: "#f59e0b",
};

function extractDate(obj: any): string | null {
  const raw =
    obj?.createdAt ?? obj?.created_at ?? obj?.reportedAt ?? obj?.tanggal ?? obj?.date ?? obj?.timestamp ?? null;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${Math.floor(diffHours / 24)} hari lalu`;
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

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [rawRecords, setRawRecords] = useState<RawRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    activeRisks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "year">("7d");

  const [filterCategory, setFilterCategory] = useState("Semua");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Fetch real data for pending verification reports and dashboard stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resReports, resIncidents] = await Promise.all([getAllReports(), getAllIncidents()]);

        const rawReportItems = resReports.success && resReports.data ? resReports.data : [];
        const rawIncidentItems = resIncidents.success && resIncidents.data ? resIncidents.data : [];

        // Normalized records power every derived stat/chart below
        const reportRecords: RawRecord[] = rawReportItems.map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.incidentType,
          status: r.status,
          createdAt: extractDate(r),
          kind: "report",
        }));
        const incidentRecords: RawRecord[] = rawIncidentItems.map((i: any) => ({
          id: i.id,
          title: i.title || i.description || "Titik risiko terdeteksi sistem",
          category: i.category || i.incidentType || "INFRASTRUKTUR",
          status: i.status || "PROCESSED",
          createdAt: extractDate(i),
          kind: "incident",
        }));
        setRawRecords([...reportRecords, ...incidentRecords]);

        // Bottom table only shows reports still awaiting verification
        const pendingTable: ReportItem[] = rawReportItems
          .filter((rep: any) => rep.status === "PENDING")
          .map((rep: any) => ({
            id: rep.id,
            title: rep.title,
            category: rep.incidentType,
            location: rep.address || rep.location || "Lokasi tidak diketahui",
            source: "Warga",
            status: rep.status,
          }));
        setReports(pendingTable);

        const pendingCount = reportRecords.filter((r) => r.status === "PENDING").length;
        const verifiedReportCount = reportRecords.filter(
          (r) => r.status === "VERIFIED" || r.status === "TERVERIFIKASI"
        ).length;
        const activeRiskCount = incidentRecords.filter((i) => i.status !== "RESOLVED").length;

        setStats({
          total: reportRecords.length + incidentRecords.length,
          pending: pendingCount,
          verified: verifiedReportCount + incidentRecords.length,
          activeRisks: activeRiskCount,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
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

  const handleApprove = async (id: string) => {
    try {
      await updateReportStatus(id, "VERIFIED");
      setReports((prev) => prev.filter((r) => r.id !== id));
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        verified: prev.verified + 1,
      }));
      setRawRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "VERIFIED" } : r)));
    } catch (err) {
      console.error("Failed to approve report", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateReportStatus(id, "REJECTED");
      setReports((prev) => prev.filter((r) => r.id !== id));
      setStats((prev) => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
      setRawRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r)));
    } catch (err) {
      console.error("Failed to reject report", err);
    }
  };

  const handleBroadcastNotification = () => {
    // TODO: wire up to a real broadcast-notification endpoint when available.
    console.log("Broadcast triggered for", stats.activeRisks, "active risk points");
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "Semua" || report.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ---- Derived visuals (all computed from rawRecords, i.e. real fetched data) ----

  const hasDatedRecords = useMemo(() => rawRecords.some((r) => r.createdAt), [rawRecords]);

  const totalTrend = useMemo(() => {
    const dated = rawRecords.filter((r) => r.createdAt);
    if (dated.length === 0) return null;
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = dated.filter((r) => now - new Date(r.createdAt!).getTime() <= week).length;
    const prevWeek = dated.filter((r) => {
      const age = now - new Date(r.createdAt!).getTime();
      return age > week && age <= week * 2;
    }).length;
    if (prevWeek === 0) return thisWeek > 0 ? { percent: 100, up: true } : null;
    const change = Math.round(((thisWeek - prevWeek) / prevWeek) * 100);
    return { percent: Math.abs(change), up: change >= 0 };
  }, [rawRecords]);

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    rawRecords.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    const total = rawRecords.length || 1;
    return Object.keys(CATEGORY_LABELS).map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      color: CATEGORY_COLORS[key],
      value: counts[key] || 0,
      percent: Math.round(((counts[key] || 0) / total) * 100),
    }));
  }, [rawRecords]);

  const verifiedOrHandledCount = useMemo(
    () =>
      rawRecords.filter((r) => r.kind === "incident" || r.status === "VERIFIED" || r.status === "TERVERIFIKASI")
        .length,
    [rawRecords]
  );
  const resolvedCount = useMemo(() => rawRecords.filter((r) => r.status === "RESOLVED").length, [rawRecords]);

  const trendChartData = useMemo(() => {
    const dated = rawRecords.filter((r) => r.createdAt);
    const now = new Date();
    const buckets: { label: string; start: number; end: number }[] = [];

    if (trendRange === "year") {
      for (let m = 0; m < 12; m++) {
        const start = new Date(now.getFullYear(), m, 1).getTime();
        const end = new Date(now.getFullYear(), m + 1, 1).getTime();
        buckets.push({ label: new Date(start).toLocaleDateString("id-ID", { month: "short" }), start, end });
      }
    } else {
      const days = trendRange === "7d" ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const day = new Date(now);
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - i);
        const start = day.getTime();
        const end = start + 24 * 60 * 60 * 1000;
        buckets.push({
          label: day.toLocaleDateString(
            "id-ID",
            days === 7 ? { weekday: "short" } : { day: "numeric", month: "short" }
          ),
          start,
          end,
        });
      }
    }

    let cumMasuk = 0;
    let cumVerifikasi = 0;
    let cumSelesai = 0;

    return buckets.map((bucket) => {
      const inBucket = dated.filter((r) => {
        const t = new Date(r.createdAt!).getTime();
        return t >= bucket.start && t < bucket.end;
      });
      cumMasuk += inBucket.length;
      cumVerifikasi += inBucket.filter(
        (r) => r.kind === "incident" || r.status === "VERIFIED" || r.status === "TERVERIFIKASI"
      ).length;
      cumSelesai += inBucket.filter((r) => r.status === "RESOLVED").length;
      return { label: bucket.label, masuk: cumMasuk, verifikasi: cumVerifikasi, selesai: cumSelesai };
    });
  }, [rawRecords, trendRange]);

  const recentActivity = useMemo(() => {
    return [...rawRecords]
      .filter((r) => r.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 4)
      .map((r) => {
        const isVerified = r.status === "VERIFIED" || r.status === "TERVERIFIKASI";
        const isResolved = r.status === "RESOLVED";
        return {
          id: r.id,
          icon: isResolved || isVerified ? ShieldCheckIcon : WarningTriangleIcon,
          iconBg: isResolved ? "bg-emerald-50 text-emerald-600" : isVerified ? "bg-blue-50 text-blue-900" : "bg-rose-50 text-rose-500",
          title: isResolved
            ? `Titik risiko selesai ditangani: ${r.title}`
            : isVerified
            ? `Laporan terverifikasi: ${r.title}`
            : `Laporan baru: ${r.title}`,
          time: timeAgo(r.createdAt),
        };
      });
  }, [rawRecords]);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 shrink-0 bg-[#0B172A] text-white flex flex-col justify-between p-5 z-20 border-r border-slate-800">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-900 text-white font-bold text-lg shadow-md shadow-blue-900/30">
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
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-blue-900 text-white shadow-lg shadow-blue-900/30 font-semibold"
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
              <div className="h-9 w-9 rounded-full bg-blue-900 flex items-center justify-center font-bold text-white text-sm shrink-0 border border-blue-400/30">
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
          {/* Left: Title & Subtitle OR Search Bar */}
          <div className="flex flex-col">
            {activeTab === "Laporan Masuk" ? (
              <>
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Laporan Masuk</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Kelola dan tinjau laporan yang perlu diverifikasi</p>
              </>
            ) : (
              <div className="relative w-80">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-900 focus:bg-white transition"
                />
              </div>
            )}
          </div>

          {/* Center: Title (Only if not Laporan Masuk) */}
          {activeTab !== "Laporan Masuk" && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">SafeRoute Admin</h1>
            </div>
          )}

          {/* Right: Action Icons & Profile Dropdown */}
          <div className="flex items-center gap-4" ref={profileMenuRef}>
            {/* Search Bar on Right for Laporan Masuk */}
            {activeTab === "Laporan Masuk" && (
              <div className="relative w-64 mr-2 hidden md:block">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari laporan..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-900 focus:bg-white transition"
                />
              </div>
            )}
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
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full">
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
                <div className="h-10 w-10 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-base">
                  {currentUser?.name ? currentUser.name[0].toUpperCase() : "A"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{currentUser?.name || "Admin"}</p>
                  <p className="text-[11px] font-semibold text-blue-900">ADMIN</p>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TERHUBUNG SEBAGAI</p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {currentUser?.name || "Administrator"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser?.email || "admin@saferoute.com"}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-extrabold bg-blue-100 text-blue-900 rounded-md">
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
        {activeTab === "Laporan Masuk" ? (
          <AdminLaporanMasuk />
        ) : activeTab === "Data Berita" ? (
          <AdminDataBerita />
        ) : activeTab === "Pengguna" ? (
          <AdminPengguna />
        ) : activeTab === "Peta Risiko" ? (
          <main className="flex-1 flex flex-col p-4 overflow-hidden h-full">
            <AdminRiskMap />
          </main>
        ) : (
          <main className="p-8 space-y-6">
            {/* --- TOP 4 STAT CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                label="TOTAL LAPORAN"
                value={isLoading ? "..." : stats.total.toLocaleString()}
                icon={DocumentClipboardIcon}
                iconBg="bg-blue-50 text-blue-900"
                meta={
                  totalTrend && (
                    <span
                      className={`flex items-center gap-0.5 text-[11px] font-bold ${
                        totalTrend.up ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {totalTrend.up ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                      {totalTrend.percent}% mg lalu
                    </span>
                  )
                }
              />
              <StatCard
                label="MENUNGGU VERIFIKASI"
                value={isLoading ? "..." : stats.pending.toLocaleString()}
                icon={ClockAlertIcon}
                iconBg="bg-amber-50 text-amber-600"
                meta={
                  <span className="text-[11px] font-semibold text-slate-400">
                    {stats.pending === 0 ? "Semua tuntas ditinjau" : `${stats.pending} perlu tindakan`}
                  </span>
                }
              />
              <StatCard
                label="LAPORAN TERVERIFIKASI"
                value={isLoading ? "..." : stats.verified.toLocaleString()}
                icon={ShieldCheckIcon}
                iconBg="bg-emerald-50 text-emerald-600"
                meta={
                  <span className="text-[11px] font-semibold text-slate-400">
                    {stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}% valid` : "—"}
                  </span>
                }
              />
              <StatCard
                label="TITIK RISIKO AKTIF"
                value={isLoading ? "..." : stats.activeRisks.toLocaleString()}
                icon={WarningTriangleIcon}
                iconBg="bg-rose-50 text-rose-600"
                meta={
                  stats.activeRisks > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md">
                      Dalam Pantauan
                    </span>
                  )
                }
              />
            </div>

            {/* --- MIDDLE ROW: MAP DISTRIBUTION & RECENT ACTIVITY --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PETA SEBARAN RISIKO (2 COLUMNS) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Peta Sebaran Risiko</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pantauan rute jalan, titik rawan kejahatan, dan status verifikasi lapangan
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">Filter:</span>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="text-xs font-semibold text-blue-900 bg-blue-50/60 border border-blue-100 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
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
                  <AdminDashboardMapPreview />
                </div>

                {/* Legend + status row */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                      Bahaya Tinggi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Waspada/Sedang
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Rute Aman
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Sinkronisasi data geospasial real-time aktif
                    </span>
                    <button
                      onClick={() => setActiveTab("Peta Risiko")}
                      className="font-bold text-blue-900 hover:underline"
                    >
                      Buka Layar Penuh ↗
                    </button>
                  </div>
                </div>
              </div>

              {/* AKTIVITAS TERBARU (1 COLUMN) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-slate-900">Aktivitas Terbaru</h3>
                  <button className="text-[11px] font-bold text-blue-900 hover:underline">Lihat Semua</button>
                </div>

                <div className="space-y-4 flex-1">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((act) => {
                      const Icon = act.icon;
                      return (
                        <div key={act.id} className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
                          <div className={`h-9 w-9 rounded-full ${act.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 leading-snug">{act.title}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-1">{act.time}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 font-medium p-2">
                      Belum ada aktivitas dengan stempel waktu dari API.
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="rounded-xl bg-slate-50 p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">Pengiriman Notifikasi Warga</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Siarkan peringatan darurat ke aplikasi seluler</p>
                    </div>
                    <button
                      onClick={handleBroadcastNotification}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-blue-900 text-white text-[11px] font-bold hover:bg-blue-950 transition"
                    >
                      Kirim Siaran
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- TREND CHART & DISTRIBUTION DONUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* TREN AKUMULASI & RESOLUSI LAPORAN */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">Tren Akumulasi & Resolusi Laporan</h3>
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        Hasil Integrasi Sistem
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Visualisasi metrik gabungan: Laporan Masuk, Terverifikasi, dan Titik Selesai
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                    {(["7d", "30d", "year"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setTrendRange(r)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                          trendRange === r ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {r === "7d" ? "7 Hari Terakhir" : r === "30d" ? "30 Hari Terakhir" : "Tahun Ini"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 mb-2 text-[11px] font-semibold text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-blue-900" />
                    Laporan Masuk (Total {rawRecords.length})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    Terverifikasi/Ditangani ({verifiedOrHandledCount})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                    Titik Selesai ({resolvedCount})
                  </span>
                </div>

                <div className="h-[260px] -ml-2">
                  {hasDatedRecords ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
                        <Line type="monotone" dataKey="masuk" stroke="#1e3a8a" strokeWidth={2.5} dot={false} name="Laporan Masuk" />
                        <Line type="monotone" dataKey="verifikasi" stroke="#10b981" strokeWidth={2.5} dot={false} name="Terverifikasi/Ditangani" />
                        <Line type="monotone" dataKey="selesai" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Titik Selesai" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center px-6">
                      <p className="text-xs text-slate-400 font-medium max-w-xs">
                        Data tanggal laporan (createdAt) belum tersedia dari API, jadi tren harian belum bisa dihitung.
                        Grafik akan otomatis terisi begitu field tanggal tersedia di response.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* DISTRIBUSI RISIKO */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-slate-900">Distribusi Risiko</h3>
                  <span className="text-[11px] font-semibold text-slate-400">Total {rawRecords.length} Isu</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">Pembagian kategori ancaman dan laporan terpadu</p>

                <div className="flex items-center gap-5">
                  <div className="relative w-32 h-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distribution} dataKey="value" nameKey="label" innerRadius={42} outerRadius={62} paddingAngle={2}>
                          {distribution.map((d) => (
                            <Cell key={d.key} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-extrabold text-slate-900">{rawRecords.length}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Laporan</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5 min-w-0">
                    {distribution.map((d) => (
                      <div key={d.key} className="flex items-center justify-between text-xs gap-2">
                        <span className="flex items-center gap-2 font-semibold text-slate-700 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="truncate">{d.label}</span>
                        </span>
                        <span className="font-bold text-slate-900 shrink-0">
                          {d.percent}% <span className="text-slate-400 font-medium">({d.value})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- BOTTOM DATA TABLE: LAPORAN MENUNGGU VERIFIKASI --- */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden p-6">
              {/* Table Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-base font-bold text-slate-900">Laporan Menunggu Verifikasi</h3>

                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari laporan..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-900 transition"
                    />
                  </div>

                  {/* Filter Button */}
                  <button
                    onClick={() =>
                      setFilterCategory((prev) => (prev === "Semua" ? "KRIMINAL" : prev === "KRIMINAL" ? "KECELAKAAN" : "Semua"))
                    }
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FilterIcon className="w-3.5 h-3.5 text-slate-500" />
                    Filter
                  </button>

                  {/* Export Button */}
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-950 transition shadow-sm">
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
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                              row.category === "KRIMINAL"
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
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                              row.source === "Warga" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {row.source}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              row.status === "PENDING"
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
        )}
      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Detail Laporan</h3>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
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

/* --- SHARED UI --- */

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  meta,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between hover:shadow-md transition">
      <div>
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <div className="flex items-baseline gap-2 mt-2 flex-wrap">
          <span className="text-2xl font-extrabold text-slate-900">{value}</span>
          {meta}
        </div>
      </div>
      <div className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
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