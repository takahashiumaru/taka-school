export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) || ""

const TOKEN_KEY = "takaschool.token"
const USER_KEY = "takaschool.user"

export type AuthUser = {
  id: number
  name: string
  email: string
  role: "admin" | "guru"
  schoolId: number
  schoolName: string
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
  }
  sppThisMonth: { lunas: number; belum: number; total: number; period: string }
}

export async function fetchDashboard() {
  return apiFetch<DashboardStats>("/api/stats/dashboard")
}

export type Student = {
  id: number
  school_id: number
  class_id: number | null
  class_name: string | null
  nis: string | null
  name: string
  gender: "L" | "P" | null
  birth_date: string | null
  parent_name: string | null
  parent_wa: string | null
  address: string | null
  status: "aktif" | "lulus" | "keluar"
  photo_url: string | null
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

export type Klass = {
  id: number
  school_id: number
  name: string
  grade_level: string | null
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

export const Students = {
  list: (params?: { q?: string; classId?: number; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.q) q.set("q", params.q)
    if (params?.classId) q.set("classId", String(params.classId))
    if (params?.status) q.set("status", params.status)
    const s = q.toString()
    return apiFetch<{ items: Student[] }>(`/api/students${s ? `?${s}` : ""}`)
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
  list: () => apiFetch<{ items: Teacher[] }>(`/api/teachers`),
  create: (data: { name: string; email: string; password: string }) =>
    apiFetch<{ id: number }>(`/api/teachers`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; email: string; password: string; isActive: boolean }>) =>
    apiFetch<{ ok: true }>(`/api/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/teachers/${id}`, { method: "DELETE" }),
}

export const Classes = {
  list: () => apiFetch<{ items: Klass[] }>(`/api/classes`),
  create: (data: { name: string; gradeLevel?: string | null; homeroomTeacherId?: number | null }) =>
    apiFetch<{ id: number }>(`/api/classes`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; gradeLevel: string | null; homeroomTeacherId: number | null }>) =>
    apiFetch<{ ok: true }>(`/api/classes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/classes/${id}`, { method: "DELETE" }),
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

export const Spp = {
  list: (params?: { period?: string; status?: string; classId?: number }) => {
    const q = new URLSearchParams()
    if (params?.period) q.set("period", params.period)
    if (params?.status) q.set("status", params.status)
    if (params?.classId) q.set("classId", String(params.classId))
    const s = q.toString()
    return apiFetch<{ items: SppInvoice[] }>(`/api/spp${s ? `?${s}` : ""}`)
  },
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
  create: (data: { studentId: number; semester: string; body: string }) =>
    apiFetch<{ id: number }>(`/api/reports`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ semester: string; body: string }>) =>
    apiFetch<{ ok: true }>(`/api/reports/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<{ ok: true }>(`/api/reports/${id}`, { method: "DELETE" }),
}

export function waLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null
  const clean = phone.replace(/[^0-9]/g, "")
  if (!clean) return null
  const normalized = clean.startsWith("0") ? "62" + clean.slice(1) : clean
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
