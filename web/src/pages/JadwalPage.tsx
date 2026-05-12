import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Select from "../components/Select"
import Pagination from "../components/Pagination"
import { usePagination } from "../hooks/usePagination"
import {
  Classes,
  Schedules,
  getUser,
  type Klass,
  type Schedule,
  type PaginationMeta,
} from "../lib/api"

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]


export default function JadwalPage() {
  const user = getUser()
  const [classes, setClasses] = useState<Klass[]>([])
  const [classId, setClassId] = useState<number | "">("") 
  const [items, setItems] = useState<Schedule[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { page, pageSize, setPage, setPageSize } = usePagination()

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [c, s] = await Promise.all([
        Classes.list(),
        Schedules.list({ classId: classId || undefined, page, pageSize }),
      ])
      setClasses(c.items)
      setItems(s.items)
      setPagination(s.pagination)
      if (!classId && c.items.length > 0) setClassId(c.items[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [classId, page, pageSize])

  const grouped = useMemo(() => {
    const map = new Map<number, Schedule[]>()
    for (const s of items) {
      if (!map.has(s.day_of_week)) map.set(s.day_of_week, [])
      map.get(s.day_of_week)!.push(s)
    }
    for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return map
  }, [items])

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Jadwal Kelas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Jadwal mingguan per kelas</p>
        </div>
        {classId && <Link to={`/jadwal/baru?classId=${classId}`} className="btn-primary">+ Tambah Jadwal</Link>}
      </div>

      <div className="mt-5 max-w-sm">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelas</span>
        <Select
          value={classId === "" ? "" : String(classId)}
          onChange={(v) => setClassId(v ? Number(v) : "")}
          placeholder="— pilih kelas —"
          options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
        />
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}

      {pagination && (
        <div className="mt-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={pagination.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day, idx) => {
          const dayNum = idx + 1
          const list = grouped.get(dayNum) || []
          return (
            <div key={day} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 dark:bg-slate-900 dark:ring-slate-800">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{day}</div>
              {loading && <div className="text-xs text-slate-500 dark:text-slate-400">Memuat…</div>}
              {!loading && list.length === 0 && <div className="text-xs text-slate-400 dark:text-slate-500">Tidak ada jadwal.</div>}
              <div className="space-y-2">
                {list.map((s) => (
                  <div key={s.id} className="rounded-xl bg-primary-50/50 ring-1 ring-primary-100 p-3 dark:bg-primary-500/10 dark:ring-primary-500/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.subject}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                          {s.teacher_name && <span> · {s.teacher_name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Link to={`/jadwal/${s.id}/edit`} className="text-xs text-primary-700 hover:bg-primary-100 px-2 py-1 rounded dark:text-primary-300 dark:hover:bg-primary-500/20">Edit</Link>
                        <button onClick={() => handleDelete(s)} className="text-xs text-rose-600 hover:bg-rose-100 px-2 py-1 rounded dark:text-rose-400 dark:hover:bg-rose-500/15">Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>


    </AppLayout>
  )
}
