-- ============================================================================
-- FIX PROFILES AUTH & LOGIN DETAILS SYNC
-- ============================================================================

-- 1. Ensure public.profiles table has both full_name and name columns, plus metadata fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '👨🏻‍🦱';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS persona TEXT DEFAULT 'Creator';

-- Populate full_name from name and vice versa if null
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
UPDATE public.profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;

-- 2. Update trigger function for auth.users AFTER INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role_val TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Orbit User');
    user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

    INSERT INTO public.profiles (id, email, full_name, name, phone, role, avatar_emoji, persona)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_name,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        user_role_val::user_role,
        COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '👨🏻‍🦱'),
        COALESCE(NEW.raw_user_meta_data->>'persona', 'Creator')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Alias create_profile to handle_new_user_signup for enterprise compatibility
CREATE OR REPLACE FUNCTION public.create_profile()
RETURNS TRIGGER AS $$
BEGIN
    RETURN public.handle_new_user_signup();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure RLS policies allow client INSERT, UPDATE, and SELECT for authenticated & anon roles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by all users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by all users"
    ON public.profiles FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);
