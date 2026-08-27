"use client";

const features = [
  { icon: "realtime", title: "Data Real-time", desc: "Informasi kejadian dan kondisi diperbarui secara langsung." },
  { icon: "report", title: "Lapor Cepat", desc: "Laporkan kejadian Anda dalam detik lengkap dengan foto dan lokasi." },
  { icon: "verify", title: "Verifikasi & Moderasi", desc: "Setiap laporan melewati proses verifikasi sebelum ditampilkan." },
  { icon: "community", title: "Komunitas Aman", desc: "Jaringan keamanan kolektif dari laporan warga yang terverifikasi." },
];

export default function FeaturesSection() {
  return (
    <section id="fitur" className="bg-neutral-50 py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0B2540]/60">Kenapa SafeRoute</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B2540]">Manfaat yang Anda Dapatkan</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-500">SafeRoute membantu Anda melakukan perjalanan lebih aman dengan informasi terverifikasi dan real-time.</p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-neutral-200 bg-white p-7 text-left transition-all duration-300 hover:shadow-xl hover:shadow-[#0B2540]/5 hover:-translate-y-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2540]/5 text-[#0B2540] transition-colors group-hover:bg-[#0B2540] group-hover:text-white">
                <FeatureIcon type={f.icon} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ type }: { type: string }) {
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "realtime") return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
  if (type === "report") return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15h6" /></svg>;
  if (type === "verify") return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
  return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
}