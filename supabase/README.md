# LaporLintas — Database Setup Guide

Panduan untuk mengonfigurasi database Supabase agar aplikasi **LaporLintas** dapat dijalankan di lingkungan developer masing-masing.

## Daftar Isi

1. [Persyaratan](#1-persyaratan)
2. [Membuat Proyek Supabase](#2-membuat-proyek-supabase)
3. [Menjalankan Schema SQL](#3-menjalankan-schema-sql)
4. [Mengatur Storage](#4-mengatur-storage)
5. [Mengatur Environment Variables](#5-mengatur-environment-variables)
6. [Membuat Akun Administrator](#6-membuat-akun-administrator)
7. [Menjalankan Aplikasi](#7-menjalankan-aplikasi)
8. [Verifikasi Database](#8-verifikasi-database)
9. [Troubleshooting](#9-troubleshooting)
10. [Keamanan](#10-keamanan)

---

## 1. Persyaratan

Sebelum memulai, pastikan kamu memiliki:

- Akun [Supabase](https://supabase.com/).
- Repository LaporLintas yang sudah di-clone.
- Node.js dan npm yang sesuai dengan kebutuhan proyek.
- File `supabase/schema.sql` dari repository.
- File `.env.example` jika tersedia di repository.

> **Penting:** Panduan ini ditujukan untuk membuat proyek Supabase baru. Jika kamu menggunakan database yang sudah berisi data, periksa migrasi dan struktur tabel terlebih dahulu sebelum menjalankan SQL.

## 2. Membuat Proyek Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Login ke akun Supabase kamu.
3. Klik **New Project**.
4. Pilih organisasi yang akan digunakan.
5. Masukkan nama proyek, misalnya `laporlintas`.
6. Buat password database yang kuat dan simpan dengan aman.
7. Pilih region yang sesuai.
8. Klik **Create new project**.
9. Tunggu hingga proyek selesai dibuat.

Setelah proyek siap, buka halaman proyek tersebut.

## 3. Menjalankan Schema SQL

Schema SQL digunakan untuk membuat tabel, relasi, fungsi, trigger, indeks, serta kebijakan akses database.

### Langkah 1 — Buka SQL Editor

1. Masuk ke proyek Supabase.
2. Buka menu **SQL Editor**.
3. Pilih **New query**.

### Langkah 2 — Salin schema

1. Buka repository LaporLintas di komputer kamu.
2. Buka file `supabase/schema.sql`.
3. Salin seluruh isi file tersebut.

### Langkah 3 — Jalankan query

1. Tempelkan SQL ke SQL Editor.
2. Periksa bahwa file yang digunakan berasal dari versi repository yang sama.
3. Klik **Run**.
4. Pastikan tidak ada error sebelum melanjutkan.

Jika muncul error, baca pesan error dan perbaiki penyebabnya terlebih dahulu. Jangan menjalankan ulang seluruh SQL secara berulang tanpa memahami error yang terjadi.

### Komponen yang dibuat

Schema LaporLintas dirancang untuk menyiapkan komponen berikut:

| Komponen | Kegunaan |
|---|---|
| `profiles` | Menyimpan profil dan role pengguna |
| `reports` | Menyimpan laporan pelanggaran lalu lintas |
| `report_status_history` | Menyimpan riwayat perubahan status laporan |
| `handle_new_user()` | Membuat profil saat pengguna baru mendaftar |
| `is_admin()` | Memeriksa hak akses administrator |
| `admin_update_report_status()` | Memperbarui status laporan melalui fungsi admin |
| Row Level Security (RLS) | Membatasi akses terhadap data |
| Storage `report-photos` | Menyimpan foto bukti laporan |

Nama dan struktur di atas harus sesuai dengan versi `schema.sql` yang digunakan.

## 4. Mengatur Storage

LaporLintas menggunakan Supabase Storage untuk menyimpan foto bukti laporan.

Jika schema berhasil membuat bucket secara otomatis, periksa bahwa bucket tersebut sudah tersedia sebelum membuat bucket baru.

### Periksa bucket

1. Buka menu **Storage** di Supabase.
2. Cari bucket bernama `report-photos`.
3. Pastikan bucket tersedia.
4. Pastikan bucket dikonfigurasi sebagai **private**.
5. Periksa batas ukuran file dan tipe MIME yang diizinkan oleh schema.

Konfigurasi awal yang dituju:

- Nama bucket: `report-photos`
- Akses publik: dinonaktifkan
- Batas ukuran file: 5 MB
- Tipe file: JPEG, PNG, dan WebP

Jika bucket belum tersedia, periksa kembali hasil eksekusi schema dan kebijakan Storage. Jangan langsung membuat kebijakan duplikat.

## 5. Mengatur Environment Variables

Aplikasi frontend membutuhkan URL dan public key dari proyek Supabase yang baru dibuat.

### Mendapatkan kredensial

1. Buka proyek Supabase.
2. Masuk ke bagian **Project Settings** atau bagian koneksi/API proyek, sesuai tampilan dashboard.
3. Salin Project URL.
4. Salin publishable key atau anon key yang memang ditujukan untuk frontend.

### Mengatur file `.env`

Di folder utama proyek, buat file `.env` berdasarkan `.env.example` jika tersedia.

Contoh konfigurasi untuk proyek Vite:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY
```

Gunakan nama variabel yang benar-benar dibaca oleh kode aplikasi. Jika proyek menggunakan `VITE_SUPABASE_PUBLISHABLE_KEY` atau nama lain, sesuaikan dengan implementasinya.

**Jangan memasukkan `service_role` key atau secret key ke dalam frontend, file `.env` yang akan dipublikasikan, maupun repository GitHub.**

Pastikan file `.env` tercantum dalam `.gitignore`.

## 6. Membuat Akun Administrator

Akun yang mendaftar secara normal akan mendapatkan role `user`. Untuk mengakses dashboard administrator, role akun harus diubah secara terkontrol.

### Langkah 1 — Daftar akun

1. Jalankan aplikasi.
2. Daftar menggunakan email yang kamu miliki.
3. Selesaikan verifikasi email jika diminta.
4. Login ke aplikasi.

### Langkah 2 — Temukan UUID akun

1. Buka Supabase Dashboard.
2. Masuk ke **Authentication → Users**.
3. Cari akun yang baru dibuat.
4. Salin UUID akun tersebut.

### Langkah 3 — Promosikan akun menjadi admin

Buka **SQL Editor → New query**, kemudian jalankan query berikut setelah mengganti UUID contoh dengan UUID akun kamu:

```sql
INSERT INTO public.profiles (id, full_name, role)
SELECT
    id,
    COALESCE(
        NULLIF(raw_user_meta_data ->> 'full_name', ''),
        'Administrator'
    ),
    'admin'
FROM auth.users
WHERE id = 'YOUR_USER_UUID'::UUID
ON CONFLICT (id)
DO UPDATE SET role = 'admin';
```

Ganti `YOUR_USER_UUID` dengan UUID akun yang benar.

Pastikan query memproses akun yang dimaksud. Jangan memberikan role `admin` kepada akun yang tidak kamu percaya.

### Langkah 4 — Verifikasi role

Jalankan:

```sql
SELECT id, full_name, role
FROM public.profiles
WHERE id = 'YOUR_USER_UUID'::UUID;
```

Hasil yang diharapkan menunjukkan role `admin`.

Setelah itu, logout dan login kembali jika tampilan aplikasi belum memperbarui status akses.

## 7. Menjalankan Aplikasi

Setelah database dan environment variables dikonfigurasi, buka terminal pada folder utama repository.

Instal dependency:

```bash
npm install
```

Jalankan server development:

```bash
npm run dev
```

Buka alamat lokal yang ditampilkan oleh terminal.

Perintah di atas mengasumsikan proyek menggunakan npm dan script `dev`. Periksa `package.json` jika repository menggunakan package manager atau perintah berbeda.

## 8. Verifikasi Database

Jalankan pemeriksaan berikut melalui SQL Editor.

### Periksa tabel

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'profiles',
      'reports',
      'report_status_history'
  )
ORDER BY table_name;
```

Pastikan ketiga tabel ditemukan.

### Periksa fungsi

```sql
SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'handle_new_user',
      'is_admin',
      'admin_update_report_status'
  )
ORDER BY p.proname;
```

Pastikan fungsi yang dibutuhkan tersedia. Fungsi RPC perubahan status pada schema ini menggunakan parameter bernama `p_admin_note`, `p_report_id`, dan `p_status`.

### Periksa bucket Storage

```sql
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'report-photos';
```

Pastikan bucket ditemukan dan `public` bernilai `false`.

### Uji alur aplikasi

Setelah pemeriksaan database:

- [ ] Pengguna dapat mendaftar dan login.
- [ ] Profil pengguna dibuat secara otomatis.
- [ ] Pengguna dapat membuat laporan.
- [ ] Laporan dapat menampilkan data yang benar.
- [ ] Upload foto berjalan sesuai kebijakan Storage.
- [ ] Pengguna biasa tidak dapat mengakses fitur admin.
- [ ] Admin dapat melihat laporan dan mengubah status.
- [ ] Riwayat perubahan status tersimpan.
- [ ] Pengguna hanya dapat mengakses data yang diizinkan.

## 9. Troubleshooting

### Error: `Bucket not found`

Periksa apakah bucket `report-photos` sudah dibuat. Pastikan nama bucket pada frontend sama persis dengan nama bucket di Supabase.

### Error: `Could not find a relationship between reports and profiles`

Periksa foreign key antara `reports.user_id` dan `profiles.id`. Pastikan profil yang dirujuk sudah ada dan struktur database sesuai dengan schema. Jika baru menambahkan relasi, periksa juga schema cache PostgREST.

### Error: `Could not find the function ... in the schema cache`

Periksa apakah fungsi `admin_update_report_status()` sudah dibuat dengan parameter yang benar. Pastikan pemanggilan RPC di frontend menggunakan nama parameter yang sesuai. Jika diperlukan, muat ulang schema cache setelah perubahan fungsi.

### Error: foreign key pada `reports.user_id`

Pastikan setiap `user_id` merujuk ke profil yang valid. Data lama yang tidak memiliki profil terkait perlu diperiksa dan diperbaiki sebelum menambahkan constraint.

### Error saat menjalankan SQL

Periksa pesan error dan bagian query yang gagal. Sebagian perintah mungkin sudah berhasil dijalankan sebelum error muncul. Periksa kondisi database sebelum menjalankan ulang query.

## 10. Keamanan

- Jangan pernah mempublikasikan database password, secret key, atau `service_role` key.
- Gunakan RLS untuk membatasi akses data.
- Jangan mempercayai role admin yang dikirim oleh frontend; hak akses harus diperiksa di sisi database.
- Pertahankan bucket foto sebagai private jika foto laporan tidak dimaksudkan untuk akses publik.
- Jangan menjalankan SQL yang menghapus tabel atau data pada database produksi tanpa backup.
- Sebelum mengubah database yang sudah digunakan, buat backup dan siapkan migrasi yang sesuai.
- Uji akses pengguna biasa dan admin sebelum aplikasi digunakan secara publik.

---

## Selesai

Jika semua langkah berhasil, database Supabase sudah disiapkan untuk pengujian aplikasi LaporLintas.

Jika terjadi error, periksa pesan error, struktur tabel, fungsi, kebijakan RLS, Storage, dan environment variables. Keberhasilan menjalankan SQL saja belum menjamin semua fitur frontend bekerja; lakukan pengujian alur aplikasi sebelum deployment.

**Referensi:**

- Supabase Documentation: https://supabase.com/docs
- Supabase Database: https://supabase.com/docs/guides/database
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Storage: https://supabase.com/docs/guides/storage
