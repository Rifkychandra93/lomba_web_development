"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getToken, clearAuth } from "@/src/lib/tokenStorage";
import { createReport } from "@/src/services/report.service";
import { getCurrentUser } from "@/src/services/auth.service";
import type { IncidentType, RiskLevel } from "@/src/types/report";
import {
  MapPin,
  Search,
  Navigation,
  ShieldCheck,
  Camera,
  Clock,
  AlertCircle,
  CheckCircle2,
  Upload,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Bell,
  Lock,
  Flame,
  Car,
  Users,
  AlertOctagon,
  MoreHorizontal,
  Phone,
  Radio,
  Eye,
  Trash2,
  ArrowRight,
  ChevronLeft,
  Building2,
} from "lucide-react";

const ReportMap = dynamic(() => import("@/src/components/report/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-xl bg-neutral-100">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-[#0B2540]" />
    </div>
  ),
});

/* ============================================================================
 * TYPES
 * ==========================================================================*/

// `IncidentType` & `RiskLevel` diimpor dari "@/src/types/report" (lihat import
// di atas) supaya satu-satunya sumber kebenaran untuk enum ini ada di sana,
// sama persis dengan yang dipakai CreateReportPayload di report.service.ts.
// Kalau muncul error "'X' is not assignable to type IncidentType/RiskLevel",
// itu tandanya src/types/report.ts belum disamakan dengan enum backend.

type WizardStep = 1 | 2 | 3;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface NominatimSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface NearestPolsek {
  name: string;
  distanceKm: number;
}

interface ReportDraft {
  category: IncidentType;
  urgency: RiskLevel;
  description: string;
  incidentDate: string;
  incidentTime: string;
  searchQuery: string;
  selectedAddress: string;
  selectedLat: number | null;
  selectedLng: number | null;
}

/* ============================================================================
 * CONSTANTS
 * ==========================================================================*/

const MAX_FILE_SIZE_MB = 15;
const DESCRIPTION_MAX_LENGTH = 1000;
const DRAFT_STORAGE_KEY = "siagakota_lapor_draft";
const NOMINATIM_HEADERS = { "User-Agent": "SafeRoute-NextJS" };

const CATEGORIES: Array<{ value: IncidentType; label: string; hint: string }> = [
  { value: "BEGAL", label: "Begal", hint: "Kekerasan jalanan" },
  { value: "JAMBRET", label: "Jambret", hint: "Perampasan cepat" },
  { value: "CURANMOR", label: "Curanmor", hint: "Motor / Mobil hilang" },
  { value: "KECELAKAAN", label: "Kecelakaan", hint: "Insiden lalu lintas" },
  { value: "TAWURAN", label: "Tawuran", hint: "Bentrok massal" },
  { value: "PENCURIAN", label: "Pencurian", hint: "Rumah / Toko / Kos" },
  { value: "PEMBACOKAN", label: "Pembacokan", hint: "Sajam / kekerasan tajam" },
  { value: "LAINNYA", label: "Lainnya", hint: "Gangguan kamtibmas" },
];

const CATEGORY_ICONS: Record<IncidentType, React.ComponentType<{ className?: string }>> = {
  BEGAL: AlertTriangle,
  JAMBRET: TrendingUp,
  CURANMOR: Bell,
  KECELAKAAN: Car,
  TAWURAN: Users,
  PENCURIAN: CreditCard,
  PEMBACOKAN: AlertOctagon,
  LAINNYA: MoreHorizontal,
};

const URGENCY_LEVELS: Array<{ value: RiskLevel; label: string; hint: string }> = [
  { value: "LOW", label: "Rendah / Arsip", hint: "Pelaku Kabur" },
  { value: "MEDIUM", label: "Sedang / Siaga", hint: "Potensi Rusuh" },
  { value: "HIGH", label: "Tinggi / Respon Cepat", hint: "Ancaman Nyata" },
  { value: "CRITICAL", label: "Kritis / Butuh Respon", hint: "Darurat Aktif" },
];

