-- Fix: Function Search Path Mutable Security Vulnerability
-- Issue: 9 functions without SET search_path = public
-- Severity: WARN (Security)
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================================================
-- TRIGGER FUNCTIONS (6 functions)
-- ============================================================================

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. update_checkin_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_checkin_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. update_group_checkin_config_updated_at
CREATE OR REPLACE FUNCTION public.update_group_checkin_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. update_reservation_checkins_updated_at
CREATE OR REPLACE FUNCTION public.update_reservation_checkins_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. update_waitlist_entries_updated_at
CREATE OR REPLACE FUNCTION public.update_waitlist_entries_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 6. update_waitlist_penalties_updated_at
CREATE OR REPLACE FUNCTION public.update_waitlist_penalties_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- UTILITY FUNCTIONS (3 functions)
-- ============================================================================

-- 7. extract_storage_path_from_url
CREATE OR REPLACE FUNCTION public.extract_storage_path_from_url(url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- If it's already a path (no http), return as is
  IF url IS NULL OR url = '' THEN
    RETURN NULL;
  END IF;
  
  IF NOT url LIKE 'http%' THEN
    RETURN url;
  END IF;
  
  -- Extract path after /incident-photos/
  -- Example: https://xxx.supabase.co/storage/v1/object/public/incident-photos/userId/incidentId.jpg
  -- Should return: userId/incidentId.jpg
  RETURN regexp_replace(url, '^.*/incident-photos/', '');
END;
$$;

-- 8. get_user_warning_count
CREATE OR REPLACE FUNCTION public.get_user_warning_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_warnings
  WHERE user_id = _user_id;
$$;

-- 9. find_available_spot_for_incident
CREATE OR REPLACE FUNCTION public.find_available_spot_for_incident(
  _user_id UUID,
  _date DATE,
  _original_spot_id UUID
)
RETURNS TABLE(
  spot_id UUID,
  spot_number TEXT,
  group_id UUID,
  group_name TEXT,
  position_x NUMERIC,
  position_y NUMERIC,
  floor_plan_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    ps.position_y,
    pg.floor_plan_url
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
      ps.position_y,
      pg.floor_plan_url
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
      ps.position_y,
      pg.floor_plan_url
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
      ps.position_y,
      pg.floor_plan_url
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
      ps.position_y,
      pg.floor_plan_url
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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to update updated_at timestamp. SET search_path = public prevents search_path attacks.';

COMMENT ON FUNCTION public.extract_storage_path_from_url(TEXT) IS 
'Extracts storage path from full Supabase Storage URL. SET search_path = public prevents search_path attacks.';

COMMENT ON FUNCTION public.get_user_warning_count(UUID) IS 
'Returns total warning count for a user. SECURITY DEFINER with SET search_path = public prevents privilege escalation.';

COMMENT ON FUNCTION public.find_available_spot_for_incident(UUID, DATE, UUID) IS 
'Finds available parking spot for incident reassignment with priority logic. SECURITY DEFINER with SET search_path = public prevents privilege escalation.';
