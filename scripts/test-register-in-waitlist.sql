-- =====================================================
-- SCRIPT DE PRUEBA: register_in_waitlist()
-- =====================================================
-- Este script prueba la función register_in_waitlist()
-- con diferentes escenarios de validación
-- =====================================================

-- =====================================================
-- 1. VERIFICAR QUE LA FUNCIÓN EXISTE
-- =====================================================
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'register_in_waitlist';

-- =====================================================
-- 2. VERIFICAR CONFIGURACIÓN DE LISTA DE ESPERA
-- =====================================================
SELECT * FROM public.get_waitlist_settings();

-- =====================================================
-- 3. HABILITAR LISTA DE ESPERA (SI NO ESTÁ HABILITADA)
-- =====================================================
-- Descomentar si necesitas habilitar el sistema
-- UPDATE public.reservation_settings
-- SET waitlist_enabled = TRUE
-- WHERE id = (SELECT id FROM public.reservation_settings LIMIT 1);

-- =====================================================
-- 4. VERIFICAR USUARIOS DISPONIBLES PARA PRUEBA
-- =====================================================
SELECT 
  p.id,
  p.full_name,
  p.email,
  ur.role,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.license_plates lp
      WHERE lp.user_id = p.id
        AND lp.status = 'approved'
        AND lp.deleted_at IS NULL
    ) THEN 'Sí'
    ELSE 'No'
  END as tiene_matricula_aprobada,
  CASE 
    WHEN public.is_user_active(p.id) THEN 'Sí'
    ELSE 'No'
  END as esta_activo
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE public.is_user_active(p.id)
LIMIT 5;

-- =====================================================
-- 5. VERIFICAR GRUPOS DISPONIBLES
-- =====================================================
SELECT 
  id,
  name,
  is_active
FROM public.parking_groups
WHERE is_active = TRUE
LIMIT 5;

-- =====================================================
-- 6. EJEMPLO DE USO: REGISTRAR EN LISTA DE ESPERA
-- =====================================================
-- Reemplazar con IDs reales de tu base de datos
-- 
-- SELECT * FROM public.register_in_waitlist(
--   'user-uuid-aqui'::UUID,
--   'group-uuid-aqui'::UUID,
--   '2025-11-20'::DATE
-- );

-- =====================================================
-- 7. VERIFICAR ENTRADAS EN LISTA DE ESPERA
-- =====================================================
SELECT 
  we.id,
  p.full_name,
  pg.name as grupo,
  we.reservation_date,
  we.status,
  we.created_at,
  public.calculate_waitlist_position(we.id) as posicion
FROM public.waitlist_entries we
INNER JOIN public.profiles p ON p.id = we.user_id
INNER JOIN public.parking_groups pg ON pg.id = we.group_id
ORDER BY we.created_at DESC
LIMIT 10;

-- =====================================================
-- 8. VERIFICAR LOGS DE AUDITORÍA
-- =====================================================
SELECT 
  wl.id,
  p.full_name,
  wl.action,
  wl.details,
  wl.created_at
FROM public.waitlist_logs wl
LEFT JOIN public.profiles p ON p.id = wl.user_id
ORDER BY wl.created_at DESC
LIMIT 10;

-- =====================================================
-- 9. EJEMPLO DE CANCELACIÓN
-- =====================================================
-- Reemplazar con IDs reales
-- 
-- SELECT * FROM public.cancel_waitlist_entry(
--   'entry-uuid-aqui'::UUID,
--   'user-uuid-aqui'::UUID
-- );

-- =====================================================
-- 10. VERIFICAR LÍMITE DE LISTAS SIMULTÁNEAS
-- =====================================================
-- Reemplazar con ID real de usuario
-- 
-- SELECT public.check_user_waitlist_limit('user-uuid-aqui'::UUID);

-- =====================================================
-- 11. VERIFICAR ESTADO DE PENALIZACIÓN
-- =====================================================
-- Reemplazar con ID real de usuario
-- 
-- SELECT * FROM public.check_user_penalty_status('user-uuid-aqui'::UUID);

-- =====================================================
-- NOTAS DE USO
-- =====================================================
-- 
-- La función register_in_waitlist() realiza las siguientes validaciones:
-- 
-- 1. ✅ Lista de espera habilitada globalmente
-- 2. ✅ Usuario tiene matrícula aprobada
-- 3. ✅ Usuario tiene acceso al grupo
-- 4. ✅ Usuario no excede límite de listas simultáneas
-- 5. ✅ Usuario no está bloqueado por penalización
-- 6. ✅ Usuario no está ya en lista para ese grupo/fecha
-- 7. ✅ Usuario está activo (no bloqueado/desactivado)
-- 8. ✅ Fecha no está en el pasado
-- 9. ✅ Grupo existe y está activo
-- 10. ✅ Fecha no está bloqueada
-- 
-- Si todas las validaciones pasan:
-- - Crea entrada en waitlist_entries con status 'active'
-- - Calcula posición en la cola
-- - Registra acción en waitlist_logs
-- - Retorna: success=TRUE, entry_id, queue_position, message
-- 
-- Si alguna validación falla:
-- - Retorna: success=FALSE, entry_id=NULL, queue_position=NULL, message con error
-- 
-- =====================================================
