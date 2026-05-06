import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

const studentSchema = z.object({
  classId: z.number().int().positive().nullable().optional(),
  nis: z.string().max(40).nullable().optional(),
  name: z.string().min(1).max(120),
  gender: z.enum(["L", "P"]).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  parentName: z.string().max(120).nullable().optional(),
  parentWa: z.string().max(30).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  status: z.enum(["aktif", "lulus", "keluar"]).optional(),
  photoUrl: z.string().max(500).nullable().optional(),
})

router.use(requireAuth())

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const q = (req.query.q as string | undefined)?.trim() || ""
  const classId = req.query.classId ? Number(req.query.classId) : null
  const status = (req.query.status as string | undefined) || ""

  const where: string[] = ["s.school_id = ?"]
  const params: unknown[] = [schoolId]
  if (q) {
    where.push("(s.name LIKE ? OR s.nis LIKE ? OR s.parent_name LIKE ?)")
    const like = `%${q}%`
    params.push(like, like, like)
  }
  if (classId) {
    where.push("s.class_id = ?")
    params.push(classId)
  }
  if (status) {
    where.push("s.status = ?")
    params.push(status)
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, c.name AS class_name FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE ${where.join(" AND ")}
     ORDER BY s.name ASC LIMIT 500`,
    params,
  )
  res.json({ items: rows })
})

router.get("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, c.name AS class_name FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE s.id = ? AND s.school_id = ? LIMIT 1`,
    [id, schoolId],
  )
  if (rows.length === 0) return res.status(404).json({ error: "Not found" })
  res.json(rows[0])
})

router.post("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = studentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO students (school_id, class_id, nis, name, gender, birth_date, parent_name, parent_wa, address, status, photo_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      schoolId,
      d.classId ?? null,
      d.nis ?? null,
      d.name,
      d.gender ?? null,
      d.birthDate ?? null,
      d.parentName ?? null,
      d.parentWa ?? null,
      d.address ?? null,
      d.status ?? "aktif",
      d.photoUrl ?? null,
    ],
  )
  res.json({ id: r.insertId })
})

router.put("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = studentSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const fields: string[] = []
  const params: unknown[] = []
  const map: Record<string, unknown> = {
    class_id: d.classId,
    nis: d.nis,
    name: d.name,
    gender: d.gender,
    birth_date: d.birthDate,
    parent_name: d.parentName,
    parent_wa: d.parentWa,
    address: d.address,
    status: d.status,
    photo_url: d.photoUrl,
  }
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) {
      fields.push(`${k} = ?`)
      params.push(v)
    }
  }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE students SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(
    `DELETE FROM students WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  res.json({ ok: true })
})

export default router
