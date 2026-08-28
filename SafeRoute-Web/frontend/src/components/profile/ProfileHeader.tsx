"use client";
import React from "react";
import { ShieldCheck } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
}

interface ProfileHeaderProps {
  user: UserProfile | null;
  stats: {
    total: number;
    verified: number;
    pending: number;
  };
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SR";

  return (
    <div className="w-full rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#0B2540] text-2xl font-black text-white shadow-xl">
            {initials}
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-[#0B2540] tracking-tight">
            {user?.name || "Memuat Pengguna..."}
          </h1>
          <p className="text-xs font-semibold text-neutral-400">
            {user?.email || "memuat..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 divide-x divide-neutral-100 rounded-2xl bg-neutral-50/50 p-4 border border-neutral-100/50 min-w-[280px] sm:min-w-[320px]">
        <div className="text-center px-2">
          <p className="text-2xl font-black text-[#0B2540]">{stats.total}</p>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Reports</p>
        </div>
        <div className="text-center px-2">
          <p className="text-2xl font-black text-emerald-600">{stats.verified}</p>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Verified</p>
        </div>
        <div className="text-center px-2">
          <p className="text-2xl font-black text-amber-500">{stats.pending}</p>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Pending</p>
        </div>
      </div>
    </div>
  );
}
