-- Fix: Allow multiple cancellations for the same spot and date
-- Problem: UNIQUE(spot_id, reservation_date, status) prevents multiple 'cancelled' records
-- Solution: Change constraint to only enforce uniqueness for 'active' status

-- Drop the existing unique constraint
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_spot_id_reservation_date_status_key;

-- Create a partial unique index that only applies to 'active' reservations
-- This allows multiple 'cancelled' records but only one 'active' per spot/date
CREATE UNIQUE INDEX reservations_active_spot_date_unique 
ON public.reservations (spot_id, reservation_date) 
WHERE status = 'active';

-- Add comment explaining the constraint
COMMENT ON INDEX reservations_active_spot_date_unique IS 
'Ensures only one active reservation per spot per date. Allows multiple cancelled reservations.';
