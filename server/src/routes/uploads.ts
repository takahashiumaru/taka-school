import { Router } from "express"
import multer from "multer"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import { requireOffice } from "../auth.js"

const router = Router()
router.use(requireOffice())

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads")
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

const EXT_BY_MIME: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
}

const ALLOWED = new Set(Object.keys(EXT_BY_MIME))

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase()
    const validExt = EXT_BY_MIME[file.mimetype]?.includes(ext)
    if (ALLOWED.has(file.mimetype) && validExt) cb(null, true)
    else cb(new Error("Tipe atau ekstensi file tidak didukung"))
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
