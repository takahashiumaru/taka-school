import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Select from "../components/Select"
import TimePicker from "../components/TimePicker"
import { Classes, Schedules, Teachers, type Klass, type Teacher } from "../lib/api"

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

export default function JadwalFormPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [classes, setClasses] = useState<Klass[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [form, setForm] = useState({ classId: search.get("classId") || "", dayOfWeek: 1, startTime: "07:30", endTime: "08:30", subject: "", teacherId: "" })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const [c, t, s] = await Promise.all([Classes.list(), Teachers.list().catch(() => ({ items: [] as Teacher[] })), Schedules.list()])
        if (cancelled) return
        setClasses(c.items); setTeachers(t.items)
        if (isEdit) {
          const item = s.items.find((x) => x.id === Number(id))
          if (!item) throw new Error("Jadwal tidak ditemukan")
          setForm({ classId: String(item.class_id), dayOfWeek: item.day_of_week, startTime: item.start_time.slice(0, 5), endTime: item.end_time.slice(0, 5), subject: item.subject, teacherId: item.teacher_id ? String(item.teacher_id) : "" })
        } else if (!form.classId && c.items[0]) setForm((f) => ({ ...f, classId: String(c.items[0].id) }))
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat") }
      finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!form.classId) return
    setSubmitting(true); setError(null)
    const payload = { classId: Number(form.classId), dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime, subject: form.subject, teacherId: form.teacherId ? Number(form.teacherId) : null }
    try { if (isEdit) await Schedules.update(Number(id), payload); else await Schedules.create(payload); navigate("/jadwal") }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan") }
    finally { setSubmitting(false) }
  }

  return <AppLayout><div className="max-w-2xl">
    <Link to="/jadwal" className="text-sm font-semibold text-primary-700 dark:text-primary-300">← Kembali ke Jadwal</Link>
    <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{isEdit ? "Edit Jadwal" : "Tambah Jadwal"}</h1>
    {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}
    {loading ? <div className="mt-5 text-slate-500 dark:text-slate-400">Memuat…</div> : <form onSubmit={handleSubmit} className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 p-5 grid gap-4 dark:bg-slate-900 dark:ring-slate-800">
      <div><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelas *</span><Select required value={form.classId} onChange={(v)=>setForm({...form,classId:v})} options={classes.map(c=>({value:String(c.id),label:c.name}))} /></div>
      <div><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hari</span><Select value={String(form.dayOfWeek)} onChange={(v)=>setForm({...form,dayOfWeek:Number(v)})} options={DAYS.map((d,i)=>({value:String(i+1),label:d}))} /></div>
      <div className="grid grid-cols-2 gap-3"><div><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mulai</span><TimePicker required value={form.startTime} onChange={(v)=>setForm({...form,startTime:v})} /></div><div><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Selesai</span><TimePicker required value={form.endTime} onChange={(v)=>setForm({...form,endTime:v})} /></div></div>
      <label><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran / Aktivitas *</span><input required value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})} className="input-base" /></label>
      <div><span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Guru</span><Select value={form.teacherId} onChange={(v)=>setForm({...form,teacherId:v})} options={[{value:"",label:"— belum ditentukan —"},...teachers.map(t=>({value:String(t.id),label:t.name}))]} /></div>
      <div className="flex justify-end gap-2"><Link to="/jadwal" className="btn-secondary">Batal</Link><button disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : "Simpan"}</button></div>
    </form>}
  </div></AppLayout>
}
