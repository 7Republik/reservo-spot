-- Migration: Create incident-photos storage bucket with RLS policies
-- This migration creates the storage bucket for incident photos and configures access policies

-- ============================================================================
-- 1. Create storage bucket for incident photos
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-photos',
  'incident-photos',
  false, -- Not public, requires authentication
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Storage RLS Policies for incident-photos bucket
-- ============================================================================

-- Policy: Authenticated users can upload their own incident photos
CREATE POLICY "Users can upload incident photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own incident photos
CREATE POLICY "Users can view own incident photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can view all incident photos
CREATE POLICY "Admins can view all incident photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos' AND
  public.is_admin(auth.uid())
);

-- Policy: Users can delete their own incident photos (within 24 hours)
CREATE POLICY "Users can delete own recent incident photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'incident-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  created_at > NOW() - INTERVAL '24 hours'
);

-- Policy: Admins can delete any incident photos
CREATE POLICY "Admins can delete incident photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'incident-photos' AND
  public.is_admin(auth.uid())
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration';
