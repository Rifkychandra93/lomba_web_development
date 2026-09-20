"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearAuth } from "@/src/lib/tokenStorage";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  User,
  Search,
  Navigation,
  Shield,
  ShieldCheck,
  Info,
  Camera,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Bell,
  Lock,
  FlaskConical,
  MoreHorizontal,
  Phone,
  Radio,
  Eye,
  Trash2,
  Save,
  ArrowRight,
  Building2,
  ChevronRight,
} from "lucide-react";
import { createReport } from "@/src/services/report.service";
import { getCurrentUser } from "@/src/services/auth.service";

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
  { value: "BEGAL", label: "Begal", hint: "Kekerasan jalanan" },
  { value: "JAMBRET", label: "Jambret", hint: "Perampasan cepat" },
  { value: "CURANMOR", label: "Curanmor", hint: "Motor / Mobil hilang" },
  { value: "PENCURIAN", label: "Pencurian", hint: "Rumah / Toko / Kos" },
  { value: "PEMBACOKAN", label: "Pembacokan", hint: "Sajam / Tawuran" },
  { value: "PELECEHAN", label: "Pelecehan", hint: "Kekerasan verbal/fisik" },
  { value: "NARKOBA", label: "Narkoba", hint: "Miras / Transaksi ilegal" },
  { value: "LAINNYA", label: "Lainnya", hint: "Gangguan kamtibmas" },
] as const;

// TODO(BE): PELECEHAN dan NARKOBA belum ada di enum incidentType backend.
// Perlu ditambahkan dulu di skema/enum Report sebelum value ini bisa dikirim.

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BEGAL: AlertTriangle,
  JAMBRET: TrendingUp,
  CURANMOR: Bell,
  PENCURIAN: CreditCard,
  PEMBACOKAN: Bell,
  PELECEHAN: Lock,
  NARKOBA: FlaskConical,
  LAINNYA: MoreHorizontal,
};

const URGENCY_LEVELS = [
  { value: "LOW", label: "Rendah / Arsip", hint: "Pelaku Kabur" },
  { value: "MEDIUM", label: "Sedang / Siaga", hint: "Potensi Rusuh" },
  { value: "HIGH", label: "Kritis / Butuh Respon", hint: "Darurat Aktif" },
] as const;

// TODO(BE): konfirmasi value enum riskLevel yang sebenarnya dipakai backend
// (LOW/MEDIUM/HIGH, atau ada CRITICAL terpisah dari HIGH?). Sesuaikan value
// di URGENCY_LEVELS di atas begitu dikonfirmasi.

