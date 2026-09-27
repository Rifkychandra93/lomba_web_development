"use client";

import {
  DashboardIcon,
  MapIcon,
  InboxIcon,
  NewsIcon,
  UsersIcon,
  SettingsIcon,
  LogoutIcon,
} from "../admin/Adminicons";

interface AdminUser {
  name?: string;
  email?: string;
  role?: string;
}

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: AdminUser | null;
  onLogout: () => void;
  onToggleProfileMenu: () => void;
}

const NAV_ITEMS = [
  { name: "Dashboard", icon: DashboardIcon },
  { name: "Peta Risiko", icon: MapIcon },
  { name: "Laporan Masuk", icon: InboxIcon },
  { name: "Data Berita", icon: NewsIcon },
  { name: "Pengguna", icon: UsersIcon },
  { name: "Pengaturan", icon: SettingsIcon },
];

export function AdminSidebar({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  onToggleProfileMenu,
}: AdminSidebarProps) {
  return (
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
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.name;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => onSelectTab(item.name)}
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
          onClick={onToggleProfileMenu}
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
              onLogout();
            }}
            title="Keluar Akun"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition shrink-0"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}