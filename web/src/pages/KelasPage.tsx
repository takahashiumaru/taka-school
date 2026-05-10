import { useEffect, useState } from "react"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import Select from "../components/Select"
import { Classes, Teachers, getUser, type Klass, type Teacher } from "../lib/api"

type FormState = {
  id?: number
  name: string
  gradeLevel: string
  homeroomTeacherId: number | null
}

const empty: FormState = { name: "", gradeLevel: "", homeroomTeacherId: null }

export default function KelasPage() {
  const user = getUser()
  const [items, setItems] = useState<Klass[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [c, t] = await Promise.all([Classes.list(), Teachers.list().catch(() => ({ items: [] as Teacher[] }))])
      setItems(c.items)
      setTeachers(t.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function openNew() {
    setForm(empty)
    setOpen(true)
  }

  function openEdit(c: Klass) {
    setForm({
      id: c.id,
      name: c.name,
      gradeLevel: c.grade_level ?? "",
      homeroomTeacherId: c.homeroom_teacher_id,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        gradeLevel: form.gradeLevel || null,
        homeroomTeacherId: form.homeroomTeacherId,
      }
      if (form.id) await Classes.update(form.id, payload)
      else await Classes.create(payload)
      setOpen(false)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(c: Klass) {
    if (!confirm(`Hapus kelas "${c.name}"? Siswa di kelas ini akan menjadi tanpa kelas.`)) return
    try {
      await Classes.delete(c.id)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus")
    }
  }

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kelas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{items.length} kelas terdaftar</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Tambah Kelas</button>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div className="text-slate-500 dark:text-slate-400">Memuat…</div>}
        {!loading && items.length === 0 && (
          <div className="text-slate-500 dark:text-slate-400">Belum ada kelas.</div>
        )}
        {items.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.grade_level || "—"}</div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">{c.student_count} siswa</span>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Wali Kelas: <span className="font-medium text-slate-800 dark:text-slate-200">{c.teacher_name || "—"}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(c)} className="btn-secondary-sm">Edit</button>
              <button onClick={() => handleDelete(c)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Kelas" : "Tambah Kelas"}>
        <form onSubmit={handleSave} className="grid gap-3">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kelas *</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="contoh: TK A1" className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenjang / Tingkat</span>
            <input value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} placeholder="contoh: TK A / Kelas 1" className="input-base" />
          </label>
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Wali Kelas</span>
            <Select
              value={form.homeroomTeacherId ? String(form.homeroomTeacherId) : ""}
              onChange={(v) => setForm({ ...form, homeroomTeacherId: v ? Number(v) : null })}
              options={[{ value: "", label: "— Belum ditentukan —" }, ...teachers.map((t) => ({ value: String(t.id), label: t.name }))]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : form.id ? "Simpan" : "Tambah"}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
