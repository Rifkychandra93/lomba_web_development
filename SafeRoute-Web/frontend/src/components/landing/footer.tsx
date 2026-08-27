export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-neutral-400 md:flex-row">
        <p>&copy; {new Date().getFullYear()} SafeRoute. Melindungi Langkah Anda.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-neutral-700 transition">Kebijakan Privasi</a>
          <a href="#" className="hover:text-neutral-700 transition">Syarat &amp; Ketentuan</a>
        </div>
      </div>
    </footer>
  );
}