-- ============================================================================
-- SUPABASE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================

-- 1. Insert Buckets into storage.buckets
INSERT INTO storage.buckets (id, name, public) VALUES
    ('avatars', 'avatars', true),
    ('logos', 'logos', true),
    ('brand-assets', 'brand-assets', false),
    ('raw-videos', 'raw-videos', false),
    ('edited-videos', 'edited-videos', false),
    ('thumbnails', 'thumbnails', true),
    ('documents', 'documents', false),
    ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
CREATE POLICY "Public Read for Avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Users Upload Avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated Users Upload Raw Videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'raw-videos');

CREATE POLICY "Participants Download Raw Videos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'raw-videos' OR bucket_id = 'edited-videos');
