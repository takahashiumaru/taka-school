# Taka School PAUD–SMA Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task only after Umar approves execution. This is planning-only; do not code from this document without explicit approval.

**Goal:** Transform Taka School into a polished multi-jenjang school management platform usable for PAUD, TK, SD, SMP, and SMA with strong mobile UI, safe data model, and scalable program logic.

**Architecture:** Build the foundation first: academic structure, roles, student/guardian profiles, then academics, finance, portals, and reports. Each phase must be implemented in small vertical slices: database/schema, API logic, UI, validation, tests, and production verification. Keep existing Express + Vite React structure unless a future decision explicitly migrates the stack.

**Tech Stack:** React + Vite + TypeScript frontend, Express + TypeScript backend, MySQL database, current systemd deployment on port 3000.

---

## Current Context / Assumptions

- Repo path: `/home/ubuntu/taka-school`.
- Service: `taka-school.service`, port `3000`.
- Existing app already has: auth, dashboard, siswa, guru, kelas, absensi, SPP, pengumuman, jadwal, galeri, rapor, basic uploads.
- Recent GitHub features merged: dark mode, `ThemeProvider`, `Select`, `MonthPicker`, database-backed upload changes.
- Recent local UX improvements exist: quick actions, reusable UI states, confirmation dialogs, mobile admin sidebar-only approach.
- User wants planning first, no direct implementation yet.

---

## Product Direction

Taka School should support two different school patterns:

1. **Early childhood mode:** PAUD/TK needs child development reports, daily reports, pickup safety, parent communication, photos, and health notes.
2. **Formal academic mode:** SD/SMP/SMA needs subjects, schedules, attendance, grades, report cards, graduation, finance, and academic history.

The system should not hardcode only SD/SMP/SMA. It should use a flexible `educationLevel`/`gradeLevel` structure so PAUD/TK can exist cleanly without fake class numbers.

---

# Phase 0 — Stabilization Before Big Features

## Objective

Make current repo safe to continue development.

## Tasks

### Task 0.1: Save current local changes cleanly

**Objective:** Avoid losing VPS-only UX fixes and merged GitHub changes.

**Files:**
- Inspect: all modified files from `git status`.

**Steps:**
1. Review current modified files.
2. Confirm no secrets are staged.
3. Create a local commit for the merge/UX state, or ask Umar whether to push to GitHub.
4. Keep `server/.env` uncommitted.

**Verification:**
- `git status --short` shows expected clean or intentional changes only.
- `git remote -v` shows clean URL without token.

### Task 0.2: Baseline test/build checklist

**Objective:** Define the commands every future phase must pass.

**Commands:**
- `npm run build`
- `curl -fsS http://127.0.0.1:3000/api/health`
- Manual smoke test on dashboard, siswa, absensi, SPP.

**Acceptance:**
- Build passes.
- Health returns DB up.
- Frontend returns 200.

---

# Phase 1 — Core Multi-Jenjang Foundation

## Goal

Allow one school to manage PAUD, TK, SD, SMP, and SMA without breaking academic, finance, or reporting logic.

## Data Model Plan

Likely new/updated entities:

- `education_levels`
  - `id`
  - `code`: `paud`, `tk`, `sd`, `smp`, `sma`
  - `name`
  - `sort_order`
  - `is_active`

- `grade_levels`
  - `id`
  - `education_level_id`
  - `code`: `paud-a`, `tk-a`, `1`, `7`, `10`, etc.
  - `name`: `PAUD A`, `TK A`, `Kelas 1`, `Kelas 10`
  - `sort_order`

- `academic_years`
  - `id`
  - `name`: `2026/2027`
  - `starts_on`
  - `ends_on`
  - `is_active`

- `semesters`
  - `id`
  - `academic_year_id`
  - `name`: `Ganjil`, `Genap`
  - `starts_on`
  - `ends_on`
  - `is_active`

- Update `classes`
  - add `education_level_id`
  - add `grade_level_id`
  - add `academic_year_id`
  - add `homeroom_teacher_id`
  - add `major_id` nullable for SMA

- `majors`
  - `id`
  - `education_level_id` usually SMA
  - `name`: IPA, IPS, Bahasa, Agama, Custom
  - `is_active`

## UI Plan

### Admin settings pages

Create settings area:

- `/settings/academic-years`
- `/settings/education-levels`
- `/settings/classes`
- `/settings/majors`

Mobile UI:
- Use card list instead of wide tables on small screens.
- Add filter chips: PAUD, TK, SD, SMP, SMA.
- Keep sidebar/hamburger; no bottom nav for admin.

