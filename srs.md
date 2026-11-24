# SRS — LAPORLINTAS PROMPT-BASED CHANGE TRACKING AGENT & SYSTEM REQUIREMENTS SPECIFICATION

**Project:** LaporLintas — Sistem Pelaporan Dugaan Pelanggaran Lalu Lintas  
**Agent Name:** LaporLintas Development Historian & System Specification  
**Version:** 1.2  
**Date:** 24 November 2026  
**Timezone:** Asia/Makassar (WITA)  
**Status:** ACTIVE & UP TO DATE

---

# TABLE OF CONTENTS

1. Document Purpose & Scope
2. Change Tracking Agent Specification
   2.1 Agent Purpose
   2.2 Agent Responsibilities
   2.3 Source Code & Architecture Tracking
   2.4 Database & Storage Tracking
   2.5 Change Classification
   2.6 Change Lifecycle
   2.7 Development Sequence
   2.8 Logging System Standard
   2.9 Required Change Log Template
   2.10 Security & Ethical Rules
3. System Requirements Specification (LaporLintas Core & AI Features)
   3.1 System Overview & Architecture
   3.2 User Roles & Access Control
   3.3 Functional Requirements (FR)
       - FR-1: Autentikasi & Manajemen Akun
       - FR-2: Pelaporan Masyarakat (Citizen Flow)
       - FR-3: Riwayat & Perbaikan Laporan
       - FR-4: Dashboard Administrator (Admin Flow)
       - FR-5: Machine Learning — AI Spam Detection (Multinomial Naive Bayes)
       - FR-6: Machine Learning — AI Photo Traffic & Consistency Detection (YOLOv8n ONNX)
       - FR-7: Moderasi & Verifikasi Keputusan
   3.4 Non-Functional Requirements (NFR)
       - NFR-1: Performa & Kecepatan Inferensi
       - NFR-2: Keamanan Data & Kebijakan RLS
       - NFR-3: Ketersediaan & Graceful Fallback
       - NFR-4: Usability & Antarmuka Responsif
   3.5 Data & Database Requirements
       - Database Tables & Relationships
       - AI Detection Columns
       - Storage Buckets
   3.6 Machine Learning Service Specification (ml-service)
       - Arsitektur Layanan FastAPI
       - Spam Classifier Pipeline
       - Photo Detector Pipeline
       - API Contracts

---

# 1. DOCUMENT PURPOSE & SCOPE

Dokumen ini menggabungkan dua fungsi esensial:
1. **Spesifikasi Change Tracking Agent**: Panduan bagi sub-agent dokumenter dalam memantau prompt developer, mencatat perubahan kronologis, dan memverifikasi siklus pengembangan.
2. **System Requirements Specification (SRS)**: Spesifikasi lengkap fungsional dan non-fungsional aplikasi LaporLintas terkini, termasuk modul Machine Learning (AI Spam Detection & AI Photo Traffic Detection), integrasi Supabase, dan hak akses multi-peran.

---

# 2. CHANGE TRACKING AGENT SPECIFICATION

## 2.1 Agent Purpose

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
- Apa yang ditambahkan, diubah, diperbaiki, dan dihapus.
- Hasil implementasi dan hasil pengujian.
- Pekerjaan yang belum selesai.

## 2.2 Agent Responsibilities

### 2.2.1 Prompt Monitoring
Agent harus membaca setiap prompt developer yang diteruskan kepadanya sebagai sumber utama pencatatan. Agent harus mempertahankan isi prompt asli atau ringkasan yang tidak mengubah maksud instruksi.

### 2.2.2 Change Analysis
Agent harus mengidentifikasi kategori perubahan, tujuan, modul terdampak, ketergantungan fitur, urutan pengerjaan, risiko, dan hasil implementasi aktual.

## 2.3 Source Code & Architecture Tracking

Agent harus menjelaskan perubahan berdasarkan lokasi file yang aktual:

