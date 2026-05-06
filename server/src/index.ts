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
import { ensureDemoData } from "./scripts/seed.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const origins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
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
app.use(express.json({ limit: "1mb" }))

app.get("/", (_req, res) => {
  res.json({ message: "Taka School API is running. Go to /api/health to check status." })
})

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

const uploadsDir = process.env.VERCEL === "1" ? path.resolve("/tmp", "uploads") : path.resolve(process.cwd(), "uploads")
app.use("/uploads", express.static(uploadsDir))

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

if (process.env.VERCEL !== "1") {
  start().catch((e) => {
    console.error("Failed to start server:", e)
    process.exit(1)
  })
}

export default app;
