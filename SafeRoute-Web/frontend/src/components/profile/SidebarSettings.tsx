"use client";
import React, { useState } from "react";
import { Settings, ChevronRight, LogOut, User, Lock, X } from "lucide-react";
import api from "@/src/lib/api";

interface UserProfile {
  name: string;
  email: string;
  phone?: string | null;
}

interface SidebarSettingsProps {
  user: UserProfile;
  onLogout: () => void;
  onRefresh: () => void;
}

export function SidebarSettings({ user, onLogout, onRefresh }: SidebarSettingsProps) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Edit Profile States
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  // Change Password States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/me", { name, email, phone });
      if (res.data.success) {
        alert("Profil berhasil diperbarui!");
        setShowEditProfile(false);
        onRefresh();
      } else {
        alert(res.data.message || "Gagal memperbarui profil");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/password", { oldPassword, newPassword });
      if (res.data.success) {
        alert("Password berhasil diubah!");
        setShowChangePassword(false);
        setOldPassword("");
        setNewPassword("");
      } else {
        alert(res.data.message || "Gagal mengubah password");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <Settings className="h-4.5 w-4.5 text-[#0B2540]" />
          <h2 className="text-sm font-extrabold text-[#0B2540] uppercase tracking-wider">
            Pengaturan Akun
          </h2>
        </div>

        {/* Menu List */}
        <div className="space-y-1">
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-neutral-50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-neutral-400 group-hover:text-[#0B2540] transition-colors" />
              <span className="text-xs font-semibold text-neutral-600 group-hover:text-neutral-800 transition-colors">
                Informasi Pribadi
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-[#0B2540] group-hover:translate-x-0.5 transition-all" />
          </button>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-neutral-50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-neutral-400 group-hover:text-[#0B2540] transition-colors" />
              <span className="text-xs font-semibold text-neutral-600 group-hover:text-neutral-800 transition-colors">
                Ubah Password
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-[#0B2540] group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50/50 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-rose-100/50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Keluar Akun
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-[#0B2540]">Informasi Pribadi</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 focus:border-[#0B2540] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 focus:border-[#0B2540] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxx"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 focus:border-[#0B2540] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0B2540] py-3 text-sm font-bold text-white hover:bg-[#0e2f52] transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-[#0B2540]">Ubah Password</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Password Lama</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 focus:border-[#0B2540] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 focus:border-[#0B2540] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0B2540] py-3 text-sm font-bold text-white hover:bg-[#0e2f52] transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Perbarui Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
