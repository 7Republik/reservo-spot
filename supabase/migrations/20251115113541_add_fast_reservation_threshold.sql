-- Migration: Add fast_reservation_threshold_minutes to reservation_settings
-- Description: Añade campo configurable para definir el umbral de tiempo (en minutos)
--              que se considera una "reserva rápida" después del desbloqueo diario.
--              Usado para estadísticas de check-in.
-- Author: System
-- Date: 2025-11-15

-- Añadir columna para umbral de reserva rápida
ALTER TABLE reservation_settings
ADD COLUMN IF NOT EXISTS fast_reservation_threshold_minutes INTEGER DEFAULT 5;

-- Añadir comentario descriptivo
COMMENT ON COLUMN reservation_settings.fast_reservation_threshold_minutes IS 
'Umbral en minutos para considerar una reserva como "rápida" después del desbloqueo diario. Usado en estadísticas de check-in para identificar usuarios que reservan inmediatamente después del desbloqueo. Valor por defecto: 5 minutos.';

-- Añadir constraint para valores razonables (1-60 minutos)
ALTER TABLE reservation_settings
ADD CONSTRAINT fast_reservation_threshold_check 
CHECK (fast_reservation_threshold_minutes >= 1 AND fast_reservation_threshold_minutes <= 60);

-- Actualizar registro existente si existe
UPDATE reservation_settings
SET fast_reservation_threshold_minutes = 5
WHERE fast_reservation_threshold_minutes IS NULL;
