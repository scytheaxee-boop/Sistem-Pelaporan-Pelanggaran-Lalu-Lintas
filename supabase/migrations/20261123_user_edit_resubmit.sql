-- ============================================================
-- LAPORLINTAS - Migrasi Fitur Edit & Kirim Ulang Laporan
-- Tanggal: 23 November 2026
-- ============================================================
-- Memungkinkan pelapor untuk mengedit kembali laporan berstatus
-- 'pending' atau 'revision' (perlu perbaikan) dan mengirim ulang.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Berikan hak UPDATE pada kolom laporan untuk user login
-- ------------------------------------------------------------
GRANT UPDATE (category, description, location, latitude, longitude, incident_time, photo_path, status, updated_at)
    ON public.reports
    TO authenticated;

-- ------------------------------------------------------------
-- 2. Kebijakan RLS agar user hanya bisa update laporannya sendiri
--    yang berstatus 'pending' atau 'revision' menjadi 'pending'
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "reports_update_own" ON public.reports;

CREATE POLICY "reports_update_own"
ON public.reports
FOR UPDATE
TO authenticated
USING (
    user_id = (SELECT auth.uid())
    AND status IN ('pending', 'revision')
)
WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
);

-- ------------------------------------------------------------
-- 3. Fungsi RPC aman untuk edit & kirim ulang laporan
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_resubmit_report(
    p_report_id UUID,
    p_category TEXT,
    p_description TEXT,
    p_location TEXT,
    p_latitude DOUBLE PRECISION DEFAULT NULL,
    p_longitude DOUBLE PRECISION DEFAULT NULL,
    p_incident_time TIMESTAMPTZ DEFAULT NULL,
    p_photo_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_current_status TEXT;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: pengguna belum login.';
    END IF;

    SELECT status, user_id
    INTO v_current_status, v_user_id
    FROM public.reports
    WHERE id = p_report_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Laporan tidak ditemukan.';
    END IF;

    IF v_user_id != (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Akses ditolak: Anda bukan pemilik laporan ini.';
    END IF;

    IF v_current_status NOT IN ('pending', 'revision') THEN
        RAISE EXCEPTION 'Hanya laporan berstatus menunggu verifikasi atau perlu perbaikan yang dapat diedit dan dikirim ulang.';
    END IF;

    -- Validasi input
    IF p_location IS NULL OR char_length(btrim(p_location)) < 3 THEN
        RAISE EXCEPTION 'Lokasi kejadian minimal 3 karakter.';
    END IF;

    IF p_description IS NULL OR char_length(btrim(p_description)) < 20 THEN
        RAISE EXCEPTION 'Deskripsi minimal 20 karakter.';
    END IF;

    UPDATE public.reports
    SET category = p_category,
        description = btrim(p_description),
        location = btrim(p_location),
        latitude = p_latitude,
        longitude = p_longitude,
        incident_time = p_incident_time,
        photo_path = COALESCE(p_photo_path, photo_path),
        status = 'pending',
        updated_at = NOW()
    WHERE id = p_report_id;

    -- Catat riwayat status
    INSERT INTO public.report_status_history (report_id, changed_by, old_status, new_status, note)
    VALUES (p_report_id, (SELECT auth.uid()), v_current_status, 'pending', 'Laporan diperbarui dan dikirim ulang oleh pelapor.');

    RETURN jsonb_build_object('success', true, 'id', p_report_id);
END;
$$;

REVOKE ALL ON FUNCTION public.user_resubmit_report(UUID, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_resubmit_report(UUID, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ, TEXT) TO authenticated;
