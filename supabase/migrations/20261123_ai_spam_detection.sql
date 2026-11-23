-- ============================================================
-- LAPORLINTAS - Migrasi AI Spam Detection
-- Tanggal: 23 November 2026
-- ============================================================
-- Menambahkan kolom moderasi AI Spam Detection pada tabel reports
-- Hasil prediksi disimpan terpisah dari status laporan utama.
-- ============================================================

ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS spam_prediction TEXT CHECK (spam_prediction IS NULL OR spam_prediction IN ('NORMAL', 'SPAM')),
    ADD COLUMN IF NOT EXISTS spam_probability DOUBLE PRECISION CHECK (spam_probability IS NULL OR (spam_probability >= 0.0 AND spam_probability <= 1.0)),
    ADD COLUMN IF NOT EXISTS normal_probability DOUBLE PRECISION CHECK (normal_probability IS NULL OR (normal_probability >= 0.0 AND normal_probability <= 1.0)),
    ADD COLUMN IF NOT EXISTS spam_model_version TEXT DEFAULT '1.0.0',
    ADD COLUMN IF NOT EXISTS spam_checked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_spam_verification TEXT CHECK (admin_spam_verification IS NULL OR admin_spam_verification IN ('verified_normal', 'verified_spam', 'dismissed'));

-- Perbarui izin UPDATE kolom
GRANT UPDATE (
    category, description, location, latitude, longitude,
    incident_time, photo_path, status, updated_at,
    spam_prediction, spam_probability, normal_probability,
    spam_model_version, spam_checked_at, admin_spam_verification
) ON public.reports TO authenticated;

-- Kebijakan RLS agar Admin dapat memperbarui verifikasi spam pada laporan
DROP POLICY IF EXISTS "reports_admin_update_spam" ON public.reports;
CREATE POLICY "reports_admin_update_spam"
ON public.reports
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

