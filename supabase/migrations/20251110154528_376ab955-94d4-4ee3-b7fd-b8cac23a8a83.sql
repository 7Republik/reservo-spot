-- Add expiration date columns to license_plates
ALTER TABLE public.license_plates 
ADD COLUMN electric_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN disability_expires_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN license_plates.electric_expires_at IS 'Fecha de expiración del permiso eléctrico (NULL = sin expiración)';
COMMENT ON COLUMN license_plates.disability_expires_at IS 'Fecha de expiración del permiso de minusválido (NULL = sin expiración)';

-- Create function to validate valid electric permits
CREATE OR REPLACE FUNCTION public.has_valid_electric_permit(plate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    approved_electric = TRUE 
    AND (electric_expires_at IS NULL OR electric_expires_at > NOW())
  FROM public.license_plates
  WHERE id = plate_id;
$$;

-- Create function to validate valid disability permits
CREATE OR REPLACE FUNCTION public.has_valid_disability_permit(plate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    approved_disability = TRUE 
    AND (disability_expires_at IS NULL OR disability_expires_at > NOW())
  FROM public.license_plates
  WHERE id = plate_id;
$$;

-- Create indexes for optimization of expiration queries
CREATE INDEX idx_license_plates_electric_expires 
ON license_plates(electric_expires_at) 
WHERE approved_electric = TRUE;

CREATE INDEX idx_license_plates_disability_expires 
ON license_plates(disability_expires_at) 
WHERE approved_disability = TRUE;