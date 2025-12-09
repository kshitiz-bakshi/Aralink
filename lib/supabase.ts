import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
}

// Create a custom storage adapter that works on all platforms
const createStorageAdapter = () => {
  // For web, use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  }
  
  // For native (iOS/Android), use AsyncStorage
  // Import dynamically to avoid issues on web
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  };
};

// Create Supabase client with platform-specific storage
let supabase: SupabaseClient;

try {
  const storageAdapter = createStorageAdapter();
  
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      // Add error handling for session issues
      flowType: 'pkce',
    },
  });
  
  // Add global error handler for auth errors
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // Session is being managed, no action needed
      return;
    }
  });
  
} catch (error) {
  console.error('Error creating Supabase client:', error);
  // Create a fallback client without storage
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      flowType: 'pkce',
    },
  });
}

export { supabase };

// Database types for the users table
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'landlord' | 'tenant' | 'manager';
  phone?: string;
  avatar_url?: string;
  is_social_login: boolean;
  social_provider?: 'google' | 'apple' | 'facebook' | null;
  created_at: string;
  updated_at: string;
}

// Helper function to get user profile from database
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️ profiles table not found. Please run the SQL schema in Supabase.');
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Helper function to create or update user profile
export async function upsertUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️ profiles table not found. User profile not saved.');
      } else {
        console.error('Error upserting user profile:', error);
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
}

// Helper to get storage for platform
export const getStorage = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage : null;
  }
  return require('@react-native-async-storage/async-storage').default;
};

// Helper function to clear corrupted session
export async function clearCorruptedSession(): Promise<void> {
  try {
    // Sign out to clear any corrupted session
    await supabase.auth.signOut();
    
    // Also clear storage manually
    const storage = getStorage();
    if (storage) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Clear Supabase session keys from localStorage
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            window.localStorage.removeItem(key);
          }
        });
      } else {
        // Clear AsyncStorage keys
        const AsyncStorage = storage;
        const allKeys = await AsyncStorage.getAllKeys();
        const supabaseKeys = allKeys.filter(key => 
          key.includes('supabase') || key.includes('auth')
        );
        if (supabaseKeys.length > 0) {
          await AsyncStorage.multiRemove(supabaseKeys);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing corrupted session:', error);
  }
}