Desktop UI:
- Use compact tables with actions.
- Add breadcrumbs and page descriptions.

## Logic Rules

- Only one active academic year at a time.
- Only one active semester per active academic year.
- PAUD/TK classes do not require major.
- SMA classes may optionally require major depending on setting.
- Class names should be generated but editable: `TK A`, `1A`, `10 IPA 1`.

## Acceptance Criteria

- Admin can create/edit education levels, grade levels, years, semesters, classes, and SMA majors.
- Existing students can still load after migration.
- Dashboard can filter or summarize by education level.
- Build and health check pass.

---

# Phase 2 — Student & Guardian Profile Upgrade

## Goal

Make student records useful for all ages, especially PAUD/TK where parent and health data matter.

## Data Model Plan

Update `students`:
- `nis`
- `nisn`
- `nickname`
- `birth_place`
- `birth_date`
- `religion`
- `address`
- `photo_url`
- `blood_type`
- `allergies`
- `medical_notes`
- `emergency_contact_name`
- `emergency_contact_phone`
- `status`: active, graduated, transferred, inactive

New `guardians`:
- `student_id`
- `relation`: father, mother, guardian
- `name`
- `phone`
- `whatsapp`
- `email`
- `occupation`
- `address`
- `is_primary`

New `student_documents`:
- `student_id`
- `type`: birth_certificate, family_card, previous_certificate, parent_id, other
- `file_id` or `url`
- `verified_at`

## UI Plan

Student profile should become tabbed:

- **Biodata**
- **Orang Tua/Wali**
- **Kesehatan**
- **Dokumen**
- **Riwayat Kelas**

Mobile:
- Use segmented tabs or horizontal scroll chips.
- Forms split into small sections.
- Sticky save button at bottom of form content, not fixed over browser chrome.

## Logic Rules

- Primary guardian must exist for PAUD/TK students.
- Emergency contact should be required for PAUD/TK, optional for older levels.
- NISN optional for PAUD/TK.
- Document upload should validate file types and size.

## Acceptance Criteria

- Admin can create a PAUD student without NISN but with guardian/contact data.
- Admin can create SMA student with NIS/NISN and class/major.
- Student detail page is usable on mobile.

---

# Phase 3 — Role & Permission System

## Goal

Make the app safe for real schools by separating admin, headmaster, staff, teacher, homeroom teacher, parent, and student access.

## Roles

- `super_admin` optional future SaaS role
- `admin`
- `headmaster`
- `staff`
- `teacher`
- `homeroom_teacher`
- `parent`
- `student`

## Permission Examples

- Admin: full school data.
- Staff: student and finance management, no system settings unless allowed.
- Teacher: own schedule, attendance, grades for assigned classes/subjects.
- Homeroom teacher: class students, attendance recap, report notes.
- Parent: own children only.
- Student: own profile, schedule, grades, announcements.

## UI Plan

- Hide menu items based on permissions.
- Show role badge in sidebar/profile.
- Add unauthorized page with friendly message.

## Logic Rules

- Backend must enforce permissions; frontend hiding alone is not enough.
- Parent/student routes must filter by linked student IDs.
- Audit log should capture destructive actions.

## Acceptance Criteria

- Teacher cannot access finance settings.
- Parent cannot access other students.
- Admin can assign user roles.

---

# Phase 4 — Academic System

## Goal

Build subject, schedule, attendance, grade, and report foundations.

## Entities

- `subjects`
- `teacher_subject_assignments`
- `class_schedules`
- `attendance_sessions`
- `attendance_records`
- `assessment_types`
- `grade_entries`
- `report_cards`

## PAUD/TK Difference

PAUD/TK should not force numeric grades. Use development indicators:

- Motorik kasar
- Motorik halus
- Bahasa
- Sosial emosional
- Kognitif
- Seni
- Agama/moral

Possible entity:

- `development_aspects`
- `development_indicators`
- `development_observations`

## UI Plan

### SD/SMP/SMA academic UI

- Subject page
- Schedule page with weekly grid
- Attendance per class/mapel
- Grade input spreadsheet-style
- Report card preview and PDF

### PAUD/TK UI

- Daily report
- Development checklist
- Photo activity gallery
- Teacher notes
- Parent-friendly report preview

## Logic Rules

- SD/SMP/SMA can use numeric grades and weighted assessment.
- PAUD/TK uses observation level: belum berkembang, mulai berkembang, berkembang sesuai harapan, berkembang sangat baik.
- Attendance can be daily for all, per-subject only for SMP/SMA or configurable.

## Acceptance Criteria

- Admin can configure subjects per level.
- Teacher can input grades or observations according to level type.
- Report preview differs between PAUD/TK and SD/SMP/SMA.

