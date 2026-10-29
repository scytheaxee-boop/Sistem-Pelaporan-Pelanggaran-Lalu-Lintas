Kelompok :
Kandou, Jarrel
Robot, Ryveline 
Moningka, Pierfrenciano
Rau, Jayden
Loing, Christian

Problem :
Masyarakat Tidak Taat Aturan Lalu Lintas:
Bagaimana cara meningkatkan kesadaran dan kepatuhan masyarakat terhadap aturan lalu lintas untuk mengurangi risiko kecelakaan dan pelanggaran di jalan raya?# LaporLintas — Sistem Pelaporan Dugaan Pelanggaran Lalu Lintas

Aplikasi React + Vite + Supabase berbahasa Indonesia dengan area masyarakat dan dashboard admin.

## Fitur

- Daftar akun dan login email/password via Supabase Auth.
- Profil pengguna dengan role `user` atau `admin`.
- Form laporan: kategori, deskripsi, alamat, koordinat GPS/manual, waktu kejadian, foto opsional.
- Upload foto JPG/PNG/WebP maksimal 5 MB ke private Supabase Storage.
- Daftar laporan pribadi dan detail/status/catatan admin.
- Dashboard admin dengan filter, pencarian, pemeriksaan foto, catatan verifikasi, dan pembaruan status.
- Riwayat perubahan status yang tercatat di database.
- Row Level Security (RLS) untuk memisahkan akses masyarakat dan admin.
- Fungsi database untuk memastikan hanya admin yang dapat mengubah status.
- Desain responsif desktop dan mobile.

## Prasyarat

- Node.js 20+ disarankan.
- Akun/proyek Supabase.

## Menjalankan aplikasi

1. Ekstrak ZIP ini, buka folder proyek di terminal.
2. Jalankan `npm install`.
3. Di Supabase Dashboard, buka **SQL Editor**, lalu jalankan seluruh isi `supabase/schema.sql`.
4. Buka **Project Settings → API** (atau Data API/Connect sesuai tampilan dashboard). Salin Project URL dan anon/publishable key.
5. Salin `.env.example` menjadi `.env`, lalu isi:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
   ```

6. Di Supabase Authentication, atur URL konfigurasi untuk pengembangan:
   - Site URL: `http://localhost:5173`
   - Redirect URL: `http://localhost:5173/**`
   - Untuk demo yang lebih mudah, nonaktifkan email confirmation sementara di lingkungan pengembangan saja. Untuk produksi, sebaiknya aktifkan.
7. Jalankan:

   ```bash
   npm run dev
   ```

8. Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Membuat admin pertama

1. Daftar akun biasa dari halaman aplikasi dan selesaikan konfirmasi email jika aktif.
2. Di Supabase Dashboard → Authentication → Users, salin UUID akun tersebut.
3. Jalankan query berikut di SQL Editor dengan UUID asli:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'AUTH_USER_UUID_HERE';

   or

   
INSERT INTO public.profiles (id, full_name, role)
SELECT
    id,
    COALESCE(
        NULLIF(raw_user_meta_data ->> 'full_name', ''),
        'Administrator'
    ),
    'admin'
FROM auth.users
WHERE LOWER(email) = LOWER('EMAIL_KAMU@example.com')
ON CONFLICT (id)
DO UPDATE SET role = 'admin';

or


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

role check 

SELECT
    u.email,
    p.full_name,
    p.role
FROM auth.users AS u
JOIN public.profiles AS p ON p.id = u.id
WHERE LOWER(u.email) = LOWER('EMAIL_KAMU@example.com');
   ```

4. Keluar lalu masuk kembali. Menu Dashboard Admin akan muncul.

Jangan pernah membuat role admin berdasarkan input form atau metadata pengguna. Jangan menaruh `service_role` key di `.env` frontend.

## Status laporan

- `pending`: Menunggu verifikasi
- `reviewing`: Sedang diverifikasi
- `revision`: Perlu perbaikan (catatan wajib)
- `rejected`: Ditolak (catatan wajib)
- `forwarded`: Diteruskan
- `in_progress`: Dalam tindak lanjut
- `completed`: Selesai

## Catatan keamanan dan batasan

- RLS membatasi pembacaan laporan ke pemilik laporan dan admin.
- Foto disimpan di bucket private; aplikasi membuat signed URL singkat saat perlu menampilkan foto.
- Browser GPS memerlukan izin pengguna dan umumnya HTTPS (localhost juga didukung).
- Laporan adalah informasi awal untuk pemeriksaan, bukan bukti otomatis atau penetapan resmi pelanggaran.
- Ini adalah starter project yang siap dikonfigurasi dan dijalankan secara lokal; belum di-deploy dan belum terhubung ke proyek Supabase Anda.
- Sebelum produksi, tinjau aturan penyimpanan, retensi data, moderasi, perlindungan data pribadi, logging, rate limiting, kebijakan email, serta prosedur operasional pihak yang berwenang.
