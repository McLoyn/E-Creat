# EKRAF HUB — Rencana Migrasi Database PostgreSQL Supabase
**Dokumen Referensi:** `docs/database/DATABASE_MIGRATION_PLAN.md`  
**Status:** Siap Eksekusi  
**Branch:** `fix/backend-foundation-security`

---

## 1. Latar Belakang & Tujuan
Pada tahap prototipe awal, aplikasi menggunakan SQLite lokal (`dev.db`). Untuk target produksi skala besar, sistem menggunakan **Supabase PostgreSQL**. Dokumen ini menjamin transisi skema yang aman, konsisten, dan tanpa kehilangan data.

---

## 2. Struktur Skema & Sinkronisasi

### 2.1 File Acuan Skema
1. **DDL Supabase Asli:** `docs/supabase_schema.sql`
2. **Prisma PostgreSQL Production Schema:** `apps/api/prisma/schema.postgresql.prisma`
3. **Prisma SQLite Local Schema:** `apps/api/prisma/schema.prisma`

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
10. `idx_session_expires`: `AuthSession(expiresAt)` (Mempercepat cron cleanup sesi kedaluwarsa)

---

## 3. Prosedur Eksekusi Migrasi ke Supabase Production

### Langkah 1: Persiapan Koneksi Supabase
Dapatkan Connection String PostgreSQL dari Dashboard Supabase:
- Buka **Project Settings** > **Database** > **Connection Pooling / Direct Connection**.
- Simpan nilai ke dalam `.env` production:
  ```env
  DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
  ```

### Langkah 2: Eksekusi DDL Schema di Supabase SQL Editor
1. Buka **SQL Editor** pada Dashboard Supabase.
2. Salin seluruh isi file `docs/supabase_schema.sql`.
3. Jalankan query (`Run`).
4. Verifikasi seluruh tabel, enum, foreign key, dan check constraint berhasil dibuat tanpa error.

### Langkah 3: Sinkronisasi Prisma Client Production
Jalankan perintah berikut di lingkungan deployment:
```bash
npx prisma generate --schema=apps/api/prisma/schema.postgresql.prisma
```

### Langkah 4: Seeding Data Awal (Opsional)
Untuk menginisialisasi kategori subsektor, akun administrator awal, dan sampel data direktori:
```bash
npx tsx apps/api/prisma/seed.ts
```

---

## 4. Rollback Plan
Jika terjadi kegagalan atau kendala saat rilis database:
1. Jalankan script rollback `docs/rollback_w1.sql` yang telah disediakan untuk mengembalikan skema ke kondisi bersih secara aman.
2. Pulihkan data menggunakan backup snapshot PostgreSQL terbaru (lihat `docs/operations/BACKUP_RECOVERY.md`).
