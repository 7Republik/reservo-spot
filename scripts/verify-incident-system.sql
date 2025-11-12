-- Script de Verificación del Sistema de Incidentes
-- Ejecutar en Supabase SQL Editor para validar la implementación

-- ============================================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================================================

-- Verificar columnas de incident_reports
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'incident_reports'
ORDER BY ordinal_position;

-- Verificar tabla user_warnings existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_warnings'
) AS user_warnings_exists;

-- Verificar columna is_incident_reserve en parking_groups
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'parking_groups'
    AND column_name = 'is_incident_reserve'
) AS is_incident_reserve_exists;

-- ============================================================================
-- 2. VERIFICAR ÍNDICES
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('incident_reports', 'user_warnings', 'parking_groups')
ORDER BY tablename, indexname;

-- ============================================================================
-- 3. VERIFICAR FUNCIONES SQL
-- ============================================================================

-- Verificar función find_available_spot_for_incident
SELECT EXISTS (
  SELECT FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'find_available_spot_for_incident'
) AS find_available_spot_exists;

-- Verificar función get_user_warning_count
SELECT EXISTS (
  SELECT FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_warning_count'
) AS get_user_warning_count_exists;

-- ============================================================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================================================

-- Políticas de incident_reports
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
WHERE schemaname = 'public'
  AND tablename = 'incident_reports'
ORDER BY policyname;

-- Políticas de user_warnings
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_warnings'
ORDER BY policyname;

-- ============================================================================
-- 5. ESTADÍSTICAS DEL SISTEMA
-- ============================================================================

-- Total de incidentes por status
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN offending_user_id IS NOT NULL THEN 1 END) as with_identified_offender,
  COUNT(CASE WHEN reassigned_spot_id IS NOT NULL THEN 1 END) as with_reassignment,
  COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as with_photo
FROM incident_reports
GROUP BY status
ORDER BY status;

-- Total de amonestaciones
SELECT COUNT(*) as total_warnings FROM user_warnings;

-- Usuarios con más amonestaciones
SELECT 
  p.full_name,
  p.email,
  COUNT(uw.id) as warning_count
FROM user_warnings uw
JOIN profiles p ON uw.user_id = p.id
GROUP BY p.id, p.full_name, p.email
ORDER BY warning_count DESC
LIMIT 10;

-- Grupos configurados como incident_reserve
SELECT 
  id,
  name,
  is_incident_reserve,
  is_active
FROM parking_groups
WHERE is_incident_reserve = TRUE;

-- ============================================================================
-- 6. VERIFICAR INTEGRIDAD DE DATOS
-- ============================================================================

-- Incidentes con datos inconsistentes
SELECT 
  id,
  status,
  CASE 
    WHEN status = 'confirmed' AND confirmed_by IS NULL THEN 'Missing confirmed_by'
    WHEN status = 'confirmed' AND confirmed_at IS NULL THEN 'Missing confirmed_at'
    WHEN reassigned_spot_id IS NOT NULL AND reassigned_reservation_id IS NULL THEN 'Missing reservation'
    WHEN reassigned_reservation_id IS NOT NULL AND reassigned_spot_id IS NULL THEN 'Missing spot'
    ELSE 'OK'
  END as issue
FROM incident_reports
WHERE 
  (status = 'confirmed' AND (confirmed_by IS NULL OR confirmed_at IS NULL))
  OR (reassigned_spot_id IS NOT NULL AND reassigned_reservation_id IS NULL)
  OR (reassigned_reservation_id IS NOT NULL AND reassigned_spot_id IS NULL);

-- Amonestaciones sin incidente asociado (no debería haber)
SELECT COUNT(*) as orphaned_warnings
FROM user_warnings uw
WHERE NOT EXISTS (
  SELECT 1 FROM incident_reports ir
  WHERE ir.id = uw.incident_id
);

-- ============================================================================
-- 7. PRUEBA DE FUNCIÓN find_available_spot_for_incident
-- ============================================================================

-- Nota: Reemplazar [USER_ID], [DATE], [SPOT_ID] con valores reales

-- Ejemplo de uso:
-- SELECT * FROM find_available_spot_for_incident(
--   '[USER_ID]'::uuid,
--   '2025-01-15'::date,
--   '[SPOT_ID]'::uuid
-- );

-- ============================================================================
-- 8. PRUEBA DE FUNCIÓN get_user_warning_count
-- ============================================================================

-- Nota: Reemplazar [USER_ID] con valor real

-- Ejemplo de uso:
-- SELECT get_user_warning_count('[USER_ID]'::uuid);

-- ============================================================================
-- 9. VERIFICAR STORAGE BUCKET
-- ============================================================================

-- Verificar bucket incident-photos existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'incident-photos';

-- Políticas del bucket incident-photos
SELECT 
  policyname as name,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%incident%'
ORDER BY policyname;

-- ============================================================================
-- 10. QUERIES ÚTILES PARA DEBUGGING
-- ============================================================================

-- Ver último incidente creado con todos los detalles
SELECT 
  ir.*,
  reporter.full_name as reporter_name,
  reporter.email as reporter_email,
  offender.full_name as offender_name,
  offender.email as offender_email,
  original_spot.spot_number as original_spot_number,
  original_group.name as original_group_name,
  reassigned_spot.spot_number as reassigned_spot_number,
  reassigned_group.name as reassigned_group_name,
  reassigned_group.is_incident_reserve
FROM incident_reports ir
LEFT JOIN profiles reporter ON ir.reporter_id = reporter.id
LEFT JOIN profiles offender ON ir.offending_user_id = offender.id
LEFT JOIN parking_spots original_spot ON ir.original_spot_id = original_spot.id
LEFT JOIN parking_groups original_group ON original_spot.group_id = original_group.id
LEFT JOIN parking_spots reassigned_spot ON ir.reassigned_spot_id = reassigned_spot.id
LEFT JOIN parking_groups reassigned_group ON reassigned_spot.group_id = reassigned_group.id
ORDER BY ir.created_at DESC
LIMIT 1;

-- Ver amonestaciones de un incidente específico
-- SELECT * FROM user_warnings WHERE incident_id = '[INCIDENT_ID]';

-- Ver reservas canceladas por confirmación de incidente
SELECT 
  rcl.*,
  r.reservation_date,
  r.status,
  ps.spot_number,
  pg.name as group_name
FROM reservation_cancellation_log rcl
JOIN reservations r ON rcl.reservation_id = r.id
JOIN parking_spots ps ON r.spot_id = ps.id
JOIN parking_groups pg ON ps.group_id = pg.id
WHERE rcl.triggered_by = 'admin_incident_confirmation'
ORDER BY rcl.cancelled_at DESC;
