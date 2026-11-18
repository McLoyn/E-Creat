# EKRAF HUB — Panduan Konfigurasi Lingkungan (Environment Setup)
**Dokumen Referensi:** `docs/operations/ENVIRONMENT_SETUP.md`  
**Status:** Teruji  
**Branch:** `fix/backend-foundation-security`

---

## 1. Daftar Variabel Lingkungan Lengkap

Berikut adalah matriks konfigurasi variabel lingkungan yang digunakan oleh Ekraf HUB:

| Variabel | Wajib? | Contoh / Format | Deskripsi |
|---|---|---|---|
| `PORT` | Tidak (Default: 4000) | `4000` | Port listen server API Express |
| `HOST` | Tidak (Default: 127.0.0.1) | `127.0.0.1` (Dev) / `0.0.0.0` (Prod) | Network interface host binding |
| `NODE_ENV` | Ya | `development` / `production` | Mode runtime aplikasi |
| `DATABASE_URL` | Ya | `postgresql://...` atau `file:./dev.db` | Connection string PostgreSQL Supabase atau SQLite |
| `DIRECT_URL` | Opsional | `postgresql://...:5432/postgres` | Direct connection URL untuk migrasi Prisma |
| `JWT_ACCESS_SECRET` | **Wajib** | String acak minimal 32 karakter | Kunci rahasia penandatanganan access token (HS256) |
| `JWT_REFRESH_SECRET` | **Wajib** | String acak minimal 32 karakter | Kunci rahasia penandatanganan refresh token (HS256) |
| `WEB_ORIGIN` | **Wajib** | `http://localhost:5173,https://ekraftuban.id` | Allowlist origin CORS (koma sebagai pemisah, dilarang wildcard di prod) |
| `COOKIE_SECURE` | Ya | `false` (Dev HTTP) / `true` (Prod HTTPS) | Mengaktifkan atribut Secure pada cookie sesi |
| `GOOGLE_CLIENT_ID` | Ya (jika OAuth) | `xxxx.apps.googleusercontent.com` | Client ID Google Cloud OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Ya (jika OAuth) | `GOCSPX-xxxx` | Client Secret Google Cloud OAuth 2.0 |
| `GOOGLE_REDIRECT_URI` | Ya (jika OAuth) | `https://api.ekraftuban.id/api/v1/auth/google/callback` | Redirect URI resmi yang terdaftar di Google Console |
| `SUPABASE_URL` | Ya (jika Storage) | `https://xxxx.supabase.co` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya (jika Storage) | `eyJhbGciOi...` | Service role API key untuk operasi storage server-side |
| `SUPABASE_STORAGE_BUCKET` | Tidak | `ekraf-public` | Nama bucket publik Supabase Storage |

---

## 2. Panduan Setup Google Cloud Console (OAuth 2.0)

Untuk mengaktifkan autentikasi Google resmi pada Ekraf HUB:

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada: **Ekraf HUB Tuban**.
3. Buka menu **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**.
   - App name: `Ekraf HUB Tuban`.
   - User support email & Developer contact info: isi dengan email administrator resmi.
   - Scopes: tambahkan `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
4. Buka menu **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Ekraf HUB Web Client`.
   - **Authorized JavaScript origins**:
     - Development: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4000`
     - Production: `https://ekraftuban.id`, `https://api.ekraftuban.id`
   - **Authorized redirect URIs**:
     - Development: `http://localhost:4000/api/v1/auth/google/callback`
     - Production: `https://api.ekraftuban.id/api/v1/auth/google/callback`
5. Salin **Client ID** dan **Client Secret**, masukkan ke dalam `.env`:
   ```env
   GOOGLE_CLIENT_ID="[CLIENT_ID_DARI_GOOGLE]"
   GOOGLE_CLIENT_SECRET="[CLIENT_SECRET_DARI_GOOGLE]"
   GOOGLE_REDIRECT_URI="http://localhost:4000/api/v1/auth/google/callback"
   ```

---

## 3. Cara Mengganti JWT Secret Secara Aman (Key Rotation)

Jika kunci JWT perlu diganti akibat audit berkala atau dugaan kebocoran:
1. Buat string acak baru berentropi tinggi menggunakan terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Perbarui environment variable `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` pada server hosting (dashboard Vercel / Render / Supabase).
3. Restart server backend API.
4. Seluruh sesi lama akan kedaluwarsa secara otomatis dan aman, memaksa pengguna untuk login kembali dengan autentikasi bersih.
