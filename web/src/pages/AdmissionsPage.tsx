import { useEffect, useMemo, useState } from "react"
import AppLayout from "../components/AppLayout"
import Pagination from "../components/Pagination"
import { usePagination } from "../hooks/usePagination"
import { Admissions, waLink, type AdmissionStatus, type Applicant, type PaginationMeta } from "../lib/api"

const statuses: AdmissionStatus[] = ["new", "submitted", "verifying", "interview", "accepted", "rejected", "waitlisted", "enrolled"]
const label: Record<AdmissionStatus, string> = { new: "Baru", submitted: "Terkirim", verifying: "Verifikasi", interview: "Wawancara", accepted: "Diterima", rejected: "Ditolak", waitlisted: "Cadangan", enrolled: "Terdaftar" }

export default function AdmissionsPage() {
  const [items, setItems] = useState<Applicant[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [status, setStatus] = useState("")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { page, pageSize, setPage, setPageSize } = usePagination({
    resetDeps: [status],
  })

  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const r = await Admissions.list({
        status: status || undefined,
        q: debouncedQ || undefined,
        page,
        pageSize,
      })
      setItems(r.items)
      setPagination(r.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat PPDB")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [page, pageSize, debouncedQ, status])

  const counts = useMemo(() => Object.fromEntries(statuses.map((s) => [s, items.filter((i) => i.status === s).length])), [items]) as Record<AdmissionStatus, number>
  async function setApplicantStatus(a: Applicant, s: AdmissionStatus) { await Admissions.update(a.id, { name: a.name, status: s }); refresh() }
  async function enroll(a: Applicant) { await Admissions.enroll(a.id); refresh() }
  return <AppLayout><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PPDB / Admissions</h1><p className="text-sm text-slate-600 dark:text-slate-400">Kelola pipeline calon siswa dan konversi ke data siswa.</p></div><a className="btn-secondary" href="/ppdb" target="_blank">Buka Form Publik</a></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><input className="input-base sm:col-span-2" placeholder="Cari calon siswa / wali / WA" value={q} onChange={(e)=>setQ(e.target.value)} /><select className="input-base" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">Semua status</option>{statuses.map((s)=><option key={s} value={s}>{label[s]}</option>)}</select><button className="btn-primary" onClick={refresh}>Cari</button></div><div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">{statuses.map((s)=><button key={s} onClick={()=>setStatus(s)} className={`rounded-2xl p-3 text-left ring-1 ${status===s ? 'bg-blue-600 text-white ring-blue-600' : 'bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-800'}`}><div className="text-xs">{label[s]}</div><div className="text-xl font-bold">{counts[s] ?? 0}</div></button>)}</div>{error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800"><tr><th className="p-3">Calon Siswa</th><th className="p-3">Wali</th><th className="p-3">Tujuan</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead><tbody>{loading ? <tr><td className="p-4" colSpan={5}>Memuat...</td></tr> : items.map((a)=><tr key={a.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-3"><div className="font-medium text-slate-900 dark:text-slate-100">{a.name}</div><div className="text-xs text-slate-500">{a.birth_place && a.birth_date ? `${a.birth_place}, ${a.birth_date}` : '—'}</div></td><td className="p-3"><div className="text-slate-900 dark:text-slate-100">{a.parent_name || '—'}</div>{a.parent_wa && <a href={waLink(a.parent_wa, `Halo, terkait pendaftaran ${a.name}`)||'#'} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{a.parent_wa}</a>}</td><td className="p-3"><div>{a.desired_class || '—'}</div><div className="text-xs text-slate-500">{a.academic_year || '—'}</div></td><td className="p-3"><span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${a.status==='accepted'?'bg-green-100 text-green-800':a.status==='rejected'?'bg-red-100 text-red-800':a.status==='enrolled'?'bg-blue-100 text-blue-800':'bg-slate-100 text-slate-700'}`}>{label[a.status]}</span></td><td className="p-3"><div className="flex gap-2"><a href={`/ppdb/${a.id}`} className="text-xs text-blue-600 hover:underline">Detail</a>{a.status==='accepted' && !a.student_id && <button onClick={()=>enroll(a)} className="text-xs text-green-600 hover:underline">Daftarkan</button>}<select className="text-xs border rounded px-1 py-0.5" value={a.status} onChange={(e)=>setApplicantStatus(a, e.target.value as AdmissionStatus)}><option value="">Ubah status</option>{statuses.map((s)=><option key={s} value={s}>{label[s]}</option>)}</select></div></td></tr>)}</tbody></table></div>{pagination && <div className="p-3 border-t border-slate-100 dark:border-slate-800"><Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onPageChange={setPage} onPageSizeChange={setPageSize} /></div>}</div></AppLayout>
}
