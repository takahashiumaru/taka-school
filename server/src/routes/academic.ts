import { Router } from "express"
import type { RowDataPacket } from "mysql2"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()
router.use(requireAuth())

router.get("/metadata", async (req, res) => {
  const schoolId = req.user!.schoolId
  const [educationLevels] = await pool.query<RowDataPacket[]>("SELECT * FROM education_levels WHERE school_id = ? ORDER BY sort_order, name", [schoolId])
  const [gradeLevels] = await pool.query<RowDataPacket[]>("SELECT * FROM grade_levels WHERE school_id = ? ORDER BY education_level_id, sort_order, name", [schoolId])
  const [academicYears] = await pool.query<RowDataPacket[]>("SELECT * FROM academic_years WHERE school_id = ? ORDER BY is_active DESC, start_date DESC, name DESC", [schoolId])
  const [semesters] = await pool.query<RowDataPacket[]>("SELECT * FROM semesters WHERE school_id = ? ORDER BY academic_year_id, sort_order", [schoolId])
  const [majors] = await pool.query<RowDataPacket[]>("SELECT * FROM majors WHERE school_id = ? ORDER BY education_level_id, name", [schoolId])
  res.json({ educationLevels, gradeLevels, academicYears, semesters, majors })
})

export default router
