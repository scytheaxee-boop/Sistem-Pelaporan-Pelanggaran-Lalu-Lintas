# Workflow Sistem LaporLintas

## Sistem Pelaporan Dugaan Pelanggaran Lalu Lintas & Moderasi Berbasis AI

**Stack:**
- **Frontend:** React 18 + Vite, React Router v6, Lucide Icons, Vanilla CSS modular.
- **Backend & Database:** Supabase Auth, PostgreSQL 15+, Supabase Storage (Private Bucket), Row Level Security (RLS).
- **Machine Learning Service (`ml-service`):** Python 3.10+, FastAPI, Uvicorn, Scikit-learn (Multinomial Naive Bayes + TF-IDF), YOLOv8n ONNX Runtime, Pillow.
- **Peran Pengguna:** Tamu / Publik (`guest`), Masyarakat Terdaftar (`user`), dan Administrator (`admin`).

---

## 1. Tujuan dan Prinsip Sistem

LaporLintas memungkinkan masyarakat menyampaikan informasi dugaan pelanggaran atau kondisi lalu lintas secara terstruktur dan bertanggung jawab. Sistem dilengkapi modul kecerdasan buatan (*Machine Learning*) sebagai alat bantu moderasi awal untuk menyaring teks spam dan memverifikasi keabsahan foto bukti sebelum ditindaklanjuti secara resmi oleh administrator.

**Prinsip Utama:**
1. **Laporan Masyarakat Bukan Penetapan Hukum Otomatis:** Setiap laporan adalah bahan informasi awal. Keputusan resmi tetap berada pada kewenangan instansi berwenang.
2. **AI sebagai Pendukung Keputusan (*Decision Support System*):** Hasil deteksi spam teks dan deteksi objek foto digunakan sebagai rekomendasi bagi admin, bukan pemutus sepihak (*human-in-the-loop*).
3. **Penyaringan Senyap (*Silent Processing*):** Warga tidak dibebani pengujian teknis AI saat membuat laporan. Proses inferensi AI berjalan di latar belakang secara otomatis.
4. **Toleran Gangguan (*Graceful Degradation*):** Jika layanan ML offline, proses bisnis utama pelaporan warga tetap berjalan normal.

---

