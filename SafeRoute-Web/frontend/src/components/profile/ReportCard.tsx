"use client";
import React from "react";
import { Clock, MapPin, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import type { Report } from "@/src/types/report";

interface ReportCardProps {
  report: Report;
}

// Relative time formatting helper matching the mockup format
function getRelativeTime(dateString: string) {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    
    // Fallback if future date
    if (diffMs < 0) return "Baru saja";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 60) {
      return `${diffMins} menit lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam lalu`;
    } else if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    } else {
      return `${diffWeeks} minggu lalu`;
    }
  } catch {
    return "Beberapa waktu lalu";
  }
}

export function ReportCard({ report }: ReportCardProps) {
  const relativeTime = getRelativeTime(report.createdAt);
  const locationName = report.address || report.location || "Lokasi tidak spesifik";

  // Badges styling based on status
  let statusBadgeColor = "";
  let statusText = "";
  if (report.status === "VERIFIED") {
    statusBadgeColor = "bg-[#EEF2F6] text-[#0A2540] border border-blue-200/50";
    statusText = "Verified";
  } else if (report.status === "PENDING") {
    statusBadgeColor = "bg-amber-50 text-amber-600 border border-amber-200/50";
    statusText = "Pending";
  } else {
    statusBadgeColor = "bg-rose-50 text-rose-600 border border-rose-200/50";
    statusText = "Rejected";
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
      {/* Report Image */}
      <div className="relative h-48 w-full bg-neutral-100 overflow-hidden shrink-0">
        {report.imageUrl ? (
          <img
            src={report.imageUrl}
            alt={report.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0B2540]/5 to-[#0B2540]/10 text-neutral-400">
            <AlertTriangle className="h-8 w-8 text-[#0B2540]/30 animate-pulse" />
            <span className="text-[10px] font-bold text-[#0B2540]/40 mt-2 uppercase tracking-widest">
              No Image Provided
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4.5 space-y-3">
        {/* Title and status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xs sm:text-sm font-extrabold text-neutral-800 leading-tight truncate flex-1" title={report.title}>
            {report.title}
          </h3>
          <span className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase ${statusBadgeColor}`}>
            {report.status === "VERIFIED" && <ShieldCheck className="h-3 w-3" />}
            {report.status === "PENDING" && <Clock className="h-3 w-3" />}
            {report.status === "REJECTED" && <ShieldAlert className="h-3 w-3" />}
            {statusText}
          </span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-3 font-medium">
          {report.description}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer info */}
        <div className="flex items-center gap-4 border-t border-neutral-50 pt-3 text-[10px] font-bold text-neutral-400">
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3.5 w-3.5 text-neutral-300" />
            {relativeTime}
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
            <span className="truncate">{locationName}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
