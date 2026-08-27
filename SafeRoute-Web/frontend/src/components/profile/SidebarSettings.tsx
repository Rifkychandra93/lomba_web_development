"use client";
import React from "react";
import { Settings, ChevronRight, LogOut, User, Bell, ShieldAlert } from "lucide-react";

interface SidebarSettingsProps {
  onLogout: () => void;
}

export function SidebarSettings({ onLogout }: SidebarSettingsProps) {
  const menuItems = [
    {
      title: "Personal Information",
      icon: User,
    },
    {
      title: "Notification Preferences",
      icon: Bell,
    },
    {
      title: "Privacy & Security",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="w-full rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
        <Settings className="h-4.5 w-4.5 text-[#0B2540]" />
        <h2 className="text-sm font-extrabold text-[#0B2540] uppercase tracking-wider">
          Account Settings
        </h2>
      </div>

      {/* Menu List */}
      <div className="space-y-1">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-neutral-50 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-neutral-400 group-hover:text-[#0B2540] transition-colors" />
                <span className="text-xs font-semibold text-neutral-600 group-hover:text-neutral-800 transition-colors">
                  {item.title}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-[#0B2540] group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50/50 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-rose-100/50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
