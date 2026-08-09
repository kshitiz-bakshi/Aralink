-- ============================================================
-- Let a landlord add/change/remove the property manager linked to
-- their own property from the Edit Property flow — not just at
-- creation time.
-- ============================================================

-- ── link_property_manager ───────────────────────────────────
-- Links (or re-links) a manager to a property the caller actually
-- owns. Only one active manager per property is supported today
-- (matching the Property Detail UI) — linking a new one archives
-- any other active link for this property first, so it's always a
-- clean swap, never two "active" managers at once.
CREATE OR REPLACE FUNCTION public.link_property_manager(
  p_property_id  UUID,
  p_manager_id   UUID,
  p_manager_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_landlord_id UUID;
BEGIN
  SELECT user_id INTO v_landlord_id FROM properties WHERE id = p_property_id;
  IF v_landlord_id IS NULL THEN
    RAISE EXCEPTION 'property_not_found';
  END IF;
  IF auth.uid() IS DISTINCT FROM v_landlord_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Archive + remove any OTHER active manager link on this property
  -- first, so linking a new manager cleanly replaces the old one.
  INSERT INTO archive_property_collaborators (
    id, property_id, landlord_id, manager_id, status, created_by,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, property_id, landlord_id, manager_id, status, created_by,
    created_at, updated_at, NOW(), v_landlord_id
  FROM property_collaborators
  WHERE property_id = p_property_id AND status = 'active' AND manager_id <> p_manager_id;

  DELETE FROM property_collaborators
  WHERE property_id = p_property_id AND status = 'active' AND manager_id <> p_manager_id;

  INSERT INTO property_collaborators (property_id, landlord_id, manager_id, status, created_by)
  VALUES (p_property_id, v_landlord_id, p_manager_id, 'active', auth.uid())
  ON CONFLICT (property_id, manager_id)
  DO UPDATE SET status = 'active', updated_at = NOW();

  UPDATE properties SET property_manager_name = p_manager_name, updated_at = NOW()
  WHERE id = p_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_property_manager(UUID, UUID, TEXT) TO authenticated;

-- ── archive_and_unlink_property_collaborator — widen who may call it ──
-- Previously only the linked manager themself could unlink. A landlord
-- removing/replacing their own property's manager needs the same path.
CREATE OR REPLACE FUNCTION public.archive_and_unlink_property_collaborator(
  p_property_id UUID,
  p_manager_id  UUID,
  p_deleted_by  UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Either the manager themself, or the property's actual landlord, may
  -- remove this link.
  IF auth.uid() IS DISTINCT FROM p_manager_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM properties WHERE id = p_property_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'not_authorized';
    END IF;
  END IF;

  INSERT INTO archive_property_collaborators (
    id, property_id, landlord_id, manager_id, status, created_by,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, property_id, landlord_id, manager_id, status, created_by,
    created_at, updated_at, NOW(), p_deleted_by
  FROM property_collaborators
  WHERE property_id = p_property_id AND manager_id = p_manager_id;

  DELETE FROM property_collaborators
  WHERE property_id = p_property_id AND manager_id = p_manager_id;
END;
$$;
