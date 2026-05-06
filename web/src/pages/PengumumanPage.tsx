import { useEffect, useState } from "react"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import {
  Announcements,
  Classes,
  getUser,
  type Announcement,
  type Klass,
} from "../lib/api"

type FormState = {
  id?: number
  title: string
  body: string
  targetClassId: number | null
}

const empty: FormState = { title: "", body: "", targetClassId: null }

function fmt(d: string): string {
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
}

export default function PengumumanPage() {
  const user = getUser()
  const [items, setItems] = useState<Announcement[]>([])
  const [classes, setClasses] = useState<Klass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [a, c] = await Promise.all([Announcements.list(), Classes.list()])
      setItems(a.items)
      setClasses(c.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  function openNew() { setForm(empty); setOpen(true) }
  function openEdit(a: Announcement) {
    setForm({
      id: a.id,
      title: a.title,
      body: a.body,
      targetClassId: a.target_class_id,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = { title: form.title, body: form.body, targetClassId: form.targetClassId }
      if (form.id) await Announcements.update(form.id, payload)
      else await Announcements.create(payload)
      setOpen(false)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(a: Announcement) {
    if (!confirm(`Hapus pengumuman "${a.title}"?`)) return
    try {
      await Announcements.delete(a.id)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal")
    }
  }

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengumuman</h1>
          <p className="text-sm text-slate-600 mt-1">Info untuk guru atau kelas tertentu</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Buat Pengumuman</button>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3">{error}</div>}

      <div className="mt-5 grid gap-4">
        {loading && <div className="text-slate-500">Memuat…</div>}
        {!loading && items.length === 0 && <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-slate-500">Belum ada pengumuman.</div>}
        {items.map((a) => (
          <article key={a.id} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900">{a.title}</h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {fmt(a.created_at)}
                  {a.author_name && <span> · oleh {a.author_name}</span>}
                  {a.class_name && <span> · ke kelas {a.class_name}</span>}
                  {!a.class_name && <span> · semua kelas</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50">Edit</button>
                <button onClick={() => handleDelete(a)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50">Hapus</button>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{a.body}</p>
          </article>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Pengumuman" : "Buat Pengumuman"} size="lg">
        <form onSubmit={handleSave} className="grid gap-3">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Judul *</span>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Isi *</span>
            <textarea required rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Sasaran Kelas</span>
            <select value={form.targetClassId ?? ""} onChange={(e) => setForm({ ...form, targetClassId: e.target.value ? Number(e.target.value) : null })} className="input-base">
              <option value="">Semua kelas</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : form.id ? "Simpan" : "Kirim"}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
