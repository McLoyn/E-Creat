# EKRAF HUB — Laporan Audit Mendalam Infrastruktur & Keamanan Backend
**Dokumen Referensi:** `docs/audits/BACKEND_AUDIT_REPORT.md`  
**Tanggal:** 18 November 2026  
**Auditor / Tim:** Antigravity (Senior Full-Stack & Application Security Engineer)  
**Repository:** `https://github.com/McLoyn/E-Creat`  
**Target Branch:** `fix/backend-foundation-security`

---

## 1. Executive Summary

Audit ini dilakukan untuk mengevaluasi kesiapan infrastruktur dan keamanan backend Ekraf HUB sebelum diskalakan ke ribuan akun kreator, katalog portofolio, dan transaksi pasar kreatif lintas wilayah.

Secara umum, arsitektur dasar telah memiliki pemisahan modular yang baik antara Express API dan React Web, serta telah memiliki relasi kepemilikan kreator (K-01) dan alur moderasi (K-03). Namun, ditemukan sejumlah kerentanan keamanan kritis pada autentikasi, inkonsistensi skema database antara SQLite lokal dan PostgreSQL Supabase, serta risiko kehilangan data media akibat ketergantungan pada disk lokal ephemeral.

---

## 2. Temuan Keamanan (Security Vulnerabilities)

### 2.1 [CRITICAL] Hardcoded Fallback Secret pada JWT
- **Lokasi:** `apps/api/src/middlewares/auth.ts` (baris 6–7)
- **Kondisi:**
  ```typescript
  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'ekraf_access_secret_super_secure_key_12345';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ekraf_refresh_secret_super_secure_key_67890';
  ```
- **Dampak:** Jika environment variable tidak terisi di production, server tetap menyala dan menandatangani token menggunakan kunci default publik. Penyerang dapat memalsukan access token dengan role `ADMIN` dan membajak seluruh sistem.
- **Rekomendasi:** Hapus fallback secret, wajibkan validasi environment saat startup, tetapkan panjang minimal secret (>= 32 karakter), dan hentikan proses booting server jika secret tidak valid.

### 2.2 [CRITICAL] Autentikasi Google OAuth Tidak Terverifikasi & Rentan Account Takeover (ATO)
- **Lokasi:** `apps/api/src/routes/auth.ts` (endpoint `POST /api/v1/auth/google`, `GET /google/url`, `GET /google/callback`)
- **Kondisi:**
  1. `POST /google` menerima `email` dan `displayName` mentah dari request body jika `credential` gagal didekode.
  2. Saat `credential` (ID token) ada, sistem hanya melakukan `split('.')[1]` (decode base64) tanpa verifikasi cryptographic signature, issuer (`accounts.google.com`), audience (`GOOGLE_CLIENT_ID`), expiry, dan klaim `email_verified`.
  3. `GET /google/url` mengambil `redirect_uri` dinamis dari request query atau host header.
  4. Parameter `state` tidak menggunakan entropy kriptografis dan tidak terikat pada cookie sesi browser (berpotensi OAuth CSRF & replay attack).
- **Dampak:** Siapapun dapat mengirim POST request dengan JSON `{"email": "admin@ekraftuban.id"}` untuk langsung memperoleh sesi admin sah tanpa pernah memiliki kredensial Google pemilik akun.
- **Rekomendasi:**
  - Hapus fallback email dari request body.
  - Wajibkan verifikasi Google ID Token menggunakan pustaka resmi (`google-auth-library`) yang memeriksa signature terhadap JWKS Google, `aud`, `iss`, `exp`, dan `email_verified`.
  - Tetapkan redirect URI statis dari environment variable `GOOGLE_REDIRECT_URI`.
  - Implementasikan cryptographic state token yang disimpan dalam HttpOnly, Secure cookie dengan TTL singkat (5 menit).

### 2.3 [HIGH] Konfigurasi CORS Terlalu Permisif dengan Credentials Aktif
- **Lokasi:** `apps/api/src/app.ts` (baris 24–35)
- **Kondisi:**
  ```typescript
  origin: (origin, callback) => {
    if (!origin || origin === WEB_ORIGIN || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in prototype for preview
    }
  },
  credentials: true
  ```
- **Dampak:** Mengizinkan domain pihak ketiga manapun untuk melakukan credentialed cross-origin requests (`withCredentials: true`), memungkinkan serangan Cross-Site Scripting / CSRF token harvesting melalui browser korban.
- **Rekomendasi:** Batasi hanya pada allowlist origin eksplisit (`process.env.WEB_ORIGIN`). Tolak origin lain dengan error CORS standar.

### 2.4 [MEDIUM] Ketiadaan Rate Limiting & Proteksi Brute Force
- **Lokasi:** `apps/api/src/routes/auth.ts`
- **Kondisi:** Endpoint `/login`, `/register`, `/refresh`, dan `/google` tidak memiliki rate limit.
- **Dampak:** Penyerang dapat melakukan brute force password credential stuffing atau DoS terhadap endpoint autentikasi bcrypt (yang memakan beban CPU tinggi).
- **Rekomendasi:** Pasang `express-rate-limit` khusus untuk endpoint autentikasi publik (misal: 10 request per 15 menit per IP).

