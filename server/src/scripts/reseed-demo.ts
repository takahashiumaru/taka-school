import { pool } from "../db.js"
import { ensureDemoData } from "./seed.js"

async function main() {
  console.log("[reseed] Deleting existing demo school data...")
  
  const schoolId = await pool.query(
    "SELECT id FROM schools WHERE slug = 'sma-nusantara-mandiri-demo'"
  ).then(([rows]: any) => rows[0]?.id)
  
  if (!schoolId) {
    console.log("[reseed] Demo school not found, running fresh seed...")
    await ensureDemoData()
    await pool.end()
    return
  }

  console.log(`[reseed] Found school ID: ${schoolId}`)
  
  // Disable foreign key checks
  await pool.query("SET FOREIGN_KEY_CHECKS=0")
  
  // Delete all related data
  const tables = [
    "report_cards",
    "grade_entries",
    "assessment_types",
    "attendance",
    "spp_invoices",
    "schedules",
    "class_subjects",
    "teacher_subjects",
    "guardians",
    "students",
    "classes",
    "subjects",
    "majors",
    "semesters",
    "academic_years",
    "grade_levels",
    "education_levels",
    "announcements",
    "galleries",
    "gallery_items",
  ]
  
  for (const table of tables) {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE school_id = ?`, [schoolId])
      console.log(`[reseed] Deleted from ${table}: ${(result as any)[0].affectedRows} rows`)
    } catch (err: any) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        console.log(`[reseed] Skipped ${table} (no school_id column)`)
      } else {
        throw err
      }
    }
  }
  
  // Delete users
  const userResult = await pool.query("DELETE FROM users WHERE school_id = ?", [schoolId])
  console.log(`[reseed] Deleted users: ${(userResult as any)[0].affectedRows} rows`)
  
  // Re-enable foreign key checks
  await pool.query("SET FOREIGN_KEY_CHECKS=1")
  
  console.log("[reseed] Running seed to create fresh data...")
  await ensureDemoData()
  
  await pool.end()
  console.log("[reseed] Done! ✅")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
