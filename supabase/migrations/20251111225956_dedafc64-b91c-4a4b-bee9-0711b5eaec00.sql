-- Migration: Add incident reporting features
-- This migration extends the incident_reports table, creates user_warnings table,
-- adds incident reserve flag to parking_groups, and implements spot reassignment logic

-- ============================================================================
-- 1. Extend incident_reports table with new columns
-- ============================================================================

ALTER TABLE public.incident_reports
  ADD COLUMN offending_license_plate TEXT,
  ADD COLUMN offending_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN original_spot_id UUID REFERENCES public.parking_spots(id) ON DELETE SET NULL,
  ADD COLUMN reassigned_spot_id UUID REFERENCES public.parking_spots(id) ON DELETE SET NULL,
  ADD COLUMN reassigned_reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  ADD COLUMN photo_url TEXT,
  ADD COLUMN admin_notes TEXT,
  ADD COLUMN confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint to include 'confirmed' status
ALTER TABLE public.incident_reports
  DROP CONSTRAINT IF EXISTS incident_reports_status_check;

ALTER TABLE public.incident_reports
  ADD CONSTRAINT incident_reports_status_check
  CHECK (status IN ('pending', 'confirmed', 'dismissed', 'resolved'));

-- ============================================================================
-- 2. Create indexes for performance
-- ============================================================================

-- Index for status filtering (admin panel)
CREATE INDEX IF NOT EXISTS idx_incident_reports_status
  ON public.incident_reports(status);

-- Index for license plate lookups
CREATE INDEX IF NOT EXISTS idx_incident_reports_offending_license_plate
  ON public.incident_reports(offending_license_plate)
  WHERE offending_license_plate IS NOT NULL;

-- Index for reporter queries
CREATE INDEX IF NOT EXISTS idx_incident_reports_reporter_id
  ON public.incident_reports(reporter_id);

-- Index for offending user queries
CREATE INDEX IF NOT EXISTS idx_incident_reports_offending_user_id
  ON public.incident_reports(offending_user_id)
  WHERE offending_user_id IS NOT NULL;

-- ============================================================================
-- 3. Create user_warnings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_warnings
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own warnings
CREATE POLICY "Users can view their own warnings"
  ON public.user_warnings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all warnings
CREATE POLICY "Admins can view all warnings"
  ON public.user_warnings FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- RLS Policy: Admins can create warnings
CREATE POLICY "Admins can create warnings"
  ON public.user_warnings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Index for user warning count queries
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id
  ON public.user_warnings(user_id);

-- Index for incident lookups
CREATE INDEX IF NOT EXISTS idx_user_warnings_incident_id
  ON public.user_warnings(incident_id);

-- ============================================================================
-- 4. Add is_incident_reserve column to parking_groups
-- ============================================================================

ALTER TABLE public.parking_groups
  ADD COLUMN IF NOT EXISTS is_incident_reserve BOOLEAN DEFAULT FALSE;

-- Index for incident reserve group queries
CREATE INDEX IF NOT EXISTS idx_parking_groups_incident_reserve
  ON public.parking_groups(is_incident_reserve)
  WHERE is_incident_reserve = TRUE;

-- ============================================================================
-- 5. SQL function for spot reassignment with priority logic
-- ============================================================================

