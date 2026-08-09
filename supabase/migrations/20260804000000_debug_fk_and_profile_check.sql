-- TEMPORARY diagnostic — check whether properties.user_id has an FK to
-- profiles, and whether the reported user id exists in auth.users /
-- profiles. Dropped once inspected.
CREATE OR REPLACE FUNCTION public.debug_fk_and_profile_check(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_constraints JSONB;
  v_in_profiles BOOLEAN;
  v_in_auth_users BOOLEAN;
  v_profile_row JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(x)) INTO v_constraints
  FROM (
    SELECT
      con.conname,
      con.contype,
      rel.relname AS table_name,
      pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname IN ('properties', 'property_collaborators')
      AND con.contype = 'f'
    ORDER BY rel.relname, con.conname
  ) x;

  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_in_profiles;
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_in_auth_users;

  SELECT row_to_json(p)::JSONB INTO v_profile_row FROM profiles p WHERE p.id = p_user_id;

  RETURN jsonb_build_object(
    'fk_constraints', v_constraints,
    'exists_in_profiles', v_in_profiles,
    'exists_in_auth_users', v_in_auth_users,
    'profile_row', v_profile_row
  );
END;
$$;
