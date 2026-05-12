import { Router } from "express"
import type { RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireRole } from "../auth.js"
import { getLinkedStudentIds, getTeacherProfileUserId } from "../access.js"

const router = Router()

router.use(requireRole("teacher", "guru", "parent", "student"))

router.get("/teacher", requireRole("teacher", "guru"), async (req, res) => {
  const schoolId = req.user!.schoolId
  const userId = await getTeacherProfileUserId(req.user!)
  const today = new Date().getDay() || 7

  const [schedule] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.day_of_week, s.start_time, s.end_time, COALESCE(subj.name, s.subject) AS subject,
            c.name AS class_name
     FROM schedules s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN subjects subj ON subj.id = s.subject_id
     WHERE s.school_id = ? AND s.teacher_id = ? AND s.day_of_week = ?
     ORDER BY s.start_time ASC
     LIMIT 8`,
    [schoolId, userId, today],
  )
  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT c.id, c.name, COUNT(st.id) AS student_count
     FROM classes c
     LEFT JOIN schedules s ON s.class_id = c.id AND s.teacher_id = ?
     LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.teacher_id = ?
     LEFT JOIN students st ON st.class_id = c.id AND st.status = 'aktif'
     WHERE c.school_id = ? AND (s.id IS NOT NULL OR cs.id IS NOT NULL)
     GROUP BY c.id, c.name
     ORDER BY c.name ASC
     LIMIT 8`,
    [userId, userId, schoolId],
  )
  const [tasks] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.title, t.due_date, t.status, c.name AS class_name, subj.name AS subject_name
     FROM tasks t
     LEFT JOIN classes c ON c.id = t.class_id
     LEFT JOIN subjects subj ON subj.id = t.subject_id
     WHERE t.school_id = ? AND t.teacher_id = ?
     ORDER BY COALESCE(t.due_date, DATE('2999-12-31')) ASC, t.created_at DESC
     LIMIT 8`,
    [schoolId, userId],
  )
  const [announcements] = await latestAnnouncements(schoolId)
  res.json({ schedule, classes, tasks, announcements })
})

router.get("/parent", requireRole("parent"), async (req, res) => {
  const schoolId = req.user!.schoolId
  const childIds = await getLinkedStudentIds(req.user!)
  const children = childIds.length
    ? (await pool.query<RowDataPacket[]>(
        `SELECT st.id, st.name, st.nis, st.status, c.name AS class_name
         FROM students st
         LEFT JOIN classes c ON c.id = st.class_id
         WHERE st.school_id = ? AND st.id IN (?)
         ORDER BY st.name ASC`,
        [schoolId, childIds],
      ))[0]
    : []
  const invoices = childIds.length
    ? (await pool.query<RowDataPacket[]>(
        `SELECT fi.id, fi.student_id, st.name AS student_name, fi.invoice_no, fi.period, fi.due_date,
                fi.total_amount, fi.paid_amount, fi.status
         FROM finance_invoices fi
         JOIN students st ON st.id = fi.student_id
         WHERE fi.school_id = ? AND fi.student_id IN (?)
         ORDER BY fi.due_date DESC
         LIMIT 8`,
        [schoolId, childIds],
      ))[0]
    : []
  const reports = childIds.length
    ? (await pool.query<RowDataPacket[]>(
        `SELECT id, student_id, semester_label, status, published_at
         FROM report_cards
         WHERE school_id = ? AND student_id IN (?)
         ORDER BY updated_at DESC
         LIMIT 8`,
        [schoolId, childIds],
      ))[0]
    : []
  const [announcements] = await latestAnnouncements(schoolId)
  res.json({ children, invoices, reports, announcements })
})

router.get("/student", requireRole("student"), async (req, res) => {
  const schoolId = req.user!.schoolId
  const [studentId] = await getLinkedStudentIds(req.user!)
  if (!studentId) {
    const [announcements] = await latestAnnouncements(schoolId)
    return res.json({ student: null, schedule: [], tasks: [], grades: [], announcements })
  }

  const [students] = await pool.query<RowDataPacket[]>(
    `SELECT st.id, st.name, st.nis, st.status, st.class_id, c.name AS class_name
     FROM students st LEFT JOIN classes c ON c.id = st.class_id
     WHERE st.school_id = ? AND st.id = ? LIMIT 1`,
    [schoolId, studentId],
  )
  const student = students[0] || null
  const classId = student?.class_id
  const schedule = classId
    ? (await pool.query<RowDataPacket[]>(
        `SELECT s.id, s.day_of_week, s.start_time, s.end_time, COALESCE(subj.name, s.subject) AS subject, u.name AS teacher_name
         FROM schedules s
         LEFT JOIN subjects subj ON subj.id = s.subject_id
         LEFT JOIN users u ON u.id = s.teacher_id
         WHERE s.school_id = ? AND s.class_id = ?
         ORDER BY s.day_of_week ASC, s.start_time ASC`,
        [schoolId, classId],
      ))[0]
    : []
  const tasks = classId
    ? (await pool.query<RowDataPacket[]>(
        `SELECT t.id, t.title, t.due_date, t.status, subj.name AS subject_name
         FROM tasks t LEFT JOIN subjects subj ON subj.id = t.subject_id
         WHERE t.school_id = ? AND t.class_id = ? AND t.status = 'published'
         ORDER BY COALESCE(t.due_date, DATE('2999-12-31')) ASC, t.created_at DESC
         LIMIT 12`,
        [schoolId, classId],
      ))[0]
    : []
  const [grades] = await pool.query<RowDataPacket[]>(
    `SELECT ge.id, ge.semester_label, ge.score, ge.note, ge.assessed_at, subj.name AS subject_name, at.name AS assessment_type
     FROM grade_entries ge
     LEFT JOIN subjects subj ON subj.id = ge.subject_id
     LEFT JOIN assessment_types at ON at.id = ge.assessment_type_id
     WHERE ge.school_id = ? AND ge.student_id = ?
     ORDER BY ge.assessed_at DESC, ge.created_at DESC
     LIMIT 12`,
    [schoolId, studentId],
  )
  const [announcements] = await latestAnnouncements(schoolId)
  res.json({ student, schedule, tasks, grades, announcements })
})

function latestAnnouncements(schoolId: number) {
  return pool.query<RowDataPacket[]>(
    `SELECT id, title, body, target_class_id, created_at
     FROM announcements
     WHERE school_id = ?
     ORDER BY created_at DESC
     LIMIT 5`,
    [schoolId],
  )
}

export default router
