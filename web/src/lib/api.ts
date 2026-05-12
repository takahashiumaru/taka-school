export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) || ""

const TOKEN_KEY = "takaschool.token"
const USER_KEY = "takaschool.user"

export type AuthUser = {
  id: number
  name: string
  email: string
  role: "admin" | "staff" | "teacher" | "guru" | "headmaster" | "parent" | "student"
  schoolId: number
  schoolName: string
}

export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  items: T[]
  pagination: PaginationMeta
}

export type PaginationParams = {
  page?: number
  pageSize?: number
}

export function buildPaginationQuery(params: PaginationParams): URLSearchParams {
  const q = new URLSearchParams()
  if (params.page) q.set("page", String(params.page))
  if (params.pageSize) q.set("pageSize", String(params.pageSize))
  return q
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers["X-Auth-Token"] = token
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const text = await res.text()
  const data: unknown = text ? safeJsonParse(text) : null

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ||
      `Request gagal (${res.status})`
    throw new ApiError(message, res.status, data)
  }
  return data as T
}

function safeJsonParse(t: string): unknown {
  try {
    return JSON.parse(t)
  } catch {
    return t
  }
}

export async function downloadApiFile(path: string, filename: string) {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers["X-Auth-Token"] = token
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, { headers })
  if (!res.ok) throw new ApiError(`Download gagal (${res.status})`, res.status)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function uploadCsv(path: string, csv: string) {
  return apiFetch<{ ok: true; created: number; updated?: number; skipped: number }>(path, {
    method: "POST",
    body: JSON.stringify({ csv }),
  })
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const token = getToken()
  const fd = new FormData()
  fd.append("file", file)
  const headers: Record<string, string> = {}
  if (token) {
    headers["X-Auth-Token"] = token
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: "POST",
    headers,
    body: fd,
  })
  const text = await res.text()
  const data: unknown = text ? safeJsonParse(text) : null
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error || `Upload gagal (${res.status})`
    throw new ApiError(message, res.status, data)
  }
  return data as { url: string }
}

export type LoginResponse = { token: string; user: AuthUser }

export async function login(email: string, password: string) {
  const res = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  saveAuth(res.token, res.user)
  return res
}

export async function registerSchool(input: {
  schoolName: string
  adminName: string
  email: string
  password: string
  phone?: string
}) {
  const res = await apiFetch<LoginResponse>("/api/auth/register-school", {
    method: "POST",
    body: JSON.stringify(input),
  })
  saveAuth(res.token, res.user)
  return res
}

export type DashboardStats = {
  students: number
  teachers: number
  classes: number
  attendanceToday: {
    hadir: number
    izin: number
    sakit: number
    alpa: number
    total: number
    rate?: number
  }
  sppThisMonth: {
    lunas: number
    belum: number
    total: number
    period: string
    nominal?: number
    terbayar?: number
    rate?: number
  }
  attendanceTrend?: Array<{
    date: string
    label: string
    hadir: number
    izin: number
    sakit: number
    alpa: number
    total: number
    rate: number
  }>
  classAttention?: Array<{
    id: number
    name: string
    students: number
    hadir: number
    alpa: number
    sppBelum: number
    attendanceRate: number
    status: "aman" | "pantau" | "perlu_perhatian"
  }>
  todayAgenda?: Array<{
    id: number
    time: string
    subject: string
    className: string
    teacherName: string | null
  }>
  insights?: {
    todayAttendanceRate: number
    sppCompletionRate: number
    unpaidSpp: number
    absentToday: number
  }
}

export async function fetchDashboard() {
  return apiFetch<DashboardStats>("/api/stats/dashboard")
}

export type Guardian = {
  id?: number
  student_id?: number
  relation: string | null
  name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  occupation: string | null
  address: string | null
  is_primary?: number
}

export type Student = {
  id: number
  school_id: number
  class_id: number | null
  class_name: string | null
  nis: string | null
  nisn: string | null
  nickname: string | null
  name: string
  gender: "L" | "P" | null
  birth_place: string | null
  birth_date: string | null
  religion: string | null
  parent_name: string | null
  parent_wa: string | null
  address: string | null
  blood_type: string | null
  allergies: string | null
  medical_notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  status: "aktif" | "lulus" | "keluar"
  photo_url: string | null
  guardians?: Guardian[]
  created_at: string
}

