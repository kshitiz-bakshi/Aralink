-- ============================================================
-- get_property_landlord_manager_info
-- Single source of truth for displaying "who is the landlord /
-- who is the property manager" on a property, for either role.
-- Only ever returns data to someone actually linked to the
-- property (the owning landlord, or an active linked manager) —
-- never leaks another user's name/email to an unrelated caller.
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
  v_landlord_profile RECORD;
  v_manager_profile RECORD;
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

  SELECT full_name, email INTO v_landlord_profile FROM profiles WHERE id = v_property.user_id;

  IF v_collaborator.manager_id IS NOT NULL THEN
    SELECT full_name, email INTO v_manager_profile FROM profiles WHERE id = v_collaborator.manager_id;
  END IF;

  RETURN jsonb_build_object(
    'landlord_id', v_property.user_id,
    'landlord_name', COALESCE(v_property.landlord_name, v_landlord_profile.full_name),
    'landlord_email', v_landlord_profile.email,
    'manager_id', v_collaborator.manager_id,
    'manager_name', COALESCE(v_property.property_manager_name, v_manager_profile.full_name),
    'manager_email', v_manager_profile.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_landlord_manager_info(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_property_landlord_manager_info(UUID)
  IS 'Returns landlord/manager display info (name + email) for a property, scoped to callers actually linked to it. Used by the Property Detail screen.';
