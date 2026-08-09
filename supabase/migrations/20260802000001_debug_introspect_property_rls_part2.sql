-- TEMPORARY diagnostic function (part 2) — introspect live RLS policies on
-- tenants/transactions/maintenance_requests before implementing landlord/
-- manager linking. Dropped once inspected.
CREATE OR REPLACE FUNCTION public.debug_introspect_property_rls_part2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policies JSONB;
  v_rowsecurity JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(x)) INTO v_policies
  FROM (
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename IN ('tenants', 'transactions', 'maintenance_requests')
    ORDER BY tablename, policyname
  ) x;

  SELECT jsonb_agg(row_to_json(x)) INTO v_rowsecurity
  FROM (
    SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('tenants', 'transactions', 'maintenance_requests')
  ) x;

  RETURN jsonb_build_object('policies', v_policies, 'rowsecurity', v_rowsecurity);
END;
$$;
