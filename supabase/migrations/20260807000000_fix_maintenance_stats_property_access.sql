-- ============================================================
-- get_landlord_maintenance_stats used raw `landlord_id = landlord_uuid`,
-- the same stale assumption fixed in fetchMaintenanceRequests()
-- client-side: landlord_id doesn't reflect a linked property manager's
-- access, and won't retroactively include historical rows where it was
-- set incorrectly. Scope by accessible properties instead (owned, or
-- linked via property_collaborators) so this stays correct for both
-- landlord and manager callers, matching the rest of the linking feature.
-- ============================================================
CREATE OR REPLACE FUNCTION get_landlord_maintenance_stats(landlord_uuid UUID)
RETURNS TABLE (
  total_requests      BIGINT,
  new_requests        BIGINT,
  in_progress_requests BIGINT,
  resolved_requests   BIGINT,
  emergency_requests  BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status IN ('new','under_review'))::BIGINT,
    COUNT(*) FILTER (WHERE status IN ('in_progress','waiting_vendor'))::BIGINT,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT,
    COUNT(*) FILTER (WHERE urgency = 'emergency')::BIGINT
  FROM public.maintenance_requests
  WHERE property_id IN (
    SELECT id FROM public.properties WHERE user_id = landlord_uuid
    UNION
    SELECT property_id FROM public.property_collaborators
    WHERE manager_id = landlord_uuid AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
