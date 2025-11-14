-- =====================================================
-- ARREGLAR CASOS EDGE EN CHECK-IN/CHECK-OUT
-- =====================================================
-- Casos cubiertos:
-- #2: Checkout en reserva cancelada
-- #5: Checkout después de medianoche
-- #7: Check-in de usuario bloqueado
-- #8: Checkout con plaza desactivada
-- #10: Validar estado de reserva en checkout
-- =====================================================

-- =====================================================
-- ACTUALIZAR perform_checkin: Validar usuario bloqueado
-- =====================================================

CREATE OR REPLACE FUNCTION public.perform_checkin(
  p_reservation_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_reservation RECORD;
  v_checkin_record RECORD;
  v_group_config RECORD;
  v_settings RECORD;
  v_window_end TIMESTAMPTZ;
  v_grace_end TIMESTAMPTZ;
  v_is_late BOOLEAN;
  v_is_blocked BOOLEAN;
BEGIN
  -- CASO #7: Verificar si el usuario está bloqueado
  SELECT public.is_user_blocked_by_checkin(p_user_id) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_BLOCKED',
      'message', 'Tu cuenta está bloqueada temporalmente. No puedes hacer check-in.'
    );
  END IF;

  -- Verificar que la reserva existe y pertenece al usuario
  SELECT r.*, ps.group_id INTO v_reservation
  FROM public.reservations r
  JOIN public.parking_spots ps ON r.spot_id = ps.id
  WHERE r.id = p_reservation_id 
    AND r.user_id = p_user_id
    AND r.status = 'active'
    AND r.reservation_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'NO_ACTIVE_RESERVATION',
      'message', 'Reserva no encontrada o no válida para hoy'
    );
  END IF;
  
  -- Obtener configuración global
  SELECT * INTO v_settings 
  FROM public.checkin_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'SYSTEM_DISABLED',
      'message', 'Sistema de check-in desactivado'
    );
  END IF;
  
  -- Verificar configuración del grupo
  SELECT * INTO v_group_config 
  FROM public.parking_group_checkin_config 
  WHERE group_id = v_reservation.group_id;
  
  IF v_group_config IS NOT NULL AND NOT v_group_config.enabled THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'GROUP_DISABLED',
      'message', 'Check-in desactivado para este grupo'
    );
  END IF;
  
  -- Verificar si ya existe check-in
  SELECT * INTO v_checkin_record 
  FROM public.reservation_checkins 
  WHERE reservation_id = p_reservation_id;
  
  IF v_checkin_record IS NOT NULL AND v_checkin_record.checkin_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'ALREADY_CHECKED_IN',
      'message', 'Check-in ya realizado',
      'checkin_at', v_checkin_record.checkin_at
    );
  END IF;
  
  -- Calcular ventana de check-in
  v_window_end := CURRENT_DATE::TIMESTAMPTZ + 
    INTERVAL '1 hour' * COALESCE(
      CASE WHEN v_group_config.use_custom_config THEN v_group_config.custom_checkin_window_hours ELSE NULL END,
      v_settings.default_checkin_window_hours
    );
  
  v_grace_end := v_window_end + INTERVAL '1 minute' * v_settings.grace_period_minutes;
  
  -- Determinar si es tarde
  v_is_late := NOW() > v_grace_end;
  
  -- Crear o actualizar registro de check-in
  INSERT INTO public.reservation_checkins (
    reservation_id, user_id, spot_id, group_id, checkin_at
  ) VALUES (
    p_reservation_id, p_user_id, v_reservation.spot_id, v_reservation.group_id, NOW()
  )
  ON CONFLICT (reservation_id) DO UPDATE
  SET checkin_at = NOW(), updated_at = NOW();
  
  -- Si es tarde, registrar infracción
  IF v_is_late THEN
    INSERT INTO public.checkin_infractions (
      user_id, reservation_id, spot_id, group_id,
      infraction_type, infraction_date,
      expected_checkin_window_end, grace_period_end
    ) VALUES (
      p_user_id, p_reservation_id, v_reservation.spot_id, v_reservation.group_id,
      'checkin', CURRENT_DATE,
      v_window_end, v_grace_end
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'checkin_at', NOW(),
    'was_late', v_is_late,
    'message', CASE 
      WHEN v_is_late THEN 'Check-in realizado fuera de tiempo'
      ELSE 'Check-in realizado correctamente'
    END
  );
END;
$$;

COMMENT ON FUNCTION public.perform_checkin IS 
'Registra el check-in de un usuario. Valida que el usuario no esté bloqueado, que la reserva sea activa y que el sistema esté habilitado.';


-- =====================================================
-- ACTUALIZAR perform_checkout: Validar estado y buscar por reservation_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.perform_checkout(
  p_reservation_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_checkin_record RECORD;
  v_reservation RECORD;
BEGIN
  -- CASO #10: Verificar que la reserva existe y está activa
  SELECT * INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
    AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'RESERVATION_NOT_FOUND',
      'message', 'Reserva no encontrada'
    );
  END IF;
  
  -- CASO #2: Validar que la reserva no esté cancelada
  IF v_reservation.status = 'cancelled' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'RESERVATION_CANCELLED',
      'message', 'No puedes hacer checkout de una reserva cancelada'
    );
  END IF;
  
  -- CASO #10: Validar que la reserva esté activa
  IF v_reservation.status = 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_COMPLETED',
      'message', 'Esta reserva ya fue completada'
    );
  END IF;
  
  -- CASO #5: Buscar check-in por reservation_id (no por fecha)
  -- Esto permite checkout después de medianoche
  SELECT * INTO v_checkin_record
  FROM public.reservation_checkins
  WHERE reservation_id = p_reservation_id
    AND user_id = p_user_id
    AND checkin_at IS NOT NULL
    AND checkout_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'NO_CHECKIN_FOUND',
      'message', 'No hay check-in activo para esta reserva'
    );
  END IF;
  
  -- Registrar checkout
  UPDATE public.reservation_checkins
  SET checkout_at = NOW(), updated_at = NOW()
  WHERE id = v_checkin_record.id;
  
  -- Marcar la reserva como completada
  UPDATE public.reservations
  SET status = 'completed'
  WHERE id = p_reservation_id;
  
  RETURN json_build_object(
    'success', true,
    'checkout_at', NOW(),
    'checkin_at', v_checkin_record.checkin_at,
    'duration_minutes', EXTRACT(EPOCH FROM (NOW() - v_checkin_record.checkin_at)) / 60,
    'message', 'Check-out realizado correctamente'
  );
END;
$$;

COMMENT ON FUNCTION public.perform_checkout IS 
'Registra el check-out de un usuario y marca la reserva como completada. Valida el estado de la reserva y permite checkout después de medianoche (caso #5).';
