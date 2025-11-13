-- =====================================================
-- FUNCIONES DE BASE DE DATOS PARA SISTEMA DE CHECK-IN/CHECK-OUT
-- =====================================================
-- Descripción: Implementa todas las funciones necesarias para el sistema
-- de check-in/check-out, incluyendo validación, detección de infracciones,
-- generación de amonestaciones y funciones auxiliares.
-- =====================================================

-- =====================================================
-- 2.1 FUNCIÓN: perform_checkin()
-- =====================================================
-- Descripción: Registra el check-in de un usuario para su reserva activa
-- Valida permisos, configuración y detecta check-ins tardíos
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
BEGIN
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
    ON CONFLICT DO NOTHING; -- Evitar duplicados
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

-- Comentario de la función
COMMENT ON FUNCTION public.perform_checkin IS 
'Registra el check-in de un usuario para su reserva activa del día. Valida permisos, configuración del sistema y grupo, y detecta check-ins tardíos registrando infracciones automáticamente.';


-- =====================================================
-- 2.2 FUNCIÓN: perform_checkout()
-- =====================================================
-- Descripción: Registra el check-out de un usuario
-- Marca la plaza como disponible para el día actual
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
BEGIN
  -- Verificar que existe check-in activo
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
  
  -- La plaza se marca como disponible automáticamente
  -- mediante la función get_available_spots_with_checkout()
  
  RETURN json_build_object(
    'success', true,
    'checkout_at', NOW(),
    'checkin_at', v_checkin_record.checkin_at,
    'duration_minutes', EXTRACT(EPOCH FROM (NOW() - v_checkin_record.checkin_at)) / 60,
    'message', 'Check-out realizado correctamente'
  );
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.perform_checkout IS 
'Registra el check-out de un usuario para su reserva activa. La plaza queda disponible para reservas del mismo día.';


-- =====================================================
-- 2.3 FUNCIÓN: detect_checkin_infractions()
-- =====================================================
-- Descripción: Detecta reservas sin check-in que superaron
-- el periodo de gracia y registra infracciones
-- =====================================================

CREATE OR REPLACE FUNCTION public.detect_checkin_infractions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_infractions_created INTEGER := 0;
  v_reservation RECORD;
  v_group_config RECORD;
  v_window_end TIMESTAMPTZ;
  v_grace_end TIMESTAMPTZ;
BEGIN
  -- Obtener configuración global
  SELECT * INTO v_settings 
  FROM public.checkin_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN 0;
  END IF;
  
  -- Buscar reservas de hoy sin check-in que ya pasaron la ventana + gracia
  FOR v_reservation IN
    SELECT r.*, ps.group_id, rc.id as checkin_id
    FROM public.reservations r
    JOIN public.parking_spots ps ON r.spot_id = ps.id
    LEFT JOIN public.reservation_checkins rc ON r.id = rc.reservation_id
    WHERE r.reservation_date = CURRENT_DATE
      AND r.status = 'active'
      AND (rc.checkin_at IS NULL OR rc.id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM public.checkin_infractions ci
        WHERE ci.reservation_id = r.id AND ci.infraction_type = 'checkin'
      )
  LOOP
    -- Obtener configuración del grupo
    SELECT * INTO v_group_config
    FROM public.parking_group_checkin_config
    WHERE group_id = v_reservation.group_id;
    
    -- Si el grupo tiene check-in desactivado, saltar
    IF v_group_config IS NOT NULL AND NOT v_group_config.enabled THEN
      CONTINUE;
    END IF;
    
    -- Calcular ventana de check-in
    v_window_end := CURRENT_DATE::TIMESTAMPTZ + 
      INTERVAL '1 hour' * COALESCE(
        CASE WHEN v_group_config.use_custom_config THEN v_group_config.custom_checkin_window_hours ELSE NULL END,
        v_settings.default_checkin_window_hours
      );
    
    v_grace_end := v_window_end + INTERVAL '1 minute' * v_settings.grace_period_minutes;
    
    -- Si ya pasó el periodo de gracia, registrar infracción
    IF NOW() > v_grace_end THEN
      INSERT INTO public.checkin_infractions (
        user_id, reservation_id, spot_id, group_id,
        infraction_type, infraction_date,
        expected_checkin_window_end, grace_period_end
      ) VALUES (
        v_reservation.user_id, v_reservation.id, v_reservation.spot_id, v_reservation.group_id,
        'checkin', CURRENT_DATE,
        v_window_end, v_grace_end
      )
      ON CONFLICT DO NOTHING;
      
      v_infractions_created := v_infractions_created + 1;
    END IF;
  END LOOP;
  
  RETURN v_infractions_created;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.detect_checkin_infractions IS 
'Detecta reservas activas del día sin check-in que superaron el periodo de gracia y registra infracciones automáticamente. Excluye grupos con check-in desactivado.';


-- =====================================================
-- 2.4 FUNCIÓN: detect_checkout_infractions()
-- =====================================================
-- Descripción: Detecta check-ins de días anteriores sin checkout
-- Excluye reservas continuas activas
-- =====================================================