| Modul / Direktori | File | Peran & Lingkup Analisis |
|---|---|---|
| Frontend (React + Vite) | `src/App.jsx` | Komponen aplikasi, perutean, state manajemen, layout per peran, integrasi AI |
| Frontend | `src/main.jsx` | Entry point React DOM |
| Frontend | `src/styles.css` | Styling, responsivitas, badge AI, layout pure admin/auth |
| Frontend Library | `src/lib/supabase.js` | Inisialisasi klien Supabase |
| Frontend Library | `src/lib/reports.js` | Konstanta kategori, status, dan helper formatting |
| ML Service (FastAPI) | `ml-service/app/main.py` | Entry point FastAPI, CORS, registrasi router |
| ML Service | `ml-service/app/routes/spam.py` | Endpoint `POST /api/ml/detect-spam` |
| ML Service | `ml-service/app/routes/photo.py` | Endpoint `POST /api/ml/analyze-photo` |
| ML Service | `ml-service/app/services/spam_classifier.py` | Logika inferensi MNB TF-IDF teks spam |
| ML Service | `ml-service/app/services/photo_detector.py` | Inferensi YOLOv8n ONNX & pencocokan teks-foto |
| ML Service Models | `ml-service/models/` | Serialisasi model (`.joblib`, `.onnx`) |
| ML Service Training | `ml-service/training/` | Script pelatihan model Naive Bayes |
| Database | `supabase/schema.sql` | Struktur database utama, trigger, fungsi RPC, RLS |
| Database Migrations | `supabase/migrations/` | File migrasi terurut tanggal |

## 2.4 Database & Storage Tracking

Agent mencatat perubahan pada tabel, kolom, fungsi RPC, trigger, indeks, kebijakan RLS, serta Supabase Storage (`report-photos`).

## 2.5 Change Classification

| Category | Description |
|---|---|
| INITIAL DEVELOPMENT | Pembangunan awal sistem |
| ADDED | Penambahan fitur baru |
| MODIFIED | Modifikasi fitur yang sudah ada |
| FIXED | Perbaikan bug atau galat |
| REMOVED | Penghapusan fitur atau kode |
| DATABASE | Perubahan skema atau migrasi SQL |
| SECURITY | Perubahan autentikasi atau RLS |
| UI/UX | Pembaruan antarmuka dan interaksi |
| ML / AI | Pengembangan modul machine learning |
| INTEGRATION | Integrasi antarlayanan (Frontend ↔ Backend/ML) |
| CONFIGURATION | Perubahan environment atau dependensi |
| DOCUMENTATION | Pembaruan dokumentasi teknis |
| REFACTOR | Restrukturisasi kode tanpa mengubah fungsionalitas |
| TESTING | Pengujian unit, integrasi, atau model |

## 2.6 Change Lifecycle

1. `REQUESTED` — Permintaan diterima dari prompt.
2. `ANALYZED` — Prompt telah dianalisis.
3. `PLANNED` — Rencana kerja tersusun.
4. `IMPLEMENTING` — Implementasi sedang berjalan.
5. `IMPLEMENTED` — Implementasi selesai berdasarkan kode aktual.
6. `TESTING` — Pengujian dijalankan.
7. `VERIFIED` — Pengujian berhasil diverifikasi.
8. `RELEASED` — Dirilis / di-push ke branch repository.
9. `BLOCKED` — Pengerjaan terhambat kendala teknis.
10. `CANCELLED` — Permintaan dibatalkan oleh pengguna.

## 2.7 Standard Waktu & Logging

- **Timezone:** Asia/Makassar (WITA).
- **Format:** `YYYY-MM-DD HH:mm:ss WITA` (atau `YYYY-MM-DD` jika jam tidak tersedia).
- **Single Source of Truth Log:** `CHANGELOG.md` menggunakan format entri `CHANGE-YYYYMMDD-NNN`.

---

# 3. SYSTEM REQUIREMENTS SPECIFICATION (LAPORLINTAS)

## 3.1 System Overview & Architecture

