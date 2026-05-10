import bcrypt from "bcryptjs"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"

async function findOrCreateSchool(name: string, slug: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM schools WHERE slug = ? LIMIT 1",
    [slug],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO schools (name, slug) VALUES (?, ?)",
    [name, slug],
  )
  return res.insertId
}

async function findOrCreateUser(
  schoolId: number,
  name: string,
  email: string,
  password: string,
  role: "admin" | "guru",
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  )
  if (rows.length > 0) return rows[0].id
  const hash = await bcrypt.hash(password, 10)
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [schoolId, name, email, hash, role],
  )
  return res.insertId
}

async function findOrCreateClass(
  schoolId: number,
  name: string,
  level: string,
  homeroomId: number | null,
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM classes WHERE school_id = ? AND name = ? LIMIT 1",
    [schoolId, name],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO classes (school_id, name, grade_level, homeroom_teacher_id) VALUES (?, ?, ?, ?)",
    [schoolId, name, level, homeroomId],
  )
  return res.insertId
}

async function ensureStudent(
  schoolId: number,
  classId: number,
  nis: string,
  name: string,
  gender: "L" | "P",
  parent: string,
  parentWa: string,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM students WHERE school_id = ? AND nis = ? LIMIT 1",
    [schoolId, nis],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO students (school_id, class_id, nis, name, gender, parent_name, parent_wa) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [schoolId, classId, nis, name, gender, parent, parentWa],
  )
  return res.insertId
}

async function ensureAttendance(
  schoolId: number,
  classId: number,
  studentId: number,
  date: string,
  status: "hadir" | "izin" | "sakit" | "alpa",
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM attendance WHERE student_id = ? AND date = ? LIMIT 1",
    [studentId, date],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO attendance (school_id, class_id, student_id, date, status) VALUES (?, ?, ?, ?, ?)",
    [schoolId, classId, studentId, date, status],
  )
  return res.insertId
}

async function ensureSppInvoice(
  schoolId: number,
  studentId: number,
  period: string,
  amount: number,
  dueDate: string,
  status: "belum" | "sebagian" | "lunas" | "lewat",
  paidAmount: number = 0,
  paidAt: string | null = null,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM spp_invoices WHERE student_id = ? AND period = ? LIMIT 1",
    [studentId, period],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO spp_invoices (school_id, student_id, period, amount, due_date, status, paid_amount, paid_at, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [schoolId, studentId, period, amount, dueDate, status, paidAmount, paidAt, paidAt ? "transfer" : null],
  )
  return res.insertId
}

async function ensureAnnouncement(
  schoolId: number,
  authorId: number,
  title: string,
  body: string,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM announcements WHERE school_id = ? AND title = ? LIMIT 1",
    [schoolId, title],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO announcements (school_id, author_id, title, body) VALUES (?, ?, ?, ?)",
    [schoolId, authorId, title, body],
  )
  return res.insertId
}

async function ensureSchedule(
  schoolId: number,
  classId: number,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  subject: string,
  teacherId: number,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM schedules WHERE class_id = ? AND day_of_week = ? AND start_time = ? LIMIT 1",
    [classId, dayOfWeek, startTime],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO schedules (school_id, class_id, day_of_week, start_time, end_time, subject, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [schoolId, classId, dayOfWeek, startTime, endTime, subject, teacherId],
  )
  return res.insertId
}

async function ensureGallery(
  schoolId: number,
  title: string,
  description: string,
  coverUrl: string,
  eventDate: string,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM galleries WHERE school_id = ? AND title = ? LIMIT 1",
    [schoolId, title],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO galleries (school_id, title, description, cover_url, event_date) VALUES (?, ?, ?, ?, ?)",
    [schoolId, title, description, coverUrl, eventDate],
  )
  return res.insertId
}

async function ensureGalleryItem(
  galleryId: number,
  photoUrl: string,
  caption: string,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM gallery_items WHERE gallery_id = ? AND photo_url = ? LIMIT 1",
    [galleryId, photoUrl],
  )
  if (rows.length > 0) return rows[0].id
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO gallery_items (gallery_id, photo_url, caption) VALUES (?, ?, ?)",
    [galleryId, photoUrl, caption],
  )
  return res.insertId
}

