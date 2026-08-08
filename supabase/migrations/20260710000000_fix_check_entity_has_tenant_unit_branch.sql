-- ============================================================
-- Fix the remaining "operator does not exist: uuid = text" in
-- check_entity_has_tenant's 'unit' branch.
--
-- Diagnosis (via a temporary introspection RPC, now dropped below):
-- EVERY relevant column across tenants, units, sub_units, and
-- tenant_property_links is actually UUID — the old comments claiming
-- "unit_id stored as TEXT" etc. were simply wrong for the live schema.
-- That's harmless everywhere both sides already got cast to ::TEXT, but
-- one query in the 'unit' branch only cast the RIGHT side:
--
--   FROM tenants WHERE unit_id = p_entity_id::TEXT AND status = 'active';
--                      ^^^^^^^ UUID           ^^^^^^^^^^^^^^^^^ TEXT
--
-- comparing tenants.unit_id (UUID) to p_entity_id::TEXT (TEXT) — exactly
-- "operator does not exist: uuid = text". This is the query that was
-- still failing for entityType 'unit' after the previous migration fixed
-- the tenant_property_links joins and the 'subunit'/'property' branches
-- (both of which already cast both sides correctly).
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_entity_has_tenant(
  p_entity_type TEXT,
  p_entity_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_count  INTEGER := 0;
  v_tenant_name   TEXT;
  v_tmp_count     INTEGER;
  v_tmp_name      TEXT;
BEGIN
  IF p_entity_type = 'property' THEN
    SELECT COUNT(*), MIN(first_name || ' ' || last_name)
    INTO v_tenant_count, v_tenant_name
    FROM tenants
    WHERE property_id::TEXT = p_entity_id::TEXT AND status = 'active';

    IF v_tenant_count = 0 THEN
      SELECT COUNT(*), MIN(t.first_name || ' ' || t.last_name)
      INTO v_tmp_count, v_tmp_name
      FROM tenant_property_links tpl
      JOIN tenants t ON t.id::TEXT = tpl.tenant_id::TEXT
      WHERE tpl.property_id::TEXT = p_entity_id::TEXT
        AND tpl.status = 'active';
      IF v_tmp_count > 0 THEN
        v_tenant_count := v_tmp_count;
        v_tenant_name  := v_tmp_name;
      END IF;
    END IF;

    IF v_tenant_count = 0 THEN
      SELECT COUNT(*) INTO v_tmp_count
      FROM units
      WHERE property_id = p_entity_id AND is_occupied = TRUE;
      v_tenant_count := COALESCE(v_tmp_count, 0);
    END IF;

  ELSIF p_entity_type = 'unit' THEN
    -- FIX: cast unit_id too, not just p_entity_id — tenants.unit_id is UUID.
    SELECT COUNT(*), MIN(first_name || ' ' || last_name)
    INTO v_tenant_count, v_tenant_name
    FROM tenants
    WHERE unit_id::TEXT = p_entity_id::TEXT AND status = 'active';

    IF v_tenant_count = 0 THEN
      SELECT COUNT(*), MIN(t.first_name || ' ' || t.last_name)
      INTO v_tmp_count, v_tmp_name
      FROM tenant_property_links tpl
      JOIN tenants t ON t.id::TEXT = tpl.tenant_id::TEXT
      WHERE tpl.unit_id::TEXT = p_entity_id::TEXT
        AND tpl.status = 'active';
      IF v_tmp_count > 0 THEN
        v_tenant_count := v_tmp_count;
        v_tenant_name  := v_tmp_name;
      END IF;
    END IF;

    IF v_tenant_count = 0 THEN
      SELECT COUNT(*) INTO v_tmp_count
      FROM units WHERE id = p_entity_id AND is_occupied = TRUE;
      v_tenant_count := COALESCE(v_tmp_count, 0);
    END IF;

  ELSIF p_entity_type = 'subunit' THEN
    SELECT COUNT(*), MIN(t.first_name || ' ' || t.last_name)
    INTO v_tenant_count, v_tenant_name
    FROM tenant_property_links tpl
    JOIN tenants t ON t.id::TEXT = tpl.tenant_id::TEXT
    WHERE tpl.sub_unit_id::TEXT = p_entity_id::TEXT
      AND tpl.status = 'active';

    IF v_tenant_count = 0 THEN
      SELECT COUNT(*), MIN(tenant_name)
      INTO v_tmp_count, v_tmp_name
      FROM sub_units
      WHERE id = p_entity_id
        AND (tenant_id IS NOT NULL OR tenant_name IS NOT NULL);
      IF v_tmp_count > 0 THEN
        v_tenant_count := v_tmp_count;
        v_tenant_name  := v_tmp_name;
      END IF;
    END IF;

  ELSIF p_entity_type = 'tenant' THEN
    SELECT COUNT(*), MIN(first_name || ' ' || last_name)
    INTO v_tenant_count, v_tenant_name
    FROM tenants WHERE id = p_entity_id;
  END IF;

  RETURN jsonb_build_object(
    'has_tenant',    v_tenant_count > 0,
    'tenant_name',   v_tenant_name,
    'tenant_count',  v_tenant_count
  );
END;
$$;

-- Clean up the temporary diagnostic function from the previous migration.
DROP FUNCTION IF EXISTS public.debug_introspect_check_entity_has_tenant();
