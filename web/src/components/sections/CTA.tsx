import { Link } from "react-router-dom"

export default function CTA() {
  return (
    <section id="daftar" className="section">
      <div className="max-w-7xl mx-auto container-px">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-10 sm:p-16 text-center">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />

          <h2 className="relative text-3xl sm:text-4xl font-bold text-white">
            Mulai rapikan sekolah Anda hari ini
          </h2>
          <p className="relative mt-3 text-primary-100 max-w-xl mx-auto">
            Gratis untuk lembaga kecil. Daftar dalam 1 menit, langsung pakai.
          </p>

          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <a href="#daftar" className="btn bg-white text-primary-700 hover:bg-primary-50 px-6 py-3.5 text-base">
              Daftar Sekolah Gratis
            </a>
            <Link to="/login" className="btn bg-primary-700/40 text-white ring-1 ring-white/30 hover:bg-primary-700/60 px-6 py-3.5 text-base backdrop-blur">
              Masuk untuk Guru
            </Link>
          </div>

          <p className="relative mt-5 text-sm text-primary-200">
            Tidak perlu kartu kredit · Bisa berhenti kapan saja
          </p>
        </div>
      </div>
    </section>
  )
}