---

# Phase 5 — Finance System Upgrade

## Goal

Upgrade SPP into complete school billing.

## Entities

- `fee_types`: SPP, registration, uniform, book, exam, activity, catering, transport
- `fee_rules`: level/class-based fee amount
- `invoices`
- `invoice_items`
- `payments`
- `payment_methods`
- `discounts`
- `late_fees`

## UI Plan

- Finance dashboard
- Generate monthly SPP
- Create custom invoice
- Payment recording modal
- Invoice PDF preview
- Receipt PDF preview
- Overdue list
- WhatsApp reminder draft

## Logic Rules

- One invoice can have multiple items.
- SPP can be generated per level/class/student.
- Discount can be fixed amount or percentage.
- Payments can be partial.
- Invoice status: unpaid, partial, paid, overdue, cancelled.

## Acceptance Criteria

- Admin can generate SPP for TK A and SMA 10 IPA separately.
- Admin can record partial payment.
- Parent can see own child's unpaid invoice.
- PDF invoice/receipt can be downloaded.

---

# Phase 6 — Parent, Teacher, and Student Portals

## Goal

Create role-specific experiences instead of one admin UI for everyone.

## Portal Pages

### Parent portal

- Child switcher
- Attendance summary
- Invoices and payment history
- Announcements
- Daily report for PAUD/TK
- Grades/report cards for SD/SMP/SMA
- Online permission request

### Teacher portal

- Today schedule
- My classes
- Attendance input
- Grade input
- Daily report input for PAUD/TK
- Homeroom dashboard

### Student portal

- Schedule
- Assignments
- Grades
- Announcements
- Digital student card

## UI Plan

- Parent/student portals should be mobile-first.
- Teacher portal should optimize fast classroom input.
- Admin dashboard stays sidebar-based.

## Acceptance Criteria

- Parent sees only their children.
- Teacher sees only assigned classes/subjects.
- Student portal can be disabled for PAUD/TK/early SD.

---

# Phase 7 — PPDB / Admissions

## Goal

Allow schools to collect new student applications online.

## Flow

- Public PPDB landing/form
- Applicant creates submission
- Upload documents
- Admin verification
- Interview/test status
- Accepted/rejected/waitlisted
- Registration invoice
- Convert applicant to student

## UI Plan

- Public mobile-friendly form.
- Admin kanban pipeline.
- Applicant detail drawer.

## Acceptance Criteria

- New PAUD/TK/SD/SMP/SMA applicants can register.
- Admin can verify documents and convert accepted applicant to student.

---

# Phase 8 — Communication & WhatsApp

## Goal

Make communication structured and reusable.

## Features

- Announcements by school/level/class/role.
- WhatsApp templates.
- Reminder SPP.
- Absence notification.
- Report card published notification.
- Parent-teacher message thread optional later.

## Logic Rules

- Do not send bulk messages accidentally. Start with draft/copy-to-WhatsApp.
- Add delivery integration only after templates and targeting are stable.

## Acceptance Criteria

- Admin can target announcement to TK B only.
- Admin can generate reminder message for unpaid invoice.

---

# Phase 9 — Reports, Export, and PDFs

## Goal

Make the system useful for real school administration.

## Reports

- Student list by level/class
- Attendance daily/monthly/semester
- Payment summary
- Outstanding invoices
- Grade recap
- Report cards
- Teacher schedule
- PPDB applicants

## Export Formats

- PDF
- Excel
- CSV
- Print-friendly page

## Acceptance Criteria

- Admin can export unpaid SPP by class.
- Homeroom teacher can export attendance recap.
- Report cards use school logo and profile.

---

# Phase 10 — AI Features

## Goal

Add AI only after core data is reliable.

## AI Features

- AI report description generator.
- AI announcement writer.
- AI attendance insight.
- AI finance insight.
- AI student follow-up suggestions.

## Safety Rules

- AI must not directly overwrite official data without user confirmation.
- Generated text must be editable.
- Do not send private student data to external AI unless configured and disclosed.

## Acceptance Criteria

- Teacher can generate draft report note and edit before saving.
- Admin can ask finance summary questions from existing data.

---

# UI/UX Design System Plan

## Visual Direction

- Keep current navy/blue/cyan glass style.
- Dark mode must not use white cards.
- Green only for success/WhatsApp/accent, not main theme.
- Mobile admin uses sidebar/hamburger, not bottom nav.

## Component Standards

Build/reuse:

