# Taka School

Aplikasi manajemen sekolah ringan untuk PAUD, TK, dan sekolah kecil. Monorepo berisi:

- `web/` — frontend (Vite + React + TypeScript + Tailwind)
- `server/` — backend (Express + TypeScript + MySQL)

## Screenshots

![Taka School - Landing Page](school.png)
![Taka School - Dashboard](school1.png)

## Quick Start

```bash
# 1) Install semua dependency (root + server + web)
npm install

# 2) Salin & edit file environment
cp server/.env.example server/.env       # edit DATABASE_URL kamu
cp web/.env.example web/.env             # opsional; default ok untuk lokal

# 3) Jalankan frontend + backend sekaligus
npm run dev
```

Buka:
- Frontend: http://localhost:3000
- Backend:  http://localhost:4000/api/health

Backend akan otomatis:
- membuat tabel kalau belum ada (auto-migrate)
- menyiapkan akun demo (idempotent):
  - admin: `admin@demo.id` / `admin123`
  - guru:  `guru@demo.id`  / `guru123`

## Scripts

| Perintah | Fungsi |
|---|---|
| `npm install` | Install deps di root, server, & web |
| `npm run dev` | Jalankan backend (4000) + frontend (3000) bersamaan |
| `npm run dev:server` | Jalankan backend saja |
| `npm run dev:web` | Jalankan frontend saja |
| `npm run build` | Build backend & frontend ke `dist/` |
| `npm run start` | Jalankan backend (mode prod) |
| `npm run migrate` | Pastikan schema MySQL ada |
| `npm run seed` | Tambah data demo (idempotent) |

## Konfigurasi Backend (`server/.env`)

```
PORT=4000
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DBNAME
JWT_SECRET=ganti-dengan-secret-acak
CORS_ORIGIN=https://nama-project.vercel.app
```

## Konfigurasi Frontend (`web/.env`)

```
VITE_API_BASE=http://localhost:4000
```

## Deploy ke Vercel

Proyek ini terdiri dari **dua bagian terpisah** yang di-deploy ke Vercel.

### 1. Deploy Frontend (Web)

Frontend adalah Vite + React — deploy folder `web/` sebagai static site.

**Langkah:**

1. Push repo ke GitHub / GitLab / Bitbucket
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → Import repo
3. Atur konfigurasi berikut di Vercel:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

4. Tambahkan **Environment Variable**:

```
VITE_API_BASE=https://url-backend-kamu.vercel.app
```

5. Klik **Deploy** ✅

---

### 2. Deploy Backend (Server) ke Vercel Serverless

Buat file `vercel.json` di **root** folder proyek:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/src/index.ts"
    },
    {
      "src": "/uploads/(.*)",
      "dest": "server/src/index.ts"
    }
  ]
}
```

Tambahkan **Environment Variables** di Vercel dashboard (project backend):

```
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DBNAME
JWT_SECRET=secret-acak-yang-kuat
CORS_ORIGIN=https://nama-frontend.vercel.app
PORT=4000
```

> ⚠️ **Catatan:**
> - Vercel Serverless **tidak mendukung file upload persisten**. Untuk fitur galeri/foto, gunakan **Cloudinary** atau **AWS S3**.
> - Gunakan MySQL cloud: **Railway**, **Aiven**, atau **PlanetScale**.

---

### Rekomendasi Stack Cloud Gratis

| Komponen | Layanan |
|---|---|
| Frontend | Vercel (gratis) |
| Backend API | Vercel Serverless / Railway |
| Database MySQL | Railway / Aiven / PlanetScale |
| File Upload | Cloudinary (gratis 25 GB) |

---

## Routes

Frontend:
- `/` — Landing page publik
- `/login` — Login admin / guru
- `/dashboard` — Dashboard (perlu login)

Backend:
- `GET  /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register-school`
- `GET  /api/auth/me`
- `GET  /api/stats/dashboard`

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 3, React Router |
| Backend | Express, TypeScript, mysql2, bcryptjs, jsonwebtoken, zod |
| DB | MySQL 8 |
