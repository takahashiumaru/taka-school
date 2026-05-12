import type { CSSProperties, ReactNode } from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import { AlertBox, CardSkeleton } from "../components/UiState"
import { fetchDashboard, getUser, type DashboardStats } from "../lib/api"

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })

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
    return () => { mounted = false }
  }, [])

  if (!user) return null

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const att = stats?.attendanceToday
  const spp = stats?.sppThisMonth
  const attRate = stats?.insights?.todayAttendanceRate ?? att?.rate ?? 0
  const sppRate = stats?.insights?.sppCompletionRate ?? spp?.rate ?? 0

  return (
    <AppLayout>
      <div className="animate-card-in flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{today}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Halo, <span className="font-semibold">{user.name}</span> — pusat komando operasional sekolah hari ini.
          </p>
        </div>
        <Link to="/import-export" className="btn-secondary w-fit">Import / Export</Link>
      </div>

      {loading && <div className="mt-6"><CardSkeleton count={3} /></div>}
      {error && <div className="mt-6"><AlertBox>{error}</AlertBox></div>}

      {stats && (
        <>
          <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card title="Total Siswa" value={stats.students} sub="aktif" color="from-sky-500 to-cyan-700" to="/siswa" delay={80} />
            <Card title="Total Guru" value={stats.teachers} sub="aktif" color="from-violet-500 to-indigo-700" to="/guru" delay={160} />
            <Card title="Jumlah Kelas" value={stats.classes} sub="terdaftar" color="from-amber-500 to-orange-700" to="/kelas" delay={240} />
            <Card title="SPP Lunas" value={`${sppRate}%`} sub={`${spp?.lunas ?? 0}/${spp?.total ?? 0} tagihan`} color="from-emerald-500 to-teal-700" to="/spp" delay={320} />
          </div>

          <div className="mt-6 grid xl:grid-cols-[1.45fr_0.9fr] gap-4">
            <Panel title="Tren Absensi 7 Hari" desc="Persentase hadir harian supaya admin cepat lihat pola naik/turun.">
              <MiniBarChart data={stats.attendanceTrend ?? []} />
            </Panel>
            <Panel title={`Kesehatan SPP ${spp?.period ?? "bulan ini"}`} desc="Progress pembayaran dan nominal yang sudah masuk.">
              <div className="flex items-center gap-5">
                <DonutChart value={sppRate} />
                <div className="min-w-0 flex-1 space-y-3">
                  <Metric label="Terbayar" value={currency.format(spp?.terbayar ?? 0)} tone="text-emerald-500" />
                  <Metric label="Nominal tagihan" value={currency.format(spp?.nominal ?? 0)} />
                  <div className="text-xs text-slate-500 dark:text-slate-400">{spp?.lunas ?? 0} lunas · {spp?.belum ?? 0} belum/sebagian/lewat</div>
                  <Link to="/spp?status=belum" className="btn-primary inline-flex">Reminder SPP</Link>
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6 grid lg:grid-cols-4 gap-3">
            <InsightCard title="Absensi hari ini" value={`${attRate}%`} desc={`${att?.hadir ?? 0} hadir dari ${att?.total ?? 0} catatan`} to="/absensi" />
            <InsightCard title="Alpa" value={stats.insights?.absentToday ?? att?.alpa ?? 0} desc="Siswa perlu ditindaklanjuti" tone="rose" to="/absensi" />
            <InsightCard title="SPP belum beres" value={stats.insights?.unpaidSpp ?? spp?.belum ?? 0} desc="Tagihan perlu reminder" tone="amber" to="/spp?status=belum" />
            <InsightCard title="Agenda hari ini" value={stats.todayAgenda?.length ?? 0} desc="Jadwal kelas aktif" tone="sky" to="/jadwal" />
          </div>

          <section className="mt-6 rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Aksi Cepat</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Shortcut kerja harian admin/guru biar nggak muter-muter.</p>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <ActionButton to="/absensi" title="Input Absensi" desc="Tandai hadir hari ini" icon="✓" />
              <ActionButton to="/spp" title="Buat Tagihan" desc="Generate SPP bulan ini" icon="Rp" />
              <ActionButton to="/pengumuman" title="Kirim Pengumuman" desc="Info ke kelas/sekolah" icon="📣" />
              <ActionButton to="/siswa" title="Tambah Siswa" desc="Lengkapi data murid" icon="+" />
              <ActionButton to="/spp?status=belum" title="Reminder SPP" desc="Buka daftar belum bayar" icon="WA" />
            </div>
          </section>

          <div className="mt-6 grid xl:grid-cols-[1.2fr_0.8fr] gap-4">
            <Panel title="Kelas Perlu Perhatian" desc="Prioritas berdasarkan alpa hari ini dan SPP belum beres.">
              <ClassAttentionTable rows={stats.classAttention ?? []} />
            </Panel>
            <Panel title="Agenda Hari Ini" desc="Jadwal terdekat untuk operasional guru/admin.">
              <TodayAgenda rows={stats.todayAgenda ?? []} />
            </Panel>
          </div>
        </>
      )}
    </AppLayout>
  )
}

