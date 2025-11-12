-- Fix spot_number unique constraint to be per group instead of global
-- This allows different groups to have spots with the same number (e.g., "PL-1" in Floor -1 and "PL-1" in Floor -2)

-- Drop the existing global unique constraint
ALTER TABLE public.parking_spots 
DROP CONSTRAINT IF EXISTS parking_spots_spot_number_key;

-- Add a composite unique constraint for (spot_number, group_id)
-- This ensures spot_number is unique within each group, but can repeat across groups
ALTER TABLE public.parking_spots 
ADD CONSTRAINT parking_spots_spot_number_group_id_key 
UNIQUE (spot_number, group_id);

-- Add helpful comment
COMMENT ON CONSTRAINT parking_spots_spot_number_group_id_key ON public.parking_spots IS 
'Ensures spot numbers are unique within each parking group, but allows the same number in different groups';
