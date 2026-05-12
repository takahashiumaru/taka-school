import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Pagination from "../components/Pagination"
import { usePagination } from "../hooks/usePagination"
import {
  Announcements,
  getUser,
  type Announcement,
  type PaginationMeta,
} from "../lib/api"


function fmt(d: string): string {
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
}

export default function PengumumanPage() {
  const user = getUser()
  const [items, setItems] = useState<Announcement[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { page, pageSize, setPage, setPageSize } = usePagination()

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const a = await Announcements.list({ page, pageSize })
      setItems(a.items)
      setPagination(a.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [page, pageSize])

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pengumuman</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {pagination ? `${pagination.total} pengumuman` : "Info untuk guru atau kelas tertentu"}
          </p>
        </div>
        <Link to="/pengumuman/baru" className="btn-primary">+ Buat Pengumuman</Link>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}

      <div className="mt-5 grid gap-4">
        {loading && <div className="text-slate-500 dark:text-slate-400">Memuat…</div>}
        {!loading && items.length === 0 && <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-slate-500 dark:bg-slate-900 dark:ring-slate-800 dark:text-slate-400">Belum ada pengumuman.</div>}
        {items.map((a) => (
          <article key={a.id} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 dark:text-slate-100">{a.title}</h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {fmt(a.created_at)}
                  {a.author_name && <span> · oleh {a.author_name}</span>}
                  {a.class_name && <span> · ke kelas {a.class_name}</span>}
                  {!a.class_name && <span> · semua kelas</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Link to={`/pengumuman/${a.id}/edit`} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10">Edit</Link>
                <button onClick={() => handleDelete(a)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{a.body}</p>
          </article>
        ))}
      </div>

      {pagination && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

    </AppLayout>
  )
}
