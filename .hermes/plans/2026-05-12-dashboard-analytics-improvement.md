# Taka School Dashboard Analytics Improvement Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Membuat dashboard Taka School lebih bermanfaat untuk admin/guru: bukan hanya angka total, tapi insight harian, grafik, tren, risiko, dan shortcut aksi yang jelas.

**Architecture:** Backend `server/src/routes/stats.ts` diperluas menjadi endpoint dashboard analytics yang tetap ringan dan berbasis MySQL query agregasi. Frontend `web/src/pages/DashboardPage.tsx` dipecah menjadi komponen kecil di `web/src/components/dashboard/` dengan chart SVG/CSS custom dulu agar tidak menambah dependency besar.

**Tech Stack:** Express + TypeScript + MySQL backend, Vite React TypeScript frontend, Tailwind CSS. Tidak auto-commit; implementasi wajib build dulu lalu minta approval Umar.

---

## Target UX

Dashboard baru harus menjawab pertanyaan ini dalam 5 detik:

1. Hari ini ada masalah apa?
2. Absensi minggu ini naik/turun?
3. SPP bulan ini sudah seberapa sehat?
4. Kelas mana yang perlu perhatian?
5. Aksi apa yang harus admin lakukan sekarang?

## Layout Baru

### 1. Top Insight Strip

Di bawah greeting:

- Total Siswa aktif
- Total Guru aktif
- Jumlah Kelas
- Risk Score / Perlu Perhatian

Risk Score dihitung sederhana dari:

- jumlah alpa hari ini
- invoice overdue / belum bayar
- tugas overdue jika ada

### 2. Grafik Utama

Grid 2 kolom desktop, 1 kolom mobile:

- **Attendance Trend 7 Hari**: stacked/line bar `Hadir`, `Izin/Sakit`, `Alpa`
- **SPP Collection Chart**: donut/progress ring `Lunas`, `Sebagian`, `Belum`, `Lewat`
- **Class Snapshot**: bar chart siswa per kelas + absensi hari ini per kelas
- **Upcoming Schedule / Tasks**: agenda ringkas hari ini dan tugas tertunda

### 3. Actionable Cards

- Siswa alpa hari ini → CTA ke `/absensi?status=alpa`
- Tagihan jatuh tempo 7 hari → CTA ke `/spp?status=belum`
- Invoice overdue → CTA ke `/spp?status=lewat`
- PPDB menunggu follow-up → CTA ke `/admissions`

### 4. Quick Actions Tetap Ada

Tetap pertahankan:

- Input Absensi
- Buat Tagihan
- Kirim Pengumuman
- Tambah Siswa
- Reminder SPP

Tapi desainnya dibuat dark/glass agar tidak ada panel putih mencolok di dark mode.

---

## Data Contract Baru

Endpoint existing:

- `GET /api/stats/dashboard`

Perlu menambahkan shape berikut tanpa merusak field lama:

```ts
type DashboardStats = {
  students: number
  teachers: number
  classes: number
  attendanceToday: {
    hadir: number
    izin: number
    sakit: number
    alpa: number
    total: number
  }
  sppThisMonth: {
    lunas: number
    belum: number
    sebagian: number
    lewat: number
    total: number
    period: string
    billedAmount: number
    paidAmount: number
    outstandingAmount: number
  }
  attendanceTrend: Array<{
    date: string
    hadir: number
    izin: number
    sakit: number
    alpa: number
    total: number
  }>
  classSnapshots: Array<{
    id: number
    name: string
    students: number
    hadirToday: number
    alpaToday: number
  }>
  financeRisks: {
    dueSoon: number
    overdue: number
    outstandingAmount: number
  }
  operationalRisks: {
    absentToday: number
    pendingAdmissions: number
    overdueTasks: number
  }
  upcomingSchedules: Array<{
    id: number
    className: string
    subjectName: string
    teacherName: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }>
}
```

---

## Implementation Tasks

### Task 1: Extend dashboard API with safe fallback fields

**Objective:** Tambah field analytics tanpa memecahkan UI lama.

**Files:**

- Modify: `server/src/routes/stats.ts`
- Verify: `npm run build --prefix server`

**Steps:**

