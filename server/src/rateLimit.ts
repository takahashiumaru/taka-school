import type { Request, Response, NextFunction } from "express"

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastCleanupAt = 0
const cleanupIntervalMs = 60_000

function cleanupExpiredBuckets(now: number) {
  if (now - lastCleanupAt < cleanupIntervalMs) return
  lastCleanupAt = now
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key)
  })
}

export function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim()
  return req.ip || req.socket.remoteAddress || "unknown"
}

export function rateLimit(options: { keyPrefix: string; limit: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    cleanupExpiredBuckets(now)
    const key = `${options.keyPrefix}:${getClientIp(req)}`
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs })
      return next()
    }

    if (bucket.count >= options.limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      res.setHeader("Retry-After", String(retryAfter))
      return res.status(429).json({ error: "Terlalu banyak percobaan. Coba lagi nanti." })
    }

    bucket.count += 1
    next()
  }
}
