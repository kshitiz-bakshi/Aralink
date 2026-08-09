-- ============================================================
-- Landlord <-> Property Manager property linking
-- One shared property record, linked (not duplicated) between a
-- landlord and an optional property manager, resolved by
-- email + role (never email alone).
-- ============================================================

-- ── properties: audit columns for who actually created the row ──
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_by_role TEXT DEFAULT 'landlord';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_manager_name TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_created_by_role_check'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_created_by_role_check
      CHECK (created_by_role IN ('landlord', 'manager'));
  END IF;
END $$;

-- Backfill: every existing property was created directly by its owner.
UPDATE public.properties SET created_by_user_id = user_id WHERE created_by_user_id IS NULL;

-- ============================================================
-- property_collaborators — the one link table connecting a
-- landlord and a property manager to the SAME property row.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_collaborators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id),
  manager_id  UUID NOT NULL REFERENCES public.profiles(id),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, manager_id)
);

CREATE INDEX IF NOT EXISTS idx_property_collaborators_property ON public.property_collaborators(property_id);
CREATE INDEX IF NOT EXISTS idx_property_collaborators_landlord ON public.property_collaborators(landlord_id);
CREATE INDEX IF NOT EXISTS idx_property_collaborators_manager  ON public.property_collaborators(manager_id);

ALTER TABLE public.property_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collaborators_select_own" ON public.property_collaborators;
CREATE POLICY "collaborators_select_own"
  ON public.property_collaborators FOR SELECT
  USING (auth.uid() = landlord_id OR auth.uid() = manager_id);

DROP POLICY IF EXISTS "collaborators_insert_own" ON public.property_collaborators;
CREATE POLICY "collaborators_insert_own"
  ON public.property_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (auth.uid() = landlord_id OR auth.uid() = manager_id)
  );

DROP POLICY IF EXISTS "collaborators_update_own" ON public.property_collaborators;
CREATE POLICY "collaborators_update_own"
  ON public.property_collaborators FOR UPDATE
  USING (auth.uid() = landlord_id OR auth.uid() = manager_id)
  WITH CHECK (auth.uid() = landlord_id OR auth.uid() = manager_id);

-- No client-side DELETE policy — unlinking always goes through
-- archive_and_unlink_property_collaborator() so it's archived first.

GRANT SELECT, INSERT, UPDATE ON public.property_collaborators TO authenticated;

-- ============================================================
-- archive_property_collaborators — write-once archive, mirrors
-- property_collaborators. Same pattern as archive_properties etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.archive_property_collaborators (
  id          UUID NOT NULL,
  property_id UUID,
  landlord_id UUID,
  manager_id  UUID,
  status      TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ,
  deleted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by  UUID
);

CREATE INDEX IF NOT EXISTS idx_archive_property_collaborators_property ON public.archive_property_collaborators(property_id);
CREATE INDEX IF NOT EXISTS idx_archive_property_collaborators_deleted_at ON public.archive_property_collaborators(deleted_at);

ALTER TABLE public.archive_property_collaborators ENABLE ROW LEVEL SECURITY;
-- No client-readable policies — query via service_role / SQL editor only.

