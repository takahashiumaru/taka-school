const audiences = [
  { emoji: "🧒", title: "PAUD", desc: "Kelola data anak usia dini & rapor capaian perkembangan." },
  { emoji: "🎒", title: "TK", desc: "Absensi mudah, jadwal aktivitas, dan galeri kegiatan." },
  { emoji: "📚", title: "SD Kecil", desc: "Cocok untuk SD swasta kecil dengan 1–6 kelas." },
  { emoji: "✏️", title: "Bimbel", desc: "Catat kehadiran, jadwal kelas, dan tagihan biaya bulanan." },
  { emoji: "🕌", title: "TPA / Madrasah", desc: "Manajemen santri, jadwal mengaji, dan iuran." },
  { emoji: "🎨", title: "Sanggar / Kursus", desc: "Track murid, jadwal latihan, dan pembayaran." },
]

export default function Audience() {
  return (
    <section id="cocok" className="section bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Cocok Untuk</span>
          <h2 className="section-title">Dirancang untuk lembaga skala kecil</h2>
          <p className="section-sub mx-auto">
            Sesuai untuk lembaga dengan ~10 sampai 500 siswa.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {audiences.map((a) => (
            <div key={a.title} className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 hover:shadow-soft transition dark:bg-slate-900 dark:ring-slate-800">
              <div className="text-4xl">{a.emoji}</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
