-- ============================================================
-- Fix the remaining "operator does not exist: uuid = text" in
-- archive_and_delete_unit.
--
-- The 20260708000000 migration fixed this function's
-- tenant_property_links DELETE (step 4) but missed two sibling
-- occurrences of the exact same bug in the same function:
--
--   -- step 2 (archive insert)
--   FROM tenants WHERE unit_id = p_unit_id::TEXT;
--
--   -- step 5 (delete)
--   DELETE FROM tenants WHERE unit_id = p_unit_id::TEXT;
--
-- tenants.unit_id is UUID (confirmed live, not TEXT as the old comments
-- assumed) — only the right-hand side was cast in both statements.
-- Casting the left side too, consistent with every other fixed spot.
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
  WHERE unit_id::TEXT = p_unit_id::TEXT;

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

  -- 5. Delete tenants linked to this unit
  DELETE FROM tenants WHERE unit_id::TEXT = p_unit_id::TEXT;

  -- 6. Delete unit → cascades to sub_units
  DELETE FROM units WHERE id = p_unit_id;

END;
$$;
