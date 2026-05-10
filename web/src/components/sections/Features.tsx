type Feature = {
  title: string
  desc: string
  icon: React.ReactNode
  color: string
}

const features: Feature[] = [
  {
    title: "Data Siswa",
    desc: "Profil lengkap siswa, foto, kelas, dan nomor WA orang tua dalam satu tempat.",
    color: "from-sky-100 to-sky-50 text-sky-700 dark:from-sky-500/30 dark:to-sky-500/10 dark:text-sky-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Data Guru",
    desc: "Kelola guru & wali kelas, penugasan, status aktif, dan akun login.",
    color: "from-violet-100 to-violet-50 text-violet-700 dark:from-violet-500/30 dark:to-violet-500/10 dark:text-violet-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        <circle cx="12" cy="8" r="3" />
      </svg>
    ),
  },
  {
    title: "Absensi",
    desc: "Centang hadir/izin/sakit/alpa per kelas. Bulk input dalam hitungan detik.",
    color: "from-emerald-100 to-emerald-50 text-emerald-700 dark:from-emerald-500/30 dark:to-emerald-500/10 dark:text-emerald-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Jadwal Kelas",
    desc: "Jadwal mingguan per kelas dalam tampilan kalender yang rapi.",
    color: "from-amber-100 to-amber-50 text-amber-700 dark:from-amber-500/30 dark:to-amber-500/10 dark:text-amber-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Pembayaran SPP",
    desc: "Generate tagihan otomatis, catat pembayaran, kirim reminder via WA.",
    color: "from-rose-100 to-rose-50 text-rose-700 dark:from-rose-500/30 dark:to-rose-500/10 dark:text-rose-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M2 10h20M6 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Pengumuman",
    desc: "Buat sekali, kirim ke kelas/sekolah. Distribusi otomatis lewat WhatsApp.",
    color: "from-indigo-100 to-indigo-50 text-indigo-700 dark:from-indigo-500/30 dark:to-indigo-500/10 dark:text-indigo-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5l-7 7 7 7M4 12h16" />
      </svg>
    ),
  },
  {
    title: "Galeri Kegiatan",
    desc: "Upload foto kegiatan per album. Bagikan ke ortu via link aman.",
    color: "from-pink-100 to-pink-50 text-pink-700 dark:from-pink-500/30 dark:to-pink-500/10 dark:text-pink-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M21 17l-5-5-9 9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Rapor Sederhana",
    desc: "Capaian perkembangan PAUD/TK dengan template siap pakai → cetak PDF.",
    color: "from-teal-100 to-teal-50 text-teal-700 dark:from-teal-500/30 dark:to-teal-500/10 dark:text-teal-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Chat WhatsApp",
    desc: "Klik nomor → buka WA dengan pesan template. Ortu tetap pakai WA biasa.",
    color: "from-green-100 to-green-50 text-green-700 dark:from-green-500/30 dark:to-green-500/10 dark:text-green-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.92 11.92 0 005.72 1.46h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.4z"/>
      </svg>
    ),
  },
]

export default function Features() {
  return (
    <section id="fitur" className="section">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Fitur Lengkap</span>
          <h2 className="section-title">Semua yang sekolah kecil butuhkan</h2>
          <p className="section-sub mx-auto">
            9 modul terintegrasi. Siap pakai dari hari pertama, tanpa pelatihan rumit.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card group">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color}`}>
                <span className="h-6 w-6">{f.icon}</span>
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