const WIZARD_STEPS: Array<{ n: WizardStep; label: string }> = [
  { n: 1, label: "Lokasi Kejadian" },
  { n: 2, label: "Kategori & Detail" },
  { n: 3, label: "Bukti & Verifikasi" },
];

/* ============================================================================
 * PURE HELPERS
 * ==========================================================================*/

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildReportedAtISOString(date: string, time: string): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T${time || "00:00:00"}`).toISOString();
}

function getQuickTimeValues(mode: "now" | "today"): { date: string; time?: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = mode === "now" ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : undefined;
  return { date, time };
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// TODO(BE): ganti stub ini dengan endpoint geospasial nearest-neighbor,
// mis. GET /polsek/nearest?lat=..&lng=.. yang mengembalikan nama & jarak
// polsek terdekat dari dataset lokasi polsek. Untuk sekarang selalu kosong.
async function fetchNearestPolsek(_lat: number, _lng: number): Promise<NearestPolsek | null> {
  return null;
}

/* ============================================================================
 * HOOKS
 * ==========================================================================*/

/** Mengelola pencarian alamat, GPS, titik terpilih di peta, dan polsek terdekat. */
function useLocationPicker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");

  const [nearestPolsek, setNearestPolsek] = useState<NearestPolsek | null>(null);
  const [isLoadingPolsek, setIsLoadingPolsek] = useState(false);

  const lookupNearestPolsek = async (lat: number, lng: number) => {
    setIsLoadingPolsek(true);
    setNearestPolsek(await fetchNearestPolsek(lat, lng));
    setIsLoadingPolsek(false);
  };

  const selectPoint = async (lat: number, lng: number, knownAddress?: string) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    const address = knownAddress ?? (await reverseGeocode(lat, lng));
    setSelectedAddress(address);
    setSearchQuery(address);
    lookupNearestPolsek(lat, lng);
  };

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=id`,
        { headers: NOMINATIM_HEADERS }
      );
      setSuggestions((await res.json()) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSuggestion = (item: NominatimSuggestion) => {
    setSuggestions([]);
    void selectPoint(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
  };

  const handleMapClick = (lat: number, lng: number) => void selectPoint(lat, lng);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await selectPoint(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
      },
      () => {
        alert("Gagal mengakses GPS.");
        setIsLocating(false);
      }
    );
  };

  /** Dipakai saat memulihkan draf tersimpan — set titik tanpa fetch ulang alamat. */
  const restore = (saved: { address: string; lat: number | null; lng: number | null }) => {
    setSelectedAddress(saved.address);
    setSelectedLat(saved.lat);
    setSelectedLng(saved.lng);
    if (saved.lat !== null && saved.lng !== null) lookupNearestPolsek(saved.lat, saved.lng);
  };

  const reset = () => {
    setSearchQuery("");
    setSuggestions([]);
    setSelectedLat(null);
    setSelectedLng(null);
    setSelectedAddress("");
    setNearestPolsek(null);
  };

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearching,
    isLocating,
    selectedLat,
    selectedLng,
    selectedAddress,
    nearestPolsek,
    isLoadingPolsek,
    isComplete: selectedLat !== null && selectedLng !== null,
    handleSearch,
    selectSuggestion,
    handleMapClick,
    handleLocate,
    restore,
    reset,
  };
}

