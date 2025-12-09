import { create } from 'zustand';

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
  
  // Actions
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'status'>) => string;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  getTenantById: (id: string) => Tenant | undefined;
  getTenantsByProperty: (propertyId: string) => Tenant[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Mock initial data
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
  
  addTenant: (tenantData) => {
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
  
  updateTenant: (id, updates) => {
    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },
  
  deleteTenant: (id) => {
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
    }));
  },
  
  getTenantById: (id) => {
    return get().tenants.find((t) => t.id === id);
  },
  
  getTenantsByProperty: (propertyId) => {
    return get().tenants.filter((t) => t.propertyId === propertyId);
  },
}));

