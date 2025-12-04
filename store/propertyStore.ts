import { create } from 'zustand';

// Types for property management
export interface SubUnit {
  id: string;
  name: string;
  type: 'bedroom' | 'bathroom' | 'living_room' | 'kitchen' | 'other';
}

export interface Unit {
  id: string;
  name: string;
  subUnits: SubUnit[];
  tenantId?: string;
  isOccupied: boolean;
}

export interface Property {
  id: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  photo?: string;
  propertyType: 'single_unit' | 'multi_unit';
  units: Unit[];
  status: 'active' | 'inactive';
  createdAt: string;
}

interface PropertyStore {
  properties: Property[];
  selectedPropertyIds: string[];
  
  // Actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'units' | 'status'>) => string;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  getPropertyById: (id: string) => Property | undefined;
  
  // Unit management
  addUnit: (propertyId: string, unit: Omit<Unit, 'id' | 'subUnits' | 'isOccupied'>) => void;
  updateUnit: (propertyId: string, unitId: string, updates: Partial<Unit>) => void;
  deleteUnit: (propertyId: string, unitId: string) => void;
  
  // Sub-unit management
  addSubUnit: (propertyId: string, unitId: string, subUnit: Omit<SubUnit, 'id'>) => void;
  updateSubUnit: (propertyId: string, unitId: string, subUnitId: string, updates: Partial<SubUnit>) => void;
  deleteSubUnit: (propertyId: string, unitId: string, subUnitId: string) => void;
  
