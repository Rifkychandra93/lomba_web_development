"use client";

import { useState, useEffect } from "react";
import { Search, UserCheck, ShieldCheck, Mail, Calendar, Download } from "lucide-react";
import { getAllUsers, User } from "@/src/services/user.service";

export default function AdminPengguna() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        if (res.success && res.data) {
          setUsers(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === "ADMIN").length;

  return (
    <main className="p-8 space-y-6 flex-1 overflow-y-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Data Pengguna</h2>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Daftar pengguna yang terdaftar pada sistem SafeRoute
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Pengguna Terdaftar
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoading ? "..." : totalUsers}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Administrator Aktif
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoading ? "..." : adminUsers}
            </p>
          </div>
        </div>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden p-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-base font-bold text-slate-900">
            Daftar Pengguna
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition"
              />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition shadow-sm border border-slate-200/60">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">NAMA</th>
                <th className="pb-3 px-3">EMAIL</th>
                <th className="pb-3 px-3">ROLE</th>
                <th className="pb-3 px-3">TANGGAL BERGABUNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                    Tidak ada pengguna yang ditemukan.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-3 font-bold text-slate-800 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </td>
                  <td className="py-4 px-3 text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                        user.role === "ADMIN"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
