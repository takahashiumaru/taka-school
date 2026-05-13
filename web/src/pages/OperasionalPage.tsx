import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "../components/AppLayout"
import Pagination from "../components/Pagination"
import { AlertBox } from "../components/UiState"
import { usePagination } from "../hooks/usePagination"
import { Operations } from "../lib/api"

const tabs = [
  ["library", "Perpustakaan"],
  ["inventory", "Inventaris"],
  ["extracurriculars", "Ekstrakurikuler"],
  ["counseling", "BK/Konseling"],
  ["letters", "Surat"],
] as const

type Tab = typeof tabs[number][0]

const deleteFns: Record<Tab, (id: number) => Promise<any>> = {
  library: Operations.deleteLibrary,
  inventory: Operations.deleteInventory,
  extracurriculars: Operations.deleteExtracurricular,
  counseling: Operations.deleteCounseling,
  letters: Operations.deleteLetter,
}

export default function OperasionalPage() {
  const [tab, setTab] = useState<Tab>("library")
  const [summary, setSummary] = useState<any>({})
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const { page, pageSize, setPage, setPageSize } = usePagination({ defaultPageSize: 12, resetDeps: [tab] })

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  async function load(next = tab) {
    setError(null)
    try {
      const [sum, list] = await Promise.all([Operations.summary(), (Operations as any)[next]()])
      setSummary(sum)
      setItems(list.items || [])
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat operasional") }
  }

  useEffect(() => { load() }, [tab])

  async function remove(item: any) {
    if (!confirm(`Hapus ${item.title || item.name || item.subject || "data"}?`)) return
    try { await deleteFns[tab](Number(item.id)); await load() } catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus") }
  }

  return <AppLayout>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Operasional Sekolah</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Fondasi perpustakaan, inventaris, ekskul, BK, dan surat menyurat.</p>
      </div>
      <Link to={`/operasional/${tab}/new`} className="btn-primary shrink-0">+ Tambah</Link>
    </div>
    {error && <div className="mt-4"><AlertBox>{error}</AlertBox></div>}
    <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
      <Metric label="Buku" value={summary.books?.count || 0} />
      <Metric label="Inventaris" value={summary.inventory?.count || 0} />
      <Metric label="Ekskul" value={summary.extracurriculars?.count || 0} />
      <Metric label="Catatan BK" value={summary.counseling?.count || 0} />
      <Metric label="Surat" value={summary.letters?.count || 0} />
    </div>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(([k,l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab===k ? "bg-primary-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800"}`}>{l}</button>)}
    </div>
    <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      {paginatedItems.map((it) => <DataCard key={it.id} tab={tab} item={it} onDelete={() => remove(it)} />)}
    </div>
    {items.length > 0 && (
      <div className="mt-5">
        <Pagination page={page} pageSize={pageSize} total={items.length} loading={false} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>
    )}
  </AppLayout>
}

function Metric({label,value}:{label:string;value:any}){return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div></div>}


function DataCard({ tab, item, onDelete }: { tab: Tab; item: any; onDelete: () => void }) {
  const rows = displayRows(tab, item)
  return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.title || item.name || item.subject || item.type}</div>
        {rows[0] && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{rows[0].label}: {rows[0].value || "—"}</div>}
      </div>
      {tab === "letters" && <a href={`/operasional/letters/${item.id}/print`} className="shrink-0 text-xs font-semibold text-primary-700 dark:text-primary-300">Cetak</a>}
    </div>
    <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 space-y-1">
      {rows.slice(1).map((row) => <div key={row.label}><span className="text-slate-400">{row.label}:</span> {row.value || "—"}</div>)}
    </div>
    <div className="mt-4 flex gap-2">
      <Link to={`/operasional/${tab}/${item.id}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200">Edit</Link>
      <button onClick={onDelete} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-200">Hapus</button>
    </div>
  </div>
}




function displayRows(tab: Tab, item: any): Array<{ label: string; value: any }> {
  if (tab === "library") return [{label:"Penulis",value:item.author},{label:"Kategori",value:item.category},{label:"Stok total",value:item.stock},{label:"Stok tersedia",value:item.available_stock}]
  if (tab === "inventory") return [{label:"Kategori",value:item.category},{label:"Lokasi",value:item.location},{label:"Jumlah",value:item.quantity},{label:"Kondisi",value:conditionLabel(item.condition_status)}]
  if (tab === "extracurriculars") return [{label:"Pembina/Guru ID",value:item.coach_user_id},{label:"Jadwal",value:item.schedule_note}]
  if (tab === "counseling") return [{label:"Kategori",value:item.category},{label:"ID Siswa",value:item.student_id},{label:"Tanggal",value:item.record_date ? String(item.record_date).slice(0,10) : ""},{label:"Catatan",value:item.notes},{label:"Tindak lanjut",value:item.follow_up}]
  return [{label:"Nomor surat",value:item.letter_no},{label:"Jenis",value:item.type},{label:"Penerima",value:item.recipient},{label:"Status",value:letterStatus(item.status)}]
}

function conditionLabel(value: string) { return ({ good: "Baik", damaged: "Rusak", lost: "Hilang", maintenance: "Perawatan" } as any)[value] || value }
function letterStatus(value: string) { return ({ draft: "Draft", issued: "Terbit", archived: "Arsip" } as any)[value] || value }
