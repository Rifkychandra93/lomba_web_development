"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/src/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Simple password strength: 0-4 bars filled
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }, [password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!agreed) {
      setError("Kamu harus menyetujui Terms of Service dan Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerUser({
        name,
        // phone,
        email,
        password,
      });

      router.push("/login");
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message || "Registrasi gagal."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-[#0B2540]">
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-[#0B2540] z-10" />

      <div className="flex w-full flex-col justify-center bg-[#B9B9B4] px-8 py-16 sm:px-14 md:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Enter your details to get started with SafeRoute.
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Full Name
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-neutral-300/60 px-4 py-3 focus-within:ring-2 focus-within:ring-[#0B2540]">
                <UserIcon />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Phone Number
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-neutral-300/60 px-3 py-3 focus-within:ring-2 focus-within:ring-[#0B2540]">
                  <PhoneIcon />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    required
                    className="w-full min-w-0 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-500 outline-none"
                  />[]
                </div>
              </div> */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                  Email Address
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-neutral-300/60 px-3 py-3 focus-within:ring-2 focus-within:ring-[#0B2540]">
                  <MailIcon />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="w-full min-w-0 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-neutral-300/60 px-4 py-3 focus-within:ring-2 focus-within:ring-[#0B2540]">
                <LockIcon />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <div className="mt-2.5 flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < strength ? "bg-emerald-700" : "bg-neutral-400/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400 accent-[#0B2540]"
              />
              <span>
                I agree to the{" "}
                <a href="/terms" className="font-medium text-[#0B2540] underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="font-medium text-[#0B2540] underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2540] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0e2f52] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Mendaftarkan..." : "Register Now"}
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-700">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-[#0B2540] underline">
              Log in
            </a>
          </p>
        </div>
      </div>

      <div className="relative hidden w-1/2 flex-col items-center justify-center bg-[#0B2540] px-12 md:flex">
        <div className="max-w-sm text-center">
          <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold text-white">
            <RouteIcon />
            SafeRoute
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Secure Your Journey
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300">
            Join SafeRoute and experience reliable, protected navigation
            tailored for your safety. Advanced routing with peace of mind.
          </p>
        </div>
      </div>
    </main>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-600">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// function PhoneIcon() {
//   return (
//     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-600">
//       <path
//         d="M6 3h3l1.5 4.5L8 9c1 3 3 5 6 6l1.5-2.5L20 14v3c0 1.1-.9 2-2 2-8 0-14-6-14-14 0-1.1.9-2 2-2z"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-600">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-600">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 8.5c0 6 6 3 6 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}