## 2. Arsitektur Komprehensif Sistem

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Pengguna (Browser)                              │
│   - Tamu: Splash Screen Animasi & Blurred Landing Page                 │
│   - Halaman Login / Registrasi: Pure Auth Page (Tanpa Sidebar)         │
│   - Warga: Buat Laporan, Riwayat Laporan, Edit & Kirim Ulang           │
│   - Admin: Pure Admin Dashboard (Navigasi Khusus & Tanpa Sidebar)      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
    [Supabase Auth, CRUD, Storage]          [Silent AI Auto-Scan]
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        Supabase Cloud Backend        │  │   FastAPI ML Microservice    │
│  - Supabase Auth (JWT & Roles)       │  │   (Port 8000)                │
│  - PostgreSQL 15 (RLS Enforced)      │  │  - POST /api/ml/detect-spam  │
│    * profiles                        │  │    (Multinomial Naive Bayes) │
│    * reports                         │  │  - POST /api/ml/analyze-photo│
│    * report_status_history           │  │    (YOLOv8n ONNX + Pillow)   │
│  - Supabase Storage (Private Bucket) │  │  - GET /health               │
│    * report-photos (Signed URLs)     │  └──────────────────────────────┘
└──────────────────────────────────────┘
```

---

## 3. Fase 1 — Akses Pengguna & Tampilan Bersih

### 3.1 Tamu (Belum Login)
1. Pengguna membuka alamat situs LaporLintas.
2. Menampilkan **Splash Screen Animasi** logo LaporLintas selama 2 detik (dapat dilewati dengan klik).
3. Halaman Ringkasan menampilkan tampilan terkunci (*blurred guest view*) yang memfokuskan pengguna untuk masuk atau mendaftar terlebih dahulu.

### 3.2 Halaman Autentikasi (`/auth`)
1. Ditampilkan dalam tata letak penuh (*pure auth page*) tanpa bilah menu samping (sidebar).
2. Header menampilkan branding `LaporLintas / Autentikasi`.
3. Mendukung beralih cepat antara form *Masuk* dan *Daftar Akun*.
4. Setelah login berhasil:
   - Jika role pengguna adalah `admin` ➔ Langsung diarahkan ke `/admin`.
   - Jika role pengguna adalah `user` ➔ Diarahkan ke Beranda Ringkasan `/`.

---

## 4. Fase 2 — Alur Pelaporan Warga (Citizen Flow)

### 4.1 Pembuatan Laporan Baru (`/buat-laporan`)
1. Warga mengisi form: kategori pelanggaran, deskripsi kejadian (min. 20 karakter & 3 kata), lokasi kejadian (min. 3 karakter).
2. Warga dapat menekan tombol **Gunakan GPS** untuk mengisi koordinat lintang (*latitude*) dan bujur (*longitude*) secara akurat.
3. Warga dapat mengunggah 1 foto kejadian (opsional, maks. 5 MB, format JPG/PNG/WebP).
4. Warga menekan tombol **Kirim Laporan**.

### 4.2 Pemindaian AI Otomatis di Latar Belakang (*Silent Auto-Scan*)
1. Saat tombol kirim ditekan, frontend secara paralel melakukan dua pemindaian AI ke FastAPI (jika aktif):
   - **Analisis Teks Spam:** Mengirimkan deskripsi ke `POST /api/ml/detect-spam`.
   - **Analisis Objek Foto:** Mengirimkan berkas gambar ke `POST /api/ml/analyze-photo`.
2. Hasil prediksi (`NORMAL`/`SPAM` beserta probabilitas) dan hasil deteksi foto (`RELEVAN`/`TIDAK_RELEVAN`, ringkasan objek, kecocokan) disematkan ke dalam payload laporan.
3. Jika service ML tidak aktif / offline, proses tetap dilanjutkan tanpa menampilkan galat yang membingungkan warga (*graceful fallback*).
4. Laporan disimpan ke tabel `reports` dengan status awal `pending`.
5. Berkas foto diunggah ke private bucket `report-photos`.

---

## 5. Fase 3 — Pemantauan, Edit & Kirim Ulang oleh Warga

### 5.1 Riwayat Laporan Saya (`/laporan-saya`)
1. Warga dapat melihat daftar seluruh laporan yang pernah dikirimkan beserta status terkininya.
2. Filter status: Semua, Menunggu, Dalam Pemeriksaan, Perlu Perbaikan, Ditolak, Diteruskan, Selesai.
3. Klik pada item laporan membuka modal rincian laporan (kategori, lokasi, koordinat peta OSM, foto bukti ber-signed URL, serta catatan admin).

### 5.2 Edit & Kirim Ulang Laporan (`EditReportModal`)
1. Jika laporan berstatus `pending` atau `revision` (misal admin meminta kelengkapan patokan jalan):
   - Tombol **Edit & Kirim Ulang** akan aktif.
2. Warga dapat memperbaiki deskripsi, lokasi, titik GPS, mengganti foto, atau menghapus foto lama.
3. Saat dikirim ulang:
   - Sistem menjalankan pemindaian AI teks/foto otomatis kembali.
   - Menggunakan RPC `user_resubmit_report` atau fallback direct update.
   - Status laporan otomatis kembali ke `pending` dan catatan revisi diperbarui.

---

## 6. Fase 4 — Alur Dashboard Administrator (Admin Moderation Flow)

### 6.1 Tampilan Pure Admin Dashboard (`/admin`)
1. Sidebar standar warga dihilangkan sepenuhnya, hanya menampilkan antarmuka kerja admin.
2. Statistik ringkasan data: Total Laporan, Menunggu Verifikasi, Sedang Diverifikasi, Diteruskan / Tindak Lanjut.
3. Tabel Manajemen Laporan:
   - Kolom: ID / Tanggal, **Pelapor (Nama Lengkap & ID Akun)**, Kategori, Lokasi, **AI Spam**, Status, dan Tombol Periksa.
   - Pencarian cerdas berdasarkan ID, nama pelapor, kategori, atau lokasi.
   - Kolom *AI Spam* menampilkan badge `Normal (98%)` atau `SPAM (95%)`.
   - Kolom *AI Foto* (pada modal) menampilkan objek yang terdeteksi (`car`, `motorcycle`, dll.) dan status kecocokan teks-foto (`COCOK`, `TIDAK_COCOK`).

### 6.2 Pemeriksaan & Moderasi Keputusan Admin
1. Admin mengklik tombol **Periksa** pada baris laporan.
2. **Panel Moderasi AI Spam Detection (Multinomial Naive Bayes):**
   - Menampilkan hasil prediksi, probabilitas normal, probabilitas spam, waktu periksa, dan tombol pindai ulang AI.
   - Jika laporan belum memiliki hasil AI, sistem langsung memindai otomatis saat modal dibuka.
   - Admin dapat mencatat verifikasi spam: `Belum diverifikasi`, `Terverifikasi: Normal`, `Terverifikasi: Spam`, atau `Abaikan`.
3. **Panel Moderasi AI Foto Bukti & Konsistensi Teks (YOLOv8n ONNX):**
   - Menampilkan status relevansi foto (`RELEVAN` vs `TIDAK_RELEVAN`).
   - Menampilkan daftar objek kendaraan/rambu/marka yang terdeteksi beserta tingkat keyakinan (*confidence*).
   - Menampilkan status kecocokan teks deskripsi dengan foto (`COCOK`, `SEBAGIAN_COCOK`, `TIDAK_COCOK`).
4. **Penetapan Keputusan / Status Resmi:**
   - Admin memilih status baru (`pending`, `reviewing`, `revision`, `rejected`, `forwarded`, `in_progress`, `completed`).
   - Jika memilih status `revision` atau `rejected`, input **Catatan Verifikasi** wajib diisi untuk memberikan alasan transparan kepada pelapor.
5. Perubahan disimpan secara aman melalui RPC `admin_update_report_status` dan dicatat ke `report_status_history`.

---

## 7. Fase 5 — Arsitektur & Operasional Machine Learning Service (`ml-service`)

### 7.1 Spesifikasi Model & Pipeline
1. **Model Deteksi Teks Spam:**
   - Algoritma: **Multinomial Naive Bayes** (`alpha=0.5`).
   - Ekstraksi Fitur: `FeatureUnion` menggabungkan Word TF-IDF `(1, 2)` dan Character n-grams `char_wb` `(3, 5)` untuk menangani variasi bahasa gaul dan teks acak (*asdfghjkl*).
   - Evaluasi: Akurasi 99.31%, Macro F1 99.31%, **0 False Positives** (tidak ada laporan sah yang salah diklasifikasikan sebagai spam).
2. **Model Deteksi Foto Bukti:**
   - Algoritma: **YOLOv8n ONNX** (eksekusi ringan via `onnxruntime` CPU).
   - Objek Target Lalu Lintas: `car`, `motorcycle`, `bus`, `truck`, `bicycle`, `train`, `traffic light`, `stop sign`, `person`.
   - Pencocokan Silang: Membandingkan kata kunci kategori & deskripsi laporan terhadap objek visual yang terdeteksi.

### 7.2 Menjalankan Layanan ML Lokal
```bash
# Masuk ke folder microservice
cd ml-service

