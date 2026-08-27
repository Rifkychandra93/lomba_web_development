"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { ProfileHeader } from "@/src/components/profile/ProfileHeader";
import { SidebarSettings } from "@/src/components/profile/SidebarSettings";
import { ReportHistory } from "@/src/components/profile/ReportHistory";
import { getCurrentUser } from "@/src/services/auth.service";
import { getMyReports } from "@/src/services/report.service";
import type { Report } from "@/src/types/report";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProfileData = async () => {
      try {
        // Fetch user profile and user reports concurrently
        const [userRes, reportsRes] = await Promise.all([
          getCurrentUser(),
          getMyReports(),
        ]);

        if (userRes.success && userRes.data) {
          setUser(userRes.data);
        } else {
          throw new Error("Gagal memuat profil");
        }

        if (reportsRes.success && reportsRes.data) {
          setReports(reportsRes.data);
        }
      } catch (error) {
        console.error("Terjadi kesalahan memuat data profil:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Calculate stats based on reports
  const total = reports.length;
  const verified = reports.filter((r) => r.status === "VERIFIED").length;
  const pending = reports.filter((r) => r.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <Navbar activePage={undefined} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-[#0B2540]" />
            <p className="text-xs font-bold text-neutral-500">Memuat profil Anda...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Navbar activePage={undefined} />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Info Header */}
        <ProfileHeader user={user} stats={{ total, verified, pending }} />

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Account Settings */}
          <div className="md:col-span-4 lg:col-span-3">
            <SidebarSettings onLogout={handleLogout} />
          </div>

          {/* Right Column: Report History List */}
          <div className="md:col-span-8 lg:col-span-9">
            <ReportHistory reports={reports} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
