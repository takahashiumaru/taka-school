import { useEffect, useMemo, useState } from "react"
import AppLayout from "../components/AppLayout"
import Modal from "../components/Modal"
import {
  Classes,
  Schedules,
  Teachers,
  getUser,
  type Klass,
  type Schedule,
  type Teacher,
} from "../lib/api"

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

type FormState = {
  id?: number
  classId: number | ""
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
  teacherId: number | null
}

const empty: FormState = { classId: "", dayOfWeek: 1, startTime: "07:30", endTime: "08:30", subject: "", teacherId: null }

export default function JadwalPage() {
  const user = getUser()
  const [classes, setClasses] = useState<Klass[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classId, setClassId] = useState<number | "">("")
  const [items, setItems] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [c, t, s] = await Promise.all([
        Classes.list(),
        Teachers.list().catch(() => ({ items: [] as Teacher[] })),
        Schedules.list(classId || undefined),
      ])
      setClasses(c.items)
      setTeachers(t.items)
      setItems(s.items)
      if (!classId && c.items.length > 0) setClassId(c.items[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [classId])

  const grouped = useMemo(() => {
    const map = new Map<number, Schedule[]>()
    for (const s of items) {
      if (!map.has(s.day_of_week)) map.set(s.day_of_week, [])
      map.get(s.day_of_week)!.push(s)
    }
    for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return map
  }, [items])

  function openNew() {
    setForm({ ...empty, classId: classId || "" })
    setOpen(true)
  }

  function openEdit(s: Schedule) {
    setForm({
      id: s.id,
      classId: s.class_id,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time.slice(0, 5),
      endTime: s.end_time.slice(0, 5),
      subject: s.subject,
      teacherId: s.teacher_id,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.classId) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        classId: Number(form.classId),
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        subject: form.subject,
        teacherId: form.teacherId,
      }
      if (form.id) await Schedules.update(form.id, payload)
      else await Schedules.create(payload)
      setOpen(false)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(s: Schedule) {
    if (!confirm(`Hapus jadwal ${s.subject}?`)) return
    try {
      await Schedules.delete(s.id)
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
          <h1 className="text-2xl font-bold text-slate-900">Jadwal Kelas</h1>
          <p className="text-sm text-slate-600 mt-1">Jadwal mingguan per kelas</p>
        </div>
        {classId && <button onClick={openNew} className="btn-primary">+ Tambah Jadwal</button>}
      </div>

      <div className="mt-5 max-w-sm">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Kelas</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : "")} className="input-base">
            <option value="">— pilih kelas —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3">{error}</div>}

      <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day, idx) => {
          const dayNum = idx + 1
          const list = grouped.get(dayNum) || []
          return (
            <div key={day} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-700 mb-3">{day}</div>
              {loading && <div className="text-xs text-slate-500">Memuat…</div>}
              {!loading && list.length === 0 && <div className="text-xs text-slate-400">Tidak ada jadwal.</div>}
              <div className="space-y-2">
                {list.map((s) => (
                  <div key={s.id} className="rounded-xl bg-primary-50/50 ring-1 ring-primary-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{s.subject}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                          {s.teacher_name && <span> · {s.teacher_name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="text-xs text-primary-700 hover:bg-primary-100 px-2 py-1 rounded">Edit</button>
                        <button onClick={() => handleDelete(s)} className="text-xs text-rose-600 hover:bg-rose-100 px-2 py-1 rounded">Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit Jadwal" : "Tambah Jadwal"}>
        <form onSubmit={handleSave} className="grid gap-3">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Kelas *</span>
            <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value ? Number(e.target.value) : "" })} className="input-base">
              <option value="">— pilih kelas —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Hari</span>
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="input-base">
              {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1">Mulai</span>
              <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-base" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1">Selesai</span>
              <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-base" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran / Aktivitas *</span>
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-base" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">Guru</span>
            <select value={form.teacherId ?? ""} onChange={(e) => setForm({ ...form, teacherId: e.target.value ? Number(e.target.value) : null })} className="input-base">
              <option value="">— belum ditentukan —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Menyimpan…" : form.id ? "Simpan" : "Tambah"}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
