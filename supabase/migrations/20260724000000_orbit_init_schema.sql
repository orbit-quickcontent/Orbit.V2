-- ============================================================================
-- ORBIT UNIFIED DATABASE SCHEMA & RLS POLICIES (SUPABASE POSTGRES)
-- ============================================================================

-- 1. Profiles Table (Clients, Partners, Editors, Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'partner', 'editor', 'admin')),
    avatar_emoji TEXT DEFAULT '👨🏻‍🦱',
    avatar_url TEXT,
    persona TEXT DEFAULT 'Creator',
    creative_style_preset TEXT DEFAULT 'Creator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

-- 2. Packages Table
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    focus TEXT NOT NULL,
    price INT NOT NULL,
    delivery_time TEXT NOT NULL,
    features JSONB NOT NULL,
    popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages are readable by all users"
    ON public.packages FOR SELECT
    TO public
    USING (true);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    editor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    package_id TEXT NOT NULL REFERENCES public.packages(id),
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'EDITING', 'DELIVERED', 'CANCELLED')),
    location_address TEXT NOT NULL,
    location_lat NUMERIC(10, 7),
    location_lng NUMERIC(10, 7),
    total_price INT NOT NULL,
    partner_payout INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = client_id OR (select auth.uid()) = partner_id OR (select auth.uid()) = editor_id);

CREATE POLICY "Clients can insert new bookings"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = client_id);

CREATE POLICY "Partners and Editors can update assigned bookings"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = client_id OR (select auth.uid()) = partner_id OR (select auth.uid()) = editor_id)
    WITH CHECK ((select auth.uid()) = client_id OR (select auth.uid()) = partner_id OR (select auth.uid()) = editor_id);

-- 4. Shoot Tracking Table (Realtime Updates)
CREATE TABLE IF NOT EXISTS public.shoot_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    current_step TEXT NOT NULL DEFAULT 'Partner En Route',
    step_status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    partner_lat NUMERIC(10, 7),
    partner_lng NUMERIC(10, 7),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shoot_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shoot tracking readable by involved parties"
    ON public.shoot_tracking FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = booking_id AND (b.client_id = (select auth.uid()) OR b.partner_id = (select auth.uid()))
        )
    );

-- 5. Seed Initial Packages Data
INSERT INTO public.packages (id, name, focus, price, delivery_time, features, popular)
VALUES 
    ('pkg-personalized', 'Personalized', 'Individual creators, personal events', 1999, '60-90 mins', '["1 cinematic reel (30-60 sec)", "Professional color grading", "Background score licensing", "Same-day delivery (60-90 mins)", "1 revision round"]'::jsonb, false),
    ('pkg-professional', 'Professional (UGC)', 'Brands, businesses, template creators', 4999, '90-120 mins', '["3 cinematic reels (30-60 sec each)", "Brand DNA integration (logo, palette, font)", "Professional color grading & stabilization", "Licensed premium sound scores", "Same-day express delivery (90-120 mins)", "2 revision rounds"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, focus = EXCLUDED.focus, price = EXCLUDED.price, features = EXCLUDED.features;
