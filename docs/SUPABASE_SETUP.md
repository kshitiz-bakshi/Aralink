# Supabase Setup Guide for Aralink

## ⚠️ IMPORTANT: Run This SQL First!

You're getting the error `Could not find the table 'public.profiles'` because the database tables haven't been created yet.

## Quick Fix: Copy and Run This SQL

Go to your Supabase Dashboard → SQL Editor → New Query → Paste and Run:

```sql
-- ============================================
-- STEP 1: Create the profiles table
-- ============================================
-- This table stores user information:
-- - full_name: User's display name
-- - email: User's email address  
-- - user_type: Role (landlord, tenant, manager)
-- - is_social_login: Whether user signed up with Google/Apple/Facebook
-- - social_provider: Which social provider was used (if any)
--
-- NOTE: Passwords are managed securely by Supabase Auth in auth.users table
-- We DO NOT store passwords in this profiles table

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('landlord', 'tenant', 'manager')),
    phone TEXT,
    avatar_url TEXT,
    is_social_login BOOLEAN DEFAULT FALSE,
    social_provider TEXT CHECK (social_provider IN ('google', 'apple', 'facebook') OR social_provider IS NULL),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- STEP 2: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 3: Auto-create profile on signup
-- ============================================
-- This trigger automatically creates a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        user_type, 
        is_social_login,
        social_provider,
        avatar_url
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'role',
            NEW.raw_user_meta_data->>'user_type',
            'tenant'
        ),
        CASE 
            WHEN NEW.app_metadata->>'provider' IN ('google', 'apple', 'facebook') THEN TRUE
            ELSE FALSE
        END,
        CASE 
            WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
            WHEN NEW.app_metadata->>'provider' = 'apple' THEN 'apple'
            WHEN NEW.app_metadata->>'provider' = 'facebook' THEN 'facebook'
            ELSE NULL
        END,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 4: Create Properties Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    address1 TEXT NOT NULL,
    address2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA',
    property_type TEXT NOT NULL CHECK (property_type IN ('single_unit', 'multi_unit', 'commercial', 'parking')),
    landlord_name TEXT,
    rent_complete_property BOOLEAN DEFAULT FALSE,
    description TEXT,
    photos TEXT[],
    parking_included BOOLEAN DEFAULT FALSE,
    rent_amount DECIMAL(10,2),
    utilities JSONB DEFAULT '{"electricity": "landlord", "heatGas": "landlord", "water": "landlord", "wifi": "landlord", "rentalEquipments": "landlord"}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Enable RLS for properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Property policies
CREATE POLICY "Users can view own properties"
    ON properties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
    ON properties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
    ON properties FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
    ON properties FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Create Units Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    unit_type TEXT CHECK (unit_type IN ('apartment', 'condo', 'commercial_suite') OR unit_type IS NULL),
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(10,2),
    rent_entire_unit BOOLEAN DEFAULT FALSE,
    default_rent_price DECIMAL(10,2),
    availability_date DATE,
    lease_start_date DATE,
    lease_end_date DATE,
    photos TEXT[],
    amenities JSONB DEFAULT '{}'::jsonb,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for units
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON units(tenant_id);

-- Enable RLS for units
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Unit policies (via property ownership)
CREATE POLICY "Users can view units of own properties"
    ON units FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = units.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert units to own properties"
    ON units FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = units.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can update units of own properties"
    ON units FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = units.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete units of own properties"
    ON units FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = units.property_id 
        AND properties.user_id = auth.uid()
    ));

-- ============================================
-- STEP 6: Create Sub-Units (Rooms) Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.sub_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bedroom', 'bathroom', 'living_room', 'kitchen', 'other')),
    rent_price DECIMAL(10,2),
    area DECIMAL(10,2),
    availability_date DATE,
    photos TEXT[],
    amenities TEXT[],
    shared_spaces TEXT[],
    tenant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sub_units
CREATE INDEX IF NOT EXISTS idx_sub_units_unit_id ON sub_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_sub_units_tenant_id ON sub_units(tenant_id);

-- Enable RLS for sub_units
ALTER TABLE sub_units ENABLE ROW LEVEL SECURITY;

-- Sub-unit policies (via property ownership)
CREATE POLICY "Users can view sub_units of own properties"
    ON sub_units FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM units
        JOIN properties ON properties.id = units.property_id
        WHERE units.id = sub_units.unit_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert sub_units to own properties"
    ON sub_units FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM units
        JOIN properties ON properties.id = units.property_id
        WHERE units.id = sub_units.unit_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can update sub_units of own properties"
    ON sub_units FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM units
        JOIN properties ON properties.id = units.property_id
        WHERE units.id = sub_units.unit_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete sub_units of own properties"
    ON sub_units FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM units
        JOIN properties ON properties.id = units.property_id
        WHERE units.id = sub_units.unit_id 
        AND properties.user_id = auth.uid()
    ));

-- ============================================
-- STEP 7: Create Tenants Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    property_id TEXT NOT NULL,
    unit_id TEXT,
    unit_name TEXT,
    photo TEXT,
    start_date DATE,
    end_date DATE,
    rent_amount DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    payments JSONB DEFAULT '{"rent": {"paid": 0, "total": 0, "percentage": 0}, "maintenance": {"paid": 0, "total": 0, "percentage": 0}, "utility": {"paid": 0, "total": 0, "percentage": 0}, "other": {"paid": 0, "total": 0, "percentage": 0}}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Enable RLS for tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenant policies
CREATE POLICY "Users can view own tenants"
    ON tenants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenants"
    ON tenants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenants"
    ON tenants FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenants"
    ON tenants FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- STEP 8: Create Transactions Table (Accounting)
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL CHECK (category IN ('rent', 'garage', 'parking', 'utility', 'maintenance', 'other')),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    service_type TEXT,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON transactions(property_id);

-- Enable RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Transaction policies
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- DONE! Your database is now ready.
-- ============================================
```