- `Select`
- `MonthPicker`
- `ConfirmDialog`
- `AlertBox`
- `EmptyState`
- `TableSkeleton`
- `CardSkeleton`
- `DataTable`
- `MobileCardList`
- `PageHeader`
- `FilterBar`
- `StatCard`
- `FormSection`
- `StickyFormActions`

## Mobile Rules

- Avoid horizontal table overflow where possible; use cards for core pages.
- Large tap targets: minimum 44px height.
- No destructive action without confirmation.
- Forms should be grouped in clear sections.
- Avoid fixed elements overlapping iPhone Safari bottom toolbar.

## Desktop Rules

- Use dense but readable admin tables.
- Keep filters above table.
- Right-side drawer/modals for quick edit where appropriate.
- Breadcrumbs for deep settings pages.

---

# Backend Logic Standards

## API Shape

Prefer consistent responses:

```json
{ "ok": true, "data": {} }
```

Errors:

```json
{ "ok": false, "error": "Human-readable message" }
```

## Validation

- Validate all POST/PUT/PATCH bodies.
- Do not trust frontend role/IDs.
- Normalize phone numbers for WhatsApp.
- Validate file uploads.

## Audit Log

Track:

- actor user id
- action
- entity type
- entity id
- before/after summary
- timestamp

Start audit log before finance and grades become complex.

---

# Testing Strategy

## Unit Tests

Target pure logic:

- academic year active selection
- class name generation
- invoice status calculation
- grade final calculation
- attendance summary

## API Tests

Target:

- permissions
- CRUD validation
- finance operations
- parent/student data isolation

## Build Verification

Every phase must pass:

- `npm run build`
- app health check
- representative API endpoint check
- mobile screenshot/manual QA for changed pages

---

# Risks & Tradeoffs

## Risk 1: Overbuilding too many modules at once

Mitigation: implement phases sequentially and ship vertical slices.

## Risk 2: PAUD/TK and SMA needs conflict

Mitigation: model `education_level` and `assessment_mode` early so UI/logic can branch cleanly.

## Risk 3: Permissions added late can leak data

Mitigation: add role/permission system before parent/student portals.

## Risk 4: Reports/PDF become messy

Mitigation: define templates and school profile settings before generating official documents.

## Risk 5: Mobile admin becomes cramped

Mitigation: use mobile card lists and sectioned forms rather than forcing desktop tables.

---

# Recommended Execution Order

1. Phase 0: stabilize repo and commit current safe baseline.
2. Phase 1: multi-jenjang foundation.
3. Phase 2: student/guardian profiles.
4. Phase 3: roles and permissions.
5. Phase 4A: subject/schedule/attendance foundation.
6. Phase 4B: grades and PAUD/TK development observations.
7. Phase 5: finance upgrade.
8. Phase 6: portals.
9. Phase 7: PPDB.
10. Phase 8: communication.
11. Phase 9: reports/PDF/export.
12. Phase 10: AI features.

---

# First Implementation Package Recommendation

Do not start with all phases. Start with this package:

## Package A — Core Multi-Jenjang + Better Student Data

Includes:

- Education levels PAUD/TK/SD/SMP/SMA.
- Academic year and semester.
- Grade levels.
- Class structure update.
- SMA majors.
- Student profile tabs.
- Guardian and emergency contact.
- Mobile-friendly UI for class/student management.

Why first:

- It unlocks every later feature.
- It prevents ugly data hacks.
- It makes the product truly usable from PAUD to SMA.

## Package A Acceptance Criteria

- Admin can create class `TK A`, `Kelas 1A`, `Kelas 7A`, and `10 IPA 1`.
- Admin can assign students to those classes.
- Student profile supports guardian and health data.
- Existing dashboard, siswa, absensi, and SPP still work.
- Build passes and service runs on port 3000.

---

# Open Questions for Umar

Before coding Package A, decide:

1. Taka School ini untuk **satu sekolah dulu** atau langsung **multi sekolah/SaaS**?
2. Apakah PAUD/TK wajib punya **daily report ke orang tua** di tahap awal?
3. Untuk SMA, jurusan awal cukup **IPA/IPS/Bahasa** atau harus bisa custom?
4. Mau role parent/student dibuat di awal, atau setelah admin+guru stabil?
5. Mau PDF rapor dan invoice pakai desain resmi sekolah dari awal, atau nanti setelah data model stabil?

---

# Definition of Done Per Phase

A phase is done only when:

- Database/schema migration safe.
- Backend API validates input.
- Frontend UI handles loading/error/empty states.
- Mobile layout checked.
- Dark mode checked.
- Permissions considered.
- `npm run build` passes.
- Service restart and health check pass.
- Short summary added to docs/changelog or commit message.
