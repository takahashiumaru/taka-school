import { Router } from "express"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireAuth, signToken } from "../auth.js"
import { rateLimit } from "../rateLimit.js"

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchoolSchema = z.object({
  schoolName: z.string().min(2),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
})

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "sekolah"
}

router.post("/login", rateLimit({ keyPrefix: "auth-login", limit: 5, windowMs: 5 * 60_000 }), async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: "Email / password tidak valid" })
  const { email, password } = parsed.data

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT u.id, u.school_id, u.name, u.email, u.password_hash, u.role, u.is_active, s.name AS school_name FROM users u JOIN schools s ON s.id = u.school_id WHERE u.email = ? LIMIT 1",
    [email],
  )
  const u = rows[0]
  if (!u || !u.is_active) return res.status(401).json({ error: "Email atau password salah" })

  const ok = await bcrypt.compare(password, u.password_hash)
  if (!ok) return res.status(401).json({ error: "Email atau password salah" })

  const token = signToken({
    id: u.id,
    schoolId: u.school_id,
    role: u.role,
    name: u.name,
    email: u.email,
  })

  // Set HttpOnly cookie for security
  res.cookie("takaschool_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  res.json({
    token, // Keep for backward compatibility during migration
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      schoolId: u.school_id,
      schoolName: u.school_name,
    },
  })
})

router.post("/register-school", rateLimit({ keyPrefix: "auth-register-school", limit: 3, windowMs: 10 * 60_000 }), async (req, res) => {
  const parsed = registerSchoolSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Input tidak valid", issues: parsed.error.issues })
  }
  const { schoolName, adminName, email, password, phone } = parsed.data

  const [exist] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  )
  if (exist.length > 0) return res.status(409).json({ error: "Email sudah terdaftar" })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const slugBase = slugify(schoolName)
    let slug = slugBase
    for (let i = 1; i < 50; i++) {
      const [s] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM schools WHERE slug = ?",
        [slug],
      )
      if (s.length === 0) break
      slug = `${slugBase}-${i}`
    }
    const [schoolRes] = await conn.query<ResultSetHeader>(
      "INSERT INTO schools (name, slug, phone) VALUES (?, ?, ?)",
      [schoolName, slug, phone || null],
    )
    const schoolId = schoolRes.insertId

    const hash = await bcrypt.hash(password, 10)
    const [userRes] = await conn.query<ResultSetHeader>(
      "INSERT INTO users (school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
      [schoolId, adminName, email, hash],
    )
    await conn.commit()

    const token = signToken({
      id: userRes.insertId,
      schoolId,
      role: "admin",
      name: adminName,
      email,
    })

    // Set HttpOnly cookie for security
    res.cookie("takaschool_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.status(201).json({
      token, // Keep for backward compatibility during migration
      user: {
        id: userRes.insertId,
        name: adminName,
        email,
        role: "admin",
        schoolId,
        schoolName,
      },
    })
  } catch (e) {
    await conn.rollback()
    console.error(e)
    res.status(500).json({ error: "Gagal mendaftar sekolah" })
  } finally {
    conn.release()
  }
})

router.get("/me", requireAuth(), async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT u.id, u.name, u.email, u.role, u.school_id, s.name AS school_name FROM users u JOIN schools s ON s.id = u.school_id WHERE u.id = ?",
    [req.user!.id],
  )
  const u = rows[0]
  if (!u) return res.status(404).json({ error: "User tidak ditemukan" })
  res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    schoolId: u.school_id,
    schoolName: u.school_name,
  })
})

router.post("/logout", (req, res) => {
  res.clearCookie("takaschool_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })
  res.json({ message: "Logged out successfully" })
})

export default router
