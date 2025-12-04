import { useContext } from 'react';
import { AuthContext } from '@/context/auth-context';

export function useUserRole() {
  const authContext = useContext(AuthContext);
  return authContext.user?.role || null;
}
