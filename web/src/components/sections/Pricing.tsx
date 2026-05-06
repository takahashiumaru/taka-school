const plans = [
  {
    name: "Gratis",
    price: "Rp 0",
    period: "/bulan",
    desc: "Cocok untuk lembaga kecil yang baru mulai.",
    features: [
      "Hingga 30 siswa",
      "1 admin · 3 guru",
      "Absensi & jadwal",
      "Pengumuman",
      "Helper Chat WhatsApp",
    ],
    cta: "Mulai Gratis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 199rb",
    period: "/bulan",
    desc: "Untuk PAUD/TK yang sudah berjalan.",
    features: [
      "Hingga 200 siswa",
      "Admin & guru tak terbatas",
      "Semua fitur Gratis",
      "Pembayaran SPP & laporan",
      "Galeri kegiatan",
      "Rapor PDF",
      "Backup harian",
    ],
    cta: "Pilih Pro",
    highlight: true,
  },
  {
    name: "Sekolah+",
    price: "Custom",
    period: "",
    desc: "Untuk SD kecil atau lembaga > 200 siswa.",
    features: [
      "Tak terbatas siswa",
      "Custom domain",
      "Onboarding & training",
      "Prioritas support",
      "WhatsApp Business API (roadmap)",
    ],
    cta: "Hubungi Kami",
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="harga" className="section bg-slate-50">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Harga</span>
          <h2 className="section-title">Mulai gratis, naik kelas saat siap</h2>
          <p className="section-sub mx-auto">
            Tanpa biaya setup, tanpa kontrak panjang. Berhenti kapan saja.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 flex flex-col ${
                p.highlight
                  ? "bg-gradient-to-br from-primary-600 to-primary-800 text-white ring-1 ring-primary-700 shadow-soft scale-[1.02]"
                  : "bg-white ring-1 ring-slate-200"
              }`}
            >
              {p.highlight && (
                <span className="self-start inline-flex items-center rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold ring-1 ring-white/20 mb-3">
                  ⭐ Paling populer
                </span>
              )}
              <h3 className={`text-lg font-semibold ${p.highlight ? "text-white" : "text-slate-900"}`}>
                {p.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${p.highlight ? "text-white" : "text-slate-900"}`}>{p.price}</span>
                <span className={`text-sm ${p.highlight ? "text-primary-100" : "text-slate-500"}`}>{p.period}</span>
              </div>
              <p className={`mt-2 text-sm ${p.highlight ? "text-primary-100" : "text-slate-600"}`}>{p.desc}</p>

              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg className={`h-5 w-5 flex-none ${p.highlight ? "text-primary-200" : "text-emerald-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={p.highlight ? "text-primary-50" : "text-slate-700"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#daftar"
                className={`mt-6 btn ${
                  p.highlight
                    ? "bg-white text-primary-700 hover:bg-primary-50 px-5 py-3"
                    : "btn-primary"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Harga belum termasuk PPN. Bisa upgrade/downgrade kapan saja.
        </p>
      </div>
    </section>
  )
}
