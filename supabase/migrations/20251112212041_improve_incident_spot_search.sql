-- Migration: Improve incident spot search to check ALL groups
-- This migration updates the find_available_spot_for_incident function to:
-- 1. Search in ALL active groups (not just user-assigned groups)
-- 2. Prioritize: user's assigned groups → general groups → incident reserve groups → ANY available spot
-- 3. Only use reserved spots as absolute last resort

-- ============================================================================
-- Drop existing function
-- ============================================================================

DROP FUNCTION IF EXISTS public.find_available_spot_for_incident(UUID, DATE, UUID);

-- ============================================================================
-- Create improved function with expanded search logic
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
  -- Priority 1: User's assigned general groups (is_incident_reserve = FALSE)
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
  
  -- Priority 2: User's assigned incident reserve groups (is_incident_reserve = TRUE)
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
  
  -- Priority 3: ANY general group (not assigned to user, is_incident_reserve = FALSE)
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
    WHERE ps.is_active = TRUE
      AND pg.is_active = TRUE
      AND pg.is_incident_reserve = FALSE
      AND ps.id != _original_spot_id
      AND NOT EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.spot_id = ps.id
          AND r.reservation_date = _date
          AND r.status = 'active'
      )
      -- Exclude groups already checked in Priority 1
      AND NOT EXISTS (
        SELECT 1 FROM public.user_group_assignments uga
        WHERE uga.user_id = _user_id
          AND uga.group_id = pg.id
      )
    ORDER BY pg.name, ps.spot_number
    LIMIT 1;
  END IF;
  
  -- Priority 4: ANY incident reserve group (not assigned to user, is_incident_reserve = TRUE)
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
    WHERE ps.is_active = TRUE
      AND pg.is_active = TRUE
      AND pg.is_incident_reserve = TRUE
      AND ps.id != _original_spot_id
      AND NOT EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.spot_id = ps.id
          AND r.reservation_date = _date
          AND r.status = 'active'
      )
      -- Exclude groups already checked in Priority 2
      AND NOT EXISTS (
        SELECT 1 FROM public.user_group_assignments uga
        WHERE uga.user_id = _user_id
          AND uga.group_id = pg.id
      )
    ORDER BY pg.name, ps.spot_number
    LIMIT 1;
  END IF;
  
  -- Priority 5 (LAST RESORT): ANY spot with existing reservation
  -- This allows reassigning from reserved spots when absolutely no free spots exist
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
    WHERE ps.is_active = TRUE
      AND pg.is_active = TRUE
      AND ps.id != _original_spot_id
      -- Find spots with reservations (last resort)
      AND EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.spot_id = ps.id
          AND r.reservation_date = _date
          AND r.status = 'active'
          -- Don't take spots from the same user
          AND r.user_id != _user_id
      )
    ORDER BY 
      -- Prefer general groups over incident reserve
      CASE WHEN pg.is_incident_reserve THEN 1 ELSE 0 END,
      pg.name, 
      ps.spot_number
    LIMIT 1;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_available_spot_for_incident(UUID, DATE, UUID) TO authenticated;

-- ============================================================================
-- Update function comment
-- ============================================================================

COMMENT ON FUNCTION public.find_available_spot_for_incident IS 
'Finds an available spot for incident reassignment with expanded search logic:
Priority 1: User assigned general groups (unreserved)
Priority 2: User assigned incident reserve groups (unreserved)
Priority 3: ANY general group not assigned to user (unreserved)
Priority 4: ANY incident reserve group not assigned to user (unreserved)
Priority 5: ANY reserved spot (last resort, excluding same user)';
