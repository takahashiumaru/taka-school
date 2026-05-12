import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireOffice, requireSchoolRead } from "../auth.js"
import { parsePagination, paginationMeta } from "../pagination.js"

const router = Router()

const nullableId = z.number().int().positive().nullable().optional()

const classSchema = z.object({
  name: z.string().min(1).max(80),
  gradeLevel: z.string().max(40).nullable().optional(),
  educationLevelId: nullableId,
  gradeLevelId: nullableId,
  academicYearId: nullableId,
  majorId: nullableId,
  homeroomTeacherId: nullableId,
})

router.use(requireSchoolRead())

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const { page, pageSize, limit, offset } = parsePagination(req.query)
  
  const where = ["c.school_id = ?"]
  const params: unknown[] = [schoolId]
  for (const [queryKey, column] of [["educationLevelId", "c.education_level_id"], ["gradeLevelId", "c.grade_level_id"], ["academicYearId", "c.academic_year_id"], ["majorId", "c.major_id"]] as const) {
    if (req.query[queryKey]) { where.push(`${column} = ?`); params.push(Number(req.query[queryKey])) }
  }
  
  const whereClause = where.join(" AND ")
  
  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM classes c WHERE ${whereClause}`,
    params
  )
  
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, u.name AS teacher_name,
       el.name AS education_level_name,
       gl.name AS grade_level_name,
       ay.name AS academic_year_name,
       m.name AS major_name,
       (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.status='aktif') AS student_count
     FROM classes c
     LEFT JOIN users u ON u.id = c.homeroom_teacher_id
     LEFT JOIN education_levels el ON el.id = c.education_level_id
     LEFT JOIN grade_levels gl ON gl.id = c.grade_level_id
     LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
     LEFT JOIN majors m ON m.id = c.major_id
     WHERE ${whereClause}
     ORDER BY el.sort_order ASC, gl.sort_order ASC, c.name ASC
     LIMIT ? OFFSET ?`,
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
    `SELECT c.*, u.name AS teacher_name, el.name AS education_level_name, gl.name AS grade_level_name, ay.name AS academic_year_name, m.name AS major_name
     FROM classes c
     LEFT JOIN users u ON u.id = c.homeroom_teacher_id
     LEFT JOIN education_levels el ON el.id = c.education_level_id
     LEFT JOIN grade_levels gl ON gl.id = c.grade_level_id
     LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
     LEFT JOIN majors m ON m.id = c.major_id
     WHERE c.id=? AND c.school_id=? LIMIT 1`, [id, schoolId])
  if (!rows.length) return res.status(404).json({ error: "Not found" })
  const [students] = await pool.query<RowDataPacket[]>(`SELECT id, nis, nisn, name, gender, status FROM students WHERE class_id=? AND school_id=? ORDER BY name`, [id, schoolId])
  res.json({ ...rows[0], students })
})

async function validateAcademicRefs(schoolId: number, d: { educationLevelId?: number | null; gradeLevelId?: number | null; academicYearId?: number | null; majorId?: number | null }) {
  if (d.academicYearId) {
    const [y] = await pool.query<RowDataPacket[]>(`SELECT id FROM academic_years WHERE id=? AND school_id=? AND is_active=1`, [d.academicYearId, schoolId])
    if (!y.length) return "Tahun ajaran harus valid dan aktif"
  }
  if (d.gradeLevelId) {
    const [g] = await pool.query<RowDataPacket[]>(`SELECT education_level_id FROM grade_levels WHERE id=? AND school_id=? AND is_active=1`, [d.gradeLevelId, schoolId])
    if (!g.length) return "Tingkat kelas harus valid dan aktif"
    if (d.educationLevelId && Number(g[0].education_level_id) !== d.educationLevelId) return "Tingkat kelas tidak sesuai dengan jenjang"
  }
  if (d.majorId) {
    const [m] = await pool.query<RowDataPacket[]>(`SELECT education_level_id FROM majors WHERE id=? AND school_id=? AND is_active=1`, [d.majorId, schoolId])
    if (!m.length) return "Jurusan harus valid dan aktif"
    if (d.educationLevelId && Number(m[0].education_level_id) !== d.educationLevelId) return "Jurusan tidak sesuai dengan jenjang"
  }
  return null
}

router.post("/", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = classSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const validationError = await validateAcademicRefs(schoolId, d)
  if (validationError) return res.status(400).json({ error: validationError })
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO classes (school_id, education_level_id, grade_level_id, academic_year_id, name, grade_level, major_id, homeroom_teacher_id) VALUES (?,?,?,?,?,?,?,?)`,
    [schoolId, d.educationLevelId ?? null, d.gradeLevelId ?? null, d.academicYearId ?? null, d.name, d.gradeLevel ?? null, d.majorId ?? null, d.homeroomTeacherId ?? null],
  )
  res.json({ id: r.insertId })
})

router.put("/:id", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = classSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [existing] = await pool.query<RowDataPacket[]>(`SELECT education_level_id AS educationLevelId, grade_level_id AS gradeLevelId, academic_year_id AS academicYearId, major_id AS majorId FROM classes WHERE id=? AND school_id=?`, [id, schoolId])
  if (!existing.length) return res.status(404).json({ error: "Not found" })
  const validationError = await validateAcademicRefs(schoolId, { ...existing[0], ...d })
  if (validationError) return res.status(400).json({ error: validationError })
  const fields: string[] = []
  const params: unknown[] = []
  if (d.name !== undefined) { fields.push("name = ?"); params.push(d.name) }
  if (d.gradeLevel !== undefined) { fields.push("grade_level = ?"); params.push(d.gradeLevel) }
  if (d.educationLevelId !== undefined) { fields.push("education_level_id = ?"); params.push(d.educationLevelId) }
  if (d.gradeLevelId !== undefined) { fields.push("grade_level_id = ?"); params.push(d.gradeLevelId) }
  if (d.academicYearId !== undefined) { fields.push("academic_year_id = ?"); params.push(d.academicYearId) }
  if (d.majorId !== undefined) { fields.push("major_id = ?"); params.push(d.majorId) }
  if (d.homeroomTeacherId !== undefined) { fields.push("homeroom_teacher_id = ?"); params.push(d.homeroomTeacherId) }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE classes SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(
    `DELETE FROM classes WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  res.json({ ok: true })
})

export default router
