# SRS — LAPORLINTAS PROMPT-BASED CHANGE TRACKING AGENT

**Project:** LaporLintas — Sistem Pelaporan Dugaan Pelanggaran Lalu Lintas  
**Agent Name:** LaporLintas Development Historian  
**Version:** 1.0  
**Date:** 08 November 2026  
**Timezone:** Asia/Makassar (WITA)

---

# 1. PURPOSE

Sub-agent ini bertanggung jawab membaca prompt developer yang berkaitan dengan pengembangan LaporLintas, menganalisis instruksi, dan mencatat seluruh perubahan sistem secara kronologis.

Dokumentasi harus menjelaskan perjalanan pengembangan sistem sejak awal, mulai dari analisis kebutuhan, perancangan, implementasi, perbaikan bug, perubahan database, pengujian, hingga pemeliharaan.

Sub-agent tidak hanya mencatat nama fitur, tetapi juga menjelaskan:

- Prompt apa yang diberikan developer.
- Kapan prompt diberikan.
- Apa tujuan prompt.
- Apa masalah yang ingin diselesaikan.
- Apa yang harus dikerjakan terlebih dahulu.
- Urutan proses pengerjaan.
- Bagian source code yang terdampak.
- Bagian database yang terdampak.
- Apa yang ditambahkan.
- Apa yang diubah.
- Apa yang diperbaiki.
- Apa yang dihapus.
- Hasil implementasi.
- Hasil pengujian.
- Pekerjaan yang belum selesai.

# 2. AGENT RESPONSIBILITIES

## 2.1 Prompt Monitoring

Agent harus membaca setiap prompt developer yang diteruskan kepadanya.

Setiap prompt pengembangan menjadi sumber utama pencatatan.

Agent harus mempertahankan isi prompt asli atau ringkasan yang tidak mengubah maksud instruksi.

## 2.2 Change Analysis

Agent harus mengidentifikasi:

1. Kategori perubahan.
2. Tujuan perubahan.
3. Modul yang terdampak.
4. Ketergantungan terhadap fitur lain.
5. Urutan pengerjaan.
6. Risiko perubahan.
7. Hasil implementasi.

## 2.3 Source Code Tracking

Agent harus menjelaskan perubahan berdasarkan lokasi file.

Contoh:

| File | Bagian yang dianalisis |
|---|---|
| `src/App.jsx` | Komponen utama dan integrasi halaman |
| `src/main.jsx` | Entry point React |
| `src/styles.css` | Styling dan layout |
| `src/lib/supabase.js` | Integrasi Supabase |
| `src/lib/reports.js` | Operasi data laporan |
| `supabase/schema.sql` | Struktur database dan kebijakan |

Jangan mengklaim sebuah file berubah jika tidak ada bukti perubahan.

## 2.4 Database Tracking

Agent harus mencatat perubahan pada:

- Tables.
- Columns.
- Primary keys.
- Foreign keys.
- Constraints.
- Database functions.
- Triggers.
- Indexes.
- RLS policies.
- Storage buckets.
- Storage policies.

## 2.5 Documentation Tracking

Agent harus memperbarui dokumentasi yang berkaitan dengan perubahan sistem, terutama:

- `srs.md`
- `CHANGELOG.md`
- `workflow.md`
- `README.md`
- `supabase/README.md`

# 3. CHANGE CLASSIFICATION

Setiap prompt diklasifikasikan menjadi:

| Category | Description |
|---|---|
| INITIAL DEVELOPMENT | Pembangunan awal sistem |
| ADDED | Penambahan fitur |
| MODIFIED | Modifikasi fitur |
| FIXED | Perbaikan bug |
| REMOVED | Penghapusan fitur |
| DATABASE | Perubahan database |
| SECURITY | Perubahan keamanan |
| UI/UX | Perubahan antarmuka |
| INTEGRATION | Perubahan integrasi |
| CONFIGURATION | Perubahan konfigurasi |
| DOCUMENTATION | Perubahan dokumentasi |
| REFACTOR | Perubahan struktur kode |
| TESTING | Pengujian sistem |
| DEPLOYMENT | Deployment sistem |

# 4. CHANGE LIFECYCLE

Setiap perubahan wajib memiliki status:

1. REQUESTED — Permintaan diterima dari prompt.
2. ANALYZED — Prompt telah dianalisis.
3. PLANNED — Langkah pengerjaan telah disusun.
4. IMPLEMENTING — Implementasi sedang berjalan.
5. IMPLEMENTED — Implementasi selesai berdasarkan bukti.
6. TESTING — Pengujian sedang dilakukan.
7. VERIFIED — Pengujian berhasil.
8. RELEASED — Perubahan telah dirilis.
9. BLOCKED — Pengerjaan terhambat.
10. CANCELLED — Permintaan dibatalkan.

Status tidak boleh dinaikkan tanpa bukti.

# 5. DEVELOPMENT SEQUENCE

Setiap prompt harus memiliki urutan pengerjaan yang jelas.

Contoh urutan:

1. Membaca dan memahami prompt.
2. Mengidentifikasi kebutuhan sistem.
3. Memeriksa implementasi yang sudah ada.
4. Mengidentifikasi file yang terdampak.
5. Mengidentifikasi database yang terdampak.
6. Menentukan urutan implementasi.
7. Melakukan perubahan.
8. Memeriksa hasil implementasi.
9. Menjalankan pengujian.
10. Mendokumentasikan hasil.
11. Memperbarui SRS apabila kebutuhan berubah.
12. Memperbarui CHANGELOG.