1. Tambah query attendance 7 hari terakhir dari `attendance`.
2. Tambah query SPP current month dengan `SUM(amount)` / `paid_amount` sesuai schema yang tersedia.
3. Tambah query class snapshot: kelas + jumlah siswa + alpa/hadir hari ini.
4. Tambah finance risks: due soon 7 hari, overdue, outstanding.
5. Tambah operational risks: alpa hari ini, PPDB pending, tasks overdue.
6. Tambah upcoming schedules hari ini.
7. Pastikan semua `Number(... ?? 0)` agar null aman.
8. Build server.

**Acceptance:**

- Response lama tetap punya `students`, `teachers`, `classes`, `attendanceToday`, `sppThisMonth`.
- Response baru punya array analytics walau kosong.
- Tidak dump error SQL ke client.

### Task 2: Update frontend API types

**Objective:** TypeScript mengenali shape dashboard analytics baru.

**Files:**

- Modify: `web/src/lib/api.ts`
- Verify: `npm run build --prefix web`

**Steps:**

1. Perluas `DashboardStats` dengan field baru.
2. Jadikan field baru optional dulu kalau ingin backward-compatible saat API lama masih jalan.
3. Tambah helper kecil jika perlu untuk default empty arrays.

**Acceptance:**

- `DashboardPage.tsx` bisa membaca stats baru tanpa `any`.
- Build web tetap sukses.

### Task 3: Create reusable lightweight chart components

**Objective:** Buat chart tanpa dependency eksternal dulu.

**Files:**

- Create: `web/src/components/dashboard/MiniBarChart.tsx`
- Create: `web/src/components/dashboard/DonutChart.tsx`
- Create: `web/src/components/dashboard/StackedProgress.tsx`
- Create: `web/src/components/dashboard/RiskCard.tsx`

**Components:**

- `MiniBarChart`: SVG responsive untuk 7 data points.
- `DonutChart`: SVG circle dengan strokeDasharray.
- `StackedProgress`: horizontal multi-segment progress.
- `RiskCard`: card actionable dengan title, count, desc, CTA.

**Acceptance:**

- Dark mode high contrast.
- Mobile tidak overflow.
- Tidak pakai table untuk chart.

### Task 4: Redesign dashboard layout

**Objective:** Dashboard terlihat matang dan actionable.

**Files:**

- Modify: `web/src/pages/DashboardPage.tsx`

**Sections:**

1. Hero greeting + date + school/admin context.
2. KPI gradient cards.
3. Risk/action cards.
4. Attendance 7-day chart.
5. SPP donut/progress chart.
6. Class snapshot bar chart.
7. Upcoming schedule/tasks.
8. Quick actions glass card.

**Acceptance:**

- Desktop: 2-column analytics layout.
- Mobile: single column, chart readable, cards not clipped.
- Dark mode tidak punya white panel yang mencolok.
- CTA link jelas.

### Task 5: Improve empty states

**Objective:** Jika data belum ada, dashboard tetap berguna.

**Files:**

- Modify: `web/src/pages/DashboardPage.tsx`
- Possibly use existing: `web/src/components/UiState.tsx`

**Empty states:**

- Belum ada absensi → CTA Input Absensi.
- Belum ada SPP → CTA Generate Tagihan.
- Belum ada jadwal → CTA Jadwal.
- Belum ada kelas → CTA Kelas.

**Acceptance:**

- Tidak ada chart kosong yang membingungkan.
- User diberi langkah berikutnya.

### Task 6: Build and preview

**Objective:** Pastikan aman sebelum commit/deploy.

**Files:** none.

**Commands:**

```bash
cd /home/ubuntu/taka-school
npm run build
```

**Expected:**

- Server TypeScript build pass.
- Web TypeScript + Vite build pass.

**Manual QA:**

- Open `http://43.133.155.252:3000/dashboard` after preview/service refresh if approved.
- Check desktop screenshot.
- Check mobile width with browser devtools or responsive mode.
- Verify dark mode contrast.

---

## Design Notes

- Palette: keep navy/blue/cyan Taka style.
- Avoid pure white blocks in dark mode.
- Use emerald only for good/paid states; rose for risk/alpa/overdue; amber for warning.
- Charts should be simple, not noisy.
- Do not add `recharts` unless custom SVG becomes too limiting.

## Risks

- Schema table/column names may differ between old SPP and new finance invoice modules; inspect before writing SQL.
- Dashboard endpoint must remain fast; avoid expensive unindexed scans where possible.
- For demo data, charts should still look realistic.

## Done Criteria

- Dashboard clearly shows trends and risks.
- Admin has immediate actions from risk cards.
- Build passes.
- No commit/push until Umar approves.