export type Teacher = {
  id: number
  school_id: number
  name: string
  email: string
  role: "guru" | "admin"
  is_active: number
  created_at: string
}

export type EducationLevel = { id: number; code: string; name: string; sort_order: number; is_active: number }
export type GradeLevel = { id: number; education_level_id: number; education_level_name?: string; code: string; name: string; sort_order: number; is_active: number }
export type AcademicYear = { id: number; name: string; start_date: string | null; end_date: string | null; is_active: number }
export type Semester = { id: number; academic_year_id: number; academic_year_name?: string; name: string; sort_order: number; start_date?: string | null; end_date?: string | null; is_active: number }
export type Major = { id: number; education_level_id: number; education_level_name?: string; name: string; is_active: number }
export type Subject = { id: number; education_level_id: number | null; education_level_name?: string | null; code: string | null; name: string; description: string | null; is_active: number }
export type TeacherSubject = { id: number; teacher_id: number; subject_id: number; class_id: number | null; teacher_name: string; subject_name: string; class_name: string | null }
export type ClassSubject = { id: number; class_id: number; subject_id: number; teacher_id: number | null; class_name: string; subject_name: string; teacher_name: string | null }

export type Klass = {
  id: number
  school_id: number
  education_level_id: number | null
  grade_level_id: number | null
  academic_year_id: number | null
  major_id: number | null
  name: string
  grade_level: string | null
  education_level_name?: string | null
  grade_level_name?: string | null
  academic_year_name?: string | null
  major_name?: string | null
  homeroom_teacher_id: number | null
  teacher_name: string | null
  student_count: number
  created_at: string
}

export type Schedule = {
  id: number
  school_id: number
  class_id: number
  class_name: string | null
  day_of_week: number
  start_time: string
  end_time: string
  subject: string
  teacher_id: number | null
  teacher_name: string | null
}

export type Announcement = {
  id: number
  school_id: number
  author_id: number | null
  author_name: string | null
  title: string
  body: string
  target_class_id: number | null
  class_name: string | null
  created_at: string
}

export type Gallery = {
  id: number
  school_id: number
  title: string
  description: string | null
  cover_url: string | null
  event_date: string | null
  photo_count: number
  created_at: string
}

export type GalleryItem = {
  id: number
  gallery_id: number
  photo_url: string
  caption: string | null
  created_at: string
}

export type SppInvoice = {
  id: number
  school_id: number
  student_id: number
  student_name: string
  parent_name: string | null
  parent_wa: string | null
  class_id: number | null
  class_name: string | null
  period: string
  amount: number
  due_date: string
  status: "belum" | "sebagian" | "lunas" | "lewat"
  paid_amount: number
  paid_at: string | null
  method: "cash" | "transfer" | "lain" | null
  note: string | null
  created_at: string
}

export type AttendanceEntry = {
  id: number
  name: string
  nis: string | null
  status: "hadir" | "izin" | "sakit" | "alpa"
  note: string | null
}

export type Report = {
  id: number
  school_id: number
  student_id: number
  student_name: string
  class_name: string | null
  semester: string
  body: string
  created_at: string
  updated_at: string
}

export type AssessmentType = { id: number; name: string; weight: number; is_active: number }
export type GradeEntry = { id: number; student_id: number; student_name: string; class_name: string | null; subject_id: number | null; subject_name: string | null; assessment_type_id: number | null; assessment_type_name: string | null; semester_label: string | null; score: number; note: string | null; assessed_at: string | null }
export type PaudAspect = { id: number; name: string; description: string | null; sort_order: number; is_active: number }
export type PaudIndicator = { id: number; aspect_id: number; aspect_name: string; description: string; sort_order: number; is_active: number }
export type PaudObservation = { id: number; student_id: number; student_name: string; aspect_id: number | null; aspect_name: string | null; indicator_id: number | null; indicator_description: string | null; semester_label: string | null; observation: string; level: "BB" | "MB" | "BSH" | "BSB" | null; observed_at: string | null }
export type ReportCard = { id: number; student_id: number; student_name: string; class_name: string | null; semester_label: string; status: "draft" | "published"; summary: string | null; updated_at: string }

