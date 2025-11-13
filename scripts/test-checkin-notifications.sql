-- =====================================================
-- RESERVEO - Test Script: Checkin Notifications System
-- =====================================================
-- Este script prueba el sistema de notificaciones de
-- recordatorio de check-in.
-- =====================================================

-- =====================================================
-- 1. Verificar configuración global
-- =====================================================
SELECT 
  system_enabled,
  send_checkin_reminders,
  default_checkin_window_hours,
  grace_period_minutes
FROM public.checkin_settings
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- =====================================================
-- 2. Verificar usuarios con recordatorios habilitados
-- =====================================================
SELECT 
  id,
  email,
  full_name,
  checkin_reminders_enabled
FROM public.profiles
WHERE checkin_reminders_enabled = TRUE
LIMIT 10;

-- =====================================================
-- 3. Verificar tabla de notificaciones
-- =====================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'checkin_notifications'
ORDER BY ordinal_position;

-- =====================================================
-- 4. Verificar políticas RLS de notificaciones
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'checkin_notifications'
ORDER BY policyname;

-- =====================================================
-- 5. Simular envío de recordatorios
-- =====================================================
-- NOTA: Esto ejecutará la función y registrará
-- notificaciones en la base de datos si hay reservas
-- activas sin check-in.

SELECT 
  notification_id,
  user_email,
  user_name,
  spot_number,
  group_name,
  minutes_remaining,
  notification_sent
FROM public.send_checkin_reminders()
LIMIT 10;

-- =====================================================
-- 6. Ver notificaciones enviadas hoy
-- =====================================================
SELECT 
  cn.id,
  p.full_name as user_name,
  p.email as user_email,
  cn.notification_type,
  cn.subject,
  cn.spot_number,
  cn.group_name,
  cn.minutes_remaining,
  cn.sent_at,
  cn.delivery_status
FROM public.checkin_notifications cn
INNER JOIN public.profiles p ON cn.user_id = p.id
WHERE cn.sent_at::DATE = CURRENT_DATE
ORDER BY cn.sent_at DESC
LIMIT 20;

-- =====================================================
-- 7. Estadísticas de notificaciones
-- =====================================================
SELECT 
  notification_type,
  COUNT(*) as total_sent,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(minutes_remaining) as avg_minutes_remaining,
  MIN(sent_at) as first_sent,
  MAX(sent_at) as last_sent
FROM public.checkin_notifications
WHERE sent_at::DATE = CURRENT_DATE
GROUP BY notification_type;

-- =====================================================
-- 8. Verificar job de recordatorios
-- =====================================================
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'checkin-reminder-notifications';

-- =====================================================
-- 9. Ver próximos recordatorios que se enviarían
-- =====================================================
-- Esta query muestra qué usuarios recibirían recordatorios
-- si se ejecutara la función ahora
SELECT 
  r.id as reservation_id,
  p.full_name as user_name,
  p.email as user_email,
  p.checkin_reminders_enabled,
  ps.spot_number,
  pg.name as group_name,
  r.reservation_date,
  
  -- Calcular si ya se envió notificación recientemente
  EXISTS (
    SELECT 1 FROM public.checkin_notifications cn
    WHERE cn.reservation_id = r.id
      AND cn.notification_type = 'checkin_reminder'
      AND cn.sent_at > NOW() - INTERVAL '2 hours'
  ) as notification_sent_recently,
  
  -- Calcular minutos restantes
  EXTRACT(EPOCH FROM (
    (r.reservation_date::TIMESTAMPTZ + INTERVAL '24 hours') - NOW()
  ))::INTEGER / 60 as minutes_remaining

FROM public.reservations r
INNER JOIN public.parking_spots ps ON r.spot_id = ps.id
INNER JOIN public.parking_groups pg ON ps.group_id = pg.id
INNER JOIN public.profiles p ON r.user_id = p.id
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
  
  -- Usuario tiene recordatorios habilitados
  AND p.checkin_reminders_enabled = TRUE

ORDER BY minutes_remaining ASC
LIMIT 20;

-- =====================================================
-- 10. Historial de notificaciones de un usuario
-- =====================================================
-- Reemplazar 'USER_ID_HERE' con un UUID real
-- SELECT * FROM public.get_user_checkin_notifications('USER_ID_HERE', 10);

-- =====================================================
-- Cleanup (para testing)
-- =====================================================
-- Para limpiar notificaciones de prueba:
-- DELETE FROM public.checkin_notifications WHERE sent_at::DATE = CURRENT_DATE;

-- Para deshabilitar recordatorios temporalmente:
-- UPDATE public.checkin_settings 
-- SET send_checkin_reminders = FALSE 
-- WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Para deshabilitar recordatorios para un usuario:
-- UPDATE public.profiles 
-- SET checkin_reminders_enabled = FALSE 
-- WHERE email = 'user@example.com';

