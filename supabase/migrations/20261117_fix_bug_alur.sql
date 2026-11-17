-- ============================================================
-- LAPORLINTAS - Migrasi perbaikan bug (2026-11-17)
-- Jalankan sekali di Supabase SQL Editor pada database live.
-- Aman dijalankan ulang (idempotent).
--
-- Memperbaiki:
--  1. Kolom "Pelapor" di Dashboard Admin selalu "Pengguna"
--     -> admin belum diizinkan membaca profiles milik user lain.
--  2. Validasi laporan di database belum aktif
--     -> lokasi 1 huruf, deskripsi < 20 karakter, waktu kejadian
--        di masa depan masih bisa tersimpan.
--
-- Catatan: constraint dibuat NOT VALID agar data lama yang
-- terlanjur tidak valid (mis. lokasi "a") tidak menggagalkan
-- migrasi. Aturan tetap berlaku untuk setiap INSERT/UPDATE baru.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Fungsi is_admin() (sama dengan schema.sql)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ------------------------------------------------------------
-- 2. Policy profiles: user membaca profil sendiri,
--    admin membaca semua profil (untuk kolom Pelapor).
-- ------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin"
    ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())
    OR public.is_admin()
);

GRANT SELECT ON public.profiles TO authenticated;


-- ------------------------------------------------------------
-- 3. Validasi panjang lokasi & deskripsi
-- ------------------------------------------------------------

ALTER TABLE public.reports
    DROP CONSTRAINT IF EXISTS reports_location_length;

ALTER TABLE public.reports
    ADD CONSTRAINT reports_location_length
    CHECK (char_length(btrim(location)) BETWEEN 3 AND 300) NOT VALID;

ALTER TABLE public.reports
    DROP CONSTRAINT IF EXISTS reports_description_length;

ALTER TABLE public.reports
    ADD CONSTRAINT reports_description_length
    CHECK (char_length(btrim(description)) BETWEEN 20 AND 3000) NOT VALID;


-- ------------------------------------------------------------
-- 4. Waktu kejadian tidak boleh di masa depan
--    (toleransi 5 menit untuk selisih jam perangkat)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reports_validate_incident_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.incident_time IS NOT NULL
       AND NEW.incident_time > NOW() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'Waktu kejadian tidak boleh di masa depan.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_validate_incident_time ON public.reports;

CREATE TRIGGER reports_validate_incident_time
BEFORE INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.reports_validate_incident_time();
