import type { AuthUser } from "./api"

export type Role = AuthUser["role"]
export const normalizeRole = (role: Role | "guru") => (role === "guru" ? "teacher" : role)

export const roleLabels: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  teacher: "Guru",
  guru: "Guru",
  headmaster: "Kepala Sekolah",
  parent: "Orang Tua",
  student: "Siswa",
}

export const can = {
  readSchoolData: (role: Role) => ["admin", "staff", "teacher", "guru", "headmaster"].includes(role),
  manageOfficeData: (role: Role) => ["admin", "staff"].includes(role),
  manageAdminData: (role: Role) => role === "admin",
}

export function hasAnyRole(user: AuthUser | null, roles?: Role[]) {
  if (!user) return false
  if (!roles?.length) return true
  const role = normalizeRole(user.role)
  return roles.map(normalizeRole).includes(role)
}
