# PRD — Taka School

**Nama Produk:** Taka School
**Versi Dokumen:** 1.1 (Revisi)
**Tanggal:** 6 Mei 2026
**Pemilik Produk:** bellawardana
**Status:** Draft — siap untuk implementasi landing page

### Riwayat Revisi
| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 6 Mei 2026 | Draft awal |
| 1.1 | 6 Mei 2026 | **Orang tua tidak punya akun** (info via WA saja). WhatsApp di landing = floating icon ke admin. Tombol **Login** untuk guru/admin di header landing. |

---

## 1. Ringkasan Eksekutif

Taka School adalah aplikasi manajemen sekolah ringan yang ditujukan untuk **sekolah kecil, PAUD, dan TK**. Produk ini menyatukan administrasi siswa & guru, absensi, jadwal, pembayaran SPP, pengumuman, galeri kegiatan, dan rapor sederhana dalam satu aplikasi web yang **dipakai oleh admin & guru sekolah**, sementara **orang tua menerima info via WhatsApp** — tanpa perlu install aplikasi atau bikin akun.

**Pembeda utama:**
- **Simpel** — hanya 2 role aplikasi (admin & guru). Orang tua zero-friction (cukup WA).
- **Murah & ringan** — fokus pada kebutuhan sekolah kecil.
- **WhatsApp-first** untuk komunikasi keluar.

---

## 2. Latar Belakang & Masalah

Sekolah kecil, PAUD, dan TK biasanya:
- Mencatat data siswa & guru di buku atau Excel.
- Absensi manual, sulit direkap.
- Jadwal kelas ditempel di papan, mudah hilang/berubah.
- SPP ditagih lewat WA satu per satu, rawan terlewat.
- Pengumuman & dokumentasi tersebar di banyak grup WA.
- Aplikasi sekolah yang ada terlalu kompleks dan mahal.

**Akibatnya:** beban administrasi guru tinggi, komunikasi ke orang tua tidak konsisten, dan pemilik sekolah sulit memantau operasional.

---

## 3. Tujuan Produk

### 3.1 Tujuan Bisnis
- Solusi manajemen sekolah terjangkau untuk skala kecil (PAUD/TK/SD kecil).
- Mengurangi beban administrasi guru minimal 50%.
- Meningkatkan ketepatan pembayaran SPP.
- Membangun kanal komunikasi resmi sekolah ↔ orang tua via WA.

### 3.2 Tujuan Pengguna
- **Admin/Pemilik sekolah:** dashboard tunggal untuk melihat operasional sekolah.
- **Guru:** input absensi, jadwal, dan rapor dengan cepat.
- **Orang tua:** dapat info anak (kehadiran, tagihan, pengumuman, foto kegiatan, rapor) **lewat WhatsApp**, tanpa perlu login.

### 3.3 Metrik Sukses (KPI)
- ≥ 80% absensi harian terinput sebelum jam 10:00.
- ≥ 90% tagihan SPP tercatat statusnya tiap bulan.
- ≥ 70% pesan WA pengumuman dibaca dalam 24 jam.
- Rata-rata waktu input rapor < 15 menit per siswa.
- Waktu admin menambah 1 siswa baru < 2 menit.

---

## 4. Target Pengguna & Role

| Persona | Punya akun? | Akses utama |
|---|---|---|
| **Admin / Kepala Sekolah** | ✔ Login | Semua fitur dalam 1 sekolah |
| **Guru / Wali Kelas** | ✔ Login | Absensi, jadwal, rapor, galeri, pengumuman (untuk kelasnya) |
| **Orang Tua / Wali** | ✘ Tidak login | Terima info via WhatsApp dari admin/guru |
| **Siswa** | ✘ Tidak login | — |

> **Catatan penting:** Orang tua **tidak perlu login** atau install apa-apa. Semua info yang relevan (absensi, tagihan SPP, pengumuman, foto, rapor PDF) dikirim oleh admin/guru lewat WhatsApp dari dalam aplikasi.

---

## 5. Ruang Lingkup (Scope)

### 5.1 In-Scope (MVP)
- **Landing page produk** (publik) — dengan floating WA & tombol Login.
- Halaman **Login** untuk admin & guru.
- Modul **Data Siswa**.
- Modul **Data Guru**.
- Modul **Absensi**.
- Modul **Jadwal Kelas**.
- Modul **Pembayaran SPP** (pencatatan; belum payment gateway).
- Modul **Pengumuman**.
- Modul **Galeri Kegiatan**.
- Modul **Rapor Sederhana** (PDF).
- **Helper Chat WhatsApp** — di dalam app, guru/admin bisa klik nomor orang tua → buka `wa.me` dengan template pesan.

