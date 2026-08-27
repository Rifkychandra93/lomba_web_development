import Image from "next/image";

export default function AboutSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl">
          <Image src="/about-people.png" alt="Pengguna SafeRoute" width={520} height={400} className="w-full object-cover" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0B2540] md:text-4xl">Tentang SafeRoute</h2>
          <p className="mt-5 text-sm leading-relaxed text-neutral-600">
            Di dunia yang bergerak serba cepat, keamanan seringkali menjadi perhatian kedua. SafeRoute hadir untuk mengubah paradigma tersebut. Kami percaya bahwa setiap langkah perjalanan Anda harus diiringi dengan rasa tenang.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">
            Sistem cerdas kami secara kontinu menganalisis ribuan titik data keamanan — mulai dari kriminalitas hingga jalur terpencil — untuk menyajikan rute terbaik. Bersama SafeRoute, Anda tidak hanya sampai tujuan, tapi tiba dengan aman.
          </p>
          <a href="#fitur" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5C4B] hover:underline">
            Pelajari Lebih Lanjut
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>
    </section>
  );
}