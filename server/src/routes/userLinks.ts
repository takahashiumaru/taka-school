import { Router } from "express"
import { z } from "zod"
import type { ResultSetHeader, RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireRole } from "../auth.js"

const router = Router()
router.use(requireRole("admin", "staff"))

const linkSchema = z.object({ userId: z.number().int().positive(), studentId: z.number().int().positive() })
const guardianLinkSchema = linkSchema.extend({ guardianId: z.number().int().positive() })
const teacherLinkSchema = z.object({ userId: z.number().int().positive(), teacherUserId: z.number().int().positive() })

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const [studentLinks] = await pool.query<RowDataPacket[]>(
    `SELECT l.*, u.name AS user_name, u.email AS user_email, st.name AS student_name
     FROM user_student_links l
     JOIN users u ON u.id = l.user_id
     JOIN students st ON st.id = l.student_id
     WHERE l.school_id = ?
     ORDER BY u.name, st.name`,
    [schoolId],
  )
  const [guardianLinks] = await pool.query<RowDataPacket[]>(
    `SELECT l.*, u.name AS user_name, u.email AS user_email, g.name AS guardian_name, st.name AS student_name
     FROM user_guardian_links l
     JOIN users u ON u.id = l.user_id
     JOIN guardians g ON g.id = l.guardian_id
     JOIN students st ON st.id = l.student_id
     WHERE l.school_id = ?
     ORDER BY u.name, st.name`,
    [schoolId],
  )
  const [teacherLinks] = await pool.query<RowDataPacket[]>(
    `SELECT l.*, u.name AS user_name, u.email AS user_email, t.name AS teacher_name
     FROM user_teacher_links l
     JOIN users u ON u.id = l.user_id
     JOIN users t ON t.id = l.teacher_user_id
     WHERE l.school_id = ?
     ORDER BY u.name`,
    [schoolId],
  )
  res.json({ studentLinks, guardianLinks, teacherLinks })
})

router.post("/student", async (req, res) => {
  const parsed = linkSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Input tidak valid", issues: parsed.error.issues })
  const schoolId = req.user!.schoolId
  const { userId, studentId } = parsed.data
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO user_student_links (school_id, user_id, student_id)
     SELECT ?, u.id, st.id FROM users u JOIN students st ON st.school_id = u.school_id
     WHERE u.school_id = ? AND u.id = ? AND st.id = ?`,
    [schoolId, schoolId, userId, studentId],
  )
  res.status(201).json({ ok: true, inserted: result.affectedRows })
})

router.post("/guardian", async (req, res) => {
  const parsed = guardianLinkSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Input tidak valid", issues: parsed.error.issues })
  const schoolId = req.user!.schoolId
  const { userId, guardianId, studentId } = parsed.data
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO user_guardian_links (school_id, user_id, guardian_id, student_id)
     SELECT ?, u.id, g.id, g.student_id FROM users u JOIN guardians g ON g.school_id = u.school_id
     WHERE u.school_id = ? AND u.id = ? AND g.id = ? AND g.student_id = ?`,
    [schoolId, schoolId, userId, guardianId, studentId],
  )
  res.status(201).json({ ok: true, inserted: result.affectedRows })
})

router.post("/teacher", async (req, res) => {
  const parsed = teacherLinkSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Input tidak valid", issues: parsed.error.issues })
  const schoolId = req.user!.schoolId
  const { userId, teacherUserId } = parsed.data
  await pool.query(
    `INSERT INTO user_teacher_links (school_id, user_id, teacher_user_id)
     SELECT ?, u.id, t.id FROM users u JOIN users t ON t.school_id = u.school_id
     WHERE u.school_id = ? AND u.id = ? AND t.id = ?
     ON DUPLICATE KEY UPDATE teacher_user_id = VALUES(teacher_user_id)`,
    [schoolId, schoolId, userId, teacherUserId],
  )
  res.status(201).json({ ok: true })
})

export default router
