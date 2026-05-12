import { Router } from "express"
import { z } from "zod"
import type { ResultSetHeader, RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()
router.use(requireAuth())

const idOpt = z.number().int().positive().nullable().optional()
const typeSchema = z.object({ name: z.string().min(1).max(80), weight: z.number().min(0).max(100).optional(), isActive: z.boolean().optional() })
const gradeSchema = z.object({ studentId: z.number().int().positive(), subjectId: idOpt, assessmentTypeId: idOpt, semesterId: idOpt, semesterLabel: z.string().max(60).nullable().optional(), score: z.number().min(0).max(100), note: z.string().max(255).nullable().optional(), assessedAt: z.string().max(10).nullable().optional() })
const aspectSchema = z.object({ name: z.string().min(1).max(120), description: z.string().max(255).nullable().optional(), sortOrder: z.number().int().optional(), isActive: z.boolean().optional() })
const indicatorSchema = z.object({ aspectId: z.number().int().positive(), description: z.string().min(1).max(255), sortOrder: z.number().int().optional(), isActive: z.boolean().optional() })
const obsSchema = z.object({ studentId: z.number().int().positive(), aspectId: idOpt, indicatorId: idOpt, semesterId: idOpt, semesterLabel: z.string().max(60).nullable().optional(), observation: z.string().min(1), level: z.enum(["BB", "MB", "BSH", "BSB"]).nullable().optional(), observedAt: z.string().max(10).nullable().optional() })
const cardSchema = z.object({ studentId: z.number().int().positive(), semesterId: idOpt, semesterLabel: z.string().min(1).max(60), status: z.enum(["draft", "published"]).optional(), summary: z.string().nullable().optional() })

router.get("/metadata", async (req, res) => {
  const schoolId = req.user!.schoolId
  const [types] = await pool.query<RowDataPacket[]>(`SELECT * FROM assessment_types WHERE school_id=? ORDER BY name`, [schoolId])
  const [aspects] = await pool.query<RowDataPacket[]>(`SELECT * FROM paud_development_aspects WHERE school_id=? ORDER BY sort_order,name`, [schoolId])
  const [indicators] = await pool.query<RowDataPacket[]>(`SELECT i.*, a.name aspect_name FROM paud_development_indicators i JOIN paud_development_aspects a ON a.id=i.aspect_id WHERE i.school_id=? ORDER BY a.sort_order,i.sort_order`, [schoolId])
  res.json({ assessmentTypes: types, paudAspects: aspects, paudIndicators: indicators })
})

router.get("/grades", async (req, res) => {
  const schoolId = req.user!.schoolId; const params: unknown[] = [schoolId]; const where = ["g.school_id=?"]
  if (req.query.studentId) { where.push("g.student_id=?"); params.push(Number(req.query.studentId)) }
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT g.*, s.name student_name, c.name class_name, sub.name subject_name, at.name assessment_type_name FROM grade_entries g JOIN students s ON s.id=g.student_id LEFT JOIN classes c ON c.id=s.class_id LEFT JOIN subjects sub ON sub.id=g.subject_id LEFT JOIN assessment_types at ON at.id=g.assessment_type_id WHERE ${where.join(" AND ")} ORDER BY COALESCE(g.assessed_at,g.created_at) DESC LIMIT 500`, params)
  res.json({ items: rows })
})
router.post("/types", async (req, res) => { const p=typeSchema.safeParse(req.body); if(!p.success)return res.status(400).json({error:"Invalid",details:p.error.issues}); const d=p.data; const [r]=await pool.query<ResultSetHeader>(`INSERT INTO assessment_types (school_id,name,weight,is_active) VALUES (?,?,?,?)`,[req.user!.schoolId,d.name,d.weight ?? 1,d.isActive===false?0:1]); res.json({id:r.insertId}) })
router.post("/grades", async (req, res) => { const p=gradeSchema.safeParse(req.body); if(!p.success)return res.status(400).json({error:"Invalid",details:p.error.issues}); const d=p.data; const [r]=await pool.query<ResultSetHeader>(`INSERT INTO grade_entries (school_id,student_id,subject_id,assessment_type_id,semester_id,semester_label,score,note,assessed_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,[req.user!.schoolId,d.studentId,d.subjectId??null,d.assessmentTypeId??null,d.semesterId??null,d.semesterLabel??null,d.score,d.note??null,d.assessedAt??null,req.user!.id]); res.json({id:r.insertId}) })
router.delete("/grades/:id", async (req, res) => { await pool.query(`DELETE FROM grade_entries WHERE id=? AND school_id=?`, [Number(req.params.id), req.user!.schoolId]); res.json({ok:true}) })

router.get("/paud/observations", async (req, res) => { const schoolId=req.user!.schoolId; const params: unknown[]=[schoolId]; const where=["o.school_id=?"]; if(req.query.studentId){where.push("o.student_id=?");params.push(Number(req.query.studentId))} const [rows]=await pool.query<RowDataPacket[]>(`SELECT o.*, s.name student_name, a.name aspect_name, i.description indicator_description FROM paud_observations o JOIN students s ON s.id=o.student_id LEFT JOIN paud_development_aspects a ON a.id=o.aspect_id LEFT JOIN paud_development_indicators i ON i.id=o.indicator_id WHERE ${where.join(" AND ")} ORDER BY COALESCE(o.observed_at,o.created_at) DESC LIMIT 500`,params); res.json({items:rows}) })
router.post("/paud/aspects", async (req,res)=>{const p=aspectSchema.safeParse(req.body); if(!p.success)return res.status(400).json({error:"Invalid",details:p.error.issues}); const d=p.data; const [r]=await pool.query<ResultSetHeader>(`INSERT INTO paud_development_aspects (school_id,name,description,sort_order,is_active) VALUES (?,?,?,?,?)`,[req.user!.schoolId,d.name,d.description??null,d.sortOrder??0,d.isActive===false?0:1]); res.json({id:r.insertId})})
router.post("/paud/indicators", async (req,res)=>{const p=indicatorSchema.safeParse(req.body); if(!p.success)return res.status(400).json({error:"Invalid",details:p.error.issues}); const d=p.data; const [r]=await pool.query<ResultSetHeader>(`INSERT INTO paud_development_indicators (school_id,aspect_id,description,sort_order,is_active) VALUES (?,?,?,?,?)`,[req.user!.schoolId,d.aspectId,d.description,d.sortOrder??0,d.isActive===false?0:1]); res.json({id:r.insertId})})
router.post("/paud/observations", async (req,res)=>{const p=obsSchema.safeParse(req.body); if(!p.success)return res.status(400).json({error:"Invalid",details:p.error.issues}); const d=p.data; const [r]=await pool.query<ResultSetHeader>(`INSERT INTO paud_observations (school_id,student_id,aspect_id,indicator_id,semester_id,semester_label,observation,level,observed_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,[req.user!.schoolId,d.studentId,d.aspectId??null,d.indicatorId??null,d.semesterId??null,d.semesterLabel??null,d.observation,d.level??null,d.observedAt??null,req.user!.id]); res.json({id:r.insertId})})
router.delete("/paud/observations/:id", async (req,res)=>{await pool.query(`DELETE FROM paud_observations WHERE id=? AND school_id=?`,[Number(req.params.id),req.user!.schoolId]); res.json({ok:true})})

router.get("/report-cards", async (req,res)=>{const schoolId=req.user!.schoolId; const [rows]=await pool.query<RowDataPacket[]>(`SELECT rc.*, s.name student_name, c.name class_name FROM report_cards rc JOIN students s ON s.id=rc.student_id LEFT JOIN classes c ON c.id=s.class_id WHERE rc.school_id=? ORDER BY rc.updated_at DESC LIMIT 300`,[schoolId]); res.json({items:rows})})
router.post("/report-cards", async (req,res)=>{const p=cardSchema.safeParse(req.body); if(!p.success)return res.status(400).json({error:"Invalid",details:p.error.issues}); const d=p.data; const [r]=await pool.query<ResultSetHeader>(`INSERT INTO report_cards (school_id,student_id,semester_id,semester_label,status,summary,created_by,published_at) VALUES (?,?,?,?,?,?,?,IF(?='published',NOW(),NULL))`,[req.user!.schoolId,d.studentId,d.semesterId??null,d.semesterLabel,d.status??"draft",d.summary??null,req.user!.id,d.status??"draft"]); res.json({id:r.insertId})})
router.get("/report-cards/:id/preview", async (req,res)=>{const schoolId=req.user!.schoolId; const id=Number(req.params.id); const [[card]]=await pool.query<RowDataPacket[]>(`SELECT rc.*, s.name student_name, c.name class_name FROM report_cards rc JOIN students s ON s.id=rc.student_id LEFT JOIN classes c ON c.id=s.class_id WHERE rc.id=? AND rc.school_id=?`,[id,schoolId]); if(!card)return res.status(404).json({error:"Rapor tidak ditemukan"}); const [grades]=await pool.query<RowDataPacket[]>(`SELECT g.*, sub.name subject_name, at.name assessment_type_name FROM grade_entries g LEFT JOIN subjects sub ON sub.id=g.subject_id LEFT JOIN assessment_types at ON at.id=g.assessment_type_id WHERE g.school_id=? AND g.student_id=? AND (g.semester_label=? OR ? IS NULL)`,[schoolId,card.student_id,card.semester_label,card.semester_label]); const [observations]=await pool.query<RowDataPacket[]>(`SELECT o.*, a.name aspect_name, i.description indicator_description FROM paud_observations o LEFT JOIN paud_development_aspects a ON a.id=o.aspect_id LEFT JOIN paud_development_indicators i ON i.id=o.indicator_id WHERE o.school_id=? AND o.student_id=? AND (o.semester_label=? OR ? IS NULL)`,[schoolId,card.student_id,card.semester_label,card.semester_label]); res.json({card,grades,observations})})

export default router