export const Students = {
  list: (params?: { q?: string; classId?: number; status?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams()
    if (params?.q) q.set("q", params.q)
    if (params?.classId) q.set("classId", String(params.classId))
    if (params?.status) q.set("status", params.status)
    if (params?.page) q.set("page", String(params.page))
    if (params?.pageSize) q.set("pageSize", String(params.pageSize))
    const s = q.toString()
    return apiFetch<PaginatedResponse<Student>>(`/api/students${s ? `?${s}` : ""}`)
  },
  get: (id: number) => apiFetch<Student>(`/api/students/${id}`),
  create: (data: Partial<Student> & { name: string; classId?: number | null; parentWa?: string | null; parentName?: string | null; nis?: string | null; gender?: "L" | "P" | null; birthDate?: string | null; address?: string | null; photoUrl?: string | null; status?: "aktif" | "lulus" | "keluar" }) =>
    apiFetch<{ id: number }>(`/api/students`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    apiFetch<{ ok: true }>(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<{ ok: true }>(`/api/students/${id}`, { method: "DELETE" }),
}

export const Teachers = {
  list: (params?: { q?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams()
    if (params?.q) q.set("q", params.q)
    if (params?.page) q.set("page", String(params.page))
    if (params?.pageSize) q.set("pageSize", String(params.pageSize))
    const s = q.toString()
    return apiFetch<PaginatedResponse<Teacher>>(`/api/teachers${s ? `?${s}` : ""}`)
  },
  create: (data: { name: string; email: string; password: string }) =>
    apiFetch<{ id: number }>(`/api/teachers`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; email: string; password: string; isActive: boolean }>) =>
    apiFetch<{ ok: true }>(`/api/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/teachers/${id}`, { method: "DELETE" }),
}

export const Classes = {
  list: (params?: { educationLevelId?: number; gradeLevelId?: number; academicYearId?: number; majorId?: number }) => {
    const q = new URLSearchParams()
    if (params?.educationLevelId) q.set("educationLevelId", String(params.educationLevelId))
    if (params?.gradeLevelId) q.set("gradeLevelId", String(params.gradeLevelId))
    if (params?.academicYearId) q.set("academicYearId", String(params.academicYearId))
    if (params?.majorId) q.set("majorId", String(params.majorId))
    const s = q.toString()
    return apiFetch<{ items: Klass[] }>(`/api/classes${s ? `?${s}` : ""}`)
  },
  get: (id: number) => apiFetch<Klass & { students: Pick<Student, "id" | "nis" | "nisn" | "name" | "gender" | "status">[] }>(`/api/classes/${id}`),
  create: (data: { name: string; gradeLevel?: string | null; educationLevelId?: number | null; gradeLevelId?: number | null; academicYearId?: number | null; majorId?: number | null; homeroomTeacherId?: number | null }) =>
    apiFetch<{ id: number }>(`/api/classes`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; gradeLevel: string | null; educationLevelId: number | null; gradeLevelId: number | null; academicYearId: number | null; majorId: number | null; homeroomTeacherId: number | null }>) =>
    apiFetch<{ ok: true }>(`/api/classes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/classes/${id}`, { method: "DELETE" }),
}

export const Academic = {
  metadata: () => apiFetch<{ educationLevels: EducationLevel[]; gradeLevels: GradeLevel[]; academicYears: AcademicYear[]; semesters: Semester[]; majors: Major[]; subjects: Subject[]; teacherSubjects: TeacherSubject[]; classSubjects: ClassSubject[] }>(`/api/academic/metadata`),
  createEducationLevel: (data: { code: string; name: string; sortOrder?: number; isActive?: boolean }) => apiFetch<{ id: number }>(`/api/academic/education-levels`, { method: "POST", body: JSON.stringify(data) }),
  updateEducationLevel: (id: number, data: Partial<{ code: string; name: string; sortOrder: number; isActive: boolean }>) => apiFetch<{ ok: true }>(`/api/academic/education-levels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEducationLevel: (id: number) => apiFetch<{ ok: true }>(`/api/academic/education-levels/${id}`, { method: "DELETE" }),
  createGradeLevel: (data: { educationLevelId: number; code: string; name: string; sortOrder?: number; isActive?: boolean }) => apiFetch<{ id: number }>(`/api/academic/grade-levels`, { method: "POST", body: JSON.stringify(data) }),
  updateGradeLevel: (id: number, data: Partial<{ educationLevelId: number; code: string; name: string; sortOrder: number; isActive: boolean }>) => apiFetch<{ ok: true }>(`/api/academic/grade-levels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteGradeLevel: (id: number) => apiFetch<{ ok: true }>(`/api/academic/grade-levels/${id}`, { method: "DELETE" }),
  createAcademicYear: (data: { name: string; startDate?: string | null; endDate?: string | null; isActive?: boolean }) => apiFetch<{ id: number }>(`/api/academic/academic-years`, { method: "POST", body: JSON.stringify(data) }),
  updateAcademicYear: (id: number, data: Partial<{ name: string; startDate: string | null; endDate: string | null; isActive: boolean }>) => apiFetch<{ ok: true }>(`/api/academic/academic-years/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  activateAcademicYear: (id: number) => apiFetch<{ ok: true }>(`/api/academic/academic-years/${id}/activate`, { method: "PUT" }),
  deleteAcademicYear: (id: number) => apiFetch<{ ok: true }>(`/api/academic/academic-years/${id}`, { method: "DELETE" }),
  createSemester: (data: { academicYearId: number; name: string; sortOrder?: number; startDate?: string | null; endDate?: string | null; isActive?: boolean }) => apiFetch<{ id: number }>(`/api/academic/semesters`, { method: "POST", body: JSON.stringify(data) }),
  activateSemester: (id: number) => apiFetch<{ ok: true }>(`/api/academic/semesters/${id}/activate`, { method: "PUT" }),
  deleteSemester: (id: number) => apiFetch<{ ok: true }>(`/api/academic/semesters/${id}`, { method: "DELETE" }),
  createMajor: (data: { educationLevelId: number; name: string; isActive?: boolean }) => apiFetch<{ id: number }>(`/api/academic/majors`, { method: "POST", body: JSON.stringify(data) }),
  updateMajor: (id: number, data: Partial<{ educationLevelId: number; name: string; isActive: boolean }>) => apiFetch<{ ok: true }>(`/api/academic/majors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMajor: (id: number) => apiFetch<{ ok: true }>(`/api/academic/majors/${id}`, { method: "DELETE" }),
  createSubject: (data: { educationLevelId?: number | null; code?: string | null; name: string; description?: string | null; isActive?: boolean }) => apiFetch<{ id: number }>(`/api/academic/subjects`, { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (id: number, data: Partial<{ educationLevelId: number | null; code: string | null; name: string; description: string | null; isActive: boolean }>) => apiFetch<{ ok: true }>(`/api/academic/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubject: (id: number) => apiFetch<{ ok: true }>(`/api/academic/subjects/${id}`, { method: "DELETE" }),
  assignTeacherSubject: (data: { teacherId: number; subjectId: number; classId?: number | null }) => apiFetch<{ id: number }>(`/api/academic/teacher-subjects`, { method: "POST", body: JSON.stringify(data) }),
  deleteTeacherSubject: (id: number) => apiFetch<{ ok: true }>(`/api/academic/teacher-subjects/${id}`, { method: "DELETE" }),
  assignClassSubject: (data: { classId: number; subjectId: number; teacherId?: number | null }) => apiFetch<{ id: number }>(`/api/academic/class-subjects`, { method: "POST", body: JSON.stringify(data) }),
  deleteClassSubject: (id: number) => apiFetch<{ ok: true }>(`/api/academic/class-subjects/${id}`, { method: "DELETE" }),
}

export const Attendance = {
  get: (classId: number, date: string) =>
    apiFetch<{ classId: number; date: string; students: AttendanceEntry[] }>(
      `/api/attendance?classId=${classId}&date=${date}`,
    ),
  bulk: (data: { classId: number; date: string; entries: { studentId: number; status: string; note?: string | null }[] }) =>
    apiFetch<{ ok: true; count: number }>(`/api/attendance/bulk`, { method: "POST", body: JSON.stringify(data) }),
  recap: (params: { classId?: number; start: string; end: string }) => {
    const q = new URLSearchParams()
    if (params.classId) q.set("classId", String(params.classId))
    q.set("start", params.start)
    q.set("end", params.end)
    return apiFetch<{ items: { date: string; status: string; c: number }[] }>(`/api/attendance/recap?${q}`)
  },
}

export type FinanceInvoice = { id: number; invoice_no: string; student_id: number; student_name: string; parent_name: string | null; parent_wa: string | null; class_name: string | null; period: string | null; due_date: string; total_amount: number; paid_amount: number; status: "unpaid" | "partial" | "paid" | "overdue" | "cancelled"; note: string | null }
export type FeeType = { id: number; code: string; name: string; category: string; default_amount: number }
export type PaymentMethod = { id: number; code: string; name: string }

export const Finance = {
  meta: () => apiFetch<{ feeTypes: FeeType[]; paymentMethods: PaymentMethod[] }>(`/api/finance/meta`),
  summary: () => apiFetch<{ invoices: number; billed: number; paid: number; outstanding: number; overdue_count: number }>(`/api/finance/summary`),
  getInvoice: (id: number) => apiFetch<{ invoice: FinanceInvoice; items: any[]; payments: any[] }>(`/api/finance/invoices/${id}`),
  invoices: (params?: { period?: string; status?: string; classId?: number }) => {
    const q = new URLSearchParams()
    if (params?.period) q.set("period", params.period)
    if (params?.status) q.set("status", params.status)
    if (params?.classId) q.set("classId", String(params.classId))
    return apiFetch<{ items: FinanceInvoice[] }>(`/api/finance/invoices${q.toString() ? `?${q}` : ""}`)
  },
  generateSpp: (data: { classId?: number | null; period: string; amount: number; dueDate: string }) => apiFetch<{ ok: true; created: number; total: number }>(`/api/finance/generate-spp`, { method: "POST", body: JSON.stringify(data) }),
  pay: (id: number, data: { amount: number; paymentMethodId?: number | null; note?: string | null }) => apiFetch<{ ok: true; status: string }>(`/api/finance/invoices/${id}/payments`, { method: "POST", body: JSON.stringify(data) }),
}

export const Spp = {
  list: (params?: { period?: string; status?: string; classId?: number; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams()
    if (params?.period) q.set("period", params.period)
    if (params?.status) q.set("status", params.status)
    if (params?.classId) q.set("classId", String(params.classId))
    if (params?.page) q.set("page", String(params.page))
    if (params?.pageSize) q.set("pageSize", String(params.pageSize))
    const s = q.toString()
    return apiFetch<PaginatedResponse<SppInvoice>>(`/api/spp${s ? `?${s}` : ""}`)
  },
  get: (id: number) => apiFetch<SppInvoice>(`/api/spp/${id}`),
  create: (data: { studentId: number; period: string; amount: number; dueDate: string; note?: string | null }) =>
    apiFetch<{ id: number }>(`/api/spp`, { method: "POST", body: JSON.stringify(data) }),
  batch: (data: { classId?: number | null; period: string; amount: number; dueDate: string }) =>
    apiFetch<{ ok: true; created: number; total: number }>(`/api/spp/batch`, { method: "POST", body: JSON.stringify(data) }),
  pay: (id: number, data: { paidAmount: number; method?: "cash" | "transfer" | "lain" }) =>
    apiFetch<{ ok: true; status: string }>(`/api/spp/${id}/pay`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/spp/${id}`, { method: "DELETE" }),
}

export const Schedules = {
  list: (classId?: number) => {
    const q = classId ? `?classId=${classId}` : ""
    return apiFetch<{ items: Schedule[] }>(`/api/schedules${q}`)
  },
  create: (data: { classId: number; dayOfWeek: number; startTime: string; endTime: string; subject: string; teacherId?: number | null }) =>
    apiFetch<{ id: number }>(`/api/schedules`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ classId: number; dayOfWeek: number; startTime: string; endTime: string; subject: string; teacherId: number | null }>) =>
    apiFetch<{ ok: true }>(`/api/schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/schedules/${id}`, { method: "DELETE" }),
}

export const Announcements = {
  list: () => apiFetch<{ items: Announcement[] }>(`/api/announcements`),
  create: (data: { title: string; body: string; targetClassId?: number | null }) =>
    apiFetch<{ id: number }>(`/api/announcements`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ title: string; body: string; targetClassId: number | null }>) =>
    apiFetch<{ ok: true }>(`/api/announcements/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/announcements/${id}`, { method: "DELETE" }),
}

export const Galleries = {
  list: () => apiFetch<{ items: Gallery[] }>(`/api/galleries`),
  get: (id: number) => apiFetch<Gallery & { items: GalleryItem[] }>(`/api/galleries/${id}`),
  create: (data: { title: string; description?: string | null; coverUrl?: string | null; eventDate?: string | null }) =>
    apiFetch<{ id: number }>(`/api/galleries`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ title: string; description: string | null; coverUrl: string | null; eventDate: string | null }>) =>
    apiFetch<{ ok: true }>(`/api/galleries/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/galleries/${id}`, { method: "DELETE" }),
  addItem: (id: number, data: { photoUrl: string; caption?: string | null }) =>
    apiFetch<{ id: number }>(`/api/galleries/${id}/items`, { method: "POST", body: JSON.stringify(data) }),
  removeItem: (id: number, itemId: number) =>
    apiFetch<{ ok: true }>(`/api/galleries/${id}/items/${itemId}`, { method: "DELETE" }),
}

export const Reports = {
  list: (studentId?: number) => {
    const q = studentId ? `?studentId=${studentId}` : ""
    return apiFetch<{ items: Report[] }>(`/api/reports${q}`)
  },
  get: (id: number) => apiFetch<Report>(`/api/reports/${id}`),
  create: (data: { studentId: number; semester: string; body: string }) =>
    apiFetch<{ id: number }>(`/api/reports`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ semester: string; body: string }>) =>
    apiFetch<{ ok: true }>(`/api/reports/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/reports/${id}`, { method: "DELETE" }),
}

export type PortalTask = { id: number; title: string; due_date: string | null; status: string; class_name?: string | null; subject_name?: string | null }
export type PortalClass = { id: number; name: string; student_count?: number }
export type PortalInvoice = { id: number; student_id: number; student_name?: string; invoice_no: string; period: string | null; due_date: string; total_amount: number; paid_amount: number; status: string }

export const Portal = {
  teacher: () => apiFetch<{ schedule: Schedule[]; classes: PortalClass[]; tasks: PortalTask[]; announcements: Announcement[] }>(`/api/portal/teacher`),
  parent: () => apiFetch<{ children: Student[]; invoices: PortalInvoice[]; reports: ReportCard[]; announcements: Announcement[] }>(`/api/portal/parent`),
  student: () => apiFetch<{ student: Student | null; schedule: Schedule[]; tasks: PortalTask[]; grades: GradeEntry[]; announcements: Announcement[] }>(`/api/portal/student`),
}

export const Assessments = {
  metadata: () => apiFetch<{ assessmentTypes: AssessmentType[]; paudAspects: PaudAspect[]; paudIndicators: PaudIndicator[] }>(`/api/assessments/metadata`),
  listGrades: (studentId?: number) => apiFetch<{ items: GradeEntry[] }>(`/api/assessments/grades${studentId ? `?studentId=${studentId}` : ""}`),
  createType: (data: { name: string; weight?: number }) => apiFetch<{ id: number }>(`/api/assessments/types`, { method: "POST", body: JSON.stringify(data) }),
  createGrade: (data: { studentId: number; subjectId?: number | null; assessmentTypeId?: number | null; semesterLabel?: string | null; score: number; note?: string | null; assessedAt?: string | null }) => apiFetch<{ id: number }>(`/api/assessments/grades`, { method: "POST", body: JSON.stringify(data) }),
  deleteGrade: (id: number) => apiFetch<{ ok: true }>(`/api/assessments/grades/${id}`, { method: "DELETE" }),
  createPaudAspect: (data: { name: string; description?: string | null; sortOrder?: number }) => apiFetch<{ id: number }>(`/api/assessments/paud/aspects`, { method: "POST", body: JSON.stringify(data) }),
  createPaudIndicator: (data: { aspectId: number; description: string; sortOrder?: number }) => apiFetch<{ id: number }>(`/api/assessments/paud/indicators`, { method: "POST", body: JSON.stringify(data) }),
  listObservations: (studentId?: number) => apiFetch<{ items: PaudObservation[] }>(`/api/assessments/paud/observations${studentId ? `?studentId=${studentId}` : ""}`),
  createObservation: (data: { studentId: number; aspectId?: number | null; indicatorId?: number | null; semesterLabel?: string | null; observation: string; level?: "BB" | "MB" | "BSH" | "BSB" | null; observedAt?: string | null }) => apiFetch<{ id: number }>(`/api/assessments/paud/observations`, { method: "POST", body: JSON.stringify(data) }),
  deleteObservation: (id: number) => apiFetch<{ ok: true }>(`/api/assessments/paud/observations/${id}`, { method: "DELETE" }),
  listCards: () => apiFetch<{ items: ReportCard[] }>(`/api/assessments/report-cards`),
  createCard: (data: { studentId: number; semesterLabel: string; status?: "draft" | "published"; summary?: string | null }) => apiFetch<{ id: number }>(`/api/assessments/report-cards`, { method: "POST", body: JSON.stringify(data) }),
  previewCard: (id: number) => apiFetch<{ card: ReportCard; grades: GradeEntry[]; observations: PaudObservation[] }>(`/api/assessments/report-cards/${id}/preview`),
}

export type AdmissionStatus = "new" | "submitted" | "verifying" | "interview" | "accepted" | "rejected" | "waitlisted" | "enrolled"
export type Applicant = {
  id: number; school_id: number; student_id: number | null; academic_year: string | null; desired_class: string | null;
  name: string; gender: "L" | "P" | null; birth_place: string | null; birth_date: string | null; parent_name: string | null;
  parent_wa: string | null; address: string | null; previous_school: string | null; document_url: string | null;
  birth_certificate_url: string | null; family_card_url: string | null; payment_proof_url: string | null; registration_invoice_url: string | null;
  status: AdmissionStatus; interview_at: string | null; notes: string | null; submitted_at: string | null; created_at: string
}
export type ApplicantInput = Partial<{
  schoolId: number; academicYear: string | null; desiredClass: string | null; gender: "L" | "P" | null; birthPlace: string | null; birthDate: string | null;
  parentName: string | null; parentWa: string | null; address: string | null; previousSchool: string | null; documentUrl: string | null;
  birthCertificateUrl: string | null; familyCardUrl: string | null; paymentProofUrl: string | null; registrationInvoiceUrl: string | null; interviewAt: string | null; notes: string | null; status: AdmissionStatus
}> & { name: string }

export const Admissions = {
  publicCreate: (data: ApplicantInput) => apiFetch<{ id: number; status: AdmissionStatus }>(`/api/admissions/public`, { method: "POST", body: JSON.stringify(data) }),
  list: (params: { q?: string; status?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.status) qs.set("status", params.status)
    if (params.page) qs.set("page", String(params.page))
    if (params.pageSize) qs.set("pageSize", String(params.pageSize))
    return apiFetch<PaginatedResponse<Applicant>>(`/api/admissions${qs.toString() ? `?${qs}` : ""}`)
  },
  get: (id: number) => apiFetch<Applicant>(`/api/admissions/${id}`),
  update: (id: number, data: Partial<ApplicantInput>) => apiFetch<{ ok: true }>(`/api/admissions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  enroll: (id: number) => apiFetch<{ studentId: number }>(`/api/admissions/${id}/enroll`, { method: "POST" }),
}

export function waLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null
  const clean = phone.replace(/[^0-9]/g, "")
  if (!clean) return null
  const normalized = clean.startsWith("0") ? "62" + clean.slice(1) : clean
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}


export type OperationSummary = Record<string, any>
export const Operations = {
  summary: () => apiFetch<OperationSummary>(`/api/operations/summary`),
  library: () => apiFetch<{ items: any[] }>(`/api/operations/library-books`),
  inventory: () => apiFetch<{ items: any[] }>(`/api/operations/inventory`),
  extracurriculars: () => apiFetch<{ items: any[] }>(`/api/operations/extracurriculars`),
  counseling: () => apiFetch<{ items: any[] }>(`/api/operations/counseling`),
  letters: () => apiFetch<{ items: any[] }>(`/api/operations/letters`),
  createLibrary: (data: any) => apiFetch<{ id: number }>(`/api/operations/library-books`, { method: "POST", body: JSON.stringify(data) }),
  createInventory: (data: any) => apiFetch<{ id: number }>(`/api/operations/inventory`, { method: "POST", body: JSON.stringify(data) }),
  createExtracurricular: (data: any) => apiFetch<{ id: number }>(`/api/operations/extracurriculars`, { method: "POST", body: JSON.stringify(data) }),
  createCounseling: (data: any) => apiFetch<{ id: number }>(`/api/operations/counseling`, { method: "POST", body: JSON.stringify(data) }),
  createLetter: (data: any) => apiFetch<{ id: number }>(`/api/operations/letters`, { method: "POST", body: JSON.stringify(data) }),
}
