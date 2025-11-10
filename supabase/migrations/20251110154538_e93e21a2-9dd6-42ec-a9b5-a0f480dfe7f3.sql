-- Fix search_path for has_valid_electric_permit function
CREATE OR REPLACE FUNCTION public.has_valid_electric_permit(plate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    approved_electric = TRUE 
    AND (electric_expires_at IS NULL OR electric_expires_at > NOW())
  FROM public.license_plates
  WHERE id = plate_id;
$$;

-- Fix search_path for has_valid_disability_permit function
CREATE OR REPLACE FUNCTION public.has_valid_disability_permit(plate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    approved_disability = TRUE 
    AND (disability_expires_at IS NULL OR disability_expires_at > NOW())
  FROM public.license_plates
  WHERE id = plate_id;
$$;