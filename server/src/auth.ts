import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import "dotenv/config"

const SECRET = process.env.JWT_SECRET || "dev-secret"

export type AuthUser = {
  id: number
  schoolId: number
  role: "admin" | "guru"
  name: string
  email: string
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, SECRET, { expiresIn: "7d" })
}

export function requireAuth(roles?: Array<"admin" | "guru">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers["x-auth-token"]
    const xToken = Array.isArray(headerToken) ? headerToken[0] : headerToken
    const auth = req.headers.authorization || ""
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null
    const token = xToken || bearer
    if (!token) return res.status(401).json({ error: "Unauthorized" })
    try {
      const decoded = jwt.verify(token, SECRET) as AuthUser
      if (roles && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden" })
      }
      req.user = decoded
      next()
    } catch {
      return res.status(401).json({ error: "Invalid token" })
    }
  }
}
