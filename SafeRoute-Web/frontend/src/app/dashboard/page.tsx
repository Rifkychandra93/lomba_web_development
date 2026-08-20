"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/src/services/auth.service";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const result = await getCurrentUser();

        setUser(result.data);
      } catch (error) {
        console.error(error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Memuat...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-8 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Selamat datang
              </p>

              <h1 className="text-3xl font-bold">
                {user?.name}
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border px-4 py-2 hover:bg-gray-100"
            >
              Keluar
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-100 p-5">
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="mt-1 font-medium">
                {user?.email}
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 p-5">
              <p className="text-sm text-gray-500">
                Role
              </p>

              <p className="mt-1 font-medium">
                {user?.role}
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 p-5">
              <p className="text-sm text-gray-500">
                Status
              </p>

              <p className="mt-1 font-medium text-green-600">
                Authenticated
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}