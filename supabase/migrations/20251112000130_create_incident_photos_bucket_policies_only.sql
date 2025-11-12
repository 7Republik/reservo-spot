-- Migration: Create RLS policies for incident-photos storage bucket
-- Note: The bucket must be created manually via Supabase Dashboard first

-- ============================================================================
-- Storage RLS Policies for incident-photos bucket
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
