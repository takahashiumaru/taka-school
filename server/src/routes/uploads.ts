import { Router } from "express"
import multer from "multer"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import { requireAuth } from "../auth.js"

const router = Router()
router.use(requireAuth())

const UPLOAD_ROOT = process.env.VERCEL === "1" ? path.resolve("/tmp", "uploads") : path.resolve(process.cwd(), "uploads")
fs.mkdirSync(UPLOAD_ROOT, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase()
    const safeExt = /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : ""
    const id = crypto.randomBytes(12).toString("hex")
    cb(null, `${Date.now()}-${id}${safeExt}`)
  },
})

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
])

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true)
    else cb(new Error("Tipe file tidak didukung"))
  },
})

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "File tidak ada" })
    return
  }
  const url = `/uploads/${req.file.filename}`
  res.json({ url, filename: req.file.filename, size: req.file.size, mime: req.file.mimetype })
})

export default router
