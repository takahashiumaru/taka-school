import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

router.use(requireAuth())

const schema = z.object({
  title: z.string().min(1).max(180),
  body: z.string().min(1),
  targetClassId: z.number().int().positive().nullable().optional(),
})

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT a.*, u.name AS author_name, c.name AS class_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.author_id
     LEFT JOIN classes c ON c.id = a.target_class_id
     WHERE a.school_id = ?
     ORDER BY a.created_at DESC LIMIT 200`,
    [schoolId],
  )
  res.json({ items: rows })
})

router.post("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const userId = req.user!.id
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO announcements (school_id, author_id, title, body, target_class_id) VALUES (?,?,?,?,?)`,
    [schoolId, userId, d.title, d.body, d.targetClassId ?? null],
  )
  res.json({ id: r.insertId })
})

router.put("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const fields: string[] = []
  const params: unknown[] = []
  if (d.title !== undefined) { fields.push("title = ?"); params.push(d.title) }
  if (d.body !== undefined) { fields.push("body = ?"); params.push(d.body) }
  if (d.targetClassId !== undefined) { fields.push("target_class_id = ?"); params.push(d.targetClassId) }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE announcements SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(`DELETE FROM announcements WHERE id = ? AND school_id = ?`, [id, schoolId])
  res.json({ ok: true })
})

export default router
