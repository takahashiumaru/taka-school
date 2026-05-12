import { Link } from "react-router-dom"

export default function CTA() {
  return (
    <section id="daftar" className="section">
      <div className="max-w-7xl mx-auto container-px">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-10 sm:p-16 text-center">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />

          <h2 className="relative text-3xl sm:text-4xl font-bold text-white">
            Siapkan sekolah digital dari PPDB sampai rapor
          </h2>
          <p className="relative mt-3 text-primary-100 max-w-2xl mx-auto">
            Cocok untuk PAUD, TK, SD, SMP, SMA, dan yayasan multi-jenjang. Coba dashboard demo,
            kelola data sekolah, dan lihat alur PPDB/SPP/rapor dalam satu aplikasi.
          </p>

          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <a href="#harga" className="btn bg-white text-primary-700 hover:bg-primary-50 px-6 py-3.5 text-base">
              Lihat Paket Sekolah
            </a>
            <Link to="/login" className="btn bg-primary-700/40 text-white ring-1 ring-white/30 hover:bg-primary-700/60 px-6 py-3.5 text-base backdrop-blur">
              Masuk Dashboard Demo
            </Link>
          </div>

          <p className="relative mt-5 text-sm text-primary-200">
            Database demo tersedia · .env aman dengan placeholder · Bisa dikembangkan untuk production
          </p>
        </div>
      </div>
    </section>
  )
}
