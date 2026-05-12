import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import { AlertBox, CardSkeleton } from "../components/UiState"
import { getUser, Portal, type Announcement, type PortalClass, type PortalInvoice, type PortalTask, type Schedule, type Student, type GradeEntry, type ReportCard } from "../lib/api"

type Kind = "teacher" | "parent" | "student"
type PortalData = {
  schedule?: Schedule[]
  classes?: PortalClass[]
  tasks?: PortalTask[]
  announcements?: Announcement[]
  children?: Student[]
  invoices?: PortalInvoice[]
  reports?: ReportCard[]
  student?: Student | null
  grades?: GradeEntry[]
}

export default function PortalPage({ kind }: { kind?: Kind }) {
  const user = getUser()
  const resolved = kind || (user?.role === "parent" ? "parent" : user?.role === "student" ? "student" : "teacher")
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = resolved === "parent" ? Portal.parent : resolved === "student" ? Portal.student : Portal.teacher
    load()
      .then((res) => mounted && setData(res))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : "Gagal memuat portal"))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [resolved])

  if (!user) return null
  if (!kind) return <Navigate to={`/portal/${resolved}`} replace />

  const title = resolved === "teacher" ? "Portal Guru" : resolved === "parent" ? "Portal Orang Tua" : "Portal Siswa"

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-primary-600 to-sky-700 p-5 sm:p-7 text-white shadow-sm">
          <p className="text-sm opacity-80">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-white/85">Halo, {user.name}. Berikut ringkasan penting yang sesuai dengan peranmu.</p>
        </div>

        {loading && <div className="mt-6"><CardSkeleton count={3} /></div>}
        {error && <div className="mt-6"><AlertBox>{error}</AlertBox></div>}
        {data && <PortalContent kind={resolved} data={data} />}
      </div>
    </AppLayout>
  )
}

function PortalContent({ kind, data }: { kind: Kind; data: PortalData }) {
  if (kind === "parent") {
    return <div className="mt-6 grid lg:grid-cols-2 gap-4">
      <Section title="Anak Terhubung" empty="Belum ada siswa yang terhubung ke akun ini.">{data.children?.map((c) => <Item key={c.id} title={c.name} sub={`${c.class_name || "Tanpa kelas"} · ${c.status}`} />)}</Section>
      <Section title="Tagihan Terbaru" empty="Belum ada tagihan.">{data.invoices?.map((i) => <Item key={i.id} title={i.invoice_no} sub={`${i.student_name || "Siswa"} · ${money(i.total_amount)} · ${i.status}`} />)}</Section>
      <Section title="Rapor" empty="Belum ada rapor dipublikasikan.">{data.reports?.map((r) => <Item key={r.id} title={r.semester_label} sub={r.status} />)}</Section>
      <Announcements items={data.announcements || []} />
    </div>
  }
  if (kind === "student") {
    return <div className="mt-6 grid lg:grid-cols-2 gap-4">
      {!data.student && <div className="lg:col-span-2"><AlertBox>Akun siswa belum ditautkan ke data siswa. Data personal ditampilkan kosong dengan aman.</AlertBox></div>}
      <Section title="Jadwal" empty="Belum ada jadwal.">{data.schedule?.map((s) => <Item key={s.id} title={s.subject} sub={`${s.start_time}–${s.end_time} · ${s.class_name || "Kelas"}`} />)}</Section>
      <Section title="Tugas" empty="Belum ada tugas.">{data.tasks?.map((t) => <Item key={t.id} title={t.title} sub={`${t.subject_name || "Mapel"} · jatuh tempo ${t.due_date || "-"}`} />)}</Section>
      <Section title="Nilai" empty="Belum ada nilai.">{data.grades?.map((g) => <Item key={g.id} title={`${g.subject_name || "Mapel"}: ${g.score}`} sub={g.semester_label || "Semester"} />)}</Section>
      <Announcements items={data.announcements || []} />
    </div>
  }
  return <div className="mt-6 grid lg:grid-cols-2 gap-4">
    <Section title="Jadwal Hari Ini" empty="Tidak ada jadwal hari ini.">{data.schedule?.map((s) => <Item key={s.id} title={s.subject} sub={`${s.start_time}–${s.end_time} · ${s.class_name || "Kelas"}`} />)}</Section>
    <Section title="Kelas Saya" empty="Belum ada kelas terkait.">{data.classes?.map((c) => <Item key={c.id} title={c.name} sub={`${c.student_count || 0} siswa`} />)}</Section>
    <Section title="Tugas Terbaru" empty="Belum ada tugas.">{data.tasks?.map((t) => <Item key={t.id} title={t.title} sub={`${t.class_name || "Kelas"} · ${t.due_date || "tanpa tenggat"}`} />)}</Section>
    <Announcements items={data.announcements || []} />
  </div>
}

function Section({ title, empty, children }: { title: string; empty: string; children?: React.ReactNode[] }) {
  const items = (children || []).filter(Boolean)
  return <section className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800"><h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2><div className="mt-4 space-y-3">{items.length ? items : <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>}</div></section>
}
function Item({ title, sub }: { title: string; sub?: string }) { return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div className="font-medium text-slate-900 dark:text-slate-100">{title}</div>{sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}</div> }
function Announcements({ items }: { items: Announcement[] }) { return <Section title="Pengumuman" empty="Belum ada pengumuman.">{items.map((a) => <Item key={a.id} title={a.title} sub={a.body.slice(0, 100)} />)}</Section> }
function money(v: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v || 0)) }
