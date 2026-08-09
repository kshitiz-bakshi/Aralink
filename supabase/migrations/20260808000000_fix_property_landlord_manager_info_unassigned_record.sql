-- ============================================================
-- Fix: get_property_landlord_manager_info raised "record
-- v_manager_profile is not assigned yet" whenever a property had
-- no active linked manager (e.g. right after the manager unlinked
-- themselves) — the RECORD variable was only ever assigned inside
-- an IF branch that's skipped in that exact case, and referencing
-- an unassigned RECORD's fields is a hard Postgres error.
-- Replaced with plain scalar variables, which are always
-- well-defined (NULL) even when the lookup SELECT never runs.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_property_landlord_manager_info(p_property_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property RECORD;
  v_collaborator RECORD;
  v_landlord_name TEXT;
  v_landlord_email TEXT;
  v_manager_name TEXT;
  v_manager_email TEXT;
BEGIN
  SELECT id, user_id, landlord_name, property_manager_name
  INTO v_property
  FROM properties
  WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'property_not_found';
  END IF;

  -- Caller must be the owning landlord or an active linked manager.
  SELECT * INTO v_collaborator
  FROM property_collaborators
  WHERE property_id = p_property_id AND status = 'active'
    AND (landlord_id = auth.uid() OR manager_id = auth.uid())
  LIMIT 1;

  IF auth.uid() IS DISTINCT FROM v_property.user_id AND v_collaborator IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT full_name, email INTO v_landlord_name, v_landlord_email
  FROM profiles WHERE id = v_property.user_id;

  IF v_collaborator.manager_id IS NOT NULL THEN
    SELECT full_name, email INTO v_manager_name, v_manager_email
    FROM profiles WHERE id = v_collaborator.manager_id;
  END IF;

  RETURN jsonb_build_object(
    'landlord_id', v_property.user_id,
    'landlord_name', COALESCE(v_property.landlord_name, v_landlord_name),
    'landlord_email', v_landlord_email,
    'manager_id', v_collaborator.manager_id,
    'manager_name', COALESCE(v_property.property_manager_name, v_manager_name),
    'manager_email', v_manager_email
  );
END;
$$;
