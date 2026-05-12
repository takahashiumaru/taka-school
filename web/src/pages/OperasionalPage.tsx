import { useEffect, useMemo, useState } from "react"
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
type Field = { name: string; label: string; req?: boolean; type?: "text" | "number" | "date" | "select"; options?: Array<[string, string]> }

const createFns: Record<Tab, (data: any) => Promise<any>> = {
  library: Operations.createLibrary,
  inventory: Operations.createInventory,
  extracurriculars: Operations.createExtracurricular,
  counseling: Operations.createCounseling,
  letters: Operations.createLetter,
}
const updateFns: Record<Tab, (id: number, data: any) => Promise<any>> = {
  library: Operations.updateLibrary,
  inventory: Operations.updateInventory,
  extracurriculars: Operations.updateExtracurricular,
  counseling: Operations.updateCounseling,
  letters: Operations.updateLetter,
}
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
  const [form, setForm] = useState<any>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => { setForm({}); setEditingId(null); load() }, [tab])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = normalizePayload(tab, form)
      if (editingId) await updateFns[tab](editingId, payload)
      else await createFns[tab](payload)
      setForm({})
      setEditingId(null)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan") }
    finally { setSaving(false) }
  }

  function startEdit(item: any) {
    setEditingId(Number(item.id))
    setForm(toForm(tab, item))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function remove(item: any) {
    if (!confirm(`Hapus ${item.title || item.name || item.subject || "data"}?`)) return
    try { await deleteFns[tab](Number(item.id)); await load() } catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus") }
  }

  return <AppLayout>
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Operasional Sekolah</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Fondasi perpustakaan, inventaris, ekskul, BK, dan surat menyurat.</p>
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
    <form onSubmit={submit} className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 grid md:grid-cols-3 gap-3">
      <div className="md:col-span-3 flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">{editingId ? "Edit" : "Tambah"} {tabs.find(([k])=>k===tab)?.[1]}</h2>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({}) }} className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200">Batal edit</button>}
      </div>
      {fields(tab).map((f) => <FieldInput key={f.name} field={f} value={form[f.name] ?? ""} onChange={(value) => setForm({ ...form, [f.name]: value })} />)}
      <button disabled={saving} className="btn-primary md:col-span-3 disabled:opacity-60">{saving ? "Menyimpan..." : editingId ? `Simpan Perubahan` : `Tambah ${tabs.find(([k])=>k===tab)?.[1]}`}</button>
    </form>
    <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      {paginatedItems.map((it) => <DataCard key={it.id} tab={tab} item={it} onEdit={() => startEdit(it)} onDelete={() => remove(it)} />)}
    </div>
    {items.length > 0 && (
      <div className="mt-5">
        <Pagination page={page} pageSize={pageSize} total={items.length} loading={false} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>
    )}
  </AppLayout>
}

function Metric({label,value}:{label:string;value:any}){return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div></div>}

function FieldInput({ field, value, onChange }: { field: Field; value: any; onChange: (value: any) => void }) {
  if (field.type === "select") return <select required={field.req} value={value} onChange={e=>onChange(e.target.value)} className="input-base"><option value="">{field.label}</option>{field.options?.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
  return <input type={field.type || "text"} required={field.req} value={value} onChange={e=>onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} placeholder={field.label} className="input-base" />
}

function DataCard({ tab, item, onEdit, onDelete }: { tab: Tab; item: any; onEdit: () => void; onDelete: () => void }) {
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
      <button onClick={onEdit} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200">Edit</button>
      <button onClick={onDelete} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-200">Delete</button>
    </div>
  </div>
}

function fields(tab:Tab): Field[]{return ({
  library:[{name:"title",label:"Judul buku",req:true},{name:"author",label:"Penulis"},{name:"category",label:"Kategori"},{name:"stock",label:"Stok total",type:"number"},{name:"availableStock",label:"Stok tersedia",type:"number"}],
  inventory:[{name:"name",label:"Nama barang",req:true},{name:"category",label:"Kategori"},{name:"location",label:"Lokasi"},{name:"quantity",label:"Jumlah",type:"number"},{name:"conditionStatus",label:"Kondisi",type:"select",options:[["good","Baik"],["damaged","Rusak"],["lost","Hilang"],["maintenance","Perawatan"]]}],
  extracurriculars:[{name:"name",label:"Nama ekskul",req:true},{name:"coachUserId",label:"ID pembina/guru",type:"number"},{name:"scheduleNote",label:"Jadwal"}],
  counseling:[{name:"title",label:"Judul catatan",req:true},{name:"studentId",label:"ID siswa",type:"number"},{name:"category",label:"Kategori"},{name:"notes",label:"Catatan"},{name:"followUp",label:"Tindak lanjut"},{name:"recordDate",label:"Tanggal",type:"date"}],
  letters:[{name:"letterNo",label:"Nomor surat"},{name:"type",label:"Jenis surat",req:true},{name:"subject",label:"Perihal",req:true},{name:"recipient",label:"Penerima"},{name:"status",label:"Status",type:"select",options:[["draft","Draft"],["issued","Terbit"],["archived","Arsip"]]}],
} as Record<Tab, Field[]>)[tab]}

function toForm(tab: Tab, item: any) {
  if (tab === "library") return { title: item.title || "", author: item.author || "", category: item.category || "", stock: item.stock ?? 1, availableStock: item.available_stock ?? item.stock ?? 1 }
  if (tab === "inventory") return { name: item.name || "", category: item.category || "", location: item.location || "", quantity: item.quantity ?? 1, conditionStatus: item.condition_status || "good" }
  if (tab === "extracurriculars") return { name: item.name || "", coachUserId: item.coach_user_id ?? "", scheduleNote: item.schedule_note || "" }
  if (tab === "counseling") return { title: item.title || "", studentId: item.student_id ?? "", category: item.category || "", notes: item.notes || "", followUp: item.follow_up || "", recordDate: item.record_date ? String(item.record_date).slice(0,10) : "" }
  return { letterNo: item.letter_no || "", type: item.type || "", subject: item.subject || "", recipient: item.recipient || "", status: item.status || "draft" }
}

function normalizePayload(tab: Tab, form: any) {
  const payload = { ...form }
  for (const key of ["stock", "availableStock", "quantity", "coachUserId", "studentId"]) {
    if (payload[key] === "" || payload[key] === undefined) delete payload[key]
    else payload[key] = Number(payload[key])
  }
  if (tab === "inventory" && !payload.conditionStatus) payload.conditionStatus = "good"
  if (tab === "letters" && !payload.status) payload.status = "draft"
  return payload
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
