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
        const supabaseKeys = allKeys.filter((key: string) => 
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

// =====================================================
// STORAGE (IMAGE UPLOAD) FUNCTIONS
// =====================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI (from ImagePicker)
 * @param bucket - Storage bucket name ('property-images', 'tenant-photos', etc.)
 * @param folder - Folder path within bucket (e.g., 'properties/123')
 * @returns Upload result with public URL or error
 */
export async function uploadImage(
  uri: string, 
  bucket: string, 
  folder: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${timestamp}-${randomId}.${extension}`;

    // For web, we need to fetch the blob
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
          upsert: true,
        });

      if (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { success: true, url: urlData.publicUrl };
    }

    const uriToBase64 = async (uri: string) => {
      const response = await fetch(uri);
      const blob = await response.blob();
    
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]); // remove "data:image/...;base64,"
        };
        reader.readAsDataURL(blob);
      });
    };
    

    // For native (iOS/Android), we need to read the file and convert to base64
    // const base64 = await FileSystem.readAsStringAsync(uri, {
    //   // Use string literal to avoid type issues across platforms
    //   encoding: 'base64',
    // });

    const base64 = await uriToBase64(uri);

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, bytes, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: true,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Upload multiple images in parallel
 * @param uris - Array of local file URIs
 * @param bucket - Storage bucket name
 * @param folder - Folder path within bucket
 * @returns Array of public URLs for successfully uploaded images
 */
export async function uploadMultipleImages(
  uris: string[], 
  bucket: string, 
  folder: string
): Promise<string[]> {
  const uploadPromises = uris.map(uri => uploadImage(uri, bucket, folder));
  const results = await Promise.all(uploadPromises);
  
  // Return only successful uploads
  return results
    .filter(result => result.success && result.url)
    .map(result => result.url!);
}

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image
 * @param bucket - Storage bucket name
 * @returns true if deleted successfully
 */
export async function deleteImage(url: string, bucket: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const urlParts = url.split(`${bucket}/`);
    if (urlParts.length < 2) {
      console.error('Invalid image URL format');
      return false;
    }
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Get all storage buckets (for verification)
 */
export async function listBuckets() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Error listing buckets:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Error listing buckets:', error);
    return [];
  }
}

// Storage bucket constants
export const STORAGE_BUCKETS = {
  PROPERTY_IMAGES: 'property-images',
  TENANT_PHOTOS: 'tenant-photos',
  UNIT_PHOTOS: 'unit-photos',
  DOCUMENTS: 'documents',
} as const;

// =====================================================
// PROPERTY API FUNCTIONS
// =====================================================

// Database types for properties
export interface DbProperty {
  id: string;
  user_id: string;
  name?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  property_type: 'single_unit' | 'multi_unit' | 'commercial' | 'parking';
  landlord_name?: string;
  rent_complete_property?: boolean;
  description?: string;
  photos?: string[];
  parking_included?: boolean;
  rent_amount?: number;
  utilities?: {
    electricity: 'landlord' | 'tenant';
    heatGas: 'landlord' | 'tenant';
    water: 'landlord' | 'tenant';
    wifi: 'landlord' | 'tenant';
    rentalEquipments: 'landlord' | 'tenant';
  };
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DbUnit {
  id: string;
  property_id: string;
  name: string;
  description?: string;
  unit_type?: 'apartment' | 'condo' | 'commercial_suite';
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  rent_entire_unit?: boolean;
  default_rent_price?: number;
  availability_date?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  photos?: string[];
  amenities?: Record<string, boolean>;
  tenant_id?: string;
  is_occupied: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSubUnit {
  id: string;
  unit_id: string;
  name: string;
  type: 'bedroom' | 'bathroom' | 'living_room' | 'kitchen' | 'other';
  rent_price?: number;
  area?: number;
  availability_date?: string;
  photos?: string[];
  amenities?: string[];
  shared_spaces?: string[];
  tenant_id?: string;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
}

// Fetch all properties for the current user
export async function fetchProperties(userId: string): Promise<DbProperty[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️ properties table not found. Using local data.');
        return [];
      }
      console.error('Error fetching properties:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

// Fetch a single property with units and subunits
export async function fetchPropertyById(propertyId: string): Promise<DbProperty | null> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

// Fetch units for a property
export async function fetchUnitsForProperty(propertyId: string): Promise<DbUnit[]> {
  try {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️ units table not found.');
        return [];
      }
      console.error('Error fetching units:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching units:', error);
    return [];
  }
}

// Fetch subunits for a unit
export async function fetchSubUnitsForUnit(unitId: string): Promise<DbSubUnit[]> {
  try {
    const { data, error } = await supabase
      .from('sub_units')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️ sub_units table not found.');
        return [];
      }
      console.error('Error fetching sub units:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching sub units:', error);
    return [];
  }
}

// Create a new property
export async function createProperty(property: Omit<DbProperty, 'id' | 'created_at' | 'updated_at'>): Promise<DbProperty | null> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...property,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating property:', error);
    return null;
  }
}

// Update a property
export async function updatePropertyInDb(propertyId: string, updates: Partial<DbProperty>): Promise<DbProperty | null> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating property:', error);
    return null;
  }
}

// Delete a property
export async function deletePropertyFromDb(propertyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) {
      console.error('Error deleting property:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    return false;
  }
}

// Create a unit
export async function createUnit(unit: Omit<DbUnit, 'id' | 'created_at' | 'updated_at'>): Promise<DbUnit | null> {
  try {
    const { data, error } = await supabase
      .from('units')
      .insert({
        ...unit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating unit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating unit:', error);
    return null;
  }
}

// Update a unit
export async function updateUnitInDb(unitId: string, updates: Partial<DbUnit>): Promise<DbUnit | null> {
  try {
    const { data, error } = await supabase
      .from('units')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId)
      .select()
      .single();

    if (error) {
      console.error('Error updating unit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating unit:', error);
    return null;
  }
}

// Delete a unit
export async function deleteUnitFromDb(unitId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);

    if (error) {
      console.error('Error deleting unit:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting unit:', error);
    return false;
  }
}

// Create a sub-unit (room)
export async function createSubUnit(subUnit: Omit<DbSubUnit, 'id' | 'created_at' | 'updated_at'>): Promise<DbSubUnit | null> {
  try {
    const { data, error } = await supabase
      .from('sub_units')
      .insert({
        ...subUnit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sub unit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating sub unit:', error);
    return null;
  }
}

// Update a sub-unit
export async function updateSubUnitInDb(subUnitId: string, updates: Partial<DbSubUnit>): Promise<DbSubUnit | null> {
  try {
    const { data, error } = await supabase
      .from('sub_units')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subUnitId)
      .select()
      .single();

    if (error) {
      console.error('Error updating sub unit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating sub unit:', error);
    return null;
  }
}

// Delete a sub-unit
export async function deleteSubUnitFromDb(subUnitId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sub_units')
      .delete()
      .eq('id', subUnitId);

    if (error) {
      console.error('Error deleting sub unit:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting sub unit:', error);
    return false;
  }
}

// =====================================================
// TENANT API FUNCTIONS
// =====================================================

export interface DbTenant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  property_id: string;
  unit_id?: string;
  unit_name?: string;
  photo?: string;
  start_date?: string;
  end_date?: string;
  rent_amount?: number;
  status: 'active' | 'inactive';
  payments?: {
    rent: { paid: number; total: number; percentage: number };
    maintenance: { paid: number; total: number; percentage: number };
    utility: { paid: number; total: number; percentage: number };
    other: { paid: number; total: number; percentage: number };
  };
  created_at: string;
  updated_at: string;
}

// Fetch all tenants for the current user
export async function fetchTenants(userId: string): Promise<DbTenant[]> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️ tenants table not found. Using local data.');
        return [];
      }
      console.error('Error fetching tenants:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
}

// Fetch a single tenant by ID
export async function fetchTenantById(tenantId: string): Promise<DbTenant | null> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

// Create a new tenant
export async function createTenant(tenant: Omit<DbTenant, 'id' | 'created_at' | 'updated_at'>): Promise<DbTenant | null> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        ...tenant,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tenant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating tenant:', error);
    return null;
  }
}

// Update a tenant
export async function updateTenantInDb(tenantId: string, updates: Partial<DbTenant>): Promise<DbTenant | null> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating tenant:', error);
    return null;
  }
}

// Delete a tenant
export async function deleteTenantFromDb(tenantId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      console.error('Error deleting tenant:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return false;
  }
}

// =====================================================
// TRANSACTION API FUNCTIONS (for Accounting)
// =====================================================

export interface DbTransaction {
  id: string;
  user_id: string;
  property_id?: string;
  unit_id?: string;
  type: 'income' | 'expense';
  category: 'rent' | 'garage' | 'parking' | 'utility' | 'maintenance' | 'other';
  amount: number;
  date: string;
  description?: string;
  service_type?: string;
  status: 'paid' | 'pending' | 'overdue';
  created_at: string;
  updated_at: string;
}

// Fetch all transactions for the current user
export async function fetchTransactions(userId: string): Promise<DbTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('⚠️ transactions table not found. Using local data.');
        return [];
      }
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Create a new transaction
export async function createTransaction(transaction: Omit<DbTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<DbTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
}

// Update a transaction
export async function updateTransactionInDb(transactionId: string, updates: Partial<DbTransaction>): Promise<DbTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    return null;
  }
}

// Delete a transaction
export async function deleteTransactionFromDb(transactionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
}
