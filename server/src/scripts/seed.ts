import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import type { RowDataPacket, ResultSetHeader } from "mysql2"
import { pool } from "../db.js"
import { ensureSchema } from "../schema.js"

const require = createRequire(import.meta.url)
const bcrypt = require("bcryptjs") as { hash: (password: string, rounds: number) => Promise<string> }

type Gender = "L" | "P"
type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa"

const maleFirst = ["Ahmad", "Rizky", "Bima", "Fajar", "Dimas", "Rafi", "Arkan", "Naufal", "Farhan", "Ilham", "Bagas", "Aditya", "Raka", "Iqbal", "Yusuf", "Fikri", "Galang", "Hafiz", "Reza", "Tegar", "Alif", "Daffa", "Rangga", "Rendy", "Wildan", "Rivaldi", "Syauqi", "Raihan", "Fadli", "Gilang"]
const femaleFirst = ["Siti", "Aisyah", "Nadia", "Putri", "Dewi", "Anisa", "Zahra", "Fitri", "Citra", "Amelia", "Nabila", "Intan", "Rania", "Salma", "Kayla", "Aulia", "Hana", "Riska", "Tiara", "Maya", "Laras", "Nayla", "Salsa", "Niken", "Sekar", "Adinda", "Mutiara", "Kirana", "Aqila", "Fathia"]
const lastNames = ["Pratama", "Saputra", "Wijaya", "Nugroho", "Kurniawan", "Rahmawati", "Permata", "Salsabila", "Ramadhan", "Maulana", "Utami", "Lestari", "Hidayat", "Santoso", "Wibowo", "Ananda", "Pangestu", "Setiawan", "Pertiwi", "Cahyani", "Mahendra", "Firmansyah", "Fauziah", "Aprilia", "Maharani", "Anggraini", "Gunawan", "Natasya", "Herlambang", "Oktaviani"]
const fatherNames = ["Budi Santoso", "Agus Setiawan", "Hendra Wijaya", "Joko Prasetyo", "Rudi Hartono", "Eko Purnomo", "Wahyu Saputra", "Dedi Kurniawan", "Herman Susanto", "Taufik Hidayat"]
const motherNames = ["Sri Wahyuni", "Sulastri", "Nur Aini", "Dewi Lestari", "Rina Marlina", "Yanti Kurniasih", "Fitri Handayani", "Maya Sari", "Ratna Wulandari", "Lilis Suryani"]
const streets = ["Jl. Merdeka", "Jl. Sudirman", "Jl. Diponegoro", "Jl. Ahmad Yani", "Jl. Melati", "Jl. Kenanga", "Jl. Cendana", "Jl. Pahlawan", "Jl. Gatot Subroto", "Jl. Imam Bonjol"]
const religions = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha"]
const bloodTypes = ["A", "B", "AB", "O"]

const subjects = [
  ["MTK", "Matematika Wajib"], ["BIN", "Bahasa Indonesia"], ["BIG", "Bahasa Inggris"], ["PAI", "Pendidikan Agama"],
  ["PPKN", "PPKn"], ["SEJ", "Sejarah Indonesia"], ["FIS", "Fisika"], ["KIM", "Kimia"], ["BIO", "Biologi"],
  ["EKO", "Ekonomi"], ["SOS", "Sosiologi"], ["GEO", "Geografi"], ["SAS", "Sastra Indonesia"], ["JPG", "Bahasa Jepang"],
  ["SEN", "Seni Budaya"], ["PJOK", "PJOK"]
]
const subjectByMajor: Record<string, string[]> = {
  IPA: ["MTK", "BIN", "BIG", "PAI", "PPKN", "SEJ", "FIS", "KIM", "BIO", "SEN", "PJOK"],
  IPS: ["MTK", "BIN", "BIG", "PAI", "PPKN", "SEJ", "EKO", "SOS", "GEO", "SEN", "PJOK"],
  Bahasa: ["MTK", "BIN", "BIG", "PAI", "PPKN", "SEJ", "SAS", "JPG", "SEN", "PJOK", "SOS"],
}

function pick<T>(arr: T[], i: number) { return arr[i % arr.length] }
function phone(i: number) { return `08${String(1200000000 + i * 7919).slice(0, 10)}` }
function dateAdd(base: Date, days: number) { const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10) }
function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") }

