import { create } from 'zustand';

// Types for property management
export interface SubUnit {
  id: string;
  name: string;
  type: 'bedroom' | 'bathroom' | 'living_room' | 'kitchen' | 'other';
  rentPrice?: number;
  area?: number; // in sqft
  availabilityDate?: string;
  photos?: string[];
  amenities?: string[];
  sharedSpaces?: string[];
  tenantId?: string;
  tenantName?: string;
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  unitType?: 'apartment' | 'condo' | 'commercial_suite';
  bedrooms?: number;
  bathrooms?: number;
  area?: number; // in sqft (optional)
  
  // Rent entire unit toggle
  rentEntireUnit?: boolean;
  defaultRentPrice?: number; // Only if rentEntireUnit is true
  
  // Dates
  availabilityDate?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  
  photos?: string[];
  
  // Unit specific amenities
  amenities?: {
    inUnitLaundry?: boolean;
    balcony?: boolean;
    dishwasher?: boolean;
    parkingIncluded?: boolean;
    [key: string]: boolean | undefined;
  };
  
  subUnits: SubUnit[];
  tenantId?: string;
  isOccupied: boolean;
}

export interface Property {
  id: string;
  // Location fields
  location?: string; // Display location name
  address1: string; // Main address with autocomplete
  address2?: string; // Secondary address line
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Property details
  name?: string; // Property name (optional)
  propertyType: 'single_unit' | 'multi_unit' | 'commercial' | 'parking';
  landlordName?: string;
  
  // Rental options (not for multi_unit)
  rentCompleteProperty?: boolean; // Only for single_unit, commercial, parking
  description?: string;
  photos?: string[];
  
  // Parking and rent (not for multi_unit)
  parkingIncluded?: boolean; // Only for single_unit, commercial, parking
  rentAmount?: number; // Only for single_unit, commercial, parking
  
  // Utilities responsibility
  utilities?: {
    electricity: 'landlord' | 'tenant';
    heatGas: 'landlord' | 'tenant';
    water: 'landlord' | 'tenant';
    wifi: 'landlord' | 'tenant';
    rentalEquipments: 'landlord' | 'tenant';
  };
  
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
  
