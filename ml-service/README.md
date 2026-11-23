# AI Spam Detection Service — LaporLintas
Layanan deteksi spam berbasis Machine Learning (**Multinomial Naive Bayes**) untuk sistem pelaporan dugaan pelanggaran lalu lintas **LaporLintas**.

---

## 1. Ikhtisar & Arsitektur

Fitur **AI Spam Detection** dirancang sebagai alat bantu moderasi cerdas yang mengevaluasi teks deskripsi laporan pengguna sebelum dan selama peninjauan oleh administrator.

Model mengklasifikasikan deskripsi ke dalam dua kategori:
- **`NORMAL`**: Laporan yang relevan dengan pelanggaran, kecelakaan, marka jalan, atau situasi lalu lintas.
- **`SPAM`**: Konten tidak relevan, teks acak/keyboard mash (contoh: *asdfghjkl*), promosi barang/jasa, sapaan/obrolan santai, atau ujaran yang tidak berhubungan dengan pelaporan lalu lintas.

### Prinsip Moderasi:
- **Non-blocking pada Pengguna**: Jika terindikasi spam, sistem menampilkan indikator peringatan dan saran perbaikan teks yang informatif, namun pengguna tetap dapat mengirimkan laporan.
- **Dukungan Keputusan Administrator**: Hasil inferensi AI (prediksi, probabilitas normal & spam, waktu pengecekan) ditampilkan di Dashboard Admin. Keputusan akhir tetap berada di tangan petugas admin (*human-in-the-loop*).
- **Graceful Fallback**: Apabila layanan ML belum aktif atau database belum dimigrasikan, formulir pelaporan tetap beroperasi normal tanpa mengganggu pengguna.

---

## 2. Struktur Direktori

```text
ml-service/
├── app/
│   ├── main.py                  # Entry point FastAPI, CORS, health check
│   ├── routes/
│   │   ├── __init__.py
│   │   └── spam.py              # Endpoint POST /api/ml/detect-spam
│   └── services/
│       ├── __init__.py
│       └── spam_classifier.py   # Service inferensi, validasi teks, kalkulasi probabilitas
├── datasets/
│   ├── generate_dataset.py      # Generator dataset sintetis dwibahasa & variatif
│   └── traffic_spam_dataset.csv # Dataset 720 baris (360 NORMAL, 360 SPAM)
├── evaluation/
│   ├── confusion_matrix.png     # Visualisasi heatmap confusion matrix
│   ├── evaluate_model.py        # Script pengujian model dengan skenario unseen data
│   └── metrics.json             # Catatan metrik evaluasi model format JSON
├── models/
│   └── spam_detection_model.joblib # Model pipeline terlatih (FeatureUnion + MNB)
├── training/
│   └── train_spam_model.py      # Script training, stratified split, evaluasi & serialisasi
├── requirements.txt             # Dependensi Python
└── README.md                    # Dokumentasi lengkap ML service
```

---

## 3. Dataset & Pernyataan Data Sintetis

- **File Dataset**: `ml-service/datasets/traffic_spam_dataset.csv`
- **Total Data**: 720 sampel (360 kelas `normal`, 360 kelas `spam`).
- **Penanda Sintetis**: Kolom `is_synthetic = True` pada seluruh baris.
- **Bahasa**: Bahasa Indonesia sehari-hari, variasi panjang kalimat, slang/typo, dan singkatan.
- **Variasi Kategori Normal**:
  - Pelanggaran lampu merah / APILL
  - Melawan arus / one-way
  - Parkir liar di trotoar / bahu jalan
  - Penggunaan ponsel saat berkendara
  - Tidak mengenakan helm / sabuk pengaman
  - Balap liar & knalpot bising
  - Truk ODOL & muatan melebihi batas
  - Putar balik di marka garis utuh
- **Variasi Kategori Spam**:
  - Teks acak / keyboard mash / gibberish (*"asdfghjkl"*, *"qwertyuiop 12345"*)
  - Iklan / promosi komersial (*"Promo sepatu diskon 70%"*, *"Jual pulsa murah"*, pinjol, slot)
  - Sapaan / basa-basi tanpa konteks (*"Selamat pagi semuanya"*, *"Halo tes satu dua tiga"*)
  - Konten tidak relevan (resep masakan, curhat, lirik lagu, teks berita umum)

> **Catatan Akademik & Batasan Model:**
> Dataset yang digunakan pada tahap ini adalah **dataset sintetis berlabel** yang dirancang sebagai prototipe akademik untuk mengevaluasi efektivitas Multinomial Naive Bayes pada kasus pelaporan lalu lintas Indonesia. Dataset ini **bukan** berasal dari database laporan masyarakat sungguhan. Model dapat terus ditingkatkan (*retraining*) seiring bertambahnya data laporan riil yang telah diverifikasi oleh administrator.

---

## 4. Pelatihan Model (Training Pipeline)

Model menggunakan **Scikit-learn Pipeline** dengan arsitektur ekstraksi fitur hibrida:
1. **Pembersihan Teks (`clean_text`)**: Lowercase, normalisasi whitespace, stripping spasi berlebih.
2. **Feature Extraction (`FeatureUnion`)**:
   - **Word TF-IDF Vectorizer**: n-gram range `(1, 2)`, `sublinear_tf=True`, `min_df=2`, `max_features=4000`.
   - **Character n-gram TF-IDF Vectorizer (`char_wb`)**: n-gram range `(3, 5)`, `sublinear_tf=True`, `min_df=2`, `max_features=6000`.
   *(Kombinasi char n-grams memastikan deteksi teks acak/keyboard mash seperti "asdfghjkl" bekerja dengan akurasi 100% tanpa salah kaprah terhadap kata serapan).*