-- ============================================================
-- find_profile_by_email_and_role
-- Looks up a profile by email AND role together — never email
-- alone, per spec (the same email may exist under both roles).
-- SECURITY DEFINER so it works regardless of the caller's own
-- SELECT access to other people's profile rows, and only ever
-- returns the minimal safe fields needed to link/display.
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_profile_by_email_and_role(
  p_email TEXT,
  p_role  TEXT
)
RETURNS TABLE (id UUID, full_name TEXT, email TEXT, user_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_role NOT IN ('landlord', 'manager') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.user_type
  FROM profiles p
  WHERE lower(p.email) = lower(trim(p_email))
    AND p.user_type = p_role
  LIMIT 1;
END;
$$;

-- ============================================================
-- create_property_with_link
-- Single entry point for BOTH creation paths:
--   - landlord creates (optionally links an existing manager)
--   - manager creates on behalf of a REQUIRED, already-registered
--     landlord
-- Always stores the property under the landlord's user_id (the
-- landlord is always the true owner/signer), regardless of who
-- physically created the row, and performs an address+type
-- duplicate check scoped to that landlord so the same real
-- property is never inserted twice — the caller is linked to
-- the existing row instead.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_property_with_link(
  p_created_by      UUID,
  p_created_by_role TEXT,
  p_landlord_id     UUID,
  p_manager_id      UUID DEFAULT NULL,
  p_landlord_name   TEXT DEFAULT NULL,
  p_manager_name    TEXT DEFAULT NULL,
  p_name            TEXT DEFAULT NULL,
  p_address1        TEXT DEFAULT '',
  p_address2        TEXT DEFAULT NULL,
  p_city            TEXT DEFAULT '',
  p_state           TEXT DEFAULT '',
  p_zip_code        TEXT DEFAULT '',
  p_country         TEXT DEFAULT 'Canada',
  p_property_type   TEXT DEFAULT 'single_unit',
  p_rent_complete_property BOOLEAN DEFAULT NULL,
  p_description     TEXT DEFAULT NULL,
  p_photos          TEXT[] DEFAULT NULL,
  p_parking_included BOOLEAN DEFAULT NULL,
  p_rent_amount     NUMERIC DEFAULT NULL,
  p_utilities       JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id UUID;
  v_existing_id UUID;
  v_normalized_address TEXT;
BEGIN
  -- Caller must be who they claim to be creating as.
  IF auth.uid() IS DISTINCT FROM p_created_by THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_created_by_role NOT IN ('landlord', 'manager') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  -- A manager may only create a property under a landlord who is
  -- genuinely registered as a landlord. Enforced here too (not just
  -- client-side) so this can never be bypassed.
  IF p_created_by_role = 'manager' THEN
    IF p_landlord_id IS NULL THEN
      RAISE EXCEPTION 'landlord_required';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = p_landlord_id AND user_type = 'landlord'
    ) THEN
      RAISE EXCEPTION 'landlord_not_registered';
    END IF;
    IF p_manager_id IS NULL THEN
      p_manager_id := p_created_by;
    END IF;
  ELSE
    -- Landlord path: the landlord is always the creator.
    p_landlord_id := p_created_by;
  END IF;

  v_normalized_address := lower(regexp_replace(trim(p_address1), '\s+', ' ', 'g'));

  -- Duplicate protection: same real property already exists for this
  -- landlord (same normalized address + property type) — link instead
  -- of creating a second row.
  SELECT id INTO v_existing_id
  FROM properties
  WHERE user_id = p_landlord_id
    AND lower(regexp_replace(trim(address1), '\s+', ' ', 'g')) = v_normalized_address
    AND property_type = p_property_type
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    v_property_id := v_existing_id;
  ELSE
    INSERT INTO properties (
      user_id, name, address1, address2, city, state, zip_code, country,
      property_type, landlord_name, property_manager_name,
      rent_complete_property, description, photos, parking_included,
      rent_amount, utilities, status, created_by_user_id, created_by_role,
      created_at, updated_at
    ) VALUES (
      p_landlord_id, p_name, p_address1, p_address2, p_city, p_state, p_zip_code, p_country,
      p_property_type, p_landlord_name, p_manager_name,
      p_rent_complete_property, p_description, p_photos, p_parking_included,
      p_rent_amount, p_utilities, 'active', p_created_by, p_created_by_role,
      NOW(), NOW()
    )
    RETURNING id INTO v_property_id;

    -- Auto-create a default unit for non-multi-unit properties, same as
    -- the existing client-side behavior — done here too so RLS never
    -- blocks a manager-created property's default unit.
    IF p_property_type <> 'multi_unit' THEN
      INSERT INTO units (property_id, name, description, unit_type, is_occupied, created_at, updated_at)
      VALUES (v_property_id, 'Main Unit', '', 'apartment', false, NOW(), NOW());
    END IF;
  END IF;

  -- Link the manager (if any) to this property — idempotent.
  IF p_manager_id IS NOT NULL THEN
    INSERT INTO property_collaborators (property_id, landlord_id, manager_id, status, created_by)
    VALUES (v_property_id, p_landlord_id, p_manager_id, 'active', p_created_by)
    ON CONFLICT (property_id, manager_id)
    DO UPDATE SET status = 'active', updated_at = NOW();
  END IF;

  RETURN jsonb_build_object(
    'property_id', v_property_id,
    'was_existing', v_existing_id IS NOT NULL
  );
