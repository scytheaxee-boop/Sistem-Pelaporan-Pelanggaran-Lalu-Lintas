# LaporLintas — Sistem Pelaporan Dugaan Pelanggaran Lalu Lintas

LaporLintas adalah aplikasi berbasis **React, Vite, dan Supabase** yang menyediakan layanan pelaporan dugaan pelanggaran lalu lintas. Aplikasi ini memiliki dua area utama, yaitu area masyarakat untuk membuat dan memantau laporan serta dashboard admin untuk memverifikasi dan memperbarui status laporan.

## 1. Fitur Utama

- **Autentikasi pengguna:** pendaftaran dan login menggunakan email dan password melalui Supabase Auth.
- **Manajemen profil:** setiap pengguna memiliki profil dengan role `user` atau `admin`.
- **Formulir laporan:** mencakup kategori, deskripsi, alamat kejadian, koordinat GPS atau input manual, waktu kejadian, dan foto opsional.
- **Upload foto:** mendukung format JPG, PNG, dan WebP dengan ukuran maksimal 5 MB ke Supabase Storage privat.
- **Riwayat laporan pribadi:** pengguna dapat melihat daftar laporan, detail laporan, status, dan catatan admin.
- **Dashboard admin:** menyediakan fitur pencarian, filter laporan, pemeriksaan foto, pencatatan hasil verifikasi, dan pembaruan status.
- **Riwayat perubahan status:** perubahan status laporan dicatat di database.
- **Keamanan database:** menggunakan Row Level Security (RLS) untuk membatasi akses berdasarkan kepemilikan laporan dan role pengguna.
- **Validasi admin:** fungsi database memastikan hanya pengguna dengan role `admin` yang dapat mengubah status laporan.
- **Desain responsif:** antarmuka mendukung desktop dan perangkat mobile.

## 2. Prasyarat

Pastikan perangkat dan akun berikut tersedia:

- Node.js versi 20 atau lebih baru (disarankan).
- npm.
- Akun dan proyek Supabase.
- Editor kode seperti Visual Studio Code.

## 3. Cara Menjalankan Aplikasi

### Langkah 1 — Ekstrak proyek

Ekstrak file ZIP proyek LaporLintas, kemudian buka folder proyek menggunakan terminal atau Visual Studio Code.

### Langkah 2 — Instal dependensi

Jalankan perintah berikut di terminal pada direktori proyek:

```bash
npm install
```

### Langkah 3 — Konfigurasi database Supabase

1. Buka Supabase Dashboard.
2. Pilih proyek yang digunakan.
3. Buka **SQL Editor**.
4. Jalankan seluruh isi file `supabase/schema.sql`.

Pastikan seluruh perintah SQL berhasil dijalankan sebelum melanjutkan.

### Langkah 4 — Ambil kredensial Supabase

Buka pengaturan proyek Supabase, lalu cari bagian **API** atau **Data API / Connect**, sesuai tampilan dashboard.

Salin:
- Project URL.
- Anon key atau publishable key.

Jangan gunakan `service_role` key di aplikasi frontend.

### Langkah 5 — Konfigurasi environment

Salin file `.env.example` menjadi `.env`, kemudian isi dengan kredensial proyek Supabase:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Ganti nilai contoh dengan nilai asli dari proyek Supabase milikmu.

### Langkah 6 — Konfigurasi autentikasi

Di Supabase Dashboard, buka pengaturan **Authentication → URL Configuration**.

Untuk pengembangan lokal, atur:

- **Site URL:** `http://localhost:5173`
- **Redirect URL:** `http://localhost:5173/**`

Untuk mempermudah pengujian lokal, konfirmasi email dapat dinonaktifkan sementara jika diperlukan. Untuk aplikasi produksi, sebaiknya aktifkan kembali konfirmasi email dan konfigurasi autentikasi yang sesuai.

### Langkah 7 — Jalankan aplikasi

Jalankan perintah berikut:

```bash
npm run dev
```

Buka alamat lokal yang ditampilkan oleh Vite, biasanya:

`http://localhost:5173`

## 4. Membuat Akun Administrator Pertama

Administrator dibuat dengan mengubah role akun yang sudah terdaftar. Jangan memberikan role admin berdasarkan input formulir pendaftaran atau metadata yang dapat diubah oleh pengguna.

