import { useEffect, useMemo, useState } from "react"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import Select from "../components/Select"
import {
  Reports,
  Students,
  getUser,
  waLink,
  type Report,
  type Student,
} from "../lib/api"

type FormState = {
  id?: number
  studentId: number | ""
  semester: string
  body: string
}

const empty: FormState = { studentId: "", semester: "", body: "" }

function defaultSemester(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const half = month >= 7 ? "Ganjil" : "Genap"
  const ay = month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`
  return `${ay} ${half}`
}

export default function RaporPage() {
  const user = getUser()
  const [items, setItems] = useState<Report[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)
  const [filterStudent, setFilterStudent] = useState<number | "">("")

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [r, s] = await Promise.all([
        Reports.list(filterStudent || undefined),
        Students.list({ status: "aktif" }),
      ])
      setItems(r.items)
      setStudents(s.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [filterStudent])

  function openNew() {
    setForm({ ...empty, semester: defaultSemester() })
    setOpen(true)
  }

  function openEdit(r: Report) {
    setForm({
      id: r.id,
      studentId: r.student_id,
      semester: r.semester,
      body: r.body,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.studentId) return
    setSubmitting(true)
    setError(null)
    try {
      if (form.id) {
        await Reports.update(form.id, { semester: form.semester, body: form.body })
      } else {
        await Reports.create({
          studentId: Number(form.studentId),
          semester: form.semester,
          body: form.body,
        })
      }
      setOpen(false)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(r: Report) {
    if (!confirm(`Hapus rapor ${r.student_name} (${r.semester})?`)) return
    try {
      await Reports.delete(r.id)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal")
    }
  }

  const studentMap = useMemo(() => {
    const m = new Map<number, Student>()
    for (const s of students) m.set(s.id, s)
    return m
  }, [students])

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rapor Sederhana</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Catatan perkembangan siswa per semester</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Buat Rapor</button>
      </div>

      <div className="mt-5 max-w-sm">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Filter Siswa</span>
        <Select
          value={filterStudent === "" ? "" : String(filterStudent)}
          onChange={(v) => setFilterStudent(v ? Number(v) : "")}
          options={[{ value: "", label: "Semua siswa" }, ...students.map((s) => ({ value: String(s.id), label: s.name }))]}
        />
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}

      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        {loading && <div className="text-slate-500 dark:text-slate-400">Memuat…</div>}
        {!loading && items.length === 0 && <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-slate-500 dark:bg-slate-900 dark:ring-slate-800 dark:text-slate-400">Belum ada rapor.</div>}
        {items.map((r) => {
          const stud = studentMap.get(r.student_id)
          const wa = stud?.parent_wa
            ? waLink(stud.parent_wa, `Yth. ${stud.parent_name || "Bapak/Ibu"}, berikut catatan rapor ananda ${r.student_name} untuk ${r.semester}:\n\n${r.body}\n\nTerima kasih.`)
            : null
          return (
            <article key={r.id} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">{r.student_name}</h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {r.semester}
                    {r.class_name && <span> · {r.class_name}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="text-xs font-semibold px-2 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20">WA</a>}
                  <button onClick={() => openEdit(r)} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10">Edit</button>
                  <button onClick={() => handleDelete(r)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{r.body}</p>
            </article>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Rapor" : "Buat Rapor"} size="lg">
        <form onSubmit={handleSave} className="grid gap-3">
          {!form.id && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Siswa *</span>
              <Select
                value={form.studentId === "" ? "" : String(form.studentId)}
                onChange={(v) => setForm({ ...form, studentId: v ? Number(v) : "" })}
                placeholder="— pilih siswa —"
                required
                options={students.map((s) => ({ value: String(s.id), label: s.name, hint: s.class_name || undefined }))}
              />
            </div>
          )}
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester *</span>
            <input required value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="contoh: 2025/2026 Ganjil" className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan Perkembangan *</span>
            <textarea
              required
              rows={10}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Aspek kognitif, sosial-emosional, motorik, kemandirian, dll."
              className="input-base"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : form.id ? "Simpan" : "Buat"}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
