import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

router.use(requireAuth())

const schema = z.object({
  studentId: z.number().int().positive(),
  semester: z.string().min(1).max(60),
  body: z.string().min(1),
})

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const studentId = req.query.studentId ? Number(req.query.studentId) : null
  const where: string[] = ["r.school_id = ?"]
  const params: unknown[] = [schoolId]
  if (studentId) { where.push("r.student_id = ?"); params.push(studentId) }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.*, s.name AS student_name, c.name AS class_name
     FROM reports r
     JOIN students s ON s.id = r.student_id
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE ${where.join(" AND ")}
     ORDER BY r.created_at DESC LIMIT 500`,
    params,
  )
  res.json({ items: rows })
})

router.post("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT INTO reports (school_id, student_id, semester, body) VALUES (?,?,?,?)`,
      [schoolId, d.studentId, d.semester, d.body],
    )
    res.json({ id: r.insertId })
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes("Duplicate")) return res.status(409).json({ error: "Rapor untuk semester ini sudah ada" })
    throw e
  }
})

router.put("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const fields: string[] = []
  const params: unknown[] = []
  if (d.semester !== undefined) { fields.push("semester = ?"); params.push(d.semester) }
  if (d.body !== undefined) { fields.push("body = ?"); params.push(d.body) }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE reports SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(`DELETE FROM reports WHERE id = ? AND school_id = ?`, [id, schoolId])
  res.json({ ok: true })
})

export default router
