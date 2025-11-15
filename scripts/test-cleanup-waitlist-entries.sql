-- =====================================================================================
-- TEST: cleanup_expired_waitlist_entries()
-- =====================================================================================
-- Purpose: Verificar que la función de limpieza automática funciona correctamente
-- =====================================================================================

BEGIN;

-- Limpiar datos de prueba anteriores
DELETE FROM waitlist_logs WHERE action = 'cleanup_executed';
DELETE FROM waitlist_entries WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE 'cleanup_test_%@test.com'
);
DELETE FROM profiles WHERE email LIKE 'cleanup_test_%@test.com';

-- =====================================================================================
-- SETUP: Crear usuarios y datos de prueba
-- =====================================================================================

-- Usuario 1: Normal (no debe eliminarse)
INSERT INTO auth.users (id, email) 
VALUES ('11111111-1111-1111-1111-111111111111', 'cleanup_test_normal@test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, is_blocked, is_deactivated)
VALUES ('11111111-1111-1111-1111-111111111111', 'cleanup_test_normal@test.com', 'Normal User', false, false)
ON CONFLICT (id) DO NOTHING;

-- Usuario 2: Bloqueado (debe eliminarse)
INSERT INTO auth.users (id, email) 
VALUES ('22222222-2222-2222-2222-222222222222', 'cleanup_test_blocked@test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, is_blocked, is_deactivated)
VALUES ('22222222-2222-2222-2222-222222222222', 'cleanup_test_blocked@test.com', 'Blocked User', true, false)
ON CONFLICT (id) DO NOTHING;

-- Usuario 3: Desactivado (debe eliminarse)
INSERT INTO auth.users (id, email) 
VALUES ('33333333-3333-3333-3333-333333333333', 'cleanup_test_deactivated@test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, is_blocked, is_deactivated)
VALUES ('33333333-3333-3333-3333-333333333333', 'cleanup_test_deactivated@test.com', 'Deactivated User', false, true)
ON CONFLICT (id) DO NOTHING;

-- Usuario 4: Sin matrícula aprobada (debe eliminarse)
INSERT INTO auth.users (id, email) 
VALUES ('44444444-4444-4444-4444-444444444444', 'cleanup_test_no_plate@test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, is_blocked, is_deactivated)
VALUES ('44444444-4444-4444-4444-444444444444', 'cleanup_test_no_plate@test.com', 'No Plate User', false, false)
ON CONFLICT (id) DO NOTHING;

-- Crear matrículas aprobadas para usuarios que las necesitan
INSERT INTO license_plates (user_id, plate_number, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'CLEANUP1', 'approved'),
  ('22222222-2222-2222-2222-222222222222', 'CLEANUP2', 'approved'),
  ('33333333-3333-3333-3333-333333333333', 'CLEANUP3', 'approved')
ON CONFLICT DO NOTHING;

-- Obtener un grupo existente
DO $$
DECLARE
  v_group_id UUID;
BEGIN
  SELECT id INTO v_group_id FROM parking_groups WHERE is_active = true LIMIT 1;
  
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'No hay grupos activos para pruebas';
  END IF;

  -- Asignar acceso al grupo a usuarios que lo necesitan
  INSERT INTO user_group_assignments (user_id, group_id)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', v_group_id),
    ('22222222-2222-2222-2222-222222222222', v_group_id),
    ('33333333-3333-3333-3333-333333333333', v_group_id),
    ('44444444-4444-4444-4444-444444444444', v_group_id)
  ON CONFLICT DO NOTHING;

  -- =====================================================================================
  -- CREAR ENTRADAS DE LISTA DE ESPERA
  -- =====================================================================================

  -- Entrada 1: Fecha pasada (debe eliminarse)
  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES ('11111111-1111-1111-1111-111111111111', v_group_id, CURRENT_DATE - INTERVAL '1 day', 'active');

  -- Entrada 2: Fecha futura, usuario normal (NO debe eliminarse)
  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES ('11111111-1111-1111-1111-111111111111', v_group_id, CURRENT_DATE + INTERVAL '1 day', 'active');

  -- Entrada 3: Usuario bloqueado (debe eliminarse)
  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES ('22222222-2222-2222-2222-222222222222', v_group_id, CURRENT_DATE + INTERVAL '1 day', 'active');

  -- Entrada 4: Usuario desactivado (debe eliminarse)
  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES ('33333333-3333-3333-3333-333333333333', v_group_id, CURRENT_DATE + INTERVAL '1 day', 'active');

  -- Entrada 5: Usuario sin matrícula aprobada (debe eliminarse)
  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES ('44444444-4444-4444-4444-444444444444', v_group_id, CURRENT_DATE + INTERVAL '1 day', 'active');

  RAISE NOTICE 'Setup completado con grupo: %', v_group_id;
END $$;

-- =====================================================================================
-- VERIFICAR ESTADO INICIAL
-- =====================================================================================

SELECT 
  '=== ESTADO INICIAL ===' as test_phase,
  COUNT(*) as total_entries
FROM waitlist_entries
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- =====================================================================================
-- EJECUTAR FUNCIÓN DE LIMPIEZA
-- =====================================================================================

SELECT 
  '=== EJECUTANDO LIMPIEZA ===' as test_phase,
  *
FROM cleanup_expired_waitlist_entries();

-- =====================================================================================
-- VERIFICAR RESULTADOS
-- =====================================================================================

-- Verificar entradas restantes
SELECT 
  '=== ENTRADAS RESTANTES ===' as test_phase,
  we.user_id,
  p.email,
  we.reservation_date,
  we.status,
  CASE 
    WHEN we.reservation_date < CURRENT_DATE THEN 'FECHA PASADA (ERROR)'
    WHEN p.is_blocked THEN 'USUARIO BLOQUEADO (ERROR)'
    WHEN p.is_deactivated THEN 'USUARIO DESACTIVADO (ERROR)'
    WHEN NOT EXISTS (
      SELECT 1 FROM license_plates lp 
      WHERE lp.user_id = we.user_id 
      AND lp.status = 'approved' 
      AND lp.deleted_at IS NULL
    ) THEN 'SIN MATRÍCULA (ERROR)'
    ELSE 'OK'
  END as validation_status
FROM waitlist_entries we
JOIN profiles p ON p.id = we.user_id
WHERE we.user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- Verificar log de limpieza
SELECT 
  '=== LOG DE LIMPIEZA ===' as test_phase,
  action,
  details,
  created_at
FROM waitlist_logs
WHERE action = 'cleanup_executed'
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================================================
-- VALIDACIONES
-- =====================================================================================

DO $$
DECLARE
  v_remaining_count INTEGER;
  v_expected_remaining INTEGER := 1; -- Solo debe quedar la entrada del usuario normal con fecha futura
  v_log_exists BOOLEAN;
BEGIN
  -- Verificar que solo queda 1 entrada (usuario normal, fecha futura)
  SELECT COUNT(*) INTO v_remaining_count
  FROM waitlist_entries
  WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  );

  IF v_remaining_count != v_expected_remaining THEN
    RAISE EXCEPTION 'ERROR: Se esperaban % entradas restantes, pero hay %', 
      v_expected_remaining, v_remaining_count;
  END IF;

  -- Verificar que se creó el log
  SELECT EXISTS (
    SELECT 1 FROM waitlist_logs 
    WHERE action = 'cleanup_executed'
    AND created_at > NOW() - INTERVAL '1 minute'
  ) INTO v_log_exists;

  IF NOT v_log_exists THEN
    RAISE EXCEPTION 'ERROR: No se creó el log de limpieza';
  END IF;

  RAISE NOTICE '✅ TODAS LAS VALIDACIONES PASARON';
  RAISE NOTICE '✅ Entradas restantes: % (esperado: %)', v_remaining_count, v_expected_remaining;
  RAISE NOTICE '✅ Log de limpieza creado correctamente';
END $$;

-- =====================================================================================
-- CLEANUP
-- =====================================================================================

-- Limpiar datos de prueba
DELETE FROM waitlist_logs WHERE action = 'cleanup_executed';
DELETE FROM waitlist_entries WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE 'cleanup_test_%@test.com'
);
DELETE FROM user_group_assignments WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE 'cleanup_test_%@test.com'
);
DELETE FROM license_plates WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE 'cleanup_test_%@test.com'
);
DELETE FROM profiles WHERE email LIKE 'cleanup_test_%@test.com';

ROLLBACK;

-- =====================================================================================
-- RESULTADO ESPERADO
-- =====================================================================================
-- ✅ 5 entradas creadas inicialmente
-- ✅ 4 entradas eliminadas (fecha pasada, bloqueado, desactivado, sin matrícula)
-- ✅ 1 entrada restante (usuario normal con fecha futura)
-- ✅ Log de limpieza creado con detalles
-- =====================================================================================
