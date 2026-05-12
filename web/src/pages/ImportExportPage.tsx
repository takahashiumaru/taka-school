import { useState } from "react"
import AppLayout from "../components/AppLayout"
import { AlertBox } from "../components/UiState"
import { downloadApiFile, uploadCsv } from "../lib/api"

const datasets = [
  { key: "students", title: "Siswa", desc: "Data induk siswa, wali, kelas, dan status." },
  { key: "teachers", title: "Guru", desc: "Akun guru. Import guru baru memakai password default dari file." },
  { key: "grades", title: "Nilai", desc: "Entri nilai asesmen per siswa." },
  { key: "invoices", title: "Tagihan", desc: "Tagihan keuangan/SPP sederhana." },
]

export default function ImportExportPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function onImport(kind: string, file?: File) {
    if (!file) return
    setBusy(kind); setError(null); setMessage(null)
    try {
      const csv = await file.text()
      const r = await uploadCsv(`/api/import-export/${kind}/import`, csv)
      setMessage(`${kind}: ${r.created} dibuat${r.updated !== undefined ? `, ${r.updated} diperbarui` : ""}, ${r.skipped} dilewati.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import gagal")
    } finally { setBusy(null) }
  }

  async function dl(path: string, name: string) {
    setError(null)
    try { await downloadApiFile(path, name) } catch (e) { setError(e instanceof Error ? e.message : "Download gagal") }
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Import / Export Excel</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Gunakan CSV yang kompatibel dengan Excel/Google Sheets. Simpan sebagai .csv sebelum import.</p>
        </div>
      </div>
      {error && <div className="mt-4"><AlertBox>{error}</AlertBox></div>}
      {message && <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">{message}</div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {datasets.map((d) => (
          <div key={d.key} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">{d.title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary-sm" onClick={() => dl(`/api/import-export/templates/${d.key}`, `${d.key}-template.csv`)}>Template</button>
              <button className="btn-secondary-sm" onClick={() => dl(`/api/import-export/${d.key}/export`, `${d.key}.csv`)}>Export CSV</button>
              <label className="btn-primary-sm cursor-pointer">
                {busy === d.key ? "Mengimpor…" : "Import CSV"}
                <input type="file" accept=".csv,text/csv" className="hidden" disabled={busy === d.key} onChange={(e) => onImport(d.key, e.target.files?.[0])} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