# Install dependensi (cukup sekali)
python3 -m pip install -r requirements.txt

# Jalankan server FastAPI
python3 app/main.py
# atau
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Layanan aktif di `http://localhost:8000` dengan Swagger UI interaktif di `/docs`.

---

## 8. Diagram Alur Proses Lengkap (End-to-End)

```text
Masyarakat / Warga                          FastAPI (AI Engine)           Admin LaporLintas
       |                                             |                            |
       |--- 1. Buka web (Splash Screen)              |                            |
       |--- 2. Login / Register (Pure Auth View)     |                            |
       |--- 3. Isi form laporan + GPS + Foto         |                            |
       |                                             |                            |
       |--- 4. Tekan "Kirim Laporan" --------------->|                            |
       |                               [Auto-Scan Spam MNB]                       |
       |                               [Auto-Scan Objek YOLOv8]                   |
       |<-- 5. Laporan tersimpan ke DB & Storage <---|                            |
       |                                                                          |
       |                                                            6. Buka /admin (Pure Dashboard)
       |                                                                          |
       |                                                            7. Tabel tampilkan Pelapor,
       |                                                               Status AI Spam & Foto
       |                                                                          |
       |                                                            8. Klik "Periksa Laporan"
       |                                                               - Review detail laporan
       |                                                               - Review panel AI Spam
       |                                                               - Review panel AI Foto
       |                                                               - Verifikasi & catatan
       |                                                                          |
       |<-- 9. Status diperbarui (misal: 'revision' butuh info) <-----------------|
       |                                                                          |
       |--- 10. Edit & Kirim Ulang (Laporan Saya) ------------------------------->|
       |                                                                 (Masuk antrean pending)
```

