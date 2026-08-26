const testimonials = [
  { name: "Alvian Vino", role: "Karyawan Swasta", text: "Sebagai pekerja yang sering pulang malam, SafeRoute membuat perjalanan saya jauh lebih aman. Saya bisa tahu area yang harus dihindari dan memilih jalan yang lebih terang. Sangat direkomendasikan!", stars: 5 },
  { name: "Muhammad Putra A.", role: "Mahasiswa", text: "Notifikasi real-time dari komunitas sangat membantu. Saya jadi bisa menghindari area yang sedang ada keributan. Aplikasi wajib untuk mahasiswa.", stars: 5 },
  { name: "Muhammad Dean R.", role: "Pengendara Motor", text: "Sangat akurat dalam membaca kondisi jalanan malam. Saya bisa lebih tenang saat mengantarkan penumpang dan saya bisa fokus mengendarai.", stars: 5 },
];

export default function TestimonialsSection() {
  return (
    <section id="testimoni" className="bg-neutral-50 py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#0B2540]">Apa Kata Pengguna</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-neutral-200 bg-white p-7 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B2540] text-xs font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                  <p className="text-xs text-neutral-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}