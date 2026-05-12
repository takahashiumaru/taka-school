import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireOffice, requireSchoolRead } from "../auth.js"

const router = Router()

router.use(requireSchoolRead())

const createSchema = z.object({
  studentId: z.number().int().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().nonnegative(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(255).nullable().optional(),
})

const paySchema = z.object({
  paidAmount: z.number().nonnegative(),
  method: z.enum(["cash", "transfer", "lain"]).optional(),
  paidAt: z.string().optional(),
})

const batchSchema = z.object({
  classId: z.number().int().positive().nullable().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().nonnegative(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const period = (req.query.period as string | undefined) || ""
  const status = (req.query.status as string | undefined) || ""
  const classId = req.query.classId ? Number(req.query.classId) : null
  const where: string[] = ["i.school_id = ?"]
  const params: unknown[] = [schoolId]
  if (period) { where.push("i.period = ?"); params.push(period) }
  if (status) { where.push("i.status = ?"); params.push(status) }
  if (classId) { where.push("s.class_id = ?"); params.push(classId) }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT i.*, s.name AS student_name, s.parent_name, s.parent_wa, s.class_id, c.name AS class_name
     FROM spp_invoices i
     JOIN students s ON s.id = i.student_id
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE ${where.join(" AND ")}
     ORDER BY i.period DESC, s.name ASC LIMIT 1000`,
    params,
  )
  res.json({ items: rows })
})

router.get("/:id", async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT i.*, s.name AS student_name, s.parent_name, s.parent_wa, s.class_id, c.name AS class_name
     FROM spp_invoices i
     JOIN students s ON s.id = i.student_id
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE i.id = ? AND i.school_id = ?
     LIMIT 1`,
    [id, schoolId],
  )
  if (rows.length === 0) return res.status(404).json({ error: "Tagihan tidak ditemukan" })
  res.json(rows[0])
})

router.post("/", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT INTO spp_invoices (school_id, student_id, period, amount, due_date, status, note)
       VALUES (?,?,?,?,?,'belum',?)`,
      [schoolId, d.studentId, d.period, d.amount, d.dueDate, d.note ?? null],
    )
    res.json({ id: r.insertId })
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes("Duplicate")) return res.status(409).json({ error: "Tagihan untuk periode ini sudah ada" })
    throw e
  }
})

router.post("/batch", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = batchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const where: string[] = ["school_id = ?", "status = 'aktif'"]
  const params: unknown[] = [schoolId]
  if (d.classId) { where.push("class_id = ?"); params.push(d.classId) }

  const [students] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM students WHERE ${where.join(" AND ")}`,
    params,
  )
  let created = 0
  for (const s of students) {
    try {
      await pool.query(
        `INSERT INTO spp_invoices (school_id, student_id, period, amount, due_date, status)
         VALUES (?,?,?,?,?,'belum')`,
        [schoolId, s.id, d.period, d.amount, d.dueDate],
      )
      created++
    } catch (e) {
      const msg = (e as Error).message
      if (!msg.includes("Duplicate")) throw e
    }
  }
  res.json({ ok: true, created, total: students.length })
})

router.put("/:id/pay", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = paySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT amount FROM spp_invoices WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  if (rows.length === 0) return res.status(404).json({ error: "Invoice not found" })
  const amount = Number(rows[0].amount)
  const status = d.paidAmount >= amount ? "lunas" : d.paidAmount > 0 ? "sebagian" : "belum"
  await pool.query(
    `UPDATE spp_invoices SET paid_amount = ?, paid_at = ?, method = ?, status = ?
     WHERE id = ? AND school_id = ?`,
    [d.paidAmount, d.paidAmount > 0 ? new Date() : null, d.method ?? null, status, id, schoolId],
  )
  res.json({ ok: true, status })
})

router.delete("/:id", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(
    `DELETE FROM spp_invoices WHERE id = ? AND school_id = ?`,
    [id, schoolId],
  )
  res.json({ ok: true })
})

export default router
