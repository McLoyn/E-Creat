# EKRAF HUB — Kebijakan Cadangan & Pemulihan Bencana (Backup & Disaster Recovery)
**Dokumen Referensi:** `docs/operations/BACKUP_RECOVERY.md`  
**Status:** Siap Pakai  
**Branch:** `fix/backend-foundation-security`

---

## 1. Tujuan & Ruang Lingkup
Dokumen ini menetapkan prosedur operasional standar (SOP) pencadangan data otomatis, kebijakan retensi, simulasi pengujian pemulihan (restore), serta respon insiden jika terjadi kegagalan infrastruktur pada Ekraf HUB.

---

## 2. Strategi Pencadangan Database (Supabase PostgreSQL)

### 2.1 Pencadangan Otomatis Supabase (Point-in-Time Recovery / Daily Snapshot)
- **Supabase Daily Backup:** Supabase Enterprise / Pro menyediakan snapshot harian otomatis dan PITR (Point-in-Time Recovery) hingga 7–30 hari.
- **RPO (Recovery Point Objective):** Maksimal 1 jam untuk transaksi aktif, atau harian (24 jam) untuk paket standar.
- **RTO (Recovery Time Objective):** Maksimal 30 menit untuk proses pemulihan ke instance baru.

### 2.2 Pencadangan Mandiri Melalui Script (Off-site Logical Dump)
Untuk redundansi di luar platform Supabase, sediakan cron job mingguan menggunakan `pg_dump`:
```bash
#!/bin/sh
# Script Ekspor Cadangan PostgreSQL Ekraf HUB
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/ekraf-hub"
mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$BACKUP_DIR/ekraf_backup_$TIMESTAMP.dump"

# Enkripsi arsip cadangan menggunakan GPG (Opsional)
# gpg --symmetric --cipher-algo AES256 "$BACKUP_DIR/ekraf_backup_$TIMESTAMP.dump"

# Bersihkan cadangan yang lebih lama dari 30 hari
find "$BACKUP_DIR" -type f -name "ekraf_backup_*.dump" -mtime +30 -exec rm {} \;
```

### 2.3 Kebijakan Retensi (Retention Policy)
- **Daily Snapshots:** Disimpan selama 7 hari.
- **Weekly Archives:** Disimpan selama 4 minggu.
- **Monthly Snapshots:** Disimpan selama 12 bulan (arsip akhir bulan untuk keperluan audit kepatuhan).

---

## 3. Prosedur Pemulihan Data (Restore Procedures)

### 3.1 Langkah Pemulihan Database dari Supabase Dashboard
1. Buka Supabase Dashboard > **Database** > **Backups**.
2. Pilih titik waktu snapshot yang diinginkan.
3. Klik tombol **Restore to this backup** atau pulihkan ke project staging terpisah untuk verifikasi data sebelum diarahkan ke production.

### 3.2 Langkah Pemulihan Manual via CLI (`pg_restore`)
Jika memulihkan dari file logical dump ke instance database baru:
```bash
# 1. Bersihkan database target (jika fresh staging)
dropdb -h [DB_HOST] -U [DB_USER] [DB_NAME]
createdb -h [DB_HOST] -U [DB_USER] [DB_NAME]

# 2. Pulihkan struktur dan data
pg_restore \
  -h [DB_HOST] \
  -U [DB_USER] \
  -d [DB_NAME] \
  --clean \
  --if-exists \
  --no-owner \
  "ekraf_backup_[TIMESTAMP].dump"

# 3. Verifikasi integritas tabel utama
psql -h [DB_HOST] -U [DB_USER] -d [DB_NAME] -c "SELECT COUNT(*) FROM \"User\";"
psql -h [DB_HOST] -U [DB_USER] -d [DB_NAME] -c "SELECT COUNT(*) FROM \"CreativeProfile\";"
psql -h [DB_HOST] -U [DB_USER] -d [DB_NAME] -c "SELECT COUNT(*) FROM \"CreativeWork\";"
psql -h [DB_HOST] -U [DB_USER] -d [DB_NAME] -c "SELECT COUNT(*) FROM \"CreativeProduct\";"
```

---

## 4. Pencadangan & Pemulihan Media (Supabase Storage)

1. Supabase Storage menyimpan objek media pada underlying AWS S3 / Cloud Storage yang memiliki ketahanan (*durability*) 99.999999999% (11 9s).
2. Sinkronisasi aset media dapat dilakukan secara berkala menggunakan Supabase CLI:
   ```bash
   # Contoh sinkronisasi bucket ke storage cadangan lokal
   supabase storage download ekraf-public ./backup-media/
   ```

---

## 5. Prosedur Respon Insiden (Incident Response Runbook)

| Langkah | Aksi | Penanggung Jawab |
|---|---|---|
| 1. Deteksi | Sistem monitoring mencatat error spike 5xx atau database disconnect pada `/api/v1/health` | DevOps / Lead Engineer |
| 2. Isolasi | Alihkan traffic web ke halaman maintenance sementara | DevOps |
| 3. Diagnosa | Periksa log backend API dan status layanan Supabase (status.supabase.com) | Lead Engineer |
| 4. Mitigasi | Jika terjadi kerusakan data, lakukan restore ke snapshot terakhir | Database Admin |
| 5. Verifikasi | Jalankan automated test suite `apps/api/test_security.ts` pada database hasil restore | Security Engineer |
| 6. Go-Live | Arahkan koneksi backend ke database yang telah dipulihkan dan buka akses web | DevOps |
| 7. Post-Mortem | Buat laporan insiden dan evaluasi pencegahan dalam 48 jam | Tim Engineering |
