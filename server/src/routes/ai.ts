import { Router } from "express"
import { requireSchoolRead, requireRole } from "../auth.js"
import { pool } from "../db.js"

const router = Router()

type Tone = "hangat" | "formal" | "ringkas"

function clean(value: unknown, fallback = ""): string {
  return String(value ?? fallback).replace(/\s+/g, " ").trim().slice(0, 1200)
}

function tonePrefix(tone: Tone | undefined) {
  if (tone === "formal") return "Dengan hormat,"
  if (tone === "ringkas") return "Info singkat:"
  return "Halo Bapak/Ibu,"
}

router.get("/status", requireSchoolRead(), (_req, res) => {
  res.json({
    enabled: false,
    mode: "deterministic-template",
    provider: "none",
    note: "Asisten AI aman memakai template lokal; tidak ada panggilan AI berbayar/eksternal.",
  })
})

router.post("/report-comment", requireRole("admin", "staff", "teacher", "guru", "headmaster"), (req, res) => {
  const studentName = clean(req.body.studentName, "Ananda")
  const strengths = clean(req.body.strengths, "menunjukkan perkembangan positif")
  const improvements = clean(req.body.improvements, "perlu terus berlatih secara bertahap")
  const nextSteps = clean(req.body.nextSteps, "pendampingan rutin di sekolah dan rumah")
  const tone = clean(req.body.tone, "hangat") as Tone
  const text = `${tonePrefix(tone)} ${studentName} ${strengths}. Untuk tahap berikutnya, ${studentName} ${improvements}. Rekomendasi tindak lanjut: ${nextSteps}. Terima kasih atas dukungan keluarga dalam mendampingi proses belajar ${studentName}.`
  res.json({ text, safety: "template-only", providerUsed: false })
})

router.post("/announcement-draft", requireRole("admin", "staff", "headmaster"), (req, res) => {
  const title = clean(req.body.title, "Pengumuman Sekolah")
  const audience = clean(req.body.audience, "orang tua/wali murid")
  const date = clean(req.body.date, "tanggal yang ditentukan")
  const details = clean(req.body.details, "informasi lengkap akan disampaikan oleh pihak sekolah")
  const action = clean(req.body.action, "mohon memperhatikan informasi ini")
  const text = `${title}\n\nYth. ${audience},\n\nKami informasikan bahwa pada ${date}, ${details}. ${action}.\n\nTerima kasih atas perhatian dan kerja samanya.\n\nHormat kami,\nManajemen Sekolah`
  res.json({ title, body: text, safety: "template-only", providerUsed: false })
})

router.post("/analytics-prompt", requireRole("admin", "staff", "headmaster"), async (req, res, next) => {
  try {
    const focus = clean(req.body.focus, "ringkasan sekolah")
    const schoolId = req.user!.schoolId
    const [[students], [attendance], [invoices]] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM students WHERE school_id=? AND status='aktif'", [schoolId]),
      pool.query("SELECT status, COUNT(*) AS total FROM attendance WHERE school_id=? AND date = CURDATE() GROUP BY status", [schoolId]),
      pool.query("SELECT status, COUNT(*) AS total, COALESCE(SUM(amount),0) AS amount FROM spp_invoices WHERE school_id=? GROUP BY status", [schoolId]),
    ]) as any
    const attendanceRows = attendance as { status: string; total: number }[]
    const invoiceRows = invoices as { status: string; total: number; amount: number }[]
    const text = `Prompt analitik siap pakai (tanpa dikirim ke AI eksternal):\nFokus: ${focus}\nData: siswa aktif ${(students as any[])[0]?.total ?? 0}; absensi hari ini ${attendanceRows.map((r) => `${r.status}=${r.total}`).join(", ") || "belum ada"}; SPP ${invoiceRows.map((r) => `${r.status}=${r.total}`).join(", ") || "belum ada"}.\nTugas: jelaskan tren utama, risiko operasional, dan 3 rekomendasi tindak lanjut yang sopan dan praktis untuk sekolah kecil.`
    res.json({ prompt: text, safety: "local-data-summary", providerUsed: false })
  } catch (e) { next(e) }
})

export default router
