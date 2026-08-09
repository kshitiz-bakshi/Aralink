-- TEMPORARY diagnostic — list all CHECK/NOT NULL constraints on
-- profiles, to find why handle_new_user's INSERT silently failed for
-- 'manager' and 'ara_partner' role signups. Dropped once inspected.
CREATE OR REPLACE FUNCTION public.debug_profiles_constraints()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checks JSONB;
  v_columns JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(x)) INTO v_checks
  FROM (
    SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'profiles'
    ORDER BY con.contype, con.conname
  ) x;

  SELECT jsonb_agg(row_to_json(x)) INTO v_columns
  FROM (
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
    ORDER BY ordinal_position
  ) x;

  RETURN jsonb_build_object('constraints', v_checks, 'columns', v_columns);
END;
$$;
