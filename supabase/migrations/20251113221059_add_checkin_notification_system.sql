-- =====================================================
-- RESERVEO - Sistema de Check-in/Check-out
-- Migración: Sistema de Notificaciones de Recordatorio
-- Fecha: 2025-11-13
-- =====================================================
-- Implementa el sistema completo de notificaciones de
-- recordatorio de check-in, incluyendo preferencias de
-- usuario y registro de notificaciones enviadas.
-- Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
-- =====================================================

-- =====================================================
-- 1. Extender tabla profiles con preferencias
-- =====================================================

-- Añadir columna para preferencias de notificaciones de check-in
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS checkin_reminders_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.profiles.checkin_reminders_enabled IS 
'Indica si el usuario desea recibir recordatorios de check-in. Por defecto TRUE.';

-- =====================================================
-- 2. Tabla de notificaciones enviadas (auditoría)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.checkin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  
  -- Tipo de notificación
  notification_type TEXT NOT NULL CHECK (notification_type IN ('checkin_reminder', 'late_checkin_warning', 'infraction_notice')),
  
  -- Contenido de la notificación
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  spot_number TEXT,
  group_name TEXT,
  minutes_remaining INTEGER,
  
  -- Estado de envío
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed', 'pending')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_checkin_notifications_user 
  ON public.checkin_notifications(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkin_notifications_reservation 
  ON public.checkin_notifications(reservation_id);

CREATE INDEX IF NOT EXISTS idx_checkin_notifications_type_date 
  ON public.checkin_notifications(notification_type, sent_at DESC);

COMMENT ON TABLE public.checkin_notifications IS 
'Registro de todas las notificaciones de check-in enviadas a usuarios. 
Sirve como auditoría y para evitar enviar notificaciones duplicadas.';

-- =====================================================
-- 3. RLS Policies para checkin_notifications
-- =====================================================

ALTER TABLE public.checkin_notifications ENABLE ROW LEVEL SECURITY;

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to checkin_notifications"
  ON public.checkin_notifications FOR SELECT
  TO anon
  USING (false);

-- Usuarios ven sus propias notificaciones
CREATE POLICY "Users view own checkin notifications"
  ON public.checkin_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins ven todas las notificaciones
CREATE POLICY "Admins view all checkin notifications"
  ON public.checkin_notifications FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Solo el sistema (admins) puede insertar notificaciones
CREATE POLICY "System creates checkin notifications"
  ON public.checkin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 4. Función mejorada: send_checkin_reminders()
-- =====================================================

-- Eliminar función existente
DROP FUNCTION IF EXISTS public.send_checkin_reminders();

CREATE OR REPLACE FUNCTION public.send_checkin_reminders()
RETURNS TABLE (
  notification_id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  spot_number TEXT,
  group_name TEXT,
  reservation_date DATE,
  minutes_remaining INTEGER,
  notification_sent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_reservation RECORD;
  v_notification_id UUID;
  v_notifications_sent INTEGER := 0;
  v_window_end TIMESTAMPTZ;
  v_grace_end TIMESTAMPTZ;
  v_minutes_remaining INTEGER;
  v_subject TEXT;
  v_message TEXT;
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
  FOR v_reservation IN
    SELECT 
      r.id as reservation_id,
      r.user_id,
      au.email as user_email,
      p.full_name as user_name,
      p.checkin_reminders_enabled,
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
        INTERVAL '1 minute' * v_settings.grace_period_minutes) as grace_end
      
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
      
      -- Ya estamos dentro de la ventana de check-in
      AND NOW() >= r.reservation_date::TIMESTAMPTZ
      
      -- Usuario tiene recordatorios habilitados
      AND p.checkin_reminders_enabled = TRUE
      
      -- No se ha enviado notificación en las últimas 2 horas (evitar spam)
      AND NOT EXISTS (
        SELECT 1 FROM public.checkin_notifications cn
        WHERE cn.reservation_id = r.id
          AND cn.notification_type = 'checkin_reminder'
          AND cn.sent_at > NOW() - INTERVAL '2 hours'
      )
    
    ORDER BY r.reservation_date ASC
  LOOP
    -- Calcular minutos restantes
    v_minutes_remaining := EXTRACT(EPOCH FROM (v_reservation.grace_end - NOW()))::INTEGER / 60;
    
    -- Construir mensaje de notificación
    v_subject := 'Recordatorio: Realiza tu check-in';
    v_message := format(
      'Hola %s, tienes una reserva activa para la plaza %s en %s. ' ||
      'Recuerda realizar tu check-in. Te quedan aproximadamente %s minutos.',
      v_reservation.user_name,
      v_reservation.spot_number,
      v_reservation.group_name,
      v_minutes_remaining
    );
    
    -- Registrar notificación en la base de datos
    INSERT INTO public.checkin_notifications (
      user_id,
      reservation_id,
      notification_type,
      subject,
      message,
      spot_number,
      group_name,
      minutes_remaining,
      delivery_status
    ) VALUES (
      v_reservation.user_id,
      v_reservation.reservation_id,
      'checkin_reminder',
      v_subject,
      v_message,
      v_reservation.spot_number,
      v_reservation.group_name,
      v_minutes_remaining,
      'sent'
    )
    RETURNING id INTO v_notification_id;
    
    v_notifications_sent := v_notifications_sent + 1;
    
    -- Retornar información de la notificación enviada
    RETURN QUERY SELECT
      v_notification_id,
      v_reservation.user_id,
      v_reservation.user_email,
      v_reservation.user_name,
      v_reservation.spot_number,
      v_reservation.group_name,
      v_reservation.reservation_date,
      v_minutes_remaining,
      TRUE as notification_sent;
    
  END LOOP;
  
  -- Log de notificaciones enviadas
  RAISE NOTICE 'Checkin reminders sent: %', v_notifications_sent;
  
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.send_checkin_reminders() IS 
'Busca usuarios con reservas activas sin check-in y envía recordatorios.
Respeta las preferencias de notificaciones del usuario y evita enviar
notificaciones duplicadas en un periodo de 2 horas.
Registra todas las notificaciones enviadas en checkin_notifications.';

-- =====================================================
-- 5. Función auxiliar: get_user_checkin_notifications()
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_checkin_notifications(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  notification_type TEXT,
  subject TEXT,
  message TEXT,
  spot_number TEXT,
  group_name TEXT,
  minutes_remaining INTEGER,
  sent_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    notification_type,
    subject,
    message,
    spot_number,
    group_name,
    minutes_remaining,
    sent_at
  FROM public.checkin_notifications
  WHERE user_id = COALESCE(p_user_id, auth.uid())
  ORDER BY sent_at DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_user_checkin_notifications(UUID, INTEGER) IS 
'Obtiene las notificaciones de check-in de un usuario específico.
Si no se proporciona user_id, usa el usuario autenticado actual.';

-- =====================================================
-- 6. Actualizar job de recordatorios
-- =====================================================

-- El job ya existe, solo necesitamos asegurarnos de que está activo
-- y usando la función actualizada

-- Verificar que el job existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'checkin-reminder-notifications'
  ) THEN
    -- Crear el job si no existe
    PERFORM cron.schedule(
      'checkin-reminder-notifications',
      '*/30 6-22 * * *',  -- Cada 30 minutos entre 6:00 y 22:00
      $job$
        SELECT public.send_checkin_reminders();
      $job$
    );
  END IF;
END $$;

-- =====================================================
-- Verificación y Testing
-- =====================================================

-- Para verificar la configuración:
-- SELECT * FROM public.checkin_settings;

-- Para ver usuarios con recordatorios habilitados:
-- SELECT id, full_name, email, checkin_reminders_enabled 
-- FROM public.profiles 
-- WHERE checkin_reminders_enabled = TRUE;

-- Para simular envío de recordatorios (sin esperar al job):
-- SELECT * FROM public.send_checkin_reminders();

-- Para ver notificaciones enviadas hoy:
-- SELECT * FROM public.checkin_notifications 
-- WHERE sent_at::DATE = CURRENT_DATE
-- ORDER BY sent_at DESC;

-- Para ver el historial de notificaciones de un usuario:
-- SELECT * FROM public.get_user_checkin_notifications('user-uuid-here', 10);

-- Para verificar que el job está programado:
-- SELECT * FROM cron.job WHERE jobname = 'checkin-reminder-notifications';

-- =====================================================
-- Cleanup (para rollback o testing)
-- =====================================================

-- Para deshabilitar recordatorios globalmente:
-- UPDATE public.checkin_settings 
-- SET send_checkin_reminders = FALSE 
-- WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Para deshabilitar recordatorios para un usuario:
-- UPDATE public.profiles 
-- SET checkin_reminders_enabled = FALSE 
-- WHERE id = 'user-uuid-here';

-- Para eliminar la tabla de notificaciones:
-- DROP TABLE IF EXISTS public.checkin_notifications CASCADE;

-- Para eliminar las funciones:
-- DROP FUNCTION IF EXISTS public.send_checkin_reminders();
-- DROP FUNCTION IF EXISTS public.get_user_checkin_notifications(UUID, INTEGER);
