import { Router } from "express"
import bcrypt from "bcryptjs"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireOffice, requireSchoolRead, requireAdmin } from "../auth.js"

const router = Router()

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ""
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  return [headers.map(csvEscape).join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))].join("\r\n") + "\r\n"
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let cur = "", row: string[] = [], inQuotes = false
  const input = text.replace(/^\uFEFF/, "")
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === "," || ch === ";" || ch === "\t") { row.push(cur.trim()); cur = "" }
    else if (ch === "\n") { row.push(cur.trim()); rows.push(row); row = []; cur = "" }
    else if (ch !== "\r") cur += ch
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row) }
  const headers = (rows.shift() || []).map((h) => h.trim())
  return rows.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])))
}

function download(res: import("express").Response, name: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`)
  res.send("\uFEFF" + csv)
}

const maxCsvChars = 750_000
const bodyReader = (req: import("express").Request) => {
  const csv = String(req.body?.csv ?? req.body?.text ?? "")
  if (csv.length > maxCsvChars) throw new Error("CSV terlalu besar. Maksimal sekitar 750 KB per import.")
  return csv
}
const n = (v: string | undefined) => v ? Number(v) : null
const nullable = (v: string | undefined) => v?.trim() ? v.trim() : null

router.use(requireSchoolRead())

router.get("/templates/:kind", (req, res) => {
  const templates: Record<string, string[]> = {
    students: ["nis","nisn","name","nickname","gender","class_id","birth_place","birth_date","religion","parent_name","parent_wa","address","status"],
    teachers: ["name","email","password","is_active"],
    grades: ["student_id","subject_id","assessment_type_id","semester_label","score","note","assessed_at"],
    invoices: ["student_id","period","due_date","description","amount","note"],
  }
  const headers = templates[req.params.kind]
  if (!headers) return res.status(404).json({ error: "Template not found" })
  download(res, `${req.params.kind}-template.csv`, toCsv(headers, []))
})

router.get("/students/export", async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT s.id,s.nis,s.nisn,s.name,s.nickname,s.gender,s.class_id,c.name class_name,s.birth_place,s.birth_date,s.religion,s.parent_name,s.parent_wa,s.address,s.status FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.school_id=? ORDER BY s.name`, [req.user!.schoolId])
  download(res, "students.csv", toCsv(["id","nis","nisn","name","nickname","gender","class_id","class_name","birth_place","birth_date","religion","parent_name","parent_wa","address","status"], rows))
})
router.post("/students/import", requireOffice(), async (req, res) => {
  const records = parseCsv(bodyReader(req)); let created = 0, updated = 0, skipped = 0
  for (const r of records) {
    if (!r.name) { skipped++; continue }
    const params = [req.user!.schoolId,n(r.class_id),nullable(r.nis),nullable(r.nisn),nullable(r.nickname),r.name,nullable(r.gender),nullable(r.birth_place),nullable(r.birth_date),nullable(r.religion),nullable(r.parent_name),nullable(r.parent_wa),nullable(r.address),nullable(r.status) || "aktif"]
    if (r.id) { await pool.query(`UPDATE students SET class_id=?,nis=?,nisn=?,nickname=?,name=?,gender=?,birth_place=?,birth_date=?,religion=?,parent_name=?,parent_wa=?,address=?,status=? WHERE id=? AND school_id=?`, params.slice(1).concat([Number(r.id), req.user!.schoolId])); updated++ }
    else { await pool.query(`INSERT INTO students (school_id,class_id,nis,nisn,nickname,name,gender,birth_place,birth_date,religion,parent_name,parent_wa,address,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, params); created++ }
  }
  res.json({ ok: true, created, updated, skipped })
})

router.get("/teachers/export", async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT id,name,email,is_active,created_at FROM users WHERE school_id=? AND role='guru' ORDER BY name`, [req.user!.schoolId])
  download(res, "teachers.csv", toCsv(["id","name","email","is_active","created_at"], rows))
})
router.post("/teachers/import", requireAdmin(), async (req, res) => {
  const records = parseCsv(bodyReader(req)); let created = 0, updated = 0, skipped = 0
  for (const r of records) {
    if (!r.name || !r.email) { skipped++; continue }
    if (r.id) { await pool.query(`UPDATE users SET name=?,email=?,is_active=? WHERE id=? AND school_id=? AND role='guru'`, [r.name, r.email.toLowerCase(), r.is_active === "0" ? 0 : 1, Number(r.id), req.user!.schoolId]); updated++ }
    else {
      if (!r.password || r.password.length < 8) { skipped++; continue }
      const hash = await bcrypt.hash(r.password, 10)
      await pool.query(`INSERT INTO users (school_id,name,email,password_hash,role,is_active) VALUES (?,?,?,?, 'guru', ?)`, [req.user!.schoolId, r.name, r.email.toLowerCase(), hash, r.is_active === "0" ? 0 : 1])
      created++
    }
  }
  res.json({ ok: true, created, updated, skipped })
})

router.get("/grades/export", async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT g.id,g.student_id,s.name student_name,g.subject_id,sub.name subject_name,g.assessment_type_id,at.name assessment_type_name,g.semester_label,g.score,g.note,g.assessed_at FROM grade_entries g JOIN students s ON s.id=g.student_id LEFT JOIN subjects sub ON sub.id=g.subject_id LEFT JOIN assessment_types at ON at.id=g.assessment_type_id WHERE g.school_id=? ORDER BY g.created_at DESC`, [req.user!.schoolId])
  download(res, "grades.csv", toCsv(["id","student_id","student_name","subject_id","subject_name","assessment_type_id","assessment_type_name","semester_label","score","note","assessed_at"], rows))
})
router.post("/grades/import", requireOffice(), async (req, res) => {
  const records = parseCsv(bodyReader(req)); let created = 0, skipped = 0
  for (const r of records) {
    if (!r.student_id || !r.score) { skipped++; continue }
    await pool.query<ResultSetHeader>(`INSERT INTO grade_entries (school_id,student_id,subject_id,assessment_type_id,semester_label,score,note,assessed_at,created_by) VALUES (?,?,?,?,?,?,?,?,?)`, [req.user!.schoolId, Number(r.student_id), n(r.subject_id), n(r.assessment_type_id), nullable(r.semester_label), Number(r.score), nullable(r.note), nullable(r.assessed_at), req.user!.id])
    created++
  }
  res.json({ ok: true, created, skipped })
})

router.get("/invoices/export", async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT i.id,i.invoice_no,i.student_id,s.name student_name,c.name class_name,i.period,i.due_date,i.total_amount,i.paid_amount,i.status,i.note FROM finance_invoices i JOIN students s ON s.id=i.student_id LEFT JOIN classes c ON c.id=s.class_id WHERE i.school_id=? ORDER BY i.due_date DESC`, [req.user!.schoolId])
  download(res, "finance-invoices.csv", toCsv(["id","invoice_no","student_id","student_name","class_name","period","due_date","total_amount","paid_amount","status","note"], rows))
})
router.post("/invoices/import", requireOffice(), async (req, res) => {
  const records = parseCsv(bodyReader(req)); let created = 0, skipped = 0
  for (const r of records) {
    if (!r.student_id || !r.due_date || !r.amount) { skipped++; continue }
    const amount = Number(r.amount), invoiceNo = `IMP-${Date.now()}-${created + 1}`
    const [ir] = await pool.query<ResultSetHeader>(`INSERT INTO finance_invoices (school_id,student_id,invoice_no,period,issue_date,due_date,subtotal,total_amount,status,note) VALUES (?,?,?,?,CURDATE(),?,?,?,?,?)`, [req.user!.schoolId, Number(r.student_id), invoiceNo, nullable(r.period), r.due_date, amount, amount, "unpaid", nullable(r.note)])
    await pool.query(`INSERT INTO finance_invoice_items (school_id,invoice_id,description,unit_amount,line_total) VALUES (?,?,?,?,?)`, [req.user!.schoolId, ir.insertId, r.description || "Tagihan impor", amount, amount])
    created++
  }
  res.json({ ok: true, created, skipped })
})

export default router
