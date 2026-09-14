import { Mail } from "lucide-react";

function RouteIconFooter() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#0B2540]">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M6 9c0 3 12 3 12 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4l16 16M20 4L4 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative border-t border-neutral-200 bg-white pt-12 pb-8">
      {/* garis aksen tipis di atas footer */}
      <span className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-[#0B2540] via-[#0D5C4B] to-[#E8930A]" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
            <div className="flex items-center gap-2">
              <RouteIconFooter />
              <span className="text-lg font-bold tracking-tight text-[#0B2540]">SafeRoute</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-[#57687A]">
              Melindungi langkah Anda dengan rute paling aman, dipilihkan otomatis dari data yang
              sudah terverifikasi.
            </p>
          </div>

          {/* Links & sosial */}
          <div className="flex flex-col items-center gap-5 md:items-end">
            <div className="flex gap-6 text-xs font-medium text-[#0B2540]">
              <a href="#" className="hover:text-[#0D5C4B] transition">Kebijakan Privasi</a>
              <a href="#" className="hover:text-[#0D5C4B] transition">Syarat &amp; Ketentuan</a>
              <a href="#" className="hover:text-[#0D5C4B] transition">Kontak</a>
            </div>

            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-[#0B2540] transition hover:border-[#0D5C4B] hover:text-[#0D5C4B]"
              >
                <InstagramIcon />
              </a>
              <a
                href="#"
                aria-label="X"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-[#0B2540] transition hover:border-[#0D5C4B] hover:text-[#0D5C4B]"
              >
                <XIcon />
              </a>
              <a
                href="#"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-[#0B2540] transition hover:border-[#0D5C4B] hover:text-[#0D5C4B]"
              >
                <Mail size={16} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-neutral-100 pt-6 text-center text-xs text-[#57687A]">
          <p>&copy; {new Date().getFullYear()} SafeRoute. Melindungi Langkah Anda.</p>
        </div>
      </div>
    </footer>
  );
}