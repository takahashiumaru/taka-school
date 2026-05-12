import type { RowDataPacket } from "mysql2"
import { pool } from "./db.js"
import type { AuthUser } from "./auth.js"

export type LinkedStudent = RowDataPacket & {
  id: number
  name: string
  nis?: string | null
  class_id?: number | null
}

export async function getLinkedStudentIds(user: AuthUser): Promise<number[]> {
  if (user.role === "student") {
    const [direct] = await pool.query<RowDataPacket[]>(
      `SELECT student_id FROM user_student_links WHERE school_id = ? AND user_id = ? LIMIT 1`,
      [user.schoolId, user.id],
    )
    if (direct[0]?.student_id) return [Number(direct[0].student_id)]
  }

  if (user.role === "parent") {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT student_id FROM user_guardian_links WHERE school_id = ? AND user_id = ?`,
      [user.schoolId, user.id],
    )
    if (rows.length) return rows.map((r) => Number(r.student_id))

    const [fallback] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT g.student_id
       FROM guardians g
       WHERE g.school_id = ? AND LOWER(g.email) = LOWER(?)`,
      [user.schoolId, user.email],
    )
    return fallback.map((r) => Number(r.student_id))
  }

  return []
}

export async function getTeacherProfileUserId(user: AuthUser): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT teacher_user_id FROM user_teacher_links WHERE school_id = ? AND user_id = ? LIMIT 1`,
    [user.schoolId, user.id],
  )
  return Number(rows[0]?.teacher_user_id || user.id)
}

export async function canAccessStudent(user: AuthUser, studentId: number): Promise<boolean> {
  if (["admin", "staff", "headmaster", "teacher", "guru"].includes(user.role)) return true
  const ids = await getLinkedStudentIds(user)
  return ids.includes(studentId)
}
