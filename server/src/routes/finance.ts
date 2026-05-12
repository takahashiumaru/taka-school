import { Router } from "express"
import { z } from "zod"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { requireOffice, requireSchoolRead } from "../auth.js"

const router = Router()
router.use(requireSchoolRead())

const itemSchema = z.object({ feeTypeId: z.number().int().positive().nullable().optional(), description: z.string().min(1).max(180), quantity: z.number().positive().default(1), unitAmount: z.number().nonnegative(), discountAmount: z.number().nonnegative().default(0) })
const invoiceSchema = z.object({ studentId: z.number().int().positive(), period: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), discountAmount: z.number().nonnegative().default(0), lateFeeAmount: z.number().nonnegative().default(0), note: z.string().max(255).nullable().optional(), items: z.array(itemSchema).min(1) })
const paymentSchema = z.object({ amount: z.number().positive(), paymentMethodId: z.number().int().positive().nullable().optional(), paidAt: z.string().optional(), referenceNo: z.string().max(100).nullable().optional(), note: z.string().max(255).nullable().optional() })
const sppGenSchema = z.object({ classId: z.number().int().positive().nullable().optional(), period: z.string().regex(/^\d{4}-\d{2}$/), amount: z.number().nonnegative(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })

function status(total: number, paid: number, dueDate: string) {
  if (paid >= total && total > 0) return "paid"
  if (paid > 0) return "partial"
  return new Date(dueDate) < new Date(new Date().toISOString().slice(0, 10)) ? "overdue" : "unpaid"
}
async function recalc(invoiceId: number, schoolId: number) {
  const [r] = await pool.query<RowDataPacket[]>(`SELECT total_amount, due_date FROM finance_invoices WHERE id=? AND school_id=?`, [invoiceId, schoolId])
  const [p] = await pool.query<RowDataPacket[]>(`SELECT COALESCE(SUM(amount),0) paid FROM finance_payments WHERE invoice_id=? AND school_id=?`, [invoiceId, schoolId])
  const paid = Number(p[0]?.paid || 0), total = Number(r[0]?.total_amount || 0)
  const s = status(total, paid, String(r[0]?.due_date).slice(0, 10))
  await pool.query(`UPDATE finance_invoices SET paid_amount=?, status=? WHERE id=? AND school_id=?`, [paid, s, invoiceId, schoolId])
  return s
}

router.get("/meta", async (req, res) => {
  const schoolId = req.user!.schoolId
  await pool.query(`INSERT IGNORE INTO fee_types (school_id,code,name,category,is_recurring,default_amount) VALUES ?`, [[
    [schoolId,"SPP","SPP Bulanan","spp",1,0],[schoolId,"REG","Uang Pendaftaran","registration",0,0],[schoolId,"UNIFORM","Seragam","uniform",0,0],[schoolId,"BOOK","Buku","book",0,0],[schoolId,"EXAM","Ujian","exam",0,0],[schoolId,"ACTIVITY","Kegiatan","activity",0,0],[schoolId,"CATERING","Katering","catering",1,0],[schoolId,"TRANSPORT","Transport","transport",1,0]
  ]])
  await pool.query(`INSERT IGNORE INTO payment_methods (school_id,code,name) VALUES ?`, [[[schoolId,"cash","Tunai"],[schoolId,"transfer","Transfer Bank"],[schoolId,"qris","QRIS"],[schoolId,"lain","Lainnya"]]])
  const [feeTypes] = await pool.query<RowDataPacket[]>(`SELECT * FROM fee_types WHERE school_id=? ORDER BY name`, [schoolId])
  const [paymentMethods] = await pool.query<RowDataPacket[]>(`SELECT * FROM payment_methods WHERE school_id=? ORDER BY name`, [schoolId])
  res.json({ feeTypes, paymentMethods })
})

router.get("/summary", async (req, res) => {
  const schoolId = req.user!.schoolId
  await pool.query(`UPDATE finance_invoices SET status='overdue' WHERE school_id=? AND status='unpaid' AND due_date < CURDATE()`, [schoolId])
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) invoices, COALESCE(SUM(total_amount),0) billed, COALESCE(SUM(paid_amount),0) paid, COALESCE(SUM(total_amount-paid_amount),0) outstanding, SUM(status='overdue') overdue_count FROM finance_invoices WHERE school_id=? AND status <> 'cancelled'`, [schoolId])
  res.json(rows[0])
})

router.get("/invoices", async (req, res) => {
  const schoolId = req.user!.schoolId
  const where = ["i.school_id=?"], params: unknown[] = [schoolId]
  if (req.query.status) { where.push("i.status=?"); params.push(req.query.status) }
  if (req.query.period) { where.push("i.period=?"); params.push(req.query.period) }
  if (req.query.classId) { where.push("s.class_id=?"); params.push(Number(req.query.classId)) }
  const [items] = await pool.query<RowDataPacket[]>(`SELECT i.*, s.name student_name, s.parent_name, s.parent_wa, c.name class_name FROM finance_invoices i JOIN students s ON s.id=i.student_id LEFT JOIN classes c ON c.id=s.class_id WHERE ${where.join(" AND ")} ORDER BY i.due_date DESC, i.id DESC LIMIT 1000`, params)
  res.json({ items })
})

router.get("/invoices/:id", async (req, res) => {
  const schoolId = req.user!.schoolId, id = Number(req.params.id)
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT i.*, s.name student_name, s.parent_name, s.parent_wa, c.name class_name FROM finance_invoices i JOIN students s ON s.id=i.student_id LEFT JOIN classes c ON c.id=s.class_id WHERE i.id=? AND i.school_id=?`, [id, schoolId])
  if (!rows.length) return res.status(404).json({ error: "Invoice not found" })
  const [items] = await pool.query<RowDataPacket[]>(`SELECT ii.*, ft.name fee_type_name FROM finance_invoice_items ii LEFT JOIN fee_types ft ON ft.id=ii.fee_type_id WHERE ii.invoice_id=?`, [id])
  const [payments] = await pool.query<RowDataPacket[]>(`SELECT p.*, pm.name payment_method_name FROM finance_payments p LEFT JOIN payment_methods pm ON pm.id=p.payment_method_id WHERE p.invoice_id=? ORDER BY p.paid_at DESC`, [id])
  res.json({ invoice: rows[0], items, payments })
})

