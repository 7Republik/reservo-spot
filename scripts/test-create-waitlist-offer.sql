-- =====================================================
-- Script de Prueba: create_waitlist_offer()
-- Descripción: Verifica que la función crea ofertas correctamente
-- =====================================================

-- Limpiar datos de prueba anteriores
DELETE FROM public.waitlist_offers WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test_waitlist_%@example.com'
);
DELETE FROM public.waitlist_logs WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test_waitlist_%@example.com'
);
DELETE FROM public.waitlist_entries WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test_waitlist_%@example.com'
);

-- =====================================================
-- TEST 1: Crear oferta exitosamente
-- =====================================================
DO $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
  v_spot_id UUID;
  v_entry_id UUID;
  v_offer_id UUID;
  v_offer_record RECORD;
  v_entry_record RECORD;
  v_log_count INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 1: Crear oferta exitosamente ===';

  -- Obtener usuario de prueba
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'test_waitlist_user1@example.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario de prueba no encontrado. Ejecutar test-register-in-waitlist.sql primero';
  END IF;

  -- Obtener grupo y spot
  SELECT id INTO v_group_id
  FROM public.parking_groups
  WHERE is_active = true
  LIMIT 1;

  SELECT id INTO v_spot_id
  FROM public.parking_spots
  WHERE group_id = v_group_id
    AND is_active = true
  LIMIT 1;

  -- Crear entrada de lista de espera
  INSERT INTO public.waitlist_entries (
    user_id,
    group_id,
    reservation_date,
    status
  )
  VALUES (
    v_user_id,
    v_group_id,
    CURRENT_DATE + INTERVAL '3 days',
    'active'
  )
  RETURNING id INTO v_entry_id;

  RAISE NOTICE 'Entrada creada: %', v_entry_id;

  -- Llamar a la función
  v_offer_id := public.create_waitlist_offer(v_entry_id, v_spot_id);

  RAISE NOTICE 'Oferta creada: %', v_offer_id;

  -- Verificar que la oferta se creó correctamente
  SELECT * INTO v_offer_record
  FROM public.waitlist_offers
  WHERE id = v_offer_id;

  ASSERT v_offer_record.id IS NOT NULL, 'Oferta no encontrada';
  ASSERT v_offer_record.entry_id = v_entry_id, 'entry_id incorrecto';
  ASSERT v_offer_record.user_id = v_user_id, 'user_id incorrecto';
  ASSERT v_offer_record.spot_id = v_spot_id, 'spot_id incorrecto';
  ASSERT v_offer_record.status = 'pending', 'Status debe ser pending';
  ASSERT v_offer_record.expires_at > NOW(), 'expires_at debe ser futuro';
  ASSERT v_offer_record.expires_at <= NOW() + INTERVAL '24 hours', 'expires_at debe estar dentro de 24 horas';

  RAISE NOTICE '✓ Oferta creada correctamente';
  RAISE NOTICE '  - Status: %', v_offer_record.status;
  RAISE NOTICE '  - Expira en: %', v_offer_record.expires_at - NOW();

  -- Verificar que la entrada se actualizó a 'offer_pending'
  SELECT * INTO v_entry_record
  FROM public.waitlist_entries
  WHERE id = v_entry_id;

  ASSERT v_entry_record.status = 'offer_pending', 'Status de entrada debe ser offer_pending';

  RAISE NOTICE '✓ Entrada actualizada a offer_pending';

  -- Verificar que se registró en logs
  SELECT COUNT(*) INTO v_log_count
  FROM public.waitlist_logs
  WHERE offer_id = v_offer_id
    AND action = 'offer_created';

  ASSERT v_log_count = 1, 'Debe haber 1 log de offer_created';

  RAISE NOTICE '✓ Log registrado correctamente';

  RAISE NOTICE '=== TEST 1: PASADO ===';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✗ TEST 1: FALLADO';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
END $$;

-- =====================================================
-- TEST 2: Error al crear oferta con entrada inválida
-- =====================================================
DO $$
DECLARE
  v_spot_id UUID;
  v_offer_id UUID;
  v_error_occurred BOOLEAN := false;
