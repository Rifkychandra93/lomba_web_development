"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/src/lib/tokenStorage";
import AdminDashboard from "@/src/components/admin/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const userStr = getUser();

    if (!token || !userStr) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "ADMIN") {
        // Jika bukan ADMIN, kembalikan ke /home
        router.replace("/home");
        return;
      }
      setAuthorized(true);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D172A] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-300">Memeriksa hak akses Admin...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <AdminDashboard />;
}