const MAX_FILE_SIZE_MB = 15;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function LaporPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isAnonymous, setIsAnonymous] = useState(true);
  // TODO(BE): kirim `isAnonymous` di payload createReport, dan pastikan BE
  // menyimpan identitas pelapor asli secara internal (untuk keperluan Pasal
  // 220 KUHP bila laporan terbukti palsu) sambil menyembunyikannya dari
  // data yang bisa diakses publik/operator biasa.

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [nearestPolsek, setNearestPolsek] = useState<{ name: string; distanceKm: number } | null>(null);
  const [isLoadingPolsek, setIsLoadingPolsek] = useState(false);

  const [category, setCategory] = useState("BEGAL");
  const [urgency, setUrgency] = useState<(typeof URGENCY_LEVELS)[number]["value"]>("MEDIUM");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const DESCRIPTION_MAX = 1000;

  useEffect(() => {
    const token = getToken();
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
        clearAuth();
        router.replace("/login");
      }
    };
    loadUser();
  }, [router]);

  // TODO(BE): ganti stub ini dengan panggilan endpoint geospasial nearest-neighbor,
  // mis. GET /polsek/nearest?lat=..&lng=.. yang mengembalikan nama & jarak polsek
  // terdekat dari dataset lokasi polsek. Untuk sekarang field ini kosong/placeholder.
  const lookupNearestPolsek = async (lat: number, lng: number) => {
    setIsLoadingPolsek(true);
    setNearestPolsek(null);
    try {
      // Placeholder — belum ada endpoint backend untuk ini.
      // const res = await fetch(`/api/polsek/nearest?lat=${lat}&lng=${lng}`);
      // const data = await res.json();
      // setNearestPolsek({ name: data.name, distanceKm: data.distanceKm });
    } finally {
      setIsLoadingPolsek(false);
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
    lookupNearestPolsek(lat, lng);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    lookupNearestPolsek(lat, lng);

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
        lookupNearestPolsek(lat, lng);
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

  const applyQuickTime = (mode: "now" | "today") => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setIncidentDate(dateStr);
    if (mode === "now") {
      setIncidentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    }
  };

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Ukuran file melebihi ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
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
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Ukuran file melebihi ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  const removeEvidence = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setDescription("");
    setSelectedLat(null);
    setSelectedLng(null);
    setSelectedAddress("");
    setSearchQuery("");
    setIncidentDate("");
    setIncidentTime("");
    setEvidenceFile(null);
    setEvidencePreview(null);
    setCategory("BEGAL");
    setUrgency("MEDIUM");
    setNearestPolsek(null);
  };

  const buildReportedAt = () => {
    if (!incidentDate) return undefined;
    if (incidentTime) return new Date(`${incidentDate}T${incidentTime}`).toISOString();
    return new Date(`${incidentDate}T00:00:00`).toISOString();
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
      // TODO(BE): file bukti sekarang masih dikonversi ke base64 dan dikirim
      // dalam body JSON. Ini cukup untuk foto, tapi untuk video sampai 15 MB
      // base64-nya bisa membengkak ~20 MB dan tidak ideal lewat JSON body.
      // Ganti ke multipart/form-data atau upload langsung ke object storage
      // (S3/GCS) lalu kirim URL-nya saja di payload di bawah ini.
      let base64Evidence: string | undefined = undefined;
      if (evidenceFile) {
        base64Evidence = await fileToBase64(evidenceFile);
      }

      const title = `Laporan ${CATEGORIES.find((c) => c.value === category)?.label || category}`;
      const res = await createReport({
        title,
        description,
        latitude: selectedLat,
        longitude: selectedLng,
        incidentType: category as any,
        riskLevel: urgency,
        location: selectedAddress,
        address: selectedAddress,
        imageUrl: base64Evidence,
        createdAt: buildReportedAt(),
        // TODO(BE): tambahkan `isAnonymous: isAnonymous` di sini begitu backend
        // sudah punya kolom/handling untuk pelaporan anonim.
      });

      if (res.success) {
        setSuccess("Laporan Anda berhasil dikirim dan akan segera diverifikasi!");
        setShowSuccessModal(true);
        resetForm();
      } else {
        setError(res.message || "Gagal mengirimkan laporan.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  // TODO(BE): belum ada endpoint untuk menyimpan draft. Perlu status DRAFT vs
  // SUBMITTED di model Report, endpoint POST untuk menyimpan draft, dan endpoint
  // GET untuk mengambil kembali draft milik user yang belum dikirim.
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      // await saveReportDraft({ ...formState });
      await new Promise((resolve) => setTimeout(resolve, 400));
      setSuccess("Draf tersimpan secara lokal (integrasi penyimpanan draf ke server menyusul).");
    } finally {
      setSavingDraft(false);
    }
  };

  const descriptionCount = description.length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {/* Emergency banner */}
      <div className="flex flex-col items-center justify-between gap-2 bg-rose-700 px-4 py-2 text-xs text-white sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Kejadian darurat yang mengancam nyawa saat ini? Segera hubungi petugas tanpa menunggu konfirmasi form web.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-4 font-semibold">
          <a href="tel:110" className="flex items-center gap-1.5 hover:underline">
            <Phone className="h-3.5 w-3.5" /> Polisi: 110
          </a>
          <a href="tel:112" className="flex items-center gap-1.5 hover:underline">
            <Radio className="h-3.5 w-3.5" /> Darurat Depok: 112
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-neutral-200 bg-[#0B2540]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  SIAGA<span className="text-sky-400">KOTA</span>
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                  DEPOK PRESISI
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                Portal Pelaporan Kriminal &amp; Tanggap Cepat Warga Terintegrasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden items-center gap-2 text-xs text-white/70 sm:flex">
              {/* TODO(BE): ganti dot statis ini dengan status dari health-check endpoint */}
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Server Command Center: <span className="font-semibold text-emerald-400">Siaga Online</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden text-xs sm:block">
                <p className="font-medium text-white">{user?.name || "Masyarakat / Pelapor"}</p>
                <p className="text-white/50">Verifikasi NIK / Anonim</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb + stepper */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Link href="/home" className="hover:text-neutral-700">Beranda</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Layanan Pengaduan</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-[#0B2540]">Buat Laporan Baru</span>
          </div>

          {/* Visual step indicator — form ini masih satu halaman (tidak benar-benar
              multi-step / multi-route), jadi langkah 3 & 4 belum punya konten terpisah.
              TODO: pecah jadi alur multi-step sungguhan kalau diperlukan nanti. */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            {[
              { n: 1, label: "Lokasi Kejadian" },
              { n: 2, label: "Kategori & Detail" },
              { n: 3, label: "Bukti Digital" },
              { n: 4, label: "Verifikasi & Kirim" },
            ].map((step, idx) => (
              <div key={step.n} className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      step.n <= 2 ? "bg-[#0B2540] text-white" : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {step.n}
                  </span>
                  <span className={step.n <= 2 ? "font-medium text-[#0B2540]" : "text-neutral-400"}>
                    {step.label}
                  </span>
                </div>
                {idx < 3 && <span className="h-px w-4 bg-neutral-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0B2540] md:text-3xl">
                Form Pelaporan Insiden &amp; Kriminalitas
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-500">
                Pastikan titik koordinat dan rincian kejadian sedetail mungkin agar respon patroli
                dapat diterjunkan segera.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  isAnonymous ? "bg-[#0B2540]" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    isAnonymous ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <div className="text-xs">
                <p className="flex items-center gap-1 font-semibold text-amber-800">
                  Mode Pelapor Anonim {isAnonymous ? "Aktif" : "Nonaktif"}
                  <Info className="h-3 w-3" />
                </p>
                <p className="text-amber-700/80">Nama &amp; kontak Anda dirahasiakan dari catatan publik (UU PDP).</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2540]/10">
                      <MapPin className="h-5 w-5 text-[#0B2540]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0B2540]">Pilih Lokasi Kejadian</h3>
                      <p className="text-xs text-neutral-500">Ketik nama jalan atau geser pin pada peta</p>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Presisi Tinggi
                  </span>
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
                      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-[#0B2540] hover:bg-neutral-50 transition-colors disabled:opacity-50"
                      title="Gunakan lokasi GPS"
                    >
                      {isLocating ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-[#0B2540]" />
                      ) : (
                        <>
                          <Navigation className="h-3.5 w-3.5" /> GPS
                        </>
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
                  <span className="text-xs font-bold text-[#0B2540]">Peta Presisi Digital</span>
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
                <p className="mt-2 text-xs text-neutral-500">
                  Klik pada peta atau geser pin merah untuk menandai titik presisi kejadian.
                </p>
              </div>

              {selectedAddress && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-blue-800">Detail Titik Penugasan</p>
                        <p className="mt-1 text-sm text-blue-700 leading-relaxed">{selectedAddress}</p>
                        <p className="mt-1 text-xs text-blue-600 font-mono">
                          Lat: {selectedLat?.toFixed(6)} | Lng: {selectedLng?.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs">
                    <Building2 className="h-4 w-4 shrink-0 text-neutral-400" />
                    {isLoadingPolsek ? (
                      <span className="text-neutral-400">Mencari polsek terdekat...</span>
                    ) : nearestPolsek ? (
                      <span className="text-neutral-600">
                        Polsek Terdekat:{" "}
                        <span className="font-semibold text-[#0B2540]">
                          {nearestPolsek.name} ({nearestPolsek.distanceKm.toFixed(1)} km)
                        </span>
                      </span>
                    ) : (
                      <span className="text-neutral-400">
                        Polsek terdekat belum tersedia — menunggu integrasi backend.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-neutral-400" />
                  <div className="text-xs">
                    <p className="font-semibold text-neutral-700">Jaminan Keamanan &amp; UU ITE</p>
                    <p className="mt-1 leading-relaxed text-neutral-500">
                      Data titik koordinat hanya diakses oleh operator kendali patroli kepolisian.
                      Pelaporan palsu atau rekayasa dapat ditindak sesuai Pasal 220 KUHP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0B2540]">
                      1. Kategori Kejadian <span className="text-rose-500">*</span>
                    </h3>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                      Wajib Dipilih
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Pilih satu jenis tindak kejahatan atau situasi yang paling sesuai.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CATEGORIES.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.value];
                      const isSelected = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors ${
                            isSelected
                              ? "border-[#0B2540] bg-[#0B2540]/5"
                              : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100/60"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle2 className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#0B2540]" />
                          )}
                          <Icon className={`h-5 w-5 ${isSelected ? "text-[#0B2540]" : "text-neutral-400"}`} />
                          <span className={`text-xs font-medium ${isSelected ? "text-[#0B2540]" : "text-neutral-600"}`}>
                            {cat.label}
                          </span>
                          <span className="text-[10px] leading-tight text-neutral-400">{cat.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B2540]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B2540]/10 text-[10px] font-bold text-[#0B2540]">
                      2
                    </span>
                    Detail Kejadian &amp; Kronologi
                  </h3>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        Waktu Kejadian <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyQuickTime("now")}
                          className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-medium text-neutral-500 hover:bg-neutral-50"
                        >
                          Baru saja (&lt;30 mnt)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyQuickTime("today")}
                          className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-medium text-neutral-500 hover:bg-neutral-50"
                        >
                          Hari ini
                        </button>
                      </div>
                    </div>
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
                    <label className="text-xs text-neutral-600">Tingkat Urgensi / Ancaman Bahaya Saat Ini:</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {URGENCY_LEVELS.map((level) => {
                        const isSelected = urgency === level.value;
                        const isCritical = level.value === "HIGH";
                        return (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setUrgency(level.value)}
                            className={`rounded-xl border px-3 py-2.5 text-center transition-colors ${
                              isSelected
                                ? isCritical
                                  ? "border-rose-500 bg-rose-50"
                                  : "border-[#0B2540] bg-[#0B2540]/5"
                                : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100/60"
                            }`}
                          >
                            <p
                              className={`text-[10px] font-bold uppercase tracking-wide ${
                                isSelected ? (isCritical ? "text-rose-600" : "text-[#0B2540]") : "text-neutral-400"
                              }`}
                            >
                              {level.hint}
                            </p>
                            <p
                              className={`mt-0.5 text-xs font-medium ${
                                isSelected ? (isCritical ? "text-rose-700" : "text-[#0B2540]") : "text-neutral-500"
                              }`}
                            >
                              {level.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                        Deskripsi Kronologi Kejadian <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        {descriptionCount} / {DESCRIPTION_MAX} Karakter
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                      rows={4}
                      required
                      maxLength={DESCRIPTION_MAX}
                      placeholder="Ceritakan kronologi singkat kejadian..."
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 outline-none resize-none focus:bg-white focus:border-[#0B2540]/30 transition-colors placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <Camera className="h-3.5 w-3.5 text-neutral-400" />
                        Foto / Rekaman Bukti (Opsional)
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        Maks. {MAX_FILE_SIZE_MB}MB (JPG, PNG, MP4)
                      </span>
                    </div>
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2540]/10">
                        <Upload className="h-5 w-5 text-[#0B2540]" />
                      </div>
                      <p className="mt-2 text-xs text-neutral-600">
                        <span className="font-semibold text-[#0B2540]">Klik untuk pilih file</span> atau seret &amp; jatuhkan berkas ke sini
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-400">
                        Dapat berupa tangkapan layar dashcam, foto TKP, atau rekaman video CCTV
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleEvidenceChange}
                      className="hidden"
                    />

                    {evidenceFile && (
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2540]/10 text-[10px] font-bold text-[#0B2540]">
                            IMG
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-700">{evidenceFile.name}</p>
                            <p className="text-[10px] text-neutral-400">
                              {formatFileSize(evidenceFile.size)} • Terenkripsi
                              {/* TODO(BE): label "Terenkripsi" ini baru kosmetik — perlu
                                  enkripsi at-rest sungguhan di sisi storage sebelum ini akurat. */}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {evidencePreview && (
                            <a
                              href={evidencePreview}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={removeEvidence}
                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    {savingDraft ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Simpan Draf Laporan
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B2540] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#0e2f52] hover:shadow-lg hover:shadow-[#0B2540]/10 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Mengirim Laporan...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Kirim Laporan Sekarang
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Laporan Anda langsung diteruskan ke Dispatcher Polres Metro &amp; Unit Patroli Presisi terdekat.
                  {/* TODO(BE): ini masih teks statis — kalau memang harus realtime,
                      perlu integrasi/webhook ke sistem dispatch eksternal. */}
                </p>
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
          <p>&copy; {new Date().getFullYear()} SIAGA KOTA Depok. Melindungi Langkah Anda.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-neutral-700 transition">
              Kebijakan Privasi Anonimitas
            </a>
            <a href="#" className="hover:text-neutral-700 transition">
              Prosedur Perlindungan Saksi (LPSK)
            </a>
            <a href="#" className="hover:text-neutral-700 transition">
              Statistik Kriminalitas Terbuka
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}