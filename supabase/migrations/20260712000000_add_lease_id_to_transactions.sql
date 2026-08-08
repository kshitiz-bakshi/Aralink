-- ============================================================
-- Add lease_id to transactions.
--
-- app/add-transaction.tsx and lib/supabase.ts createTransaction() have
-- always tried to save a lease_id on rent transactions (auto-mapped from
-- the active lease for a property/unit), but the column never existed —
-- any insert that included a non-null lease_id would fail outright with
-- "column transactions.lease_id does not exist". Confirmed live via the
-- REST API that tenant_id/property_id/unit_id/subunit_id all exist but
-- lease_id does not. This is required for the unified income/tenant-ledger
-- linking feature (transactions must reference the lease they belong to).
-- ============================================================

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS lease_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_lease_id'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_lease_id
    FOREIGN KEY (lease_id)
    REFERENCES leases(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_lease_id ON transactions(lease_id);
