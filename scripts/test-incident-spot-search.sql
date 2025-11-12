-- Script de prueba para la función mejorada find_available_spot_for_incident
-- Este script verifica que la función busca en todos los grupos disponibles

-- ============================================================================
-- SETUP: Crear datos de prueba
-- ============================================================================

-- Nota: Ejecuta este script en el SQL Editor de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/sql/new

-- ============================================================================
-- TEST 1: Verificar que la función existe y tiene la firma correcta
-- ============================================================================

SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'find_available_spot_for_incident'
  AND pronamespace = 'public'::regnamespace;

-- Resultado esperado:
-- function_name: find_available_spot_for_incident
-- arguments: _user_id uuid, _date date, _original_spot_id uuid
-- return_type: TABLE(spot_id uuid, spot_number text, group_id uuid, group_name text, position_x numeric, position_y numeric)

-- ============================================================================
-- TEST 2: Probar búsqueda con un usuario real
-- ============================================================================

-- Primero, obtener un usuario de prueba
SELECT 
  u.id as user_id,
  u.email,
  COUNT(uga.group_id) as assigned_groups
FROM auth.users u
LEFT JOIN public.user_group_assignments uga ON u.id = uga.user_id
GROUP BY u.id, u.email
LIMIT 5;

-- Copiar un user_id de arriba y usarlo en la siguiente query
-- Reemplazar 'USER_ID_AQUI' con un UUID real

-- ============================================================================
-- TEST 3: Buscar plaza disponible para mañana
-- ============================================================================

-- Reemplazar estos valores:
-- USER_ID_AQUI: UUID de un usuario real
-- SPOT_ID_AQUI: UUID de una plaza que el usuario tiene reservada

SELECT * FROM public.find_available_spot_for_incident(
  'USER_ID_AQUI'::uuid,
  CURRENT_DATE + INTERVAL '1 day',
  'SPOT_ID_AQUI'::uuid
);

-- Resultado esperado:
-- Debería retornar una plaza disponible, incluso si no está en los grupos asignados al usuario

-- ============================================================================
-- TEST 4: Verificar prioridades de búsqueda
-- ============================================================================

-- Este test verifica que la función busca en el orden correcto:
-- 1. Grupos asignados al usuario (general)
-- 2. Grupos asignados al usuario (incident reserve)
-- 3. Otros grupos (general)
-- 4. Otros grupos (incident reserve)
-- 5. Plazas reservadas (último recurso)

-- Ver todas las plazas disponibles para una fecha
WITH available_spots AS (
  SELECT 
    ps.id as spot_id,
    ps.spot_number,
    pg.id as group_id,
    pg.name as group_name,
    pg.is_incident_reserve,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.user_group_assignments uga 
        WHERE uga.user_id = 'USER_ID_AQUI'::uuid 
          AND uga.group_id = pg.id
      ) THEN 'Assigned'
      ELSE 'Not Assigned'
    END as user_access,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.reservations r 
        WHERE r.spot_id = ps.id 
          AND r.reservation_date = CURRENT_DATE + INTERVAL '1 day'
          AND r.status = 'active'
      ) THEN 'Reserved'
      ELSE 'Available'
    END as reservation_status
  FROM public.parking_spots ps
  JOIN public.parking_groups pg ON ps.group_id = pg.id
  WHERE ps.is_active = TRUE
    AND pg.is_active = TRUE
  ORDER BY 
    user_access DESC,
    pg.is_incident_reserve ASC,
    reservation_status DESC,
    pg.name,
    ps.spot_number
)
SELECT * FROM available_spots;

-- ============================================================================
-- TEST 5: Estadísticas de disponibilidad
-- ============================================================================

-- Ver cuántas plazas hay en cada categoría
SELECT 
  pg.name as group_name,
  pg.is_incident_reserve,
  COUNT(ps.id) as total_spots,
  COUNT(CASE WHEN r.id IS NULL THEN 1 END) as available_spots,
  COUNT(r.id) as reserved_spots
FROM public.parking_groups pg
JOIN public.parking_spots ps ON pg.id = ps.group_id
LEFT JOIN public.reservations r ON ps.id = r.spot_id 
  AND r.reservation_date = CURRENT_DATE + INTERVAL '1 day'
  AND r.status = 'active'
WHERE pg.is_active = TRUE
  AND ps.is_active = TRUE
GROUP BY pg.id, pg.name, pg.is_incident_reserve
ORDER BY pg.is_incident_reserve, pg.name;

-- ============================================================================
-- TEST 6: Simular escenario sin plazas libres
-- ============================================================================

-- Este test verifica que la función puede usar plazas reservadas como último recurso
-- (Solo ejecutar si quieres probar el escenario extremo)

-- Contar plazas totalmente libres
SELECT COUNT(*) as free_spots
FROM public.parking_spots ps
JOIN public.parking_groups pg ON ps.group_id = pg.id
WHERE ps.is_active = TRUE
  AND pg.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.spot_id = ps.id
      AND r.reservation_date = CURRENT_DATE + INTERVAL '1 day'
      AND r.status = 'active'
  );

-- Si free_spots = 0, la función debería retornar una plaza reservada
-- Si free_spots > 0, la función debería retornar una plaza libre

-- ============================================================================
-- CLEANUP (Opcional)
-- ============================================================================

-- Si creaste datos de prueba, puedes limpiarlos aquí
-- NO ejecutar en producción sin verificar

-- DELETE FROM public.reservations WHERE created_at > NOW() - INTERVAL '5 minutes';

-- ============================================================================
-- NOTAS
-- ============================================================================

-- 1. Reemplaza 'USER_ID_AQUI' con un UUID real de la tabla auth.users
-- 2. Reemplaza 'SPOT_ID_AQUI' con un UUID real de la tabla parking_spots
-- 3. Ajusta las fechas según necesites (CURRENT_DATE + INTERVAL '1 day')
-- 4. Los tests 4-6 son opcionales pero útiles para entender el comportamiento

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Si la función no retorna resultados:
-- 1. Verifica que hay plazas activas: SELECT COUNT(*) FROM parking_spots WHERE is_active = TRUE;
-- 2. Verifica que hay grupos activos: SELECT COUNT(*) FROM parking_groups WHERE is_active = TRUE;
-- 3. Verifica que el usuario existe: SELECT * FROM auth.users WHERE id = 'USER_ID_AQUI';
-- 4. Verifica que la fecha no está bloqueada: SELECT * FROM blocked_dates WHERE blocked_date = 'FECHA';

-- Si obtienes un error de permisos:
-- GRANT EXECUTE ON FUNCTION public.find_available_spot_for_incident(UUID, DATE, UUID) TO authenticated;