---

## 9. Matriks Tahapan dan Output Sistem

| Tahapan | Aktor Utama | Proses / Teknologi | Output Sistem |
|---|---|---|---|
| **Akses Publik** | Tamu | React Splash Screen & Guest Overlay | Pengenalan branding dan pengalihan ke autentikasi |
| **Autentikasi** | Warga / Admin | Supabase Auth, Pure Auth Page | Token JWT sesi dan penetapan antarmuka peran |
| **Pelaporan** | Warga | Form React, Geolocation API, Supabase Storage | Data laporan tervalidasi dan berkas foto privat |
| **AI Text Analysis** | Background ML | FastAPI, Multinomial Naive Bayes, TF-IDF | Nilai probabilitas normal vs spam |
| **AI Photo Analysis**| Background ML | FastAPI, YOLOv8n ONNX Runtime, Pillow | Label objek lalu lintas dan skor konsistensi |
| **Penyimpanan Data** | Supabase DB | PostgreSQL, RLS Policies, Graceful Fallback | Record laporan aman dengan metadata AI lengkap |
| **Audit Admin** | Administrator | Pure Admin Dashboard, Status Action Modal | Keputusan status resmi & verifikasi moderasi AI |
| **Perbaikan Laporan**| Warga | EditReportModal, RPC `user_resubmit_report` | Pengiriman ulang data perbaikan ke antrean admin |

---

## 10. Kesimpulan

Workflow LaporLintas mengintegrasikan seluruh perjalanan pelaporan lalu lintas mulai dari pengalaman pengguna publik yang ramah, kemudahan pengiriman laporan berbasis GPS dan foto, keandalan moderasi cerdas menggunakan **Multinomial Naive Bayes** dan **YOLOv8n**, hingga panel kerja eksklusif administrator untuk menetapkan keputusan yang akuntabel dan transparan.
memberikan role admin secara otomatis. Role admin harus ditetapkan
melalui jalur tepercaya, bukan dengan mengubah nilai di browser.

**Output:** pengguna terautentikasi dengan identitas dan peran yang
sesuai.

## 5. Fase 3 --- Profil dan otorisasi

1.  Aplikasi mengambil ID pengguna dari sesi Auth.
2.  Profil yang terkait dengan identitas tersebut dimuat.
3.  UI memilih fitur sesuai role.
4.  Saat laporan dibuat, pemilik (`user_id`) harus berasal dari sesi
    pengguna, bukan dari nilai yang bebas dipercayai dari formulir.
5.  Database memeriksa RLS pada setiap operasi baca/tulis.
6.  Masyarakat hanya dapat membaca laporan miliknya dan tidak dapat
    mengubah status atau catatan admin.
7.  Admin yang sah dapat mengakses laporan sesuai kebijakan admin.
8.  Operasi sensitif harus divalidasi di database, bukan hanya dengan
    menyembunyikan tombol pada frontend.

**Prinsip:** hak akses minimum, pemisahan peran, dan pemeriksaan
otorisasi di sisi server/database.

## 6. Fase 4 --- Pengisian formulir laporan

### Data laporan

-   Kategori dugaan pelanggaran/kondisi.
-   Deskripsi kejadian.
-   Alamat atau lokasi.
-   Koordinat GPS atau koordinat manual jika tersedia.
-   Waktu kejadian.
-   Foto opsional.
-   ID pemilik dari sesi terautentikasi.
-   Status awal yang ditentukan sistem.

### Alur

1.  Pengguna membuka menu buat laporan.
2.  Memilih kategori dan mengisi deskripsi.
3.  Mengisi alamat atau lokasi kejadian.
4.  Mengizinkan lokasi GPS jika ingin menggunakannya, atau mengisi
    lokasi manual bila tersedia.
