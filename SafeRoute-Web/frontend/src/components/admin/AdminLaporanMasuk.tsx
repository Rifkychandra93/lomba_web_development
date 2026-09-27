"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  ClipboardType,
  User,
  Newspaper,
  ChevronDown,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAllReports } from "@/src/services/report.service";
import { getAllIncidents } from "@/src/services/incident.service";

// =====================================================
// TIPE DATA
// =====================================================
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

// =====================================================
// SUB-KOMPONEN TABEL
// =====================================================
const ReportTable = ({
  title,
  data,
  loading,
}: {
  title: string;
  data: LaporanItem[];
  loading: boolean;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Reset halaman ketika hasil filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const currentItems = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          {data[0]?.source === "Warga" ? (
            <User className="w-5 h-5 text-blue-950" />
          ) : (
            <Newspaper className="w-5 h-5 text-blue-950" />
          )}

          {title}
        </h3>

        <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-950">
          {data.length} Total
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="py-3 pl-6 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Laporan
              </th>

              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Detail
              </th>

              <th className="py-3 pr-6 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-10 text-slate-500"
                >
                  Memuat data...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-10 text-slate-500"
                >
                  Tidak ada data sesuai filter
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  {/* Laporan */}
                  <td className="py-4 pl-6 px-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />

                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-950 transition-colors line-clamp-1">
                          {item.title}
                        </p>

                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 mb-1.5">
                          {item.reporter}
                        </p>

                        <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold rounded-md tracking-wide uppercase bg-blue-50 text-blue-950">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Detail */}
                  <td className="py-4 px-4">
                    <div className="flex items-start gap-1.5 text-slate-600 text-xs font-medium mb-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-950 mt-0.5 shrink-0" />

                      <span className="line-clamp-2">
                        {item.location}
                      </span>
                    </div>

                    <div className="text-[10px] font-semibold text-slate-400 ml-5">
                      {item.date}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 pr-6 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase whitespace-nowrap ${
                        item.status === "PENDING"
                          ? "bg-blue-50 text-blue-950 border border-blue-100"
                          : "bg-blue-950 text-white"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === "PENDING"
                            ? "bg-blue-700"
                            : "bg-white"
                        }`}
                      />

                      {item.status === "PENDING"
                        ? "Menunggu Verifikasi"
                        : "Terverifikasi"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-slate-100 bg-white px-6 py-3 flex items-center justify-between mt-auto">
        <p className="text-sm text-slate-500 font-medium">
          Menampilkan{" "}
          {data.length > 0
            ? (currentPage - 1) * itemsPerPage + 1
            : 0}
          -
          {Math.min(
            currentPage * itemsPerPage,
            data.length
          )}{" "}
          dari {data.length} Laporan
        </p>

        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) =>
                Math.max(prev - 1, 1)
              )
            }
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-950 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({
            length: Math.min(totalPages, 5),
          }).map((_, i) => {
            let pageNum = i + 1;

            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 2 + i;

              if (pageNum > totalPages) return null;
            }

            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition ${
                  currentPage === pageNum
                    ? "bg-blue-950 text-white shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-950 text-slate-600"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 &&
            currentPage < totalPages - 2 && (
              <>
                <span className="px-1 text-slate-400 font-bold">
                  ...
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(totalPages)
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold hover:bg-blue-50 hover:text-blue-950 text-slate-600 transition"
                >
                  {totalPages}
                </button>
              </>
            )}

          <button
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, totalPages)
              )
            }
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-950 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// HALAMAN LAPORAN MASUK
// =====================================================
export default function AdminLaporanMasuk() {
  const [reports, setReports] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ===================================================
  // FILTER
  // ===================================================
  const [selectedCategory, setSelectedCategory] =
    useState("SEMUA");

  const [selectedStatus, setSelectedStatus] =
    useState("SEMUA");

  const [selectedSource, setSelectedSource] =
    useState("SEMUA");

  // ===================================================
  // FETCH DATA
  // ===================================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [resReports, resIncidents] =
          await Promise.all([
            getAllReports(),
            getAllIncidents(),
          ]);

        // =================================================
        // DATA LAPORAN WARGA
        // =================================================
        const mappedReports: LaporanItem[] = (
          resReports.success && resReports.data
            ? resReports.data
            : []
        ).map((rep: any) => ({
          id: rep.id,
          title: rep.title,

          reporter: rep.user?.name
            ? `Dilaporkan oleh ${rep.user.name}`
            : "Dilaporkan oleh Warga",

          category: rep.incidentType,

          location:
            rep.address ||
            rep.location ||
            "Lokasi tidak diketahui",

          source: "Warga",

          status: rep.status,

          date: new Date(
            rep.createdAt
          ).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          }),

          imageUrl:
            rep.imageUrl ||
            "https://ui-avatars.com/api/?name=Warga&background=f1f5f9&color=0f2a5f",

          rawDate: new Date(
            rep.createdAt
          ).getTime(),
        }));

        // =================================================
        // DATA BERITA / ML CRAWLER
        // =================================================
        const mappedIncidents: LaporanItem[] = (
          resIncidents.success && resIncidents.data
            ? resIncidents.data
            : []
        ).map((inc: any) => {
          const dateStr =
            inc.news?.publishedAt ||
            inc.detectedAt;

          return {
            id: inc.id,

            title: inc.title,

            reporter: inc.news?.source
              ? `Sumber: ${inc.news.source}`
              : "Sumber: ML Crawler",

            category: inc.incidentType,

            location:
              inc.address ||
              "Lokasi tidak diketahui",

            source: "Berita",

            status: "TERVERIFIKASI",

            date: new Date(
              dateStr
            ).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            }),

            imageUrl:
              "https://ui-avatars.com/api/?name=Berita&background=eaf0ff&color=0f2a5f",

            rawDate: new Date(
              dateStr
            ).getTime(),
          };
        });

        // =================================================
        // GABUNGKAN DATA
        // =================================================
        const combined = [
          ...mappedReports,
          ...mappedIncidents,
        ].sort(
          (a, b) => b.rawDate - a.rawDate
        );

        setReports(combined);
      } catch (err) {
        console.error(
          "Failed to fetch reports",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ===================================================
  // FILTER OPTIONS - KATEGORI
  // ===================================================
  const categoryOptions = useMemo(() => {
    const categories = reports
      .map((report) => report.category)
      .filter(Boolean);

    return Array.from(
      new Set(categories)
    ).sort();
  }, [reports]);

  // ===================================================
  // FILTER OPTIONS - STATUS
  // ===================================================
  const statusOptions = useMemo(() => {
    const statuses = reports
      .map((report) => report.status)
      .filter(Boolean);

    return Array.from(
      new Set(statuses)
    );
  }, [reports]);

  // ===================================================
  // FILTER OPTIONS - SUMBER
  // ===================================================
  const sourceOptions = useMemo(() => {
    return Array.from(
      new Set(
        reports
          .map((report) => report.source)
          .filter(Boolean)
      )
    );
  }, [reports]);

  // ===================================================
  // FILTER DATA
  // ===================================================
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const categoryMatch =
        selectedCategory === "SEMUA" ||
        report.category === selectedCategory;

      const statusMatch =
        selectedStatus === "SEMUA" ||
        report.status === selectedStatus;

      const sourceMatch =
        selectedSource === "SEMUA" ||
        report.source === selectedSource;

      return (
        categoryMatch &&
        statusMatch &&
        sourceMatch
      );
    });
  }, [
    reports,
    selectedCategory,
    selectedStatus,
    selectedSource,
  ]);

  // ===================================================
  // DATA PER SUMBER
  // ===================================================
  const wargaReports = useMemo(
    () =>
      filteredReports.filter(
        (report) => report.source === "Warga"
      ),
    [filteredReports]
  );

  const beritaReports = useMemo(
    () =>
      filteredReports.filter(
        (report) => report.source === "Berita"
      ),
    [filteredReports]
  );

  // ===================================================
  // STATISTIK
  // Tetap berdasarkan seluruh data
  // ===================================================
  const statTotal = reports.length;

  const statPending = reports.filter(
    (report) => report.status === "PENDING"
  ).length;

  const statWarga = reports.filter(
    (report) => report.source === "Warga"
  ).length;

  const statBerita = reports.filter(
    (report) => report.source === "Berita"
  ).length;

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50 min-h-full">

      {/* =================================================
          HEADER
      ================================================= */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Laporan Masuk
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Kelola dan pantau laporan warga serta data
          berita SafeRoute.
        </p>
      </div>

      {/* =================================================
          STAT CARDS
      ================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        {/* Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-950 shrink-0">
            <ClipboardList className="w-7 h-7" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Total Laporan Masuk
            </p>

            <h3 className="text-3xl font-extrabold text-slate-900">
              {loading
                ? "..."
                : statTotal.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-950 shrink-0">
            <ClipboardType className="w-7 h-7" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Menunggu Verifikasi
            </p>

            <h3 className="text-3xl font-extrabold text-slate-900">
              {loading
                ? "..."
                : statPending.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Warga */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-950 shrink-0">
            <User className="w-7 h-7" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Dari Warga
            </p>

            <h3 className="text-3xl font-extrabold text-slate-900">
              {loading
                ? "..."
                : statWarga.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Berita */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-950 shrink-0">
            <Newspaper className="w-7 h-7" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">
              Dari Berita / Crawler
            </p>

            <h3 className="text-3xl font-extrabold text-slate-900">
              {loading
                ? "..."
                : statBerita.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTER BAR
      ================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col gap-4">

          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Filter Laporan
              </h3>

              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan filter untuk menampilkan laporan
                sesuai kebutuhan.
              </p>
            </div>

            {(selectedCategory !== "SEMUA" ||
              selectedStatus !== "SEMUA" ||
              selectedSource !== "SEMUA") && (
              <button
                onClick={() => {
                  setSelectedCategory("SEMUA");
                  setSelectedStatus("SEMUA");
                  setSelectedSource("SEMUA");
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold text-blue-950 hover:bg-blue-50 transition"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* =================================================
              FILTER CONTROLS
          ================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* KATEGORI */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Kategori Laporan
              </label>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value
                    )
                  }
                  className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-slate-700 outline-none cursor-pointer transition focus:border-blue-950 focus:ring-2 focus:ring-blue-100 hover:border-blue-300"
                >
                  <option value="SEMUA">
                    Semua Kategori
                  </option>

                  {categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-950 pointer-events-none" />
              </div>
            </div>

            {/* SUMBER */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Sumber Laporan
              </label>

              <div className="relative">
                <select
                  value={selectedSource}
                  onChange={(e) =>
                    setSelectedSource(
                      e.target.value
                    )
                  }
                  className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-slate-700 outline-none cursor-pointer transition focus:border-blue-950 focus:ring-2 focus:ring-blue-100 hover:border-blue-300"
                >
                  <option value="SEMUA">
                    Semua Sumber
                  </option>

                  {sourceOptions.map(
                    (source) => (
                      <option
                        key={source}
                        value={source}
                      >
                        {source === "Warga"
                          ? "Laporan Warga"
                          : "Berita / ML Crawler"}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-950 pointer-events-none" />
              </div>
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Status Verifikasi
              </label>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(
                      e.target.value
                    )
                  }
                  className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-slate-700 outline-none cursor-pointer transition focus:border-blue-950 focus:ring-2 focus:ring-blue-100 hover:border-blue-300"
                >
                  <option value="SEMUA">
                    Semua Status
                  </option>

                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status === "PENDING"
                          ? "Menunggu Verifikasi"
                          : "Terverifikasi"}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-950 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* =================================================
              HASIL FILTER
          ================================================= */}
          <div className="flex flex-wrap items-center gap-2 pt-1">

            <span className="text-xs font-bold text-slate-500">
              Hasil:
            </span>

            <span className="px-3 py-1.5 rounded-lg bg-blue-950 text-white text-xs font-bold">
              {filteredReports.length} Laporan
            </span>

            {selectedCategory !== "SEMUA" && (
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-950 text-xs font-bold">
                Kategori: {selectedCategory}
              </span>
            )}

            {selectedSource !== "SEMUA" && (
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-950 text-xs font-bold">
                Sumber:{" "}
                {selectedSource === "Warga"
                  ? "Warga"
                  : "Berita / Crawler"}
              </span>
            )}

            {selectedStatus !== "SEMUA" && (
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-950 text-xs font-bold">
                Status:{" "}
                {selectedStatus === "PENDING"
                  ? "Menunggu Verifikasi"
                  : "Terverifikasi"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          DATA TABLES
      ================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ReportTable
          title="Daftar Laporan Warga"
          data={wargaReports}
          loading={loading}
        />

        <ReportTable
          title="Daftar Laporan Berita & ML Crawler"
          data={beritaReports}
          loading={loading}
        />
      </div>
    </div>
  );
}