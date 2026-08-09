-- ============================================================
-- Fix: property_collaborators / properties.created_by_user_id
-- wrongly referenced profiles(id), which is NOT guaranteed to
-- exist for every authenticated user (profiles rows are created
-- by the handle_new_user trigger and can lag or, for older
-- accounts, be missing entirely). properties.user_id has always
-- correctly referenced auth.users(id) — match that established
-- pattern everywhere else we reference "a user" in this feature,
-- so property creation/linking works for every authenticated
-- account regardless of profiles-row state.
-- ============================================================

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_created_by_user_id_fkey;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id);

ALTER TABLE public.property_collaborators
  DROP CONSTRAINT IF EXISTS property_collaborators_landlord_id_fkey;
ALTER TABLE public.property_collaborators
  ADD CONSTRAINT property_collaborators_landlord_id_fkey
  FOREIGN KEY (landlord_id) REFERENCES auth.users(id);

ALTER TABLE public.property_collaborators
  DROP CONSTRAINT IF EXISTS property_collaborators_manager_id_fkey;
ALTER TABLE public.property_collaborators
  ADD CONSTRAINT property_collaborators_manager_id_fkey
  FOREIGN KEY (manager_id) REFERENCES auth.users(id);

ALTER TABLE public.property_collaborators
  DROP CONSTRAINT IF EXISTS property_collaborators_created_by_fkey;
ALTER TABLE public.property_collaborators
  ADD CONSTRAINT property_collaborators_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id);
