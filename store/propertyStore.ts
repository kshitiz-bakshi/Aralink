import { create } from 'zustand';

import {
  createProperty as createPropertyInDb,
  createSubUnit as createSubUnitInDb,
  createUnit as createUnitInDb,
  DbProperty,
  DbSubUnit,
  DbUnit,
  deletePropertyFromDb,
  deleteSubUnitFromDb,
  deleteUnitFromDb,
  fetchProperties,
  fetchSubUnitsForUnit,
  fetchUnitsForProperty,
  updatePropertyInDb,
  updateSubUnitInDb,
  updateUnitInDb,
} from '@/lib/supabase';

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
  isLoading: boolean;
  isSynced: boolean;
  error: string | null;
  
  // Actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'units' | 'status'>, userId?: string) => Promise<string>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  getPropertyById: (id: string) => Property | undefined;
  
  // Unit management
  addUnit: (propertyId: string, unit: Omit<Unit, 'id' | 'subUnits' | 'isOccupied'>) => Promise<void>;
  updateUnit: (propertyId: string, unitId: string, updates: Partial<Unit>) => Promise<void>;
  deleteUnit: (propertyId: string, unitId: string) => Promise<void>;
  
  // Sub-unit management
  addSubUnit: (propertyId: string, unitId: string, subUnit: Omit<SubUnit, 'id'>) => Promise<void>;
  updateSubUnit: (propertyId: string, unitId: string, subUnitId: string, updates: Partial<SubUnit>) => Promise<void>;
  deleteSubUnit: (propertyId: string, unitId: string, subUnitId: string) => Promise<void>;
  
  // For single unit properties - add room directly to the first unit
  addRoomToSingleUnit: (propertyId: string, subUnit: Omit<SubUnit, 'id'>) => Promise<void>;
  
  // Supabase sync
  loadFromSupabase: (userId: string) => Promise<void>;
  syncToSupabase: (userId: string) => Promise<void>;
  
  // Filter management
  setSelectedPropertyIds: (ids: string[]) => void;
  togglePropertySelection: (id: string) => void;
  clearPropertySelection: () => void;
}

// Helper to convert DB property to local property format
const dbToLocalProperty = (dbProperty: DbProperty, units: Unit[] = []): Property => ({
  id: dbProperty.id,
  name: dbProperty.name,
  address1: dbProperty.address1,
  address2: dbProperty.address2,
  city: dbProperty.city,
  state: dbProperty.state,
  zipCode: dbProperty.zip_code,
  country: dbProperty.country,
  propertyType: dbProperty.property_type,
  landlordName: dbProperty.landlord_name,
  rentCompleteProperty: dbProperty.rent_complete_property,
  description: dbProperty.description,
  photos: dbProperty.photos,
  parkingIncluded: dbProperty.parking_included,
  rentAmount: dbProperty.rent_amount,
  utilities: dbProperty.utilities,
  units,
  status: dbProperty.status,
  createdAt: dbProperty.created_at,
});

// Helper to convert local property to DB format
const localToDbProperty = (property: Partial<Property>, userId: string): Partial<DbProperty> => ({
  user_id: userId,
  name: property.name,
  address1: property.address1 || property.streetAddress || '',
  address2: property.address2,
  city: property.city || '',
  state: property.state || '',
  zip_code: property.zipCode || '',
  country: property.country || 'USA',
  property_type: property.propertyType || 'single_unit',
  landlord_name: property.landlordName,
  rent_complete_property: property.rentCompleteProperty,
  description: property.description,
  photos: property.photos,
  parking_included: property.parkingIncluded,
  rent_amount: property.rentAmount,
  utilities: property.utilities,
  status: property.status || 'active',
});

