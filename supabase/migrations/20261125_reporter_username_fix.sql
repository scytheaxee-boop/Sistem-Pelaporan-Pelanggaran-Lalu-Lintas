-- ============================================================
-- LAPORLINTAS - Migrasi Nama/Username Pelapor untuk Admin Dashboard (2026-11-25)
-- Jalankan di Supabase SQL Editor pada database live.
-- Aman dijalankan berulang kali (idempotent).
--
-- Memperbaiki:
--  1. Kolom "Pelapor (Username)" di Dashboard Admin menampilkan "Pengguna"
--     karena RLS profiles memblokir admin atau fungsi is_admin() belum terpasang.
--  2. Menyediakan fungsi SECURITY DEFINER public.is_admin().
--  3. Menyediakan RPC public.get_admin_reporters() untuk admin mengambil nama/username.
--  4. Menambahkan kolom reporter_name di public.reports sebagai cache langsung nama pelapor.
--  5. Memastikan sinkronisasi tabel profiles dari auth.users untuk data pengguna yang sudah ada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tambah kolom reporter_name di public.reports (opsional cache)
-- ------------------------------------------------------------
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS reporter_name TEXT;

-- ------------------------------------------------------------
-- 2. Sinkronkan profil yang belum ada di public.profiles dari auth.users
-- ------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, role)
SELECT 
    u.id, 
    COALESCE(
        NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(split_part(u.email, '@', 1)), ''),
        'Pengguna'
    ) AS full_name,
    'user' AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Fungsi is_admin() dengan SECURITY DEFINER
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ------------------------------------------------------------
-- 4. Perbarui RLS policy pada public.profiles
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

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
-- 5. RPC get_admin_reporters() (Aman & Dijamin Berhasil untuk Admin)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_reporters()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- Hanya izinkan jika pemanggil adalah admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: fungsi ini hanya untuk admin.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN QUERY
    SELECT 
        u.id AS user_id,
        COALESCE(
            NULLIF(TRIM(p.full_name), ''),
            NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
            NULLIF(TRIM(split_part(u.email, '@', 1)), ''),
            'Pengguna'
        ) AS full_name,
        u.email::TEXT
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_reporters() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_reporters() TO authenticated;

-- ------------------------------------------------------------
-- 6. Perbarui reporter_name pada reports yang sudah ada
-- ------------------------------------------------------------
UPDATE public.reports r
SET reporter_name = COALESCE(
    NULLIF(TRIM(p.full_name), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(split_part(u.email, '@', 1)), '')
)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE r.user_id = u.id
  AND (r.reporter_name IS NULL OR r.reporter_name = '' OR r.reporter_name = 'Pengguna');