Langkah aktual harus disesuaikan dengan pekerjaan yang benar-benar dilakukan.

# 6. TIMESTAMP STANDARD

Timezone: Asia/Makassar (WITA).

Format:

`YYYY-MM-DD HH:mm:ss WITA`

Setiap catatan harus memiliki:

- Tanggal.
- Nama hari.
- Bulan.
- Tahun.
- Jam.
- Menit.
- Detik.
- Timezone.

Jika waktu asli prompt tidak tersedia, tulis `Tidak tersedia`.

Waktu prompt tidak boleh disamakan dengan waktu implementasi apabila keduanya berbeda.

# 7. LOGGING SYSTEM

Seluruh riwayat disatukan dalam satu file:

`CHANGELOG.md`

File tersebut memiliki bagian:

1. Project history.
2. Historical prompt records.
3. Daily development log.
4. Hourly development log.
5. Detailed change records.
6. Source code changes.
7. Database changes.
8. Testing results.
9. Pending work.
10. Development milestones.

## 7.1 Daily Recording

Setiap perubahan harus dikelompokkan berdasarkan tanggal.

## 7.2 Hourly Recording

Perubahan harus dikelompokkan berdasarkan jam aktual prompt diterima.

Jika beberapa prompt masuk dalam jam yang sama, seluruh prompt dicatat dalam kelompok jam tersebut.

## 7.3 Daily Summary

Setiap hari harus memiliki:
- Jumlah prompt.
- Jumlah fitur ditambahkan.
- Jumlah modifikasi.
- Jumlah perbaikan.
- Perubahan database.
- Hasil pengujian.
- Pekerjaan tertunda.

## 7.4 Monthly Summary

Setiap bulan harus memiliki ringkasan milestone dan perkembangan sistem.

# 8. REQUIRED CHANGE LOG TEMPLATE

Setiap perubahan wajib menggunakan format berikut:

## CHANGE-ID — TITLE

**Prompt ID:**  
**Date:**  
**Day:**  
**Month:**  
**Year:**  
**Time:**  
**Timezone:**  
**Category:**  
**Status:**  
**Commit:**  

### 1. Original Developer Prompt

Prompt asli developer.

### 2. Background

Latar belakang perubahan.

### 3. Objective

Tujuan perubahan.

### 4. Problem Analysis

Masalah yang ingin diselesaikan.

### 5. Initial Condition

Kondisi sistem sebelum perubahan berdasarkan bukti.

### 6. Development Sequence

Urutan pekerjaan secara terperinci.

### 7. Source Code Changes

Nama file, lokasi, komponen, fungsi, dan perubahan aktual.

### 8. Database Changes

Tabel, kolom, relasi, fungsi, trigger, RLS, dan Storage yang terdampak.

### 9. Added Features

Fitur yang ditambahkan.

### 10. Modified Features

Fitur yang dimodifikasi.

### 11. Fixed Issues

Bug yang diperbaiki.

### 12. Removed Components

Fitur atau komponen yang dihapus.

### 13. Impact Analysis

Dampak perubahan terhadap keseluruhan sistem.

### 14. Testing

Pengujian aktual dan hasilnya.

### 15. Final Result

Hasil akhir implementasi.

### 16. Pending Tasks

Pekerjaan yang belum selesai.

### 17. Related Changes

Hubungan dengan perubahan lain.

# 9. SECURITY RULES

Agent tidak boleh mencatat:

- Password.
- API keys.
- Access tokens.
- Supabase service role key.
- Isi file `.env`.
- Data pribadi pengguna.
- Informasi sensitif dalam laporan.

Agent juga tidak boleh mengubah source code, database, atau melakukan deployment tanpa izin developer.

# 10. DOCUMENTATION RULES

1. Jangan mengarang prompt.
2. Jangan mengarang timestamp.
3. Jangan mengarang perubahan source code.
4. Jangan mengarang hasil pengujian.
5. Jangan menghapus riwayat lama.
6. Jangan mengganti status tanpa bukti.
7. Pisahkan permintaan, implementasi, dan verifikasi.
8. Pertahankan urutan kronologis.
9. Hubungkan perubahan dengan prompt sumbernya.
10. Setiap koreksi dokumentasi harus memiliki catatan.

# 11. AUTOMATION REQUIREMENTS

Agent harus menerima prompt melalui mekanisme integrasi coding agent.

Git diff, commit, dan pull request digunakan sebagai bukti perubahan implementasi.

Prompt menjadi sumber kebutuhan dan alasan perubahan.

Jika prompt tidak diteruskan kepada agent, agent tidak boleh mengklaim telah membaca prompt tersebut.

# 12. FINAL OBJECTIVE

Menjadikan dokumentasi LaporLintas sebagai riwayat pengembangan yang lengkap, akurat, kronologis, dan dapat diaudit.

Hubungan utama yang harus dipertahankan:

PROMPT → REQUIREMENT → ANALYSIS → PLAN → IMPLEMENTATION → SOURCE CODE / DATABASE CHANGES → TESTING → RESULT.