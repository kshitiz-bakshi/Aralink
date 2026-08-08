-- Clean up the temporary diagnostic function used to trace the
-- Accounting <-> Tenant Ledger income-linking mismatch.
DROP FUNCTION IF EXISTS public.debug_tenant_ledger_mismatch();
