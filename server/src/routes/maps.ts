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

router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim()
  if (q.length < 3) return res.json({ items: [] })

  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
    countrycodes: "id",
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "TakaSchool/1.0 (alamat-search; contact: admin@takaschool.local)",
    },
  })

  if (!response.ok) {
    return res.status(502).json({ message: "Layanan peta sedang tidak tersedia" })
  }

  const data = (await response.json()) as NominatimResult[]
  res.json({
    items: data.map((item) => ({
      id: item.place_id,
      label: item.display_name,
      lat: item.lat ? Number(item.lat) : null,
      lon: item.lon ? Number(item.lon) : null,
      type: item.type ?? null,
      importance: item.importance ?? null,
      source: "OpenStreetMap Nominatim",
    })),
  })
})

export default router
