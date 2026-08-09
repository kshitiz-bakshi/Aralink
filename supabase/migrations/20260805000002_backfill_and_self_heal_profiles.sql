-- ============================================================
-- Fix the 2 accounts whose handle_new_user insert never landed
-- (silently — that trigger swallows all errors), and add a
-- self-heal path so this class of gap can never strand an
-- account long-term again.
-- ============================================================

-- 1. Backfill the 2 known-affected accounts using their real signup
--    metadata (same COALESCE logic as handle_new_user). Idempotent.
INSERT INTO public.profiles (
  id, email, full_name, user_type,
  is_social_login, social_provider, avatar_url, phone,
  account_status, has_set_password
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, u.phone, 'User'), '@', 1)),
  COALESCE(u.raw_user_meta_data->>'role', u.raw_user_meta_data->>'user_type', 'tenant'),
  CASE WHEN u.raw_app_meta_data->>'provider' IN ('google', 'apple', 'facebook') THEN TRUE ELSE FALSE END,
  CASE u.raw_app_meta_data->>'provider'
    WHEN 'google' THEN 'google' WHEN 'apple' THEN 'apple' WHEN 'facebook' THEN 'facebook' ELSE NULL
  END,
  u.raw_user_meta_data->>'avatar_url',
  u.phone,
  'active',
  FALSE
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ensure_profile_exists
-- Self-heal: if the CALLING user's profiles row is somehow missing
-- (trigger failure, timing, whatever), create it on demand from their
-- real auth.users metadata and return it. Only ever acts on
-- auth.uid() — a user can only self-heal their own profile, never
-- anyone else's.
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
  v_user auth.users;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'auth_user_not_found';
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, user_type,
    is_social_login, social_provider, avatar_url, phone,
    account_status, has_set_password
  )
  VALUES (
    v_user.id,
    v_user.email,
    COALESCE(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', split_part(COALESCE(v_user.email, v_user.phone, 'User'), '@', 1)),
    COALESCE(v_user.raw_user_meta_data->>'role', v_user.raw_user_meta_data->>'user_type', 'tenant'),
    CASE WHEN v_user.raw_app_meta_data->>'provider' IN ('google', 'apple', 'facebook') THEN TRUE ELSE FALSE END,
    CASE v_user.raw_app_meta_data->>'provider'
      WHEN 'google' THEN 'google' WHEN 'apple' THEN 'apple' WHEN 'facebook' THEN 'facebook' ELSE NULL
    END,
    v_user.raw_user_meta_data->>'avatar_url',
    v_user.phone,
    'active',
    FALSE
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    -- Someone else (e.g. a concurrently-firing trigger) won the race —
    -- just read back what landed.
    SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  END IF;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_exists() TO authenticated;

COMMENT ON FUNCTION public.ensure_profile_exists()
  IS 'Self-heal: creates the calling user''s own profiles row on demand if handle_new_user never landed it. Only ever acts on auth.uid().';