CREATE OR REPLACE FUNCTION public.detect_checkout_infractions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_infractions_created INTEGER := 0;
  v_checkin RECORD;
BEGIN
  -- Obtener configuración global
  SELECT * INTO v_settings 
  FROM public.checkin_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN 0;
  END IF;
  
  -- Buscar check-ins de días anteriores sin checkout
  FOR v_checkin IN
    SELECT rc.*, r.reservation_date
    FROM public.reservation_checkins rc
    JOIN public.reservations r ON rc.reservation_id = r.id
    WHERE rc.checkin_at IS NOT NULL
      AND rc.checkout_at IS NULL
      AND r.reservation_date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.checkin_infractions ci
        WHERE ci.reservation_id = rc.reservation_id AND ci.infraction_type = 'checkout'
      )
      -- Excluir reservas continuas que aún están activas
      AND NOT (
        rc.is_continuous_reservation = TRUE 
        AND rc.continuous_end_date >= CURRENT_DATE
      )
  LOOP
    INSERT INTO public.checkin_infractions (
      user_id, reservation_id, spot_id, group_id,
      infraction_type, infraction_date
    ) VALUES (
      v_checkin.user_id, v_checkin.reservation_id, v_checkin.spot_id, v_checkin.group_id,
      'checkout', v_checkin.reservation_date
    )
    ON CONFLICT DO NOTHING;
    
    v_infractions_created := v_infractions_created + 1;
  END LOOP;
  
  RETURN v_infractions_created;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.detect_checkout_infractions IS 
'Detecta check-ins de días anteriores sin checkout y registra infracciones. Excluye reservas continuas que aún están activas.';


-- =====================================================
-- 2.5 FUNCIÓN: generate_automatic_warnings()
-- =====================================================
-- Descripción: Genera amonestaciones automáticas cuando un usuario
-- alcanza el umbral de infracciones y aplica bloqueo temporal
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_automatic_warnings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_warnings_created INTEGER := 0;
  v_user_infractions RECORD;
  v_warning_id UUID;
  v_block_until TIMESTAMPTZ;
  v_system_user_id UUID := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
  SELECT * INTO v_settings 
  FROM public.checkin_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN 0;
  END IF;
  
  -- Procesar infracciones de check-in
  FOR v_user_infractions IN
    SELECT user_id, COUNT(*) as infraction_count
    FROM public.checkin_infractions
    WHERE infraction_type = 'checkin'
      AND warning_generated = FALSE
    GROUP BY user_id
    HAVING COUNT(*) >= v_settings.checkin_infraction_threshold
  LOOP
    -- Crear amonestación
    INSERT INTO public.user_warnings (
      user_id, 
      issued_by, 
      reason, 
      warning_type,
      infraction_count,
      auto_generated
    ) VALUES (
      v_user_infractions.user_id,
      v_system_user_id,
      format('Amonestación automática por %s infracciones de check-in', v_user_infractions.infraction_count),
      'automatic_checkin',
      v_user_infractions.infraction_count,
      TRUE
    )
    RETURNING id INTO v_warning_id;
    
    -- Marcar infracciones como procesadas
    UPDATE public.checkin_infractions
    SET warning_generated = TRUE, warning_id = v_warning_id
    WHERE user_id = v_user_infractions.user_id
      AND infraction_type = 'checkin'
      AND warning_generated = FALSE;
    
    -- Crear bloqueo temporal
    v_block_until := NOW() + INTERVAL '1 day' * v_settings.temporary_block_days;
    
    INSERT INTO public.user_blocks (
      user_id, block_type, reason, blocked_until, warning_id
    ) VALUES (
      v_user_infractions.user_id,
      'automatic_checkin',
      format('Bloqueo automático por %s infracciones de check-in', v_user_infractions.infraction_count),
      v_block_until,
      v_warning_id
    );
    
    -- Cancelar reservas futuras durante el periodo de bloqueo
    UPDATE public.reservations
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE user_id = v_user_infractions.user_id
      AND reservation_date BETWEEN CURRENT_DATE AND v_block_until::DATE
      AND status = 'active';
    
    v_warnings_created := v_warnings_created + 1;
  END LOOP;
  
  -- Procesar infracciones de check-out
  FOR v_user_infractions IN
    SELECT user_id, COUNT(*) as infraction_count
    FROM public.checkin_infractions
    WHERE infraction_type = 'checkout'
      AND warning_generated = FALSE
    GROUP BY user_id
    HAVING COUNT(*) >= v_settings.checkout_infraction_threshold
  LOOP
    INSERT INTO public.user_warnings (
      user_id, 
      issued_by, 
      reason, 
      warning_type,
      infraction_count,
      auto_generated
    ) VALUES (
      v_user_infractions.user_id,
      v_system_user_id,
      format('Amonestación automática por %s infracciones de check-out', v_user_infractions.infraction_count),
      'automatic_checkout',
      v_user_infractions.infraction_count,
      TRUE
    )
    RETURNING id INTO v_warning_id;
    
    UPDATE public.checkin_infractions
    SET warning_generated = TRUE, warning_id = v_warning_id
    WHERE user_id = v_user_infractions.user_id
      AND infraction_type = 'checkout'
      AND warning_generated = FALSE;
    
    v_block_until := NOW() + INTERVAL '1 day' * v_settings.temporary_block_days;
    
    INSERT INTO public.user_blocks (
      user_id, block_type, reason, blocked_until, warning_id
    ) VALUES (
      v_user_infractions.user_id,
      'automatic_checkout',
      format('Bloqueo automático por %s infracciones de check-out', v_user_infractions.infraction_count),
      v_block_until,
      v_warning_id
    );
    
    UPDATE public.reservations
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE user_id = v_user_infractions.user_id
      AND reservation_date BETWEEN CURRENT_DATE AND v_block_until::DATE
      AND status = 'active';
    
    v_warnings_created := v_warnings_created + 1;
  END LOOP;
  
  RETURN v_warnings_created;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.generate_automatic_warnings IS 