LaporLintas adalah sistem pelaporan dugaan pelanggaran lalu lintas berbasis web dengan arsitektur modern:
- **Frontend Client:** React 18 + Vite (SPA) dengan Tailwind-like modular styling di `styles.css`.
- **Backend as a Service:** Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage).
- **Machine Learning Microservice (`ml-service`):**
  - Framework: FastAPI + Uvicorn (Python 3.10+).
  - Algoritma 1: **Multinomial Naive Bayes** + TF-IDF FeatureUnion (deteksi spam teks).
  - Algoritma 2: **YOLOv8n ONNX** Runtime + Pillow (deteksi objek lalu lintas pada foto bukti dan verifikasi silang teks-foto).

```text
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite                      │
│   (Warga: Buat/Edit Laporan | Admin: Pure Dashboard)   │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
   (Auth, CRUD, RLS, Storage)    (Silent ML / Auto-Scan)
                │                        │
                ▼                        ▼
     ┌──────────────────────┐  ┌───────────────────┐
     │  Supabase (Cloud)    │  │ FastAPI ML Engine │
     │  - PostgreSQL 15     │  │ - MNB Spam Text   │
     │  - Row Level Security│  │ - YOLOv8n ONNX    │
     │  - report-photos     │  └───────────────────┘
     └──────────────────────┘
```

## 3.2 User Roles & Access Control

Sistem memiliki 3 tingkat akses:
1. **Publik / Tamu (Belum Login):**
   - Menikmati animasi *Splash Screen* logo LaporLintas saat pertama kali membuka web.
   - Melihat Ringkasan (*blurred guest view*) dengan tombol terarah untuk masuk/daftar.
   - Mengakses panduan pelaporan.
   - Halaman login (`/auth`) dirancang khusus tanpa sidebar (*pure login view*).
2. **Masyarakat (User Terotentikasi):**
   - Mengakses formulir Buat Laporan baru dengan deteksi GPS koordinat dan unggah foto bukti.
   - Memantau status laporan pribadi di menu "Laporan Saya".
   - Mengedit dan mengirim ulang laporan yang berstatus `pending` atau `revision`.
3. **Administrator:**
   - Masuk langsung ke **Pure Admin Dashboard** (sidebar reguler disembunyikan).
   - Melihat metrik statistik laporan dan tabel data lengkap dengan username pelapor.
   - Meninjau hasil analisis AI (Spam teks & Deteksi objek foto bukti beserta skor kecocokan).
   - Mengubah status laporan (`pending`, `reviewing`, `revision`, `rejected`, `forwarded`, `in_progress`, `completed`).
   - Menyimpan keputusan verifikasi admin atas rekomendasi AI.

## 3.3 Functional Requirements (FR)

### FR-1: Autentikasi & Manajemen Akun
- **FR-1.1**: Sistem menyediakan pendaftaran akun masyarakat menggunakan email, password (minimal 8 karakter), dan nama lengkap.
- **FR-1.2**: Sistem menyediakan login akun dan menetapkan role default `user`. Peran `admin` diberikan secara aman melalui database.
- **FR-1.3**: Tampilan halaman login (`/auth`) berupa halaman penuh (*full-width*) tanpa menu sidebar, berfokus murni pada form autentikasi.

### FR-2: Pelaporan Masyarakat (Citizen Flow)
- **FR-2.1**: Warga dapat memilih kategori pelanggaran, mengisi deskripsi kejadian (min. 20 karakter & 3 kata), dan lokasi kejadian (min. 3 karakter).
- **FR-2.2**: Sistem menyediakan tombol GPS untuk mengambil koordinat latitude dan longitude secara otomatis dari perangkat.
- **FR-2.3**: Warga dapat menyertakan foto bukti pendukung (JPG/PNG/WebP, maksimal 5 MB) yang disimpan di bucket `report-photos`.
- **FR-2.4**: Formulir pembuatan laporan dibuat bersih tanpa membebani warga dengan tombol manual AI. Pemindaian AI teks dan foto berjalan secara *silent* di latar belakang.

