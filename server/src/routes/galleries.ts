import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"
import { parsePagination, paginationMeta } from "../pagination.js"

const router = Router()

router.use(requireAuth())

const gallerySchema = z.object({
  title: z.string().min(1).max(180),
  description: z.string().nullable().optional(),
  coverUrl: z.string().max(500).nullable().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

const itemSchema = z.object({
  photoUrl: z.string().min(1).max(500),
  caption: z.string().max(255).nullable().optional(),
})

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const { page, pageSize, limit, offset } = parsePagination(req.query)

  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM galleries WHERE school_id = ?`,
    [schoolId]
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT g.*, (SELECT COUNT(*) FROM gallery_items i WHERE i.gallery_id = g.id) AS photo_count
     FROM galleries g WHERE g.school_id = ?
     ORDER BY COALESCE(g.event_date, g.created_at) DESC LIMIT ? OFFSET ?`,
    [schoolId, limit, offset],
  )

  res.json({
    items: rows,
    pagination: paginationMeta(Number(total), page, pageSize),
  })
})

router.get("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const [g] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM galleries WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  if (g.length === 0) return res.status(404).json({ error: "Not found" })
  const [items] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM gallery_items WHERE gallery_id = ? ORDER BY created_at ASC`,
    [id],
  )
  res.json({ ...g[0], items })
})

router.post("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = gallerySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO galleries (school_id, title, description, cover_url, event_date) VALUES (?,?,?,?,?)`,
    [schoolId, d.title, d.description ?? null, d.coverUrl ?? null, d.eventDate ?? null],
  )
  res.json({ id: r.insertId })
})

router.put("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = gallerySchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const fields: string[] = []
  const params: unknown[] = []
  if (d.title !== undefined) { fields.push("title = ?"); params.push(d.title) }
  if (d.description !== undefined) { fields.push("description = ?"); params.push(d.description) }
  if (d.coverUrl !== undefined) { fields.push("cover_url = ?"); params.push(d.coverUrl) }
  if (d.eventDate !== undefined) { fields.push("event_date = ?"); params.push(d.eventDate) }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE galleries SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(`DELETE FROM galleries WHERE id = ? AND school_id = ?`, [id, schoolId])
  res.json({ ok: true })
})

router.post("/:id/items", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const [g] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM galleries WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  if (g.length === 0) return res.status(404).json({ error: "Galeri tidak ditemukan" })
  const parsed = itemSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO gallery_items (gallery_id, photo_url, caption) VALUES (?,?,?)`,
    [id, d.photoUrl, d.caption ?? null],
  )
  res.json({ id: r.insertId })
})

router.delete("/:id/items/:itemId", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const itemId = Number(req.params.itemId)
  const [g] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM galleries WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  if (g.length === 0) return res.status(404).json({ error: "Galeri tidak ditemukan" })
  await pool.query(`DELETE FROM gallery_items WHERE id = ? AND gallery_id = ?`, [itemId, id])
  res.json({ ok: true })
})

export default router
