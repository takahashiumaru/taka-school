import bcrypt from "bcryptjs"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"

async function findOrCreateSchool(name: string, slug: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM schools WHERE slug = ? LIMIT 1",
    [slug],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO schools (name, slug) VALUES (?, ?)",
    [name, slug],
  )
  return res.insertId
}

async function findOrCreateUser(
  schoolId: number,
  name: string,
  email: string,
  password: string,
  role: "admin" | "guru",
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  )
  if (rows.length > 0) return rows[0].id
  const hash = await bcrypt.hash(password, 10)
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [schoolId, name, email, hash, role],
  )
  return res.insertId
}

async function findOrCreateClass(
  schoolId: number,
  name: string,
  level: string,
  homeroomId: number | null,
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM classes WHERE school_id = ? AND name = ? LIMIT 1",
    [schoolId, name],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO classes (school_id, name, grade_level, homeroom_teacher_id) VALUES (?, ?, ?, ?)",
    [schoolId, name, level, homeroomId],
  )
  return res.insertId
}

async function ensureStudent(
  schoolId: number,
  classId: number,
  nis: string,
  name: string,
  gender: "L" | "P",
  parent: string,
  parentWa: string,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM students WHERE school_id = ? AND nis = ? LIMIT 1",
    [schoolId, nis],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO students (school_id, class_id, nis, name, gender, parent_name, parent_wa) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [schoolId, classId, nis, name, gender, parent, parentWa],
  )
  return res.insertId
}

export async function ensureDemoData() {
  const schoolId = await findOrCreateSchool("TK Tunas Bangsa (Demo)", "tk-tunas-bangsa-demo")
  const adminId = await findOrCreateUser(
    schoolId,
    "Admin Demo",
    "admin@demo.id",
    "admin123",
    "admin",
  )
  const guruId = await findOrCreateUser(
    schoolId,
    "Bu Anita",
    "guru@demo.id",
    "guru123",
    "guru",
  )

  const classA = await findOrCreateClass(schoolId, "Kelas A", "TK A", guruId)
  await findOrCreateClass(schoolId, "Kelas B", "TK B", null)

  const seedStudents: Array<[string, string, "L" | "P", string, string]> = [
    ["S001", "Aisha Putri", "P", "Ibu Sari", "628111111111"],
    ["S002", "Bima Saputra", "L", "Bapak Joko", "628111111112"],
    ["S003", "Chandra Wijaya", "L", "Ibu Wati", "628111111113"],
    ["S004", "Dinda Maharani", "P", "Bapak Andre", "628111111114"],
    ["S005", "Evan Pratama", "L", "Ibu Rani", "628111111115"],
  ]
  for (const [nis, n, g, p, w] of seedStudents) {
    await ensureStudent(schoolId, classA, nis, n, g, p, w)
  }

  console.log(`[seed] OK schoolId=${schoolId} adminId=${adminId} guruId=${guruId}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureDemoData()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
