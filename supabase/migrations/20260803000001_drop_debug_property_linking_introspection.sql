-- Clean up temporary diagnostic functions used while inspecting live
-- schema/RLS/column types before implementing landlord/manager linking.
DROP FUNCTION IF EXISTS public.debug_introspect_property_rls();
DROP FUNCTION IF EXISTS public.debug_introspect_property_rls_part2();
DROP FUNCTION IF EXISTS public.debug_column_types();