function Card({ title, value, sub, color, to, delay = 0 }: { title: string; value: number | string; sub: string; color: string; to?: string; delay?: number }) {
  const inner = (
    <div
      className={`animate-card-in shine-surface rounded-2xl bg-gradient-to-br ${color} text-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      <div className="text-sm text-white/80">{title}</div>
      <div className="mt-2 text-4xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-white/80">{sub}</div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

function Panel({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return <section className="animate-card-in rounded-2xl bg-white ring-1 ring-slate-200 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft dark:bg-slate-900 dark:ring-slate-800"><div className="mb-4"><h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p></div>{children}</section>
}

function MiniBarChart({ data }: { data: NonNullable<DashboardStats["attendanceTrend"]> }) {
  const max = Math.max(100, ...data.map((d) => d.rate))
  if (data.length === 0) return <EmptyState text="Belum ada data absensi mingguan." />
  return (
    <div className="h-64 flex items-end gap-2 sm:gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
      {data.map((d, index) => (
        <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="w-full flex items-end justify-center h-44">
            <div
              className="animate-bar-grow w-full max-w-12 rounded-t-2xl bg-gradient-to-t from-cyan-600 to-sky-300 shadow-lg shadow-sky-500/10 transition duration-300 hover:brightness-110"
              style={{ height: `${Math.max(8, (d.rate / max) * 100)}%`, "--delay": `${index * 90}ms` } as CSSProperties}
              title={`${d.rate}% hadir`}
            />
          </div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{d.rate}%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ value }: { value: number }) {
  const safe = Math.min(100, Math.max(0, value))
  return <div className="animate-donut-spin animate-float-soft relative h-32 w-32 shrink-0 rounded-full shadow-lg shadow-emerald-500/10" style={{ background: `conic-gradient(rgb(16 185 129) ${safe * 3.6}deg, rgb(30 41 59) 0deg)` }}><div className="absolute inset-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center"><div className="text-center"><div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{safe}%</div><div className="text-[10px] text-slate-500">lunas</div></div></div></div>
}

function Metric({ label, value, tone = "text-slate-900 dark:text-slate-100" }: { label: string; value: string; tone?: string }) { return <div><div className="text-xs text-slate-500 dark:text-slate-400">{label}</div><div className={`font-semibold ${tone}`}>{value}</div></div> }

function InsightCard({ title, value, desc, to, tone = "emerald" }: { title: string; value: number | string; desc: string; to: string; tone?: "emerald" | "rose" | "amber" | "sky" }) {
  const tones = { emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300", rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300", amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300", sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300" }
  return <Link to={to} className="animate-card-in rounded-2xl bg-white ring-1 ring-slate-200 p-4 hover:-translate-y-0.5 hover:ring-primary-300 hover:shadow-soft transition duration-300 dark:bg-slate-900 dark:ring-slate-800"><div className="text-sm text-slate-500 dark:text-slate-400">{title}</div><div className={`mt-3 inline-flex rounded-xl px-3 py-1 text-2xl font-bold tabular-nums ${tones[tone]}`}>{value}</div><div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{desc}</div></Link>
}

function ClassAttentionTable({ rows }: { rows: NonNullable<DashboardStats["classAttention"]> }) {
  if (rows.length === 0) return <EmptyState text="Belum ada kelas untuk dianalisis." />
  return <div className="space-y-2">{rows.map((row) => <Link to={`/kelas/${row.id}`} key={row.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 hover:ring-primary-300 dark:bg-slate-950/50 dark:ring-slate-800"><div><div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div><div className="text-xs text-slate-500 dark:text-slate-400">{row.students} siswa · hadir {row.attendanceRate}% · alpa {row.alpa} · SPP belum {row.sppBelum}</div></div><span className={`h-fit rounded-full px-2 py-1 text-[11px] font-semibold ${row.status === "aman" ? "bg-emerald-500/10 text-emerald-600" : row.status === "pantau" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"}`}>{row.status === "perlu_perhatian" ? "Perhatian" : row.status === "pantau" ? "Pantau" : "Aman"}</span></Link>)}</div>
}

function TodayAgenda({ rows }: { rows: NonNullable<DashboardStats["todayAgenda"]> }) {
  if (rows.length === 0) return <EmptyState text="Tidak ada jadwal kelas hari ini." />
  return <div className="space-y-3">{rows.map((row) => <div key={row.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50"><div className="text-xs font-semibold text-cyan-600 dark:text-cyan-300">{row.time}</div><div className="font-semibold text-slate-900 dark:text-slate-100">{row.subject}</div><div className="text-xs text-slate-500 dark:text-slate-400">{row.className}{row.teacherName ? ` · ${row.teacherName}` : ""}</div></div>)}</div>
}

function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">{text}</div> }

function ActionButton({ to, title, desc, icon }: { to: string; title: string; desc: string; icon: string }) {
  return <Link to={to} className="group animate-card-in rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 hover:-translate-y-1 hover:bg-primary-50 hover:ring-primary-200 hover:shadow-soft transition duration-300 dark:bg-slate-950/50 dark:ring-slate-800 dark:hover:bg-primary-500/10"><div className="h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200 flex items-center justify-center text-sm font-bold text-primary-700 transition duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:ring-primary-200 dark:bg-slate-900 dark:ring-slate-700 dark:text-primary-300">{icon}</div><div className="mt-3 font-semibold text-slate-900 text-sm dark:text-slate-100">{title}</div><div className="text-xs text-slate-500 mt-1 leading-relaxed dark:text-slate-400">{desc}</div></Link>
}
