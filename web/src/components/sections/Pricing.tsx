const plans = [
  {
    name: "Starter",
    price: "Rp 0",
    period: "/bulan",
    desc: "Untuk demo, trial, atau sekolah yang baru mulai digitalisasi.",
    features: [
      "Hingga 50 siswa",
      "1 admin · 5 guru",
      "Data siswa, guru, kelas",
      "Absensi, jadwal, pengumuman",
      "PPDB basic",
      "Export data manual",
    ],
    cta: "Mulai Gratis",
    highlight: false,
  },
  {
    name: "Sekolah Pro",
    price: "Rp 299rb",
    period: "/bulan",
    desc: "Untuk sekolah PAUD/TK/SD/SMP/SMA yang butuh operasional lengkap.",
    features: [
      "Hingga 500 siswa",
      "Admin & guru tak terbatas",
      "Dashboard analytics",
      "PPDB + alamat OpenStreetMap + titik lat/lng",
      "SPP, piutang, overdue, reminder WA",
      "Rapor, galeri, portal, import/export",
      "Backup harian & support prioritas",
    ],
    cta: "Pilih Sekolah Pro",
    highlight: true,
  },
  {
    name: "Yayasan / Multi Sekolah",
    price: "Custom",
    period: "",
    desc: "Untuk yayasan multi-jenjang, banyak cabang, atau kebutuhan custom domain/server.",
    features: [
      "Siswa & cabang fleksibel",
      "Multi-jenjang PAUD sampai SMA",
      "Custom domain dan deployment mandiri",
      "Migrasi/import database lama",
      "Onboarding admin & training guru",
      "Integrasi WhatsApp Business API bila diperlukan",
    ],
    cta: "Hubungi Admin",
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="harga" className="section bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-3xl mx-auto">
          <span className="eyebrow">Harga</span>
          <h2 className="section-title">Paket disesuaikan dengan skala sekolah</h2>
          <p className="section-sub mx-auto">
            Mulai dari trial gratis sampai paket sekolah lengkap dengan PPDB, SPP, rapor, maps,
            analytics, backup, dan support operasional.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 flex flex-col ${
                p.highlight
                  ? "bg-gradient-to-br from-primary-600 to-primary-800 text-white ring-1 ring-primary-700 shadow-soft scale-[1.02] dark:from-primary-500 dark:to-primary-700"
                  : "bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
              }`}
            >
              {p.highlight && (
                <span className="self-start inline-flex items-center rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold ring-1 ring-white/20 mb-3">
                  ⭐ Paling sesuai fitur sekarang
                </span>
              )}
              <h3 className={`text-lg font-semibold ${p.highlight ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                {p.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${p.highlight ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>{p.price}</span>
                <span className={`text-sm ${p.highlight ? "text-primary-100" : "text-slate-500 dark:text-slate-400"}`}>{p.period}</span>
              </div>
              <p className={`mt-2 text-sm ${p.highlight ? "text-primary-100" : "text-slate-600 dark:text-slate-400"}`}>{p.desc}</p>

              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg className={`h-5 w-5 flex-none ${p.highlight ? "text-primary-200" : "text-emerald-500 dark:text-emerald-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={p.highlight ? "text-primary-50" : "text-slate-700 dark:text-slate-300"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#daftar"
                className={`mt-6 btn ${
                  p.highlight
                    ? "bg-white text-primary-700 hover:bg-primary-50 px-5 py-3 dark:bg-slate-100 dark:hover:bg-white"
                    : "btn-primary"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Harga dapat disesuaikan untuk sekolah/yayasan. Paket produksi wajib memakai database, backup,
          dan kredensial yang aman.
        </p>
      </div>
    </section>
  )
}
