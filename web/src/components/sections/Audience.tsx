const audiences = [
  { emoji: "🧒", title: "PAUD", desc: "Data anak usia dini, absensi, galeri kegiatan, dan rapor perkembangan." },
  { emoji: "🎒", title: "TK", desc: "Jadwal aktivitas, komunikasi wali murid, dan dokumentasi kegiatan harian." },
  { emoji: "📚", title: "SD", desc: "Kelola kelas 1–6, absensi, SPP, pengumuman, jadwal, dan rapor siswa." },
  { emoji: "🧪", title: "SMP", desc: "Manajemen siswa, guru mapel, kelas, pembayaran, dan laporan akademik." },
  { emoji: "🎓", title: "SMA", desc: "Siap untuk kelas X–XII, jurusan IPA/IPS/Bahasa, PPDB, SPP, dan rapor." },
  { emoji: "🏫", title: "Sekolah Multi-Jenjang", desc: "Satu aplikasi untuk yayasan yang punya PAUD, TK, SD, SMP, dan SMA sekaligus." },
]

export default function Audience() {
  return (
    <section id="cocok" className="section bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-3xl mx-auto">
          <span className="eyebrow">Cocok Untuk</span>
          <h2 className="section-title">Fleksibel untuk PAUD sampai SMA</h2>
          <p className="section-sub mx-auto">
            Taka School sudah diarahkan untuk sekolah multi-jenjang: mulai data siswa, guru, kelas,
            PPDB, absensi, SPP, rapor, sampai dashboard analytics.
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