### 5.2 Out of Scope (Versi Berikutnya)
- Aplikasi/portal khusus orang tua.
- Payment gateway (Midtrans/Xendit).
- Aplikasi mobile native.
- Modul kurikulum/RPP.
- CBT / ujian online.
- Multi-cabang dalam satu akun.
- Integrasi Dapodik.
- WhatsApp Business API broadcast.

---

## 6. Fitur Detail

### 6.1 Landing Page (Publik)

**Tujuan:** memperkenalkan produk, menarik sekolah daftar, dan memberi pintu masuk login bagi admin/guru yang sudah terdaftar.

**Header (sticky):**
- Logo Taka School (kiri).
- Menu: Fitur · Cocok Untuk · Cara Kerja · Harga · FAQ.
- **Tombol "Masuk" (Login)** di kanan — untuk admin & guru. Tombol sekunder "Daftar Sekolah" sebagai CTA utama.

**Struktur halaman:**
1. **Hero** — judul, tagline, CTA utama "Daftar Sekolah Gratis", CTA sekunder "Masuk" (untuk yang sudah terdaftar). Mockup dashboard di sebelahnya.
2. **Masalah & solusi** — pain point sekolah kecil dan bagaimana Taka School menyelesaikannya.
3. **Fitur utama** — 9 fitur dalam grid kartu (icon + judul + 1 kalimat).
4. **Cocok untuk** — PAUD, TK, SD kecil, bimbel, TPA.
5. **Cara kerja** — 3 langkah: (1) Daftar sekolah, (2) Setup data, (3) Guru mulai input — orang tua otomatis dapat info via WA.
6. **Harga** — paket sederhana (mis. Gratis hingga X siswa / Pro berlangganan).
7. **Testimoni** — placeholder (bisa diisi setelah ada user).
8. **FAQ** — termasuk: "Apakah orang tua perlu install aplikasi?" → "Tidak. Orang tua menerima info via WhatsApp."
9. **CTA akhir** — "Mulai gratis sekarang" + "Masuk".
10. **Footer** — kontak, sosmed, alamat.

**Floating elements:**
- **Floating WhatsApp icon** di pojok kanan bawah → klik buka `wa.me/{nomor admin Taka School}?text=Halo%20Taka%20School,%20saya%20tertarik%20dengan%20produknya...`. Icon mengambang di semua section, tidak menutupi konten utama.
- (Tidak ada chat widget di app, hanya tombol langsung ke WA.)

**Persyaratan teknis:**
- Responsif (mobile-first; mayoritas user buka via HP).
- Loading < 2 detik di 4G.
- SEO friendly (meta tag, OG image, sitemap).
- Aksesibilitas dasar (alt text, kontras warna).

---

### 6.2 Halaman Login (Admin & Guru)

- URL: `/login`.
- Field: **Email/Username** + **Password**.
- Opsi: "Ingat saya", "Lupa password".
- Setelah login, sistem mendeteksi role:
  - **Admin** → diarahkan ke Dashboard Admin.
  - **Guru** → diarahkan ke Dashboard Guru (kelas miliknya).
- Validasi: 5 percobaan gagal → kunci sementara 5 menit.
- Catatan keamanan: password di-hash (bcrypt/argon2), session token httpOnly cookie.

---

### 6.3 Data Siswa
- **Akses:** Admin (penuh), Guru (lihat siswa kelasnya).
- **Field:** nama, NIS, tanggal lahir, jenis kelamin, kelas, alamat, nama ayah, nama ibu, **nomor WA orang tua (wajib)**, foto, status (aktif/lulus/keluar).
- Filter & cari berdasarkan kelas, nama, status.
- Import/export CSV.
- Detail siswa menampilkan: rekap kehadiran, status SPP, rapor terakhir.
- Tombol **"Chat WA Ortu"** di setiap siswa → buka `wa.me`.

### 6.4 Data Guru
- **Akses:** Admin saja.
- **Field:** nama, NIP/ID, email login, kontak, mata pelajaran/kelas wali, foto, status.
- Penugasan ke kelas/jadwal.
- Reset password guru oleh admin.

### 6.5 Absensi
- **Akses:** Guru (input untuk kelasnya), Admin (semua kelas).
- Input absensi harian per kelas: hadir / izin / sakit / alpa.
- Bulk input ("centang semua hadir" → ubah pengecualian).
- Rekap absensi per siswa, per kelas, per periode.
- Ekspor PDF/CSV.
- **Notif WA**: tombol "Kirim notif WA ke ortu" untuk siswa yang alpa hari ini (manual, opsional).