5.  Mengisi waktu kejadian.
6.  Memilih foto jika ingin melampirkannya.
7.  Frontend memvalidasi input.
8.  Aplikasi menampilkan ringkasan agar pengguna memeriksa data sebelum
    dikirim.

### Validasi yang disarankan

-   Kategori harus berasal dari daftar yang diizinkan.
-   Deskripsi wajib dan cukup jelas.
-   Latitude berada pada rentang `-90` sampai `90`; longitude `-180`
    sampai `180`.
-   Waktu harus valid.
-   Foto dibatasi ke JPG/JPEG, PNG, atau WebP dengan ukuran maksimal 5
    MB sesuai rancangan.
-   Nama file dan path penyimpanan tidak boleh dipercaya sebagai kontrol
    keamanan.
-   Jangan meminta data pribadi yang tidak relevan.

Validasi frontend membantu pengalaman pengguna, tetapi validasi
otoritatif dan constraint juga harus diterapkan pada database/backend.

## 7. Fase 5 --- Upload foto

1.  Jika foto dipilih, periksa tipe dan ukurannya.
2.  Buat path unik untuk file.
3.  Unggah file ke bucket privat Supabase Storage.
4.  Kebijakan Storage memeriksa siapa yang boleh mengunggah, membaca,
    atau menghapus objek.
5.  Setelah berhasil, simpan path/metadata foto pada laporan.
6.  Jika gagal, tampilkan pesan dan izinkan mencoba lagi atau
    melanjutkan tanpa foto jika memang opsional.
7.  Jika upload berhasil tetapi penyimpanan laporan gagal, tangani file
    yatim secara aman.

**Kontrol keamanan:** bucket foto bersifat privat; gunakan signed URL
berumur pendek untuk tampilan yang berhak; atur kebijakan
`storage.objects` secara terpisah karena RLS tabel tidak otomatis
melindungi objek Storage. Foto tetap merupakan materi pendukung yang
perlu ditinjau.

## 8. Fase 6 --- Penyimpanan laporan

1.  Frontend mengirim data yang sudah divalidasi.
2.  Database memeriksa sesi, RLS, tipe data, dan constraint.
3.  `user_id` diikat pada pengguna yang terautentikasi.
4.  Record dibuat di tabel laporan, misalnya `reports`.
5.  Status awal ditetapkan oleh sistem, misalnya `menunggu_verifikasi`,
    sesuai daftar status yang benar-benar digunakan.
6.  Jika tabel riwayat digunakan, catat status awal melalui mekanisme
    konsisten.
7.  Database mengembalikan hasil.
8.  UI menampilkan konfirmasi dan membuka detail/daftar laporan.
9.  Jika gagal, tampilkan pesan yang aman dan pertahankan input pengguna
    bila memungkinkan.

Pastikan foreign key, tipe koordinat, kolom wajib, dan nilai status
sesuai skema aktual. Untuk operasi yang melibatkan beberapa tabel,
gunakan transaksi atau fungsi database bila perlu agar tidak terjadi
data setengah tersimpan.

## 9. Fase 7 --- Daftar dan detail laporan masyarakat

1.  Pengguna membuka menu "Laporan Saya".
2.  Aplikasi meminta laporan yang terkait dengan identitasnya.
3.  RLS memastikan hanya data yang diizinkan yang dikembalikan.
4.  Daftar menampilkan kategori, tanggal, lokasi ringkas, dan status.
5.  Pengguna memilih laporan untuk melihat detail.
6.  Detail menampilkan deskripsi, waktu, lokasi, foto yang berhak
    diakses, status terkini, serta catatan yang memang ditujukan kepada
    pelapor.
7.  Jika tersedia, kronologi perubahan status ditampilkan.

Contoh status yang bisa disesuaikan dengan skema: -
`menunggu_verifikasi`: laporan menunggu pemeriksaan. -
`sedang_ditinjau`: admin sedang meninjau. - `terverifikasi`: informasi
memenuhi kriteria verifikasi internal sistem. - `ditolak`: laporan tidak
dapat diterima berdasarkan hasil pemeriksaan. - `selesai`: proses dalam
sistem selesai sesuai definisi operasional.

