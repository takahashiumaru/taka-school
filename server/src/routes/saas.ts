import { Router } from "express"
import { requireAdmin, requireSchoolRead } from "../auth.js"
import { pool } from "../db.js"

const router = Router()

const PLANS = [
  { code: "starter", name: "Starter", schools: 1, students: 150, features: ["Data inti", "Rapor", "SPP", "Portal"] },
  { code: "growth", name: "Growth", schools: 3, students: 500, features: ["Semua Starter", "Import/export", "Asisten AI template", "Custom domain"] },
  { code: "network", name: "Network", schools: 10, students: 2500, features: ["Multi-school ready", "Domain per sekolah", "Prioritas operasional"] },
]

router.get("/plans", requireSchoolRead(), (_req, res) => res.json({ plans: PLANS }))

router.get("/subscription", requireSchoolRead(), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, plan_code, subscription_status, subscription_ends_at, custom_domain, tenant_uid
       FROM schools WHERE id=?`,
      [req.user!.schoolId],
    )
    const school = (rows as any[])[0]
    res.json({ school, plan: PLANS.find((p) => p.code === school?.plan_code) || PLANS[0], multiSchoolReady: true })
  } catch (e) { next(e) }
})

router.put("/subscription", requireAdmin(), async (req, res, next) => {
  try {
    const plan = PLANS.find((p) => p.code === String(req.body.planCode || ""))?.code || "starter"
    const status = ["trial", "active", "past_due", "paused", "cancelled"].includes(String(req.body.subscriptionStatus))
      ? String(req.body.subscriptionStatus)
      : "trial"
    const customDomain = String(req.body.customDomain || "").trim().toLowerCase() || null
    const tenantUid = String(req.body.tenantUid || "").trim() || `school-${req.user!.schoolId}`
    await pool.query(
      `UPDATE schools SET plan_code=?, subscription_status=?, custom_domain=?, tenant_uid=? WHERE id=?`,
      [plan, status, customDomain, tenantUid, req.user!.schoolId],
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