'Genera amonestaciones automáticas cuando un usuario alcanza el umbral de infracciones configurado. Crea bloqueos temporales y cancela reservas futuras durante el periodo de bloqueo.';


-- =====================================================
-- 2.6 FUNCIONES AUXILIARES
-- =====================================================

-- Función: is_user_blocked_by_checkin()
-- Verifica si un usuario tiene un bloqueo activo por infracciones de check-in/checkout
CREATE OR REPLACE FUNCTION public.is_user_blocked_by_checkin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE user_id = p_user_id
      AND is_active = TRUE
      AND blocked_until > NOW()
      AND block_type IN ('automatic_checkin', 'automatic_checkout')
  );
$$;

COMMENT ON FUNCTION public.is_user_blocked_by_checkin IS 
'Verifica si un usuario tiene un bloqueo activo por infracciones de check-in o check-out.';


-- Función: get_available_spots_with_checkout()
-- Obtiene plazas disponibles incluyendo las liberadas por checkout el mismo día
CREATE OR REPLACE FUNCTION public.get_available_spots_with_checkout(
  p_group_id UUID,
  p_date DATE
)
RETURNS TABLE (
  spot_id UUID,
  spot_number TEXT,
  is_early_checkout BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ps.id as spot_id,
    ps.spot_number,
    CASE 
      WHEN rc.checkout_at IS NOT NULL AND p_date = CURRENT_DATE THEN TRUE
      ELSE FALSE
    END as is_early_checkout
  FROM public.parking_spots ps
  LEFT JOIN public.reservations r ON ps.id = r.spot_id 
    AND r.reservation_date = p_date 
    AND r.status = 'active'
  LEFT JOIN public.reservation_checkins rc ON r.id = rc.reservation_id
  WHERE ps.is_active = TRUE
    AND (p_group_id IS NULL OR ps.group_id = p_group_id)
    AND (
      r.id IS NULL  -- No hay reserva
      OR (rc.checkout_at IS NOT NULL AND p_date = CURRENT_DATE)  -- Checkout realizado hoy
    )
  ORDER BY ps.spot_number;
$$;

COMMENT ON FUNCTION public.get_available_spots_with_checkout IS 
'Obtiene plazas disponibles para un grupo y fecha, incluyendo plazas liberadas por checkout el mismo día.';


-- Función: send_checkin_reminders()
-- Placeholder para sistema de notificaciones (implementación futura)
CREATE OR REPLACE FUNCTION public.send_checkin_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_reminders_sent INTEGER := 0;
BEGIN
  -- Obtener configuración
  SELECT * INTO v_settings 
  FROM public.checkin_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled OR NOT v_settings.send_checkin_reminders THEN
    RETURN 0;
  END IF;
  
  -- TODO: Implementar lógica de notificaciones
  -- Esta función será implementada cuando se integre el sistema de notificaciones
  
  RETURN v_reminders_sent;
END;
$$;

COMMENT ON FUNCTION public.send_checkin_reminders IS 
'Envía recordatorios de check-in a usuarios con reservas activas. Implementación pendiente de integración con sistema de notificaciones.';


-- =====================================================
-- PERMISOS Y SEGURIDAD
-- =====================================================

-- Revocar permisos públicos
REVOKE ALL ON FUNCTION public.perform_checkin FROM PUBLIC;
REVOKE ALL ON FUNCTION public.perform_checkout FROM PUBLIC;
REVOKE ALL ON FUNCTION public.detect_checkin_infractions FROM PUBLIC;
REVOKE ALL ON FUNCTION public.detect_checkout_infractions FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_automatic_warnings FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_user_blocked_by_checkin FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_available_spots_with_checkout FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_checkin_reminders FROM PUBLIC;

-- Otorgar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.perform_checkin TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_checkout TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_blocked_by_checkin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_spots_with_checkout TO authenticated;

-- Funciones administrativas solo para service_role
GRANT EXECUTE ON FUNCTION public.detect_checkin_infractions TO service_role;
GRANT EXECUTE ON FUNCTION public.detect_checkout_infractions TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_automatic_warnings TO service_role;
GRANT EXECUTE ON FUNCTION public.send_checkin_reminders TO service_role;
