"use client";

import { useState, useEffect } from "react";
import { Camera, Edit2, Check, Loader2 } from "lucide-react";
import api from "@/src/lib/api";
import { saveAuth, getToken } from "@/src/lib/tokenStorage";

export default function AdminPengaturan() {
  const [activeMenu, setActiveMenu] = useState("Profil Admin");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // State Profil & Preferensi
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "ADMIN",
    notifNewReport: true,
    notifHighRisk: true,
    notifSystemUpdate: false
  });

  // State Ubah Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const menus = [
    "Profil Admin",
    "Keamanan Akun",
    "Notifikasi",
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data?.success && res.data?.data) {
          setProfileData({
            name: res.data.data.name,
            email: res.data.data.email,
            phone: res.data.data.phone || "",
            role: res.data.data.role,
            notifNewReport: res.data.data.notifNewReport ?? true,
            notifHighRisk: res.data.data.notifHighRisk ?? true,
            notifSystemUpdate: res.data.data.notifSystemUpdate ?? false,
          });
        }
      } catch (err) {
        console.error("Gagal mengambil profil", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await api.put("/auth/me", profileData);
      if (res.data?.success) {
        setMessage({ text: "Profil berhasil diperbarui!", type: "success" });
        // Update local storage so header reflects changes without reload
        const currentToken = getToken();
        if (currentToken) {
          const remember = localStorage.getItem("auth_storage") === "local";
          saveAuth(currentToken, res.data.data, remember);
        }
      }
    } catch (err: any) {
      setMessage({ 
        text: err.response?.data?.message || "Gagal menyimpan perubahan", 
        type: "error" 
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleToggleNotif = async (key: keyof typeof profileData) => {
    const newValue = !profileData[key];
    setProfileData(prev => ({ ...prev, [key]: newValue }));
    try {
      await api.put("/auth/me", { [key]: newValue });
    } catch (err) {
      console.error("Gagal menyimpan preferensi", err);
      // Revert if failed
      setProfileData(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleSavePassword = async () => {
    setIsSavingPassword(true);
    setPasswordMessage({ text: "", type: "" });
    try {
      const res = await api.put("/auth/password", passwordForm);
      if (res.data?.success) {
        setPasswordMessage({ text: "Password berhasil diubah!", type: "success" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordForm({ oldPassword: "", newPassword: "" });
          setPasswordMessage({ text: "", type: "" });
        }, 2000);
      }
    } catch (err: any) {
      setPasswordMessage({ 
        text: err.response?.data?.message || "Gagal mengubah password", 
        type: "error" 
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <main className="p-8 space-y-6 flex-1 overflow-y-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan</h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Kelola konfigurasi dan preferensi platform
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SETTINGS SIDEBAR */}
        <div className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-3 shrink-0">
          <nav className="flex flex-col space-y-1">
            {menus.map((menu) => (
              <button
                key={menu}
                onClick={() => setActiveMenu(menu)}
                className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
                  activeMenu === menu
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent"
                }`}
              >
                {menu}
              </button>
            ))}
          </nav>
        </div>

        {/* MAIN SETTINGS CONTENT */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 lg:p-8">
          {activeMenu === "Profil Admin" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Profil Admin</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola informasi pribadi dan detail kontak Anda.
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Photo & Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-slate-200 text-blue-600 text-2xl font-bold uppercase">
                        {profileData.name.charAt(0)}
                      </div>
                      <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white shadow-sm hover:bg-blue-700 transition">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition shadow-sm border border-slate-200/60">
                      Ganti Foto
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">Alamat Email</label>
                      <input 
                        type="email" 
                        value={profileData.email} 
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">Nomor Telepon</label>
                      <input 
                        type="tel" 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="Contoh: 08123456789"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700">Peran (Role)</label>
                      <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition appearance-none cursor-not-allowed" disabled>
                        <option>{profileData.role}</option>
                      </select>
                    </div>
                  </div>

                  {message.text && (
                    <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {message.type === "success" && <Check className="w-4 h-4" />}
                      {message.text}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-8 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button className="px-5 py-2.5 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition border border-slate-200">
                      Batalkan
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-5 py-2.5 flex items-center gap-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm shadow-blue-200 disabled:opacity-70"
                    >
                      {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                      Simpan Perubahan
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeMenu === "Keamanan Akun" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Keamanan Akun</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola password dan pengaturan keamanan akun Anda.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-extrabold text-slate-900">Keamanan Dasar</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Password Akun</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Disarankan rutin diganti untuk keamanan</p>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-white text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition shadow-sm border border-slate-200"
                  >
                    Ubah Password
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeMenu === "Notifikasi" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Notifikasi</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur pemberitahuan apa saja yang ingin Anda terima.
                </p>
              </div>

              {/* Notifications */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-700">Laporan Baru Masuk</p>
                  <div 
                    onClick={() => handleToggleNotif("notifNewReport")}
                    className={`relative inline-block w-10 h-6 cursor-pointer rounded-full transition-colors ${profileData.notifNewReport ? "bg-blue-600" : "bg-slate-200"}`}
                  >
                    <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm flex items-center justify-center ${profileData.notifNewReport ? "translate-x-4" : ""}`}>
                      {profileData.notifNewReport && <svg className="w-2.5 h-2.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-700">Laporan Berisiko Tinggi</p>
                  <div 
                    onClick={() => handleToggleNotif("notifHighRisk")}
                    className={`relative inline-block w-10 h-6 cursor-pointer rounded-full transition-colors ${profileData.notifHighRisk ? "bg-blue-600" : "bg-slate-200"}`}
                  >
                    <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm flex items-center justify-center ${profileData.notifHighRisk ? "translate-x-4" : ""}`}>
                      {profileData.notifHighRisk && <svg className="w-2.5 h-2.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-700">Update Sistem</p>
                  <div 
                    onClick={() => handleToggleNotif("notifSystemUpdate")}
                    className={`relative inline-block w-10 h-6 cursor-pointer rounded-full transition-colors ${profileData.notifSystemUpdate ? "bg-blue-600" : "bg-slate-200"}`}
                  >
                    <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm flex items-center justify-center ${profileData.notifSystemUpdate ? "translate-x-4" : ""}`}>
                      {profileData.notifSystemUpdate && <svg className="w-2.5 h-2.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL UBAH PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Ubah Password</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Password Lama</label>
                <input 
                  type="password" 
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Password Baru</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
              
              {passwordMessage.text && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  passwordMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {passwordMessage.type === "success" && <Check className="w-4 h-4" />}
                  {passwordMessage.text}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-end gap-2">
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordMessage({ text: "", type: "" });
                  setPasswordForm({ oldPassword: "", newPassword: "" });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button 
                onClick={handleSavePassword}
                disabled={isSavingPassword || !passwordForm.oldPassword || !passwordForm.newPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingPassword && <Loader2 className="w-3 h-3 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
