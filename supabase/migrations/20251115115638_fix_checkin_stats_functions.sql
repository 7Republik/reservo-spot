-- Migration: Fix Check-in Statistics Functions
-- Description: Corrige nombres de columnas (spot_id en lugar de parking_spot_id, daily_refresh_hour en lugar de unlock_time)
-- Author: System
-- Date: 2025-11-15

-- ============================================
-- DROP FUNCIONES ANTERIORES
-- ============================================
DROP FUNCTION IF EXISTS get_avg_reservation_time;
DROP FUNCTION IF EXISTS get_peak_hour;
DROP FUNCTION IF EXISTS get_fastest_user;
DROP FUNCTION IF EXISTS get_activity_by_hour;
DROP FUNCTION IF EXISTS get_heatmap_data;
DROP FUNCTION IF EXISTS get_top_fast_users;

-- ============================================
-- FUNCIÓN: get_avg_reservation_time
-- Calcula el tiempo promedio de reserva después del desbloqueo
-- ============================================
CREATE OR REPLACE FUNCTION get_avg_reservation_time(
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
  SELECT 
    AVG(
      EXTRACT(EPOCH FROM (
        r.created_at - DATE_TRUNC('day', r.created_at) - 
        (p_unlock_hour || ' hours')::INTERVAL
      )) / 60
    )::NUMERIC as avg_minutes
  FROM reservations r
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND EXTRACT(HOUR FROM r.created_at) >= p_unlock_hour
    AND EXTRACT(HOUR FROM r.created_at) < (p_unlock_hour + 2)
    AND (
      p_group_id IS NULL OR
      r.spot_id IN (
        SELECT id FROM parking_spots WHERE group_id = p_group_id
      )
    );
END;
$$;

-- ============================================
-- FUNCIÓN: get_peak_hour
-- Obtiene la hora con más reservas
-- ============================================
CREATE OR REPLACE FUNCTION get_peak_hour(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE (hour INTEGER, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM r.created_at)::INTEGER as hour,
    COUNT(*)::BIGINT as count
  FROM reservations r
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND (
      p_group_id IS NULL OR
      r.spot_id IN (
        SELECT id FROM parking_spots WHERE group_id = p_group_id
      )
    )
  GROUP BY EXTRACT(HOUR FROM r.created_at)
  ORDER BY count DESC
  LIMIT 1;
END;
$$;

-- ============================================
-- FUNCIÓN: get_fastest_user
-- Obtiene el usuario más rápido en reservar
-- ============================================
CREATE OR REPLACE FUNCTION get_fastest_user(
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
  SELECT 
    r.user_id,
    p.full_name,
    MIN(
      EXTRACT(EPOCH FROM (
        r.created_at - DATE_TRUNC('day', r.created_at) - 
        (p_unlock_hour || ' hours')::INTERVAL
      )) / 60
    )::NUMERIC as fastest_minutes
  FROM reservations r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND EXTRACT(HOUR FROM r.created_at) = p_unlock_hour
    AND (
      p_group_id IS NULL OR
      r.spot_id IN (
        SELECT id FROM parking_spots WHERE group_id = p_group_id
      )
    )
  GROUP BY r.user_id, p.full_name
  ORDER BY fastest_minutes ASC
  LIMIT 1;
END;
$$;

-- ============================================
-- FUNCIÓN: get_activity_by_hour
-- Obtiene el número de reservas por hora del día
-- ============================================
CREATE OR REPLACE FUNCTION get_activity_by_hour(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE (hour INTEGER, reservations BIGINT)
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
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND (
      p_group_id IS NULL OR
      r.spot_id IN (
        SELECT id FROM parking_spots WHERE group_id = p_group_id
      )
    )
  GROUP BY EXTRACT(HOUR FROM r.created_at)
  ORDER BY hour;
END;
$$;

-- ============================================
-- FUNCIÓN: get_heatmap_data
-- Obtiene datos para el heatmap (día x hora)
-- ============================================
CREATE OR REPLACE FUNCTION get_heatmap_data(
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
  WHERE r.created_at >= p_start_date
    AND r.created_at <= p_end_date
    AND (
      p_group_id IS NULL OR
      r.spot_id IN (
        SELECT id FROM parking_spots WHERE group_id = p_group_id
      )
    )
  GROUP BY 
    EXTRACT(DOW FROM r.created_at),
    EXTRACT(HOUR FROM r.created_at)
  ORDER BY day_of_week, hour;
END;
$$;

-- ============================================
-- FUNCIÓN: get_top_fast_users
-- Obtiene el ranking de usuarios más rápidos
-- ============================================
CREATE OR REPLACE FUNCTION get_top_fast_users(
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
  WITH user_stats AS (
    SELECT 
      r.user_id,
      p.full_name,
      p.email,
      COUNT(*)::BIGINT as total_reservations,
      COUNT(*) FILTER (
        WHERE EXTRACT(HOUR FROM r.created_at) = p_unlock_hour
          AND EXTRACT(MINUTE FROM r.created_at) <= p_fast_threshold
      )::BIGINT as fast_reservations,
      AVG(
        EXTRACT(EPOCH FROM (
          r.created_at - DATE_TRUNC('day', r.created_at) - 
          (p_unlock_hour || ' hours')::INTERVAL
        )) / 60
      ) FILTER (
        WHERE EXTRACT(HOUR FROM r.created_at) = p_unlock_hour
      )::NUMERIC as avg_minutes
    FROM reservations r
    JOIN profiles p ON p.id = r.user_id
    WHERE r.created_at >= p_start_date
      AND r.created_at <= p_end_date
      AND (
        p_group_id IS NULL OR
        r.spot_id IN (
          SELECT id FROM parking_spots WHERE group_id = p_group_id
        )
      )
    GROUP BY r.user_id, p.full_name, p.email
    HAVING COUNT(*) > 0
  )
  SELECT 
    us.user_id,
    us.full_name,
    us.email,
    us.fast_reservations,
    us.total_reservations,
    ROUND((us.fast_reservations::NUMERIC / us.total_reservations * 100), 1) as percentage,
    ROUND(us.avg_minutes, 1) as avg_minutes
  FROM user_stats us
  ORDER BY percentage DESC, fast_reservations DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- PERMISOS
-- ============================================
GRANT EXECUTE ON FUNCTION get_avg_reservation_time TO authenticated;
GRANT EXECUTE ON FUNCTION get_peak_hour TO authenticated;
GRANT EXECUTE ON FUNCTION get_fastest_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_by_hour TO authenticated;
GRANT EXECUTE ON FUNCTION get_heatmap_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_fast_users TO authenticated;