// Helper to convert DB unit to local unit format
const dbToLocalUnit = (dbUnit: DbUnit, subUnits: SubUnit[] = []): Unit => ({
  id: dbUnit.id,
  name: dbUnit.name,
  description: dbUnit.description,
  unitType: dbUnit.unit_type,
  bedrooms: dbUnit.bedrooms,
  bathrooms: dbUnit.bathrooms,
  area: dbUnit.area,
  rentEntireUnit: dbUnit.rent_entire_unit,
  defaultRentPrice: dbUnit.default_rent_price,
  availabilityDate: dbUnit.availability_date,
  leaseStartDate: dbUnit.lease_start_date,
  leaseEndDate: dbUnit.lease_end_date,
  photos: dbUnit.photos,
  amenities: dbUnit.amenities as Unit['amenities'],
  subUnits,
  tenantId: dbUnit.tenant_id,
  isOccupied: dbUnit.is_occupied,
});

// Helper to convert DB sub-unit to local format
const dbToLocalSubUnit = (dbSubUnit: DbSubUnit): SubUnit => ({
  id: dbSubUnit.id,
  name: dbSubUnit.name,
  type: dbSubUnit.type,
  rentPrice: dbSubUnit.rent_price,
  area: dbSubUnit.area,
  availabilityDate: dbSubUnit.availability_date,
  photos: dbSubUnit.photos,
  amenities: dbSubUnit.amenities,
  sharedSpaces: dbSubUnit.shared_spaces,
  tenantId: dbSubUnit.tenant_id,
  tenantName: dbSubUnit.tenant_name,
});

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Helper to check if a string is a valid UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

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
  isLoading: false,
  isSynced: false,
  error: null,
  
  // Load properties from Supabase
  loadFromSupabase: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const dbProperties = await fetchProperties(userId);
      
      if (dbProperties.length > 0) {
        // Load units and sub-units for each property
        const propertiesWithUnits: Property[] = await Promise.all(
          dbProperties.map(async (dbProp) => {
            const dbUnits = await fetchUnitsForProperty(dbProp.id);
            
            const unitsWithSubUnits: Unit[] = await Promise.all(
              dbUnits.map(async (dbUnit) => {
                const dbSubUnits = await fetchSubUnitsForUnit(dbUnit.id);
                const subUnits = dbSubUnits.map(dbToLocalSubUnit);
                return dbToLocalUnit(dbUnit, subUnits);
              })
            );
            
            return dbToLocalProperty(dbProp, unitsWithSubUnits);
          })
        );
        
        set({ properties: propertiesWithUnits, isLoading: false, isSynced: true });
      } else {
        // No properties in database, keep local data but mark as synced
        set({ isLoading: false, isSynced: true });
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      set({ isLoading: false, error: 'Failed to load properties' });
    }
  },
  
  // Sync local properties to Supabase
  syncToSupabase: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const properties = get().properties;
      
      for (const property of properties) {
        const dbPropertyData = localToDbProperty(property, userId);
        await createPropertyInDb(dbPropertyData as any);
      }
      
      set({ isLoading: false, isSynced: true });
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      set({ isLoading: false, error: 'Failed to sync properties' });
    }
  },
  
  addProperty: async (propertyData, userId) => {
    // Try to save to Supabase if userId is provided
    if (userId) {
      try {
        set({ isLoading: true });
        
        const dbPropertyData = localToDbProperty({
          ...propertyData,
          utilities: propertyData.utilities || {
            electricity: 'landlord',
            heatGas: 'landlord',
            water: 'landlord',
            wifi: 'landlord',
            rentalEquipments: 'landlord',
          },
        } as Property, userId);
        
        // Save to Supabase - let it generate UUID
        const savedProperty = await createPropertyInDb(dbPropertyData as any);
        
        if (savedProperty) {
          // Refresh list from API to get the latest data with correct UUIDs
          await get().loadFromSupabase(userId);
          set({ isLoading: false });
          return savedProperty.id;
        }
        
        set({ isLoading: false });
      } catch (error) {
        console.error('Error saving property to Supabase:', error);
        set({ isLoading: false });
      }
    }
    
    // Fallback: Add locally if no userId or Supabase fails
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
  
  updateProperty: async (id, updates) => {
    // Update local state first
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    
    // Try to update in Supabase
    try {
      await updatePropertyInDb(id, {
        name: updates.name,
        address1: updates.address1 || updates.streetAddress,
        address2: updates.address2,
        city: updates.city,
        state: updates.state,
        zip_code: updates.zipCode,
        property_type: updates.propertyType,
        landlord_name: updates.landlordName,
        rent_complete_property: updates.rentCompleteProperty,
        description: updates.description,
        photos: updates.photos,
        parking_included: updates.parkingIncluded,
        rent_amount: updates.rentAmount,
        utilities: updates.utilities,
        status: updates.status,
      } as any);
    } catch (error) {
      console.error('Error updating property in Supabase:', error);
    }
  },
  
  deleteProperty: async (id) => {
    // Update local state first
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
      selectedPropertyIds: state.selectedPropertyIds.filter((pid) => pid !== id),
    }));
    
    // Try to delete from Supabase
    try {
      await deletePropertyFromDb(id);
    } catch (error) {
      console.error('Error deleting property from Supabase:', error);
    }
  },
  
  getPropertyById: (id) => {
    return get().properties.find((p) => p.id === id);
  },
  
  // Unit management
  addUnit: async (propertyId, unitData) => {
    const unitId = generateId();
    
    // Update local state
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
    
    // Try to save to Supabase
    try {
      const savedUnit = await createUnitInDb({
        property_id: propertyId,
        name: unitData.name,
        description: unitData.description,
        unit_type: unitData.unitType,
        bedrooms: unitData.bedrooms,
        bathrooms: unitData.bathrooms,
        area: unitData.area,
        rent_entire_unit: unitData.rentEntireUnit,
        default_rent_price: unitData.defaultRentPrice,
        availability_date: unitData.availabilityDate,
        lease_start_date: unitData.leaseStartDate,
        lease_end_date: unitData.leaseEndDate,
        photos: unitData.photos,
        amenities: unitData.amenities as Record<string, boolean>,
        tenant_id: unitData.tenantId,
        is_occupied: false,
      });
      
      // Update local state with Supabase-generated UUID if saved successfully
      if (savedUnit) {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  units: p.units.map((u) =>
                    u.id === unitId ? { ...u, id: savedUnit.id } : u
                  ),
                }
              : p
          ),
        }));
      }
    } catch (error) {
      console.error('Error saving unit to Supabase:', error);
    }
  },
  
  updateUnit: async (propertyId, unitId, updates) => {
    // Update local state
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
    
    // Try to update in Supabase
    try {
      await updateUnitInDb(unitId, {
        name: updates.name,
        description: updates.description,
        unit_type: updates.unitType,
        bedrooms: updates.bedrooms,
        bathrooms: updates.bathrooms,
        area: updates.area,
        rent_entire_unit: updates.rentEntireUnit,
        default_rent_price: updates.defaultRentPrice,
        availability_date: updates.availabilityDate,
        lease_start_date: updates.leaseStartDate,
        lease_end_date: updates.leaseEndDate,
        photos: updates.photos,
        amenities: updates.amenities as Record<string, boolean>,
        tenant_id: updates.tenantId,
        is_occupied: updates.isOccupied,
      } as any);
    } catch (error) {
      console.error('Error updating unit in Supabase:', error);
    }
  },
  
  deleteUnit: async (propertyId, unitId) => {
    // Update local state
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId
          ? { ...p, units: p.units.filter((u) => u.id !== unitId) }
          : p
      ),
    }));
    
    // Try to delete from Supabase
    try {
      await deleteUnitFromDb(unitId);
    } catch (error) {
      console.error('Error deleting unit from Supabase:', error);
    }
  },
  
  // Sub-unit management
  addSubUnit: async (propertyId, unitId, subUnitData) => {
    const subUnitId = generateId();
    
    // Update local state
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
    
    // Try to save to Supabase only if unitId is a valid UUID
    if (isValidUUID(unitId)) {
      try {
        const savedSubUnit = await createSubUnitInDb({
          unit_id: unitId,
          name: subUnitData.name,
          type: subUnitData.type,
          rent_price: subUnitData.rentPrice,
          area: subUnitData.area,
          availability_date: subUnitData.availabilityDate,
          photos: subUnitData.photos,
          amenities: subUnitData.amenities,
          shared_spaces: subUnitData.sharedSpaces,
          tenant_id: subUnitData.tenantId,
          tenant_name: subUnitData.tenantName,
        });
      
      // Update local state with Supabase-generated UUID if saved successfully
      if (savedSubUnit) {
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
                            su.id === subUnitId ? { ...su, id: savedSubUnit.id } : su
                          ),
                        }
                      : u
                  ),
                }
              : p
          ),
        }));
      }
      } catch (error) {
        console.error('Error saving sub-unit to Supabase:', error);
      }
    } else {
      console.log('Skipping Supabase save: unitId is not a valid UUID (local-only sub-unit)');
    }
  },
  
  updateSubUnit: async (propertyId, unitId, subUnitId, updates) => {
    // Update local state
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
    
    // Try to update in Supabase
    try {
      await updateSubUnitInDb(subUnitId, {
        name: updates.name,
        type: updates.type,
        rent_price: updates.rentPrice,
        area: updates.area,
        availability_date: updates.availabilityDate,
        photos: updates.photos,
        amenities: updates.amenities,
        shared_spaces: updates.sharedSpaces,
        tenant_id: updates.tenantId,
        tenant_name: updates.tenantName,
      } as any);
    } catch (error) {
      console.error('Error updating sub-unit in Supabase:', error);
    }
  },
  
  deleteSubUnit: async (propertyId, unitId, subUnitId) => {
    // Update local state
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
    
    // Try to delete from Supabase
    try {
      await deleteSubUnitFromDb(subUnitId);
    } catch (error) {
      console.error('Error deleting sub-unit from Supabase:', error);
    }
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
  addRoomToSingleUnit: async (propertyId, subUnitData) => {
    const subUnitId = generateId();
    let unitId: string | null = null;
    
    // Update local state
    set((state) => ({
      properties: state.properties.map((p) => {
        if (p.id === propertyId) {
          // If no units exist, create a main unit first
          if (p.units.length === 0) {
            const mainUnitId = generateId();
            unitId = mainUnitId;
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
          unitId = mainUnit.id;
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
    
    // Try to save to Supabase only if unitId is a valid UUID
    if (unitId && isValidUUID(unitId)) {
      try {
        const savedSubUnit = await createSubUnitInDb({
          unit_id: unitId,
          name: subUnitData.name,
          type: subUnitData.type,
          rent_price: subUnitData.rentPrice,
          area: subUnitData.area,
          availability_date: subUnitData.availabilityDate,
          photos: subUnitData.photos,
          amenities: subUnitData.amenities,
          shared_spaces: subUnitData.sharedSpaces,
          tenant_id: subUnitData.tenantId,
          tenant_name: subUnitData.tenantName,
        });
        
        // Update local state with Supabase-generated UUID if saved successfully
        if (savedSubUnit) {
          set((state) => ({
            properties: state.properties.map((p) => {
              if (p.id === propertyId) {
                return {
                  ...p,
                  units: p.units.map((u) =>
                    u.id === unitId
                      ? {
                          ...u,
                          subUnits: u.subUnits.map((su) =>
                            su.id === subUnitId ? { ...su, id: savedSubUnit.id } : su
                          ),
                        }
                      : u
                  ),
                };
              }
              return p;
            }),
          }));
        }
      } catch (error) {
        console.error('Error saving room to Supabase:', error);
        // Note: If unit doesn't exist in Supabase yet, this will fail
        // The local state is still updated, so the UI works
      }
    } else if (unitId) {
      console.log('Skipping Supabase save: unitId is not a valid UUID (local-only room)');
    }
  },
}));

