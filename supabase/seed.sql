-- ============================================================================
-- ORBIT ENTERPRISE SEED DATA (PRODUCTION-READY TESTING SEEDS)
-- ============================================================================

-- 1. Packages Seed Data
INSERT INTO public.packages (id, name, focus, price, delivery_time, features, popular)
VALUES 
    ('pkg-personalized', 'Personalized', 'Individual creators, personal events', 1999, '60-90 mins', '["1 cinematic reel (30-60 sec)", "Professional color grading", "Background score licensing", "Same-day delivery (60-90 mins)", "1 revision round"]'::jsonb, false),
    ('pkg-professional', 'Professional (UGC)', 'Brands, businesses, template creators', 4999, '90-120 mins', '["3 cinematic reels (30-60 sec each)", "Brand DNA integration (logo, palette, font)", "Professional color grading & stabilization", "Licensed premium sound scores", "Same-day express delivery (90-120 mins)", "2 revision rounds"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, focus = EXCLUDED.focus, price = EXCLUDED.price, features = EXCLUDED.features;

-- 2. Coupons Seed Data
INSERT INTO public.coupons (id, code, type, discount_amount, discount_percentage, min_order_amount, max_uses, active)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'WELCOME500', 'FLAT', 500, NULL, 1500, 1000, true),
    ('a1000000-0000-0000-0000-000000000002', 'ORBITVIP', 'PERCENTAGE', 0, 20, 2000, 500, true)
ON CONFLICT (code) DO NOTHING;

-- 3. System Settings Seed Data
INSERT INTO public.system_settings (key, value, description)
VALUES
    ('platform_commission_rate', '30'::jsonb, 'Platform commission percentage'),
    ('partner_payout_rate', '70'::jsonb, 'Partner payout percentage'),
    ('max_partner_search_radius_km', '15'::jsonb, 'Maximum radius for partner matching')
ON CONFLICT (key) DO NOTHING;

-- 4. Feature Flags Seed Data
INSERT INTO public.feature_flags (name, enabled, description)
VALUES
    ('ai_editing_assistant', true, 'Enables AI video editing suggestions'),
    ('instant_payouts', true, 'Allows instant partner wallet payouts')
ON CONFLICT (name) DO NOTHING;