END;
$$;

-- ============================================================
-- archive_and_unlink_property_collaborator
-- The property-manager "delete" path: removes ONLY the manager's
-- link to the property. The property itself, its units, tenants,
-- leases, and the landlord's access are completely untouched.
-- ============================================================
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
  IF auth.uid() IS DISTINCT FROM p_manager_id THEN
    RAISE EXCEPTION 'not_authorized';
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

-- ============================================================
-- archive_and_delete_property — amended
-- Adds: (1) an ownership check (only the landlord who owns the
-- property may hard-delete it — a linked manager physically
-- cannot reach this path), (2) archiving + removal of any
-- property_collaborators rows before the property itself is
-- removed, so a landlord delete also cleanly ends the manager's
-- link (archived, not silently orphaned).
-- ============================================================
CREATE OR REPLACE FUNCTION public.archive_and_delete_property(
  p_property_id UUID,
  p_deleted_by  UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_deleted_by THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM properties WHERE id = p_property_id AND user_id = p_deleted_by
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- 0. Archive + remove the landlord<->manager link(s) for this property.
  INSERT INTO archive_property_collaborators (
    id, property_id, landlord_id, manager_id, status, created_by,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, property_id, landlord_id, manager_id, status, created_by,
    created_at, updated_at, NOW(), p_deleted_by
  FROM property_collaborators
  WHERE property_id = p_property_id;

  DELETE FROM property_collaborators WHERE property_id = p_property_id;

  -- 1. Archive sub_units (must happen before cascade wipes them)
  INSERT INTO archive_sub_units (
    id, unit_id, name, type, rent_price, area, availability_date,
    photos, amenities, shared_spaces, tenant_id, tenant_name,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    su.id, su.unit_id, su.name, su.type, su.rent_price, su.area, su.availability_date,
    su.photos, su.amenities, su.shared_spaces, su.tenant_id, su.tenant_name,
    su.created_at, su.updated_at, NOW(), p_deleted_by
  FROM sub_units su
  JOIN units u ON su.unit_id = u.id
  WHERE u.property_id = p_property_id;

  -- 2. Archive units
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
  WHERE property_id = p_property_id;

  -- 3. Archive tenants linked to this property
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
  WHERE property_id::TEXT = p_property_id::TEXT;

  -- 4. Archive property
  INSERT INTO archive_properties (
    id, user_id, name, address1, address2, city, state, zip_code, country,
    property_type, landlord_name, rent_complete_property, description, photos,
    parking_included, rent_amount, utilities, status,
    created_at, updated_at, deleted_at, deleted_by
  )
  SELECT
    id, user_id, name, address1, address2, city, state, zip_code, country,
    property_type, landlord_name, rent_complete_property, description, photos,
    parking_included, rent_amount, utilities, status,
    created_at, updated_at, NOW(), p_deleted_by
  FROM properties
  WHERE id = p_property_id;

  -- 5. Delete all tenant_property_links for this property
  DELETE FROM tenant_property_links WHERE property_id::TEXT = p_property_id::TEXT;

  -- 6. Delete tenants (cast both sides to handle UUID or TEXT column)
  DELETE FROM tenants WHERE property_id::TEXT = p_property_id::TEXT;

  -- 7. Delete property → cascades to units + sub_units automatically
  DELETE FROM properties WHERE id = p_property_id;

END;
$$;

-- ============================================================
-- Additive RLS: let a linked, active property manager read/write
-- the same shared data a landlord already can. Existing owner-only
-- policies are untouched (Postgres OR's multiple permissive
-- policies together), so nothing already working can regress.
-- ============================================================

-- properties: manager can update (not delete/insert directly — those
-- always go through create_property_with_link / the unlink RPC above).
DROP POLICY IF EXISTS "Managers can update linked properties" ON public.properties;
CREATE POLICY "Managers can update linked properties"
  ON public.properties FOR UPDATE
  USING (
    id IN (
      SELECT property_id FROM property_collaborators
      WHERE manager_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT property_id FROM property_collaborators
      WHERE manager_id = auth.uid() AND status = 'active'
    )
  );

-- units: manager insert/update/delete for linked properties
DROP POLICY IF EXISTS "Managers can insert units for linked properties" ON public.units;
CREATE POLICY "Managers can insert units for linked properties"
  ON public.units FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE manager_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Managers can update units for linked properties" ON public.units;
CREATE POLICY "Managers can update units for linked properties"
  ON public.units FOR UPDATE
  USING (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE manager_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Managers can delete units for linked properties" ON public.units;
CREATE POLICY "Managers can delete units for linked properties"
  ON public.units FOR DELETE
  USING (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE manager_id = auth.uid() AND status = 'active'
    )
  );

-- sub_units: same, via unit -> property
DROP POLICY IF EXISTS "Managers can insert sub_units for linked properties" ON public.sub_units;
CREATE POLICY "Managers can insert sub_units for linked properties"
  ON public.sub_units FOR INSERT
  WITH CHECK (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN property_collaborators pc ON pc.property_id = u.property_id
      WHERE pc.manager_id = auth.uid() AND pc.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Managers can update sub_units for linked properties" ON public.sub_units;
CREATE POLICY "Managers can update sub_units for linked properties"
  ON public.sub_units FOR UPDATE
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN property_collaborators pc ON pc.property_id = u.property_id
      WHERE pc.manager_id = auth.uid() AND pc.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Managers can delete sub_units for linked properties" ON public.sub_units;
CREATE POLICY "Managers can delete sub_units for linked properties"
  ON public.sub_units FOR DELETE
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN property_collaborators pc ON pc.property_id = u.property_id
      WHERE pc.manager_id = auth.uid() AND pc.status = 'active'
    )
  );

-- transactions: shared read/write for both linked parties (today this
-- table is strictly user_id-owner-only, which would otherwise split
-- accounting data between landlord and manager for the same property).
DROP POLICY IF EXISTS "Collaborators can view property transactions" ON public.transactions;
CREATE POLICY "Collaborators can view property transactions"
  ON public.transactions FOR SELECT
  USING (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE (landlord_id = auth.uid() OR manager_id = auth.uid()) AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Collaborators can insert property transactions" ON public.transactions;
CREATE POLICY "Collaborators can insert property transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE (landlord_id = auth.uid() OR manager_id = auth.uid()) AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Collaborators can update property transactions" ON public.transactions;
CREATE POLICY "Collaborators can update property transactions"
  ON public.transactions FOR UPDATE
  USING (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE (landlord_id = auth.uid() OR manager_id = auth.uid()) AND status = 'active'
    )
  );

-- maintenance_requests: manager (once linked) can see/update requests
-- for that property too, matching the landlord's existing access.
DROP POLICY IF EXISTS "Managers can view linked property maintenance" ON public.maintenance_requests;
CREATE POLICY "Managers can view linked property maintenance"
  ON public.maintenance_requests FOR SELECT
  USING (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE manager_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Managers can update linked property maintenance" ON public.maintenance_requests;
CREATE POLICY "Managers can update linked property maintenance"
  ON public.maintenance_requests FOR UPDATE
  USING (
    property_id IN (
      SELECT property_id FROM property_collaborators
      WHERE manager_id = auth.uid() AND status = 'active'
    )
  );

COMMENT ON TABLE public.property_collaborators
  IS 'Links a landlord and a property manager to the SAME property row (never duplicated). One row per manager per property.';
COMMENT ON TABLE public.archive_property_collaborators
  IS 'Write-once archive of removed/unlinked property_collaborators rows.';
