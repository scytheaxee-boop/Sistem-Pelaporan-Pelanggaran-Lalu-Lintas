-- ============================================================
-- LAPORLINTAS - Migrasi AI Photo Traffic Detection (YOLOv8n ONNX)
-- Tanggal: 24 November 2026
-- ============================================================
-- Menambahkan kolom hasil analisis objek & relevansi foto bukti
-- pada tabel reports. Terpisah dari status verifikasi resmi.
-- ============================================================

ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS photo_ai_prediction TEXT
        CHECK (photo_ai_prediction IS NULL OR photo_ai_prediction IN ('RELEVAN', 'TIDAK_RELEVAN')),
    ADD COLUMN IF NOT EXISTS photo_ai_confidence DOUBLE PRECISION
        CHECK (photo_ai_confidence IS NULL OR (photo_ai_confidence >= 0.0 AND photo_ai_confidence <= 1.0)),
    ADD COLUMN IF NOT EXISTS photo_ai_objects JSONB,
    ADD COLUMN IF NOT EXISTS photo_ai_summary TEXT,
    ADD COLUMN IF NOT EXISTS photo_ai_checked_at TIMESTAMPTZ;

-- Perbarui izin UPDATE kolom untuk user (resubmit) dan admin (simpan hasil scan AI)
GRANT UPDATE (
    category, description, location, latitude, longitude,
    incident_time, photo_path, status, updated_at,
    spam_prediction, spam_probability, normal_probability,
    spam_model_version, spam_checked_at, admin_spam_verification,
    photo_ai_prediction, photo_ai_confidence, photo_ai_objects,
    photo_ai_summary, photo_ai_checked_at
) ON public.reports TO authenticated;
