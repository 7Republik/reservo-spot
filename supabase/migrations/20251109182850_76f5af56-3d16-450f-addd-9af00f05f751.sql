-- Add rejection_reason column to license_plates table
ALTER TABLE public.license_plates
ADD COLUMN rejection_reason text;