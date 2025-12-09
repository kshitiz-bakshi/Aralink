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
