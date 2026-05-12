import { useState } from "react"
import type { FormEvent } from "react"
import { Admissions } from "../lib/api"

export default function PpdbPage() {
  const [form, setForm] = useState({ name: "", gender: "", birthPlace: "", birthDate: "", parentName: "", parentWa: "", address: "", desiredClass: "", previousSchool: "", notes: "" })
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      const res = await Admissions.publicCreate({
        name: form.name, gender: form.gender === "L" || form.gender === "P" ? form.gender : null,
        birthPlace: form.birthPlace || null, birthDate: form.birthDate || null, parentName: form.parentName || null,
        parentWa: form.parentWa || null, address: form.address || null, desiredClass: form.desiredClass || null,
        previousSchool: form.previousSchool || null, notes: form.notes || null,
      })
      setDone(res.id)
    } catch (e) { setError(e instanceof Error ? e.message : "Pendaftaran gagal") } finally { setSaving(false) }
  }
  if (done) return <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center"><div className="max-w-lg rounded-3xl bg-white p-8 shadow"><h1 className="text-2xl font-bold">Pendaftaran terkirim</h1><p className="mt-3 text-slate-600">Nomor pendaftaran: <b>#{done}</b>. Tim sekolah akan menghubungi wali melalui WhatsApp.</p><a className="btn-primary mt-6 inline-flex" href="/">Kembali</a></div></main>
  return <main className="min-h-screen bg-slate-50 p-4"><form onSubmit={submit} className="mx-auto max-w-2xl rounded-3xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-slate-200"><h1 className="text-2xl font-bold">Form PPDB Taka School</h1><p className="mt-1 text-sm text-slate-600">Isi data calon siswa. Kolom bertanda * wajib diisi.</p>{error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-medium">Nama calon siswa *<input required className="input-base mt-1" value={form.name} onChange={(e)=>set("name", e.target.value)} /></label><label className="text-sm font-medium">Jenis kelamin<select className="input-base mt-1" value={form.gender} onChange={(e)=>set("gender", e.target.value)}><option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></label><label className="text-sm font-medium">Tanggal lahir<input type="date" className="input-base mt-1" value={form.birthDate} onChange={(e)=>set("birthDate", e.target.value)} /></label><label className="text-sm font-medium">Tempat lahir<input className="input-base mt-1" value={form.birthPlace} onChange={(e)=>set("birthPlace", e.target.value)} /></label><label className="text-sm font-medium">Kelas tujuan<input className="input-base mt-1" placeholder="PAUD/TK/SD..." value={form.desiredClass} onChange={(e)=>set("desiredClass", e.target.value)} /></label><label className="text-sm font-medium">Nama wali<input className="input-base mt-1" value={form.parentName} onChange={(e)=>set("parentName", e.target.value)} /></label><label className="text-sm font-medium">WhatsApp wali<input className="input-base mt-1" value={form.parentWa} onChange={(e)=>set("parentWa", e.target.value)} /></label><label className="sm:col-span-2 text-sm font-medium">Alamat<textarea className="input-base mt-1" value={form.address} onChange={(e)=>set("address", e.target.value)} /></label><label className="sm:col-span-2 text-sm font-medium">Asal sekolah<input className="input-base mt-1" value={form.previousSchool} onChange={(e)=>set("previousSchool", e.target.value)} /></label><label className="sm:col-span-2 text-sm font-medium">Catatan<textarea className="input-base mt-1" value={form.notes} onChange={(e)=>set("notes", e.target.value)} /></label></div><button disabled={saving} className="btn-primary mt-6 w-full sm:w-auto">{saving ? "Mengirim..." : "Kirim Pendaftaran"}</button></form></main>
}
