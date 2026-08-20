"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/src/services/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await loginUser({
        email: emailOrPhone,
        password,
      });

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Login gagal. Periksa email dan password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Sign in with Google");
  };

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-[#0B2540]">
      <div className="relative hidden w-1/2 flex-col items-center justify-center bg-[#0B2540] px-12 md:flex">
        <div className="max-w-sm text-center">
          <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold text-white">
            <RouteIcon />
            SafeRoute
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Your Secure Journey Starts Here
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300">
            Access your dashboard to manage routes, track deliveries, and
            oversee your logistics operations with ease.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-[#B9B9B4] px-8 py-16 sm:px-14 md:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in to continue to your secure dashboard.
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Email or Phone
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-neutral-300/60 px-4 py-3 focus-within:ring-2 focus-within:ring-[#0B2540]">
                <UserIcon />
                <input
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Enter your email or phone number"
                  required
                  className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-500 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-700">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-[#0B2540] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-neutral-300/60 px-4 py-3 focus-within:ring-2 focus-within:ring-[#0B2540]">
                <LockIcon />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
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
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-neutral-400 accent-[#0B2540]"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2540] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0e2f52] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Sign In"}
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-400/50" />
            <span className="text-[10px] font-medium tracking-wide text-neutral-600">
              OR CONTINUE WITH
            </span>
            <div className="h-px flex-1 bg-neutral-400/50" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-400/60 bg-neutral-200/40 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-200"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <p className="mt-6 text-center text-sm text-neutral-700">
            Don&apos;t have an account?{" "}
            <a href="/register" className="font-semibold text-[#0B2540] underline">
              Create account
            </a>
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
        <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8" />
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
      <path d="M6 8.5c0 6 6 3 6 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.74l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.63l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}