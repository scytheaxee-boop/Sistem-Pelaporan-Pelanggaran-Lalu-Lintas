# Workflow Sistem LaporLintas

## Sistem Pelaporan Dugaan Pelanggaran Lalu Lintas

**Stack:** React + Vite, Supabase Auth, PostgreSQL, Supabase Storage,
Row Level Security (RLS).\
**Peran:** masyarakat (`user`) dan admin (`admin`).

## 1. Tujuan dan prinsip

LaporLintas memungkinkan masyarakat mengirimkan laporan tentang kondisi
atau dugaan pelanggaran lalu lintas. Laporan disimpan secara terstruktur
agar dapat diperiksa admin, diberi catatan verifikasi, dan dipantau oleh
pelapor.

**Penting:** laporan masyarakat adalah informasi awal yang harus
ditinjau. Laporan tidak otomatis menjadi bukti pelanggaran resmi dan
tidak otomatis menetapkan seseorang bersalah. Keputusan lanjutan
mengikuti kewenangan dan prosedur pihak berwenang.

## 2. Arsitektur sistem

``` text
Masyarakat / Admin
        |
        v
Browser: React + Vite
  - Formulir dan validasi
  - Daftar/detail laporan
  - Dashboard admin
        |
        v
Supabase Client
        |
        +--> Supabase Auth (akun dan sesi)
        +--> PostgreSQL (profiles, reports, riwayat status)
        +--> Storage (foto privat)
        +--> RLS dan fungsi database (kontrol akses)
```

-   **React + Vite:** antarmuka, navigasi, validasi awal, dan feedback
    pengguna.
-   **Supabase Auth:** pendaftaran, login, dan pengelolaan sesi.
-   **PostgreSQL:** profil, laporan, catatan, dan riwayat.
-   **Supabase Storage:** menyimpan foto laporan.
-   **RLS:** membatasi baris data yang dapat diakses.
-   **Fungsi database admin:** jalur terkendali untuk perubahan status,
    misalnya `admin_update_report_status`, jika fungsi tersebut telah
    dibuat dan dikonfigurasi.

Nama tabel, kolom, bucket, status, dan fungsi harus dicocokkan dengan
skema Supabase yang benar-benar aktif. Dokumen ini menjelaskan workflow
rancangan, bukan bukti bahwa seluruh konfigurasi produksi telah diuji.

## 3. Fase 1 --- Persiapan dan konfigurasi

1.  Pasang Node.js dan dependensi project.
2.  Jalankan aplikasi melalui skrip yang tersedia di `package.json`,
    misalnya `npm run dev`.
3.  Siapkan variabel lingkungan untuk koneksi Supabase.
4.  Inisialisasi Supabase client pada frontend.
5.  Siapkan tabel, relasi, fungsi database, RLS, bucket Storage, dan
    kebijakan Storage.
6.  Jalankan aplikasi dan periksa bahwa halaman serta koneksi backend
    berfungsi.

**Output:** aplikasi dapat berjalan dan layanan Supabase siap digunakan.

**Keamanan:** `.env` harus tetap diabaikan oleh Git. `node_modules/` dan
`dist/` juga tidak perlu masuk repository. Nilai `VITE_*` terekspos ke
browser; hanya URL project dan publishable/anon key yang memang aman
untuk publik yang boleh digunakan di frontend. Jangan pernah menaruh
`service_role` key, password database, atau secret privat pada
frontend/repository.

## 4. Fase 2 --- Pendaftaran dan autentikasi

### Pendaftaran

1.  Pengguna membuka halaman daftar.
2.  Pengguna memasukkan email dan kata sandi.
3.  Frontend memeriksa kolom wajib dan format dasar.
4.  Supabase Auth membuat akun.
5.  Jika verifikasi email diaktifkan, pengguna mengikuti proses
    verifikasi.
6.  Profil pengguna dibuat atau disinkronkan ke `profiles` melalui
    mekanisme yang dikonfigurasi.
7.  Aplikasi menampilkan hasil pendaftaran.

### Login

1.  Pengguna memasukkan kredensial.
2.  Frontend mengirim permintaan ke Supabase Auth.
3.  Jika valid, Supabase mengembalikan sesi.
4.  Aplikasi memuat profil terkait.
5.  UI ditentukan berdasarkan role: `user` ke area masyarakat dan
    `admin` ke dashboard admin.
6.  Jika login gagal, tampilkan pesan yang aman dan mudah dipahami.

Jika profil atau role belum tersedia, tangani secara eksplisit. Jangan
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
