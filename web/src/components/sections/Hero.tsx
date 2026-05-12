import { Link } from "react-router-dom"

const dashboardStats = [
  ["Siswa Aktif", "315", "text-primary-800 dark:text-primary-200", "bg-primary-50 dark:bg-primary-500/10"],
  ["SPP Terbayar", "Rp 173 jt", "text-emerald-800 dark:text-emerald-200", "bg-emerald-50 dark:bg-emerald-500/10"],
  ["PPDB Baru", "24", "text-amber-800 dark:text-amber-200", "bg-amber-50 dark:bg-amber-500/10"],
] as const

const modules = [
  ["PPDB Online", "Alamat + titik peta", "bg-blue-500"],
  ["Absensi", "91% hadir hari ini", "bg-emerald-500"],
  ["SPP", "Piutang & overdue real-time", "bg-amber-500"],
  ["Rapor", "Nilai siap dicetak", "bg-violet-500"],
] as const

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-700/20" />
        <div className="absolute top-32 -left-32 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl dark:bg-accent-500/10" />
      </div>

      <div className="max-w-7xl mx-auto container-px pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-semibold ring-1 ring-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Manajemen Sekolah · PAUD · TK · SD · SMP · SMA
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Sekolah jadi <span className="text-primary-600 dark:text-primary-400">rapi</span>,
              <br className="hidden sm:block" />
              data selalu <span className="text-primary-600 dark:text-primary-400">terukur</span>.
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl dark:text-slate-300">
              Taka School bantu kelola siswa, guru, kelas, PPDB, absensi, SPP, rapor, galeri, pengumuman,
              sampai dashboard analytics — lengkap dengan pencarian alamat <span className="font-semibold text-primary-600 dark:text-primary-400">OpenStreetMap</span> dan reminder <span className="font-semibold text-emerald-600 dark:text-emerald-400">WhatsApp</span>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#daftar" className="btn-primary">
                Daftar Sekolah Gratis
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <Link to="/login" className="btn-secondary">
                Masuk Dashboard
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <dt className="text-2xl font-bold text-slate-900 dark:text-slate-100">14+</dt>
                <dd className="text-sm text-slate-500 dark:text-slate-400">modul sekolah</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-slate-900 dark:text-slate-100">5 jenjang</dt>
                <dd className="text-sm text-slate-500 dark:text-slate-400">PAUD sampai SMA</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-slate-900 dark:text-slate-100">OSM</dt>
                <dd className="text-sm text-slate-500 dark:text-slate-400">alamat & titik map</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl bg-gradient-to-br from-primary-50 to-white ring-1 ring-slate-200 shadow-soft p-4 sm:p-6 dark:from-primary-900/30 dark:to-slate-900 dark:ring-slate-800">
              <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-3 text-xs text-slate-400 dark:text-slate-500">app.takaschool.id/dashboard</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Dashboard sekolah,</div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">SMA Taka Nusantara 👋</div>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <div>Mei 2026</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">DB demo aktif</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {dashboardStats.map(([label, value, text, bg]) => (
                      <div key={label} className={`rounded-xl p-3 ${bg}`}>
                        <div className={`text-xs ${text.replace("800", "700").replace("200", "300")}`}>{label}</div>
                        <div className={`text-xl font-bold ${text}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-[1.1fr_0.9fr] gap-3">
                    <div className="rounded-xl ring-1 ring-slate-200 p-3 dark:ring-slate-800">
                      <div className="text-xs font-semibold text-slate-500 mb-2 dark:text-slate-400">Modul Operasional Aktif</div>
                      <ul className="space-y-2 text-sm">
                        {modules.map(([name, desc, color]) => (
                          <li key={name} className="flex items-start gap-2">
                            <span className={`mt-1.5 h-2 w-2 rounded-full ${color}`} />
                            <span>
                              <span className="block font-semibold text-slate-800 dark:text-slate-200">{name}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3 dark:bg-slate-800/50 dark:ring-slate-700">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>PPDB Map</span>
                        <span className="text-primary-600 dark:text-primary-300">Leaflet + OSM</span>
                      </div>
                      <div className="relative mt-3 h-28 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 via-sky-100 to-blue-100 dark:from-emerald-950 dark:via-slate-800 dark:to-blue-950">
                        <div className="absolute left-3 right-3 top-5 h-px rotate-6 bg-white/80 dark:bg-white/20" />
                        <div className="absolute left-1 top-16 h-px w-32 -rotate-12 bg-white/80 dark:bg-white/20" />
                        <div className="absolute right-3 top-10 h-px w-28 rotate-45 bg-white/80 dark:bg-white/20" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                          <div className="h-8 w-8 rounded-full bg-rose-500/15 flex items-center justify-center">
                            <div className="h-4 w-4 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200">
                          -6.9175, 107.6191
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-primary-50 p-3 text-primary-800 ring-1 ring-primary-100 dark:bg-primary-500/10 dark:text-primary-200 dark:ring-primary-500/20">
                      <div className="font-bold text-base">30</div>
                      <div>Guru aktif</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
                      <div className="font-bold text-base">15</div>
                      <div>Kelas SMA</div>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-3 text-rose-800 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20">
                      <div className="font-bold text-base">8</div>
                      <div>Invoice overdue</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-6 -left-6 items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200 shadow-soft dark:bg-slate-900 dark:ring-slate-800">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center dark:bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.92 11.92 0 005.72 1.46h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.4z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Reminder terkirim</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">SPP & absensi via WhatsApp ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
