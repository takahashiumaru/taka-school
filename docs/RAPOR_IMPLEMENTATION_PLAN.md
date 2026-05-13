# Taka School - Rapor System Implementation Plan

## Overview
Sistem rapor yang mendukung 2 jenis penilaian:
1. **PAUD/TK**: Observasi naratif (text-based)
2. **SD/SMP/SMA**: Nilai numerik per mata pelajaran

---

## 1. Database Schema

### Table: `report_cards`
```sql
CREATE TABLE report_cards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  semester VARCHAR(50) NOT NULL,  -- "2025/2026 Ganjil"
  academic_year VARCHAR(20) NOT NULL,  -- "2025/2026"
  report_type ENUM('paud', 'numeric') NOT NULL,  -- PAUD vs SD-SMA
  
  -- PAUD/TK fields (nullable for numeric type)
  physical_development TEXT,  -- Perkembangan fisik motorik
  cognitive_development TEXT,  -- Perkembangan kognitif
  social_emotional TEXT,  -- Sosial emosional
  language_development TEXT,  -- Bahasa
  art_creativity TEXT,  -- Seni dan kreativitas
  religious_moral TEXT,  -- Nilai agama dan moral
  
  -- General fields
  teacher_notes TEXT,  -- Catatan guru
  attendance_present INT DEFAULT 0,
  attendance_sick INT DEFAULT 0,
  attendance_permission INT DEFAULT 0,
  attendance_absent INT DEFAULT 0,
  
  -- Metadata
  homeroom_teacher_id INT,
  principal_id INT,
  issued_date DATE,
  status ENUM('draft', 'published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  UNIQUE KEY unique_report (student_id, semester, academic_year)
);
```

### Table: `report_grades` (untuk SD-SMA)
```sql
CREATE TABLE report_grades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_card_id INT NOT NULL,
  subject_name VARCHAR(100) NOT NULL,  -- "Matematika", "Bahasa Indonesia"
  
  -- Nilai
  daily_score DECIMAL(5,2),  -- Nilai harian (0-100)
  midterm_score DECIMAL(5,2),  -- UTS
  final_score DECIMAL(5,2),  -- UAS
  final_grade DECIMAL(5,2),  -- Nilai akhir (rata-rata)
  letter_grade VARCHAR(2),  -- A, B, C, D, E
  predicate VARCHAR(20),  -- Sangat Baik, Baik, Cukup, Kurang
  
  -- Deskripsi kompetensi
  competency_description TEXT,  -- Deskripsi pencapaian kompetensi
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (report_card_id) REFERENCES report_cards(id) ON DELETE CASCADE
);
```

### Table: `report_notes` (catatan tambahan)
```sql
CREATE TABLE report_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  student_id INT NOT NULL,
  semester VARCHAR(50) NOT NULL,
  note_type ENUM('achievement', 'behavior', 'extracurricular', 'general') NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  created_by INT NOT NULL,  -- teacher_id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 2. API Endpoints

### Report Cards
```
GET    /api/report-cards                    # List rapor (filter by class, semester)
GET    /api/report-cards/:id                # Detail rapor
POST   /api/report-cards                    # Create rapor (auto-detect type from class level)
PUT    /api/report-cards/:id                # Update rapor
DELETE /api/report-cards/:id                # Delete rapor
POST   /api/report-cards/:id/publish        # Publish rapor (draft → published)
GET    /api/report-cards/:id/print          # Generate PDF rapor
```

### Report Grades (SD-SMA only)
```
GET    /api/report-cards/:reportId/grades   # List nilai per mata pelajaran
POST   /api/report-cards/:reportId/grades   # Tambah nilai mata pelajaran
PUT    /api/report-grades/:id               # Update nilai
DELETE /api/report-grades/:id               # Delete nilai
POST   /api/report-cards/:reportId/grades/bulk  # Bulk insert/update nilai
```

### Report Notes
```
GET    /api/report-notes                    # List catatan (filter by student, semester)
POST   /api/report-notes                    # Create catatan
PUT    /api/report-notes/:id                # Update catatan
DELETE /api/report-notes/:id                # Delete catatan
```

---

## 3. Frontend Pages

### 3.1. Main Rapor Page (`/rapor`)
**Components:**
- Filter: Kelas, Semester, Siswa
- Tabs: Catatan | Nilai | PAUD/TK | Kartu Rapor
- Action: "+ Catatan Rapor", "+ Buat Rapor"

**Tab: Catatan**
- List catatan rapor (achievement, behavior, dll)
- Card per catatan dengan type badge
- Edit/Delete actions

**Tab: Nilai** (SD-SMA only)
- Table: Siswa | Matematika | B.Indo | IPA | ... | Rata-rata
- Click row → detail nilai siswa
- Bulk input nilai per kelas

**Tab: PAUD/TK** (PAUD/TK only)
- List siswa dengan preview observasi
- Click → detail observasi lengkap
- Form: 6 aspek perkembangan

**Tab: Kartu Rapor**
- List rapor yang sudah dibuat
- Status: Draft | Published
- Actions: Edit | Publish | Print PDF | Delete

### 3.2. Create/Edit Rapor Page (`/rapor/new`, `/rapor/:id`)

**Auto-detect type dari class level:**
- PAUD/TK → Form observasi naratif
- SD-SMA → Form nilai numerik

**Form PAUD/TK:**
```
Identitas Siswa (auto-fill)
Semester: [dropdown]

