-- TEMPORARY diagnostic function — confirm exact column types before writing
-- new FK/RLS SQL for landlord/manager property linking. Dropped once inspected.
CREATE OR REPLACE FUNCTION public.debug_column_types()
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
      AND table_name IN ('transactions', 'units', 'sub_units', 'maintenance_requests', 'tenants', 'leases')
      AND column_name IN ('id','property_id','unit_id','sub_unit_id','subunit_id','landlord_id','tenant_id','user_id')
    ORDER BY table_name, column_name
  ) x;

  RETURN v_columns;
END;
$$;
