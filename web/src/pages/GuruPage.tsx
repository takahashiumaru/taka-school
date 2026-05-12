import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import ConfirmDialog from "../components/ConfirmDialog"
import { Teachers, getUser, type Teacher } from "../lib/api"

export default function GuruPage() {
  const user = getUser()
  const [items, setItems] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await Teachers.delete(deleteTarget.id)
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Data Guru</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{items.length} guru terdaftar</p>
        </div>
        <Link to="/guru/baru" className="btn-primary">+ Tambah Guru</Link>
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm p-3 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-300">{error}</div>}

      <div className="mt-5 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden dark:bg-slate-900 dark:ring-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Memuat…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Belum ada guru.</td></tr>}
              {items.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{t.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {t.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/guru/${t.id}/edit`} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 mr-1 dark:text-primary-300 dark:hover:bg-primary-500/10">Edit</Link>
                    <button onClick={() => setDeleteTarget(t)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Hapus guru?" message={`Guru ${deleteTarget?.name || "ini"} akan dihapus permanen.`} confirmLabel="Hapus" loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </AppLayout>
  )
}
