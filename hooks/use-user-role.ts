import { useAuthStore, UserRole } from '@/store/authStore';

/**
 * Hook to get the current user's role
 * @returns The user's role ('landlord' | 'tenant' | 'manager') or null if not authenticated
 */
export function useUserRole(): UserRole | null {
  const user = useAuthStore((state) => state.user);
  return user?.role || null;
}

/**
 * Hook to check if the current user has a specific role
 * @param role - The role to check against
 * @returns true if the user has the specified role
 */
export function useHasRole(role: UserRole): boolean {
  const userRole = useUserRole();
  return userRole === role;
}

/**
 * Hook to check if the current user is a landlord
 * @returns true if the user is a landlord
 */
export function useIsLandlord(): boolean {
  return useHasRole('landlord');
}

/**
 * Hook to check if the current user is a tenant
 * @returns true if the user is a tenant
 */
export function useIsTenant(): boolean {
  return useHasRole('tenant');
}

/**
 * Hook to check if the current user is a property manager
 * @returns true if the user is a property manager
 */
export function useIsManager(): boolean {
  return useHasRole('manager');
}

/**
 * Hook to check if the current user can manage properties (landlord or manager)
 * @returns true if the user can manage properties
 */
export function useCanManageProperties(): boolean {
  const role = useUserRole();
  return role === 'landlord' || role === 'manager';
}
