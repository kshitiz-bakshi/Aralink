-- TEMPORARY diagnostic function — introspect live RLS policies + rowsecurity
-- flags on properties/units/sub_units/property_collaborators-adjacent tables
-- before implementing landlord/manager linking. Dropped once inspected.
CREATE OR REPLACE FUNCTION public.debug_introspect_property_rls()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policies JSONB;
  v_rowsecurity JSONB;
  v_columns JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(x)) INTO v_policies
  FROM (
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename IN ('properties', 'units', 'sub_units', 'tenant_property_links', 'leases')
    ORDER BY tablename, policyname
  ) x;

  SELECT jsonb_agg(row_to_json(x)) INTO v_rowsecurity
  FROM (
    SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('properties', 'units', 'sub_units', 'tenant_property_links', 'leases', 'profiles')
  ) x;

  SELECT jsonb_agg(row_to_json(x)) INTO v_columns
  FROM (
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('properties', 'profiles')
    ORDER BY table_name, ordinal_position
  ) x;

  RETURN jsonb_build_object(
    'policies', v_policies,
    'rowsecurity', v_rowsecurity,
    'columns', v_columns
  );
END;
$$;
