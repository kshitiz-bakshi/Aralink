-- TEMPORARY diagnostic function — inspect what's actually live for
-- check_entity_has_tenant (overloads + source), the real column types on
-- every relevant table, and reproduce each branch's query against real
-- rows (bypassing RLS via SECURITY DEFINER) to pinpoint exactly which
-- statement throws. Will be dropped once the uuid=text bug report is
-- fully diagnosed.
CREATE OR REPLACE FUNCTION public.debug_introspect_check_entity_has_tenant()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_functions JSONB;
  v_columns JSONB;
  v_sample_subunit UUID;
  v_sample_unit UUID;
  v_sample_property UUID;
  v_sample_tenant UUID;
  v_count INTEGER;
  v_name TEXT;
  v_results JSONB := '[]'::JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'oid', p.oid::TEXT,
    'args', pg_get_function_arguments(p.oid),
    'source', pg_get_functiondef(p.oid)
  ))
  INTO v_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'check_entity_has_tenant';

  SELECT jsonb_agg(jsonb_build_object(
    'table_name', table_name,
    'column_name', column_name,
    'data_type', data_type
  ))
  INTO v_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'tenant_property_links' AND column_name IN ('tenant_id','property_id','unit_id','sub_unit_id'))
      OR (table_name = 'tenants' AND column_name IN ('id','property_id','unit_id'))
      OR (table_name = 'units' AND column_name IN ('id','property_id'))
      OR (table_name = 'sub_units' AND column_name IN ('id','unit_id','tenant_id'))
      OR (table_name = 'properties' AND column_name = 'id')
    );

  SELECT id INTO v_sample_subunit FROM sub_units LIMIT 1;
  SELECT id INTO v_sample_unit FROM units LIMIT 1;
  SELECT id INTO v_sample_property FROM properties LIMIT 1;
  SELECT id INTO v_sample_tenant FROM tenants LIMIT 1;

  -- Reproduce each branch, catching errors individually so one failure
  -- doesn't stop us from seeing the others.
  BEGIN
    SELECT COUNT(*), MIN(first_name || ' ' || last_name) INTO v_count, v_name
    FROM tenants WHERE property_id::TEXT = v_sample_property::TEXT AND status = 'active';
    v_results := v_results || jsonb_build_object('branch', 'property.tenants', 'ok', true, 'count', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'property.tenants', 'ok', false, 'error', SQLERRM);
  END;

  BEGIN
    SELECT COUNT(*), MIN(t.first_name || ' ' || t.last_name) INTO v_count, v_name
    FROM tenant_property_links tpl
    JOIN tenants t ON t.id::TEXT = tpl.tenant_id::TEXT
    WHERE tpl.property_id::TEXT = v_sample_property::TEXT AND tpl.status = 'active';
    v_results := v_results || jsonb_build_object('branch', 'property.tpl_join', 'ok', true, 'count', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'property.tpl_join', 'ok', false, 'error', SQLERRM);
  END;

  BEGIN
    SELECT COUNT(*), MIN(first_name || ' ' || last_name) INTO v_count, v_name
    FROM tenants WHERE unit_id = v_sample_unit::TEXT AND status = 'active';
    v_results := v_results || jsonb_build_object('branch', 'unit.tenants', 'ok', true, 'count', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'unit.tenants', 'ok', false, 'error', SQLERRM);
  END;

  BEGIN
    SELECT COUNT(*), MIN(t.first_name || ' ' || t.last_name) INTO v_count, v_name
    FROM tenant_property_links tpl
    JOIN tenants t ON t.id::TEXT = tpl.tenant_id::TEXT
    WHERE tpl.unit_id::TEXT = v_sample_unit::TEXT AND tpl.status = 'active';
    v_results := v_results || jsonb_build_object('branch', 'unit.tpl_join', 'ok', true, 'count', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'unit.tpl_join', 'ok', false, 'error', SQLERRM);
  END;

  BEGIN
    SELECT COUNT(*), MIN(t.first_name || ' ' || t.last_name) INTO v_count, v_name
    FROM tenant_property_links tpl
    JOIN tenants t ON t.id::TEXT = tpl.tenant_id::TEXT
    WHERE tpl.sub_unit_id::TEXT = v_sample_subunit::TEXT AND tpl.status = 'active';
    v_results := v_results || jsonb_build_object('branch', 'subunit.tpl_join', 'ok', true, 'count', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'subunit.tpl_join', 'ok', false, 'error', SQLERRM);
  END;

  BEGIN
    SELECT COUNT(*), MIN(tenant_name) INTO v_count, v_name
    FROM sub_units WHERE id = v_sample_subunit AND (tenant_id IS NOT NULL OR tenant_name IS NOT NULL);
    v_results := v_results || jsonb_build_object('branch', 'subunit.inline_fallback', 'ok', true, 'count', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'subunit.inline_fallback', 'ok', false, 'error', SQLERRM);
  END;

  -- Actually call the real function for all four entity types, catching errors.
  BEGIN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.property', 'ok', true, 'result', check_entity_has_tenant('property', v_sample_property));
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.property', 'ok', false, 'error', SQLERRM);
  END;
  BEGIN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.unit', 'ok', true, 'result', check_entity_has_tenant('unit', v_sample_unit));
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.unit', 'ok', false, 'error', SQLERRM);
  END;
  BEGIN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.subunit', 'ok', true, 'result', check_entity_has_tenant('subunit', v_sample_subunit));
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.subunit', 'ok', false, 'error', SQLERRM);
  END;
  BEGIN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.tenant', 'ok', true, 'result', check_entity_has_tenant('tenant', v_sample_tenant));
  EXCEPTION WHEN OTHERS THEN
    v_results := v_results || jsonb_build_object('branch', 'REAL_CALL.tenant', 'ok', false, 'error', SQLERRM);
  END;

  RETURN jsonb_build_object(
    'functions', v_functions,
    'column_types', v_columns,
    'sample_ids', jsonb_build_object(
      'subunit', v_sample_subunit, 'unit', v_sample_unit,
      'property', v_sample_property, 'tenant', v_sample_tenant
    ),
    'branch_results', v_results
  );
END;
$$;