### 6.6 Jadwal Kelas
- **Akses:** Admin (CRUD), Guru (lihat).
- CRUD jadwal mingguan per kelas (hari, jam, mata pelajaran/aktivitas, guru).
- Tampilan kalender mingguan.
- Cetak/ekspor PDF jadwal untuk dibagikan ke ortu via WA.

### 6.7 Pembayaran SPP
- **Akses:** Admin saja.
- Setup tarif SPP per kelas/tingkat.
- Generate tagihan bulanan otomatis.
- Catat pembayaran (manual): tanggal, jumlah, metode (cash/transfer), bukti opsional (upload).
- Status: **lunas / belum lunas / sebagian / lewat jatuh tempo**.
- Tombol "Reminder WA" pada tagihan jatuh tempo → buka `wa.me` dengan template pengingat.
- Laporan bulanan: total tagihan, terbayar, tunggakan, ringkasan per kelas.
- Ekspor laporan ke PDF/Excel.
- *(Catatan: payment gateway = roadmap fase 2.)*

### 6.8 Pengumuman
- **Akses:** Admin (semua), Guru (kelasnya).
- Buat pengumuman: judul, isi, lampiran (foto/PDF), target (semua / kelas tertentu / siswa tertentu).
- Riwayat pengumuman tersimpan di app.
- **Distribusi via WA**: setelah publish, sistem siapkan daftar nomor target + template pesan; admin/guru klik "Kirim ke WA" untuk menyebar (bisa per orang atau via WA Group link).

### 6.9 Galeri Kegiatan
- **Akses:** Admin & Guru upload, semua role internal lihat.
- Album: judul, tanggal, deskripsi, kelas terkait, kumpulan foto.
- Foto bisa di-share ke ortu via WA: tombol "Bagikan album" → buat link publik (read-only) → admin/guru tempel di pesan WA.
- Privasi: link album bisa diset publik (siapa saja dengan link) atau tertutup (perlu password kelas).

### 6.10 Rapor Sederhana
- **Akses:** Guru (input untuk kelasnya), Admin (review & finalisasi).
- Template rapor PAUD/TK: capaian perkembangan (kognitif, bahasa, sosial-emosional, motorik, seni, agama/moral) — deskripsi naratif + skala (BB/MB/BSH/BSB) atau centang pencapaian.
- Guru isi per siswa per periode (semester/triwulan).
- Admin review → finalisasi → generate **PDF rapor**.
- Riwayat rapor per siswa.
- Distribusi: kirim PDF rapor via WA ke ortu (tombol "Kirim rapor ke WA").

### 6.11 Helper Chat WhatsApp (di dalam app)
- **Bukan WhatsApp Business API** di MVP.
- Setiap nomor WA orang tua/guru di app dilengkapi tombol **"Chat WA"** → buka `wa.me/{nomor}?text={template}` di tab baru.
- Template pesan dapat dikonfigurasi admin di Pengaturan, untuk:
  - Pengingat SPP
  - Notifikasi ketidakhadiran
  - Pengumuman
  - Pembagian rapor
  - Pembagian galeri
- Variabel template: `{nama_anak}`, `{kelas}`, `{tanggal}`, `{nominal}`, `{nama_sekolah}`, dll.
- **Floating WA pada landing page** mengarah ke admin Taka School (bukan admin sekolah end-user).

---

## 7. Information Architecture (Halaman Utama Aplikasi)

```
[Publik]
├── /                       Landing page (header: Login)
├── /login                  Login admin & guru
├── /lupa-password
└── /album/{kode}           Galeri publik (link share)

[Setelah login — Admin]
├── /dashboard              Ringkasan: total siswa, kehadiran hari ini, tunggakan SPP
├── /siswa
├── /guru
├── /kelas
├── /absensi
├── /jadwal
├── /spp
├── /pengumuman
├── /galeri
├── /rapor
└── /pengaturan             Profil sekolah, template WA, akun

[Setelah login — Guru]
├── /dashboard              Kelas saya, jadwal hari ini, tugas absensi/rapor
├── /absensi
├── /jadwal
├── /pengumuman
├── /galeri
└── /rapor
```

---

## 8. Alur Pengguna (User Flow Utama)

1. **Onboarding sekolah baru:**
   Admin daftar via landing → verifikasi email → setup data sekolah → buat kelas → tambah guru → import siswa (CSV) → atur tarif SPP → mulai pakai.

2. **Login & absensi harian:**
   Guru klik **Login** di landing → masuk dashboard guru → pilih kelas hari ini → tandai kehadiran (default semua hadir) → simpan → opsional klik "Kirim notif WA" untuk ortu siswa alpa.

3. **Penagihan SPP:**
   Sistem auto-generate tagihan tanggal 1 → admin lihat daftar tunggakan → klik "Reminder WA" pada tagihan jatuh tempo → WA terbuka dengan pesan template → kirim → orang tua bayar (cash/transfer) → admin catat pembayaran → status update.

