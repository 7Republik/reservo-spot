-- =====================================================
-- ARREGLAR ZONA HORARIA EN CHECK-IN
-- =====================================================
-- Problema: perform_checkin usa CURRENT_DATE (UTC) para validar
-- pero las reservas se guardan con fecha local del usuario
-- Solución: Comparar con la fecha en la zona horaria del usuario
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
  v_user_date DATE;
BEGIN
  -- Calcular la fecha local del usuario (asumiendo Europa/Madrid UTC+1)
  -- En producción, esto debería venir del perfil del usuario
  v_user_date := (NOW() AT TIME ZONE 'Europe/Madrid')::DATE;
  
  -- Verificar si el usuario está bloqueado
  SELECT public.is_user_blocked_by_checkin(p_user_id) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_BLOCKED',
      'message', 'Tu cuenta está bloqueada temporalmente. No puedes hacer check-in.'
    );
  END IF;

  -- Verificar que la reserva existe y pertenece al usuario
  -- CAMBIO: Usar v_user_date en lugar de CURRENT_DATE
  SELECT r.*, ps.group_id INTO v_reservation
  FROM public.reservations r
  JOIN public.parking_spots ps ON r.spot_id = ps.id
  WHERE r.id = p_reservation_id 
    AND r.user_id = p_user_id
    AND r.status = 'active'
    AND r.reservation_date = v_user_date;
  
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
  
  -- Calcular ventana de check-in (usando la fecha local del usuario)
  v_window_end := (v_user_date::TIMESTAMPTZ AT TIME ZONE 'Europe/Madrid') + 
    INTERVAL '1 hour' * COALESCE(
      CASE WHEN v_group_config.use_custom_config THEN v_group_config.custom_checkin_window_hours ELSE NULL END,
      v_settings.default_checkin_window_hours
    );
  
  v_grace_end := v_window_end + INTERVAL '1 minute' * v_settings.grace_period_minutes;
  
  -- Determinar si es tarde (comparar con hora local)
  v_is_late := (NOW() AT TIME ZONE 'Europe/Madrid') > v_grace_end;
  
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
      'checkin', v_user_date,
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
'Registra el check-in de un usuario. Usa la zona horaria Europe/Madrid para validar la fecha local del usuario.';
