import { create } from 'zustand';

import {
  createTenant as createTenantInDb,
  DbTenant,
  deleteTenantFromDb,
  fetchTenants,
  updateTenantInDb,
} from '@/lib/supabase';

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyId: string;
  unitId?: string;
  unitName?: string;
  photo?: string;
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  // Payment data
  payments?: {
    rent: { paid: number; total: number; percentage: number };
    maintenance: { paid: number; total: number; percentage: number };
    utility: { paid: number; total: number; percentage: number };
    other: { paid: number; total: number; percentage: number };
  };
}

interface TenantStore {
  tenants: Tenant[];
  isLoading: boolean;
  isSynced: boolean;
  error: string | null;
  
  // Actions
  loadFromSupabase: (userId: string) => Promise<void>;
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'status'>, userId?: string) => Promise<string>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  getTenantById: (id: string) => Tenant | undefined;
  getTenantsByProperty: (propertyId: string) => Tenant[];
}

// Generate unique ID (fallback for local)
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Convert DB tenant to local format
const dbToLocalTenant = (dbTenant: DbTenant): Tenant => ({
  id: dbTenant.id,
  firstName: dbTenant.first_name,
  lastName: dbTenant.last_name,
  email: dbTenant.email,
  phone: dbTenant.phone,
  propertyId: dbTenant.property_id,
  unitId: dbTenant.unit_id,
  unitName: dbTenant.unit_name,
  photo: dbTenant.photo,
  startDate: dbTenant.start_date,
  endDate: dbTenant.end_date,
  rentAmount: dbTenant.rent_amount,
  status: dbTenant.status,
  createdAt: dbTenant.created_at,
  payments: dbTenant.payments,
});

// Convert local tenant to DB format
const localToDbTenant = (tenant: Partial<Tenant>, userId: string): Partial<DbTenant> => ({
  user_id: userId,
  first_name: tenant.firstName || '',
  last_name: tenant.lastName || '',
  email: tenant.email || '',
  phone: tenant.phone || '',
  property_id: tenant.propertyId || '',
  unit_id: tenant.unitId,
  unit_name: tenant.unitName,
  photo: tenant.photo,
  start_date: tenant.startDate,
  end_date: tenant.endDate,
  rent_amount: tenant.rentAmount,
  status: tenant.status || 'active',
  payments: tenant.payments,
});

// Mock initial data (used as fallback)
const INITIAL_TENANTS: Tenant[] = [
  {
    id: '1',
    firstName: 'Eleanor',
    lastName: 'Vance',
    email: 'eleanor.vance@example.com',
    phone: '(555) 123-4567',
    propertyId: '1',
    unitName: 'Unit 12B',
    status: 'active',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBimC0DGZ9eLx_JiDG8qtkl4_7Dx9YxYYCLJAT-di2VJ5Xg7KWygPlq6_JcJUDg_hiUAaGJIuaLAid6zA5NxT9Y-LKbakem7YGEp4YkicGUDquJPbUgaeHfzPck4vZp109rwX_Pgv6t7AfMScu2hEarvhQWV5U4dL9kWXnKlpoUegQIPjTLUC6dR-Fxbxu4Gf2DioBmb6k2BM5wGyyqWL4THX4_ZTMaEiflIlCcTaJjvw03AvQ9-JmlQoaQwThdsP4QQkni4nrt38b1',
    createdAt: new Date().toISOString(),
    payments: {
      rent: { paid: 1500, total: 2000, percentage: 75 },
      maintenance: { paid: 50, total: 50, percentage: 100 },
      utility: { paid: 25, total: 100, percentage: 25 },
      other: { paid: 0, total: 0, percentage: 0 },
    },
  },
  {
    id: '2',
    firstName: 'Marcus',
    lastName: 'Holloway',
    email: 'marcus.holloway@example.com',
    phone: '(555) 234-5678',
    propertyId: '2',
    unitName: 'Apt 3',
    status: 'active',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5tDcABIratjNifjgW0pdkdJ2_vLNBek_0fkXIb9oLefg698eDGKwbXq_6F9mKtoxo8f3KQNwrAUc5jaD6WU-xOQaUfSZKsDLpKjyCpcxXNOv42k-5fOh4ShULx_oGKaYHKV8NxzoHDLRYnINpQR2G4ztCAr-Fhjnk7C7e8cabIdfsTc6uI2-2RydqAnEs_qCSzsBrXyt1eVUa_9OBcqLRSDi5sf-VW-jni_auEiLpSJJq26odJh89ksP0OZQ_A2df0mbUXR6X6wDi',
    createdAt: new Date().toISOString(),
    payments: {
      rent: { paid: 1800, total: 1800, percentage: 100 },
      maintenance: { paid: 75, total: 75, percentage: 100 },
      utility: { paid: 100, total: 100, percentage: 100 },
      other: { paid: 0, total: 0, percentage: 0 },
    },
  },
  {
    id: '3',
    firstName: 'Clara',
    lastName: 'Oswald',
    email: 'clara.oswald@example.com',
    phone: '(555) 345-6789',
    propertyId: '3',
    unitName: 'Unit 5',
    status: 'inactive',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdx3bgQ18SIagIbQFmcJwJOoawA4am_im631qWybxw3tGTiUsrQ-IRxoLue3t1sCyyA6Nc1Irly3pFlJHoeHAcMz_GveFXto8HwjMD264MKyP8MKZcMQRQtnfM0tZ-uq9sMY1g40dLimIMsV1DZn4v37DbqoaZD2b5mz0KjHBQBORoFpy-iWW-dtecsIONatIaDCPOzYqLuHhYUlf8dIMF1_Qm7J-AsZ7jgga8HV0KXrvYmlpG0v1AbiP3xrq4Uh1OdhjPfCtlWbSn',
    createdAt: new Date().toISOString(),
    payments: {
      rent: { paid: 0, total: 0, percentage: 0 },
      maintenance: { paid: 0, total: 0, percentage: 0 },
      utility: { paid: 0, total: 0, percentage: 0 },
      other: { paid: 0, total: 0, percentage: 0 },
    },
  },
];

