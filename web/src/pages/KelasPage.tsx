import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Pagination from "../components/Pagination"
import ConfirmDialog from "../components/ConfirmDialog"
import { AlertBox, CardSkeleton, EmptyState } from "../components/UiState"
import { usePagination } from "../hooks/usePagination"
import {
  Classes,
  getUser,
  type Klass,
  type PaginationMeta,
} from "../lib/api"

export default function KelasPage() {
  const user = getUser()
  const [items, setItems] = useState<Klass[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Klass | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { page, pageSize, setPage, setPageSize } = usePagination()

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const c = await Classes.list({ page, pageSize })
      setItems(c.items)
      setPagination(c.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [page, pageSize])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await Classes.delete(deleteTarget.id)
      setDeleteTarget(null)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus")
    } finally {
      setDeleting(false)
    }
  }

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kelas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {pagination ? `${pagination.total} kelas terdaftar dari PAUD sampai SMA` : "Memuat..."}
          </p>
        </div>
        <Link to="/kelas/baru" className="btn-primary">+ Tambah Kelas</Link>
      </div>

      {error && <div className="mt-4"><AlertBox>{error}</AlertBox></div>}

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <CardSkeleton count={3} />}
        {!loading && items.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <EmptyState title="Belum ada kelas" desc="Buat kelas pertama dan pilih jenjangnya agar data PAUD/TK/SD/SMP/SMA rapi." action={<Link to="/kelas/baru" className="btn-primary-sm">+ Tambah Kelas</Link>} />
          </div>
        )}
        {items.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge>{c.education_level_name || "Jenjang belum diset"}</Badge>
                  <Badge>{c.grade_level_name || c.grade_level || "Tingkat belum diset"}</Badge>
                  {c.major_name && <Badge>{c.major_name}</Badge>}
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">{c.student_count} siswa</span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>Tahun Ajaran: <span className="font-medium text-slate-800 dark:text-slate-200">{c.academic_year_name || "—"}</span></div>
              <div>Wali Kelas: <span className="font-medium text-slate-800 dark:text-slate-200">{c.teacher_name || "—"}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to={`/kelas/${c.id}`} className="btn-secondary-sm">Detail</Link>
              <Link to={`/kelas/${c.id}/edit`} className="btn-secondary-sm">Edit</Link>
              <button onClick={() => setDeleteTarget(c)} className="btn-danger-sm">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="mt-5">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            loading={loading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus kelas?"
        message={`Kelas ${deleteTarget?.name || "ini"} akan dihapus. Siswa di kelas ini akan menjadi tanpa kelas.`}
        confirmLabel="Hapus Kelas"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{children}</span>
}