export async function ensureDemoData() {
  const schoolId = await findOrCreateSchool("TK Tunas Bangsa (Demo)", "tk-tunas-bangsa-demo")
  const adminId = await findOrCreateUser(
    schoolId,
    "Admin Demo",
    "admin@demo.id",
    "admin123",
    "admin",
  )
  const guruAId = await findOrCreateUser(
    schoolId,
    "Bu Anita",
    "guru@demo.id",
    "guru123",
    "guru",
  )
  const guruBId = await findOrCreateUser(
    schoolId,
    "Bu Rini",
    "guru2@demo.id",
    "guru123",
    "guru",
  )

  const classA = await findOrCreateClass(schoolId, "Kelas A - Apel", "TK A", guruAId)
  const classB = await findOrCreateClass(schoolId, "Kelas B - Beruang", "TK B", guruBId)

  // Data Siswa Kelas A
  const seedStudentsA: Array<[string, string, "L" | "P", string, string]> = [
    ["2324001", "Aisha Putri Wibowo", "P", "Ibu Sari", "628111111111"],
    ["2324002", "Bima Saputra", "L", "Bapak Joko", "628111111112"],
    ["2324003", "Chandra Wijaya", "L", "Ibu Wati", "628111111113"],
    ["2324004", "Dinda Maharani", "P", "Bapak Andre", "628111111114"],
    ["2324005", "Evan Pratama", "L", "Ibu Rani", "628111111115"],
    ["2324006", "Fathia Az-Zahra", "P", "Ibu Ningsih", "628111111116"],
    ["2324007", "Gibran Rakabuming", "L", "Bapak Budi", "628111111117"],
  ]
  const studentAIds: number[] = []
  for (const [nis, n, g, p, w] of seedStudentsA) {
    const sId = await ensureStudent(schoolId, classA, nis, n, g, p, w)
    studentAIds.push(sId)
  }

  // Data Siswa Kelas B
  const seedStudentsB: Array<[string, string, "L" | "P", string, string]> = [
    ["2223001", "Hana Larasati", "P", "Ibu Dewi", "628222222221"],
    ["2223002", "Iqbal Ramadhan", "L", "Bapak Agus", "628222222222"],
    ["2223003", "Jihan Fahira", "P", "Ibu Sinta", "628222222223"],
    ["2223004", "Kevin Sanjaya", "L", "Bapak Heri", "628222222224"],
    ["2223005", "Lestari Puji", "P", "Ibu Rina", "628222222225"],
  ]
  const studentBIds: number[] = []
  for (const [nis, n, g, p, w] of seedStudentsB) {
    const sId = await ensureStudent(schoolId, classB, nis, n, g, p, w)
    studentBIds.push(sId)
  }

  // Generate Attendance (Last 3 days)
  const today = new Date()
  for (let i = 0; i < 3; i++) {
    const dateStr = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i).toISOString().split('T')[0]
    for (const sId of studentAIds) {
      const status = Math.random() > 0.85 ? "izin" : "hadir"
      await ensureAttendance(schoolId, classA, sId, dateStr, status)
    }
    for (const sId of studentBIds) {
      const status = Math.random() > 0.9 ? "sakit" : "hadir"
      await ensureAttendance(schoolId, classB, sId, dateStr, status)
    }
  }

  // Generate SPP Invoices (Current Month)
  const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const dueDate = `${currentPeriod}-10`
  const sppAmount = 250000

  for (const sId of studentAIds) {
    const isPaid = Math.random() > 0.4
    if (isPaid) {
      await ensureSppInvoice(schoolId, sId, currentPeriod, sppAmount, dueDate, "lunas", sppAmount, `${currentPeriod}-05 09:00:00`)
    } else {
      await ensureSppInvoice(schoolId, sId, currentPeriod, sppAmount, dueDate, "belum", 0, null)
    }
  }
  for (const sId of studentBIds) {
    const isPaid = Math.random() > 0.3
    if (isPaid) {
      await ensureSppInvoice(schoolId, sId, currentPeriod, sppAmount, dueDate, "lunas", sppAmount, `${currentPeriod}-02 10:30:00`)
    } else {
      await ensureSppInvoice(schoolId, sId, currentPeriod, sppAmount, dueDate, "belum", 0, null)
    }
  }

  // Generate Announcements
  await ensureAnnouncement(
    schoolId,
    adminId,
    "Pemberitahuan Libur Semester",
    "Yth. Bapak/Ibu Wali Murid, diberitahukan bahwa libur akhir semester ganjil akan dimulai pada tanggal 18 Desember hingga 2 Januari. Siswa masuk kembali pada tanggal 3 Januari. Terima kasih."
  )
  await ensureAnnouncement(
    schoolId,
    guruAId,
    "Kegiatan Mewarnai Bersama",
    "Mohon untuk membawakan pensil warna atau krayon pada hari Jumat ini untuk kegiatan mewarnai bersama di kelas."
  )

  // Generate Schedules (Senin - Jumat)
  const subjects = ["Agama", "Matematika Dasar", "Membaca & Menulis", "Seni Rupa", "Olahraga", "Bermain Bebas"]
  for (let day = 1; day <= 5; day++) {
    await ensureSchedule(schoolId, classA, day, "08:00:00", "09:00:00", subjects[(day + 0) % subjects.length], guruAId)
    await ensureSchedule(schoolId, classA, day, "09:00:00", "10:00:00", subjects[(day + 1) % subjects.length], guruAId)
    await ensureSchedule(schoolId, classA, day, "10:30:00", "11:30:00", subjects[(day + 2) % subjects.length], guruAId)

    await ensureSchedule(schoolId, classB, day, "08:00:00", "09:00:00", subjects[(day + 3) % subjects.length], guruBId)
    await ensureSchedule(schoolId, classB, day, "09:00:00", "10:00:00", subjects[(day + 4) % subjects.length], guruBId)
    await ensureSchedule(schoolId, classB, day, "10:30:00", "11:30:00", subjects[(day + 5) % subjects.length], guruBId)
  }

  // Generate Galleries
  const gal1Id = await ensureGallery(schoolId, "Kegiatan Lomba 17 Agustus", "Keseruan lomba mewarnai dan makan kerupuk dalam rangka kemerdekaan RI", "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800", "2023-08-17")
  await ensureGalleryItem(gal1Id, "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800", "Lomba Mewarnai")
  await ensureGalleryItem(gal1Id, "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800", "Keseruan anak-anak")

  const gal2Id = await ensureGallery(schoolId, "Kunjungan ke Kebun Binatang", "Edukasi satwa liar di kebun binatang kota", "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&q=80&w=800", "2023-10-10")
  await ensureGalleryItem(gal2Id, "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&q=80&w=800", "Melihat gajah")
  await ensureGalleryItem(gal2Id, "https://images.unsplash.com/photo-1588615419953-62584d4b14d4?auto=format&fit=crop&q=80&w=800", "Melihat jerapah")

  console.log(`[seed] OK schoolId=${schoolId} adminId=${adminId} guruAId=${guruAId} guruBId=${guruBId}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureDemoData()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
