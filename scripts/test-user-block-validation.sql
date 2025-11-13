-- Script de prueba para validar el bloqueo de usuarios en reservas
-- Este script verifica que la función validate_parking_spot_reservation
-- correctamente previene reservas cuando un usuario está bloqueado

-- =====================================================
-- SETUP: Obtener datos de prueba
-- =====================================================

-- Obtener un usuario de prueba
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_spot_id UUID;
  v_test_date DATE := CURRENT_DATE + INTERVAL '1 day';
  v_validation_result RECORD;
BEGIN
  -- Obtener primer usuario activo
  SELECT id INTO v_test_user_id
  FROM auth.users
  LIMIT 1;
  
  IF v_test_user_id IS NULL THEN
    RAISE NOTICE 'No hay usuarios en el sistema para probar';
    RETURN;
  END IF;
  
  -- Obtener una plaza disponible
  SELECT id INTO v_test_spot_id
  FROM public.parking_spots
  WHERE is_active = TRUE
  LIMIT 1;
  
  IF v_test_spot_id IS NULL THEN
    RAISE NOTICE 'No hay plazas disponibles para probar';
    RETURN;
  END IF;
  
  RAISE NOTICE '=== PRUEBA 1: Usuario sin bloqueo ===';
  RAISE NOTICE 'Usuario: %', v_test_user_id;
  RAISE NOTICE 'Plaza: %', v_test_spot_id;
  RAISE NOTICE 'Fecha: %', v_test_date;
  
  -- Validar reserva sin bloqueo
  SELECT * INTO v_validation_result
  FROM public.validate_parking_spot_reservation(
    v_test_user_id,
    v_test_spot_id,
    v_test_date
  );
  
  RAISE NOTICE 'Resultado: is_valid=%, error_code=%, error_message=%',
    v_validation_result.is_valid,
    v_validation_result.error_code,
    v_validation_result.error_message;
  
  -- =====================================================
  -- PRUEBA 2: Crear bloqueo temporal
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '=== PRUEBA 2: Crear bloqueo temporal ===';
  
  -- Insertar bloqueo de prueba
  INSERT INTO public.user_blocks (
    user_id,
    block_type,
    reason,
    blocked_until,
    is_active
  ) VALUES (
    v_test_user_id,
    'automatic_checkin',
    'Prueba de validación de bloqueos',
    NOW() + INTERVAL '7 days',
    TRUE
  );
  
  RAISE NOTICE 'Bloqueo creado hasta: %', NOW() + INTERVAL '7 days';
  
  -- Validar reserva con bloqueo activo
  SELECT * INTO v_validation_result
  FROM public.validate_parking_spot_reservation(
    v_test_user_id,
    v_test_spot_id,
    v_test_date
  );
  
  RAISE NOTICE 'Resultado: is_valid=%, error_code=%, error_message=%',
    v_validation_result.is_valid,
    v_validation_result.error_code,
    v_validation_result.error_message;
  
  IF v_validation_result.is_valid = FALSE AND 
     v_validation_result.error_code = 'USER_BLOCKED' THEN
    RAISE NOTICE '✓ ÉXITO: La validación correctamente previene reservas de usuarios bloqueados';
  ELSE
    RAISE NOTICE '✗ ERROR: La validación no detectó el bloqueo correctamente';
  END IF;
  
  -- =====================================================
  -- PRUEBA 3: Verificar función is_user_blocked_by_checkin
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '=== PRUEBA 3: Función is_user_blocked_by_checkin ===';
  
  IF public.is_user_blocked_by_checkin(v_test_user_id) THEN
    RAISE NOTICE '✓ ÉXITO: is_user_blocked_by_checkin() retorna TRUE para usuario bloqueado';
  ELSE
    RAISE NOTICE '✗ ERROR: is_user_blocked_by_checkin() retorna FALSE para usuario bloqueado';
  END IF;
  
  -- =====================================================
  -- CLEANUP: Eliminar bloqueo de prueba
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '=== CLEANUP: Eliminando bloqueo de prueba ===';
  
  DELETE FROM public.user_blocks
  WHERE user_id = v_test_user_id
  AND reason = 'Prueba de validación de bloqueos';
  
  RAISE NOTICE 'Bloqueo de prueba eliminado';
  
  -- Verificar que el usuario ya no está bloqueado
  IF NOT public.is_user_blocked_by_checkin(v_test_user_id) THEN
    RAISE NOTICE '✓ ÉXITO: Usuario ya no está bloqueado después del cleanup';
  ELSE
    RAISE NOTICE '✗ ERROR: Usuario sigue bloqueado después del cleanup';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== PRUEBAS COMPLETADAS ===';
  
END $$;
