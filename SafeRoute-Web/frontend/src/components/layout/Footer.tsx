import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex h-[42px] shrink-0 items-center justify-between border-t border-gray-200 bg-[#F9FAFB] px-6 text-[11px] font-semibold text-gray-500">
      <div>© 2026 SafeRoute. Melindungi Langkah Anda.</div>
      <div className="flex gap-6">
        <Link href="/privasi" className="hover:text-gray-800 transition">
          Kebijakan Privasi
        </Link>
        <Link href="/syarat" className="hover:text-gray-800 transition">
          Syarat & Ketentuan
        </Link>
      </div>
    </footer>
  );
}
