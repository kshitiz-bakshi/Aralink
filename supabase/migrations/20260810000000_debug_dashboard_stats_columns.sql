-- TEMPORARY diagnostic — confirm exact columns on every table the landlord
-- dashboard's stats queries touch, before rewriting them to be
-- property-access-aware (owned + linked manager) instead of raw
-- landlord_id/user_id equality. Dropped once inspected.
CREATE OR REPLACE FUNCTION public.debug_dashboard_stats_columns()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_columns JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(x)) INTO v_columns
  FROM (
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('tenant_property_links', 'leases', 'applicants', 'maintenance_requests', 'transactions', 'properties')
      AND column_name IN ('id','property_id','unit_id','landlord_id','tenant_id','user_id','status')
    ORDER BY table_name, column_name
  ) x;

  RETURN v_columns;
END;
$$;