  // Filter management
  setSelectedPropertyIds: (ids: string[]) => void;
  togglePropertySelection: (id: string) => void;
  clearPropertySelection: () => void;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Mock initial data
const INITIAL_PROPERTIES: Property[] = [
  {
    id: '1',
    streetAddress: '123 Main Street',
    city: 'Anytown',
    state: 'USA',
    zipCode: '12345',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmzGX6ps0Axputp-bjpvCY5yiPz5AlpQvGCW9Mq1Y20gSzf7tbrLThVBqXvIZY59y-jB8rsojYXreULJte3rUfLozFgtyKM5JyAJ2dngaXPegDuk4bjNK-6JGDtmx3NZm3fDcNrcDccJzotw-W8XLqEmjZqUZA5BIUfFQxZSUB1VZf_5-P1EIOw99C0IDQKmNOGGOSrFo4Dwcx3rEVKef1Tpi6pJiYK6B9KVEjLdQiuIEbLK1LvDU3OmgmYsHUR6OEknEWgHZeRMNs',
    propertyType: 'multi_unit',
    units: [
      { 
        id: 'u1', 
        name: 'Unit A', 
        subUnits: [
          { id: 'su1', name: 'Master Bedroom', type: 'bedroom' },
          { id: 'su2', name: 'Living Room', type: 'living_room' }
        ], 
        isOccupied: true,
        tenantId: 't1'
      },
      { 
        id: 'u2', 
        name: 'Unit B', 
        subUnits: [
          { id: 'su3', name: 'Bedroom', type: 'bedroom' }
        ], 
        isOccupied: true,
        tenantId: 't2'
      },
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    streetAddress: '456 Oak Avenue',
    city: 'Springfield',
    state: 'USA',
    zipCode: '67890',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaQrNC5AVv_VN4gyhuq1ObvDv4lxocsTs0JvkK9DQ-45Zgw9uye_1ivcovcB2Z_rbBQDbNWfDw9mjpQcPeSS1T5CEs9aCySdJnJOA3a2aB4ji3AqqCe5xbS5mGx-QYFxJbn4LLNRtFIgqeSngm63LLSms23UmEDqCwR7To82mubPInHRhEY5C35wy7twj3XoN5VizEx9VFidxL_b1dTNDOaEO2ZeOcU5jD5dvVCsI1pxqH2g20hTAjAyc-6c5N3v-59Gf5C6zuWXvk',
    propertyType: 'single_unit',
    units: [
      { 
        id: 'u3', 
        name: 'Main House', 
        subUnits: [
          { id: 'su4', name: 'Master Bedroom', type: 'bedroom' },
          { id: 'su5', name: 'Guest Bedroom', type: 'bedroom' },
          { id: 'su6', name: 'Living Room', type: 'living_room' },
        ], 
        isOccupied: false 
      },
    ],
    status: 'inactive',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    streetAddress: '789 Pine Lane',
    city: 'Rivertown',
    state: 'USA',
    zipCode: '54321',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArhC6WSeHtE0JWt9WeX4kBHe-izTwmluzQAVor-6Uqy98SVY-7r_Uu2mFg0i8_rox-DznmIBTpOkLHlUzlWmw_lIg05ZDF1u27itGzo4VKDjDMYLFirTGctnpxecIUbOy8sQGicTrdEmX27ybhhA_bz83d7698wxoTX8GHLrwt0d8ujN88PaWufNBeOCK1_Mg-mWuxjD4x776Unz9VKLW4CkQQkuakn5qT1-ON0ztwiNm9C_kLsmNbg-5utcHSKygVdyKkazPFxpmh',
    propertyType: 'multi_unit',
    units: [
      { 
        id: 'u4', 
        name: 'Apartment 1', 
        subUnits: [
          { id: 'su7', name: 'Bedroom', type: 'bedroom' }
        ], 
        isOccupied: true,
        tenantId: 't3'
      },
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: INITIAL_PROPERTIES,
  selectedPropertyIds: [],
  
  addProperty: (propertyData) => {
    const id = generateId();
    const newProperty: Property = {
      ...propertyData,
      id,
      units: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ properties: [...state.properties, newProperty] }));
    return id;
  },
  
  updateProperty: (id, updates) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
  
  deleteProperty: (id) => {
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
      selectedPropertyIds: state.selectedPropertyIds.filter((pid) => pid !== id),
    }));
  },
  
  getPropertyById: (id) => {
    return get().properties.find((p) => p.id === id);
  },
  
  // Unit management
  addUnit: (propertyId, unitData) => {
    const unitId = generateId();
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              units: [
                ...p.units,
                { ...unitData, id: unitId, subUnits: [], isOccupied: false },
              ],
            }
          : p
      ),
    }));
  },
  
  updateUnit: (propertyId, unitId, updates) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              units: p.units.map((u) =>
                u.id === unitId ? { ...u, ...updates } : u
              ),
            }
          : p
      ),
    }));
  },
  
  deleteUnit: (propertyId, unitId) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? { ...p, units: p.units.filter((u) => u.id !== unitId) }
          : p
      ),
    }));
  },
  
  // Sub-unit management
  addSubUnit: (propertyId, unitId, subUnitData) => {
    const subUnitId = generateId();
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              units: p.units.map((u) =>
                u.id === unitId
                  ? { ...u, subUnits: [...u.subUnits, { ...subUnitData, id: subUnitId }] }
                  : u
              ),
            }
          : p
      ),
    }));
  },
  
  updateSubUnit: (propertyId, unitId, subUnitId, updates) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              units: p.units.map((u) =>
                u.id === unitId
                  ? {
                      ...u,
                      subUnits: u.subUnits.map((su) =>
                        su.id === subUnitId ? { ...su, ...updates } : su
                      ),
                    }
                  : u
              ),
            }
          : p
      ),
    }));
  },
  
  deleteSubUnit: (propertyId, unitId, subUnitId) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              units: p.units.map((u) =>
                u.id === unitId
                  ? { ...u, subUnits: u.subUnits.filter((su) => su.id !== subUnitId) }
                  : u
              ),
            }
          : p
      ),
    }));
  },
  
  // Filter management
  setSelectedPropertyIds: (ids) => {
    set({ selectedPropertyIds: ids });
  },
  
  togglePropertySelection: (id) => {
    set((state) => ({
      selectedPropertyIds: state.selectedPropertyIds.includes(id)
        ? state.selectedPropertyIds.filter((pid) => pid !== id)
        : [...state.selectedPropertyIds, id],
    }));
  },
  
  clearPropertySelection: () => {
    set({ selectedPropertyIds: [] });
  },
}));

