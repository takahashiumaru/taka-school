import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Admissions } from "../lib/api"

type AddressSuggestion = {
  id: number | string
  label: string
  lat: number | null
  lon: number | null
  source: string
}

export default function PpdbPage() {
  const [form, setForm] = useState({
    name: "",
    gender: "",
    birthPlace: "",
    birthDate: "",
    parentName: "",
    parentWa: "",
    address: "",
    desiredClass: "",
    previousSchool: "",
    notes: "",
  })
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [addressQuery, setAddressQuery] = useState("")
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number | null; lon: number | null } | null>(null)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    const q = addressQuery.trim()
    setAddressError(null)
    if (q.length < 3) {
      setSuggestions([])
      setAddressLoading(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setAddressLoading(true)
      try {
        const res = await fetch(`/api/maps/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        if (!res.ok) throw new Error("Pencarian alamat sedang bermasalah")
        const data = (await res.json()) as { items?: AddressSuggestion[] }
        setSuggestions(data.items ?? [])
      } catch (e) {
        if ((e as Error).name !== "AbortError") setAddressError(e instanceof Error ? e.message : "Gagal mencari alamat")
      } finally {
        setAddressLoading(false)
      }
    }, 450)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [addressQuery])

  function chooseAddress(item: AddressSuggestion) {
    set("address", item.label)
    setAddressQuery(item.label)
    setSelectedLocation({ lat: item.lat, lon: item.lon })
    setSuggestions([])
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const locationNote = selectedLocation?.lat && selectedLocation?.lon
        ? `\nKoordinat alamat: ${selectedLocation.lat}, ${selectedLocation.lon} (OpenStreetMap)`
        : ""
      const res = await Admissions.publicCreate({
        name: form.name,
        gender: form.gender === "L" || form.gender === "P" ? form.gender : null,
        birthPlace: form.birthPlace || null,
        birthDate: form.birthDate || null,
        parentName: form.parentName || null,
        parentWa: form.parentWa || null,
        address: form.address || null,
        desiredClass: form.desiredClass || null,
        previousSchool: form.previousSchool || null,
        notes: `${form.notes || ""}${locationNote}`.trim() || null,
      })
      setDone(res.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pendaftaran gagal")
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="max-w-lg rounded-3xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold">Pendaftaran terkirim</h1>
          <p className="mt-3 text-slate-600">Nomor pendaftaran: <b>#{done}</b>. Tim sekolah akan menghubungi wali melalui WhatsApp.</p>
          <a className="btn-primary mt-6 inline-flex" href="/">Kembali</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <form onSubmit={submit} className="mx-auto max-w-2xl rounded-3xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold">Form PPDB Taka School</h1>
        <p className="mt-1 text-sm text-slate-600">Isi data calon siswa. Kolom bertanda * wajib diisi.</p>
        {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium">Nama calon siswa *
            <input required className="input-base mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="text-sm font-medium">Jenis kelamin
            <select className="input-base mt-1" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option>
            </select>
          </label>
          <label className="text-sm font-medium">Tanggal lahir
            <input type="date" className="input-base mt-1" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
          </label>
          <label className="text-sm font-medium">Tempat lahir
            <input className="input-base mt-1" value={form.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} />
          </label>
          <label className="text-sm font-medium">Kelas tujuan
            <input className="input-base mt-1" placeholder="X IPA / XI IPS / XII Bahasa" value={form.desiredClass} onChange={(e) => set("desiredClass", e.target.value)} />
          </label>
          <label className="text-sm font-medium">Nama wali
            <input className="input-base mt-1" value={form.parentName} onChange={(e) => set("parentName", e.target.value)} />
          </label>
          <label className="text-sm font-medium">WhatsApp wali
            <input className="input-base mt-1" value={form.parentWa} onChange={(e) => set("parentWa", e.target.value)} />
          </label>

          <div className="sm:col-span-2 text-sm font-medium">
            <label htmlFor="address-search">Cari alamat lewat OpenStreetMap</label>
            <div className="relative mt-1">
              <input
                id="address-search"
                className="input-base pr-10"
                placeholder="Ketik nama jalan, desa, kecamatan, kota..."
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value)
                  set("address", e.target.value)
                  setSelectedLocation(null)
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">Sumber: OpenStreetMap/Nominatim. Pilih hasil untuk mengisi alamat otomatis.</div>
            {addressLoading && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Mencari alamat...</div>}
            {addressError && <div className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">{addressError}</div>}
            {suggestions.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                {suggestions.map((item) => (
                  <button key={item.id} type="button" onClick={() => chooseAddress(item)} className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-primary-50 last:border-b-0">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    {item.lat && item.lon && <span className="mt-1 block text-xs text-slate-500">{item.lat.toFixed(5)}, {item.lon.toFixed(5)}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="sm:col-span-2 text-sm font-medium">Alamat lengkap
            <textarea className="input-base mt-1 min-h-24" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">Asal sekolah
            <input className="input-base mt-1" value={form.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">Catatan
            <textarea className="input-base mt-1 min-h-24" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>
        </div>
        <button disabled={saving} className="btn-primary mt-6">{saving ? "Mengirim..." : "Kirim Pendaftaran"}</button>
      </form>
    </main>
  )
}
