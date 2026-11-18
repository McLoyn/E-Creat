# EKRAF HUB — Konfigurasi & Integrasi Supabase Storage
**Dokumen Referensi:** `docs/storage/STORAGE_CONFIGURATION.md`  
**Status:** Terimplementasi & Teruji  
**Branch:** `fix/backend-foundation-security`

---

## 1. Ikhtisar Layanan Penyimpanan
Untuk mencegah hilangnya aset gambar di platform hosting serverless/ephemeral (seperti Vercel atau Render), seluruh unggahan media dialihkan ke **Supabase Storage**.

---

## 2. Struktur Bucket & Folder

### 2.1 Bucket Publik: `ekraf-public`
- **Tipe:** Public Bucket (Akses baca publik melalui CDN Supabase).
- **Struktur Direktori:**
  - `profiles/`: Foto profil kreator dan pengguna umum (`profiles/[UUID].[ext]`).
  - `works/`: Gambar portofolio karya Showcase Tuban (`works/[UUID].[ext]`).
  - `products/`: Foto produk Pasar Ekraf Tuban (`products/[UUID].[ext]`).
  - `general/`: Aset umum, logo sub-apps, dan banner ekosistem (`general/[UUID].[ext]`).

---

## 3. Kebijakan Keamanan & Integritas File (Upload Security)

1. **Batas Ukuran:** Maksimal **2 MB** per file. File melebihi batas ditolak langsung dengan status HTTP 413 (*Payload Too Large*).
2. **Format Gambar yang Diizinkan:**
   - JPEG / JPG (`image/jpeg`)
   - PNG (`image/png`)
   - WebP (`image/webp`)
3. **Validasi Cryptographic Magic Bytes (File Signature):**
   - Mencegah serangan unggahan file palsu (misal: script PHP/HTML berbahaya yang diubah namanya menjadi `.png`).
   - Server membaca byte header awal:
     - JPEG: `FF D8 FF`
     - PNG: `89 50 4E 47 0D 0A 1A 0A`
     - WebP: `RIFF....WEBP`
   - File yang gagal verifikasi signature langsung ditolak dengan HTTP 422 (*Unprocessable Entity*).
4. **Nama File Acak (Anti-Collision & Anti-Traversal):**
   - Nama asli file pengguna tidak digunakan langsung pada penyimpanan.
   - Menggunakan UUID v4 acak kriptografis (`crypto.randomUUID() + ext`).
5. **Autentikasi Wajib:** Endpoint upload (`POST /api/v1/uploads/images`) mewajibkan login pengguna (`requireAuth`). Tamu tanpa sesi tidak dapat mengunggah file (HTTP 401).

---

## 4. Panduan Konfigurasi Supabase Storage untuk Pemilik Proyek

### Langkah 1: Buat Bucket di Supabase Dashboard
1. Buka Dashboard Supabase > Menu **Storage**.
2. Klik tombol **New bucket**.
3. Isi kolom **Name of bucket** dengan: `ekraf-public`.
4. Centang pilihan **Public bucket** (agar gambar dapat diakses oleh browser pengunjung situs).
5. Atur **File size limit** ke `2MB`.
6. Atur **Allowed MIME types** ke `image/jpeg, image/png, image/webp`.
7. Klik **Save**.

### Langkah 2: Atur Storage Access Policies (RLS)
Tambahkan Storage Policy untuk bucket `ekraf-public`:
- **SELECT Policy (Public Access):**
  - Name: `Public Access for All`
  - Allowed operations: `SELECT`
  - Target roles: `anon`, `authenticated`
  - Policy definition: `bucket_id = 'ekraf-public'`
- **INSERT / UPDATE / DELETE Policy (Service Role):**
  - Backend API Ekraf HUB berinteraksi menggunakan `SUPABASE_SERVICE_ROLE_KEY` secara aman dari sisi server sehingga operasi penulisan dan penghapusan terproteksi penuh dari akses client langsung.

### Langkah 3: Konfigurasi Environment Variable
Tambahkan variabel berikut ke environment server (`apps/api/.env`):
```env
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_STORAGE_BUCKET="ekraf-public"
```

---

## 5. Perilaku Environment & Mode Fallback Lokal
- **Production (`NODE_ENV=production`):** Fallback disk lokal **DILARANG KERAS**. Sistem akan gagal startup atau menolak unggahan (HTTP 500 fail-fast) jika `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY` tidak tersedia. Hal ini melindungi dari risiko kehilangan aset media pada ephemeral/serverless container.
- **Development (`NODE_ENV=development`):** Jika `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY` belum dikonfigurasi saat pengujian offline, sistem menggunakan penyimpanan disk lokal (`uploads/`) untuk mempermudah development tanpa koneksi internet.
