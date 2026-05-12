import "dotenv/config"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync } from "node:fs"
import express from "express"
import cors from "cors"
import { pool } from "./db.js"
import { ensureSchema } from "./schema.js"
import authRoutes from "./routes/auth.js"
import statsRoutes from "./routes/stats.js"
import studentsRoutes from "./routes/students.js"
import teachersRoutes from "./routes/teachers.js"
import classesRoutes from "./routes/classes.js"
import attendanceRoutes from "./routes/attendance.js"
import sppRoutes from "./routes/spp.js"
import schedulesRoutes from "./routes/schedules.js"
import announcementsRoutes from "./routes/announcements.js"
import galleriesRoutes from "./routes/galleries.js"
import reportsRoutes from "./routes/reports.js"
import uploadsRoutes from "./routes/uploads.js"
import academicRoutes from "./routes/academic.js"
import tasksRoutes from "./routes/tasks.js"
import assessmentsRoutes from "./routes/assessments.js"
import financeRoutes from "./routes/finance.js"
import portalRoutes from "./routes/portal.js"
import operationsRoutes from "./routes/operations.js"
import admissionsRoutes from "./routes/admissions.js"
import userLinksRoutes from "./routes/userLinks.js"
import importExportRoutes from "./routes/importExport.js"
import aiRoutes from "./routes/ai.js"
import saasRoutes from "./routes/saas.js"
import { ensureDemoData } from "./scripts/seed.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const defaultCorsOrigin = process.env.NODE_ENV === "production" ? "" : "*"
const origins = (process.env.CORS_ORIGIN || defaultCorsOrigin)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

if (process.env.NODE_ENV === "production" && origins.includes("*")) {
  throw new Error("CORS_ORIGIN tidak boleh wildcard (*) di production.")
}
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origins.includes("*") || origins.includes(origin)) cb(null, true)
      else cb(null, false)
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Auth-Token"],
  }),
)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  next()
})
app.use(express.json({ limit: "1mb" }))

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1")
    res.json({ ok: true, db: "up", time: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ ok: false, db: "down", error: (e as Error).message })
  }
})

app.use("/api/auth", authRoutes)
app.use("/api/stats", statsRoutes)
app.use("/api/students", studentsRoutes)
app.use("/api/teachers", teachersRoutes)
app.use("/api/classes", classesRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/spp", sppRoutes)
app.use("/api/schedules", schedulesRoutes)
app.use("/api/announcements", announcementsRoutes)
app.use("/api/galleries", galleriesRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/uploads", uploadsRoutes)
app.use("/api/academic", academicRoutes)
app.use("/api/tasks", tasksRoutes)
app.use("/api/assessments", assessmentsRoutes)
app.use("/api/finance", financeRoutes)
app.use("/api/portal", portalRoutes)
app.use("/api/operations", operationsRoutes)
app.use("/api/admissions", admissionsRoutes)
app.use("/api/user-links", userLinksRoutes)
app.use("/api/import-export", importExportRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/saas", saasRoutes)

const uploadsDir = path.resolve(process.cwd(), "uploads")
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff")
      res.setHeader("Content-Disposition", "inline")
    },
  }),
)

const webDist = path.resolve(__dirname, "..", "..", "web", "dist")
if (existsSync(webDist)) {
  app.use(express.static(webDist))
  app.get(/^(?!\/(api|uploads)\/).*/, (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"))
  })
  console.log(`[boot] serving static frontend from ${webDist}`)
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[error]", err)
  res.status(500).json({ error: "Server error" })
})

const port = Number(process.env.PORT) || 4000

async function start() {
  console.log("[boot] connecting to MySQL…")
  await pool.query("SELECT 1")
  console.log("[boot] ensuring schema…")
  await ensureSchema()
  console.log("[boot] seeding demo data (idempotent)…")
  await ensureDemoData()
  app.listen(port, () => {
    console.log(`[boot] Taka School API listening on http://localhost:${port}`)
  })
}

start().catch((e) => {
  console.error("Failed to start server:", e)
  process.exit(1)
})
