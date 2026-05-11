import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import { AlertBox, CardSkeleton } from "../components/UiState"
import {
  fetchDashboard,
  getUser,
  type DashboardStats,
} from "../lib/api"

export default function DashboardPage() {
  const user = getUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchDashboard()
      .then((s) => mounted && setStats(s))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  if (!user) return null

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const att = stats?.attendanceToday
  const spp = stats?.sppThisMonth

  return (
    <AppLayout>
      <div className="text-xs text-slate-500 dark:text-slate-400">{today}</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        Halo, <span className="font-semibold">{user.name}</span> — ringkasan operasional sekolahmu hari ini.
      </p>

      {loading && <div className="mt-6"><CardSkeleton count={3} /></div>}
      {error && <div className="mt-6"><AlertBox>{error}</AlertBox></div>}

      {stats && (
        <>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card title="Total Siswa" value={stats.students} sub="aktif" color="from-sky-500 to-sky-700" to="/siswa" />
            <Card title="Total Guru" value={stats.teachers} sub="aktif" color="from-violet-500 to-violet-700" to="/guru" />
            <Card title="Jumlah Kelas" value={stats.classes} sub="terdaftar" color="from-amber-500 to-amber-700" to="/kelas" />
          </div>

          <section className="mt-6 rounded-2xl bg-white ring-1 ring-slate-200 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-semibold text-slate-900">Aksi Cepat</h2>
                <p className="text-xs text-slate-500 mt-1">Shortcut kerja harian admin/guru biar nggak muter-muter.</p>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <ActionButton to="/absensi" title="Input Absensi" desc="Tandai hadir hari ini" icon="✓" />
              <ActionButton to="/spp" title="Buat Tagihan" desc="Generate SPP bulan ini" icon="Rp" />
              <ActionButton to="/pengumuman" title="Kirim Pengumuman" desc="Info ke kelas/sekolah" icon="📣" />
              <ActionButton to="/siswa" title="Tambah Siswa" desc="Lengkapi data murid" icon="+" />
              <ActionButton to="/spp?status=belum" title="Reminder SPP" desc="Buka daftar belum bayar" icon="WA" />
            </div>
          </section>

          <div className="mt-6 grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 dark:bg-slate-900 dark:ring-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Absensi Hari Ini</h2>
              {att && att.total > 0 ? (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <Pill label="Hadir" value={att.hadir} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" />
                  <Pill label="Izin" value={att.izin} color="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" />
                  <Pill label="Sakit" value={att.sakit} color="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" />
                  <Pill label="Alpa" value={att.alpa} color="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" />
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Belum ada absensi hari ini.
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <Link to="/absensi" className="btn-primary">
                  Input Absensi
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 dark:bg-slate-900 dark:ring-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">SPP Bulan Ini ({spp?.period})</h2>
              {spp && spp.total > 0 ? (
                <div className="mt-4 flex items-end gap-6">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(((spp.lunas || 0) / spp.total) * 100)}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">tagihan lunas</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.round(((spp.lunas || 0) / spp.total) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {spp.lunas} lunas · {spp.belum} belum · total {spp.total}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Belum ada tagihan SPP bulan ini.
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <Link to="/spp" className="btn-primary">
                  Kelola Tagihan
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLink to="/pengumuman" title="Pengumuman" desc="Kirim info ke guru / kelas" />
            <QuickLink to="/jadwal" title="Jadwal Kelas" desc="Lihat & atur jadwal mingguan" />
            <QuickLink to="/galeri" title="Galeri Kegiatan" desc="Album foto kegiatan sekolah" />
            <QuickLink to="/rapor" title="Rapor" desc="Catatan perkembangan siswa" />
          </div>
        </>
      )}
    </AppLayout>
  )
}

function Card({
  title,
  value,
  sub,
  color,
  to,
}: {
  title: string
  value: number
  sub: string
  color: string
  to?: string
}) {
  const inner = (
    <div className={`rounded-2xl bg-gradient-to-br ${color} text-white p-5 shadow-soft transition hover:scale-[1.01]`}>
      <div className="text-sm text-white/80">{title}</div>
      <div className="mt-2 text-4xl font-bold">{value}</div>
      <div className="text-xs text-white/80">{sub}</div>
    </div>
  )
  if (to) return <Link to={to}>{inner}</Link>
  return inner
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl ${color} p-3 text-center`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  )
}

function ActionButton({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: string }) {
  return (
    <Link to={to} className="group rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 hover:bg-primary-50 hover:ring-primary-200 transition">
      <div className="h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200 flex items-center justify-center text-sm font-bold text-primary-700 group-hover:ring-primary-200">
        {icon}
      </div>
      <div className="mt-3 font-semibold text-slate-900 text-sm">{title}</div>
      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</div>
    </Link>
  )
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="block rounded-xl bg-white ring-1 ring-slate-200 p-4 hover:ring-primary-300 hover:bg-primary-50/50 transition dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-primary-500 dark:hover:bg-primary-500/10"
    >
      <div className="font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</div>
    </Link>
  )
}