/** Mengelola satu file bukti (foto/video): validasi ukuran, preview, drag & drop. */
function useEvidenceFile() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (candidate: File | undefined | null) => {
    if (!candidate) return;
    if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`Ukuran file melebihi ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setFileError(null);
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
  };

  const remove = () => {
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return {
    file,
    previewUrl,
    isDragging,
    fileError,
    inputRef,
    openPicker: () => inputRef.current?.click(),
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0]),
    handleDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    handleDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    },
    handleDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      acceptFile(e.dataTransfer.files?.[0]);
    },
    remove,
  };
}

/**
 * Checkbox "simpan progres" ala Google Form — murni localStorage di sisi
 * klien untuk sekarang. TODO(BE): sinkronkan ke server kalau perlu draf
 * lintas perangkat.
 */
function useReportDraft(draft: ReportDraft, applyDraft: (saved: Partial<ReportDraft>) => void) {
  const [saveProgress, setSaveProgress] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const draftSnapshot = JSON.stringify(draft);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      applyDraft(JSON.parse(raw));
      setSaveProgress(true);
      setRestoredDraft(true);
    } catch {
      // draf rusak/tidak valid — abaikan
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!saveProgress) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, draftSnapshot);
    } catch {
      // storage penuh/diblokir — abaikan, ini cuma kenyamanan tambahan
    }
  }, [saveProgress, draftSnapshot]);

  const toggleSaveProgress = () => {
    setSaveProgress((prev) => {
      const next = !prev;
      if (!next) clearDraft();
      return next;
    });
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // abaikan
    }
  };

  return { saveProgress, restoredDraft, toggleSaveProgress, clearDraft };
}

/* ============================================================================
 * SMALL PRESENTATIONAL COMPONENTS
 * ==========================================================================*/

function EmergencyBanner() {
  return (
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
  );
}

function StepIndicator({
  currentStep,
  isStepReachable,
  isStepDone,
  onSelectStep,
}: {
  currentStep: WizardStep;
  isStepReachable: (step: WizardStep) => boolean;
  isStepDone: (step: WizardStep) => boolean;
  onSelectStep: (step: WizardStep) => void;
}) {
  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-start sm:justify-center gap-2 px-4 sm:px-6 py-3 text-xs overflow-x-auto no-scrollbar">
        {WIZARD_STEPS.map((step, idx) => {
          const isActive = currentStep === step.n;
          const done = isStepDone(step.n);
          const reachable = isStepReachable(step.n);
          return (
            <div key={step.n} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelectStep(step.n)}
                className="flex items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-[#0B2540] text-white"
                      : done
                      ? "bg-emerald-500 text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.n}
                </span>
                <span
                  className={`whitespace-nowrap ${
                    isActive ? "font-medium text-[#0B2540]" : reachable ? "text-neutral-600" : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && <span className="h-px w-4 sm:w-6 bg-neutral-200 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryGrid({ value, onChange }: { value: IncidentType; onChange: (v: IncidentType) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.value];
        const isSelected = value === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors ${
              isSelected
                ? "border-[#0B2540] bg-[#0B2540]/5"
                : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100/60"
            }`}
          >
            {isSelected && <CheckCircle2 className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#0B2540]" />}
            <Icon className={`h-5 w-5 ${isSelected ? "text-[#0B2540]" : "text-neutral-400"}`} />
            <span className={`text-xs font-medium ${isSelected ? "text-[#0B2540]" : "text-neutral-600"}`}>
              {cat.label}
            </span>
            <span className="text-[10px] leading-tight text-neutral-400">{cat.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function UrgencySelector({ value, onChange }: { value: RiskLevel; onChange: (v: RiskLevel) => void }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {URGENCY_LEVELS.map((level) => {
        const isSelected = value === level.value;
        const isCritical = level.value === "CRITICAL";
        return (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
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
  );
}

function EvidenceUploader({ evidence }: { evidence: ReturnType<typeof useEvidenceFile> }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-bold text-[#0B2540]">
          <Camera className="h-4 w-4 text-neutral-400" />
          Foto / Rekaman Bukti (Opsional)
        </label>
        <span className="text-[10px] text-neutral-400">Maks. {MAX_FILE_SIZE_MB}MB (JPG, PNG, MP4)</span>
      </div>

      <div
        onClick={evidence.openPicker}
        onDragOver={evidence.handleDragOver}
        onDragLeave={evidence.handleDragLeave}
        onDrop={evidence.handleDrop}
        className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-all duration-200 ${
          evidence.isDragging
            ? "border-[#0B2540] bg-[#0B2540]/5"
            : "border-neutral-200 bg-neutral-50 hover:border-[#0B2540]/30 hover:bg-neutral-100/50"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B2540]/10">
          <Upload className="h-5 w-5 text-[#0B2540]" />
        </div>
        <p className="mt-2 text-xs text-neutral-600">
          <span className="font-semibold text-[#0B2540]">Klik untuk pilih file</span> atau seret &amp; jatuhkan
          berkas ke sini
        </p>
        <p className="mt-1 text-[10px] text-neutral-400">
          Dapat berupa tangkapan layar dashcam, foto TKP, atau rekaman video CCTV
        </p>
      </div>
      <input
        ref={evidence.inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={evidence.handleChange}
        className="hidden"
      />

      {evidence.fileError && <p className="mt-2 text-xs font-medium text-rose-600">{evidence.fileError}</p>}

      {evidence.file && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2540]/10 text-[10px] font-bold text-[#0B2540]">
              IMG
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-700">{evidence.file.name}</p>
              <p className="text-[10px] text-neutral-400">
                {formatFileSize(evidence.file.size)} • Terenkripsi
                {/* TODO(BE): label ini baru kosmetik — perlu enkripsi at-rest
                    sungguhan di sisi storage sebelum ini akurat. */}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {evidence.previewUrl && (
              <a
                href={evidence.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
              >
                <Eye className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={evidence.remove}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-800">Laporan Terkirim!</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Terima kasih telah melaporkan kejadian ini. Tim SafeRoute akan memverifikasi laporan Anda dan
          menampilkannya di peta setelah melalui proses review.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#0B2540] py-3 text-sm font-bold text-white hover:bg-[#0e2f52] transition-colors"
        >
          Kembali ke Peta
        </button>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
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
  );
}

/* ============================================================================
 * PAGE
 * ==========================================================================*/

export default function LaporPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const location = useLocationPicker();
  const evidence = useEvidenceFile();

  const [category, setCategory] = useState<IncidentType>("BEGAL");
  const [urgency, setUrgency] = useState<RiskLevel>("MEDIUM");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auth guard — sama seperti sebelumnya.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
      } catch {
        clearAuth();
        router.replace("/login");
      }
    })();
  }, [router]);

  const draft: ReportDraft = useMemo(
    () => ({
      category,
      urgency,
      description,
      incidentDate,
      incidentTime,
      searchQuery: location.searchQuery,
      selectedAddress: location.selectedAddress,
      selectedLat: location.selectedLat,
      selectedLng: location.selectedLng,
    }),
    [
      category,
      urgency,
      description,
      incidentDate,
      incidentTime,
      location.searchQuery,
      location.selectedAddress,
      location.selectedLat,
      location.selectedLng,
    ]
  );

  const applyDraft = (saved: Partial<ReportDraft>) => {
    if (saved.category) setCategory(saved.category);
    if (saved.urgency) setUrgency(saved.urgency);
    if (saved.description) setDescription(saved.description);
    if (saved.incidentDate) setIncidentDate(saved.incidentDate);
    if (saved.incidentTime) setIncidentTime(saved.incidentTime);
    if (saved.searchQuery) location.setSearchQuery(saved.searchQuery);
    if (saved.selectedAddress || typeof saved.selectedLat === "number") {
      location.restore({
        address: saved.selectedAddress ?? "",
        lat: saved.selectedLat ?? null,
        lng: saved.selectedLng ?? null,
      });
    }
  };

  const { saveProgress, restoredDraft, toggleSaveProgress, clearDraft } = useReportDraft(draft, applyDraft);

  const isStep1Complete = location.isComplete;
  const isStep2Complete = description.trim().length > 0;

  const isStepReachable = (step: WizardStep) => {
    if (step === 1) return true;
    if (step === 2) return isStep1Complete;
    return isStep1Complete && isStep2Complete;
  };

  const isStepDone = (step: WizardStep) => {
    if (step === 1) return isStep1Complete && currentStep > 1;
    if (step === 2) return isStep2Complete && currentStep > 2;
    return false;
  };

  const goToStep = (step: WizardStep) => {
    if (isStepReachable(step)) setCurrentStep(step);
  };

  const handleNextFromLocation = () => {
    if (!isStep1Complete) {
      setError("Harap klik pada peta untuk memilih lokasi kejadian sebelum melanjutkan.");
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleNextFromDetail = () => {
    if (!isStep2Complete) {
      setError("Harap isi deskripsi singkat kejadian sebelum melanjutkan.");
      return;
    }
    setError(null);
    setCurrentStep(3);
  };

  const applyQuickTime = (mode: "now" | "today") => {
    const { date, time } = getQuickTimeValues(mode);
    setIncidentDate(date);
    if (time) setIncidentTime(time);
  };

  const resetForm = () => {
    setDescription("");
    setIncidentDate("");
    setIncidentTime("");
    setCategory("BEGAL");
    setUrgency("MEDIUM");
    setCurrentStep(1);
    location.reset();
    evidence.remove();
    clearDraft();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isStep1Complete) {
      setError("Harap klik pada peta untuk memilih lokasi kejadian.");
      setCurrentStep(1);
      return;
    }
    if (!isStep2Complete) {
      setError("Harap isi deskripsi singkat kejadian.");
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      // TODO(BE): file bukti sekarang masih dikonversi ke base64 dan dikirim
      // dalam body JSON. Ini cukup untuk foto, tapi untuk video sampai 15 MB
      // base64-nya bisa membengkak ~20 MB dan tidak ideal lewat JSON body.
      // Ganti ke multipart/form-data atau upload langsung ke object storage
      // (S3/GCS) lalu kirim URL-nya saja di payload di bawah ini.
      const base64Evidence = evidence.file ? await fileToBase64(evidence.file) : undefined;

      const title = `Laporan ${CATEGORIES.find((c) => c.value === category)?.label ?? category}`;
      const res = await createReport({
        title,
        description,
        latitude: location.selectedLat as number,
        longitude: location.selectedLng as number,
        incidentType: category,
        riskLevel: urgency,
        location: location.selectedAddress,
        address: location.selectedAddress,
        imageUrl: base64Evidence,
        createdAt: buildReportedAtISOString(incidentDate, incidentTime),
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <EmergencyBanner />
      <StepIndicator
        currentStep={currentStep}
        isStepReachable={isStepReachable}
        isStepDone={isStepDone}
        onSelectStep={goToStep}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B2540] md:text-3xl">
              Form Pelaporan Insiden &amp; Kriminalitas
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-500">
              Pastikan titik koordinat dan rincian kejadian sedetail mungkin agar respon patroli dapat
              diterjunkan segera.
            </p>
            {restoredDraft && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Draf sebelumnya berhasil dimuat kembali.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {currentStep === 1 && (
              <>
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
                          value={location.searchQuery}
                          onChange={(e) => {
                            location.setSearchQuery(e.target.value);
                            if (e.target.value.length >= 3) location.handleSearch();
                          }}
                          onKeyDown={(e) => e.key === "Enter" && location.handleSearch()}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm text-neutral-700 outline-none transition-colors focus:bg-white focus:border-[#0B2540]/30 focus:ring-2 focus:ring-[#0B2540]/5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={location.handleLocate}
                        disabled={location.isLocating}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-[#0B2540] hover:bg-neutral-50 transition-colors disabled:opacity-50"
                        title="Gunakan lokasi GPS"
                      >
                        {location.isLocating ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-[#0B2540]" />
                        ) : (
                          <>
                            <Navigation className="h-3.5 w-3.5" /> GPS
                          </>
                        )}
                      </button>
                    </div>

                    {location.suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-neutral-100 bg-white shadow-xl">
                        {location.suggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => location.selectSuggestion(item)}
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
                    {location.selectedLat !== null && (
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        ✓ Terpilih
                      </span>
                    )}
                  </div>

                  <ReportMap
                    lat={location.selectedLat}
                    lng={location.selectedLng}
                    address={location.selectedAddress}
                    onMapClick={location.handleMapClick}
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Klik pada peta atau geser pin merah untuk menandai titik presisi kejadian.
                  </p>
                </div>

                {location.selectedAddress && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-800">Detail Titik Penugasan</p>
                          <p className="mt-1 text-sm text-blue-700 leading-relaxed">{location.selectedAddress}</p>
                          <p className="mt-1 text-xs text-blue-600 font-mono">
                            Lat: {location.selectedLat?.toFixed(6)} | Lng: {location.selectedLng?.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs">
                      <Building2 className="h-4 w-4 shrink-0 text-neutral-400" />
                      {location.isLoadingPolsek ? (
                        <span className="text-neutral-400">Mencari polsek terdekat...</span>
                      ) : location.nearestPolsek ? (
                        <span className="text-neutral-600">
                          Polsek Terdekat:{" "}
                          <span className="font-semibold text-[#0B2540]">
                            {location.nearestPolsek.name} ({location.nearestPolsek.distanceKm.toFixed(1)} km)
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
                        Data titik koordinat hanya diakses oleh operator kendali patroli kepolisian. Pelaporan
                        palsu atau rekayasa dapat ditindak sesuai Pasal 220 KUHP.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextFromLocation}
                  disabled={!isStep1Complete}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2540] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#0e2f52] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Lanjut ke Kategori &amp; Detail
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0B2540]">
                      Kategori Kejadian <span className="text-rose-500">*</span>
                    </h3>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                      Wajib Dipilih
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Pilih satu jenis tindak kejahatan atau situasi yang paling sesuai.
                  </p>
                  <CategoryGrid value={category} onChange={setCategory} />
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0B2540]">Detail Kejadian &amp; Kronologi</h3>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        Waktu Kejadian
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
                    <UrgencySelector value={urgency} onChange={setUrgency} />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                        Deskripsi Kronologi Kejadian <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        {description.length} / {DESCRIPTION_MAX_LENGTH} Karakter
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
                      rows={4}
                      required
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      placeholder="Ceritakan kronologi singkat kejadian..."
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700 outline-none resize-none focus:bg-white focus:border-[#0B2540]/30 transition-colors placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromDetail}
                    disabled={!isStep2Complete}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B2540] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#0e2f52] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Lanjut ke Bukti &amp; Verifikasi
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <EvidenceUploader evidence={evidence} />

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0B2540]">Ringkasan Laporan</h3>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Kategori</dt>
                      <dd className="text-right font-medium text-neutral-700">
                        {CATEGORIES.find((c) => c.value === category)?.label}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Lokasi</dt>
                      <dd className="text-right font-medium text-neutral-700">
                        {location.selectedAddress || "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Waktu</dt>
                      <dd className="text-right font-medium text-neutral-700">
                        {incidentDate ? `${incidentDate}${incidentTime ? " " + incidentTime : ""}` : "Belum diisi"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-xs">
                  <input
                    type="checkbox"
                    checked={saveProgress}
                    onChange={toggleSaveProgress}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-[#0B2540] focus:ring-[#0B2540]/30"
                  />
                  <span className="text-neutral-600">
                    Simpan progres laporan ini di perangkat saya, supaya kalau halaman tertutup atau koneksi
                    terputus, isian yang sudah diketik tidak hilang.
                  </span>
                </label>

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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Kembali
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
              </>
            )}
          </form>
        </div>
      </main>

      {showSuccessModal && (
        <SuccessModal
          onClose={() => {
            setShowSuccessModal(false);
            router.push("/home");
          }}
        />
      )}

      <SiteFooter />
    </div>
  );
}