export const useTenantStore = create<TenantStore>((set, get) => ({
  tenants: INITIAL_TENANTS,
  isLoading: false,
  isSynced: false,
  error: null,
  
  // Load tenants from Supabase
  loadFromSupabase: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const dbTenants = await fetchTenants(userId);
      
      if (dbTenants.length > 0) {
        const tenants = dbTenants.map(dbToLocalTenant);
        set({ tenants, isLoading: false, isSynced: true });
      } else {
        // No tenants in database, keep local data
        set({ isLoading: false, isSynced: true });
      }
    } catch (error) {
      console.error('Error loading tenants from Supabase:', error);
      set({ isLoading: false, error: 'Failed to load tenants' });
    }
  },
  
  addTenant: async (tenantData, userId) => {
    // Try to save to Supabase if userId is provided
    if (userId) {
      try {
        set({ isLoading: true });
        
        const dbTenantData = localToDbTenant({
          ...tenantData,
          payments: tenantData.payments || {
            rent: { paid: 0, total: tenantData.rentAmount || 0, percentage: 0 },
            maintenance: { paid: 0, total: 0, percentage: 0 },
            utility: { paid: 0, total: 0, percentage: 0 },
            other: { paid: 0, total: 0, percentage: 0 },
          },
        }, userId);
        
        const savedTenant = await createTenantInDb(dbTenantData as any);
        
        if (savedTenant) {
          // Refresh list from API
          await get().loadFromSupabase(userId);
          set({ isLoading: false });
          return savedTenant.id;
        }
        
        set({ isLoading: false });
      } catch (error) {
        console.error('Error saving tenant to Supabase:', error);
        set({ isLoading: false });
      }
    }
    
    // Fallback: Add locally
    const id = generateId();
    const newTenant: Tenant = {
      ...tenantData,
      id,
      status: 'active',
      createdAt: new Date().toISOString(),
      payments: tenantData.payments || {
        rent: { paid: 0, total: tenantData.rentAmount || 0, percentage: 0 },
        maintenance: { paid: 0, total: 0, percentage: 0 },
        utility: { paid: 0, total: 0, percentage: 0 },
        other: { paid: 0, total: 0, percentage: 0 },
      },
    };
    set((state) => ({ tenants: [...state.tenants, newTenant] }));
    return id;
  },
  
  updateTenant: async (id, updates) => {
    // Update local state first
    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
    
    // Try to update in Supabase
    try {
      await updateTenantInDb(id, {
        first_name: updates.firstName,
        last_name: updates.lastName,
        email: updates.email,
        phone: updates.phone,
        property_id: updates.propertyId,
        unit_id: updates.unitId,
        unit_name: updates.unitName,
        photo: updates.photo,
        start_date: updates.startDate,
        end_date: updates.endDate,
        rent_amount: updates.rentAmount,
        status: updates.status,
        payments: updates.payments,
      } as any);
    } catch (error) {
      console.error('Error updating tenant in Supabase:', error);
    }
  },
  
  deleteTenant: async (id) => {
    // Update local state first
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
    }));
    
    // Try to delete from Supabase
    try {
      await deleteTenantFromDb(id);
    } catch (error) {
      console.error('Error deleting tenant from Supabase:', error);
    }
  },
  
  getTenantById: (id) => {
    return get().tenants.find((t) => t.id === id);
  },
  
  getTenantsByProperty: (propertyId) => {
    return get().tenants.filter((t) => t.propertyId === propertyId);
  },
}));
