-- TEMPORARY diagnostic function — inspect the most recent transactions and
-- cross-reference their tenant/lease/unit/subunit linkage against the
-- authoritative tenant_property_links rows, to find out exactly why
-- transactions added from Accounting vs. the Tenant screen aren't showing
-- up in each other's list. Will be dropped once diagnosed.
CREATE OR REPLACE FUNCTION public.debug_tenant_ledger_mismatch()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_txns JSONB;
  v_links JSONB;
  v_tenant_row JSONB;
BEGIN
  SELECT row_to_json(t)::JSONB INTO v_tenant_row
  FROM tenants t
  WHERE t.id = '7f49f007-89cf-4412-91c8-c02c4401941b';

  SELECT jsonb_agg(row_to_json(x))
  INTO v_recent_txns
  FROM (
    SELECT
      tx.id, tx.user_id, tx.type, tx.category, tx.amount, tx.status,
      tx.date, tx.created_at, tx.property_id, tx.unit_id, tx.subunit_id,
      tx.tenant_id, tx.lease_id, tx.description,
      t.first_name AS tenant_first_name, t.last_name AS tenant_last_name,
      p.address1 AS property_address
    FROM transactions tx
    LEFT JOIN tenants t ON t.id = tx.tenant_id
    LEFT JOIN properties p ON p.id = tx.property_id
    ORDER BY tx.created_at DESC
    LIMIT 10
  ) x;

  SELECT jsonb_agg(row_to_json(x))
  INTO v_links
  FROM (
    SELECT
      l.id, l.tenant_id, l.property_id, l.unit_id, l.sub_unit_id,
      l.status, l.link_start_date, l.link_end_date,
      t.first_name AS tenant_first_name, t.last_name AS tenant_last_name,
      t.unit_id AS tenant_row_unit_id, t.unit_name AS tenant_row_unit_name
    FROM tenant_property_links l
    LEFT JOIN tenants t ON t.id = l.tenant_id
    WHERE l.tenant_id = '7f49f007-89cf-4412-91c8-c02c4401941b'
       OR t.first_name ILIKE '%lever%' OR t.last_name ILIKE '%lever%'
    ORDER BY l.created_at DESC
  ) x;

  RETURN jsonb_build_object(
    'recent_transactions', v_recent_txns,
    'recent_tenant_property_links', v_links,
    'test_lever_tenant_row', v_tenant_row
  );
END;
$$;
