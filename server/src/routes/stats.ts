import { Router } from "express"
import type { RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

router.get("/dashboard", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const today = new Date().toISOString().slice(0, 10)
  const period = today.slice(0, 7)

  const [studentRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM students WHERE school_id = ? AND status = 'aktif'",
    [schoolId],
  )
  const [teacherRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM users WHERE school_id = ? AND role = 'guru' AND is_active = 1",
    [schoolId],
  )
  const [classRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM classes WHERE school_id = ?",
    [schoolId],
  )
  const [attRows] = await pool.query<RowDataPacket[]>(
    `SELECT
      SUM(status='hadir') AS hadir,
      SUM(status='izin') AS izin,
      SUM(status='sakit') AS sakit,
      SUM(status='alpa') AS alpa,
      COUNT(*) AS total
     FROM attendance WHERE school_id = ? AND date = ?`,
    [schoolId, today],
  )
  const [sppRows] = await pool.query<RowDataPacket[]>(
    `SELECT
      SUM(status='lunas') AS lunas,
      SUM(status IN ('belum','sebagian','lewat')) AS belum,
      COUNT(*) AS total
     FROM spp_invoices WHERE school_id = ? AND period = ?`,
    [schoolId, period],
  )

  res.json({
    students: Number(studentRows[0]?.total ?? 0),
    teachers: Number(teacherRows[0]?.total ?? 0),
    classes: Number(classRows[0]?.total ?? 0),
    attendanceToday: {
      hadir: Number(attRows[0]?.hadir ?? 0),
      izin: Number(attRows[0]?.izin ?? 0),
      sakit: Number(attRows[0]?.sakit ?? 0),
      alpa: Number(attRows[0]?.alpa ?? 0),
      total: Number(attRows[0]?.total ?? 0),
    },
    sppThisMonth: {
      lunas: Number(sppRows[0]?.lunas ?? 0),
      belum: Number(sppRows[0]?.belum ?? 0),
      total: Number(sppRows[0]?.total ?? 0),
      period,
    },
  })
})

export default router
