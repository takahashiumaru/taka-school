const steps = [
  { n: "01", title: "Setup Sekolah & Jenjang", desc: "Isi profil sekolah, pilih jenjang PAUD/TK/SD/SMP/SMA, lalu buat kelas, guru, dan role admin/guru.", icon: "🏫" },
  { n: "02", title: "Masukkan Data Operasional", desc: "Import siswa, isi wali/WhatsApp, jalankan PPDB, cari alamat lewat OpenStreetMap, dan generate tagihan SPP.", icon: "🗂️" },
  { n: "03", title: "Kelola Harian dari Dashboard", desc: "Pantau analytics, absensi, SPP/piutang, PPDB, rapor, pengumuman, jadwal, galeri, dan reminder WA dari satu tempat.", icon: "📊" },
]

export default function HowItWorks() {
  return (
    <section id="cara" className="section">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-3xl mx-auto">
          <span className="eyebrow">Cara Kerja</span>
          <h2 className="section-title">Dari setup sampai operasional sekolah</h2>
          <p className="section-sub mx-auto">
            Alurnya dibuat praktis untuk admin sekolah: siapkan data awal, jalankan proses harian,
            lalu pantau semuanya dari dashboard analytics.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-700 dark:via-primary-500 dark:to-primary-700" />
          {steps.map((s) => (
            <div key={s.n} className="relative bg-white dark:bg-slate-950">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-3xl shadow-soft ring-8 ring-white dark:ring-slate-950">
                  {s.icon}
                </div>
                <div className="mt-4 text-sm font-semibold text-primary-600 dark:text-primary-400">{s.n}</div>
                <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto dark:text-slate-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
