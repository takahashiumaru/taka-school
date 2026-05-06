const steps = [
  {
    n: "01",
    title: "Daftar Sekolah",
    desc: "Buat akun sekolah dalam 1 menit. Verifikasi via email & langsung pakai.",
    icon: "📝",
  },
  {
    n: "02",
    title: "Setup Data",
    desc: "Tambah kelas, import siswa via CSV, undang guru. Atur tarif SPP.",
    icon: "⚙️",
  },
  {
    n: "03",
    title: "Mulai Pakai",
    desc: "Guru input absensi & rapor. Orang tua otomatis dapat info via WhatsApp.",
    icon: "🚀",
  },
]

export default function HowItWorks() {
  return (
    <section id="cara" className="section">
      <div className="max-w-7xl mx-auto container-px">
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Cara Kerja</span>
          <h2 className="section-title">Tiga langkah, langsung jalan</h2>
          <p className="section-sub mx-auto">
            Tidak butuh tim IT. Admin sekolah bisa setup sendiri.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />
          {steps.map((s) => (
            <div key={s.n} className="relative bg-white">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-3xl shadow-soft ring-8 ring-white">
                  {s.icon}
                </div>
                <div className="mt-4 text-sm font-semibold text-primary-600">{s.n}</div>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
