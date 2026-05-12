import { useEffect, useState } from "react"
import AppLayout from "../components/AppLayout"
import { AlertBox } from "../components/UiState"
import { Operations } from "../lib/api"

const tabs = [
  ["library", "Perpustakaan"],
  ["inventory", "Inventaris"],
  ["extracurriculars", "Ekstrakurikuler"],
  ["counseling", "BK/Konseling"],
  ["letters", "Surat"],
] as const

type Tab = typeof tabs[number][0]

export default function OperasionalPage() {
  const [tab, setTab] = useState<Tab>("library")
  const [summary, setSummary] = useState<any>({})
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})

  async function load(next = tab) {
    setError(null)
    try {
      const [sum, list] = await Promise.all([Operations.summary(), (Operations as any)[next]()])
      setSummary(sum)
      setItems(list.items || [])
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat operasional") }
  }
  useEffect(() => { load() }, [tab])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const fn = ({ library: Operations.createLibrary, inventory: Operations.createInventory, extracurriculars: Operations.createExtracurricular, counseling: Operations.createCounseling, letters: Operations.createLetter } as any)[tab]
    try { await fn(form); setForm({}); load() } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan") }
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
      {fields(tab).map((f: { name: string; label: string; req?: boolean }) => <input key={f.name} required={f.req} value={form[f.name] || ""} onChange={e=>setForm({...form,[f.name]:e.target.value})} placeholder={f.label} className="input-base" />)}
      <button className="btn-primary md:col-span-3">Tambah {tabs.find(([k])=>k===tab)?.[1]}</button>
    </form>
    <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((it) => <div key={it.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-start justify-between gap-3"><div className="font-bold text-slate-900 dark:text-slate-100">{it.title || it.name || it.subject || it.type}</div>{tab === "letters" && <a href={`/operasional/letters/${it.id}/print`} className="text-xs font-semibold text-primary-700 dark:text-primary-300">Cetak</a>}</div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
          {Object.entries(it).filter(([k])=>!["id","school_id","created_at"].includes(k)).slice(0,6).map(([k,v]) => <div key={k}><span className="text-slate-400">{k}:</span> {String(v ?? "—")}</div>)}
        </div>
      </div>)}
    </div>
  </AppLayout>
}

function Metric({label,value}:{label:string;value:any}){return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div></div>}
function fields(tab:Tab){return ({
  library:[{name:"title",label:"Judul buku",req:true},{name:"author",label:"Penulis"},{name:"category",label:"Kategori"}],
  inventory:[{name:"name",label:"Nama barang",req:true},{name:"category",label:"Kategori"},{name:"location",label:"Lokasi"}],
  extracurriculars:[{name:"name",label:"Nama ekskul",req:true},{name:"scheduleNote",label:"Jadwal"}],
  counseling:[{name:"title",label:"Judul catatan",req:true},{name:"category",label:"Kategori"},{name:"notes",label:"Catatan"}],
  letters:[{name:"type",label:"Jenis surat",req:true},{name:"subject",label:"Perihal",req:true},{name:"recipient",label:"Penerima"}],
} as any)[tab]}