### 2.5 [MEDIUM] Ketiadaan Security Headers Standar
- **Lokasi:** `apps/api/src/app.ts`
- **Kondisi:** Aplikasi tidak menggunakan `helmet`. Header seperti `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, dan CSP tidak terpasang.
- **Rekomendasi:** Pasang middleware `helmet()` dengan konfigurasi yang aman.

---

## 3. Ketidaksesuaian Database (Database Discrepancies)

### 3.1 SQLite vs PostgreSQL Supabase
- **Lokasi:** `apps/api/prisma/schema.prisma` vs `docs/supabase_schema.sql`
- **Temuan:**
  1. **Provider:** Prisma dikonfigurasi dengan `provider = "sqlite"`, sedangkan skema target production adalah Supabase PostgreSQL.
  2. **Enums:** PostgreSQL menggunakan native enum (`Role`, `ContentStatus`, `CategoryKind`, `ProductAvailability`). Pada Prisma SQLite, tipe ini diturunkan menjadi `String` biasa sehingga tidak ada integritas enum di level DB engine.
  3. **Relasi Foreign Key Audit:** Pada PostgreSQL `docs/supabase_schema.sql`, field `createdById`, `updatedById`, dan `reviewedById` memiliki constraint FK `REFERENCES "User"("id") ON DELETE SET NULL`. Pada Prisma schema, field-field ini hanya berupa `String?` tanpa relation attribute.
  4. **Database Check Constraints:** PostgreSQL memiliki check constraints ketat (`chk_user_email_lowercase`, `chk_subapp_url`, `chk_subapp_published`, `chk_work_review_note`, `chk_prod_price`, dll.) yang belum didokumentasikan dalam Prisma migration.
- **Rekomendasi:**
  - Buat migration PostgreSQL terlacak yang menyelaraskan schema Prisma dengan target Supabase PostgreSQL.
  - Sediakan mekanisme konfigurasi datasource (PostgreSQL production vs SQLite local test) yang teruji tanpa merusak backward compatibility query Prisma.

---

## 4. Masalah Deployment & Infrastruktur

### 4.1 Binding Host Server
- **Lokasi:** `apps/api/src/server.ts`
- **Kondisi:** `const HOST = '127.0.0.1';`
- **Dampak:** Pada cloud platform berbasis container (Render, Railway, Fly.io, Cloud Run), server tidak dapat diakses dari luar container karena hanya listen pada loopback interface internal.
- **Rekomendasi:** Gunakan `process.env.HOST || '127.0.0.1'` agar di lingkungan lokal tetap 127.0.0.1 (sesuai aturan mobile IDE), namun dapat di-override menjadi `0.0.0.0` saat dideploy.

### 4.2 Manajemen File Upload & Risiko Kehilangan Data
- **Lokasi:** `apps/api/src/routes/uploads.ts`
- **Kondisi:** Menggunakan `multer.diskStorage` ke direktori lokal `./uploads`.
- **Dampak:** Platform serverless (Vercel) dan container PaaS (Render free tier, Heroku) memiliki ephemeral filesystem yang dihapus setiap kali container restart atau deploy ulang. Seluruh foto profil, portofolio karya, dan produk akan hilang permanen.
- **Rekomendasi:** Migrasikan storage upload ke **Supabase Storage** (bucket `ekraf-public`) menggunakan client resmi `@supabase/supabase-js`, dengan fallback lokal hanya untuk mode offline/testing.

---

## 5. Masalah Autentikasi, Sesi, dan Validasi Input

### 5.1 Race Condition pada Refresh Token Rotation
- **Lokasi:** `apps/api/src/routes/auth.ts` (baris 516–566)
- **Kondisi:** Pengecekan status sesi dan eksekusi rotasi terpisah dari locking DB. Jika terdapat dua request refresh serentak dari browser yang sama (misalnya saat 2 tab dibuka bersamaan), salah satu request dapat memicu false-positive reuse detection dan mencabut sesi secara tidak sengaja.
- **Rekomendasi:** Gunakan serializable transaction atau atomic update dengan pengecekan `revokedAt IS NULL`.

### 5.2 Validasi Input Belum Terstandarisasi dengan Zod
- **Lokasi:** `apps/api/src/routes/*.ts`
- **Kondisi:** Validasi input dilakukan secara manual per endpoint (`if (!email || !password)`).
- **Rekomendasi:** Terapkan Zod validation schema middleware yang memvalidasi request body, query, dan params secara konsisten dengan format error terstandar (HTTP 422).

---

## 6. Ringkasan Matriks Risiko & Prioritas Remediasi

| ID | Kategori | Temuan | Tingkat Risiko | Prioritas Remediasi |
|---|---|---|---|---|
| SEC-01 | Auth | JWT fallback secret hardcoded | CRITICAL | P0 (Fase 2) |
| SEC-02 | Auth | Google OAuth tanpa verifikasi kriptografis & ATO bypass | CRITICAL | P0 (Fase 2) |
| SEC-03 | Network | Permissive CORS allowlist dengan credentials | HIGH | P0 (Fase 2) |
| SEC-04 | Network | Kurang security headers (Helmet) & Rate Limiting | MEDIUM | P1 (Fase 5) |
| DAT-01 | Database | Inkonsistensi SQLite vs Supabase PostgreSQL | HIGH | P1 (Fase 3) |
| DAT-02 | Database | Kurang relasi audit & check constraints | MEDIUM | P1 (Fase 3) |
| STO-01 | Storage | Penyimpanan lokal ephemeral (Data loss risk) | CRITICAL | P0 (Fase 4) |
| OPS-01 | Deploy | Host binding 127.0.0.1 hardcoded | HIGH | P1 (Fase 5) |
| OPS-02 | Ops | Ketiadaan prosedur automated backup & disaster recovery | HIGH | P1 (Fase 6) |

---
Dokumen audit ini menjadi acuan kerja pelaksanaan perbaikan teknis pada branch `fix/backend-foundation-security`.
