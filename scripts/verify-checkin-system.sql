-- =====================================================
-- SCRIPT DE VERIFICACIÓN: Sistema de Check-in/Check-out
-- =====================================================
-- Este script verifica que todos los componentes del
-- sistema de check-in/check-out estén correctamente
-- instalados y configurados.
-- =====================================================

\echo '=================================================='
\echo 'VERIFICACIÓN DEL SISTEMA DE CHECK-IN/CHECK-OUT'
\echo '=================================================='
\echo ''

-- =====================================================
-- 1. VERIFICAR TABLAS
-- =====================================================
\echo '1. Verificando tablas...'
\echo ''

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkin_settings') 
    THEN '✓ checkin_settings'
    ELSE '✗ checkin_settings FALTA'
  END as tabla_1,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parking_group_checkin_config') 
    THEN '✓ parking_group_checkin_config'
    ELSE '✗ parking_group_checkin_config FALTA'
  END as tabla_2,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservation_checkins') 
    THEN '✓ reservation_checkins'
    ELSE '✗ reservation_checkins FALTA'
  END as tabla_3,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkin_infractions') 
    THEN '✓ checkin_infractions'
    ELSE '✗ checkin_infractions FALTA'
  END as tabla_4,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_blocks') 
    THEN '✓ user_blocks'
    ELSE '✗ user_blocks FALTA'
  END as tabla_5,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkin_notifications') 
    THEN '✓ checkin_notifications'
    ELSE '✗ checkin_notifications FALTA'
  END as tabla_6;

\echo ''

-- =====================================================
-- 2. VERIFICAR FUNCIONES
-- =====================================================
\echo '2. Verificando funciones...'
\echo ''

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'perform_checkin') 
    THEN '✓ perform_checkin'
    ELSE '✗ perform_checkin FALTA'
  END as funcion_1,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'perform_checkout') 
    THEN '✓ perform_checkout'
    ELSE '✗ perform_checkout FALTA'
  END as funcion_2,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'detect_checkin_infractions') 
    THEN '✓ detect_checkin_infractions'
    ELSE '✗ detect_checkin_infractions FALTA'
  END as funcion_3,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'detect_checkout_infractions') 
    THEN '✓ detect_checkout_infractions'
    ELSE '✗ detect_checkout_infractions FALTA'
  END as funcion_4,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_automatic_warnings') 
    THEN '✓ generate_automatic_warnings'
    ELSE '✗ generate_automatic_warnings FALTA'
  END as funcion_5,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_user_blocked_by_checkin') 
    THEN '✓ is_user_blocked_by_checkin'
    ELSE '✗ is_user_blocked_by_checkin FALTA'
  END as funcion_6;

\echo ''

-- =====================================================
-- 3. VERIFICAR JOBS DE PG_CRON
-- =====================================================
\echo '3. Verificando jobs programados...'
\echo ''

SELECT 
  jobname,
  schedule,
  active,
  CASE 
    WHEN active THEN '✓ Activo'
    ELSE '✗ Inactivo'
  END as estado
FROM cron.job 
WHERE jobname LIKE 'checkin-%'
ORDER BY jobname;

\echo ''

-- =====================================================
-- 4. VERIFICAR ÍNDICES
-- =====================================================
\echo '4. Verificando índices...'
\echo ''

SELECT 
  tablename,
  indexname,
  '✓' as estado
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    indexname LIKE 'idx_checkins_%' OR
    indexname LIKE 'idx_infractions_%' OR
    indexname LIKE 'idx_user_blocks_%' OR
    indexname LIKE 'idx_group_checkin_%' OR
    indexname LIKE 'idx_checkin_notifications_%'
  )
ORDER BY tablename, indexname;

\echo ''

-- =====================================================
-- 5. VERIFICAR CONFIGURACIÓN
-- =====================================================
\echo '5. Verificando configuración global...'
\echo ''

SELECT 
  system_enabled as "Sistema Habilitado",
  default_checkin_window_hours as "Ventana Check-in (horas)",
  grace_period_minutes as "Periodo Gracia (min)",
  checkin_infraction_threshold as "Umbral Check-in",
  checkout_infraction_threshold as "Umbral Check-out",
  temporary_block_days as "Días de Bloqueo",
  send_checkin_reminders as "Recordatorios Habilitados"
FROM public.checkin_settings;

\echo ''

-- =====================================================
-- 6. VERIFICAR RLS
-- =====================================================
\echo '6. Verificando políticas RLS...'
\echo ''

SELECT 
  tablename,
  COUNT(*) as "Políticas RLS"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'checkin_settings',
    'parking_group_checkin_config',
    'reservation_checkins',
    'checkin_infractions',
    'user_blocks',
    'checkin_notifications'
  )
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =====================================================
-- 7. ESTADÍSTICAS DEL SISTEMA
-- =====================================================
\echo '7. Estadísticas del sistema...'
\echo ''

SELECT 
  (SELECT COUNT(*) FROM public.reservation_checkins) as "Total Check-ins",
  (SELECT COUNT(*) FROM public.reservation_checkins WHERE checkout_at IS NOT NULL) as "Total Check-outs",
  (SELECT COUNT(*) FROM public.checkin_infractions) as "Total Infracciones",
  (SELECT COUNT(*) FROM public.user_blocks WHERE is_active = TRUE) as "Bloqueos Activos",
  (SELECT COUNT(*) FROM public.checkin_notifications) as "Notificaciones Enviadas";

\echo ''
\echo '=================================================='
\echo 'VERIFICACIÓN COMPLETADA'
\echo '=================================================='

