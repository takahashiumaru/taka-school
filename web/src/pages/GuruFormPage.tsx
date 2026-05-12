import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import { Teachers } from "../lib/api"

export default function GuruFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", password: "", isActive: true })
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Teachers.list().then((r) => {
      const t = r.items.find((x) => x.id === Number(id))
      if (!t) throw new Error("Guru tidak ditemukan")
      setForm({ name: t.name, email: t.email, password: "", isActive: !!t.is_active })
    }).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat")).finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError(null)
    try {
      if (isEdit) {
        const payload: { name: string; email: string; password?: string; isActive: boolean } = { name: form.name, email: form.email, isActive: form.isActive }
        if (form.password) payload.password = form.password
        await Teachers.update(Number(id), payload)
      } else {
        await Teachers.create({ name: form.name, email: form.email, password: form.password })
      }
      navigate("/guru")
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan") } finally { setSubmitting(false) }
  }

  return <AppLayout><div className="max-w-2xl">
    <Link to="/guru" className="text-sm font-semibold text-primary-700 dark:text-primary-300">← Kembali ke Data Guru</Link>
    <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{isEdit ? "Edit Guru" : "Tambah Guru"}</h1>
    {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}
    {loading ? <div className="mt-5 text-slate-500">Memuat…</div> : <form onSubmit={handleSubmit} className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 p-5 grid gap-4 dark:bg-slate-900 dark:ring-slate-800">
      <label><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</span><input required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="input-base" /></label>
      <label><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</span><input required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="input-base" /></label>
      <label><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password {isEdit ? "(kosongkan untuk tidak ganti)" : "*"}</span><input type="password" required={!isEdit} minLength={isEdit ? 0 : 6} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="input-base" /></label>
      {isEdit && <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form,isActive:e.target.checked})} /><span className="text-sm text-slate-700 dark:text-slate-300">Aktif</span></label>}
      <div className="flex justify-end gap-2"><Link to="/guru" className="btn-secondary">Batal</Link><button disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : "Simpan"}</button></div>
    </form>}
  </div></AppLayout>
}
