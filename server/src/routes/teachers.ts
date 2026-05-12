import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAdmin, requireSchoolRead } from "../auth.js"
import { parsePagination, paginationMeta } from "../pagination.js"

const router = Router()

const teacherSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
})

router.use(requireSchoolRead())

router.get("/", async (req, res) => {
  const schoolId = req.user!.schoolId
  const { page, pageSize, limit, offset } = parsePagination(req.query)
  
  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM users WHERE school_id = ? AND role = 'guru'`,
    [schoolId]
  )

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, school_id, name, email, role, is_active, created_at
     FROM users WHERE school_id = ? AND role = 'guru'
     ORDER BY name ASC LIMIT ? OFFSET ?`,
    [schoolId, limit, offset],
  )

  res.json({
    items: rows,
    pagination: paginationMeta(Number(total), page, pageSize),
  })
})

router.post("/", requireAdmin(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const parsed = teacherSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  if (!d.password) return res.status(400).json({ error: "Password required" })
  const hash = await bcrypt.hash(d.password, 10)
  try {
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (school_id, name, email, password_hash, role, is_active) VALUES (?,?,?,?,'guru',1)`,
      [schoolId, d.name, d.email.toLowerCase(), hash],
    )
    res.json({ id: r.insertId })
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes("Duplicate")) return res.status(409).json({ error: "Email sudah dipakai" })
    throw e
  }
})

router.put("/:id", requireAdmin(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  const parsed = teacherSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Invalid", details: parsed.error.issues })
  const d = parsed.data
  const fields: string[] = []
  const params: unknown[] = []
  if (d.name !== undefined) { fields.push("name = ?"); params.push(d.name) }
  if (d.email !== undefined) { fields.push("email = ?"); params.push(d.email.toLowerCase()) }
  if (d.isActive !== undefined) { fields.push("is_active = ?"); params.push(d.isActive ? 1 : 0) }
  if (d.password) {
    const hash = await bcrypt.hash(d.password, 10)
    fields.push("password_hash = ?")
    params.push(hash)
  }
  if (fields.length === 0) return res.json({ ok: true })
  params.push(id, schoolId)
  await pool.query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ? AND school_id = ? AND role = 'guru'`,
    params,
  )
  res.json({ ok: true })
})

router.delete("/:id", requireAdmin(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const id = Number(req.params.id)
  await pool.query(
    `DELETE FROM users WHERE id = ? AND school_id = ? AND role = 'guru'`,
    [id, schoolId],
  )
  res.json({ ok: true })
})

export default router
