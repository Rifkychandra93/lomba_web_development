"use client";

import { FormEvent, useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, googleLogin } from "@/src/services/auth.service";
import { saveAuth } from "@/src/lib/tokenStorage";

interface AuthContainerProps {
  initialMode: "login" | "register";
}

export default function AuthContainer({ initialMode }: AuthContainerProps) {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationTarget, setAnimationTarget] = useState(initialMode === "register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const targetMode = window.location.pathname === "/register";
      setIsAnimating(true);
      setAnimationTarget(targetMode);
      setTimeout(() => {
        setIsRegister(targetMode);
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 350);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const scriptId = "google-identity-script";

    function initializeGoogle() {
      // @ts-ignore -- window.google disuntik oleh script eksternal Google
      if (!window.google || !googleButtonRef.current) return;

      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      // @ts-ignore
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 280,
      });

      setGoogleReady(true);
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  const handleSwitchMode = (registerMode: boolean, preserveSuccess = false) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationTarget(registerMode);

    setTimeout(() => {
      setIsRegister(registerMode);
      window.history.pushState(null, "", registerMode ? "/register" : "/login");
      setError("");
      if (!preserveSuccess) {
        setSuccess("");
      }

      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 350);
  };

  const strength = useMemo(() => {
    let score = 0;
    if (registerPassword.length >= 6) score++;
    if (registerPassword.length >= 10) score++;
    if (/[A-Z]/.test(registerPassword) && /[0-9]/.test(registerPassword)) score++;
    if (/[^A-Za-z0-9]/.test(registerPassword)) score++;
    return Math.min(score, 4);
  }, [registerPassword]);

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await loginUser({
        email: emailOrPhone,
        password: loginPassword,
      });

      saveAuth(result.data.token, result.data.user, remember);

      router.push("/home");
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

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) {
      setError("Kamu harus menyetujui Terms of Service dan Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await registerUser({
        name,
        email,
        phone,
        password: registerPassword,
      });

      setSuccess("Registrasi berhasil! Silakan masuk dengan akun baru Anda.");
      setName("");
      setEmail("");
      setPhone("");
      setRegisterPassword("");
      setAgreed(false);
      handleSwitchMode(false, true);
    } catch (error: any) {
      console.error(error);
      setError(error?.response?.data?.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  // --- Tambahan: terima token dari Google, kirim ke backend ---
  async function handleGoogleCredential(response: { credential: string }) {
    setLoading(true);
    setError("");

    try {
      const result = await googleLogin(response.credential);

      saveAuth(result.data.token, result.data.user, remember);

      router.push("/home");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Login dengan Google gagal, coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignIn = () => {
    if (!googleReady) {
      setError("Google Sign-In belum siap, tunggu sebentar lalu coba lagi.");
      return;
    }

    const hiddenGoogleButton = googleButtonRef.current?.querySelector(
      'div[role="button"]'
    ) as HTMLElement | null;

    hiddenGoogleButton?.click();
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white flex">
      <div
        ref={googleButtonRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
        }}
      />

      <div
        className={`absolute top-0 bottom-0 left-0 w-1/2 bg-[#0B2540] hidden md:flex flex-col items-center justify-center px-12 overflow-hidden z-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isRegister ? "translate-x-0" : "translate-x-full"
        } ${
          isAnimating
            ? "scale-x-[0.01] scale-y-[0.1] opacity-0 rotate-[15deg] blur-md"
            : "scale-x-100 scale-y-100 opacity-100 rotate-0 blur-none"
        }`}
      >
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center px-12 text-center transition-all duration-500 ease-in-out ${
            animationTarget ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          }`}
        >
          <a href ="/" className="mb-6 flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-white">
            <RouteIcon />
            SafeRoute
          </a>
          <h2 className="text-2xl font-medium text-white">
            Your Secure Journey Starts Here
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300 max-w-sm">
            Access your dashboard to manage routes, track deliveries, and
            oversee your logistics operations with ease.
          </p>
        </div>

        <div
          className={`absolute inset-0 flex flex-col items-center justify-center px-12 text-center transition-all duration-500 ease-in-out ${
            animationTarget ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <a href="/" className="mb-6 flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-white">
            <RouteIcon />
            SafeRoute
          </a>
          <h2 className="text-2xl font-medium text-white">
            Secure Your Journey
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300 max-w-sm">
            Join SafeRoute and experience reliable, protected navigation
            tailored for your safety. Advanced routing with peace of mind.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 w-full min-h-screen relative z-10">
        
        <div
          className={`flex w-full flex-col justify-center px-8 py-16 sm:px-14 lg:px-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            animationTarget ? "opacity-0 scale-95 pointer-events-none md:opacity-10" : "opacity-100 scale-100"
          } ${isRegister ? "max-md:hidden" : ""}`}
        >
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Sign in to continue to your secure dashboard.
            </p>

            {error && !isRegister && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-800">
                  Email or Phone
                </label>
                <div className="flex items-center gap-3 rounded-xl bg-white border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-3 focus-within:border-[#0B2540] focus-within:ring-2 focus-within:ring-[#0B2540]/20 transition">
                  <UserIcon />
                  <input
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="Enter your email or phone number"
                    required
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800">
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#0B2540] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-3 focus-within:border-[#0B2540] focus-within:ring-2 focus-within:ring-[#0B2540]/20 transition">
                  <LockIcon />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((s) => !s)}
                    aria-label={
                      showLoginPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                    className="text-neutral-600 hover:text-neutral-800"
                  >
                    <EyeIcon open={showLoginPassword} />
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-neutral-500 accent-[#0B2540]"
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-transparent px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-black/5"
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            <p className="mt-6 text-center text-sm text-neutral-700">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode(true)}
                className="font-bold text-[#0B2540] hover:underline"
              >
                Create account
              </button>
            </p>
          </div>
        </div>

        <div
          className={`flex w-full flex-col justify-center px-8 py-16 sm:px-14 lg:px-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            !animationTarget ? "opacity-0 scale-95 pointer-events-none md:opacity-10" : "opacity-100 scale-100"
          } ${!isRegister ? "max-md:hidden" : ""}`}
        >
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Enter your details to get started with SafeRoute.
            </p>

            {error && isRegister && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-800">
                  Full Name
                </label>
                <div className="flex items-center gap-3 rounded-xl bg-white border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-3 focus-within:border-[#0B2540] focus-within:ring-2 focus-within:ring-[#0B2540]/20 transition">
                  <UserIcon />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-800">
                  Phone Number
                </label>
                <div className="flex items-center gap-3 rounded-xl bg-white border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-3 focus-within:border-[#0B2540] focus-within:ring-2 focus-within:ring-[#0B2540]/20 transition">
                  <PhoneIcon />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-800">
                  Email Address
                </label>
                <div className="flex items-center gap-3 rounded-xl bg-white border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-3 focus-within:border-[#0B2540] focus-within:ring-2 focus-within:ring-[#0B2540]/20 transition">
                  <MailIcon />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-800">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-xl bg-white border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-3 focus-within:border-[#0B2540] focus-within:ring-2 focus-within:ring-[#0B2540]/20 transition">
                  <LockIcon />
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((s) => !s)}
                    aria-label={
                      showRegisterPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                    className="text-neutral-600 hover:text-neutral-800"
                  >
                    <EyeIcon open={showRegisterPassword} />
                  </button>
                </div>

                <div className="mt-2.5 flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < strength ? "bg-emerald-700" : "bg-black/15"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs font-medium text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-500 accent-[#0B2540]"
                />
                <span>
                  I agree to the{" "}
                  <a href="/terms" className="font-semibold text-[#0B2540] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="font-semibold text-[#0B2540] hover:underline">
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
              <button
                type="button"
                onClick={() => handleSwitchMode(false)}
                className="font-bold text-[#0B2540] hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-700">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-700">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-700">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-700">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-700">
        <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-700">
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M6 9c0 3 12 3 12 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
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