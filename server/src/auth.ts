import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import "dotenv/config"

const SECRET = process.env.JWT_SECRET || "dev-secret"

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret")) {
  throw new Error("JWT_SECRET wajib diset dengan nilai kuat di production.")
}

export const ROLES = ["admin", "staff", "teacher", "guru", "headmaster", "parent", "student"] as const
export type Role = (typeof ROLES)[number]

export type AuthUser = {
  id: number
  schoolId: number
  role: Role
  name: string
  email: string
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser
  }
}

export const ADMIN_ROLES: Role[] = ["admin"]
export const OFFICE_ROLES: Role[] = ["admin", "staff"]
export const STAFF_TEACHER_ROLES: Role[] = ["admin", "staff", "teacher", "guru"]
export const SCHOOL_READ_ROLES: Role[] = ["admin", "staff", "teacher", "guru", "headmaster"]
export const ALL_ROLES: Role[] = [...ROLES]

export function signToken(user: AuthUser) {
  return jwt.sign(user, SECRET, { expiresIn: "7d" })
}

export function normalizeRole(role: unknown): Role {
  return role === "guru" ? "teacher" : (role as Role)
}

export function requireAuth(roles?: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers["x-auth-token"]
    const xToken = Array.isArray(headerToken) ? headerToken[0] : headerToken
    const auth = req.headers.authorization || ""
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null
    const token = xToken || bearer
    if (!token) return res.status(401).json({ error: "Unauthorized" })
    try {
      const decoded = jwt.verify(token, SECRET) as AuthUser
      const decodedRole = normalizeRole(decoded.role)
      const allowed = roles?.map(normalizeRole)
      if (allowed && !allowed.includes(decodedRole)) {
        return res.status(403).json({ error: "Forbidden" })
      }
      req.user = { ...decoded, role: decodedRole }
      next()
    } catch {
      return res.status(401).json({ error: "Invalid token" })
    }
  }
}

export const requireRole = (...roles: Role[]) => requireAuth(roles)
export const requireAdmin = () => requireRole("admin")
export const requireOffice = () => requireRole("admin", "staff")
export const requireSchoolRead = () => requireRole("admin", "staff", "teacher", "guru", "headmaster")