BEGIN
  RAISE NOTICE '=== TEST 2: Error con entrada inválida ===';

  -- Obtener spot válido
  SELECT id INTO v_spot_id
  FROM public.parking_spots
  WHERE is_active = true
  LIMIT 1;

  -- Intentar crear oferta con UUID aleatorio (entrada no existe)
  BEGIN
    v_offer_id := public.create_waitlist_offer(
      gen_random_uuid(),
      v_spot_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      v_error_occurred := true;
      RAISE NOTICE '✓ Error capturado correctamente: %', SQLERRM;
  END;

  ASSERT v_error_occurred, 'Debería haber lanzado error';

  RAISE NOTICE '=== TEST 2: PASADO ===';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✗ TEST 2: FALLADO';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
END $$;

-- =====================================================
-- TEST 3: Verificar tiempo de expiración configurable
-- =====================================================
DO $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
  v_spot_id UUID;
  v_entry_id UUID;
  v_offer_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_expected_minutes INTEGER := 60;
  v_actual_minutes INTEGER;
BEGIN
  RAISE NOTICE '=== TEST 3: Tiempo de expiración configurable ===';

  -- Configurar tiempo de aceptación a 60 minutos
  UPDATE public.reservation_settings
  SET waitlist_acceptance_time_minutes = v_expected_minutes;

  -- Obtener usuario de prueba
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'test_waitlist_user1@example.com'
  LIMIT 1;

  -- Obtener grupo y spot
  SELECT id INTO v_group_id
  FROM public.parking_groups
  WHERE is_active = true
  LIMIT 1;

  SELECT id INTO v_spot_id
  FROM public.parking_spots
  WHERE group_id = v_group_id
    AND is_active = true
  LIMIT 1;

  -- Crear entrada de lista de espera
  INSERT INTO public.waitlist_entries (
    user_id,
    group_id,
    reservation_date,
    status
  )
  VALUES (
    v_user_id,
    v_group_id,
    CURRENT_DATE + INTERVAL '4 days',
    'active'
  )
  RETURNING id INTO v_entry_id;

  -- Crear oferta
  v_offer_id := public.create_waitlist_offer(v_entry_id, v_spot_id);

  -- Verificar tiempo de expiración
  SELECT expires_at INTO v_expires_at
  FROM public.waitlist_offers
  WHERE id = v_offer_id;

  v_actual_minutes := EXTRACT(EPOCH FROM (v_expires_at - NOW())) / 60;

  RAISE NOTICE 'Tiempo configurado: % minutos', v_expected_minutes;
  RAISE NOTICE 'Tiempo real: % minutos', v_actual_minutes;

  -- Permitir margen de 1 minuto
  ASSERT v_actual_minutes >= v_expected_minutes - 1 
    AND v_actual_minutes <= v_expected_minutes + 1,
    'Tiempo de expiración incorrecto';

  RAISE NOTICE '✓ Tiempo de expiración correcto';

  -- Restaurar configuración por defecto
  UPDATE public.reservation_settings
  SET waitlist_acceptance_time_minutes = 120;

  RAISE NOTICE '=== TEST 3: PASADO ===';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✗ TEST 3: FALLADO';
    RAISE NOTICE 'Error: %', SQLERRM;
    -- Restaurar configuración
    UPDATE public.reservation_settings
    SET waitlist_acceptance_time_minutes = 120;
    RAISE;
END $$;

-- =====================================================
-- TEST 4: Verificar detalles en logs
-- =====================================================
DO $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
  v_spot_id UUID;
  v_entry_id UUID;
  v_offer_id UUID;
  v_log_details JSONB;
BEGIN
  RAISE NOTICE '=== TEST 4: Detalles en logs ===';

  -- Obtener usuario de prueba
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'test_waitlist_user1@example.com'
  LIMIT 1;

  -- Obtener grupo y spot
  SELECT id INTO v_group_id
  FROM public.parking_groups
  WHERE is_active = true
  LIMIT 1;

  SELECT id INTO v_spot_id
  FROM public.parking_spots
  WHERE group_id = v_group_id
    AND is_active = true
  LIMIT 1;

  -- Crear entrada de lista de espera
  INSERT INTO public.waitlist_entries (
    user_id,
    group_id,
    reservation_date,
    status
  )
  VALUES (
    v_user_id,
    v_group_id,
    CURRENT_DATE + INTERVAL '5 days',
    'active'
  )
  RETURNING id INTO v_entry_id;

  -- Crear oferta
  v_offer_id := public.create_waitlist_offer(v_entry_id, v_spot_id);

  -- Verificar detalles del log
  SELECT details INTO v_log_details
  FROM public.waitlist_logs
  WHERE offer_id = v_offer_id
    AND action = 'offer_created'
  LIMIT 1;

  ASSERT v_log_details IS NOT NULL, 'Log details no encontrado';
  ASSERT v_log_details->>'spot_id' IS NOT NULL, 'spot_id falta en details';
  ASSERT v_log_details->>'spot_number' IS NOT NULL, 'spot_number falta en details';
  ASSERT v_log_details->>'group_name' IS NOT NULL, 'group_name falta en details';
  ASSERT v_log_details->>'reservation_date' IS NOT NULL, 'reservation_date falta en details';
  ASSERT v_log_details->>'expires_at' IS NOT NULL, 'expires_at falta en details';
  ASSERT v_log_details->>'acceptance_time_minutes' IS NOT NULL, 'acceptance_time_minutes falta en details';

  RAISE NOTICE '✓ Log contiene todos los detalles necesarios';
  RAISE NOTICE '  - Spot: %', v_log_details->>'spot_number';
  RAISE NOTICE '  - Grupo: %', v_log_details->>'group_name';
  RAISE NOTICE '  - Fecha: %', v_log_details->>'reservation_date';

  RAISE NOTICE '=== TEST 4: PASADO ===';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✗ TEST 4: FALLADO';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
END $$;

-- =====================================================
-- Resumen de Pruebas
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RESUMEN: Todas las pruebas de create_waitlist_offer() pasaron exitosamente';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Funcionalidades verificadas:';
  RAISE NOTICE '✓ Creación de oferta con datos correctos';
  RAISE NOTICE '✓ Actualización de entrada a offer_pending';
  RAISE NOTICE '✓ Registro en logs con detalles completos';
  RAISE NOTICE '✓ Cálculo correcto de tiempo de expiración';
  RAISE NOTICE '✓ Manejo de errores con entradas inválidas';
  RAISE NOTICE '✓ Configuración de tiempo de aceptación respetada';
  RAISE NOTICE '';
END $$;