### FR-3: Riwayat & Perbaikan Laporan
- **FR-3.1**: Warga dapat melihat seluruh riwayat laporan miliknya di halaman `/laporan-saya`.
- **FR-3.2**: Jika laporan memerlukan perbaikan (`revision`) dengan catatan dari admin, warga dapat mengedit kembali detail laporan dan mengirimkannya ulang.
- **FR-3.3**: Saat pengiriman ulang berhasil, status laporan otomatis kembali ke `pending` dan riwayat status tercatat.

### FR-4: Dashboard Administrator (Admin Flow)
- **FR-4.1**: Saat login sebagai admin, sistem langsung mengarahkan ke Dashboard Admin `/admin` tanpa menampilkan menu sampingan warga.
- **FR-4.2**: Tabel admin menampilkan kolom: ID/Tanggal, Pelapor (Username & ID), Kategori, Lokasi, AI Spam, Status, dan Aksi Periksa.
- **FR-4.3**: Admin dapat mencari laporan berdasarkan ID, username pelapor, kategori, atau lokasi, serta memfilter berdasarkan status.

### FR-5: Machine Learning — AI Spam Detection
- **FR-5.1**: Model Machine Learning menggunakan **Multinomial Naive Bayes** (`alpha=0.5`) dengan ekstraksi fitur TF-IDF hibrida (Word n-grams 1-2 + Character n-grams 3-5).
- **FR-5.2**: Model mendeteksi apakah deskripsi laporan berkategori `NORMAL` (relevan lalu lintas) atau `SPAM` (teks acak, promosi, sapaan tanpa konteks).
- **FR-5.3**: Menghasilkan nilai probabilitas kontinu (`normal_probability` dan `spam_probability`).
- **FR-5.4**: Menyediakan endpoint `POST /api/ml/detect-spam` pada layanan FastAPI.
- **FR-5.5**: Deteksi spam berfungsi sebagai alat bantu pendukung (*decision support*), bukan pemutus sepihak (tidak memblokir pengiriman warga dan keputusan akhir ada pada admin).

### FR-6: Machine Learning — AI Photo Traffic & Consistency Detection
- **FR-6.1**: Menggunakan model computer vision **YOLOv8n ONNX** yang dieksekusi secara lokal menggunakan `onnxruntime` tanpa dependensi GPU berat.
- **FR-6.2**: Mendeteksi objek lalu lintas: kendaraan (`car`, `motorcycle`, `bus`, `truck`, `bicycle`, `train`), infrastruktur (`traffic light`, `stop sign`), dan subjek terkait (`person`).
- **FR-6.3**: Mengklasifikasikan relevansi foto: `RELEVAN` jika mengandung objek lalu lintas, atau `TIDAK_RELEVAN` jika tidak ditemukan objek lalu lintas yang sesuai.
- **FR-6.4**: Melakukan *cross-check* konsistensi antara teks laporan dan objek di foto dengan 3 status: `COCOK`, `SEBAGIAN_COCOK`, `TIDAK_COCOK`.
- **FR-6.5**: Menyediakan endpoint `POST /api/ml/analyze-photo` yang memvalidasi header biner gambar aktual via Pillow.

### FR-7: Moderasi & Verifikasi Keputusan
- **FR-7.1**: Dashboard admin menampilkan panel moderasi AI ganda: Analisis Teks (Spam) dan Analisis Foto Bukti (YOLOv8n).
- **FR-7.2**: Admin dapat mencatat verifikasi moderasi (`verified_normal`, `verified_spam`, `dismissed`) secara independen dari status proses laporan.
- **FR-7.3**: Perubahan status laporan oleh admin (`reviewing`, `forwarded`, `revision`, `rejected`, dll.) wajib menyertakan catatan jika berstatus penolakan atau revisi.

## 3.4 Non-Functional Requirements (NFR)

### NFR-1: Performa & Kecepatan Inferensi
- Inferensi teks Multinomial Naive Bayes harus selesai dalam waktu < 50 ms.
- Inferensi foto YOLOv8n ONNX pada CPU standar harus selesai dalam waktu < 400 ms.
- Frontend bundling Vite berukuran ringkas dengan waktu build produksi < 3 detik.

