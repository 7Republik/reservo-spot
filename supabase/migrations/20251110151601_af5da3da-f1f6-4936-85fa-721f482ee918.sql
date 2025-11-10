-- Add special permit fields to license_plates table
ALTER TABLE public.license_plates 
ADD COLUMN requested_electric BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_electric BOOLEAN DEFAULT FALSE,
ADD COLUMN requested_disability BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_disability BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN license_plates.requested_electric IS 'Usuario solicita que se le reconozca como vehículo eléctrico';
COMMENT ON COLUMN license_plates.approved_electric IS 'Admin concede permiso para usar plazas con cargador eléctrico';
COMMENT ON COLUMN license_plates.requested_disability IS 'Usuario solicita que se le reconozca permiso de minusválido';
COMMENT ON COLUMN license_plates.approved_disability IS 'Admin concede permiso para usar plazas de minusválidos';