Aspek Perkembangan:
1. Perkembangan Fisik Motorik [textarea]
2. Perkembangan Kognitif [textarea]
3. Sosial Emosional [textarea]
4. Bahasa [textarea]
5. Seni dan Kreativitas [textarea]
6. Nilai Agama dan Moral [textarea]

Catatan Guru: [textarea]
Kehadiran: Hadir [__] Sakit [__] Izin [__] Alpa [__]

[Simpan Draft] [Terbitkan Rapor]
```

**Form SD-SMA:**
```
Identitas Siswa (auto-fill)
Semester: [dropdown]

Nilai Mata Pelajaran:
[+ Tambah Mata Pelajaran]

| Mata Pelajaran | Harian | UTS | UAS | Akhir | Predikat | Deskripsi Kompetensi |
|----------------|--------|-----|-----|-------|----------|---------------------|
| Matematika     | 85     | 80  | 90  | 85    | B        | [textarea]          |
| B. Indonesia   | 90     | 88  | 92  | 90    | A        | [textarea]          |
| ...            |        |     |     |       |          |                     |

Catatan Guru: [textarea]
Kehadiran: Hadir [__] Sakit [__] Izin [__] Alpa [__]

[Simpan Draft] [Terbitkan Rapor]
```

### 3.3. Print Rapor Page (`/rapor/:id/print`)
**PDF Layout:**

**PAUD/TK:**
```
┌─────────────────────────────────────────┐
│  RAPOR SISWA PAUD/TK                    │
│  [Logo Sekolah]  SMA Nusantara Mandiri  │
├─────────────────────────────────────────┤
│  Nama: Ahmad Fauzi                      │
│  Kelas: TK B                            │
│  Semester: 2025/2026 Ganjil             │
├─────────────────────────────────────────┤
│  ASPEK PERKEMBANGAN                     │
│                                         │
│  1. Perkembangan Fisik Motorik         │
│     [Observasi naratif...]              │
│                                         │
│  2. Perkembangan Kognitif               │
│     [Observasi naratif...]              │
│  ...                                    │
├─────────────────────────────────────────┤
│  KEHADIRAN                              │
│  Hadir: 60  Sakit: 2  Izin: 1  Alpa: 0 │
├─────────────────────────────────────────┤
│  Wali Kelas: Bu Siti                    │
│  Kepala Sekolah: Pak Budi               │
│  [TTD]          [TTD]                   │
└─────────────────────────────────────────┘
```

**SD-SMA:**
```
┌─────────────────────────────────────────┐
│  RAPOR SISWA SMA                        │
│  [Logo]  SMA Nusantara Mandiri          │
├─────────────────────────────────────────┤
│  Nama: Siti Nurhaliza                   │
│  Kelas: X IPA 1                         │
│  Semester: 2025/2026 Ganjil             │
├─────────────────────────────────────────┤
│  NILAI MATA PELAJARAN                   │
│                                         │
│  | Mata Pelajaran | Harian | UTS | UAS | Akhir | Predikat |
│  |----------------|---------|-----|-----|-------|----------|
│  | Matematika     | 85      | 80  | 90  | 85    | B        |
│  | B. Indonesia   | 90      | 88  | 92  | 90    | A        |
│  | ...            |         |     |     |       |          |
│                                         │
│  Rata-rata: 87.5                        │
├─────────────────────────────────────────┤
│  KEHADIRAN                              │
│  Hadir: 120  Sakit: 3  Izin: 2  Alpa: 0│
├─────────────────────────────────────────┤
│  Catatan Wali Kelas:                    │
│  [Catatan...]                           │
├─────────────────────────────────────────┤
│  Wali Kelas: Pak Ahmad                  │
│  Kepala Sekolah: Dr. Budi               │
│  [TTD]          [TTD]                   │
└─────────────────────────────────────────┘
```

---

## 4. Business Logic

### Auto-detect Report Type
```typescript
function getReportType(classLevel: string): 'paud' | 'numeric' {
  const paudLevels = ['PAUD', 'TK', 'KB', 'TPA'];
  return paudLevels.some(level => classLevel.toUpperCase().includes(level)) 
    ? 'paud' 
    : 'numeric';
}
```

### Grade Calculation (SD-SMA)
```typescript
function calculateFinalGrade(daily: number, midterm: number, final: number) {
  // Bobot: Harian 30%, UTS 30%, UAS 40%
  const finalGrade = (daily * 0.3) + (midterm * 0.3) + (final * 0.4);
  
  // Konversi ke predikat
  let letterGrade = '';
  let predicate = '';
  
  if (finalGrade >= 90) { letterGrade = 'A'; predicate = 'Sangat Baik'; }
  else if (finalGrade >= 80) { letterGrade = 'B'; predicate = 'Baik'; }
  else if (finalGrade >= 70) { letterGrade = 'C'; predicate = 'Cukup'; }
  else if (finalGrade >= 60) { letterGrade = 'D'; predicate = 'Kurang'; }
  else { letterGrade = 'E'; predicate = 'Sangat Kurang'; }
  
  return { finalGrade, letterGrade, predicate };
}
```

### Validation Rules
- PAUD: Minimal 3 aspek perkembangan harus diisi
- SD-SMA: Minimal 5 mata pelajaran harus ada nilai
- Nilai harus 0-100
- Rapor published tidak bisa diedit (harus unpublish dulu)
- Satu siswa hanya bisa punya 1 rapor per semester

---

## 5. Implementation Steps

### Phase 1: Database & API (Backend)
1. ✅ Create migration untuk 3 tables
2. ✅ Implement CRUD endpoints untuk report_cards
3. ✅ Implement CRUD endpoints untuk report_grades
4. ✅ Implement CRUD endpoints untuk report_notes
5. ✅ Add validation & business logic
6. ✅ Test API dengan Postman/curl

### Phase 2: Main Rapor Page (Frontend)
1. ✅ Update RaporPage.tsx dengan 4 tabs
2. ✅ Implement filter (kelas, semester, siswa)
3. ✅ Tab Catatan: list & CRUD
4. ✅ Tab Nilai: table view dengan bulk input
5. ✅ Tab PAUD/TK: list observasi
6. ✅ Tab Kartu Rapor: list rapor dengan status

### Phase 3: Create/Edit Forms
1. ✅ Create RaporFormPage.tsx
2. ✅ Auto-detect type dari class level
3. ✅ Form PAUD: 6 aspek perkembangan
4. ✅ Form SD-SMA: dynamic subject list dengan nilai
5. ✅ Draft/Publish workflow
6. ✅ Validation & error handling

### Phase 4: PDF Generation
1. ✅ Install PDF library (puppeteer atau pdfkit)
2. ✅ Create print template untuk PAUD
3. ✅ Create print template untuk SD-SMA
4. ✅ Add watermark & school logo
5. ✅ Download/preview functionality

### Phase 5: Polish & Testing
1. ✅ Responsive design (mobile-friendly)
2. ✅ Dark mode support
3. ✅ Loading states & error messages
4. ✅ Bulk operations (import nilai dari Excel)
5. ✅ Permission checks (guru hanya bisa edit kelas sendiri)
6. ✅ End-to-end testing

---

## 6. Technical Stack

**Backend:**
- Express.js + MySQL
- PDF generation: `puppeteer` atau `pdfkit`
- Excel import: `xlsx` library

**Frontend:**
- React + TypeScript
- Form handling: native React state
- PDF preview: `react-pdf` atau iframe
- Table: native HTML table dengan sorting

**Styling:**
- Tailwind CSS (existing)
- Print CSS untuk PDF layout

---

## 7. Sample Data

### PAUD Report Example
```json
{
  "student_id": 123,
  "semester": "2025/2026 Ganjil",
  "report_type": "paud",
  "physical_development": "Ananda sudah mampu berlari, melompat, dan menaiki tangga dengan baik. Koordinasi motorik halus berkembang pesat, terlihat dari kemampuan memegang pensil dan menggunting dengan rapi.",
  "cognitive_development": "Ananda menunjukkan rasa ingin tahu yang tinggi. Mampu mengenal warna, bentuk, dan angka 1-10. Senang bertanya dan mengeksplorasi lingkungan sekitar.",
  "social_emotional": "Ananda mudah bergaul dengan teman sebaya. Mampu berbagi mainan dan menunggu giliran. Mulai menunjukkan empati terhadap teman yang sedih.",
  "language_development": "Ananda mampu berkomunikasi dengan kalimat sederhana. Kosakata berkembang baik, senang mendengarkan cerita dan menceritakan kembali dengan bahasa sendiri.",
  "art_creativity": "Ananda senang menggambar dan mewarnai. Hasil karya menunjukkan imajinasi yang baik. Senang bernyanyi dan menari mengikuti irama musik.",
  "religious_moral": "Ananda mulai memahami konsep berbagi dan tolong-menolong. Hafal doa-doa pendek dan senang mengikuti kegiatan keagamaan di sekolah.",
  "teacher_notes": "Ananda adalah anak yang ceria dan aktif. Perkembangannya sangat baik di semua aspek. Terus dampingi dan berikan stimulasi yang sesuai.",
  "attendance_present": 60,
  "attendance_sick": 2,
  "attendance_permission": 1,
  "attendance_absent": 0
}
```

### SD-SMA Report Example
```json
{
  "student_id": 456,
  "semester": "2025/2026 Ganjil",
  "report_type": "numeric",
  "grades": [
    {
      "subject_name": "Matematika",
      "daily_score": 85,
      "midterm_score": 80,
      "final_score": 90,
      "final_grade": 85,
      "letter_grade": "B",
      "predicate": "Baik",
      "competency_description": "Siswa mampu memahami konsep aljabar dan geometri dengan baik. Perlu latihan lebih pada soal cerita."
    },
    {
      "subject_name": "Bahasa Indonesia",
      "daily_score": 90,
      "midterm_score": 88,
      "final_score": 92,
      "final_grade": 90,
      "letter_grade": "A",
      "predicate": "Sangat Baik",
      "competency_description": "Siswa menguasai keterampilan membaca, menulis, dan berbicara dengan sangat baik."
    }
  ],
  "teacher_notes": "Siswa berprestasi baik dan aktif di kelas. Terus pertahankan semangat belajar.",
  "attendance_present": 120,
  "attendance_sick": 3,
  "attendance_permission": 2,
  "attendance_absent": 0
}
```

---

## 8. Future Enhancements

1. **Rapor Digital**: QR code untuk verifikasi keaslian
2. **Parent Portal**: Orang tua bisa download rapor online
3. **Analytics**: Grafik perkembangan nilai per semester
4. **Comparison**: Bandingkan nilai siswa dengan rata-rata kelas
5. **Template Kustom**: Sekolah bisa customize layout rapor
6. **Multi-language**: Support Bahasa Inggris untuk sekolah internasional
7. **E-signature**: TTD digital untuk wali kelas & kepala sekolah
8. **Notification**: Email/WA otomatis saat rapor published

---

## Estimated Timeline

- **Phase 1 (Backend)**: 2-3 hari
- **Phase 2 (Main Page)**: 2 hari
- **Phase 3 (Forms)**: 2-3 hari
- **Phase 4 (PDF)**: 2 hari
- **Phase 5 (Polish)**: 1-2 hari

**Total**: ~10-12 hari kerja

---

## Priority

**Must Have (MVP):**
- ✅ Database schema
- ✅ CRUD API
- ✅ Form PAUD & SD-SMA
- ✅ Basic PDF generation
- ✅ Publish workflow

**Nice to Have:**
- Bulk import nilai
- Advanced PDF template
- Parent portal
- Analytics dashboard

---

Last updated: 2026-05-13
