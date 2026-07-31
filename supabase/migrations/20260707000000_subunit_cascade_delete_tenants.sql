-- ============================================================
-- Fix cascade delete on room (sub_unit) deletion.
--
-- archive_and_delete_subunit previously archived + deleted the sub_unit and
-- its tenant_property_links, but never touched the `tenants` table itself —
-- unlike archive_and_delete_unit and archive_and_delete_property, which both
-- archive + delete matching tenants before removing the unit/property. That
-- inconsistency left an orphaned `tenants` row (still "active", pointing at
-- a room that no longer exists) whenever a room was deleted directly.
--
-- This migration brings archive_and_delete_subunit in line with the other
-- two: it now also archives and deletes any tenant assigned to that room,
-- whether the assignment is tracked via tenant_property_links.sub_unit_id
-- (the normal path) or the legacy inline sub_units.tenant_id column. It
-- deletes ALL of that tenant's tenant_property_links rows (not just the one
-- for this room) before deleting the tenant itself, mirroring
-- archive_and_delete_tenant, so the tenant_id FK on tenant_property_links
-- never blocks the delete.
--
-- Note: room/unit/property photos in Supabase Storage and `leases` rows are
-- NOT touched here — Storage objects can't be safely removed from a plain
-- SQL function (deleting storage.objects rows only removes the DB metadata,
-- not the underlying object), and the `leases` table has no sub_unit_id
-- column to key off of at all. Photo cleanup is handled client-side
-- (store/propertyStore.ts deleteSubUnit) before this RPC is called.
-- ============================================================

CREATE OR REPLACE FUNCTION public.archive_and_delete_subunit(
  p_subunit_id UUID,
  p_deleted_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- TEXT, not UUID: tenant_property_links.tenant_id/sub_unit_id are TEXT
  -- columns (same as property_id/unit_id on that table) — comparing them
  -- directly against UUID values throws "operator does not exist:
  -- uuid = text" (see the 20260708000000 migration fixing the same class
  -- of bug in check_entity_has_tenant). Casting everything to TEXT here
  -- sidesteps that regardless of the tenants.id column's real type.
  v_tenant_ids TEXT[];
BEGIN
  -- Capture the affected tenant IDs once, up front — via
  -- tenant_property_links.sub_unit_id (the normal path) or the legacy
  -- inline sub_units.tenant_id column.
  SELECT ARRAY(
    SELECT tenant_id::TEXT FROM tenant_property_links WHERE sub_unit_id::TEXT = p_subunit_id::TEXT
    UNION
    SELECT tenant_id::TEXT FROM sub_units WHERE id = p_subunit_id AND tenant_id IS NOT NULL
  ) INTO v_tenant_ids;

  -- 1. Archive the affected tenants
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
  WHERE id::TEXT = ANY(v_tenant_ids);

  -- 2. Archive the sub_unit
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
  WHERE id = p_subunit_id;

  -- 3. Delete ALL tenant_property_links for the affected tenants (not just
  --    the link for this room), so the tenant_id FK never blocks step 4.
  DELETE FROM tenant_property_links WHERE tenant_id::TEXT = ANY(v_tenant_ids);

  -- 4. Delete the affected tenants
  DELETE FROM tenants WHERE id::TEXT = ANY(v_tenant_ids);

  -- 5. Safety net: remove any remaining tenant_property_links still
  --    pointing at this sub_unit (e.g. a row with a null/mismatched tenant_id)
  DELETE FROM tenant_property_links WHERE sub_unit_id::TEXT = p_subunit_id::TEXT;

  -- 6. Delete the sub_unit
  DELETE FROM sub_units WHERE id = p_subunit_id;
END;
$$;