Status `terverifikasi` tidak berarti laporan otomatis menjadi bukti
pelanggaran resmi atau berarti tindakan hukum telah dilakukan. Jelaskan
definisi status kepada pengguna.

## 10. Fase 8 --- Dashboard admin dan peninjauan

### Akses dashboard

1.  Admin login.
2.  Aplikasi memuat profil dan role.
3.  Jika role admin valid, dashboard ditampilkan.
4.  Jika bukan admin, akses ditolak atau pengguna diarahkan ke area
    masyarakat.
5.  Database tetap memeriksa izin pada setiap operasi sensitif.

### Fitur dashboard yang direncanakan

-   Ringkasan jumlah laporan menurut status.
-   Daftar laporan masuk.
-   Pencarian dan filter berdasarkan status, kategori, atau tanggal.
-   Detail laporan.
-   Pratinjau foto dengan izin yang sesuai.
-   Formulir catatan verifikasi.
-   Perubahan status.
-   Riwayat status.

### Proses review

1.  Admin memilih laporan.
2.  Sistem menampilkan kategori, deskripsi, waktu, lokasi, dan foto bila
    ada.
3.  Admin menilai kelengkapan, konsistensi, relevansi, dan kemungkinan
    duplikasi.
4.  Admin menulis catatan secara objektif.
5.  Admin memilih status baru yang diizinkan.
6.  UI meminta konfirmasi bila perubahan berdampak penting.
7.  Aplikasi memanggil fungsi database khusus admin.
8.  Fungsi memvalidasi role, ID laporan, status, dan aturan transisi.
9.  Jika valid, status, catatan, dan riwayat disimpan secara konsisten.
10. Jika gagal, status lama tetap berlaku dan UI menampilkan pesan
    kegagalan.

Admin sebaiknya membedakan fakta yang terlihat dari dugaan, mencatat
alasan perubahan/penolakan, dan tidak menyatakan bahwa aplikasi memiliki
kewenangan penegakan hukum bila kewenangan tersebut tidak diberikan.

## 11. Fase 9 --- Perubahan status dan audit

1.  Admin membuka detail laporan.
2.  Memilih status baru dari pilihan yang valid.
3.  Mengisi catatan jika diwajibkan.
4.  Frontend memanggil fungsi database yang sesuai, misalnya
    `admin_update_report_status(p_admin_note, p_report_id, p_status)`
    jika signature tersebut memang terpasang.
5.  Fungsi memverifikasi identitas dan role admin.
6.  Fungsi memeriksa laporan, nilai status, dan transisi yang diizinkan.
7.  Fungsi menyimpan status baru, catatan, ID admin, dan waktu
    perubahan.
8.  Riwayat menyimpan status lama dan baru jika kolom tersebut tersedia.
9.  Perubahan laporan dan riwayat idealnya dilakukan dalam satu
    transaksi.
10. UI menampilkan sukses hanya setelah server mengonfirmasi.
11. Pelapor dapat melihat status terkini sesuai kebijakan akses.

Data riwayat yang disarankan: ID laporan, status lama, status baru,
catatan, ID admin, dan timestamp. Riwayat tidak boleh dapat diubah
masyarakat. Atur retensi dan akses audit sesuai kebijakan privasi.

## 12. Fase 10 --- Error handling dan pemulihan

  -----------------------------------------------------------------------
  Kondisi                             Respons yang diharapkan
  ----------------------------------- -----------------------------------
  Login gagal                         Tampilkan pesan kredensial tidak
                                      valid/pemulihan akun

  Profil tidak ditemukan              Jalankan penanganan profil; jangan
                                      memberi role admin

  Upload gagal                        Beri pilihan mencoba lagi atau
                                      tanpa foto jika opsional

  Laporan gagal disimpan              Beri pesan dan pertahankan input
                                      jika memungkinkan

  Akses ditolak                       Jelaskan bahwa pengguna tidak
                                      memiliki izin

  Perubahan status gagal              Jangan tampilkan status baru
                                      sebagai berhasil

  Koneksi terputus                    Beri pesan dan opsi mencoba kembali

  Data tidak ditemukan                Jangan membocorkan keberadaan data
                                      milik orang lain
  -----------------------------------------------------------------------

