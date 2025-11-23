import { User } from '@/types';
import { createContext } from 'react';

export interface OAuthResult {
  success: boolean;
  user?: {
    id: string;
    email?: string;
    name?: string;
    picture?: string;
    provider: 'google' | 'apple' | 'facebook';
  };
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  socialLoginInProgress?: boolean;
  selectedUserType?: 'landlord' | 'tenant' | 'manager' | null;
  setSocialLoginInProgress?: (value: boolean) => void;
  setSelectedUserType?: (type: 'landlord' | 'tenant' | 'manager' | null) => void;
  loginWithGoogle?: () => Promise<OAuthResult>;
  loginWithApple?: () => Promise<OAuthResult>;
  loginWithFacebook?: () => Promise<OAuthResult>;
  registerWithGoogle?: (userType: 'landlord' | 'tenant' | 'manager') => Promise<OAuthResult>;
  registerWithApple?: (userType: 'landlord' | 'tenant' | 'manager') => Promise<OAuthResult>;
  registerWithFacebook?: (userType: 'landlord' | 'tenant' | 'manager') => Promise<OAuthResult>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  socialLoginInProgress: false,
  selectedUserType: null,
});