## Verify It Worked

After running the SQL:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see a `profiles` table
3. Try signing up again in your app

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | User ID (from Supabase Auth) |
| `email` | TEXT | User's email address |
| `full_name` | TEXT | User's display name |
| `user_type` | TEXT | Role: `landlord`, `tenant`, or `manager` |
| `phone` | TEXT | Optional phone number |
| `avatar_url` | TEXT | Optional profile picture URL |
| `is_social_login` | BOOLEAN | `true` if signed up with Google/Apple/Facebook |
| `social_provider` | TEXT | `google`, `apple`, `facebook`, or `NULL` |
| `created_at` | TIMESTAMP | When account was created |
| `updated_at` | TIMESTAMP | Last profile update |

## About Password Security

**Q: Where is the password stored?**

Passwords are securely managed by Supabase Auth in the `auth.users` table:
- ✅ Passwords are hashed using bcrypt
- ✅ Supabase handles all password security
- ✅ We never see or store plain text passwords
- ✅ Password reset is handled by Supabase

**You should NOT store passwords in the `profiles` table.** Supabase Auth handles this securely.

## Environment Setup

Create a `.env.local` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from:
- Supabase Dashboard → Settings → API

## Authentication Settings

### Disable Email Confirmation (For Testing)

By default, Supabase requires email confirmation. To disable for testing:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle OFF "Confirm email"
3. This allows instant login after signup

### Enable Email Confirmation (For Production)

For production, you should:
1. Keep email confirmation ON
2. Configure SMTP settings for custom emails
3. Set up email templates

## Troubleshooting

### "Could not find table 'public.profiles'"
- ✅ Run the SQL above in Supabase SQL Editor

### "User already registered"
- The email is already in use
- Try logging in instead of signing up

### "Invalid login credentials"
- Check email and password are correct
- If you just signed up, check if email confirmation is required

### Can't login after signup
1. Check if email confirmation is enabled (disable for testing)
2. Verify the password is at least 6 characters
3. Check Supabase Dashboard → Authentication → Users to see if user was created

### Social login not working
1. Configure OAuth providers in Supabase Dashboard
2. Add redirect URLs: `com.aralink.app://oauth-redirect`
3. Use a development build (not Expo Go)

## View Your Users

To see registered users:
1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. Or go to **Table Editor** → **profiles**

---

## 🗂️ Storage Setup (For Image Uploads)

The app supports uploading images for properties, tenants, and units. To enable this feature, you need to create storage buckets in Supabase.

### Step 1: Create Storage Buckets

Go to **Supabase Dashboard** → **Storage** → **New Bucket** and create the following buckets:

| Bucket Name | Public | Description |
|------------|--------|-------------|
| `property-images` | ✅ Yes | Property photos |
| `tenant-photos` | ✅ Yes | Tenant profile photos |
| `unit-photos` | ✅ Yes | Unit/room photos |
| `documents` | ❌ No | Lease documents, receipts (private) |

### Step 2: Configure Bucket Policies

For each **public bucket** (property-images, tenant-photos, unit-photos), run this SQL:

```sql
-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Create buckets (if not using dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('property-images', 'property-images', true),
  ('tenant-photos', 'tenant-photos', true),
  ('unit-photos', 'unit-photos', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view public images
CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id IN ('property-images', 'tenant-photos', 'unit-photos'));

-- Policy: Authenticated users can upload to their folder
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = 'properties'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can upload tenant photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-photos' 
  AND (storage.foldername(name))[1] = 'tenants'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can upload unit photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'unit-photos' 
  AND (storage.foldername(name))[1] = 'units'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can update/delete their own images
CREATE POLICY "Users can update own property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update own tenant photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-photos' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own tenant photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-photos' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Private documents bucket - only owner can access
CREATE POLICY "Users can manage own documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 3: Install expo-file-system (Required for Native)

For image uploads to work on iOS/Android, install expo-file-system:

```bash
npx expo install expo-file-system
```

### Step 4: Test Image Upload

1. Go to Add Property screen
2. Click the camera icon to add photos
3. Select an image from your gallery
4. Submit the form
5. Check **Supabase Dashboard** → **Storage** → **property-images** to see uploaded files

### Troubleshooting Storage Issues

| Issue | Solution |
|-------|----------|
| "Bucket not found" | Create the bucket in Supabase Dashboard → Storage |
| "Permission denied" | Check RLS policies, ensure user is authenticated |
| "File too large" | Default max is 50MB. Adjust in Supabase Dashboard → Storage → Settings |
| Images not loading | Ensure bucket is set to "Public" for public images |

### File Path Structure

Images are organized by user ID for security:
```
property-images/
  └── properties/
      └── {user_id}/
          └── {timestamp}-{random}.jpg

tenant-photos/
  └── tenants/
      └── {user_id}/
          └── {timestamp}-{random}.jpg
```

This ensures users can only access their own uploaded images.
