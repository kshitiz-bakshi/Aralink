import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/context/auth-context';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Initialize auth from AsyncStorage or Supabase session
    setLoading(false);
  }, []);

  return { user, loading };
}
