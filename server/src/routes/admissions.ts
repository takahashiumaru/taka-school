import { Router } from "express"
import { z } from "zod"
import type { ResultSetHeader, RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireOffice } from "../auth.js"
import { parsePagination, paginationMeta } from "../pagination.js"

const router = Router()

const STATUSES = ["new", "submitted", "verifying", "interview", "accepted", "rejected", "waitlisted", "enrolled"] as const

const applicantSchema = z.object({
  schoolId: z.number().int().positive().optional(),
  academicYear: z.string().max(30).nullable().optional(),
  desiredClass: z.string().max(80).nullable().optional(),
  name: z.string().min(1).max(120),
  gender: z.enum(["L", "P"]).nullable().optional(),
  birthPlace: z.string().max(120).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  parentName: z.string().max(120).nullable().optional(),
  parentWa: z.string().max(30).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  previousSchool: z.string().max(160).nullable().optional(),
  documentUrl: z.string().max(500).nullable().optional(),
  birthCertificateUrl: z.string().max(500).nullable().optional(),
  familyCardUrl: z.string().max(500).nullable().optional(),
  paymentProofUrl: z.string().max(500).nullable().optional(),
  notes: z.string().nullable().optional(),
})

const updateSchema = applicantSchema.partial().extend({
  status: z.enum(STATUSES).optional(),
  registrationInvoiceUrl: z.string().max(500).nullable().optional(),
  interviewAt: z.string().max(40).nullable().optional(),
})

async function defaultSchoolId() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM schools ORDER BY id ASC LIMIT 1")
  return rows[0]?.id as number | undefined
}

router.post("/public", async (req, res) => {
  const parsed = applicantSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const schoolId = d.schoolId ?? await defaultSchoolId()
  if (!schoolId) return res.status(400).json({ error: "School not found" })
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO admissions_applicants (school_id, academic_year, desired_class, name, gender, birth_place, birth_date, parent_name, parent_wa, address, previous_school, document_url, birth_certificate_url, family_card_url, payment_proof_url, notes, status, submitted_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'submitted', NOW())`,
    [schoolId, d.academicYear ?? null, d.desiredClass ?? null, d.name, d.gender ?? null, d.birthPlace ?? null, d.birthDate ?? null, d.parentName ?? null, d.parentWa ?? null, d.address ?? null, d.previousSchool ?? null, d.documentUrl ?? null, d.birthCertificateUrl ?? null, d.familyCardUrl ?? null, d.paymentProofUrl ?? null, d.notes ?? null],
  )
  res.json({ id: r.insertId, status: "submitted" })
})

router.use(requireOffice())

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const status = (req.query.status as string | undefined) || ""
  const q = (req.query.q as string | undefined)?.trim() || ""
  const { page, pageSize, limit, offset } = parsePagination(req.query)

  const where = ["school_id = ?"]
  const params: unknown[] = [schoolId]
  if (status) { where.push("status = ?"); params.push(status) }
  if (q) { where.push("(name LIKE ? OR parent_name LIKE ? OR parent_wa LIKE ?)"); const like = `%${q}%`; params.push(like, like, like) }

  const whereClause = where.join(" AND ")

  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM admissions_applicants WHERE ${whereClause}`,
    params
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM admissions_applicants WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  res.json({
    items: rows,
    pagination: paginationMeta(Number(total), page, pageSize),
  })
})

router.get("/:id", async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM admissions_applicants WHERE id = ? AND school_id = ? LIMIT 1", [Number(req.params.id), req.user!.schoolId])
  if (!rows.length) return res.status(404).json({ error: "Not found" })
  res.json(rows[0])
})

router.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const map: Record<string, unknown> = {
    academic_year: d.academicYear, desired_class: d.desiredClass, name: d.name, gender: d.gender,
    birth_place: d.birthPlace, birth_date: d.birthDate, parent_name: d.parentName, parent_wa: d.parentWa,
    address: d.address, previous_school: d.previousSchool, document_url: d.documentUrl,
    birth_certificate_url: d.birthCertificateUrl, family_card_url: d.familyCardUrl, payment_proof_url: d.paymentProofUrl,
    registration_invoice_url: d.registrationInvoiceUrl, interview_at: d.interviewAt, notes: d.notes, status: d.status,
  }
  const fields: string[] = []
  const params: unknown[] = []
  for (const [k, v] of Object.entries(map)) if (v !== undefined) { fields.push(`${k} = ?`); params.push(v) }
  if (!fields.length) return res.json({ ok: true })
  params.push(Number(req.params.id), req.user!.schoolId)
  await pool.query(`UPDATE admissions_applicants SET ${fields.join(", ")} WHERE id = ? AND school_id = ?`, params)
  res.json({ ok: true })
})

router.post("/:id/enroll", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM admissions_applicants WHERE id = ? AND school_id = ? LIMIT 1", [id, schoolId])
  const a = rows[0]
  if (!a) return res.status(404).json({ error: "Not found" })
  if (a.student_id) return res.json({ studentId: a.student_id })
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO students (school_id, name, gender, birth_place, birth_date, parent_name, parent_wa, address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
    [schoolId, a.name, a.gender, a.birth_place, a.birth_date, a.parent_name, a.parent_wa, a.address],
  )
  await pool.query("UPDATE admissions_applicants SET status = 'enrolled', student_id = ? WHERE id = ? AND school_id = ?", [r.insertId, id, schoolId])
  res.json({ studentId: r.insertId })
})

export default router
