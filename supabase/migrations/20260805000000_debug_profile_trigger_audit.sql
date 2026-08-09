-- TEMPORARY diagnostic — inspect the handle_new_user trigger (does it
-- exist? what does it do?) and find every auth.users row missing its
-- matching profiles row, plus what metadata is available to backfill
-- from. Dropped once inspected.
CREATE OR REPLACE FUNCTION public.debug_profile_trigger_audit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trigger JSONB;
  v_function_def TEXT;
  v_missing_count INT;
  v_missing_examples JSONB;
BEGIN
  -- Does the trigger exist on auth.users, and what function does it call?
  SELECT jsonb_agg(row_to_json(x)) INTO v_trigger
  FROM (
    SELECT
      t.tgname AS trigger_name,
      t.tgenabled AS enabled_flag,
      p.proname AS function_name,
      n.nspname AS function_schema
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace cn ON cn.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE cn.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
  ) x;

  -- Source of the function the trigger calls (if any), so we can see
  -- exactly what it does / where it might silently fail.
  SELECT pg_get_functiondef(p.oid) INTO v_function_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'handle_new_user'
  LIMIT 1;

  -- How many auth.users rows have no matching profiles row?
  SELECT COUNT(*) INTO v_missing_count
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE p.id IS NULL;

  -- A few concrete examples, including what metadata is available to
  -- backfill full_name / user_type from.
  SELECT jsonb_agg(row_to_json(x)) INTO v_missing_examples
  FROM (
    SELECT
      u.id, u.email, u.created_at,
      u.raw_user_meta_data,
      u.raw_app_meta_data
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE p.id IS NULL
    ORDER BY u.created_at DESC
    LIMIT 15
  ) x;

  RETURN jsonb_build_object(
    'trigger', v_trigger,
    'function_def', v_function_def,
    'missing_profiles_count', v_missing_count,
    'missing_profiles_examples', v_missing_examples
  );
END;
$$;