### NFR-2: Keamanan Data & Kebijakan RLS
- Tabel database dilindungi PostgreSQL Row Level Security (RLS).
- Warga hanya dapat membaca dan memperbarui laporannya sendiri (`user_id = auth.uid()`).
- Hanya pengguna dengan peran `admin` pada tabel `profiles` yang dapat membaca semua laporan dan mengeksekusi RPC status admin.
- Kredensial sensitif (`service_role`, kunci privat) tidak boleh diekspos ke frontend.

### NFR-3: Ketersediaan & Graceful Fallback
- Jika layanan microservice FastAPI (`http://localhost:8000`) sedang offline, frontend pelaporan tetap dapat mengirimkan dan menyimpan laporan secara normal tanpa memunculkan galat yang menghalangi pengguna.
- Jika skema kolom AI baru belum dimigrasi di remote Supabase, fungsi penyimpanan fallback tetap menjaga data esensial laporan tersimpan.

### NFR-4: Usability & Responsivitas
- Antarmuka responsif di semua ukuran layar (desktop, tablet, dan smartphone).
- Indikator visual jelas menggunakan palet warna semantik: hijau (normal/cocok/selesai), merah (spam/tidak cocok/ditolak), oranye (menunggu/peringatan), dan biru (primer).

## 3.5 Data & Database Requirements

### Tabel Utama:
1. **`public.profiles`**: Menyimpan identitas pengguna (`id`, `full_name`, `role`, `updated_at`).
2. **`public.reports`**: Menyimpan data laporan:
   - Data inti: `id`, `user_id`, `category`, `description`, `location`, `latitude`, `longitude`, `incident_time`, `photo_path`, `status`, `admin_note`, `reviewed_by`, `reviewed_at`.
   - Data AI Spam: `spam_prediction`, `spam_probability`, `normal_probability`, `spam_model_version`, `spam_checked_at`, `admin_spam_verification`.
   - Data AI Foto: `photo_ai_prediction`, `photo_ai_confidence`, `photo_ai_objects`, `photo_ai_summary`, `photo_ai_checked_at`.
3. **`public.report_status_history`**: Mencatat audit trail perubahan status laporan (`report_id`, `changed_by`, `old_status`, `new_status`, `note`, `changed_at`).

### Supabase Storage:
- Bucket: `report-photos` (Private bucket dengan Signed URL untuk keamanan akses foto bukti).

## 3.6 Machine Learning Service Specification (ml-service)

### Dependensi Python (`ml-service/requirements.txt`):
- `fastapi>=0.115.0`
- `uvicorn>=0.32.0`
- `scikit-learn>=1.5.0`
- `pandas>=2.2.0`
- `joblib>=1.4.0`
- `matplotlib>=3.9.0`
- `pydantic>=2.9.0`
- `python-multipart>=0.0.12`
- `onnxruntime>=1.19.0`
- `pillow>=10.0.0`

### Ringkasan Endpoint API:
1. `GET /health` — Memeriksa status kesehatan layanan ML, ketersediaan model MNB, dan model YOLOv8n.
2. `POST /api/ml/detect-spam` — Menganalisis teks laporan dan mengembalikan probabilitas normal vs spam.
3. `POST /api/ml/analyze-photo` — Menerima multipart file foto dan teks opsional, mendeteksi objek kendaraan/marka/rambu lalu lintas, dan mengukur konsistensi teks-foto.

---

# 4. FINAL AUDIT & COMPLIANCE

Dokumen SRS ini telah diperbarui secara menyeluruh dan mencerminkan status sistem aktual pada **branch `main` per 24 November 2026**, mencakup:
- Seluruh perbaikan bug alur sistem (17 November 2026).
- Desain *Pure Admin Dashboard* dan *Pure Auth Page* tanpa sidebar.
- Fitur *Splash Screen* dan *Blurred Guest View*.
- Fitur *AI Spam Detection* berbasis Multinomial Naive Bayes.
- Fitur *AI Photo Traffic Detection & Consistency Check* berbasis YOLOv8n ONNX.
