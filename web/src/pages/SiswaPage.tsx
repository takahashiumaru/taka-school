import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Select from "../components/Select"
import ConfirmDialog from "../components/ConfirmDialog"
import { AlertBox, EmptyState, TableSkeleton } from "../components/UiState"
import {
  Classes,
  Students,
  getUser,
  waLink,
  type Klass,
  type Student,
} from "../lib/api"

export default function SiswaPage() {
  const user = getUser()
  const [items, setItems] = useState<Student[]>([])
  const [classes, setClasses] = useState<Klass[]>([])
  const [q, setQ] = useState("")
  const [filterClass, setFilterClass] = useState<number | "">("")
  const [filterStatus, setFilterStatus] = useState<string>("aktif")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const [s, c] = await Promise.all([
        Students.list({
          q: q || undefined,
          classId: filterClass || undefined,
          status: filterStatus || undefined,
        }),
        Classes.list(),
      ])
      setItems(s.items)
      setClasses(c.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [filterClass, filterStatus])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await Students.delete(deleteTarget.id)
      setDeleteTarget(null)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus")
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    if (!q) return items
    const needle = q.toLowerCase()
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        (s.nis ?? "").toLowerCase().includes(needle) ||
        (s.parent_name ?? "").toLowerCase().includes(needle),
    )
  }, [items, q])

  if (!user) return null

  return (
    <AppLayout>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Data Siswa</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{filtered.length} siswa ditampilkan</p>
        </div>
        <Link to="/siswa/baru" className="btn-primary">+ Tambah Siswa</Link>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama / NIS / wali murid…"
          className="input-base"
        />
        <Select
          value={filterClass === "" ? "" : String(filterClass)}
          onChange={(v) => setFilterClass(v ? Number(v) : "")}
          options={[{ value: "", label: "Semua Kelas" }, ...classes.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "", label: "Semua Status" },
            { value: "aktif", label: "Aktif" },
            { value: "lulus", label: "Lulus" },
            { value: "keluar", label: "Keluar" },
          ]}
        />
      </div>

      {error && <div className="mt-4"><AlertBox>{error}</AlertBox></div>}

      <div className="mt-5 grid gap-3 md:hidden">
        {loading && <TableSkeleton rows={4} cols={2} />}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <EmptyState title="Belum ada data siswa" desc="Tambahkan siswa pertama atau ubah filter pencarian." action={<Link to="/siswa/baru" className="btn-primary-sm">+ Tambah Siswa</Link>} />
          </div>
        )}
        {filtered.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.nickname ? `${s.nickname} · ` : ""}{s.nis || "NIS —"}{s.nisn ? ` · NISN ${s.nisn}` : ""}</div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Info label="Kelas" value={s.class_name || "—"} />
              <Info label="L/P" value={s.gender || "—"} />
              <Info label="Wali" value={s.parent_name || "—"} />
              <Info label="WA" value={s.parent_wa || "—"} />
              <Info label="Darah" value={s.blood_type || "—"} />
              <Info label="Darurat" value={s.emergency_contact_phone || "—"} />
            </div>
            {(s.allergies || s.medical_notes) && (
              <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                {s.allergies && <div><b>Alergi:</b> {s.allergies}</div>}
                {s.medical_notes && <div><b>Medis:</b> {s.medical_notes}</div>}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {s.parent_wa && (
                <a href={waLink(s.parent_wa, `Halo ${s.parent_name || "Bapak/Ibu"}, mohon waktunya untuk informasi terkait ananda ${s.name} di sekolah.`) || "#"} target="_blank" rel="noreferrer" className="btn-secondary-sm text-emerald-700 dark:text-emerald-300">WA</a>
              )}
              <Link to={`/siswa/${s.id}`} className="btn-secondary-sm">Detail</Link>
              <Link to={`/siswa/${s.id}/edit`} className="btn-secondary-sm">Edit</Link>
              <button onClick={() => setDeleteTarget(s)} className="btn-danger-sm">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 hidden rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden dark:bg-slate-900 dark:ring-slate-800 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">NIS</th>
                <th className="px-4 py-3 font-semibold">Kelas</th>
                <th className="px-4 py-3 font-semibold">L/P</th>
                <th className="px-4 py-3 font-semibold">Wali</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={5} cols={7} />}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="Belum ada data siswa" desc="Tambahkan siswa pertama atau ubah filter pencarian." action={<Link to="/siswa/baru" className="btn-primary-sm">+ Tambah Siswa</Link>} />
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.nis || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.class_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.gender || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {s.parent_name ? (
                      <span>
                        {s.parent_name}
                        {s.parent_wa && <span className="text-slate-400 dark:text-slate-500"> · {s.parent_wa}</span>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {s.parent_wa && (
                      <a
                        href={waLink(s.parent_wa, `Halo ${s.parent_name || "Bapak/Ibu"}, mohon waktunya untuk informasi terkait ananda ${s.name} di sekolah.`) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 mr-1"
                        title="Chat WA wali murid"
                      >
                        WA
                      </a>
                    )}
                    <Link to={`/siswa/${s.id}`} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10 mr-1">Detail</Link>
                    <Link to={`/siswa/${s.id}/edit`} className="text-xs font-semibold px-2 py-1 rounded-lg text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10 mr-1">Edit</Link>
                    <button onClick={() => setDeleteTarget(s)} className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus siswa?"
        message={`Data siswa ${deleteTarget?.name || "ini"} akan dihapus permanen beserta data terkait yang terhubung. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus Siswa"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "aktif" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : status === "lulus" ? "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{status}</span>
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div><div className="font-medium text-slate-700 dark:text-slate-300">{value}</div></div>
}
