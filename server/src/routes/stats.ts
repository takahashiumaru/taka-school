import { Router } from "express"
import type { RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

function num(value: unknown) {
  return Number(value ?? 0)
}

router.get("/dashboard", requireAuth(), async (req, res) => {
  const schoolId = req.user!.schoolId
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const period = today.slice(0, 7)
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()

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
      COUNT(*) AS total,
      COALESCE(SUM(amount), 0) AS nominal,
      COALESCE(SUM(paid_amount), 0) AS terbayar
     FROM spp_invoices WHERE school_id = ? AND period = ?`,
    [schoolId, period],
  )
  const [attendanceTrendRows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date,
      SUM(status='hadir') AS hadir,
      SUM(status='izin') AS izin,
      SUM(status='sakit') AS sakit,
      SUM(status='alpa') AS alpa,
      COUNT(*) AS total
     FROM attendance
     WHERE school_id = ? AND date >= DATE_SUB(?, INTERVAL 6 DAY) AND date <= ?
     GROUP BY date
     ORDER BY date ASC`,
    [schoolId, today, today],
  )
  const [classAttentionRows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.name,
      COUNT(DISTINCT s.id) AS students,
      SUM(a.status='hadir') AS hadir,
      SUM(a.status IN ('izin','sakit','alpa')) AS bermasalah,
      SUM(a.status='alpa') AS alpa,
      SUM(si.status IN ('belum','sebagian','lewat')) AS spp_belum
     FROM classes c
     LEFT JOIN students s ON s.class_id = c.id AND s.status = 'aktif'
     LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
     LEFT JOIN spp_invoices si ON si.student_id = s.id AND si.period = ?
     WHERE c.school_id = ?
     GROUP BY c.id, c.name
     ORDER BY (SUM(a.status='alpa') + SUM(si.status IN ('belum','sebagian','lewat'))) DESC, c.name ASC
     LIMIT 6`,
    [today, period, schoolId],
  )
  const [scheduleRows] = await pool.query<RowDataPacket[]>(
    `SELECT sc.id, sc.start_time, sc.end_time, sc.subject, c.name AS class_name, u.name AS teacher_name
     FROM schedules sc
     JOIN classes c ON c.id = sc.class_id
     LEFT JOIN users u ON u.id = sc.teacher_id
     WHERE sc.school_id = ? AND sc.day_of_week = ?
     ORDER BY sc.start_time ASC
     LIMIT 6`,
    [schoolId, dayOfWeek],
  )

  const attendanceTrend = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const found = attendanceTrendRows.find((row) => row.date === key)
    const total = num(found?.total)
    const hadir = num(found?.hadir)
    attendanceTrend.push({
      date: key,
      label: d.toLocaleDateString("id-ID", { weekday: "short" }),
      hadir,
      izin: num(found?.izin),
      sakit: num(found?.sakit),
      alpa: num(found?.alpa),
      total,
      rate: total > 0 ? Math.round((hadir / total) * 100) : 0,
    })
  }

  const sppTotal = num(sppRows[0]?.total)
  const sppLunas = num(sppRows[0]?.lunas)
  const attTotal = num(attRows[0]?.total)
  const attHadir = num(attRows[0]?.hadir)
  const todayAttendanceRate = attTotal > 0 ? Math.round((attHadir / attTotal) * 100) : 0
  const sppCompletionRate = sppTotal > 0 ? Math.round((sppLunas / sppTotal) * 100) : 0

  res.json({
    students: num(studentRows[0]?.total),
    teachers: num(teacherRows[0]?.total),
    classes: num(classRows[0]?.total),
    attendanceToday: {
      hadir: attHadir,
      izin: num(attRows[0]?.izin),
      sakit: num(attRows[0]?.sakit),
      alpa: num(attRows[0]?.alpa),
      total: attTotal,
      rate: todayAttendanceRate,
    },
    sppThisMonth: {
      lunas: sppLunas,
      belum: num(sppRows[0]?.belum),
      total: sppTotal,
      period,
      nominal: num(sppRows[0]?.nominal),
      terbayar: num(sppRows[0]?.terbayar),
      rate: sppCompletionRate,
    },
    attendanceTrend,
    classAttention: classAttentionRows.map((row) => {
      const total = num(row.students)
      const hadir = num(row.hadir)
      const alpa = num(row.alpa)
      const sppBelum = num(row.spp_belum)
      const score = alpa * 2 + sppBelum + num(row.bermasalah)
      return {
        id: num(row.id),
        name: String(row.name ?? "Kelas"),
        students: total,
        hadir,
        alpa,
        sppBelum,
        attendanceRate: total > 0 ? Math.round((hadir / total) * 100) : 0,
        status: score >= 5 ? "perlu_perhatian" : score > 0 ? "pantau" : "aman",
      }
    }),
    todayAgenda: scheduleRows.map((row) => ({
      id: num(row.id),
      time: `${String(row.start_time).slice(0, 5)}-${String(row.end_time).slice(0, 5)}`,
      subject: row.subject,
      className: row.class_name,
      teacherName: row.teacher_name,
    })),
    insights: {
      todayAttendanceRate,
      sppCompletionRate,
      unpaidSpp: num(sppRows[0]?.belum),
      absentToday: num(attRows[0]?.alpa),
    },
  })
})

export default router