### Langkah 1 — Daftarkan akun

Buka aplikasi LaporLintas dan daftar menggunakan email serta password. Selesaikan konfirmasi email apabila fitur tersebut diaktifkan.

### Langkah 2 — Salin UUID akun

1. Buka Supabase Dashboard.
2. Pilih **Authentication → Users**.
3. Cari akun yang ingin dijadikan administrator.
4. Salin UUID atau User ID akun tersebut.

### Langkah 3 — Ubah role menjadi admin

Buka **SQL Editor → New query**, kemudian jalankan SQL berikut setelah mengganti UUID contoh dengan UUID akun yang benar.

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
WHERE id = 'UUID_AKUN_KAMU'::UUID
ON CONFLICT (id)
DO UPDATE SET role = 'admin';
```

Query ini membuat profil jika belum ada atau memperbarui role jika profil sudah tersedia.

### Langkah 4 — Verifikasi role

Jalankan query berikut dengan UUID akun yang sama:

```sql
SELECT
    u.id,
    u.email,
    p.full_name,
    p.role
FROM auth.users AS u
JOIN public.profiles AS p
    ON p.id = u.id
WHERE u.id = 'UUID_AKUN_KAMU'::UUID;
```

Pastikan hasilnya menunjukkan:

```text
role = admin
```

### Langkah 5 — Login kembali

Keluar dari aplikasi, kemudian login kembali menggunakan akun administrator. Setelah role berhasil diperbarui, dashboard admin seharusnya dapat diakses.

**Catatan:** untuk akun baru, sistem pembuatan profil otomatis harus tetap memberikan role `user`. Jangan menjalankan query perubahan role untuk akun biasa.

## 5. Status Laporan

LaporLintas menggunakan kode status berikut di database:

| Kode status | Keterangan |
|---|---|
| `pending` | Menunggu verifikasi |
| `reviewing` | Sedang diverifikasi |
| `revision` | Perlu perbaikan |
| `rejected` | Ditolak |
| `forwarded` | Diteruskan |
| `in_progress` | Dalam tindak lanjut |
| `completed` | Selesai |

Status `revision` dan `rejected` sebaiknya disertai catatan admin agar pengguna mengetahui alasan atau perbaikan yang diperlukan.

## 6. Catatan Keamanan dan Batasan

- **Row Level Security (RLS):** membatasi akses data laporan berdasarkan pemilik laporan dan hak akses administrator.
- **Penyimpanan foto:** foto disimpan dalam bucket privat. Aplikasi menggunakan signed URL dengan masa berlaku terbatas saat foto perlu ditampilkan.
- **Akses GPS:** browser memerlukan izin pengguna untuk memperoleh lokasi. Fitur ini umumnya memerlukan HTTPS, tetapi juga dapat digunakan pada `localhost`.
- **Validitas laporan:** laporan merupakan informasi awal untuk pemeriksaan dan bukan bukti otomatis atau penetapan resmi suatu pelanggaran lalu lintas.
- **Status proyek:** proyek ini merupakan starter project yang perlu dikonfigurasi dan dijalankan secara lokal. Proyek belum di-deploy dan belum terhubung ke proyek Supabase milik pengguna.
- **Persiapan produksi:** sebelum dirilis, tinjau kebijakan penyimpanan dan retensi data, moderasi laporan, perlindungan data pribadi, logging, rate limiting, kebijakan email, serta prosedur operasional pihak yang berwenang.

## 7. Ringkasan Alur Sistem

1. Masyarakat mendaftar atau login.
2. Masyarakat mengisi formulir laporan dugaan pelanggaran lalu lintas.
3. Sistem memvalidasi kelengkapan laporan dan menyimpan data.
4. Laporan masuk ke dashboard admin untuk diverifikasi.
5. Admin memeriksa informasi dan foto pendukung.
6. Admin menentukan hasil verifikasi dan memperbarui status.
7. Laporan yang diterima dapat diteruskan untuk tindak lanjut.
8. Masyarakat memantau status dan catatan laporan melalui aplikasi.

LaporLintas bertujuan membantu proses pelaporan dan pemantauan dugaan pelanggaran lalu lintas secara terstruktur. Penentuan pelanggaran dan tindakan resmi tetap menjadi kewenangan pihak yang berwenang.