  // For single unit properties - add room directly to the first unit
  addRoomToSingleUnit: (propertyId: string, subUnit: Omit<SubUnit, 'id'>) => void;
  
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
    name: 'The Grand Estate',
    streetAddress: '123 Market Street, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    landlordName: 'Jane Doe',
    photos: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAbiBSHxCO6alOOyK9tMu0KS0E3X2oa1j8SugpNPdhBDCBlieAWLKflr3ottyyresA68ZlZ8sWNTTz0Eu7TfEagOrxWRvOyLHrDnrlGTNWq68l6cnqC6LX_NPywpwJ1_9fj7OeccY1nDdAUZPhkfw3D6WjCLrqmwucL_5KgaE5YBSCipyuxMJZIm9wbj_j_kZAKZyWIeoqhczjEA6eHdIu6Vs2KES2FHHsLPBFuqSVJ08XCKIvJAH2COVQ5-6aNrKnEwSnowV2VvA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD_FgV6yhdSYsBeUftfptBSRFixU6bGJyUCY6x_BQahFEdzt8LJVdN4W4Pl4se1HCWXuNnnbARUqss_9gnhtzmjT2HkVYGHmD9w_zeO4qX8JNJohv_0SLTV4i57TtaUPwsmx9c7VFErsOpb3L8q-N96vYVV0ak2hiukbl3ftKc_dMM63Ia6PCiYeFoKnaFwroYGB8v8LWm9OGdtjx6stJkYaAW0_VizILKWwWOauql2vae1l0SsfI2YdHwojT6jj1a5TUak2ZinAw',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDn8qj_O5cq64kO1z9_hyzdjLP3fwx23V6z-y9_M6P8MuGLFY2dvphJKQ1goaiAYthYtbVGnHOXC-cyaEp6OvxKg64VsCUtwDxTHKuLquRCT-DLnR87bRRejLyj1tkJU4pjh069MnspJOZIVi2MR5PKPhVdhEzljCCip5rVwZGiMKn5XHKFe--etIxdtfb8X1NoxB7MzrcWKvt0Wfwxz_KV-s9LUS2l0G-FTi5fQLfv101NGPrLqbAqEl6ggUb433YuOhUjAEbH82Q',
    ],
    propertyType: 'single_unit',
    propertyCategory: 'apartment',
    units: [
      { 
        id: 'u1', 
        name: 'Main Unit', 
        subUnits: [
          { 
            id: 'su1', 
            name: 'Master Bedroom', 
            type: 'bedroom',
            rentPrice: 1500,
            tenantId: 't1',
            tenantName: 'John Appleseed',
          },
          { 
            id: 'su2', 
            name: 'Guest Room', 
            type: 'bedroom',
            rentPrice: 1200,
          },
        ], 
        isOccupied: true,
        tenantId: 't1'
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
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBaQrNC5AVv_VN4gyhuq1ObvDv4lxocsTs0JvkK9DQ-45Zgw9uye_1ivcovcB2Z_rbBQDbNWfDw9mjpQcPeSS1T5CEs9aCySdJnJOA3a2aB4ji3AqqCe5xbS5mGx-QYFxJbn4LLNRtFIgqeSngm63LLSms23UmEDqCwR7To82mubPInHRhEY5C35wy7twj3XoN5VizEx9VFidxL_b1dTNDOaEO2ZeOcU5jD5dvVCsI1pxqH2g20hTAjAyc-6c5N3v-59Gf5C6zuWXvk'],
    propertyType: 'multi_unit',
    propertyCategory: 'multi_unit_house',
    units: [
      { 
        id: 'u2', 
        name: 'Unit A', 
        subUnits: [
          { id: 'su3', name: 'Master Bedroom', type: 'bedroom' },
          { id: 'su4', name: 'Living Room', type: 'living_room' }
        ], 
        isOccupied: true,
        tenantId: 't2'
      },
      { 
        id: 'u3', 
        name: 'Unit B', 
        subUnits: [
          { id: 'su5', name: 'Bedroom', type: 'bedroom' }
        ], 
        isOccupied: true,
        tenantId: 't3'
      },
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    streetAddress: '789 Pine Lane',
    city: 'Rivertown',
    state: 'USA',
    zipCode: '54321',
    photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuArhC6WSeHtE0JWt9WeX4kBHe-izTwmluzQAVor-6Uqy98SVY-7r_Uu2mFg0i8_rox-DznmIBTpOkLHlUzlWmw_lIg05ZDF1u27itGzo4VKDjDMYLFirTGctnpxecIUbOy8sQGicTrdEmX27ybhhA_bz83d7698wxoTX8GHLrwt0d8ujN88PaWufNBeOCK1_Mg-mWuxjD4x776Unz9VKLW4CkQQkuakn5qT1-ON0ztwiNm9C_kLsmNbg-5utcHSKygVdyKkazPFxpmh'],
    propertyType: 'multi_unit',
    propertyCategory: 'apartment',
    units: [
      { 
        id: 'u4', 
        name: 'Apartment 1', 
        subUnits: [
          { id: 'su6', name: 'Bedroom', type: 'bedroom' }
        ], 
        isOccupied: true,
        tenantId: 't4'
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
      utilities: propertyData.utilities || {
        electricity: 'landlord',
        heatGas: 'landlord',
        water: 'landlord',
        wifi: 'landlord',
        rentalEquipments: 'landlord',
      },
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
  
  // For single unit properties - add room directly
  addRoomToSingleUnit: (propertyId, subUnitData) => {
    const subUnitId = generateId();
    set((state) => ({
      properties: state.properties.map((p) => {
        if (p.id === propertyId) {
          // If no units exist, create a main unit first
          if (p.units.length === 0) {
            const mainUnitId = generateId();
            return {
              ...p,
              units: [
                {
                  id: mainUnitId,
                  name: 'Main Unit',
                  subUnits: [{ ...subUnitData, id: subUnitId }],
                  isOccupied: false,
                },
              ],
            };
          }
          // Add to the first (main) unit
          const mainUnit = p.units[0];
          return {
            ...p,
            units: [
              {
                ...mainUnit,
                subUnits: [...mainUnit.subUnits, { ...subUnitData, id: subUnitId }],
              },
              ...p.units.slice(1),
            ],
          };
        }
        return p;
      }),
    }));
  },
}));

