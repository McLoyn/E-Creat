# EKRAF HUB — Rencana & Prosedur Migrasi Database PostgreSQL Supabase
**Dokumen Referensi:** `docs/database/DATABASE_MIGRATION_PLAN.md`  
**Status:** Siap Eksekusi  
**Branch:** `feat/supabase-database-storage`  

---

## 1. Latar Belakang & Tujuan
Pada tahap prototipe awal, aplikasi menggunakan SQLite lokal (`dev.db`). Untuk target produksi skala besar, sistem menggunakan **Supabase PostgreSQL**. Dokumen ini menjamin transisi skema yang aman, konsisten, terlacak via Prisma Migrate, dan tanpa kehilangan data.

---

## 2. Struktur Skema & Sumber Kebenaran (Single Source of Truth)

### 2.1 File Acuan Skema
1. **Prisma Canonical Schema (PostgreSQL):** `apps/api/prisma/schema.prisma`
2. **Prisma Migration Baseline Terlacak:** `apps/api/prisma/migrations/20261118000000_init_supabase_postgresql/migration.sql`
3. **Prisma SQLite Schema (Khusus Pengujian Offline):** `apps/api/prisma/schema.sqlite.prisma`
4. **DDL Supabase Asli:** `docs/supabase_schema.sql`

### 2.2 Sinkronisasi Entitas & Enums
PostgreSQL menggunakan tipe data native Enum yang diselaraskan dengan Prisma:
- **`Role`**: `'USER'`, `'ADMIN'`
- **`ContentStatus`**: `'DRAFT'`, `'PENDING_REVIEW'`, `'NEEDS_REVISION'`, `'REJECTED'`, `'PUBLISHED'`, `'ARCHIVED'`
- **`CategoryKind`**: `'SUBSECTOR'`, `'SUBAPP_TYPE'`, `'WORK_CATEGORY'`, `'PRODUCT_TYPE'`
- **`ProductAvailability`**: `'AVAILABLE'`, `'MADE_TO_ORDER'`, `'UNAVAILABLE'`

### 2.3 Foreign Key & Aturan Penghapusan Data (Referential Integrity)
| Tabel Relasi | Foreign Key | Target | On Delete Action |
|---|---|---|---|
| `UserProfile` | `userId` | `User.id` | `CASCADE` (Profil terhapus jika akun dihapus) |
| `UserProfileInterest` | `userProfileId` | `UserProfile.id` | `CASCADE` |
| `UserProfileInterest` | `categoryId` | `Category.id` | `RESTRICT` (Kategori tidak boleh dihapus jika masih diminati pengguna) |
| `AuthSession` | `userId` | `User.id` | `CASCADE` |
| `SubAppCategory` | `subAppId` | `SubApp.id` | `CASCADE` |
| `SubAppCategory` | `categoryId` | `Category.id` | `RESTRICT` |
| `CreativeProfileCategory` | `creativeProfileId` | `CreativeProfile.id` | `CASCADE` |
| `CreativeProfileCategory` | `categoryId` | `Category.id` | `RESTRICT` |
| `CreativeProfileOwner` | `creativeProfileId` | `CreativeProfile.id` | `CASCADE` |
| `CreativeProfileOwner` | `userId` | `User.id` | `CASCADE` |
| `CreativeWork` | `creativeProfileId` | `CreativeProfile.id` | `RESTRICT` (Profil kreator tidak boleh dihapus jika memiliki karya aktif) |
| `CreativeWork` | `categoryId` | `Category.id` | `SET NULL` |
| `CreativeProduct` | `creativeProfileId` | `CreativeProfile.id` | `RESTRICT` |
| `CreativeProduct` | `productTypeId` | `Category.id` | `RESTRICT` |
| `CreativeProduct` | `workId` | `CreativeWork.id` | `SET NULL` |

### 2.4 Indeks Performa (Performance Indexing)
Untuk mendukung pencarian cepat dan pagination direktori hingga puluhan ribu entri:
1. `idx_category_lookup`: `Category(kind, isActive, sortOrder)`
2. `idx_subapp_status_published`: `SubApp(status, publishedAt DESC)`
3. `idx_creative_status_published`: `CreativeProfile(status, publishedAt DESC)`
4. `idx_creative_status_city`: `CreativeProfile(status, city)`
5. `idx_creative_status_district`: `CreativeProfile(status, district)`
6. `idx_work_status_published`: `CreativeWork(status, publishedAt DESC)`
7. `idx_work_creator_status`: `CreativeWork(creativeProfileId, status)`
8. `idx_prod_status_published`: `CreativeProduct(status, publishedAt DESC)`
9. `idx_prod_creator_status`: `CreativeProduct(creativeProfileId, status)`
10. `idx_session_expires`: `AuthSession(expiresAt)` (Mempercepat pembersihan sesi kedaluwarsa)

---

## 3. Prosedur Eksekusi Migrasi ke Supabase Production (Panduan Pemilik Proyek)

Karena proyek Supabase baru dibuat dalam keadaan kosong, lakukan langkah berikut:

### Langkah 1: Persiapan Variabel Lingkungan di Supabase Dashboard
Dapatkan Connection String PostgreSQL dari Dashboard Supabase:
- Buka **Project Settings** > **Database**.
- Salin connection string:
  - **Transaction Pooler (Port 6543):** Masukkan ke `DATABASE_URL`
  - **Direct Connection / Session Mode (Port 5432):** Masukkan ke `DIRECT_URL`
- Masukkan ke `.env` server backend:
  ```env
  DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
  ```

### Langkah 2: Jalankan Migration Prisma (Otomatis & Terlacak)
Eksekusi migration terlacak dari direktori proyek:
```bash
cd apps/api
npx prisma migrate deploy --schema=prisma/schema.prisma
```
Perintah ini akan secara otomatis:
1. Membuat tabel `_prisma_migrations` untuk mencatat riwayat migration.
2. Mengeksekusi DDL `20261118000000_init_supabase_postgresql/migration.sql`.
3. Membentuk seluruh Enum, Tabel, Index, Foreign Key, dan Business Logic Check Constraints.

*Alternatif Manual (Via Supabase SQL Editor):*
Jika tidak ingin menjalankan CLI, salin seluruh isi file `docs/supabase_schema.sql` ke dalam **SQL Editor** di Dashboard Supabase lalu klik **Run**.

### Langkah 3: Inisialisasi Klien Prisma (Generate Client)
```bash
npx prisma generate --schema=apps/api/prisma/schema.prisma
```

### Langkah 4: Seeding Data Awal (Opsional)
Untuk menginisialisasi kategori subsektor, tipe sub-apps, kategori karya, dan akun administrator awal:
```bash
SEED_ADMIN_PASSWORD="YourStrongUniqueAdminPassword123!" npx tsx apps/api/prisma/seed.ts
```
*(Catatan: Mode produksi mewajibkan `SEED_ADMIN_PASSWORD` kustom yang kuat; password default ditolak demi keamanan).*

---

## 4. Rollback Plan
Jika terjadi kegagalan saat migrasi:
1. Jalankan script rollback `docs/rollback_w1.sql` yang telah disediakan untuk mengembalikan skema ke kondisi bersih secara aman.
2. Pulihkan data menggunakan backup snapshot PostgreSQL terbaru (lihat `docs/operations/BACKUP_RECOVERY.md`).
