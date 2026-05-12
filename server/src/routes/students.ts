import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireOffice, requireSchoolRead } from "../auth.js"
import { parsePagination, paginationMeta } from "../pagination.js"

const router = Router()

const studentSchema = z.object({
  classId: z.number().int().positive().nullable().optional(),
  nis: z.string().max(40).nullable().optional(),
  nisn: z.string().max(40).nullable().optional(),
  nickname: z.string().max(80).nullable().optional(),
  name: z.string().min(1).max(120),
  gender: z.enum(["L", "P"]).nullable().optional(),
  birthPlace: z.string().max(120).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  religion: z.string().max(60).nullable().optional(),
  parentName: z.string().max(120).nullable().optional(),
  parentWa: z.string().max(30).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  bloodType: z.string().max(5).nullable().optional(),
  allergies: z.string().max(255).nullable().optional(),
  medicalNotes: z.string().nullable().optional(),
  emergencyContactName: z.string().max(120).nullable().optional(),
  emergencyContactPhone: z.string().max(30).nullable().optional(),
  status: z.enum(["aktif", "lulus", "keluar"]).optional(),
  photoUrl: z.string().max(500).nullable().optional(),
  guardian: z.object({
    relation: z.string().max(40).nullable().optional(),
    name: z.string().max(120).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    whatsapp: z.string().max(30).nullable().optional(),
    email: z.string().max(160).nullable().optional(),
    occupation: z.string().max(120).nullable().optional(),
    address: z.string().max(255).nullable().optional(),
  }).nullable().optional(),
})

router.use(requireSchoolRead())

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const q = (req.query.q as string | undefined)?.trim() || ""
  const classId = req.query.classId ? Number(req.query.classId) : null
  const status = (req.query.status as string | undefined) || ""
  const { page, pageSize, limit, offset } = parsePagination(req.query)

  const where: string[] = ["s.school_id = ?"]
  const params: unknown[] = [schoolId]
  if (q) {
    where.push("(s.name LIKE ? OR s.nickname LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ? OR s.parent_name LIKE ?)")
    const like = `%${q}%`
    params.push(like, like, like, like, like)
  }
  if (classId) {
    where.push("s.class_id = ?")
    params.push(classId)
  }
  if (status) {
    where.push("s.status = ?")
    params.push(status)
  }

  const whereClause = where.join(" AND ")

  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM students s WHERE ${whereClause}`,
    params
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, c.name AS class_name FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE ${whereClause}
     ORDER BY s.name ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  )

  res.json({
    items: rows,
    pagination: paginationMeta(Number(total), page, pageSize),
  })
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
  const [guardians] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM guardians WHERE student_id = ? ORDER BY is_primary DESC, id ASC`,
    [id],
  )
  res.json({ ...rows[0], guardians })
})

router.post("/", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = studentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO students (school_id, class_id, nis, nisn, nickname, name, gender, birth_place, birth_date, religion, parent_name, parent_wa, address, blood_type, allergies, medical_notes, emergency_contact_name, emergency_contact_phone, status, photo_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      schoolId,
      d.classId ?? null,
      d.nis ?? null,
      d.nisn ?? null,
      d.nickname ?? null,
      d.name,
      d.gender ?? null,
      d.birthPlace ?? null,
      d.birthDate ?? null,
      d.religion ?? null,
      d.parentName ?? null,
      d.parentWa ?? null,
      d.address ?? null,
      d.bloodType ?? null,
      d.allergies ?? null,
      d.medicalNotes ?? null,
      d.emergencyContactName ?? null,
      d.emergencyContactPhone ?? null,
      d.status ?? "aktif",
      d.photoUrl ?? null,
    ],
  )
  if (d.guardian?.name || d.parentName) {
    await pool.query(
      `INSERT INTO guardians (school_id, student_id, relation, name, phone, whatsapp, email, occupation, address, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [schoolId, r.insertId, d.guardian?.relation || "wali", d.guardian?.name || d.parentName || null, d.guardian?.phone || d.parentWa || null, d.guardian?.whatsapp || d.parentWa || null, d.guardian?.email || null, d.guardian?.occupation || null, d.guardian?.address || d.address || null],
    )
  }
  res.json({ id: r.insertId })
})

router.put("/:id", requireOffice(), async (req, res) => {
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
    nisn: d.nisn,
    nickname: d.nickname,
    name: d.name,
    gender: d.gender,
    birth_place: d.birthPlace,
    birth_date: d.birthDate,
    religion: d.religion,
    parent_name: d.parentName,
    parent_wa: d.parentWa,
    address: d.address,
    blood_type: d.bloodType,
    allergies: d.allergies,
    medical_notes: d.medicalNotes,
    emergency_contact_name: d.emergencyContactName,
    emergency_contact_phone: d.emergencyContactPhone,
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
  if (d.guardian !== undefined) {
    await pool.query(`DELETE FROM guardians WHERE school_id = ? AND student_id = ?`, [schoolId, id])
    if (d.guardian?.name || d.parentName) {
      await pool.query(
        `INSERT INTO guardians (school_id, student_id, relation, name, phone, whatsapp, email, occupation, address, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [schoolId, id, d.guardian?.relation || "wali", d.guardian?.name || d.parentName || null, d.guardian?.phone || d.parentWa || null, d.guardian?.whatsapp || d.parentWa || null, d.guardian?.email || null, d.guardian?.occupation || null, d.guardian?.address || d.address || null],
      )
    }
  }
  res.json({ ok: true })
})

router.delete("/:id", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(
    `DELETE FROM students WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  res.json({ ok: true })
})

export default router
