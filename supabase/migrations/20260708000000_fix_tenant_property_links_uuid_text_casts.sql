-- ============================================================
-- Fix "operator does not exist: uuid = text" across every function that
-- compares tenant_property_links.tenant_id / unit_id / sub_unit_id against
-- a UUID parameter or tenants.id. Those columns are TEXT (same as
-- property_id, which every function already casts everywhere it's compared
-- — see the "cast both sides to TEXT" comments below); three functions had
-- comparisons that were never cast when first written:
--
--   check_entity_has_tenant:
--     - `t.id = tpl.tenant_id`          (tenants.id is UUID, tpl.tenant_id is TEXT)
--     - `tpl.unit_id = p_entity_id`     (p_entity_id is UUID)
--     - `tpl.sub_unit_id = p_entity_id` (p_entity_id is UUID)
--     → any call into the 'unit' or 'subunit' branches that reached the
--       tenant_property_links join failed outright — most visibly when
--       deleting a room (sub-unit), since that branch runs the join
--       unconditionally.
--
--   archive_and_delete_unit:
--     - `DELETE FROM tenant_property_links WHERE unit_id = p_unit_id`
--     → deleting a unit directly would fail the same way.
--
--   archive_and_delete_tenant:
--     - `DELETE FROM tenant_property_links WHERE tenant_id = p_tenant_id`
--     → deleting a tenant directly would fail the same way.
--
-- (archive_and_delete_subunit already got the equivalent fix in the
-- 20260707000000 migration.)
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
    -- Check tenants table (cast both sides to TEXT to handle UUID or TEXT column)
    SELECT COUNT(*), MIN(first_name || ' ' || last_name)
    INTO v_tenant_count, v_tenant_name
    FROM tenants
    WHERE property_id::TEXT = p_entity_id::TEXT AND status = 'active';

    -- Also check tenant_property_links for room-level tenants
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

    -- Also catch units marked occupied without a tenants-table record
    IF v_tenant_count = 0 THEN
      SELECT COUNT(*) INTO v_tmp_count
      FROM units
      WHERE property_id = p_entity_id AND is_occupied = TRUE;
      v_tenant_count := COALESCE(v_tmp_count, 0);
    END IF;

  ELSIF p_entity_type = 'unit' THEN
    -- Check tenants table (unit_id stored as TEXT)
    SELECT COUNT(*), MIN(first_name || ' ' || last_name)
    INTO v_tenant_count, v_tenant_name
    FROM tenants
    WHERE unit_id = p_entity_id::TEXT AND status = 'active';

    -- Check tenant_property_links for this unit (including sub-units)
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

    -- Check units.is_occupied
    IF v_tenant_count = 0 THEN
      SELECT COUNT(*) INTO v_tmp_count
      FROM units WHERE id = p_entity_id AND is_occupied = TRUE;
      v_tenant_count := COALESCE(v_tmp_count, 0);
    END IF;

  ELSIF p_entity_type = 'subunit' THEN
    -- Check tenant_property_links for this sub-unit
    SELECT COUNT(*), MIN(t.first_name || ' ' || t.last_name)
    INTO v_tenant_count, v_tenant_name
    FROM tenant_property_links tpl
    JOIN tenants t ON t.id::TEXT = tpl.tenant_id::TEXT
    WHERE tpl.sub_unit_id::TEXT = p_entity_id::TEXT
      AND tpl.status = 'active';

    -- Fallback: inline tenant_name on sub_units
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

-- ============================================================
-- archive_and_delete_unit — same missing cast, step 4 only
-- ============================================================
CREATE OR REPLACE FUNCTION public.archive_and_delete_unit(
  p_unit_id    UUID,
  p_deleted_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Archive sub_units of this unit
  INSERT INTO archive_sub_units (
    id, unit_id, name, type, rent_price, area, availability_date,
    photos, amenities, shared_spaces, tenant_id, tenant_name,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, unit_id, name, type, rent_price, area, availability_date,
    photos, amenities, shared_spaces, tenant_id, tenant_name,
    created_at, updated_at, NOW(), p_deleted_by
  FROM sub_units
  WHERE unit_id = p_unit_id;

  -- 2. Archive tenants linked to this unit
  INSERT INTO archive_tenants (
    id, user_id, first_name, last_name, email, phone, property_id, unit_id,
    unit_name, photo, start_date, end_date, rent_amount, status, payments,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, user_id, first_name, last_name, email, phone, property_id, unit_id,
    unit_name, photo, start_date, end_date, rent_amount, status, payments,
    created_at, updated_at, NOW(), p_deleted_by
  FROM tenants
  WHERE unit_id = p_unit_id::TEXT;

  -- 3. Archive the unit itself
  INSERT INTO archive_units (
    id, property_id, name, description, unit_type, bedrooms, bathrooms, area,
    rent_entire_unit, default_rent_price, availability_date, lease_start_date,
    lease_end_date, photos, amenities, tenant_id, is_occupied,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, property_id, name, description, unit_type, bedrooms, bathrooms, area,
    rent_entire_unit, default_rent_price, availability_date, lease_start_date,
    lease_end_date, photos, amenities, tenant_id, is_occupied,
    created_at, updated_at, NOW(), p_deleted_by
  FROM units
  WHERE id = p_unit_id;

  -- 4. Delete all tenant_property_links for this unit (covers sub-unit links too)
  DELETE FROM tenant_property_links WHERE unit_id::TEXT = p_unit_id::TEXT;

  -- 5. Delete tenants linked to this unit (text FK)
  DELETE FROM tenants WHERE unit_id = p_unit_id::TEXT;

  -- 6. Delete unit → cascades to sub_units
  DELETE FROM units WHERE id = p_unit_id;

END;
$$;

-- ============================================================
-- archive_and_delete_tenant — same missing cast, step 3 only
-- ============================================================
CREATE OR REPLACE FUNCTION public.archive_and_delete_tenant(
  p_tenant_id  UUID,
  p_deleted_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Archive the tenant
  INSERT INTO archive_tenants (
    id, user_id, first_name, last_name, email, phone, property_id, unit_id,
    unit_name, photo, start_date, end_date, rent_amount, status, payments,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, user_id, first_name, last_name, email, phone, property_id, unit_id,
    unit_name, photo, start_date, end_date, rent_amount, status, payments,
    created_at, updated_at, NOW(), p_deleted_by
  FROM tenants
  WHERE id = p_tenant_id;

  -- 2. Clear sub_units.tenant_id / tenant_name where this tenant was assigned inline
  UPDATE sub_units
  SET tenant_id = NULL, tenant_name = NULL, updated_at = NOW()
  WHERE tenant_id = p_tenant_id;

  -- 3. Delete all tenant_property_links for this tenant
  DELETE FROM tenant_property_links WHERE tenant_id::TEXT = p_tenant_id::TEXT;

  -- 4. Delete the tenant record
  DELETE FROM tenants WHERE id = p_tenant_id;
END;
$$;
