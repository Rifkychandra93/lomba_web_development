"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Newspaper,
  CheckCircle2,
  Clock,
  Globe,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { getAllIncidents } from "@/src/services/incident.service";
import type { Incident } from "@/src/types/incident";

export default function AdminDataBerita() {
  const [searchTerm, setSearchTerm] = useState("");
  const [news, setNews] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0,
    classified: 0,
    waiting: 0,
    sources: 0
  });

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await getAllIncidents();
        if (res.success && res.data) {
          // Hanya ambil incident yang berasal dari berita crawler
          const crawlerNews = res.data.filter(inc => inc.news);
          setNews(crawlerNews);

          const uniqueSources = new Set(
            crawlerNews.map(inc => inc.news?.source).filter(Boolean)
          );

          setStats({
            total: crawlerNews.length,
            classified: crawlerNews.length, // Karena sudah masuk incident, anggap sudah terklasifikasi
            waiting: 0, 
            sources: uniqueSources.size
          });
        }
      } catch (error) {
        console.error("Failed to fetch news data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.address && item.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.news?.source && item.news.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="p-8 space-y-6 flex-1 overflow-y-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Data Berita</h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Berita yang dikumpulkan dan diklasifikasikan sistem
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Berita Terkumpul
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoading ? "..." : stats.total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Sudah Diklasifikasi
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoading ? "..." : stats.classified.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Menunggu Klasifikasi
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoading ? "..." : stats.waiting.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Sumber Aktif
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoading ? "..." : stats.sources.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berita berdasarkan judul atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50">
            <option>Kategori Risiko</option>
          </select>
          <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50">
            <option>Status Klasifikasi</option>
          </select>
          <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50">
            <option>Sumber Berita</option>
          </select>
          <select className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50">
            <option>Urutkan</option>
          </select>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition ml-2">
            <Plus className="w-3.5 h-3.5" />
            Tambah Sumber
          </button>
        </div>
      </div>

      {/* NEWS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.length === 0 && !isLoading && (
          <div className="col-span-full py-10 text-center text-slate-500">
            Tidak ada berita yang ditemukan.
          </div>
        )}
        {filteredNews.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition">
            {/* Image Container */}
            <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
              <div className="text-slate-300">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              {/* Source Badge overlay */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                {item.news?.source || "Internet"}
              </div>
            </div>

            {/* Content Container */}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md ${
                  item.incidentType === "BEGAL" ? "bg-rose-100 text-rose-700" :
                  item.incidentType === "KECELAKAAN" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  <span className="mr-1">•</span> {item.incidentType}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(item.detectedAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 flex-1 mb-4">
                {item.description || "Tidak ada deskripsi rinci."}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terklasifikasi
                </div>
                {item.news?.url && (
                  <a href={item.news.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                    Lihat Berita Asli
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-8">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
          1
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50">
          2
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50">
          3
        </button>
        <div className="w-8 h-8 flex items-center justify-center text-slate-400">
          <MoreHorizontal className="w-4 h-4" />
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50">
          12
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}