3. **Klasifikasi**: `MultinomialNB(alpha=0.5)`.
4. **Data Split**: 80% data latih (576 data), 20% data uji (144 data), menggunakan `stratify=y` dan `random_state=42`.

### Menjalankan Training Ulang:
```bash
cd ml-service
python3 training/train_spam_model.py
```

Output training akan secara otomatis memperbarui:
- Model: `ml-service/models/spam_detection_model.joblib`
- Metrik: `ml-service/evaluation/metrics.json`
- Visualisasi: `ml-service/evaluation/confusion_matrix.png`

---

## 5. Hasil Evaluasi Aktual

Berdasarkan pengujian pada 20% data uji terpisah (144 data):

| Metrik | Nilai Aktual |
|---|---|
| **Akurasi Keseluruhan** | **99.31%** (143/144) |
| **Macro Precision** | **99.32%** |
| **Macro Recall** | **99.31%** |
| **Macro F1-Score** | **99.31%** |

### Evaluasi per Kelas:
| Kelas | Precision | Recall | F1-Score | Dukungan (Support) |
|---|---|---|---|---|
| **NORMAL** | 0.9863 (98.6%) | 1.0000 (100.0%) | 0.9931 | 72 |
| **SPAM** | 1.0000 (100.0%) | 0.9861 (98.6%) | 0.9930 | 72 |

### Confusion Matrix:
- **True Normal (TN)**: 72
- **False Positive (FP - Normal salah dikira Spam)**: **0 (NOL)**
- **False Negative (FN - Spam lolos sebagai Normal)**: 1
- **True Spam (TP)**: 71

> **Penting Mengenai False Positive:**
> Model menghasilkan **0 False Positives**, yang berarti tidak ada satupun laporan warga yang sah dan relevan yang salah diklasifikasikan sebagai spam.

---

## 6. Menjalankan Layanan FastAPI

### Persyaratan:
- Python 3.10+
- Paket terpasang sesuai `requirements.txt`:
```bash
cd ml-service
pip install -r requirements.txt
```

### Menjalankan Server:
```bash
# Opsi 1: Menjalankan via script Python
python3 app/main.py

# Opsi 2: Menjalankan via Uvicorn CLI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Layanan akan aktif di: `http://localhost:8000`
- Dokumentasi interaktif Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## 7. Spesifikasi API

### Endpoint: Deteksi Spam
- **URL**: `/api/ml/detect-spam`
- **Metode**: `POST`
- **Headers**: `Content-Type: application/json`

#### Request Body:
```json
{
  "description": "Pengendara motor menerobos lampu merah di persimpangan Jalan Sudirman"
}
```

#### Response (Normal):
```json
{
  "prediction": "NORMAL",
  "spam_probability": 0.0163,
  "normal_probability": 0.9837,
  "is_spam": false,
  "recommendation": "Deskripsi terindikasi relevan dengan konteks pelaporan lalu lintas.",
  "model_version": "1.0.0",
  "confidence": 0.9837
}
```

#### Response (Spam):
```json
{
  "prediction": "SPAM",
  "spam_probability": 0.9412,
  "normal_probability": 0.0588,
  "is_spam": true,
  "recommendation": "Deskripsi terindikasi tidak relevan atau berisi konten spam. Disarankan memperbaiki deskripsi sebelum mengirim.",
  "model_version": "1.0.0",
  "confidence": 0.9412
}
```

#### Validasi & Error Handling:
- **Teks Kosong**: Mengembalikan HTTP 422 dengan pesan bahwa deskripsi tidak boleh kosong.
- **Teks Terlalu Pendek**: Mengembalikan HTTP 422 jika kurang dari 5 karakter.
- **Fallback**: Jika terjadi kesalahan internal, pesan error ditangani dengan format JSON yang informatif.

---

## 8. Panduan Pengujian Model Mandiri

Jalankan script evaluasi berikut untuk menguji model dengan 14 sampel deskripsi baru (*unseen data*) yang mencakup bahasa sehari-hari, singkatan, teks acak, iklan pulsa, dan kalimat ambigu:

```bash
cd ml-service
python3 evaluation/evaluate_model.py
```

Skor pengujian mandiri: **14/14 (100% Benar)**.

---

## 9. Integrasi Frontend & Database

1. **Konfigurasi Lingkungan (`.env`)**:
   ```ini
   VITE_ML_API_URL=http://localhost:8000
   ```
2. **Komponen Frontend**:
   - `AISpamChecker`: Komponen UI interaktif pada formulir `CreateReportPage` dan modal `EditReportModal` dengan tombol "Periksa dengan AI" dan indikator status probabilitas.
   - `AdminPage`: Menampilkan kolom *AI Spam* pada tabel utama, panel moderasi deteksi AI di modal peninjauan, tombol "Periksa Ulang dengan AI", dan opsi verifikasi keputusan admin (`verified_normal`, `verified_spam`, `dismissed`).
3. **Database Supabase**:
   - Migrasi SQL: `supabase/migrations/20261123_ai_spam_detection.sql`
   - Kolom yang ditambahkan: `spam_prediction`, `spam_probability`, `normal_probability`, `spam_model_version`, `spam_checked_at`, `admin_spam_verification`.
   - Kebijakan RLS: `reports_admin_update_spam` memungkinkan admin memperbarui status moderasi tanpa mengganggu hak akses pelapor.
