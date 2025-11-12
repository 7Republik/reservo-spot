-- Migration: Fix incident photo storage paths
-- Description: Converts any existing full URLs in photo_url to storage paths
-- This ensures compatibility with signed URL generation

-- Function to extract storage path from full URL
CREATE OR REPLACE FUNCTION extract_storage_path_from_url(url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If it's already a path (no http), return as is
  IF url IS NULL OR url = '' THEN
    RETURN NULL;
  END IF;
  
  IF NOT url LIKE 'http%' THEN
    RETURN url;
  END IF;
  
  -- Extract path after /incident-photos/
  -- Example: https://xxx.supabase.co/storage/v1/object/public/incident-photos/userId/incidentId.jpg
  -- Should return: userId/incidentId.jpg
  RETURN regexp_replace(url, '^.*/incident-photos/', '');
END;
$$;

-- Update existing records to use storage paths instead of full URLs
UPDATE incident_reports
SET photo_url = extract_storage_path_from_url(photo_url)
WHERE photo_url IS NOT NULL 
  AND photo_url LIKE 'http%';

-- Add comment to column for documentation
COMMENT ON COLUMN incident_reports.photo_url IS 
  'Storage path for incident photo (e.g., "userId/incidentId.jpg"). Use getIncidentPhotoUrl() to generate signed URLs.';

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION extract_storage_path_from_url(TEXT) TO authenticated;
