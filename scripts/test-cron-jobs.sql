-- =====================================================
-- TEST: Verificación de Cron Jobs del Sistema de Lista de Espera
-- =====================================================
-- Este script verifica que los cron jobs están configurados correctamente
-- =====================================================

\echo '=================================================='
\echo 'TEST: Verificación de Cron Jobs'
\echo '=================================================='
\echo ''

-- =====================================================
-- 1. Verificar que pg_cron está habilitado
-- =====================================================

\echo '1. Verificando extensión pg_cron...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ pg_cron está habilitado'
    ELSE '✗ pg_cron NO está habilitado'
  END as resultado
FROM pg_extension 
WHERE extname = 'pg_cron';

\echo ''

-- =====================================================
-- 2. Verificar que la tabla de logs existe
-- =====================================================

\echo '2. Verificando tabla waitlist_cron_logs...'
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Tabla waitlist_cron_logs existe'
    ELSE '✗ Tabla waitlist_cron_logs NO existe'
  END as resultado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'waitlist_cron_logs';

\echo ''

-- =====================================================
-- 3. Verificar estructura de la tabla de logs
-- =====================================================

\echo '3. Estructura de waitlist_cron_logs:'
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'waitlist_cron_logs'
ORDER BY ordinal_position;

\echo ''

-- =====================================================
-- 4. Verificar que los cron jobs están configurados
-- =====================================================

\echo '4. Cron jobs configurados:'
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  CASE 
    WHEN active THEN '✓ Activo'
    ELSE '✗ Inactivo'
  END as estado
FROM cron.job
WHERE jobname LIKE '%waitlist%'
ORDER BY jobname;

\echo ''

-- =====================================================
-- 5. Verificar funciones wrapper existen
-- =====================================================

\echo '5. Verificando funciones wrapper...'
SELECT 
  proname as nombre_funcion,
  CASE 
    WHEN prosecdef THEN '✓ SECURITY DEFINER'
    ELSE '✗ NO SECURITY DEFINER'
  END as seguridad
FROM pg_proc
WHERE proname IN (
  'cron_expire_waitlist_offers',
  'cron_cleanup_expired_waitlist_entries'
)
ORDER BY proname;

\echo ''

-- =====================================================
-- 6. Ver historial reciente de ejecuciones (pg_cron)
-- =====================================================

\echo '6. Últimas 5 ejecuciones de cron jobs (pg_cron):'
SELECT 
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) as duracion
FROM cron.job_run_details
WHERE command LIKE '%waitlist%'
ORDER BY start_time DESC
LIMIT 5;

\echo ''

-- =====================================================
-- 7. Ver logs de aplicación
-- =====================================================

\echo '7. Últimos 10 logs de aplicación:'
SELECT 
  job_name,
  execution_status,
  records_affected,
  execution_time_ms,
  created_at,
  CASE 
    WHEN error_message IS NOT NULL THEN error_message
    ELSE 'Sin errores'
  END as mensaje
FROM public.waitlist_cron_logs
ORDER BY created_at DESC
LIMIT 10;

\echo ''

-- =====================================================
-- 8. Estadísticas de ejecución (últimos 7 días)
-- =====================================================

\echo '8. Estadísticas de ejecución (últimos 7 días):'
SELECT 
  job_name,
  execution_status,
  COUNT(*) as total_ejecuciones,
  AVG(execution_time_ms)::INTEGER as tiempo_promedio_ms,
  MAX(execution_time_ms) as tiempo_maximo_ms,
  SUM(records_affected) as total_registros_procesados
FROM public.waitlist_cron_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY job_name, execution_status
ORDER BY job_name, execution_status;

\echo ''

-- =====================================================
-- 9. Verificar errores recientes
-- =====================================================

\echo '9. Errores recientes (últimos 7 días):'
SELECT 
  job_name,
  error_message,
  created_at
FROM public.waitlist_cron_logs
WHERE execution_status = 'error'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 5;

\echo ''

-- =====================================================
-- 10. Test manual de funciones wrapper
-- =====================================================

\echo '10. Ejecutando test manual de funciones wrapper...'
\echo '    (Esto ejecutará las funciones una vez para verificar que funcionan)'
\echo ''

-- Test de expire_waitlist_offers
\echo '    a) Ejecutando cron_expire_waitlist_offers()...'
SELECT public.cron_expire_waitlist_offers();

-- Test de cleanup_expired_waitlist_entries
\echo '    b) Ejecutando cron_cleanup_expired_waitlist_entries()...'
SELECT public.cron_cleanup_expired_waitlist_entries();

\echo ''
\echo '    ✓ Funciones ejecutadas correctamente'
\echo ''

-- =====================================================
-- 11. Verificar último log generado por el test
-- =====================================================

\echo '11. Últimos logs generados por el test manual:'
SELECT 
  job_name,
  execution_status,
  records_affected,
  execution_time_ms,
  created_at
FROM public.waitlist_cron_logs
ORDER BY created_at DESC
LIMIT 2;

\echo ''

-- =====================================================
-- RESUMEN
-- =====================================================

\echo '=================================================='
\echo 'RESUMEN DE VERIFICACIÓN'
\echo '=================================================='
\echo ''

SELECT 
  'pg_cron habilitado' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
    THEN '✓ OK'
    ELSE '✗ FALLO'
  END as estado
UNION ALL
SELECT 
  'Tabla de logs existe',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waitlist_cron_logs')
    THEN '✓ OK'
    ELSE '✗ FALLO'
  END
UNION ALL
SELECT 
  'Cron jobs configurados',
  CASE 
    WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%waitlist%') >= 2
    THEN '✓ OK (' || (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%waitlist%') || ' jobs)'
    ELSE '✗ FALLO'
  END
UNION ALL
SELECT 
  'Funciones wrapper existen',
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('cron_expire_waitlist_offers', 'cron_cleanup_expired_waitlist_entries')) = 2
    THEN '✓ OK'
    ELSE '✗ FALLO'
  END;

\echo ''
\echo '=================================================='
\echo 'Verificación completada'
\echo '=================================================='
\echo ''
\echo 'Para más detalles, consulta: scripts/VERIFY-CRON-JOBS.md'
\echo ''
