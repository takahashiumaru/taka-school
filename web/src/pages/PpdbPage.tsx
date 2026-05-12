import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import Select from "../components/Select"
import DatePicker from "../components/DatePicker"
import { Admissions } from "../lib/api"

type AddressSuggestion = { id: number | string; label: string; lat: number | null; lon: number | null; source: string }
type Point = { lat: number; lon: number }
const fallbackPoint: Point = { lat: -6.9175, lon: 107.6191 }

export default function PpdbPage() {
  const [form, setForm] = useState({ name: "", gender: "", birthPlace: "", birthDate: "", parentName: "", parentWa: "", address: "", desiredClass: "", previousSchool: "", notes: "" })
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [addressQuery, setAddressQuery] = useState("")
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Point | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletRef = useRef<{ map: L.Map; marker: L.Marker } | null>(null)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function reversePoint(point: Point) {
    setSelectedLocation(point)
    try {
      const res = await fetch(`/api/maps/reverse?lat=${point.lat}&lon=${point.lon}`)
      if (!res.ok) throw new Error("Reverse gagal")
      const data = (await res.json()) as { label?: string }
      if (data.label) { set("address", data.label); setAddressQuery(data.label) }
    } catch { setAddressError("Titik tersimpan, tapi alamat otomatis belum bisa dibaca") }
  }

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return
    const point = selectedLocation ?? fallbackPoint
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([point.lat, point.lon], selectedLocation ? 16 : 12)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map)
    const icon = L.divIcon({ className: "", html: '<div style="width:22px;height:22px;border-radius:9999px;background:#2563eb;border:4px solid white;box-shadow:0 4px 14px rgba(37,99,235,.45)"></div>', iconSize: [22, 22], iconAnchor: [11, 11] })
    const marker = L.marker([point.lat, point.lon], { icon, draggable: true }).addTo(map)
    map.on("click", (e) => reversePoint({ lat: e.latlng.lat, lon: e.latlng.lng }))
    marker.on("dragend", () => { const p = marker.getLatLng(); reversePoint({ lat: p.lat, lon: p.lng }) })
    leafletRef.current = { map, marker }
    return () => { map.remove(); leafletRef.current = null }
  }, [])

  useEffect(() => {
    if (!selectedLocation || !leafletRef.current) return
    leafletRef.current.marker.setLatLng([selectedLocation.lat, selectedLocation.lon])
    leafletRef.current.map.setView([selectedLocation.lat, selectedLocation.lon], 16)
  }, [selectedLocation])

  useEffect(() => {
    const q = addressQuery.trim(); setAddressError(null)
    if (q.length < 3) { setSuggestions([]); setAddressLoading(false); return }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setAddressLoading(true)
      try {
        const res = await fetch(`/api/maps/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        if (!res.ok) throw new Error("Pencarian alamat sedang bermasalah")
        const data = (await res.json()) as { items?: AddressSuggestion[] }
        setSuggestions(data.items ?? [])
      } catch (e) { if ((e as Error).name !== "AbortError") setAddressError(e instanceof Error ? e.message : "Gagal mencari alamat") }
      finally { setAddressLoading(false) }
    }, 450)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [addressQuery])

  function chooseAddress(item: AddressSuggestion) {
    set("address", item.label); setAddressQuery(item.label)
    if (item.lat && item.lon) setSelectedLocation({ lat: item.lat, lon: item.lon })
    setSuggestions([])
  }
  function useMyLocation() {
    if (!navigator.geolocation) return setAddressError("Browser belum mendukung lokasi otomatis")
    navigator.geolocation.getCurrentPosition((pos) => reversePoint({ lat: pos.coords.latitude, lon: pos.coords.longitude }), () => setAddressError("Izin lokasi ditolak / lokasi belum tersedia"), { enableHighAccuracy: true, timeout: 12000 })
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      const locationNote = selectedLocation ? `\nKoordinat alamat: ${selectedLocation.lat}, ${selectedLocation.lon} (OpenStreetMap)` : ""
      const res = await Admissions.publicCreate({ name: form.name, gender: form.gender === "L" || form.gender === "P" ? form.gender : null, birthPlace: form.birthPlace || null, birthDate: form.birthDate || null, parentName: form.parentName || null, parentWa: form.parentWa || null, address: form.address || null, desiredClass: form.desiredClass || null, previousSchool: form.previousSchool || null, notes: `${form.notes || ""}${locationNote}`.trim() || null })
      setDone(res.id)
    } catch (e) { setError(e instanceof Error ? e.message : "Pendaftaran gagal") } finally { setSaving(false) }
  }
  const label = "text-sm font-semibold text-slate-700 dark:text-slate-200"
  if (done) return <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center dark:bg-slate-950"><div className="max-w-lg rounded-3xl bg-white p-8 shadow dark:bg-slate-900 dark:text-white"><h1 className="text-2xl font-bold">Pendaftaran terkirim</h1><p className="mt-3 text-slate-600 dark:text-slate-300">Nomor pendaftaran: <b>#{done}</b>. Tim sekolah akan menghubungi wali melalui WhatsApp.</p><a className="btn-primary mt-6 inline-flex" href="/">Kembali</a></div></main>
  return <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950"><form onSubmit={submit} className="mx-auto max-w-2xl rounded-3xl bg-white p-5 sm:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><h1 className="text-2xl font-bold text-slate-950 dark:text-white">Form PPDB Taka School</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Isi data calon siswa. Kolom bertanda * wajib diisi.</p>{error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</div>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><label className={label}>Nama calon siswa *<input required className="input-base mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} /></label><div className={label}>Jenis kelamin<Select className="mt-1" value={form.gender} onChange={(v) => set("gender", v)} options={[{ value: "", label: "Pilih jenis kelamin" }, { value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }]} /></div><div className={label}>Tanggal lahir<DatePicker className="mt-1" value={form.birthDate} onChange={(v) => set("birthDate", v)} /></div><label className={label}>Tempat lahir<input className="input-base mt-1" value={form.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} /></label><label className={label}>Kelas tujuan<input className="input-base mt-1" placeholder="X IPA / XI IPS / XII Bahasa" value={form.desiredClass} onChange={(e) => set("desiredClass", e.target.value)} /></label><label className={label}>Nama ibu<input className="input-base mt-1" value={form.parentName} onChange={(e) => set("parentName", e.target.value)} /></label><label className={label}>WhatsApp ortu<input className="input-base mt-1" value={form.parentWa} onChange={(e) => set("parentWa", e.target.value)} /></label><div className="sm:col-span-2"><label htmlFor="address-search" className={label}>Cari alamat lewat OpenStreetMap</label><div className="relative mt-1"><input id="address-search" className="input-base pr-10" placeholder="Ketik nama jalan, desa, kecamatan, kota..." value={addressQuery} onChange={(e) => { setAddressQuery(e.target.value); set("address", e.target.value); setSelectedLocation(null) }} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span></div><div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sumber: OpenStreetMap/Nominatim. Pilih hasil, klik peta, atau pakai lokasi perangkat.</div>{addressLoading && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">Mencari alamat...</div>}{addressError && <div className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-200">{addressError}</div>}{suggestions.length > 0 && <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">{suggestions.map((item) => <button key={item.id} type="button" onClick={() => chooseAddress(item)} className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-primary-50 dark:border-slate-700 dark:hover:bg-slate-700"><span className="font-medium text-slate-900 dark:text-slate-100">{item.label}</span>{item.lat && item.lon && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.lat.toFixed(5)}, {item.lon.toFixed(5)}</span>}</button>)}</div>}<div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"><div ref={mapRef} className="h-64 w-full" /><div className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs text-slate-600 dark:text-slate-300"><span>{selectedLocation ? `Titik: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lon.toFixed(6)}` : "Klik peta untuk menentukan titik rumah."}</span><button type="button" onClick={useMyLocation} className="rounded-full bg-primary-600 px-3 py-1.5 font-semibold text-white hover:bg-primary-700">Gunakan lokasi saya</button></div></div></div><label className={`${label} sm:col-span-2`}>Alamat lengkap<textarea className="input-base mt-1 min-h-24" value={form.address} onChange={(e) => set("address", e.target.value)} /></label><label className={`${label} sm:col-span-2`}>Asal sekolah<input className="input-base mt-1" value={form.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} /></label><label className={`${label} sm:col-span-2`}>Catatan<textarea className="input-base mt-1 min-h-24" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></label></div><button disabled={saving} className="btn-primary mt-6">{saving ? "Mengirim..." : "Kirim Pendaftaran"}</button></form></main>
}
