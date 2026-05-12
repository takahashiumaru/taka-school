const features = [
  { title: "Dashboard Analytics", desc: "Pantau siswa, guru, kelas, absensi, PPDB, SPP, piutang, dan overdue dalam satu ringkasan visual.", emoji: "📊", color: "from-sky-100 to-sky-50 text-sky-700 dark:from-sky-500/30 dark:to-sky-500/10 dark:text-sky-300" },
  { title: "Siswa, Guru & Kelas", desc: "Kelola data siswa, wali, WhatsApp, guru, NIP, mapel, kelas, wali kelas, dan detail anggota kelas.", emoji: "🏫", color: "from-violet-100 to-violet-50 text-violet-700 dark:from-violet-500/30 dark:to-violet-500/10 dark:text-violet-300" },
  { title: "PPDB + OpenStreetMap", desc: "Form PPDB publik dengan pencarian alamat, peta interaktif, klik/drag titik, dan simpan latitude-longitude.", emoji: "🗺️", color: "from-emerald-100 to-emerald-50 text-emerald-700 dark:from-emerald-500/30 dark:to-emerald-500/10 dark:text-emerald-300" },
  { title: "Absensi & Operasional", desc: "Input kehadiran siswa, data operasional harian, dan rekap untuk dashboard sekolah.", emoji: "✅", color: "from-amber-100 to-amber-50 text-amber-700 dark:from-amber-500/30 dark:to-amber-500/10 dark:text-amber-300" },
  { title: "SPP & Reminder WA", desc: "Generate tagihan, catat pembayaran, lihat total tagihan/terbayar/piutang/overdue, dan kirim reminder WhatsApp.", emoji: "💳", color: "from-rose-100 to-rose-50 text-rose-700 dark:from-rose-500/30 dark:to-rose-500/10 dark:text-rose-300" },
  { title: "Akademik & Rapor", desc: "Kelola nilai/rapor, detail akademik siswa, dan dokumen yang siap dicetak.", emoji: "📝", color: "from-teal-100 to-teal-50 text-teal-700 dark:from-teal-500/30 dark:to-teal-500/10 dark:text-teal-300" },
  { title: "Portal, Pengumuman & Jadwal", desc: "Landing, portal publik, pengumuman sekolah, jadwal kelas, dan informasi untuk wali murid.", emoji: "📣", color: "from-indigo-100 to-indigo-50 text-indigo-700 dark:from-indigo-500/30 dark:to-indigo-500/10 dark:text-indigo-300" },
  { title: "Galeri & Dokumen", desc: "Kelola galeri kegiatan, upload aset, dan cetak dokumen administrasi dari data sekolah.", emoji: "🖼️", color: "from-pink-100 to-pink-50 text-pink-700 dark:from-pink-500/30 dark:to-pink-500/10 dark:text-pink-300" },
  { title: "Import, Export & Data Demo", desc: "Import/export data, seed demo SMA realistis, dan SQL demo untuk setup cepat tanpa data produksi.", emoji: "📦", color: "from-green-100 to-green-50 text-green-700 dark:from-green-500/30 dark:to-green-500/10 dark:text-green-300" },
]

export default function Features() {
  return (
    <section id="fitur" className="section">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-3xl mx-auto">
          <span className="eyebrow">Fitur Lengkap</span>
          <h2 className="section-title">Modul sekolah modern dari PPDB sampai SPP</h2>
          <p className="section-sub mx-auto">
            Dibuat untuk operasional sekolah multi-jenjang: data inti, akademik, keuangan, komunikasi,
            peta alamat, dan laporan analytics dalam satu aplikasi.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card group">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${f.color}`}>
                {f.emoji}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
