-- =====================================================
-- FUNCIONES DE ESTADÍSTICAS DE CHECK-IN
-- =====================================================
-- Estas funciones proporcionan métricas y análisis de reservas
-- para el dashboard de estadísticas de check-in.
-- =====================================================

-- 1. Tiempo promedio desde desbloqueo hasta reserva
-- =====================================================
-- Eliminar función existente si tiene tipo de retorno diferente
DROP FUNCTION IF EXISTS public.get_avg_reservation_time(TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_avg_reservation_time(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL,
  p_unlock_hour INTEGER DEFAULT 10
)
RETURNS TABLE (avg_minutes NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH reservation_times AS (
    SELECT 
      r.created_at,
      DATE(r.created_at) as reservation_day,
      EXTRACT(EPOCH FROM (
        r.created_at - 
        (DATE(r.created_at) + (p_unlock_hour || ' hours')::INTERVAL)
      )) / 60.0 as minutes_from_unlock
    FROM reservations r
    INNER JOIN parking_spots ps ON r.spot_id = ps.id
    WHERE r.created_at >= p_start_date
      AND r.created_at <= p_end_date
      AND (p_group_id IS NULL OR ps.group_id = p_group_id)
      AND r.created_at >= (DATE(r.created_at) + (p_unlock_hour || ' hours')::INTERVAL)
  )
  SELECT 
    ROUND(AVG(minutes_from_unlock)::NUMERIC, 2) as avg_minutes
  FROM reservation_times
  WHERE minutes_from_unlock >= 0;
END;
$$;

-- 2. Hora pico de reservas
-- =====================================================
-- Eliminar función existente si tiene tipo de retorno diferente
DROP FUNCTION IF EXISTS public.get_peak_hour(TIMESTAMPTZ, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.get_peak_hour(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE (hour INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM r.created_at)::INTEGER as hour
  FROM reservations r
  INNER JOIN parking_spots ps ON r.spot_id = ps.id
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND (p_group_id IS NULL OR ps.group_id = p_group_id)
  GROUP BY EXTRACT(HOUR FROM r.created_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$;

-- 3. Usuario más rápido
-- =====================================================
-- Eliminar función existente si tiene tipo de retorno diferente
DROP FUNCTION IF EXISTS public.get_fastest_user(TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_fastest_user(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL,
  p_unlock_hour INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  fastest_minutes NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_times AS (
    SELECT 
      r.user_id,
      p.full_name,
      EXTRACT(EPOCH FROM (
        r.created_at - 
        (DATE(r.created_at) + (p_unlock_hour || ' hours')::INTERVAL)
      )) / 60.0 as minutes_from_unlock
    FROM reservations r
    INNER JOIN parking_spots ps ON r.spot_id = ps.id
    INNER JOIN profiles p ON r.user_id = p.id
    WHERE r.created_at >= p_start_date
      AND r.created_at <= p_end_date
      AND (p_group_id IS NULL OR ps.group_id = p_group_id)
      AND r.created_at >= (DATE(r.created_at) + (p_unlock_hour || ' hours')::INTERVAL)
  )
  SELECT 
    ut.user_id,
    ut.full_name,
    ROUND(AVG(ut.minutes_from_unlock)::NUMERIC, 2) as fastest_minutes
  FROM user_times ut
  WHERE ut.minutes_from_unlock >= 0
  GROUP BY ut.user_id, ut.full_name
  ORDER BY fastest_minutes ASC
  LIMIT 1;
END;
$$;

-- 4. Actividad por hora del día
-- =====================================================
-- Eliminar función existente si tiene tipo de retorno diferente
DROP FUNCTION IF EXISTS public.get_activity_by_hour(TIMESTAMPTZ, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.get_activity_by_hour(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE (
  hour INTEGER,
  reservations BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM r.created_at)::INTEGER as hour,
    COUNT(*)::BIGINT as reservations
  FROM reservations r
  INNER JOIN parking_spots ps ON r.spot_id = ps.id
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND (p_group_id IS NULL OR ps.group_id = p_group_id)
  GROUP BY EXTRACT(HOUR FROM r.created_at)
  ORDER BY hour;
END;
$$;

-- 5. Datos del heatmap (día de semana x hora)
-- =====================================================
-- Eliminar función existente si tiene tipo de retorno diferente
DROP FUNCTION IF EXISTS public.get_heatmap_data(TIMESTAMPTZ, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.get_heatmap_data(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE (
  day_of_week INTEGER,
  hour INTEGER,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM r.created_at)::INTEGER as day_of_week,
    EXTRACT(HOUR FROM r.created_at)::INTEGER as hour,
    COUNT(*)::BIGINT as count
  FROM reservations r
  INNER JOIN parking_spots ps ON r.spot_id = ps.id
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND (p_group_id IS NULL OR ps.group_id = p_group_id)
  GROUP BY 
    EXTRACT(DOW FROM r.created_at),
    EXTRACT(HOUR FROM r.created_at)
  ORDER BY day_of_week, hour;
END;
$$;

-- 6. Top usuarios con reservas rápidas
-- =====================================================
-- Eliminar función existente si tiene tipo de retorno diferente
DROP FUNCTION IF EXISTS public.get_top_fast_users(TIMESTAMPTZ, TIMESTAMPTZ, UUID, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_top_fast_users(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL,
  p_unlock_hour INTEGER DEFAULT 10,
  p_fast_threshold INTEGER DEFAULT 5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  fast_reservations BIGINT,
  total_reservations BIGINT,
  percentage NUMERIC,
  avg_minutes NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_reservations AS (
    SELECT 
      r.user_id,
      p.full_name,
      p.email,
      EXTRACT(EPOCH FROM (
        r.created_at - 
        (DATE(r.created_at) + (p_unlock_hour || ' hours')::INTERVAL)
      )) / 60.0 as minutes_from_unlock
    FROM reservations r
    INNER JOIN parking_spots ps ON r.spot_id = ps.id
    INNER JOIN profiles p ON r.user_id = p.id
    WHERE r.created_at >= p_start_date
      AND r.created_at <= p_end_date
      AND (p_group_id IS NULL OR ps.group_id = p_group_id)
      AND r.created_at >= (DATE(r.created_at) + (p_unlock_hour || ' hours')::INTERVAL)
  ),
  user_stats AS (
    SELECT 
      ur.user_id,
      ur.full_name,
      ur.email,
      COUNT(*) FILTER (WHERE ur.minutes_from_unlock <= p_fast_threshold) as fast_count,
      COUNT(*) as total_count,
      AVG(ur.minutes_from_unlock) as avg_mins
    FROM user_reservations ur
    WHERE ur.minutes_from_unlock >= 0
    GROUP BY ur.user_id, ur.full_name, ur.email
  )
  SELECT 
    us.user_id,
    us.full_name,
    us.email,
    us.fast_count::BIGINT as fast_reservations,
    us.total_count::BIGINT as total_reservations,
    ROUND((us.fast_count::NUMERIC / us.total_count::NUMERIC * 100), 1) as percentage,
    ROUND(us.avg_mins::NUMERIC, 2) as avg_minutes
  FROM user_stats us
  WHERE us.total_count >= 3 -- Mínimo 3 reservas para aparecer
  ORDER BY percentage DESC, fast_count DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION public.get_avg_reservation_time IS 
  'Calcula el tiempo promedio desde el desbloqueo diario hasta la creación de reservas';

COMMENT ON FUNCTION public.get_peak_hour IS 
  'Obtiene la hora del día con mayor número de reservas';

COMMENT ON FUNCTION public.get_fastest_user IS 
  'Encuentra el usuario con el menor tiempo promedio de reserva';

COMMENT ON FUNCTION public.get_activity_by_hour IS 
  'Obtiene el número de reservas por cada hora del día (0-23)';

COMMENT ON FUNCTION public.get_heatmap_data IS 
  'Genera datos para heatmap: distribución de reservas por día de semana y hora';

COMMENT ON FUNCTION public.get_top_fast_users IS 
  'Lista los usuarios con mayor porcentaje de reservas rápidas';
