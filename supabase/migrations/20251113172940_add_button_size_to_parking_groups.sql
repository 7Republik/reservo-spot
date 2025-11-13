-- Add button_size column to parking_groups table
-- This column stores the size of parking spot buttons in the visual editor (12-64px)

ALTER TABLE parking_groups 
ADD COLUMN IF NOT EXISTS button_size INTEGER DEFAULT 32 
CHECK (button_size >= 12 AND button_size <= 64);

-- Add comment for documentation
COMMENT ON COLUMN parking_groups.button_size IS 'Size of parking spot buttons in visual editor (12-64px, default 32px)';

-- Create index for better performance when querying by button_size
CREATE INDEX IF NOT EXISTS idx_parking_groups_button_size ON parking_groups(button_size);
