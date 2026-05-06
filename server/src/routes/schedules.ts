import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

router.use(requireAuth())

const schema = z.object({
  classId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  subject: z.string().min(1).max(120),
  teacherId: z.number().int().positive().nullable().optional(),
})

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const classId = req.query.classId ? Number(req.query.classId) : null
  const where: string[] = ["s.school_id = ?"]
  const params: unknown[] = [schoolId]
  if (classId) { where.push("s.class_id = ?"); params.push(classId) }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, c.name AS class_name, u.name AS teacher_name
     FROM schedules s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN users u ON u.id = s.teacher_id
     WHERE ${where.join(" AND ")}
     ORDER BY s.day_of_week ASC, s.start_time ASC`,
    params,
  )
  res.json({ items: rows })
})

router.post("/", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO schedules (school_id, class_id, day_of_week, start_time, end_time, subject, teacher_id)
     VALUES (?,?,?,?,?,?,?)`,
    [schoolId, d.classId, d.dayOfWeek, d.startTime, d.endTime, d.subject, d.teacherId ?? null],
  )
  res.json({ id: r.insertId })
})

router.put("/:id", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const fields: string[] = []
  const params: unknown[] = []
  if (d.classId !== undefined) { fields.push("class_id = ?"); params.push(d.classId) }
  if (d.dayOfWeek !== undefined) { fields.push("day_of_week = ?"); params.push(d.dayOfWeek) }
  if (d.startTime !== undefined) { fields.push("start_time = ?"); params.push(d.startTime) }
  if (d.endTime !== undefined) { fields.push("end_time = ?"); params.push(d.endTime) }
  if (d.subject !== undefined) { fields.push("subject = ?"); params.push(d.subject) }
  if (d.teacherId !== undefined) { fields.push("teacher_id = ?"); params.push(d.teacherId) }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE schedules SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(
    `DELETE FROM schedules WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  res.json({ ok: true })
})

export default router
