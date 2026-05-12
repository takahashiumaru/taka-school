import { Router, type Request } from "express"
import { z } from "zod"
import { pool } from "../db"
import { requireOffice, requireSchoolRead } from "../auth"

const router = Router()
router.use(requireSchoolRead())
const str = z.string().max(200).nullable().optional()

async function list(table: string, schoolId: number) {
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE school_id=? ORDER BY id DESC LIMIT 200`, [schoolId])
  return rows
}

router.get("/summary", async (req: Request, res) => {
  const schoolId = req.user!.schoolId
  const [[books]]: any = await pool.query("SELECT COUNT(*) count, COALESCE(SUM(stock),0) stock FROM library_books WHERE school_id=?", [schoolId])
  const [[inventory]]: any = await pool.query("SELECT COUNT(*) count, COALESCE(SUM(quantity),0) quantity FROM inventory_items WHERE school_id=?", [schoolId])
  const [[extracurriculars]]: any = await pool.query("SELECT COUNT(*) count FROM extracurriculars WHERE school_id=?", [schoolId])
  const [[counseling]]: any = await pool.query("SELECT COUNT(*) count FROM counseling_records WHERE school_id=?", [schoolId])
  const [[letters]]: any = await pool.query("SELECT COUNT(*) count FROM school_letters WHERE school_id=?", [schoolId])
  res.json({ books, inventory, extracurriculars, counseling, letters })
})

router.get("/library-books", async (req: Request, res) => res.json({ items: await list("library_books", req.user!.schoolId) }))
router.post("/library-books", requireOffice(), async (req: Request, res) => {
  const d = z.object({ title: z.string().min(1).max(180), author: str, category: str, stock: z.number().int().min(0).optional() }).parse(req.body)
  const stock = d.stock ?? 1
  const [r]: any = await pool.query("INSERT INTO library_books (school_id,title,author,category,stock,available_stock) VALUES (?,?,?,?,?,?)", [req.user!.schoolId,d.title,d.author??null,d.category??null,stock,stock])
  res.status(201).json({ id: r.insertId })
})
router.put("/library-books/:id", requireOffice(), async (req: Request, res) => {
  const d = z.object({ title: z.string().min(1).max(180), author: str, category: str, stock: z.number().int().min(0).optional(), availableStock: z.number().int().min(0).optional() }).parse(req.body)
  const availableStock = d.availableStock ?? d.stock ?? 1
  await pool.query("UPDATE library_books SET title=?,author=?,category=?,stock=?,available_stock=? WHERE id=? AND school_id=?", [d.title,d.author??null,d.category??null,d.stock??1,availableStock,req.params.id,req.user!.schoolId])
  res.json({ ok: true })
})
router.delete("/library-books/:id", requireOffice(), async (req: Request, res) => {
  await pool.query("DELETE FROM library_books WHERE id=? AND school_id=?", [req.params.id, req.user!.schoolId])
  res.json({ ok: true })
})

router.get("/inventory", async (req: Request, res) => res.json({ items: await list("inventory_items", req.user!.schoolId) }))
router.post("/inventory", requireOffice(), async (req: Request, res) => {
  const d = z.object({ name: z.string().min(1).max(160), category: str, location: str, quantity: z.number().int().min(0).optional(), conditionStatus: z.enum(["good","damaged","lost","maintenance"]).optional() }).parse(req.body)
  const [r]: any = await pool.query("INSERT INTO inventory_items (school_id,name,category,location,quantity,condition_status) VALUES (?,?,?,?,?,?)", [req.user!.schoolId,d.name,d.category??null,d.location??null,d.quantity??1,d.conditionStatus??'good'])
  res.status(201).json({ id: r.insertId })
})
router.put("/inventory/:id", requireOffice(), async (req: Request, res) => {
  const d = z.object({ name: z.string().min(1).max(160), category: str, location: str, quantity: z.number().int().min(0).optional(), conditionStatus: z.enum(["good","damaged","lost","maintenance"]).optional() }).parse(req.body)
  await pool.query("UPDATE inventory_items SET name=?,category=?,location=?,quantity=?,condition_status=? WHERE id=? AND school_id=?", [d.name,d.category??null,d.location??null,d.quantity??1,d.conditionStatus??'good',req.params.id,req.user!.schoolId])
  res.json({ ok: true })
})
router.delete("/inventory/:id", requireOffice(), async (req: Request, res) => {
  await pool.query("DELETE FROM inventory_items WHERE id=? AND school_id=?", [req.params.id, req.user!.schoolId])
  res.json({ ok: true })
})

router.get("/extracurriculars", async (req: Request, res) => res.json({ items: await list("extracurriculars", req.user!.schoolId) }))
router.post("/extracurriculars", requireOffice(), async (req: Request, res) => {
  const d = z.object({ name: z.string().min(1).max(120), coachUserId: z.number().int().nullable().optional(), scheduleNote: str }).parse(req.body)
  const [r]: any = await pool.query("INSERT INTO extracurriculars (school_id,name,coach_user_id,schedule_note) VALUES (?,?,?,?)", [req.user!.schoolId,d.name,d.coachUserId??null,d.scheduleNote??null])
  res.status(201).json({ id: r.insertId })
})
router.put("/extracurriculars/:id", requireOffice(), async (req: Request, res) => {
  const d = z.object({ name: z.string().min(1).max(120), coachUserId: z.number().int().nullable().optional(), scheduleNote: str }).parse(req.body)
  await pool.query("UPDATE extracurriculars SET name=?,coach_user_id=?,schedule_note=? WHERE id=? AND school_id=?", [d.name,d.coachUserId??null,d.scheduleNote??null,req.params.id,req.user!.schoolId])
  res.json({ ok: true })
})
router.delete("/extracurriculars/:id", requireOffice(), async (req: Request, res) => {
  await pool.query("DELETE FROM extracurriculars WHERE id=? AND school_id=?", [req.params.id, req.user!.schoolId])
  res.json({ ok: true })
})

router.get("/counseling", async (req: Request, res) => res.json({ items: await list("counseling_records", req.user!.schoolId) }))
router.post("/counseling", requireOffice(), async (req: Request, res) => {
  const d = z.object({ studentId: z.number().int().nullable().optional(), category: str, title: z.string().min(1).max(160), notes: z.string().nullable().optional(), followUp: z.string().nullable().optional(), recordDate: str }).parse(req.body)
  const [r]: any = await pool.query("INSERT INTO counseling_records (school_id,student_id,category,title,notes,follow_up,record_date) VALUES (?,?,?,?,?,?,?)", [req.user!.schoolId,d.studentId??null,d.category??null,d.title,d.notes??null,d.followUp??null,d.recordDate??null])
  res.status(201).json({ id: r.insertId })
})
router.put("/counseling/:id", requireOffice(), async (req: Request, res) => {
  const d = z.object({ studentId: z.number().int().nullable().optional(), category: str, title: z.string().min(1).max(160), notes: z.string().nullable().optional(), followUp: z.string().nullable().optional(), recordDate: str }).parse(req.body)
  await pool.query("UPDATE counseling_records SET student_id=?,category=?,title=?,notes=?,follow_up=?,record_date=? WHERE id=? AND school_id=?", [d.studentId??null,d.category??null,d.title,d.notes??null,d.followUp??null,d.recordDate??null,req.params.id,req.user!.schoolId])
  res.json({ ok: true })
})
router.delete("/counseling/:id", requireOffice(), async (req: Request, res) => {
  await pool.query("DELETE FROM counseling_records WHERE id=? AND school_id=?", [req.params.id, req.user!.schoolId])
  res.json({ ok: true })
})

router.get("/letters", async (req: Request, res) => res.json({ items: await list("school_letters", req.user!.schoolId) }))
router.post("/letters", requireOffice(), async (req: Request, res) => {
  const d = z.object({ letterNo: str, type: z.string().min(1).max(80), subject: z.string().min(1).max(180), recipient: str, status: z.enum(["draft","issued","archived"]).optional() }).parse(req.body)
  const [r]: any = await pool.query("INSERT INTO school_letters (school_id,letter_no,type,subject,recipient,status) VALUES (?,?,?,?,?,?)", [req.user!.schoolId,d.letterNo??null,d.type,d.subject,d.recipient??null,d.status??'draft'])
  res.status(201).json({ id: r.insertId })
})
router.put("/letters/:id", requireOffice(), async (req: Request, res) => {
  const d = z.object({ letterNo: str, type: z.string().min(1).max(80), subject: z.string().min(1).max(180), recipient: str, status: z.enum(["draft","issued","archived"]).optional() }).parse(req.body)
  await pool.query("UPDATE school_letters SET letter_no=?,type=?,subject=?,recipient=?,status=? WHERE id=? AND school_id=?", [d.letterNo??null,d.type,d.subject,d.recipient??null,d.status??'draft',req.params.id,req.user!.schoolId])
  res.json({ ok: true })
})
router.delete("/letters/:id", requireOffice(), async (req: Request, res) => {
  await pool.query("DELETE FROM school_letters WHERE id=? AND school_id=?", [req.params.id, req.user!.schoolId])
  res.json({ ok: true })
})

export default router