CREATE OR REPLACE FUNCTION public.find_available_spot_for_incident(
  _user_id UUID,
  _date DATE,
  _original_spot_id UUID
)
RETURNS TABLE (
  spot_id UUID,
  spot_number TEXT,
  group_id UUID,
  group_name TEXT,
  position_x NUMERIC,
  position_y NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First try general groups (is_incident_reserve = FALSE)
  RETURN QUERY
  SELECT 
    ps.id,
    ps.spot_number,
    pg.id,
    pg.name,
    ps.position_x,
    ps.position_y
  FROM public.parking_spots ps
  JOIN public.parking_groups pg ON ps.group_id = pg.id
  JOIN public.user_group_assignments uga ON pg.id = uga.group_id
  WHERE uga.user_id = _user_id
    AND ps.is_active = TRUE
    AND pg.is_active = TRUE
    AND pg.is_incident_reserve = FALSE
    AND ps.id != _original_spot_id
    AND NOT EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.spot_id = ps.id
        AND r.reservation_date = _date
        AND r.status = 'active'
    )
  ORDER BY pg.name, ps.spot_number
  LIMIT 1;
  
  -- If no result found, try incident reserve groups (is_incident_reserve = TRUE)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      ps.id,
      ps.spot_number,
      pg.id,
      pg.name,
      ps.position_x,
      ps.position_y
    FROM public.parking_spots ps
    JOIN public.parking_groups pg ON ps.group_id = pg.id
    JOIN public.user_group_assignments uga ON pg.id = uga.group_id
    WHERE uga.user_id = _user_id
      AND ps.is_active = TRUE
      AND pg.is_active = TRUE
      AND pg.is_incident_reserve = TRUE
      AND ps.id != _original_spot_id
      AND NOT EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.spot_id = ps.id
          AND r.reservation_date = _date
          AND r.status = 'active'
      )
    ORDER BY pg.name, ps.spot_number
    LIMIT 1;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_available_spot_for_incident(UUID, DATE, UUID) TO authenticated;

-- ============================================================================
-- 6. Helper function to get user warning count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_warning_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_warnings
  WHERE user_id = _user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_warning_count(UUID) TO authenticated;

-- ============================================================================
-- 7. Update RLS policies for incident_reports (if needed)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own incident reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Users can create incident reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins can view all incident reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins can update incident reports" ON public.incident_reports;

-- Policy: Users can view their own incident reports
CREATE POLICY "Users can view their own incident reports"
  ON public.incident_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR auth.uid() = offending_user_id);

-- Policy: Users can create incident reports for their own reservations
CREATE POLICY "Users can create incident reports"
  ON public.incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id AND
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND r.user_id = auth.uid()
        AND r.status = 'active'
    )
  );

-- Policy: Admins can view all incident reports
CREATE POLICY "Admins can view all incident reports"
  ON public.incident_reports FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Policy: Admins can update incident reports
CREATE POLICY "Admins can update incident reports"
  ON public.incident_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.incident_reports.offending_license_plate IS 'License plate of the vehicle occupying the reserved spot';
COMMENT ON COLUMN public.incident_reports.offending_user_id IS 'User ID of the offender (if identified by license plate match)';
COMMENT ON COLUMN public.incident_reports.original_spot_id IS 'The spot that was originally reserved and found occupied';
COMMENT ON COLUMN public.incident_reports.reassigned_spot_id IS 'The spot automatically assigned to the affected user';
COMMENT ON COLUMN public.incident_reports.reassigned_reservation_id IS 'The new reservation created for the reassigned spot';
COMMENT ON COLUMN public.incident_reports.photo_url IS 'URL to the photo evidence stored in Supabase Storage';
COMMENT ON COLUMN public.incident_reports.admin_notes IS 'Notes added by administrators during review';
COMMENT ON COLUMN public.incident_reports.confirmed_by IS 'Admin user who confirmed the incident';
COMMENT ON COLUMN public.incident_reports.confirmed_at IS 'Timestamp when the incident was confirmed';

COMMENT ON TABLE public.user_warnings IS 'Tracks warnings issued to users for parking violations';
COMMENT ON COLUMN public.parking_groups.is_incident_reserve IS 'Indicates if this group is reserved for incident reassignments (last resort)';

COMMENT ON FUNCTION public.find_available_spot_for_incident IS 'Finds an available spot for incident reassignment following priority order: general groups first, then incident reserve groups';
COMMENT ON FUNCTION public.get_user_warning_count IS 'Returns the total number of warnings issued to a user';