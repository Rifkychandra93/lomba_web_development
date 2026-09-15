"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, 
  ClipboardType, 
  User, 
  Newspaper, 
  Download,
  ChevronDown,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { getAllReports } from "@/src/services/report.service";
import { getAllIncidents } from "@/src/services/incident.service";

// Tipe data Laporan
interface LaporanItem {
  id: string;
  title: string;
  reporter: string;
  category: string;
  location: string;
  source: "Warga" | "Berita";
  status: "PENDING" | "TERVERIFIKASI";
  date: string;
  imageUrl: string;
  rawDate: number;
}

export default function AdminLaporanMasuk() {
  const [activeFilter, setActiveFilter] = useState<"Semua" | "Warga" | "Berita">("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [reports, setReports] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resReports, resIncidents] = await Promise.all([
          getAllReports(),
          getAllIncidents()
        ]);

        const mappedReports: LaporanItem[] = (resReports.success && resReports.data ? resReports.data : []).map((rep: any) => ({
          id: rep.id,
          title: rep.title,
          reporter: rep.user?.name ? `Dilaporkan oleh ${rep.user.name}` : "Dilaporkan oleh Warga",
          category: rep.incidentType,
          location: rep.address || rep.location || "Lokasi tidak diketahui",
          source: "Warga",
          status: rep.status,
          date: new Date(rep.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
          imageUrl: rep.imageUrl || "https://ui-avatars.com/api/?name=Warga&background=f1f5f9&color=64748b",
          rawDate: new Date(rep.createdAt).getTime()
        }));

        const mappedIncidents: LaporanItem[] = (resIncidents.success && resIncidents.data ? resIncidents.data : []).map((inc: any) => {
          const dateStr = inc.news?.publishedAt || inc.detectedAt;
          return {
            id: inc.id,
            title: inc.title,
            reporter: inc.news?.source ? `Sumber: ${inc.news.source}` : "Sumber: ML Crawler",
            category: inc.incidentType,
            location: inc.address || "Lokasi tidak diketahui",
            source: "Berita",
            status: "TERVERIFIKASI", // Anggap hasil crawler sudah terverifikasi atau default
            date: new Date(dateStr).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
            imageUrl: "https://ui-avatars.com/api/?name=Berita&background=e0e7ff&color=4f46e5",
            rawDate: new Date(dateStr).getTime()
          };
        });

        const combined = [...mappedReports, ...mappedIncidents].sort((a, b) => b.rawDate - a.rawDate);
        setReports(combined);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredReports = useMemo(() => {
    if (activeFilter === "Semua") return reports;
    return reports.filter(r => r.source === activeFilter);
  }, [reports, activeFilter]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentItems = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statTotal = reports.length;
  const statPending = reports.filter(r => r.status === "PENDING").length;
  const statWarga = reports.filter(r => r.source === "Warga").length;
  const statBerita = reports.filter(r => r.source === "Berita").length;

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50 min-h-full">
      {/* HEADER SECTION IS HANDLED BY AdminDashboard.tsx */}
      
      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Total Laporan Masuk</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{loading ? "..." : statTotal.toLocaleString()}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <ClipboardType className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Menunggu Verifikasi</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{loading ? "..." : statPending.toLocaleString()}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Dari Warga</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{loading ? "..." : statWarga.toLocaleString()}</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Newspaper className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Dari Berita</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{loading ? "..." : statBerita.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          {/* Button Group */}
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            {(["Semua", "Warga", "Berita"] as const).map(f => (
              <button 
                key={f}
                onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${activeFilter === f ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Dropdown Kategori */}
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition">
            Kategori: Semua
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Status */}
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition">
            Status: Pending
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Export Button */}
        <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 pl-6 pr-4 w-12">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Laporan</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sumber</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 pr-6 pl-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">Memuat data...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">Tidak ada data ditemukan</td>
                </tr>
              ) : currentItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 pl-6 pr-4">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{item.reporter}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-3 py-1 text-[10px] font-extrabold rounded-full tracking-wide
                      ${item.category === 'PEMBEGALAN' ? 'bg-rose-100 text-rose-600' : 
                        item.category === 'KECELAKAAN' ? 'bg-orange-100 text-orange-600' : 
                        item.category === 'INFRASTRUKTUR' ? 'bg-slate-100 text-slate-600' : 
                        'bg-blue-100 text-blue-600'}`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {item.location}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold
                      ${item.source === 'Warga' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'}`}>
                      {item.source === 'Warga' ? <User className="w-3.5 h-3.5" /> : <Newspaper className="w-3.5 h-3.5" />}
                      {item.source}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase
                      ${item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.status === 'TERVERIFIKASI' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 pr-6 pl-4">
                    <div className="text-sm font-semibold text-slate-700">
                      {item.date}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between mt-auto">
          <p className="text-sm text-slate-500 font-medium">
            Menampilkan {filteredReports.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredReports.length)} dari {filteredReports.length} {activeFilter === "Semua" ? "Laporan" : activeFilter}
          </p>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum = i + 1;
              // Simple pagination logic for demo
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) return null;
              }
              return (
                <button 
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition
                    ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-1 text-slate-400 font-bold">...</span>
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold hover:bg-slate-100 text-slate-600 transition"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
