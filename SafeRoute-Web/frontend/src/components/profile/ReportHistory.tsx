"use client";
import React, { useState } from "react";
import { Filter, SlidersHorizontal, Inbox } from "lucide-react";
import { ReportCard } from "./ReportCard";
import type { Report } from "@/src/types/report";

interface ReportHistoryProps {
  reports: Report[];
}

type FilterStatus = "ALL" | "VERIFIED" | "PENDING" | "REJECTED";

export function ReportHistory({ reports }: ReportHistoryProps) {
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  // Apply filtering
  const filteredReports = reports.filter((report) => {
    if (filter === "ALL") return true;
    return report.status === filter;
  });

  // Handle Load More
  const hasMore = visibleCount < filteredReports.length;
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  const handleFilterSelect = (selectedFilter: FilterStatus) => {
    setFilter(selectedFilter);
    setVisibleCount(3); // Reset pagination on filter change
    setShowFilterDropdown(false);
  };

  return (
    <div className="space-y-5">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-[#0B2540] uppercase tracking-wider">
          Report History
        </h2>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 hover:bg-neutral-50 hover:text-[#0B2540] transition-all cursor-pointer shadow-sm"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter{filter !== "ALL" && `: ${filter}`}</span>
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-fade-in">
              <button
                onClick={() => handleFilterSelect("ALL")}
                className={`w-full text-left rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                  filter === "ALL"
                    ? "bg-[#0B2540]/5 text-[#0B2540]"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleFilterSelect("VERIFIED")}
                className={`w-full text-left rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                  filter === "VERIFIED"
                    ? "bg-[#0B2540]/5 text-blue-600"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => handleFilterSelect("PENDING")}
                className={`w-full text-left rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                  filter === "PENDING"
                    ? "bg-[#0B2540]/5 text-amber-500"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleFilterSelect("REJECTED")}
                className={`w-full text-left rounded-xl px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                  filter === "REJECTED"
                    ? "bg-[#0B2540]/5 text-rose-500"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                Rejected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filteredReports.slice(0, visibleCount).map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
          <Inbox className="h-8 w-8 text-neutral-300" />
          <p className="mt-2.5 text-xs font-bold text-neutral-500">Belum Ada Laporan</p>
          <p className="mt-1 text-[10px] text-neutral-400 font-medium max-w-[240px]">
            Anda belum memiliki laporan dengan status ini. Laporkan kejadian kriminalitas di sekitar Anda.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-blue-50 py-3 text-xs font-extrabold text-[#0C2D48] hover:bg-blue-100 transition-colors shadow-sm cursor-pointer border border-blue-100/50"
          >
            Load More Reports
          </button>
        </div>
      )}
    </div>
  );
}