Jangan tampilkan stack trace, token, key, query sensitif, atau detail
internal database ke pengguna. Hindari log kata sandi, token, dan
informasi pribadi. Upaya ulang tidak boleh membuat laporan duplikat
tanpa sengaja.

## 13. Fase 11 --- Keamanan dan privasi

-   Gunakan sesi Auth yang valid untuk operasi terproteksi.
-   Aktifkan dan uji RLS untuk tabel profil, laporan, dan riwayat.
-   Cegah pengguna mengubah role sendiri.
-   Batasi perubahan status pada fungsi database yang memverifikasi
    admin.
-   Atur kebijakan Storage terpisah untuk foto privat.
-   Validasi input di frontend dan database.
-   Jangan commit `.env` atau secret.
-   Terapkan prinsip least privilege.
-   Kumpulkan data seperlunya, jelaskan tujuan penggunaan, dan tetapkan
    retensi.
-   Audit tindakan admin tanpa mengumpulkan data yang tidak diperlukan.

### Pemeriksaan keamanan sebelum rilis

1.  Uji akun masyarakat dan admin yang berbeda.
2.  Pastikan pengguna A tidak dapat membaca laporan pengguna B.
3.  Pastikan masyarakat tidak dapat mengubah status atau role.
4.  Pastikan pemanggilan fungsi admin oleh pengguna biasa ditolak.
5.  Pastikan foto tidak dapat dibaca tanpa izin.
6.  Uji status yang tidak valid dan sesi yang tidak valid.
7.  Periksa repository serta log dari kemungkinan secret.

## 14. Fase 12 --- Pengujian sistem

### Uji fungsional

-   Pendaftaran, login, logout, dan pemulihan sesi.
-   Pemuatan profil dan pemilihan halaman sesuai role.
-   Validasi formulir laporan.
-   Lokasi GPS dan lokasi manual.
-   Upload file valid, file terlalu besar, dan format yang tidak
    didukung.
-   Simpan laporan, daftar, detail, dan status.
-   Peninjauan admin, catatan, perubahan status, dan riwayat.
-   Penanganan error jaringan/backend.

### Uji otorisasi

-   Pengguna A tidak dapat membaca laporan pengguna B.
-   Pengguna biasa tidak dapat mengubah status atau role.
-   Permintaan tanpa sesi ditolak.
-   Fungsi database menolak status yang tidak dikenal.
-   Foto tidak dapat diakses oleh pihak yang tidak berhak.

### Uji integritas dan antarmuka

-   Setiap laporan memiliki pemilik valid.
-   Status awal dan riwayat konsisten.
-   Tidak ada data setengah tersimpan setelah kegagalan.
-   Koordinat dan waktu tervalidasi.
-   Tampilan responsif pada desktop dan seluler.
-   Loading state, konfirmasi, dan pesan error mudah dipahami.

**Kriteria minimal:** alur utama berhasil; tidak ada akses silang tidak
sah; operasi admin terlindungi; status dan riwayat konsisten; error
aman; secret tidak masuk repository. Catat temuan, perbaiki, lalu
lakukan pengujian ulang.

## 15. Fase 13 --- Build, deployment, dan pemeliharaan

### Build

1.  Periksa dependensi dan konfigurasi.
2.  Jalankan skrip build yang tersedia, misalnya `npm run build` bila
    didefinisikan.
3.  Perbaiki error build.
4.  Uji hasil build sebelum rilis.

### Deployment

1.  Pilih hosting yang mendukung aplikasi Vite.
2.  Hubungkan repository GitHub atau deploy hasil build.
3.  Atur build command dan output directory sesuai project.
4.  Atur environment variables di hosting.
5.  Atur URL redirect/callback Supabase Auth untuk domain produksi.
6.  Pastikan RLS, Storage, fungsi database, HTTPS, dan domain
    dikonfigurasi.
7.  Uji login, laporan, foto, dashboard admin, dan perubahan status di
    lingkungan rilis.
8.  Siapkan backup dan prosedur rollback.

Jangan menjalankan perubahan skema yang berpotensi merusak database
produksi tanpa peninjauan dan backup.

### Pemeliharaan

-   Perbarui dependensi dengan pemeriksaan kompatibilitas.
-   Pantau error dan kapasitas Storage.
-   Backup data sesuai kebijakan.
-   Tinjau akses saat fitur baru ditambahkan.
-   Dokumentasikan perubahan skema dan fungsi.
-   Uji ulang alur kritis setelah perubahan.

