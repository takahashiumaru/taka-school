import { Router } from "express"
import multer from "multer"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import { requireAuth } from "../auth.js"

import { pool } from "../db.js"

const router = Router()
router.use(requireAuth())

const storage = multer.memoryStorage()

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

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "File tidak ada" })
    return
  }
  try {
    const ext = path.extname(req.file.originalname || "").toLowerCase()
    const safeExt = /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : ""
    const randId = crypto.randomBytes(12).toString("hex")
    const fileId = `${Date.now()}-${randId}${safeExt}`
    
    await pool.query(
      "INSERT INTO files (id, mime_type, size, data) VALUES (?, ?, ?, ?)",
      [fileId, req.file.mimetype, req.file.size, req.file.buffer]
    )

    const url = `/api/uploads/${fileId}`
    res.json({ url, filename: fileId, size: req.file.size, mime: req.file.mimetype })
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).json({ error: "Gagal menyimpan file" })
  }
})

// GET route to serve the file from the database
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>("SELECT mime_type, size, data FROM files WHERE id = ?", [req.params.id])
    if (!rows.length) {
      res.status(404).send("File not found")
      return
    }
    const file = rows[0]
    res.setHeader("Content-Type", file.mime_type)
    res.setHeader("Content-Length", file.size)
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
    res.send(file.data)
  } catch (err) {
    res.status(500).send("Error reading file")
  }
})

export default router
