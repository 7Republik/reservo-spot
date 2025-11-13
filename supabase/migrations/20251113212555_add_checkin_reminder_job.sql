-- =====================================================
-- RESERVEO - Sistema de Check-in/Check-out
-- Migración: Job de Recordatorios de Check-in
-- Fecha: 2025-11-13
-- =====================================================
-- Este job se ejecuta cada 30 minutos durante el día
-- para enviar recordatorios a usuarios con reservas
-- activas sin check-in.
-- Requirements: 15.1, 15.2, 15.3
-- =====================================================

-- =====================================================
-- Función: send_checkin_reminders()
-- =====================================================
-- Busca usuarios con reservas activas sin check-in y
-- prepara notificaciones de recordatorio.
-- 
-- NOTA: Esta función actualmente registra en logs los
-- recordatorios que se enviarían. Cuando se implemente
-- un sistema de notificaciones (email, push, SMS), esta
-- función debe ser extendida para enviar notificaciones
-- reales a través de ese sistema.
-- =====================================================

-- Eliminar función existente si existe (para permitir cambio de firma)
DROP FUNCTION IF EXISTS public.send_checkin_reminders();

CREATE OR REPLACE FUNCTION public.send_checkin_reminders()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  spot_number TEXT,
  group_name TEXT,
  reservation_date DATE,
  window_end TIMESTAMPTZ,
  grace_end TIMESTAMPTZ,
  minutes_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_reminders_sent INTEGER := 0;
BEGIN
  -- Obtener configuración global
  SELECT * INTO v_settings 
  FROM public.checkin_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Si el sistema está desactivado o los recordatorios están desactivados, no hacer nada
  IF NOT v_settings.system_enabled OR NOT v_settings.send_checkin_reminders THEN
    RETURN;
  END IF;
  
  -- Buscar usuarios con reservas activas sin check-in
  RETURN QUERY
  SELECT 
    r.user_id,
    au.email as user_email,
    p.full_name as user_name,
    ps.spot_number,
    pg.name as group_name,
    r.reservation_date,
    
    -- Calcular ventana de check-in
    (r.reservation_date::TIMESTAMPTZ + 
      INTERVAL '1 hour' * COALESCE(
        CASE WHEN pgcc.use_custom_config THEN pgcc.custom_checkin_window_hours ELSE NULL END,
        v_settings.default_checkin_window_hours
      )) as window_end,
    
    -- Calcular fin del periodo de gracia
    (r.reservation_date::TIMESTAMPTZ + 
      INTERVAL '1 hour' * COALESCE(
        CASE WHEN pgcc.use_custom_config THEN pgcc.custom_checkin_window_hours ELSE NULL END,
        v_settings.default_checkin_window_hours
      ) + 
      INTERVAL '1 minute' * v_settings.grace_period_minutes) as grace_end,
    
    -- Calcular minutos restantes hasta el fin del periodo de gracia
    EXTRACT(EPOCH FROM (
      (r.reservation_date::TIMESTAMPTZ + 
        INTERVAL '1 hour' * COALESCE(
          CASE WHEN pgcc.use_custom_config THEN pgcc.custom_checkin_window_hours ELSE NULL END,
          v_settings.default_checkin_window_hours
        ) + 
        INTERVAL '1 minute' * v_settings.grace_period_minutes) - NOW()
    ))::INTEGER / 60 as minutes_remaining
    
  FROM public.reservations r
  INNER JOIN public.parking_spots ps ON r.spot_id = ps.id
  INNER JOIN public.parking_groups pg ON ps.group_id = pg.id
  INNER JOIN public.profiles p ON r.user_id = p.id
  INNER JOIN auth.users au ON r.user_id = au.id
  LEFT JOIN public.parking_group_checkin_config pgcc ON pg.id = pgcc.group_id
  LEFT JOIN public.reservation_checkins rc ON r.id = rc.reservation_id
  
  WHERE 
    -- Reserva activa para hoy
    r.reservation_date = CURRENT_DATE
    AND r.status = 'active'
    
    -- Sin check-in realizado
    AND (rc.checkin_at IS NULL OR rc.id IS NULL)
    
    -- Grupo tiene check-in habilitado
    AND (pgcc.enabled IS NULL OR pgcc.enabled = TRUE)
    
    -- Aún no ha pasado el periodo de gracia
    AND NOW() < (
      r.reservation_date::TIMESTAMPTZ + 
      INTERVAL '1 hour' * COALESCE(
        CASE WHEN pgcc.use_custom_config THEN pgcc.custom_checkin_window_hours ELSE NULL END,
        v_settings.default_checkin_window_hours
      ) + 
      INTERVAL '1 minute' * v_settings.grace_period_minutes
    )
    
    -- Ya estamos dentro de la ventana de check-in (para enviar recordatorio)
    AND NOW() >= r.reservation_date::TIMESTAMPTZ
    
  ORDER BY minutes_remaining ASC;
  
  -- TODO: Cuando se implemente el sistema de notificaciones:
  -- 1. Iterar sobre los resultados
  -- 2. Enviar notificación a cada usuario (email, push, SMS)
  -- 3. Incluir en la notificación:
  --    - Plaza reservada (spot_number)
  --    - Grupo (group_name)
  --    - Tiempo restante (minutes_remaining)
  --    - Enlace directo a la sección "Hoy" para hacer check-in
  -- 4. Registrar notificaciones enviadas en una tabla de auditoría
  -- 5. Respetar preferencias de notificaciones del usuario
  
END;
$$;

COMMENT ON FUNCTION public.send_checkin_reminders() IS 
'Busca usuarios con reservas activas sin check-in y prepara recordatorios. 
Actualmente retorna los datos para logging. Debe ser extendida para enviar 
notificaciones reales cuando se implemente el sistema de notificaciones.';

-- =====================================================
-- Job 5: Recordatorios de Check-in (Cada 30 minutos)
-- =====================================================
-- Se ejecuta cada 30 minutos durante el día (6:00-22:00)
-- para enviar recordatorios a usuarios con reservas sin check-in
-- Requirements: 15.1, 15.2, 15.3

SELECT cron.schedule(
  'checkin-reminder-notifications',
  '*/30 6-22 * * *',  -- Cada 30 minutos entre 6:00 y 22:00
  $$
    -- Ejecutar función de recordatorios
    -- Los resultados se registran en logs de PostgreSQL
    -- Cuando se implemente el sistema de notificaciones,
    -- esta función enviará notificaciones reales
    SELECT public.send_checkin_reminders();
  $$
);

-- =====================================================
-- Verificación
-- =====================================================
-- Para verificar que el job está programado:
-- SELECT * FROM cron.job WHERE jobname = 'checkin-reminder-notifications';

-- Para ver los próximos recordatorios que se enviarían:
-- SELECT * FROM public.send_checkin_reminders();

-- =====================================================
-- Cleanup (para rollback o testing)
-- =====================================================
-- Para eliminar el job:
-- SELECT cron.unschedule('checkin-reminder-notifications');

-- Para eliminar la función:
-- DROP FUNCTION IF EXISTS public.send_checkin_reminders();
