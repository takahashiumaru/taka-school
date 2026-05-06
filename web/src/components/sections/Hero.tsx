import { Link } from "react-router-dom"

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-200/50 blur-3xl" />
        <div className="absolute top-32 -left-32 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto container-px pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-semibold ring-1 ring-primary-200">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Manajemen Sekolah · PAUD · TK · SD Kecil
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
              Sekolah jadi <span className="text-primary-600">rapi</span>,
              <br className="hidden sm:block" />
              orang tua selalu <span className="text-primary-600">terinfo</span>.
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              Taka School bantu kelola siswa, absensi, jadwal, SPP, sampai rapor — semua dalam satu aplikasi.
              Orang tua otomatis dapat info anaknya lewat <span className="font-semibold text-emerald-600">WhatsApp</span>,
              tanpa perlu install apa-apa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#daftar" className="btn-primary">
                Daftar Sekolah Gratis
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <Link to="/login" className="btn-secondary">
                Masuk untuk Guru
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <dt className="text-2xl font-bold text-slate-900">9</dt>
                <dd className="text-sm text-slate-500">modul siap pakai</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-slate-900">2 menit</dt>
                <dd className="text-sm text-slate-500">tambah siswa baru</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-slate-900">0</dt>
                <dd className="text-sm text-slate-500">app untuk ortu</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl bg-gradient-to-br from-primary-50 to-white ring-1 ring-slate-200 shadow-soft p-4 sm:p-6">
              <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-3 text-xs text-slate-400">app.takaschool.id/dashboard</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Selamat pagi,</div>
                      <div className="text-lg font-semibold text-slate-900">Bu Anita 👋</div>
                    </div>
                    <div className="text-xs text-slate-500">Kamis · 6 Mei 2026</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-primary-50 p-3">
                      <div className="text-xs text-primary-700">Siswa Hadir</div>
                      <div className="text-xl font-bold text-primary-800">22<span className="text-sm text-primary-500">/24</span></div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <div className="text-xs text-emerald-700">Lunas SPP</div>
                      <div className="text-xl font-bold text-emerald-800">87%</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <div className="text-xs text-amber-700">Rapor</div>
                      <div className="text-xl font-bold text-amber-800">4 lagi</div>
                    </div>
                  </div>

                  <div className="rounded-xl ring-1 ring-slate-200 p-3">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Absensi Hari Ini · Kelas A</div>
                    <ul className="space-y-1.5 text-sm">
                      {[
                        ["Aisha Putri", "Hadir", "bg-emerald-500"],
                        ["Bima Saputra", "Hadir", "bg-emerald-500"],
                        ["Chandra Wijaya", "Sakit", "bg-amber-500"],
                        ["Dinda Maharani", "Hadir", "bg-emerald-500"],
                        ["Evan Pratama", "Alpa", "bg-rose-500"],
                      ].map(([name, status, color]) => (
                        <li key={name} className="flex items-center justify-between">
                          <span className="text-slate-700">{name}</span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${color}`} />
                            {status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 ring-1 ring-emerald-100 p-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.92 11.92 0 005.72 1.46h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.4zM12.05 21.4h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.21-3.75.98 1-3.65-.23-.38a9.46 9.46 0 01-1.45-5.04c0-5.23 4.26-9.49 9.49-9.49 2.53 0 4.91.99 6.7 2.78a9.43 9.43 0 012.78 6.71c0 5.23-4.26 9.49-9.49 9.49z"/>
                      </svg>
                      <div className="text-xs text-emerald-800">
                        <span className="font-semibold">Notif WA terkirim</span> ke 2 ortu siswa tidak hadir
                      </div>
                    </div>
                    <span className="text-xs text-emerald-700 font-semibold">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-6 -left-6 items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200 shadow-soft">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.92 11.92 0 005.72 1.46h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.4z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-500">Pesan terkirim ke ortu</div>
                <div className="text-sm font-semibold text-slate-900">via WhatsApp ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
