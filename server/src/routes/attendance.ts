import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

router.use(requireAuth())

const bulkSchema = z.object({
  classId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(
    z.object({
      studentId: z.number().int().positive(),
      status: z.enum(["hadir", "izin", "sakit", "alpa"]),
      note: z.string().max(255).nullable().optional(),
    }),
  ),
})

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const classId = Number(req.query.classId)
  const date = String(req.query.date || "")
  if (!classId || !date) return res.status(400).json({ error: "classId & date required" })

  const [students] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.name, s.nis FROM students s
     WHERE s.school_id = ? AND s.class_id = ? AND s.status = 'aktif'
     ORDER BY s.name ASC`,
    [schoolId, classId],
  )

  const [att] = await pool.query<RowDataPacket[]>(
    `SELECT student_id, status, note FROM attendance
     WHERE school_id = ? AND class_id = ? AND date = ?`,
    [schoolId, classId, date],
  )
  const map = new Map<number, { status: string; note: string | null }>()
  for (const r of att) map.set(Number(r.student_id), { status: String(r.status), note: r.note as string | null })

  res.json({
    classId,
    date,
    students: students.map((s) => ({
      id: Number(s.id),
      name: String(s.name),
      nis: s.nis as string | null,
      status: map.get(Number(s.id))?.status ?? "hadir",
      note: map.get(Number(s.id))?.note ?? null,
    })),
  })
})

router.post("/bulk", async (req, res) => {
  const schoolId = req.user!.schoolId
  const userId = req.user!.id
  const parsed = bulkSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const { classId, date, entries } = parsed.data

  const [klass] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM classes WHERE id = ? AND school_id = ?`,
    [classId, schoolId],
  )
  if (klass.length === 0) return res.status(404).json({ error: "Kelas tidak ditemukan" })

  for (const entry of entries) {
    await pool.query(
      `INSERT INTO attendance (school_id, class_id, student_id, date, status, note, recorded_by)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), recorded_by = VALUES(recorded_by)`,
      [schoolId, classId, entry.studentId, date, entry.status, entry.note ?? null, userId],
    )
  }
  res.json({ ok: true, count: entries.length })
})

router.get("/recap", async (req, res) => {
  const schoolId = req.user!.schoolId
  const classId = req.query.classId ? Number(req.query.classId) : null
  const start = String(req.query.start || "")
  const end = String(req.query.end || "")
  if (!start || !end) return res.status(400).json({ error: "start & end required" })

  const where: string[] = ["a.school_id = ?", "a.date BETWEEN ? AND ?"]
  const params: unknown[] = [schoolId, start, end]
  if (classId) {
    where.push("a.class_id = ?")
    params.push(classId)
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT a.date, a.status, COUNT(*) AS c FROM attendance a
     WHERE ${where.join(" AND ")}
     GROUP BY a.date, a.status
     ORDER BY a.date ASC`,
    params,
  )
  res.json({ items: rows })
})

export default router