router.post("/invoices", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId, d = invoiceSchema.parse(req.body)
  const subtotal = d.items.reduce((a, it) => a + it.quantity * it.unitAmount - it.discountAmount, 0)
  const total = Math.max(0, subtotal - d.discountAmount + d.lateFeeAmount)
  const invoiceNo = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Date.now().toString().slice(-6)}`
  const [r] = await pool.query<ResultSetHeader>(`INSERT INTO finance_invoices (school_id,student_id,invoice_no,period,issue_date,due_date,subtotal,discount_amount,late_fee_amount,total_amount,status,note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [schoolId,d.studentId,invoiceNo,d.period ?? null,d.issueDate ?? new Date().toISOString().slice(0,10),d.dueDate,subtotal,d.discountAmount,d.lateFeeAmount,total,status(total,0,d.dueDate),d.note ?? null])
  for (const it of d.items) await pool.query(`INSERT INTO finance_invoice_items (school_id,invoice_id,fee_type_id,description,quantity,unit_amount,discount_amount,line_total) VALUES (?,?,?,?,?,?,?,?)`, [schoolId,r.insertId,it.feeTypeId ?? null,it.description,it.quantity,it.unitAmount,it.discountAmount,it.quantity*it.unitAmount-it.discountAmount])
  res.json({ id: r.insertId })
})

router.post("/invoices/:id/payments", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId, id = Number(req.params.id), d = paymentSchema.parse(req.body)
  await pool.query(`INSERT INTO finance_payments (school_id,invoice_id,payment_method_id,amount,paid_at,reference_no,note,created_by) VALUES (?,?,?,?,?,?,?,?)`, [schoolId,id,d.paymentMethodId ?? null,d.amount,d.paidAt ?? new Date(),d.referenceNo ?? null,d.note ?? null,req.user!.id])
  const s = await recalc(id, schoolId)
  res.json({ ok: true, status: s })
})

router.post("/generate-spp", requireOffice(), async (req, res) => {
  const schoolId = req.user!.schoolId, d = sppGenSchema.parse(req.body)
  const [ft] = await pool.query<RowDataPacket[]>(`SELECT id FROM fee_types WHERE school_id=? AND code='SPP'`, [schoolId])
  const feeTypeId = ft[0]?.id ?? null
  const where = ["school_id=?", "status='aktif'"], params: unknown[] = [schoolId]
  if (d.classId) { where.push("class_id=?"); params.push(d.classId) }
  const [students] = await pool.query<RowDataPacket[]>(`SELECT id FROM students WHERE ${where.join(" AND ")}`, params)
  let created = 0
  for (const s of students) {
    const [dup] = await pool.query<RowDataPacket[]>(`SELECT id FROM finance_invoices WHERE school_id=? AND student_id=? AND period=? AND spp_invoice_id IS NULL AND note='Generated SPP'`, [schoolId,s.id,d.period])
    if (dup.length) continue
    const invoiceNo = `SPP-${d.period.replace("-","")}-${s.id}-${Date.now().toString().slice(-5)}`
    const [r] = await pool.query<ResultSetHeader>(`INSERT INTO finance_invoices (school_id,student_id,invoice_no,period,issue_date,due_date,subtotal,total_amount,status,note) VALUES (?,?,?,?,CURDATE(),?,?,?,?,?)`, [schoolId,s.id,invoiceNo,d.period,d.dueDate,d.amount,d.amount,status(d.amount,0,d.dueDate),"Generated SPP"])
    await pool.query(`INSERT INTO finance_invoice_items (school_id,invoice_id,fee_type_id,description,unit_amount,line_total) VALUES (?,?,?,?,?,?)`, [schoolId,r.insertId,feeTypeId,`SPP ${d.period}`,d.amount,d.amount])
    created++
  }
  res.json({ ok: true, created, total: students.length })
})

export default router
