-- Migration: Insert Default Reservation Settings
-- Description: Inserta configuración por defecto si no existe
-- Author: System
-- Date: 2025-11-15

-- Insertar configuración por defecto si no existe
INSERT INTO reservation_settings (
  id,
  advance_reservation_days,
  daily_refresh_hour,
  fast_reservation_threshold_minutes
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  7,
  10,
  5
)
ON CONFLICT (id) DO UPDATE SET
  fast_reservation_threshold_minutes = COALESCE(
    reservation_settings.fast_reservation_threshold_minutes,
    5
  );
