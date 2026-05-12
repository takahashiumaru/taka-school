import { Router } from "express"

const router = Router()

type NominatimResult = {
  place_id?: number
  display_name?: string
  lat?: string
  lon?: string
  type?: string
  importance?: number
}

type ReverseResult = { display_name?: string; lat?: string; lon?: string }

async function fetchNominatim(path: string, params: URLSearchParams) {
  const response = await fetch(`https://nominatim.openstreetmap.org/${path}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TakaSchool/1.0 (alamat-search; contact: admin@takaschool.local)",
    },
  })
  if (!response.ok) throw new Error("Nominatim unavailable")
  return response
}

router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim()
  if (q.length < 3) return res.json({ items: [] })
  try {
    const response = await fetchNominatim("search", new URLSearchParams({ q, format: "jsonv2", addressdetails: "1", limit: "6", countrycodes: "id" }))
    const data = (await response.json()) as NominatimResult[]
    res.json({ items: data.map((item) => ({ id: item.place_id, label: item.display_name, lat: item.lat ? Number(item.lat) : null, lon: item.lon ? Number(item.lon) : null, type: item.type ?? null, importance: item.importance ?? null, source: "OpenStreetMap Nominatim" })) })
  } catch {
    res.status(502).json({ message: "Layanan peta sedang tidak tersedia" })
  }
})

router.get("/reverse", async (req, res) => {
  const lat = Number(req.query.lat)
  const lon = Number(req.query.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).json({ message: "Koordinat tidak valid" })
  try {
    const response = await fetchNominatim("reverse", new URLSearchParams({ lat: String(lat), lon: String(lon), format: "jsonv2", addressdetails: "1" }))
    const data = (await response.json()) as ReverseResult
    res.json({ label: data.display_name ?? `${lat}, ${lon}`, lat, lon, source: "OpenStreetMap Nominatim" })
  } catch {
    res.status(502).json({ message: "Gagal membaca alamat dari titik peta" })
  }
})

export default router
