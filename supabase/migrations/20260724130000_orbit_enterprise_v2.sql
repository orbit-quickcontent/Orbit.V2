-- ============================================================================
-- ORBIT ENTERPRISE PRODUCTION BACKEND MIGRATION (V2 COMPREHENSIVE)
-- Database: Supabase PostgreSQL 15+ with PostGIS, RLS & Triggers
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── 1. POSTGRESQL ENUM DEFINITIONS ───────────────────────────────────────

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('client', 'partner', 'editor', 'admin', 'super_admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE partner_status AS ENUM ('ONLINE', 'OFFLINE', 'BUSY', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('REQUESTED', 'SEARCHING', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS', 'SHOOT_COMPLETED', 'EDITING', 'UNDER_REVIEW', 'DELIVERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('PENDING', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE editor_task_status AS ENUM ('ASSIGNED', 'DOWNLOADING', 'EDITING', 'UPLOADING', 'COMPLETED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('PUSH', 'EMAIL', 'SMS', 'IN_APP', 'REALTIME'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE wallet_transaction_type AS ENUM ('CREDIT', 'DEBIT', 'WITHDRAWAL', 'BONUS', 'PENALTY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE coupon_type AS ENUM ('FLAT', 'PERCENTAGE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE media_type AS ENUM ('RAW_VIDEO', 'EDITED_VIDEO', 'PHOTO', 'LOGO', 'BRAND_ASSET', 'THUMBNAIL'); EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ─── 2. UTILITY & TIMESTAMP FUNCTIONS ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_platform_fee(amount INT, commission_percentage NUMERIC DEFAULT 30.0)
RETURNS INT AS $$
BEGIN
    RETURN ROUND(amount * (commission_percentage / 100.0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_partner_commission(amount INT, commission_percentage NUMERIC DEFAULT 70.0)
RETURNS INT AS $$
BEGIN
    RETURN ROUND(amount * (commission_percentage / 100.0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ─── 3. COMPLETE 28 TABLE SCHEMA DEFINITIONS ────────────────────────────────

-- Table 1: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'client',
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    rating NUMERIC(3,2) DEFAULT 5.00,
    wallet_balance INT DEFAULT 0,
    total_jobs INT DEFAULT 0,
    completed_jobs INT DEFAULT 0,
    cancelled_jobs INT DEFAULT 0,
    status partner_status DEFAULT 'OFFLINE',
    kyc_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Table 2: PACKAGES
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    focus TEXT NOT NULL,
    price INT NOT NULL,
    delivery_time TEXT NOT NULL,
    features JSONB NOT NULL,
    popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Table 3: COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type coupon_type NOT NULL DEFAULT 'FLAT',
    discount_amount INT NOT NULL,
    discount_percentage INT,
    min_order_amount INT DEFAULT 0,
    max_uses INT,
    current_uses INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Table 4: BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number TEXT UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    editor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    package_id TEXT NOT NULL REFERENCES public.packages(id),
    status booking_status NOT NULL DEFAULT 'REQUESTED',
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    payment_method TEXT DEFAULT 'CARD',
    coupon_id UUID REFERENCES public.coupons(id),
    gst INT DEFAULT 0,
    tip INT DEFAULT 0,
    distance NUMERIC(8,2),
    estimated_duration INT,
    location_address TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    partner_payout INT NOT NULL,
    platform_commission INT NOT NULL,
    total_price INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Table 5: BOOKING STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status booking_status NOT NULL,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- Table 6: PARTNER LOCATIONS (POSTGIS GPS TELEMETRY)
CREATE TABLE IF NOT EXISTS public.partner_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    speed NUMERIC(5,2) DEFAULT 0,
    heading NUMERIC(5,2) DEFAULT 0,
    accuracy NUMERIC(5,2) DEFAULT 0,
    battery INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partner_locations ENABLE ROW LEVEL SECURITY;

-- Table 7: BRAND DNA
CREATE TABLE IF NOT EXISTS public.brand_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#00BFFF',
    secondary_color TEXT DEFAULT '#A020F0',
    font_family TEXT DEFAULT 'Inter',
    brand_voice TEXT,
    tone TEXT,
    music_preference TEXT,
    transition_style TEXT,
    caption_style TEXT,
    cta TEXT,
    industry TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.brand_dna ENABLE ROW LEVEL SECURITY;

-- Table 8: PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL DEFAULT 'STRIPE',
    transaction_id TEXT UNIQUE NOT NULL,
    amount INT NOT NULL,
    gst INT DEFAULT 0,
    commission INT DEFAULT 0,
    partner_amount INT NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    refund_status TEXT DEFAULT 'NONE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Table 9: WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance INT DEFAULT 0,
    pending_clearance INT DEFAULT 0,
    total_withdrawn INT DEFAULT 0,
    last_withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Table 10: WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id),
    amount INT NOT NULL,
    type wallet_transaction_type NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Table 11: MEDIA
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    type media_type NOT NULL,
    bucket TEXT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail TEXT,
    size BIGINT NOT NULL,
    duration INT,
    status TEXT NOT NULL DEFAULT 'PROCESSED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Table 12: EDITOR TASKS
CREATE TABLE IF NOT EXISTS public.editor_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    editor_id UUID REFERENCES public.profiles(id),
    status editor_task_status NOT NULL DEFAULT 'ASSIGNED',
    notes TEXT,
    deadline_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.editor_tasks ENABLE ROW LEVEL SECURITY;

-- Table 13: NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'IN_APP',
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Table 14: REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id),
    partner_id UUID NOT NULL REFERENCES public.profiles(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Table 15: SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Table 16: AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Table 17: SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Table 18: DEVICE TOKENS
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fcm_token TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ANDROID', 'IOS', 'WEB')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Table 19: ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Table 20: COUPON USAGE
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    booking_id UUID NOT NULL REFERENCES public.bookings(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Table 21: PARTNER AVAILABILITY
CREATE TABLE IF NOT EXISTS public.partner_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partner_availability ENABLE ROW LEVEL SECURITY;

-- Table 22: PRICING RULES
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    base_fare INT NOT NULL,
    per_km_rate INT NOT NULL,
    surge_multiplier NUMERIC(3,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Table 23: REFERRALS
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id),
    referred_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id),
    code TEXT NOT NULL,
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Table 24: REFERRAL REWARDS
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    amount INT NOT NULL,
    status TEXT DEFAULT 'GRANTED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Table 25: FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Table 26: APP VERSIONS
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    version_code INT NOT NULL,
    min_required_version INT NOT NULL,
    force_update BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Table 27: SESSIONS (AUDIT & SECURITY)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_info TEXT,
    ip_address TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;


-- ─── 4. DATABASE TRIGGERS & PROCEDURES ──────────────────────────────────────

-- Profile creation trigger upon auth.users signup
CREATE OR REPLACE FUNCTION public.create_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, avatar_emoji)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Orbit User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
        COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '👨🏻‍🦱')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_profile();

-- Wallet creation trigger for partner profiles
CREATE OR REPLACE FUNCTION public.create_wallet()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'partner' THEN
        INSERT INTO public.wallets (partner_id, balance)
        VALUES (NEW.id, 0)
        ON CONFLICT (partner_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_partner_profile_created ON public.profiles;
CREATE TRIGGER on_partner_profile_created
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_wallet();

-- Booking number generator trigger
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
        NEW.booking_number := 'ORB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
    END IF;
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_booking_number_trigger ON public.bookings;
CREATE TRIGGER generate_booking_number_trigger
    BEFORE INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.generate_booking_number();

-- Review aggregation trigger
CREATE OR REPLACE FUNCTION public.update_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.reviews
        WHERE partner_id = NEW.partner_id
    )
    WHERE id = NEW.partner_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_average_rating();


-- ─── 5. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Packages select policy" ON public.packages FOR SELECT TO public USING (true);

CREATE POLICY "Bookings select policy" ON public.bookings FOR SELECT TO authenticated USING ((select auth.uid()) = client_id OR (select auth.uid()) = partner_id OR (select auth.uid()) = editor_id);
CREATE POLICY "Bookings insert policy" ON public.bookings FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = client_id);
CREATE POLICY "Bookings update policy" ON public.bookings FOR UPDATE TO authenticated USING ((select auth.uid()) = client_id OR (select auth.uid()) = partner_id OR (select auth.uid()) = editor_id) WITH CHECK ((select auth.uid()) = client_id OR (select auth.uid()) = partner_id OR (select auth.uid()) = editor_id);

CREATE POLICY "Partner locations insert" ON public.partner_locations FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = partner_id);
CREATE POLICY "Partner locations select" ON public.partner_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Wallets select" ON public.wallets FOR SELECT TO authenticated USING ((select auth.uid()) = partner_id);
CREATE POLICY "Notifications select" ON public.notifications FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