4. **Pengumuman:**
   Admin/guru tulis pengumuman → pilih target kelas → publish → daftar nomor WA target tampil → klik "Kirim ke WA" satu per satu, atau salin pesan dan paste ke WA Group sekolah.

5. **Rapor akhir semester:**
   Guru isi capaian per siswa → submit → admin review & finalisasi → generate PDF → klik "Kirim rapor via WA" pada tiap siswa → kirim ke ortu.

---

## 9. Persyaratan Non-Fungsional

| Aspek | Persyaratan |
|---|---|
| **Platform** | Web responsif (mobile-first), bisa diakses dari HP & desktop |
| **Bahasa** | Bahasa Indonesia (default), siap multi-bahasa |
| **Performa** | Load halaman utama < 2 detik di 4G |
| **Keamanan** | Login dengan password (hash bcrypt/argon2), session httpOnly cookie, role-based access, rate limit login |
| **Privasi** | Data anak di bawah umur tidak dibagikan ke pihak ketiga; nomor WA ortu hanya diakses admin & guru kelas |
| **Reliability** | Uptime ≥ 99% |
| **Backup** | Backup database harian otomatis, retensi 30 hari |
| **Skalabilitas** | Mendukung sampai ~500 siswa per sekolah di MVP |
| **Audit log** | Login, perubahan data siswa, transaksi SPP tercatat |

---

## 10. Role & Hak Akses (Detail)

| Modul | Admin | Guru |
|---|---|---|
| Data Siswa | CRUD semua | Lihat siswa kelasnya |
| Data Guru | CRUD | — |
| Kelas | CRUD | Lihat kelasnya |
| Absensi | Lihat semua | Input untuk kelasnya |
| Jadwal | CRUD | Lihat |
| SPP | CRUD penuh | — |
| Pengumuman | CRUD semua | Buat untuk kelasnya |
| Galeri | CRUD | Upload untuk kelasnya |
| Rapor | Review & finalisasi | Input untuk kelasnya |
| Pengaturan sekolah | CRUD | — |
| Template WA | CRUD | Lihat & pakai |

---

## 11. Asumsi & Ketergantungan

- Sekolah memiliki minimal 1 admin yang melek HP/komputer.
- Mayoritas orang tua punya WhatsApp aktif.
- Koneksi internet di sekolah tersedia (boleh tidak stabil).
- Pembayaran SPP di MVP tetap manual (transfer/cash) — sistem hanya mencatat.
- Distribusi WA dilakukan **manual oleh admin/guru** dengan bantuan template (klik `wa.me`); tidak ada bot pengirim otomatis di MVP.

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Adopsi rendah karena guru kurang familiar | UI sederhana, video tutorial, jasa setup |
| Sekolah enggan migrasi data dari Excel | Import CSV + jasa onboarding |
| Orang tua tidak baca WA | Template pesan singkat & jelas; rekap di pengumuman/dashboard admin |
| Privasi foto anak | Album bisa diset privat dengan password; persetujuan ortu di onboarding |
| Banyak ortu = beban kirim WA manual | Roadmap: WA Business API broadcast |
| Sekolah ingin payment otomatis | Roadmap fase 2: payment gateway |

---

## 13. Roadmap (Indikatif)

| Fase | Konten |
|---|---|
| **Fase 0 — Validasi** | Landing page, form daftar minat, wawancara 5 sekolah |
| **Fase 1 — MVP** | Landing + login + 9 modul aplikasi |
| **Fase 2** | WhatsApp Business API (broadcast otomatis), payment gateway, mobile app |
| **Fase 3** | Multi-cabang, modul kurikulum, CBT, integrasi Dapodik, portal khusus ortu |

---

## 14. Open Questions (untuk diputuskan sebelum/saat build)

- [ ] Model harga: gratis hingga X siswa, lalu berbayar? Atau flat per sekolah?
- [ ] Multi-tenant (1 deployment banyak sekolah) atau 1 deployment per sekolah?
- [ ] Format rapor PAUD/TK: ikut Kemendikbud (Kurikulum Merdeka) atau bebas?
- [ ] Storage galeri: kuota berapa GB per sekolah? Pakai S3/Cloudinary/lokal?
- [ ] Apakah ada free trial 14 hari sebelum berbayar?

---

## 15. Lampiran

- **Lampiran A:** Wireframe landing & dashboard (TBD)
- **Lampiran B:** Skema database (TBD)
- **Lampiran C:** Daftar template pesan WhatsApp (TBD)
- **Lampiran D:** Mockup PDF rapor (TBD)
