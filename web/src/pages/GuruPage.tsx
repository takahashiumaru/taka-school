import { useEffect, useState } from "react"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import { Teachers, getUser, type Teacher } from "../lib/api"

type FormState = {
  id?: number
  name: string
  email: string
  password: string
  isActive: boolean
}

const empty: FormState = { name: "", email: "", password: "", isActive: true }

export default function GuruPage() {
  const user = getUser()
  const [items, setItems] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const r = await Teachers.list()
      setItems(r.items)
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

  function openEdit(t: Teacher) {
    setForm({
      id: t.id,
      name: t.name,
      email: t.email,
      password: "",
      isActive: !!t.is_active,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (form.id) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          isActive: form.isActive,
        }
        if (form.password) payload.password = form.password
        await Teachers.update(form.id, payload)
      } else {
        await Teachers.create({
          name: form.name,
          email: form.email,
          password: form.password,
        })
      }
      setOpen(false)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(t: Teacher) {
    if (!confirm(`Hapus guru "${t.name}"?`)) return
    try {
      await Teachers.delete(t.id)
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
          <h1 className="text-2xl font-bold text-slate-900">Data Guru</h1>
          <p className="text-sm text-slate-600 mt-1">{items.length} guru terdaftar</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Tambah Guru</button>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3">{error}</div>}

      <div className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Memuat…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Belum ada guru.</td></tr>}
              {items.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                  <td className="px-4 py-3 text-slate-600">{t.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {t.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(t)} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 mr-1">Edit</button>
                    <button onClick={() => handleDelete(t)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Guru" : "Tambah Guru"}>
        <form onSubmit={handleSave} className="grid gap-3">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Email *</span>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">
              Password {form.id ? "(kosongkan untuk tidak ganti)" : "*"}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!form.id}
              minLength={form.id ? 0 : 6}
              className="input-base"
            />
          </label>
          {form.id && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span className="text-sm text-slate-700">Aktif</span>
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? "Menyimpan…" : form.id ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
