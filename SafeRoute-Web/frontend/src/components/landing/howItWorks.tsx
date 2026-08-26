const steps = [
  { num: "1", icon: "search", title: "Cari Lokasi", desc: "Masukkan destinasi Anda dan dapatkan rute dengan analisis keamanan." },
  { num: "2", icon: "risk", title: "Lihat Risiko", desc: "Setiap rute menampilkan informasi risiko keamanan berdasarkan data real-time." },
  { num: "3", icon: "alert", title: "Lapor Kejadian", desc: "Bantu pengguna lain dengan melaporkan insiden keamanan di sekitar Anda." },
];

export default function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#0B2540]">Cara Kerja SafeRoute</h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B2540]/5 text-[#0B2540]">
                <StepIcon type={s.icon} />
              </div>
              <p className="text-lg font-bold text-[#0B2540]">{s.num}. {s.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepIcon({ type }: { type: string }) {
  const props = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "search") return <svg {...props}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
  if (type === "risk") return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>;
  return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></svg>;
}