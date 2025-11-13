-- =====================================================
-- VERIFICACIÓN DE JOBS DE CHECK-IN
-- =====================================================
-- Este archivo contiene queries útiles para verificar
-- que todos los jobs de check-in están configurados
-- correctamente.
-- =====================================================

-- =====================================================
-- 1. Verificar todos los jobs programados
-- =====================================================
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname LIKE 'checkin-%'
ORDER BY jobname;

-- Resultado esperado: 5 jobs
-- - checkin-daily-reset (0 0 * * *)
-- - checkin-infraction-detection (*/15 * * * *)
-- - checkin-warning-generation (0 * * * *)
-- - checkin-block-expiration (0 * * * *)
-- - checkin-reminder-notifications (*/30 6-22 * * *)

-- =====================================================
-- 2. Verificar función de recordatorios
-- =====================================================
-- Esta query ejecuta la función y muestra qué usuarios
-- recibirían recordatorios en este momento
SELECT 
  user_name,
  user_email,
  spot_number,
  group_name,
  reservation_date,
  minutes_remaining,
  window_end,
  grace_end
FROM send_checkin_reminders()
ORDER BY minutes_remaining ASC;

-- =====================================================
-- 3. Verificar configuración de recordatorios
-- =====================================================
SELECT 
  system_enabled,
  send_checkin_reminders,
  default_checkin_window_hours,
  grace_period_minutes
FROM checkin_settings;

-- =====================================================
-- 4. Ver historial de ejecuciones de jobs (últimas 24h)
-- =====================================================
-- NOTA: Esta query requiere hacer JOIN con cron.job
-- porque job_run_details no tiene el nombre del job
SELECT 
  j.jobname,
  jrd.runid,
  jrd.job_pid,
  jrd.database,
  jrd.username,
  jrd.command,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time
FROM cron.job_run_details jrd
INNER JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname LIKE 'checkin-%'
  AND jrd.start_time > NOW() - INTERVAL '24 hours'
ORDER BY jrd.start_time DESC
LIMIT 50;

-- =====================================================
-- 5. Contar reservas activas sin check-in (hoy)
-- =====================================================
SELECT COUNT(*) as reservas_sin_checkin
FROM reservations r
LEFT JOIN reservation_checkins rc ON r.id = rc.reservation_id
WHERE r.reservation_date = CURRENT_DATE
  AND r.status = 'active'
  AND (rc.checkin_at IS NULL OR rc.id IS NULL);

-- =====================================================
-- 6. Ver próximos recordatorios que se enviarían
-- =====================================================
-- Esta query simula lo que el job enviará en la
-- próxima ejecución
SELECT 
  p.full_name,
  au.email,
  ps.spot_number,
  pg.name as grupo,
  r.reservation_date,
  CASE 
    WHEN EXTRACT(EPOCH FROM (
      (r.reservation_date::TIMESTAMPTZ + INTERVAL '24 hours') - NOW()
    ))::INTEGER / 60 > 60 
    THEN 'Más de 1 hora restante'
    ELSE EXTRACT(EPOCH FROM (
      (r.reservation_date::TIMESTAMPTZ + INTERVAL '24 hours') - NOW()
    ))::INTEGER / 60 || ' minutos restantes'
  END as tiempo_restante
FROM reservations r
INNER JOIN parking_spots ps ON r.spot_id = ps.id
INNER JOIN parking_groups pg ON ps.group_id = pg.id
INNER JOIN profiles p ON r.user_id = p.id
INNER JOIN auth.users au ON r.user_id = au.id
LEFT JOIN reservation_checkins rc ON r.id = rc.reservation_id
WHERE r.reservation_date = CURRENT_DATE
  AND r.status = 'active'
  AND (rc.checkin_at IS NULL OR rc.id IS NULL)
  AND NOW() >= r.reservation_date::TIMESTAMPTZ
ORDER BY r.reservation_date;
