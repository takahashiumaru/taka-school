import { useEffect, useState } from "react"
import AppLayout from "../components/AppLayout"
import {
  Attendance,
  Classes,
  type AttendanceEntry,
  type Klass,
} from "../lib/api"

const STATUSES: { value: "hadir" | "izin" | "sakit" | "alpa"; label: string; color: string }[] = [
  { value: "hadir", label: "Hadir", color: "bg-emerald-500 text-white" },
  { value: "izin", label: "Izin", color: "bg-sky-500 text-white" },
  { value: "sakit", label: "Sakit", color: "bg-amber-500 text-white" },
  { value: "alpa", label: "Alpa", color: "bg-rose-500 text-white" },
]

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function AbsensiPage() {
  const [classes, setClasses] = useState<Klass[]>([])
  const [classId, setClassId] = useState<number | "">("")
  const [date, setDate] = useState(todayIso())
  const [students, setStudents] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    Classes.list().then((r) => {
      setClasses(r.items)
      if (!classId && r.items.length > 0) setClassId(r.items[0].id)
    }).catch((e) => setError(e instanceof Error ? e.message : "Gagal"))
  }, [])

  useEffect(() => {
    if (!classId || !date) return
    setLoading(true)
    setError(null)
    Attendance.get(Number(classId), date)
      .then((r) => setStudents(r.students))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat"))
      .finally(() => setLoading(false))
  }, [classId, date])

  function setStatus(id: number, status: "hadir" | "izin" | "sakit" | "alpa") {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
  }

  function setNote(id: number, note: string) {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, note } : s)))
  }

  function setAll(status: "hadir" | "izin" | "sakit" | "alpa") {
    setStudents((prev) => prev.map((s) => ({ ...s, status })))
  }

  async function handleSave() {
    if (!classId) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await Attendance.bulk({
        classId: Number(classId),
        date,
        entries: students.map((s) => ({ studentId: s.id, status: s.status, note: s.note })),
      })
      setMessage("Absensi tersimpan.")
      setTimeout(() => setMessage(null), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const counts = students.reduce(
    (acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc },
    {} as Record<string, number>,
  )

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-slate-900">Absensi Harian</h1>
      <p className="text-sm text-slate-600 mt-1">Pilih kelas & tanggal, lalu tandai status tiap siswa.</p>

      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Kelas</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : "")} className="input-base">
            <option value="">— pilih kelas —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base" />
        </label>
        <div className="flex items-end gap-2">
          <button onClick={() => setAll("hadir")} className="btn-secondary-sm">Tandai semua hadir</button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3">{error}</div>}
      {message && <div className="mt-4 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-sm p-3">{message}</div>}

      <div className="mt-4 grid grid-cols-4 gap-2 max-w-lg">
        <Counter label="Hadir" value={counts.hadir || 0} color="bg-emerald-50 text-emerald-700" />
        <Counter label="Izin" value={counts.izin || 0} color="bg-sky-50 text-sky-700" />
        <Counter label="Sakit" value={counts.sakit || 0} color="bg-amber-50 text-amber-700" />
        <Counter label="Alpa" value={counts.alpa || 0} color="bg-rose-50 text-rose-700" />
      </div>

      <div className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">NIS</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Memuat…</td></tr>}
              {!loading && classId && students.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Belum ada siswa di kelas ini.</td></tr>
              )}
              {!classId && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Pilih kelas dulu.</td></tr>
              )}
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.nis || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((st) => (
                        <button
                          key={st.value}
                          onClick={() => setStatus(s.id, st.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                            s.status === st.value ? st.color : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={s.note ?? ""}
                      onChange={(e) => setNote(s.id, e.target.value)}
                      placeholder="(opsional)"
                      className="input-base"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {students.length > 0 && (
        <div className="mt-5 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Menyimpan…" : "Simpan Absensi"}
          </button>
        </div>
      )}
    </AppLayout>
  )
}

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl ${color} p-3 text-center`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  )
}
