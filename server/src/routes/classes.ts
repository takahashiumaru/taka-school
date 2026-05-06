import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

const classSchema = z.object({
  name: z.string().min(1).max(80),
  gradeLevel: z.string().max(40).nullable().optional(),
  homeroomTeacherId: z.number().int().positive().nullable().optional(),
})

router.use(requireAuth())

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, u.name AS teacher_name,
       (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.status='aktif') AS student_count
     FROM classes c
     LEFT JOIN users u ON u.id = c.homeroom_teacher_id
     WHERE c.school_id = ?
     ORDER BY c.name ASC`,
    [schoolId],
  )
  res.json({ items: rows })
})

router.post("/", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = classSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO classes (school_id, name, grade_level, homeroom_teacher_id) VALUES (?,?,?,?)`,
    [schoolId, d.name, d.gradeLevel ?? null, d.homeroomTeacherId ?? null],
  )
  res.json({ id: r.insertId })
})

router.put("/:id", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = classSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const fields: string[] = []
  const params: unknown[] = []
  if (d.name !== undefined) { fields.push("name = ?"); params.push(d.name) }
  if (d.gradeLevel !== undefined) { fields.push("grade_level = ?"); params.push(d.gradeLevel) }
  if (d.homeroomTeacherId !== undefined) { fields.push("homeroom_teacher_id = ?"); params.push(d.homeroomTeacherId) }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE classes SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(
    `DELETE FROM classes WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  res.json({ ok: true })
})

export default router
