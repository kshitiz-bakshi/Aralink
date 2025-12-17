# Supabase Migration Guide

## Overview
This guide will help you migrate from local Zustand state to Supabase backend without major code changes.

## Database Schema

### Properties Table
```sql
create table properties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  
  -- Location
  location text,
  address1 text not null,
  address2 text,
  city text not null,
  state text not null,
  zip_code text not null,
  country text not null default 'United States',
  
  -- Property Details
  name text,
  property_type text not null check (property_type in ('single_unit', 'multi_unit', 'commercial', 'parking')),
  landlord_name text,
  
  -- Rental Options (nullable for multi_unit)
  rent_complete_property boolean,
  description text,
  photos text[], -- Array of photo URLs
  
  -- Parking and Rent (nullable for multi_unit)
  parking_included boolean,
  rent_amount numeric(10, 2),
  
  -- Utilities (JSONB)
  utilities jsonb default '{
    "electricity": "landlord",
    "heatGas": "landlord",
    "water": "landlord",
    "wifi": "landlord",
    "rentalEquipments": "landlord"
  }'::jsonb,
  
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table properties enable row level security;

-- RLS Policies
create policy "Users can view their own properties"
  on properties for select
  using (auth.uid() = user_id);

create policy "Users can insert their own properties"
  on properties for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own properties"
  on properties for update
  using (auth.uid() = user_id);

create policy "Users can delete their own properties"
  on properties for delete
  using (auth.uid() = user_id);
```

### Units Table
```sql
create table units (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references properties(id) on delete cascade not null,
  
  name text not null,
  description text,
  unit_type text,
  bedrooms integer,
  bathrooms numeric(3, 1),
  area numeric(10, 2),
  
  -- Rent Toggle
  rent_entire_unit boolean default false,
  default_rent_price numeric(10, 2),
  
  -- Dates
  availability_date date,
  lease_start_date date,
  lease_end_date date,
  
  photos text[],
  
  -- Amenities (JSONB)
  amenities jsonb default '{}'::jsonb,
  
  tenant_id uuid references auth.users,
  is_occupied boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table units enable row level security;

-- RLS Policies
create policy "Users can view units of their properties"
  on units for select
  using (
    exists (
      select 1 from properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );

create policy "Users can insert units to their properties"
  on units for insert
  with check (
    exists (
      select 1 from properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );

create policy "Users can update units of their properties"
  on units for update
  using (
    exists (
      select 1 from properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );

create policy "Users can delete units of their properties"
  on units for delete
  using (
    exists (
      select 1 from properties
      where properties.id = units.property_id
      and properties.user_id = auth.uid()
    )
  );
```

### SubUnits Table (Rooms)
```sql
create table sub_units (
  id uuid default uuid_generate_v4() primary key,
  unit_id uuid references units(id) on delete cascade not null,
  
  name text not null,
  type text not null check (type in ('bedroom', 'bathroom', 'living_room', 'kitchen', 'other')),
  rent_price numeric(10, 2),
  area numeric(10, 2),
  
  availability_date date,
  photos text[],
  amenities text[],
  shared_spaces text[],
  
  tenant_id uuid references auth.users,
  tenant_name text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table sub_units enable row level security;

-- RLS Policies
create policy "Users can view sub_units of their properties"
  on sub_units for select
  using (
    exists (
      select 1 from units
      join properties on properties.id = units.property_id
      where units.id = sub_units.unit_id
      and properties.user_id = auth.uid()
    )
  );

create policy "Users can insert sub_units to their properties"
  on sub_units for insert
  with check (
    exists (
      select 1 from units
      join properties on properties.id = units.property_id
      where units.id = sub_units.unit_id
      and properties.user_id = auth.uid()
    )
  );

create policy "Users can update sub_units of their properties"
  on sub_units for update
  using (
    exists (
      select 1 from units
      join properties on properties.id = units.property_id
      where units.id = sub_units.unit_id
      and properties.user_id = auth.uid()
    )
  );

create policy "Users can delete sub_units of their properties"
  on sub_units for delete
  using (
    exists (
      select 1 from units
      join properties on properties.id = units.property_id
      where units.id = sub_units.unit_id
      and properties.user_id = auth.uid()
    )
  );
```

### Tenants Table
```sql
create table tenants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  
  property_id uuid references properties(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  unit_name text,
  
  photo text,
  
  start_date date,
  end_date date,
  rent_amount numeric(10, 2),
  
  status text not null default 'active' check (status in ('active', 'inactive')),
  
  -- Payment tracking (JSONB)
  payments jsonb default '{
    "rent": {"paid": 0, "total": 0, "percentage": 0},
    "maintenance": {"paid": 0, "total": 0, "percentage": 0},
    "utility": {"paid": 0, "total": 0, "percentage": 0},
    "other": {"paid": 0, "total": 0, "percentage": 0}
  }'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table tenants enable row level security;

-- RLS Policies
create policy "Users can view their own tenants"
  on tenants for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tenants"
  on tenants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tenants"
  on tenants for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tenants"
  on tenants for delete
  using (auth.uid() = user_id);
```

## Migration Steps

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client
Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Update Environment Variables
Add to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Update Property Store
Replace Zustand store actions with Supabase calls:

```typescript
// Example: addProperty
addProperty: async (propertyData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('properties')
    .insert([{
      ...propertyData,
      user_id: user?.id,
    }])
    .select()
    .single();
    
  if (error) throw error;
  
  set((state) => ({
    properties: [...state.properties, data]
  }));
  
  return data.id;
},
```

### 5. Update Tenant Store
Similar pattern for tenant operations.

### 6. Real-time Subscriptions (Optional)
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('properties')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'properties' },
      (payload) => {
        // Update local state
      }
    )
    .subscribe();
    
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Key Points

1. **Current store structure is compatible** - No major refactor needed
2. **Add user_id** to all operations when migrating
3. **Use RLS** for security
4. **JSONB fields** for complex objects (utilities, amenities, payments)
5. **Cascading deletes** automatically handle related records
6. **Room = SubUnit** in database terminology

## Testing Checklist

- [ ] Create property
- [ ] Update property
- [ ] Delete property
- [ ] Add unit to property
- [ ] Add room (sub_unit) to unit
- [ ] Create tenant
- [ ] Update tenant payments
- [ ] Test RLS policies
- [ ] Test image upload to Supabase Storage
- [ ] Test real-time subscriptions

## Notes

- The current Zustand store structure maps directly to Supabase tables
- When you're ready to migrate, replace store actions one by one
- Keep Zustand for local state, use Supabase for persistence
- All UUID fields will be auto-generated by Supabase

