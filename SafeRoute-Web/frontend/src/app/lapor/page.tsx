"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  User,
  LogOut,
  Search,
  Navigation,
  Shield,
  Camera,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  AlertTriangle,
  Info,
  MousePointerClick,
  ChevronDown,
} from "lucide-react";
import { createReport } from "@/src/services/report.service";
import { getCurrentUser } from "@/src/services/auth.service";
import { Navbar } from "@/src/components/layout/Navbar";

const ReportMap = dynamic(() => import("@/src/components/report/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-xl bg-neutral-100">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-[#0B2540]" />
    </div>
  ),
});

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

const CATEGORIES = [
  { value: "BEGAL", label: "Begal" },
  { value: "JAMBRET", label: "Jambret" },
  { value: "CURANMOR", label: "Curanmor" },
  { value: "PENCURIAN", label: "Pencurian" },
  { value: "PEMBACOKAN", label: "Pembacokan" },
  { value: "LAINNYA", label: "Lainnya" },
] as const;

export default function LaporPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [navbarSearch, setNavbarSearch] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [category, setCategory] = useState("BEGAL");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const loadUser = async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
        setIsLoading(false);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
      }
    };
    loadUser();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavbarSearch = async () => {
    if (!navbarSearch.trim()) return;
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          navbarSearch
        )}&limit=5&countrycodes=id`,
        { headers: { "User-Agent": "SafeRoute-NextJS" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        setSelectedLat(lat);
        setSelectedLng(lng);
        setSelectedAddress(item.display_name);
        setSearchQuery(item.display_name);
        setNavbarSearch(item.display_name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=id`,
        { headers: { "User-Agent": "SafeRoute-NextJS" } }
      );
      const data = await res.json();
      setSuggestions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSuggestion = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSelectedLat(lat);
    setSelectedLng(lng);
    setSelectedAddress(item.display_name);
    setSearchQuery(item.display_name);
    setSuggestions([]);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "SafeRoute-NextJS" } }
      );
      const data = await res.json();
      const addr = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSelectedAddress(addr);
      setSearchQuery(addr);
    } catch {
      setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setSearchQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedLat(lat);
        setSelectedLng(lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "User-Agent": "SafeRoute-NextJS" } }
          );
          const data = await res.json();
          const addr = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setSelectedAddress(addr);
          setSearchQuery(addr);
        } catch {
          setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          setSearchQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert("Gagal mengakses GPS.");
        setIsLocating(false);
      }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file melebihi 5 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file melebihi 5 MB.");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selectedLat === null || selectedLng === null) {
      setError("Harap klik pada peta untuk memilih lokasi kejadian.");
      return;
    }
    if (!description.trim()) {
      setError("Harap isi deskripsi singkat kejadian.");
      return;
    }

    setLoading(true);
    try {
      const title = `Laporan ${
        CATEGORIES.find((c) => c.value === category)?.label || category
      }`;
      const res = await createReport({
        title,
        description,
        latitude: selectedLat,
        longitude: selectedLng,
        incidentType: category as any,
        riskLevel: "MEDIUM",
        location: selectedAddress,
        address: selectedAddress,
      });

      if (res.success) {
        setSuccess("Laporan Anda berhasil dikirim dan akan segera diverifikasi!");
        setShowSuccessModal(true);
        setDescription("");
        setSelectedLat(null);
        setSelectedLng(null);
        setSelectedAddress("");
        setSearchQuery("");
        setIncidentDate("");
        setIncidentTime("");
        setPhotoFile(null);
        setPhotoPreview(null);
        setCategory("BEGAL");
      } else {
        setError(res.message || "Gagal mengirimkan laporan.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const selectedCategoryLabel = CATEGORIES.find((c) => c.value === category)?.label || "Pilih Kategori";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar activePage="lapor" />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B2540]/50">
              SafeRoute Security
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2540] md:text-3xl">
              Lapor Kejadian
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-500">
              Bantu jaga komunitas dengan melaporkan kejadian atau situasi mencurigakan
              di sekitarmu. Klik pada peta untuk menandai lokasi kejadian.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
            <div className="space-y-5">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2540]/10">
                    <MapPin className="h-5 w-5 text-[#0B2540]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B2540]">
                      Pilih Lokasi Kejadian
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Klik pada peta untuk menandai titik
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Cari alamat atau lokasi..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value.length >= 3) handleSearch();
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm text-neutral-700 outline-none transition-colors focus:bg-white focus:border-[#0B2540]/30 focus:ring-2 focus:ring-[#0B2540]/5"
                      />
                    </div>
                    <button
                      onClick={handleLocate}
                      disabled={isLocating}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                      title="Gunakan lokasi GPS"
                    >
                      {isLocating ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[#0B2540]" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-neutral-100 bg-white shadow-xl">
                      {suggestions.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSuggestion(item)}
                          className="block w-full px-3 py-2.5 text-left text-xs text-neutral-700 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 truncate"
                        >
                          {item.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-[#0B2540]" />
                    <span className="text-xs font-bold text-[#0B2540]">
                      Klik Peta untuk Pilih Titik
                    </span>
                  </div>
                  {selectedLat !== null && (
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      ✓ Terpilih
                    </span>
                  )}
                </div>

                <ReportMap
                  lat={selectedLat}
                  lng={selectedLng}
                  address={selectedAddress}
                  onMapClick={handleMapClick}
                />
              </div>

              {selectedAddress && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-800">
                        Lokasi Terpilih
                      </p>
                      <p className="mt-1 text-sm text-blue-700 leading-relaxed">
                        {selectedAddress}
                      </p>
                      <p className="mt-1 text-xs text-blue-600 font-mono">
                        Lat: {selectedLat?.toFixed(6)} | Lng: {selectedLng?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B2540]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2540]/10 text-[10px] font-bold text-[#0B2540]">
                      1
                    </span>
                    Kategori Kejadian
                  </h3>
                  
                  <div className="relative mt-3" ref={categoryRef}>
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none transition-colors focus:bg-white focus:border-[#0B2540]/30 focus:ring-2 focus:ring-[#0B2540]/5"
                    >
                      <span className="font-medium">{selectedCategoryLabel}</span>
                      <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showCategoryDropdown && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-neutral-100 bg-white shadow-xl animate-fade-in">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              setCategory(cat.value);
                              setShowCategoryDropdown(false);
                            }}
                            className={`block w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                              category === cat.value
                                ? "bg-[#0B2540]/5 text-[#0B2540]"
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B2540]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2540]/10 text-[10px] font-bold text-[#0B2540]">
                      2
                    </span>
                    Detail Kejadian
                  </h3>

                  <div className="mt-4">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      Waktu Kejadian
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none focus:bg-white focus:border-[#0B2540]/30 transition-colors"
                      />
                      <input
                        type="time"
                        value={incidentTime}
                        onChange={(e) => setIncidentTime(e.target.value)}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none focus:bg-white focus:border-[#0B2540]/30 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                      Deskripsi Singkat
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      required
                      placeholder="Ceritakan kronologi singkat kejadian..."
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 outline-none resize-none focus:bg-white focus:border-[#0B2540]/30 transition-colors placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <Camera className="h-3.5 w-3.5 text-neutral-400" />
                      Foto Bukti (Opsional)
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-all duration-200 ${
                        isDragging
                          ? "border-[#0B2540] bg-[#0B2540]/5"
                          : "border-neutral-200 bg-neutral-50 hover:border-[#0B2540]/30 hover:bg-neutral-100/50"
                      }`}
                    >
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="h-24 w-24 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto();
                            }}
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2540]/10">
                            <Upload className="h-5 w-5 text-[#0B2540]" />
                          </div>
                          <p className="mt-2 text-xs font-medium text-neutral-600">
                            Klik atau drag & drop foto di sini
                          </p>
                          <p className="mt-1 text-[10px] text-neutral-400">
                            Maks 5 Mb (JPG, PNG, WEBP)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {success && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    {success}
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2540] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#0e2f52] hover:shadow-lg hover:shadow-[#0B2540]/10 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Mengirim Laporan...
                    </>
                  ) : (
                    <>
                      Kirim Laporan
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-800">Laporan Terkirim!</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Terima kasih telah melaporkan kejadian ini. Tim SafeRoute akan memverifikasi
              laporan Anda dan menampilkannya di peta setelah melalui proses review.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/home");
              }}
              className="mt-6 w-full rounded-xl bg-[#0B2540] py-3 text-sm font-bold text-white hover:bg-[#0e2f52] transition-colors"
            >
              Kembali ke Peta
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-neutral-200 bg-white py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-xs text-neutral-400 md:flex-row">
          <p>&copy; {new Date().getFullYear()} SafeRoute. Melindungi Langkah Anda.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-neutral-700 transition">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-neutral-700 transition">
              Syarat &amp; Ketentuan
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}