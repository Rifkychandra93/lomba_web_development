"use client";

import {
  DashboardIcon,
  MapIcon,
  InboxIcon,
  NewsIcon,
  UsersIcon,
  SettingsIcon,
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  isMobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed md:relative top-0 left-0 h-full w-64 shrink-0 bg-white text-slate-900 flex flex-col p-5 z-50 border-r border-slate-200 transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-900 text-white font-bold text-lg shadow-md shadow-blue-900/30">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="18" r="3" />
            <path
              d="M6 9c0 3 12 3 12 6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <span className="text-xl font-bold tracking-tight text-slate-900">
          SafeRoute
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.name;
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => {
                onSelectTab(item.name);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-blue-900 text-white shadow-lg shadow-blue-900/30 font-semibold"
                  : "text-slate-600 hover:bg-blue-900 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
    </>
  );
}