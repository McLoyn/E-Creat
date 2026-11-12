# Ekraf HUB V0.1 — Platform Ekosistem Ekonomi Kreatif Tuban

Ekraf HUB V0.1 adalah aplikasi prototipe fungsional terintegrasi untuk ekosistem ekonomi kreatif di Kabupaten Tuban (inisiatif komunitas independen oleh **Tuban Creative Hub**).

---

## 🛠️ Stack Teknologi

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router 6 (Mobile-First, siap deploy ke **Vercel**).
- **Backend**: Express.js, Node.js (ES Modules), TypeScript, Prisma ORM, JWT Auth (`httpOnly` cookies), Bcryptjs, Multer.
- **Database**: **Supabase (PostgreSQL)** / Prisma (mendukung SQLite untuk pengujian instan di perangkat).
- **Hosting / Deployment Target**: **Vercel** (Frontend SPA) + Supabase (Database).

---

## 🚀 Fitur Utama

1. **Beranda & Showcase Ekosistem (`/`)**:
   - Pengenalan Mega Ekosistem Ekraf Tuban.
   - Sorotan Sub-Aplikasi & Pelaku Kreatif terverifikasi.
   - Pernyataan independensi Tuban Creative Hub (tanpa klaim/afiliasi pemerintah).
2. **Direktori Sub-Aplikasi (`/sub-apps`, `/sub-apps/:slug`)**:
   - Pencarian real-time dan filter jenis kategori platform.
   - Detail informasi aplikasi dan tautan akses langsung (`rel="noopener noreferrer"`).
3. **Direktori Pelaku Kreatif (`/creative`, `/creative/:slug`)**:
   - Pencarian karya dan filter berdasarkan 17 Subsektor Ekraf dan 20 Kecamatan di Kabupaten Tuban.
   - Kontak langsung: WhatsApp bisnis, Instagram profil, dan Website portofolio.
4. **Autentikasi & Akun (`/login`, `/register`, `/dashboard/profile`)**:
   - Pendaftaran pengguna publik (role `USER`).
   - Sesi aman dengan JWT access token (15 menit) + rotating refresh token (7 hari) via cookie `httpOnly`.
   - Pengaturan profil: nama, bio singkat, lokasi kecamatan, foto profil (upload max 2MB), dan pemilihan hingga 5 minat subsektor kreatif.
5. **Panel Administrator (`/admin`)**:
   - **Ringkasan (Overview)**: Statistik riil Sub-App, Pelaku Kreatif, Kategori, dan Total Pengguna.
   - **Manajemen Sub-App**: Tambah, edit, dan siklus hidup (`DRAFT` → `PUBLISHED` → `ARCHIVED` / `RESTORE`). Wajib minimal 1 kategori aktif untuk rilis.
   - **Manajemen Pelaku Kreatif**: Kurasi profil kreator dan kontak bisnis.
   - **Manajemen Kategori**: Tab Subsektor Ekraf vs Jenis Sub-App. Dilengkapi proteksi penghapusan (409 Conflict jika kategori sedang digunakan data lain).

---

## 🔑 Akun Demo Bawaan

Database telah di-seed dengan data sampel siap uji:

| Peran | Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@ekraftuban.id` | `AdminPassword123!` | Akses penuh Panel Admin `/admin` |
| **USER (Kreator 1)** | `kreator1@ekraftuban.id` | `UserPassword123!` | Akun kreator Kec. Semanding |
| **USER (Kreator 2)** | `kreator2@ekraftuban.id` | `UserPassword123!` | Akun kreator Kec. Tuban |

*(Di halaman `/login`, tersedia tombol cepat untuk mengisi akun demo tersebut).*

---

## ⚙️ Menjalankan Secara Lokal

### 1. Instalasi Dependensi
```bash
pnpm install
```

### 2. Konfigurasi Environment
Salin template environment:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

### 3. Migrasi & Seed Database
```bash
pnpm --filter @ekraf/api db:generate
pnpm --filter @ekraf/api db:push
pnpm --filter @ekraf/api db:seed
```

### 4. Build Frontend & Jalankan Server
```bash
pnpm build
pnpm dev
```
Akses aplikasi melalui tombol **Preview (Globe)** di PolyDev atau buka `http://127.0.0.1:4000`.

---

## ☁️ Integrasi Supabase & Deployment Vercel

### A. Setup Database Supabase
1. Buat project baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, salin dan jalankan seluruh query dari file [`docs/supabase_schema.sql`](./docs/supabase_schema.sql).
3. Salin URL koneksi PostgreSQL dari menu **Project Settings → Database → Connection string (URI)**.
4. Masukkan ke variabel `DATABASE_URL` di backend.

### B. Deployment Frontend ke Vercel
1. Hubungkan repositori ke [Vercel](https://vercel.com).
2. Atur **Root Directory** ke `apps/web`.
3. Framework Preset: **Vite**.
4. File `apps/web/vercel.json` telah dikonfigurasi untuk menangani SPA routing secara otomatis.

---

## 📄 Struktur Direktori Monorepo

```
ekraf-hub/
├── apps/
│   ├── api/                     # Backend Express.js & Prisma
│   │   ├── prisma/              # Schema database & script seed
│   │   ├── src/
│   │   │   ├── middlewares/     # JWT Auth, cookie parser, errorHandler
│   │   │   ├── routes/          # Auth, Profile, Uploads, SubApps, Creatives, Categories, Admin
│   │   │   ├── app.ts           # Express App setup & static SPA serving
│   │   │   └── server.ts        # Server entry point (127.0.0.1:4000)
│   │   └── uploads/             # Direktori penyimpanan unggahan gambar lokal
│   └── web/                     # Frontend React + Vite + Tailwind CSS
│       ├── src/
│       │   ├── api/             # API client fetch wrapper
│       │   ├── components/      # Navbar, Footer, Badge
│       │   ├── context/         # AuthContext (state user & login)
│       │   ├── pages/           # Landing, Sub-Apps, Creatives, Auth, Profile
│       │   │   └── admin/       # Panel Overview, Sub-Apps, Creatives, Categories
│       │   └── App.tsx          # Router utama
│       ├── vercel.json          # Konfigurasi SPA rewrite untuk Vercel
│       └── vite.config.ts
├── docs/
│   └── supabase_schema.sql      # Skema DDL lengkap untuk Supabase SQL Editor
├── package.json
└── README.md
```

---

## ⚖️ Catatan Independensi
Ekraf HUB adalah inisiatif swadaya independen yang diinisiasi oleh **Tuban Creative Hub** untuk kemajuan ekonomi kreatif daerah.