## 16. Diagram workflow end-to-end

``` text
MULAI
  |
  v
Buka aplikasi
  |
  v
Daftar / Login (Supabase Auth)
  |
  v
Muat profil dan periksa role
  |
  +-----------------------------+
  |                             |
  v                             v
Role user                    Role admin
  |                             |
  v                             v
Isi formulir laporan         Buka dashboard
  |                             |
  v                             v
Validasi kategori,           Cari/filter laporan
deskripsi, lokasi, waktu          |
dan foto (opsional)               v
  |                           Buka detail
  v                              |
Upload foto jika ada              v
  |                           Periksa informasi
  v                           dan foto
Simpan laporan                    |
  |                              v
  v                           Tulis catatan
Tetapkan status awal              |
  |                              v
  v                           Pilih status baru
Lihat laporan sendiri             |
  |                              v
  |                           Fungsi database
  |                           memvalidasi admin
  |                              |
  |                              v
  |                           Simpan status dan
  |                           riwayat perubahan
  |                              |
  +---------------+--------------+
                  |
                  v
        Status terbaru tersedia
        sesuai hak akses masing-masing
                  |
                  v
                SELESAI
```

## 17. Ringkasan tahap dan output

  -------------------------------------------------------------------------
  Tahap             Aktor utama         Proses/data       Output
  ----------------- ------------------- ----------------- -----------------
  Persiapan         Pengembang          Konfigurasi       Aplikasi siap
                                        frontend dan      dijalankan
                                        Supabase          

  Autentikasi       Masyarakat/admin    Pendaftaran dan   Sesi valid
                                        login             

  Profil/akses      Aplikasi/database   Baca profil dan   Fitur sesuai
                                        role              peran

  Pengisian         Masyarakat          Kategori,         Data laporan
                                        deskripsi,        tervalidasi
                                        lokasi, waktu     

  Upload foto       Aplikasi/Storage    Simpan foto       Path foto
                                        privat            

  Penyimpanan       Database            Insert laporan    Record laporan
                                        dan status awal   

  Pemantauan        Masyarakat          Baca laporan      Detail dan status
                                        sendiri           

  Peninjauan        Admin               Evaluasi          Catatan
                                        informasi         verifikasi

  Perubahan status  Admin/fungsi        Validasi dan      Status baru
                    database            update            

  Audit             Database            Simpan riwayat    Perubahan dapat
                                                          ditelusuri

  Pengujian/rilis   Pengembang          Uji, build,       Aplikasi siap
                                        deploy            digunakan

  Pemeliharaan      Pengembang/admin    Monitoring,       Sistem tetap
                    sistem              backup, perbaikan terjaga
  -------------------------------------------------------------------------

## 18. Hal yang harus diverifikasi pada implementasi aktual

Sebelum dokumen ini dianggap sebagai dokumentasi final, pastikan: 1.
Nama tabel dan kolom aktual (`profiles`, `reports`,
`report_status_history` atau nama lain). 2. Daftar status dan aturan
transisi yang benar-benar digunakan. 3. Trigger pembuatan profil telah
aktif jika diperlukan. 4. Fungsi perubahan status admin telah dibuat,
signature-nya sesuai, dan pemeriksaan role-nya benar. 5. Bucket foto
tersedia, privat, dan memiliki kebijakan Storage yang tepat. 6. RLS
aktif dan diuji untuk semua tabel terkait. 7. Halaman masyarakat dan
dashboard admin menerapkan akses sesuai peran. 8. Pengujian dan
deployment benar-benar telah dilakukan.

## 19. Kesimpulan

Workflow LaporLintas mengatur proses dari autentikasi, pengiriman
laporan, penyimpanan data dan foto, pemantauan oleh pelapor, peninjauan
admin, perubahan status, pencatatan riwayat, pengujian, hingga
pemeliharaan. Keandalan sistem bergantung pada frontend dan terutama
pada integritas database, RLS, keamanan Storage, validasi fungsi admin,
dan pengujian akses.

Laporan tetap merupakan informasi yang harus ditinjau; laporan tidak
otomatis menjadi bukti pelanggaran resmi.
