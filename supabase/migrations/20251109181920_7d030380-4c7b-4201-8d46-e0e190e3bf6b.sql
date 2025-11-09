-- Add rejected_at column to license_plates table to track rejected plates
ALTER TABLE public.license_plates 
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone DEFAULT NULL;

-- Update the admin panel query to show only pending (not approved and not rejected)
-- This is handled in application code, but we add a helpful comment