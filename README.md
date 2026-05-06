# Taka School

Aplikasi manajemen sekolah ringan untuk PAUD, TK, dan sekolah kecil. Monorepo berisi:

- `web/` — frontend (Vite + React + TypeScript + Tailwind)
- `server/` — backend (Express + TypeScript + MySQL)

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
- Frontend: http://localhost:5173
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
| `npm run dev` | Jalankan backend (4000) + frontend (5173) bersamaan |
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
CORS_ORIGIN=http://localhost:5173
```

## Konfigurasi Frontend (`web/.env`)

```
VITE_API_BASE=http://localhost:4000
```

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
# taka-school