async function getOne(sql: string, params: unknown[]) {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params)
  return rows[0]
}
async function insert(sql: string, params: unknown[]) {
  const [res] = await pool.query<ResultSetHeader>(sql, params)
  return res.insertId
}

async function ensureCurrentOperationalData(schoolId: number) {
  const [studentRows] = await pool.query<RowDataPacket[]>("SELECT id, class_id FROM students WHERE school_id=? AND status='aktif'", [schoolId])
  const admin = await getOne("SELECT id FROM users WHERE school_id=? AND role='admin' LIMIT 1", [schoolId])
  const adminId = Number(admin?.id ?? 1)
  const today = new Date()
  const currentPeriod = today.toISOString().slice(0, 7)
  for (let d = 0; d < 14; d += 1) {
    const date = dateAdd(today, -d)
    const day = new Date(date).getDay()
    if (day === 0 || day === 6) continue
    for (let i = 0; i < studentRows.length; i += 1) {
      const s = studentRows[i]
      const r = (i * 11 + d * 5) % 100
      const status: AttendanceStatus = r < 89 ? "hadir" : r < 94 ? "izin" : r < 98 ? "sakit" : "alpa"
      await pool.query("INSERT IGNORE INTO attendance (school_id, class_id, student_id, date, status, recorded_by) VALUES (?, ?, ?, ?, ?, ?)", [schoolId, s.class_id, s.id, date, status, adminId])
    }
  }
  for (let i = 0; i < studentRows.length; i += 1) {
    const s = studentRows[i]
    const status = i % 9 === 0 ? "belum" : i % 13 === 0 ? "sebagian" : "lunas"
    const amount = 550000
    const paid = status === "lunas" ? amount : status === "sebagian" ? 300000 : 0
    await pool.query("INSERT IGNORE INTO spp_invoices (school_id, student_id, period, amount, due_date, status, paid_amount, paid_at, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [schoolId, s.id, currentPeriod, amount, `${currentPeriod}-10`, status, paid, paid > 0 ? `${currentPeriod}-08 09:00:00` : null, paid > 0 ? "transfer" : null])
  }
}

export async function ensureDemoData() {
  await ensureSchema()
  const passwordHash = await bcrypt.hash("demo12345", 10)

  await pool.query(
    `INSERT INTO schools (name, slug, phone, address, plan_code, subscription_status, tenant_uid)
     VALUES (?, ?, ?, ?, 'pro', 'trial', ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), address=VALUES(address), plan_code='pro'`,
    ["SMA Nusantara Mandiri Demo", "sma-nusantara-mandiri-demo", "021-7788-2026", "Jl. Pendidikan Raya No. 17, Bandung", "sma-nusantara-demo"],
  )
  const schoolId = Number((await getOne("SELECT id FROM schools WHERE slug=?", ["sma-nusantara-mandiri-demo"])).id)

  const existing = await getOne("SELECT COUNT(*) AS total FROM students WHERE school_id=?", [schoolId])
  if (Number(existing?.total ?? 0) >= 300) {
    await ensureCurrentOperationalData(schoolId)
    console.log("[seed] SMA demo data already exists; current attendance/SPP ensured")
    return
  }

  await pool.query("SET FOREIGN_KEY_CHECKS=0")
  for (const table of ["report_cards", "grade_entries", "assessment_types", "attendance", "spp_invoices", "schedules", "class_subjects", "teacher_subjects", "guardians", "students", "classes", "subjects", "majors", "semesters", "academic_years", "grade_levels", "education_levels", "announcements", "galleries", "gallery_items"]) {
    await pool.query(`DELETE FROM ${table} WHERE school_id = ?`, [schoolId]).catch(async () => {})
  }
  await pool.query("DELETE FROM users WHERE school_id = ?", [schoolId])
  await pool.query("SET FOREIGN_KEY_CHECKS=1")

  const adminId = await insert(
    "INSERT INTO users (school_id, name, email, nip, phone, subject_specialty, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')",
    [schoolId, "Admin SMA Demo", "admin@takaschool-demo.id", "ADM-2026-001", "081200000001", "Administrasi Sekolah", passwordHash],
  )

  const levelId = await insert("INSERT INTO education_levels (school_id, code, name, sort_order) VALUES (?, 'sma', 'SMA', 5)", [schoolId])
  const gradeIds: Record<string, number> = {}
  for (const [code, name, sort] of [["10", "Kelas X", 10], ["11", "Kelas XI", 11], ["12", "Kelas XII", 12]] as const) {
    gradeIds[code] = await insert("INSERT INTO grade_levels (school_id, education_level_id, code, name, sort_order) VALUES (?, ?, ?, ?, ?)", [schoolId, levelId, code, name, sort])
  }
  const ayId = await insert("INSERT INTO academic_years (school_id, name, start_date, end_date, is_active) VALUES (?, '2026/2027', '2026-07-01', '2027-06-30', 1)", [schoolId])
  const semesterIds = [
    await insert("INSERT INTO semesters (school_id, academic_year_id, name, sort_order, start_date, end_date, is_active) VALUES (?, ?, 'Ganjil', 1, '2026-07-01', '2026-12-31', 1)", [schoolId, ayId]),
    await insert("INSERT INTO semesters (school_id, academic_year_id, name, sort_order, start_date, end_date, is_active) VALUES (?, ?, 'Genap', 2, '2027-01-01', '2027-06-30', 0)", [schoolId, ayId]),
  ]
  const majorIds: Record<string, number> = {}
  for (const major of ["IPA", "IPS", "Bahasa"]) majorIds[major] = await insert("INSERT INTO majors (school_id, education_level_id, name) VALUES (?, ?, ?)", [schoolId, levelId, major])

  const subjectIds: Record<string, number> = {}
  for (const [code, name] of subjects) subjectIds[code] = await insert("INSERT INTO subjects (school_id, education_level_id, code, name, description) VALUES (?, ?, ?, ?, ?)", [schoolId, levelId, code, name, `Mata pelajaran SMA: ${name}`])

  const teacherIds: number[] = []
  for (let i = 0; i < 30; i += 1) {
    const gender: Gender = i % 3 === 0 ? "P" : "L"
    const name = `${gender === "L" ? "Pak" : "Bu"} ${pick(gender === "L" ? maleFirst : femaleFirst, i)} ${pick(lastNames, i + 4)}`
    const subj = subjects[i % subjects.length]
    const id = await insert(
      "INSERT INTO users (school_id, name, email, nip, phone, subject_specialty, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?, 'guru')",
      [schoolId, name, `${slug(name)}@takaschool-demo.id`, `198${String(700000 + i * 31)}${String(i + 1).padStart(3, "0")}`, phone(300 + i), subj[1], passwordHash],
    )
    teacherIds.push(id)
  }

  const subjectCodes = subjects.map((s) => s[0])
  for (let idx = 0; idx < subjectCodes.length; idx += 1) {
    const code = subjectCodes[idx]
    await pool.query("INSERT INTO teacher_subjects (school_id, teacher_id, subject_id) VALUES (?, ?, ?)", [schoolId, teacherIds[idx % teacherIds.length], subjectIds[code]])
  }

  const classIds: Array<{ id: number; name: string; grade: string; major: string; homeroom: number }> = []
  let classNo = 0
  for (const grade of ["10", "11", "12"]) {
    for (const major of ["IPA", "IPS", "Bahasa"]) {
      for (const paralel of ["1", "2"]) {
        if (classIds.length >= 15) break
        const homeroom = teacherIds[classNo % teacherIds.length]
        const name = `${grade === "10" ? "X" : grade === "11" ? "XI" : "XII"} ${major} ${paralel}`
        const id = await insert(
          "INSERT INTO classes (school_id, education_level_id, grade_level_id, academic_year_id, name, grade_level, homeroom_teacher_id, major_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [schoolId, levelId, gradeIds[grade], ayId, name, `Kelas ${grade}`, homeroom, majorIds[major]],
        )
        classIds.push({ id, name, grade, major, homeroom })
        classNo += 1
      }
    }
  }

  for (const klass of classIds) {
    for (const code of subjectByMajor[klass.major]) {
      const teacherId = teacherIds[(subjects.findIndex((s) => s[0] === code) + classIds.indexOf(klass)) % teacherIds.length]
      await pool.query("INSERT INTO class_subjects (school_id, class_id, subject_id, teacher_id) VALUES (?, ?, ?, ?)", [schoolId, klass.id, subjectIds[code], teacherId])
    }
  }

  const studentRows: Array<{ id: number; classId: number; index: number; name: string }> = []
  const usedNames = new Set<string>()
  for (let i = 0; i < 315; i += 1) {
    const klass = classIds[i % classIds.length]
    const gender: Gender = i % 2 === 0 ? "L" : "P"
    
    // Generate unique name by combining different offsets
    let name = ""
    let attempts = 0
    do {
      const firstIdx = (i * 7 + attempts * 3) % (gender === "L" ? maleFirst.length : femaleFirst.length)
      const lastIdx1 = (i * 11 + attempts * 5) % lastNames.length
      const lastIdx2 = (i * 13 + attempts * 7 + 17) % lastNames.length
      name = `${pick(gender === "L" ? maleFirst : femaleFirst, firstIdx)} ${pick(lastNames, lastIdx1)} ${pick(lastNames, lastIdx2)}`
      attempts++
    } while (usedNames.has(name) && attempts < 50)
    usedNames.add(name)
    
    const parentName = gender === "L" ? pick(fatherNames, i) : pick(motherNames, i)
    const birthYear = klass.grade === "10" ? 2010 : klass.grade === "11" ? 2009 : 2008
    const id = await insert(
      `INSERT INTO students (school_id, class_id, nis, nisn, email, phone, name, nickname, gender, birth_place, birth_date, religion, parent_name, parent_wa, address, blood_type, allergies, medical_notes, emergency_contact_name, emergency_contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
      [schoolId, klass.id, `26${String(i + 1).padStart(4, "0")}`, `00${String(3126000000 + i)}`, `${slug(name)}@siswa.takaschool-demo.id`, phone(1000 + i), name, name.split(" ")[0], gender, pick(["Bandung", "Cimahi", "Sumedang", "Garut", "Tasikmalaya"], i), `${birthYear}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`, pick(religions, i), parentName, phone(2000 + i), `${pick(streets, i)} No. ${(i % 120) + 1}, Bandung`, pick(bloodTypes, i), i % 23 === 0 ? "Alergi seafood" : null, i % 31 === 0 ? "Riwayat asma ringan" : null, parentName, phone(2000 + i)],
    )
    studentRows.push({ id, classId: klass.id, index: i, name })
    await pool.query("INSERT INTO guardians (school_id, student_id, relation, name, phone, whatsapp, email, occupation, address, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)", [schoolId, id, gender === "L" ? "Ayah" : "Ibu", parentName, phone(2000 + i), phone(2000 + i), `${slug(parentName)}${i}@wali.takaschool-demo.id`, pick(["Wiraswasta", "Karyawan Swasta", "PNS", "Guru", "Perawat", "Pedagang", "Teknisi"], i), `${pick(streets, i)} No. ${(i % 120) + 1}, Bandung`])
  }

  const times = [["07:00:00", "08:30:00"], ["08:45:00", "10:15:00"], ["10:30:00", "12:00:00"], ["13:00:00", "14:30:00"]]
  for (const klass of classIds) {
    const codes = subjectByMajor[klass.major]
    for (let day = 1; day <= 5; day += 1) {
      for (let slot = 0; slot < times.length; slot += 1) {
        const code = codes[(day + slot + classIds.indexOf(klass)) % codes.length]
        const teacherId = teacherIds[(subjects.findIndex((s) => s[0] === code) + day + slot) % teacherIds.length]
        await pool.query("INSERT INTO schedules (school_id, class_id, subject_id, day_of_week, start_time, end_time, subject, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [schoolId, klass.id, subjectIds[code], day, times[slot][0], times[slot][1], subjects.find((s) => s[0] === code)?.[1] ?? code, teacherId])
      }
    }
  }

  const typeIds = [
    await insert("INSERT INTO assessment_types (school_id, name, weight) VALUES (?, 'Tugas Harian', 1)", [schoolId]),
    await insert("INSERT INTO assessment_types (school_id, name, weight) VALUES (?, 'Ulangan Harian', 1.25)", [schoolId]),
    await insert("INSERT INTO assessment_types (school_id, name, weight) VALUES (?, 'PTS', 1.5)", [schoolId]),
    await insert("INSERT INTO assessment_types (school_id, name, weight) VALUES (?, 'PAS', 2)", [schoolId]),
  ]
  for (const student of studentRows) {
    const klass = classIds.find((c) => c.id === student.classId)!
    for (const code of subjectByMajor[klass.major].slice(0, 8)) {
      for (let t = 0; t < 4; t += 1) {
        const base = 72 + ((student.index + code.charCodeAt(0) + t * 7) % 24)
        const score = Math.min(98, Math.max(58, base + (student.index % 9 === 0 ? -8 : 0)))
        const teacherId = teacherIds[(subjects.findIndex((s) => s[0] === code) + t) % teacherIds.length]
        await pool.query("INSERT INTO grade_entries (school_id, student_id, subject_id, assessment_type_id, semester_id, semester_label, score, note, assessed_at, created_by) VALUES (?, ?, ?, ?, ?, 'Ganjil 2026/2027', ?, ?, ?, ?)", [schoolId, student.id, subjectIds[code], typeIds[t], semesterIds[0], score, score < 70 ? "Perlu pendampingan belajar" : score >= 90 ? "Sangat baik dan konsisten" : "Baik", dateAdd(new Date("2026-08-01"), (student.index + t * 9) % 100), teacherId])
      }
    }
  }

  for (let d = 0; d < 30; d += 1) {
    const date = dateAdd(new Date("2026-10-01"), d)
    const day = new Date(date).getDay()
    if (day === 0 || day === 6) continue
    for (const student of studentRows) {
      const r = (student.index * 13 + d * 7) % 100
      const status: AttendanceStatus = r < 88 ? "hadir" : r < 93 ? "izin" : r < 97 ? "sakit" : "alpa"
      await pool.query("INSERT INTO attendance (school_id, class_id, student_id, date, status, recorded_by) VALUES (?, ?, ?, ?, ?, ?)", [schoolId, student.classId, student.id, date, status, adminId])
    }
  }

  const periods = ["2026-07", "2026-08", "2026-09", "2026-10"]
  for (const student of studentRows) {
    for (let pi = 0; pi < periods.length; pi += 1) {
      const period = periods[pi]
      const status = (student.index + pi) % 9 === 0 ? "belum" : (student.index + pi) % 13 === 0 ? "sebagian" : "lunas"
      const amount = 550000
      const paid = status === "lunas" ? amount : status === "sebagian" ? 300000 : 0
      await pool.query("INSERT INTO spp_invoices (school_id, student_id, period, amount, due_date, status, paid_amount, paid_at, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [schoolId, student.id, period, amount, `${period}-10`, status, paid, paid > 0 ? `${period}-08 09:00:00` : null, paid > 0 ? "transfer" : null])
    }
  }

  await pool.query("INSERT INTO announcements (school_id, author_id, title, body) VALUES (?, ?, ?, ?)", [schoolId, adminId, "Simulasi Ujian Tengah Semester", "PTS semester ganjil akan dilaksanakan pekan depan. Mohon wali kelas memantau kesiapan siswa."])

  // Library books
  const books = [
    ["Matematika Peminatan Kelas XII", "Tim Penulis Erlangga", "Pelajaran"],
    ["Fisika untuk SMA/MA Kelas XI", "Marthen Kanginan", "Pelajaran"],
    ["Kimia Dasar Kelas X", "Michael Purba", "Pelajaran"],
    ["Biologi Campbell Edisi 11", "Jane B. Reece", "Referensi"],
    ["Laskar Pelangi", "Andrea Hirata", "Fiksi"],
    ["Bumi Manusia", "Pramoedya Ananta Toer", "Fiksi"],
    ["Sapiens: A Brief History of Humankind", "Yuval Noah Harari", "Non-Fiksi"],
    ["Atomic Habits", "James Clear", "Pengembangan Diri"],
    ["The Psychology of Money", "Morgan Housel", "Ekonomi"],
    ["Sejarah Indonesia Modern", "M.C. Ricklefs", "Sejarah"],
    ["Kamus Besar Bahasa Indonesia", "Badan Bahasa Kemendikbud", "Referensi"],
    ["Oxford Advanced Learner's Dictionary", "Oxford University Press", "Referensi"],
    ["Ekonomi Mikro", "N. Gregory Mankiw", "Pelajaran"],
    ["Sosiologi SMA Kelas XI", "Kun Maryati", "Pelajaran"],
    ["Geografi Regional Indonesia", "Bintarto", "Pelajaran"],
  ]
  for (let i = 0; i < books.length; i += 1) {
    const [title, author, category] = books[i]
    const stock = 5 + (i % 8)
    const borrowed = i % 4
    await pool.query("INSERT INTO library_books (school_id, title, author, category, stock, available_stock) VALUES (?, ?, ?, ?, ?, ?)", [schoolId, title, author, category, stock, stock - borrowed])
  }

  // Inventory items
  const inventory = [
    ["Proyektor Epson EB-X06", "Elektronik", "Ruang Multimedia", 3, "good"],
    ["Laptop Asus VivoBook", "Elektronik", "Lab Komputer", 25, "good"],
    ["Meja Siswa Kayu Jati", "Furniture", "Kelas X IPA 1", 36, "good"],
    ["Kursi Siswa Besi", "Furniture", "Kelas XI IPS 2", 36, "good"],
    ["Papan Tulis Whiteboard 3x2m", "Alat Tulis", "Kelas XII Bahasa 1", 1, "good"],
    ["AC Split 2 PK", "Elektronik", "Ruang Guru", 2, "maintenance"],
    ["Printer Canon G3010", "Elektronik", "Ruang TU", 2, "good"],
    ["Bola Sepak Mikasa", "Olahraga", "Gudang Olahraga", 15, "good"],
    ["Bola Voli Molten", "Olahraga", "Gudang Olahraga", 12, "good"],
    ["Mikroskop Olympus CX23", "Lab", "Lab Biologi", 8, "good"],
    ["Tabung Reaksi Set", "Lab", "Lab Kimia", 50, "good"],
    ["Gitar Akustik Yamaha", "Musik", "Ruang Kesenian", 5, "good"],
    ["Keyboard Casio CTK-3500", "Musik", "Ruang Kesenian", 3, "good"],
    ["Lemari Arsip Besi", "Furniture", "Ruang TU", 4, "good"],
    ["Kipas Angin Berdiri", "Elektronik", "Kelas X IPS 1", 2, "damaged"],
  ]
  for (const [name, category, location, quantity, condition] of inventory) {
    await pool.query("INSERT INTO inventory_items (school_id, name, category, location, quantity, condition_status) VALUES (?, ?, ?, ?, ?, ?)", [schoolId, name, category, location, quantity, condition])
  }

  // Extracurriculars
  const ekstrakurikuler = [
    ["Pramuka", "Senin & Kamis 15:00-17:00"],
    ["Basket", "Selasa & Jumat 15:30-17:30"],
    ["Futsal", "Rabu & Sabtu 15:30-17:30"],
    ["Voli", "Senin & Kamis 15:30-17:30"],
    ["Paduan Suara", "Rabu 15:00-17:00"],
    ["Teater", "Jumat 15:00-17:00"],
    ["Robotika", "Selasa & Kamis 15:00-17:00"],
    ["Jurnalistik", "Rabu 15:00-17:00"],
    ["PMR (Palang Merah Remaja)", "Jumat 15:00-17:00"],
    ["English Club", "Selasa 15:00-16:30"],
  ]
  for (let i = 0; i < ekstrakurikuler.length; i += 1) {
    const [name, schedule] = ekstrakurikuler[i]
    const coach = teacherIds[i % teacherIds.length]
    await pool.query("INSERT INTO extracurriculars (school_id, name, coach_user_id, schedule_note) VALUES (?, ?, ?, ?)", [schoolId, name, coach, schedule])
  }

  // Counseling records (BK)
  const bkCategories = ["Akademik", "Sosial", "Pribadi", "Karir"]
  const bkTitles = [
    ["Akademik", "Kesulitan Memahami Materi Matematika", "Siswa mengalami kesulitan dalam memahami konsep integral. Perlu pendampingan tambahan.", "Koordinasi dengan guru mapel untuk les tambahan."],
    ["Sosial", "Konflik dengan Teman Sekelas", "Terjadi kesalahpahaman dengan teman satu kelas terkait tugas kelompok.", "Mediasi antara kedua pihak dan pembinaan komunikasi."],
    ["Pribadi", "Motivasi Belajar Menurun", "Siswa terlihat kurang semangat dan sering mengantuk di kelas.", "Konseling individu dan koordinasi dengan orang tua."],
    ["Karir", "Konsultasi Pemilihan Jurusan Kuliah", "Siswa bingung memilih antara jurusan teknik atau kedokteran.", "Tes minat bakat dan diskusi prospek karir."],
    ["Akademik", "Nilai Ulangan Harian Menurun", "Prestasi akademik menurun sejak semester ini.", "Evaluasi metode belajar dan penjadwalan ulang."],
    ["Sosial", "Kesulitan Beradaptasi di Kelas Baru", "Siswa pindahan merasa kesulitan bergaul dengan teman baru.", "Buddy system dan kegiatan ice breaking."],
    ["Pribadi", "Kecemasan Menghadapi Ujian", "Siswa mengalami anxiety berlebihan menjelang PTS.", "Teknik relaksasi dan manajemen stres."],
    ["Karir", "Minat Mengikuti Olimpiade Sains", "Siswa ingin mengikuti OSN Fisika tingkat provinsi.", "Koordinasi dengan guru pembina dan jadwal latihan."],
  ]
  for (let i = 0; i < bkTitles.length; i += 1) {
    const [category, title, notes, followUp] = bkTitles[i]
    const student = studentRows[i * 13 % studentRows.length]
    const recordDate = dateAdd(new Date("2026-10-01"), i * 3)
    await pool.query("INSERT INTO counseling_records (school_id, student_id, category, title, notes, follow_up, record_date) VALUES (?, ?, ?, ?, ?, ?, ?)", [schoolId, student.id, category, title, notes, followUp, recordDate])
  }

  // School letters (Surat)
  const letters = [
    ["001/SMA-NM/X/2026", "Undangan", "Undangan Rapat Orang Tua Siswa Kelas XII", "Komite Sekolah", "issued"],
    ["002/SMA-NM/X/2026", "Pemberitahuan", "Pemberitahuan Libur Semester Ganjil", "Seluruh Wali Murid", "issued"],
    ["003/SMA-NM/X/2026", "Izin Kegiatan", "Permohonan Izin Study Tour ke Museum Geologi", "Dinas Pendidikan Kota Bandung", "issued"],
    ["004/SMA-NM/X/2026", "Rekomendasi", "Surat Rekomendasi Siswa Berprestasi", "Panitia Beasiswa Unggulan", "issued"],
    ["005/SMA-NM/X/2026", "Keterangan", "Surat Keterangan Aktif Siswa", "Bank BCA Cabang Bandung", "issued"],
    ["006/SMA-NM/XI/2026", "Undangan", "Undangan Seminar Pendidikan Karakter", "Kepala Sekolah Se-Kota Bandung", "draft"],
    ["007/SMA-NM/XI/2026", "Pemberitahuan", "Pemberitahuan Jadwal Ujian Akhir Semester", "Seluruh Siswa dan Wali Murid", "draft"],
  ]
  for (const [letterNo, type, subject, recipient, status] of letters) {
    await pool.query("INSERT INTO school_letters (school_id, letter_no, type, subject, recipient, status) VALUES (?, ?, ?, ?, ?, ?)", [schoolId, letterNo, type, subject, recipient, status])
  }

  // Galleries
  const galleries = [
    ["Upacara Bendera 17 Agustus 2026", "Peringatan HUT RI ke-81 di lapangan sekolah dengan seluruh siswa dan guru.", "2026-08-17"],
    ["Kegiatan MPLS 2026", "Masa Pengenalan Lingkungan Sekolah untuk siswa baru kelas X.", "2026-07-15"],
    ["Lomba Olahraga Antar Kelas", "Kompetisi basket, futsal, dan voli antar kelas dalam rangka memperingati Hari Olahraga Nasional.", "2026-09-09"],
    ["Pentas Seni Semester Ganjil", "Penampilan paduan suara, teater, dan band dari berbagai ekstrakurikuler.", "2026-10-20"],
    ["Kunjungan Industri ke PT Telkom", "Siswa kelas XII IPA berkunjung ke PT Telkom Indonesia untuk mengenal dunia kerja.", "2026-09-25"],
    ["Pelatihan Kepemimpinan OSIS", "Workshop leadership dan team building untuk pengurus OSIS periode 2026/2027.", "2026-08-05"],
  ]
  for (let i = 0; i < galleries.length; i += 1) {
    const [title, description, eventDate] = galleries[i]
    const galleryId = await insert("INSERT INTO galleries (school_id, title, description, event_date) VALUES (?, ?, ?, ?)", [schoolId, title, description, eventDate])
    
    // Add 3-5 dummy photo items per gallery
    const photoCount = 3 + (i % 3)
    for (let j = 0; j < photoCount; j += 1) {
      const caption = `${title} - Foto ${j + 1}`
      const photoUrl = `https://picsum.photos/seed/${schoolId}-${galleryId}-${j}/800/600`
      await pool.query("INSERT INTO gallery_items (gallery_id, photo_url, caption) VALUES (?, ?, ?)", [galleryId, photoUrl, caption])
    }
  }

  console.log("[seed] SMA demo data inserted")
}

async function main() {
  await ensureDemoData()
  await pool.end()
}

const isCli = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false
if (isCli) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
