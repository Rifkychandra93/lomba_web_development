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

// Sub-komponen Tabel
const ReportTable = ({ 
  title, 
  data, 
  loading 
}: { 
  title: string, 
  data: LaporanItem[], 
  loading: boolean 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Dibuat 5 agar dua tabel muat tanpa terlalu panjang
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentItems = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
         <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {data[0]?.source === "Warga" ? <User className="w-5 h-5 text-blue-600" /> : <Newspaper className="w-5 h-5 text-indigo-600" />}
            {title}
         </h3>
         <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
            {data.length} Total
         </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="py-3 pl-6 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Laporan</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
              <th className="py-3 pr-6 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">Memuat data...</td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">Tidak ada data ditemukan</td>
              </tr>
            ) : currentItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 pl-6 px-4">
                  <div className="flex items-center gap-4">
                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">{item.title}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 mb-1.5">{item.reporter}</p>
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-extrabold rounded-md tracking-wide uppercase
                        ${item.category === 'PEMBEGALAN' ? 'bg-rose-100 text-rose-600' : 
                          item.category === 'KECELAKAAN' ? 'bg-orange-100 text-orange-600' : 
                          item.category === 'INFRASTRUKTUR' ? 'bg-slate-100 text-slate-600' : 
                          'bg-blue-100 text-blue-600'}`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-start gap-1.5 text-slate-600 text-xs font-medium mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{item.location}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 ml-5">
                    {item.date}
                  </div>
                </td>
                <td className="py-4 pr-6 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase whitespace-nowrap
                    ${item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {item.status === 'TERVERIFIKASI' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="border-t border-slate-100 bg-white px-6 py-3 flex items-center justify-between mt-auto">
        <p className="text-sm text-slate-500 font-medium">
          Menampilkan {data.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
          {Math.min(currentPage * itemsPerPage, data.length)} dari {data.length} Laporan
        </p>
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 2 + i;
              if (pageNum > totalPages) return null;
            }
            return (
              <button 
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition
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
                className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold hover:bg-slate-100 text-slate-600 transition"
              >
                {totalPages}
              </button>
            </>
          )}

          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminLaporanMasuk() {
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

  const wargaReports = useMemo(() => reports.filter(r => r.source === "Warga"), [reports]);
  const beritaReports = useMemo(() => reports.filter(r => r.source === "Berita"), [reports]);

  const statTotal = reports.length;
  const statPending = reports.filter(r => r.status === "PENDING").length;
  const statWarga = wargaReports.length;
  const statBerita = beritaReports.length;

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50 min-h-full">
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
            <p className="text-xs font-semibold text-slate-500 mb-1">Dari Berita / Crawler</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{loading ? "..." : statBerita.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* FILTER BAR (Simplified since tables are separated) */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
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

      {/* 2 DATA TABLES (Side by Side) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ReportTable title="Daftar Laporan Warga" data={wargaReports} loading={loading} />
        <ReportTable title="Daftar Laporan Berita & ML Crawler" data={beritaReports} loading={loading} />
      </div>

    </div>
  );
}
