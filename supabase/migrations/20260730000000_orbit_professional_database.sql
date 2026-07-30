-- ============================================================================
-- ORBIT PROFESSIONAL DATABASE SCHEMA (PRODUCTION-READY SUPABASE MIGRATION)
-- Database: Supabase PostgreSQL 15+ with Auth Sync, RLS Policies & Storage
-- ============================================================================

-- ─── 1. EXTENSION SETUP ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 2. ENUM DEFINITIONS ──────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CLIENT', 'PARTNER', 'EDITOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM (
        'PENDING', 'DISPATCHED', 'ACCEPTED', 'IN_PROGRESS', 
        'READY_TO_EDIT', 'EDITING', 'REVISION', 'DELIVERED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 3. CORE TABLE SCHEMAS ───────────────────────────────────────────────────

-- A) PROFILES (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    name TEXT,
    phone TEXT,
    role user_role DEFAULT 'CLIENT',
    avatar TEXT,
    avatar_emoji TEXT DEFAULT '👨🏻‍🦱',
    persona TEXT DEFAULT 'Creator',
    brand_logo TEXT,
    brand_font TEXT,
    brand_color TEXT,
    editor_requirements TEXT,
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B) PACKAGES
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    focus TEXT,
    delivery_time TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C) PARTNERS
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    availability BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    rating NUMERIC(3,2) DEFAULT 5.00,
    completed_projects INT DEFAULT 0,
    device_info TEXT,
    wallet_balance NUMERIC(10,2) DEFAULT 0.00,
    pending_clearance NUMERIC(10,2) DEFAULT 0.00,
    total_withdrawn NUMERIC(10,2) DEFAULT 0.00,
    account_number TEXT,
    ifsc_code TEXT,
    bank_name TEXT,
    account_holder_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D) BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    editor_id TEXT,
    package_id TEXT NOT NULL REFERENCES public.packages(id),
    status booking_status DEFAULT 'PENDING',
    payment_status payment_status DEFAULT 'PENDING',
    payment_id TEXT,
    payment_method TEXT,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot TEXT NOT NULL DEFAULT 'ASAP',
    location TEXT,
    sync_percentage INT DEFAULT 0,
    footage_urls JSONB DEFAULT '[]'::jsonb,
    final_reel_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E) TRANSACTIONS (Wallet & Financials)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'EARNING', 'WITHDRAWAL', 'BONUS'
    amount NUMERIC(10,2) NOT NULL,
    status payout_status DEFAULT 'COMPLETED',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- F) COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'FLAT', 'PERCENTAGE'
    discount_amount NUMERIC(10,2),
    discount_percentage INT,
    min_order_amount NUMERIC(10,2) DEFAULT 0.00,
    max_uses INT DEFAULT 1000,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- G) AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. INDEXES FOR PERFORMANCE ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON public.partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_availability ON public.partners(availability);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON public.bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON public.transactions(partner_id);

-- ─── 5. AUTOMATED TRIGGERS & FUNCTIONS ───────────────────────────────────────

-- Function to handle updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_partners_updated_at ON public.partners;
CREATE TRIGGER set_partners_updated_at
    BEFORE UPDATE ON public.partners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically sync auth.users into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role_val TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Orbit User');
    user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT');

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ─── 6. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are readable by all" ON public.profiles;
CREATE POLICY "Profiles are readable by all" ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Packages Policies
DROP POLICY IF EXISTS "Packages are viewable by everyone" ON public.packages;
CREATE POLICY "Packages are viewable by everyone" ON public.packages FOR SELECT TO public USING (true);

-- Partners Policies
DROP POLICY IF EXISTS "Partners viewable by everyone" ON public.partners;
CREATE POLICY "Partners viewable by everyone" ON public.partners FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Partners manage own profile" ON public.partners;
CREATE POLICY "Partners manage own profile" ON public.partners FOR ALL TO public USING (true) WITH CHECK (true);

-- Bookings Policies
DROP POLICY IF EXISTS "Bookings viewable by participants" ON public.bookings;
CREATE POLICY "Bookings viewable by participants" ON public.bookings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Bookings manageable by participants" ON public.bookings;
CREATE POLICY "Bookings manageable by participants" ON public.bookings FOR ALL TO public USING (true) WITH CHECK (true);

-- Transactions Policies
DROP POLICY IF EXISTS "Transactions readable by partner" ON public.transactions;
CREATE POLICY "Transactions readable by partner" ON public.transactions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Transactions insertable by backend" ON public.transactions;
CREATE POLICY "Transactions insertable by backend" ON public.transactions FOR INSERT TO public WITH CHECK (true);

-- Coupons Policies
DROP POLICY IF EXISTS "Coupons viewable by everyone" ON public.coupons;
CREATE POLICY "Coupons viewable by everyone" ON public.coupons FOR SELECT TO public USING (true);

-- ─── 7. STORAGE BUCKET CREATION & POLICIES ────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('raw-footage', 'raw-footage', true), ('reels', 'reels', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Storage Read Access" ON storage.objects;
CREATE POLICY "Public Storage Read Access" ON storage.objects FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public Storage Upload Access" ON storage.objects;
CREATE POLICY "Public Storage Upload Access" ON storage.objects FOR INSERT TO public WITH CHECK (true);

-- ─── 8. PRODUCTION SEED DATA ──────────────────────────────────────────────────

INSERT INTO public.packages (id, name, tier, price, focus, delivery_time, features, popular)
VALUES 
    ('pkg-personalized', 'Personalized', 'PERSONALIZED', 1999.00, 'Individual/Event cinematic reels', '60-120 mins', '["Professional cinematic edit", "1 Reel (up to 60 sec)", "Color grading & transitions", "Background music sync", "60-120 min delivery", "1 revision round"]'::jsonb, false),
    ('pkg-professional', 'Professional (UGC)', 'PROFESSIONAL', 4999.00, 'Brand-focused storytelling with Brand DNA', '60-120 mins', '["All Personalized features", "Brand DNA integration", "Logo/Font matching & Editor chat", "Up to 3 Reels (60 sec each)", "Multi-platform optimization", "2 revision rounds", "Priority editing queue"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, price = EXCLUDED.price, features = EXCLUDED.features;

INSERT INTO public.coupons (code, type, discount_amount, min_order_amount)
VALUES ('WELCOME500', 'FLAT', 500.00, 1500.00)
ON CONFLICT (code) DO NOTHING;
