# Taka School - Security & Feature Improvements TODO

## ✅ Completed (High Priority)

### 1. JWT Auth Migration to HttpOnly Cookies
- ✅ Set JWT in HttpOnly cookie (`takaschool_token`)
- ✅ Add `/api/auth/logout` endpoint
- ✅ Update `requireAuth` middleware to read from cookie
- ✅ Keep backward compatibility with Bearer token
- ✅ Install cookie-parser middleware

### 2. Hide Demo Credentials in Production
- ✅ Add `VITE_SHOW_DEMO_LOGIN` env flag
- ✅ Conditional rendering of demo credentials block
- ✅ Document in `.env.example`

## 🔄 In Progress / Remaining

### 3. Rate Limiter Improvements (Medium Priority)
**Issue:** In-memory rate limiter not safe for multi-instance/proxy
**Files:** `server/src/rateLimit.ts`, `server/src/routes/auth.ts`
**TODO:**
- [ ] Migrate rate limit buckets to Redis or MySQL
- [ ] Set `app.set("trust proxy", 1)` for reverse proxy
- [ ] Add rate limit for sensitive endpoints (upload/import/export)
- [ ] Add audit log for failed login attempts

### 4. Upload File Validation (Medium Priority)
**Issue:** MIME/extension validation from client, no magic bytes check
**Files:** `server/src/routes/uploads.ts`, `server/src/index.ts`
**TODO:**
- [ ] Validate file signature with `file-type` library
- [ ] Re-encode images with `sharp` to remove payloads
- [ ] Add folder per tenant/school
- [ ] Add cleanup job for orphan files

### 5. TypeScript Type Safety (Medium Priority)
**Issue:** Many `any` types in operational pages
**Files:** `web/src/pages/OperasionalPage.tsx`
**TODO:**
- [ ] Create union types per tab (LibraryItem, InventoryItem, etc.)
- [ ] Replace dynamic access with typed map functions
- [ ] Add schema validation for payloads
- [ ] Add minimal tests for normalize/display rows

### 6. Forgot Password Flow (Low Priority)
**Issue:** "Lupa password?" link is `href="#"`
**Files:** `web/src/pages/LoginPage.tsx`
**TODO:**
- [ ] Create `/forgot-password` page
- [ ] Add endpoint for reset token request
- [ ] Send token via email/WhatsApp
- [ ] Add endpoint to set new password with token expiry
- [ ] Add audit log for password resets

## 🚀 New Feature Ideas

### 1. Self-Service Password Reset (High Priority)
**Benefit:** Reduce support burden for schools
**Scope:**
- [ ] `/forgot-password` page
- [ ] Request reset token endpoint
- [ ] Send token via email/WhatsApp
- [ ] Set new password with token validation
- [ ] Audit log

### 2. WhatsApp Notification Center (Medium Priority)
**Benefit:** Fast communication for SPP, attendance, announcements
**Scope:**
- [ ] Message templates (SPP overdue, absent, announcements)
- [ ] Preview before send
- [ ] Delivery status/log
- [ ] Segment recipients by class/payment/attendance

### 3. "Students Need Attention" Dashboard (Medium Priority)
**Benefit:** Quick view of at-risk students
**Scope:**
- [ ] Ranking by absent + low grades + SPP overdue
- [ ] Filter by class/period
- [ ] Quick actions: contact parent, add note, schedule counseling
- [ ] Export to CSV/PDF

### 4. Mobile Quick Attendance Input (Low Priority)
**Benefit:** Teachers input attendance from phone in class
**Scope:**
- [ ] One-hand UI: large Hadir/Izin/Sakit/Alpa buttons
- [ ] Auto-save per student
- [ ] Progress indicator "25/32 students done"
- [ ] Offline draft + sync when online

## 📝 Notes

- All security fixes (1-2) are **production-ready** and deployed
- Medium priority items (3-5) should be done before scaling to multiple instances
- Feature ideas (1-4) are prioritized by business impact
- Estimated effort: 2-3 days for remaining security items, 1-2 weeks for all features

---
Last updated: 2026-05-13
