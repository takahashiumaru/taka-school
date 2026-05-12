import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireOffice, requireSchoolRead } from "../auth.js"

const router = Router()
router.use(requireSchoolRead())

const schema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive().nullable().optional(),
  teacherId: z.number().int().positive().nullable().optional(),
  title: z.string().min(1).max(180),
  description: z.string().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
})

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const classId = req.query.classId ? Number(req.query.classId) : null
  const where = ["t.school_id = ?"]
  const params: unknown[] = [schoolId]
  if (classId) { where.push("t.class_id = ?"); params.push(classId) }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.*, c.name class_name, s.name subject_name, u.name teacher_name
     FROM tasks t
     JOIN classes c ON c.id=t.class_id
     LEFT JOIN subjects s ON s.id=t.subject_id
     LEFT JOIN users u ON u.id=t.teacher_id
     WHERE ${where.join(" AND ")}
     ORDER BY COALESCE(t.due_date, '9999-12-31'), t.created_at DESC`, params)
  res.json({ items: rows })
})

router.post("/", requireOffice(), async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data, schoolId = req.user!.schoolId
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO tasks (school_id,class_id,subject_id,teacher_id,title,description,due_date,status) VALUES (?,?,?,?,?,?,?,?)`,
    [schoolId,d.classId,d.subjectId??null,d.teacherId??null,d.title,d.description??null,d.dueDate??null,d.status??"published"])
  res.json({ id: r.insertId })
})

router.put("/:id", requireOffice(), async (req, res) => {
  const parsed = schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data, fields: string[] = [], params: unknown[] = []
  const map: Record<string, unknown> = { class_id:d.classId, subject_id:d.subjectId, teacher_id:d.teacherId, title:d.title, description:d.description, due_date:d.dueDate, status:d.status }
  Object.entries(map).forEach(([k,v]) => { if (v !== undefined) { fields.push(`${k}=?`); params.push(v) } })
  if (fields.length) await pool.query(`UPDATE tasks SET ${fields.join(",")} WHERE id=? AND school_id=?`, [...params, Number(req.params.id), req.user!.schoolId])
  res.json({ ok: true })
})

router.delete("/:id", requireOffice(), async (req, res) => {
  await pool.query(`DELETE FROM tasks WHERE id=? AND school_id=?`, [Number(req.params.id), req.user!.schoolId])
  res.json({ ok: true })
})

export default router
