-- =====================================================
-- FUNCIÓN: register_in_waitlist()
-- =====================================================
-- Registra a un usuario en la lista de espera para un grupo y fecha
-- Realiza todas las validaciones necesarias antes de crear la entrada
-- =====================================================

CREATE OR REPLACE FUNCTION public.register_in_waitlist(
  p_user_id UUID,
  p_group_id UUID,
  p_date DATE
)
RETURNS TABLE (
  success BOOLEAN,
  entry_id UUID,
  queue_position INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_penalty_status RECORD;
  v_new_entry_id UUID;
  v_position INTEGER;
  v_has_approved_plate BOOLEAN;
  v_has_group_access BOOLEAN;
  v_entry_exists BOOLEAN;
BEGIN
  -- =====================================================
  -- VALIDACIÓN 1: Lista de espera habilitada globalmente
  -- =====================================================
  SELECT * INTO v_settings
  FROM public.get_waitlist_settings()
  LIMIT 1;
  
  IF NOT v_settings.waitlist_enabled THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'El sistema de lista de espera está deshabilitado'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 2: Usuario tiene matrícula aprobada
  -- =====================================================
  SELECT EXISTS (
    SELECT 1 FROM public.license_plates lp
    WHERE lp.user_id = p_user_id
      AND lp.status = 'approved'
      AND lp.deleted_at IS NULL
  ) INTO v_has_approved_plate;
  
  IF NOT v_has_approved_plate THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'Debes tener una matrícula aprobada para registrarte en lista de espera'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 3: Usuario tiene acceso al grupo
  -- =====================================================
  SELECT EXISTS (
    SELECT 1 FROM public.user_group_assignments uga
    WHERE uga.user_id = p_user_id
      AND uga.group_id = p_group_id
  ) INTO v_has_group_access;
  
  IF NOT v_has_group_access THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'No tienes acceso a este grupo de parking'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 4: Usuario no excede límite de listas simultáneas
  -- =====================================================
  IF NOT public.check_user_waitlist_limit(p_user_id) THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      format('Has alcanzado el límite de %s listas de espera simultáneas', 
             v_settings.max_simultaneous)::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 5: Usuario no está bloqueado por penalización
  -- =====================================================
  SELECT * INTO v_penalty_status
  FROM public.check_user_penalty_status(p_user_id)
  LIMIT 1;
  
  IF v_penalty_status.is_blocked THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      format('Estás bloqueado temporalmente hasta %s por no responder ofertas', 
             to_char(v_penalty_status.blocked_until, 'DD/MM/YYYY HH24:MI'))::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 6: Usuario no está ya en lista para ese grupo/fecha
  -- =====================================================
  SELECT EXISTS (
    SELECT 1 FROM public.waitlist_entries we
    WHERE we.user_id = p_user_id
      AND we.group_id = p_group_id
      AND we.reservation_date = p_date
      AND we.status IN ('active', 'offer_pending')
  ) INTO v_entry_exists;
  
  IF v_entry_exists THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'Ya estás en la lista de espera para este grupo y fecha'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 7: Usuario está activo (no bloqueado/desactivado)
  -- =====================================================
  IF NOT public.is_user_active(p_user_id) THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'Tu cuenta está bloqueada o desactivada'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 8: Fecha no está en el pasado
  -- =====================================================
  IF p_date < CURRENT_DATE THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'No puedes registrarte en lista de espera para fechas pasadas'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 9: Grupo existe y está activo
  -- =====================================================
  IF NOT EXISTS (
    SELECT 1 FROM public.parking_groups pg
    WHERE pg.id = p_group_id
      AND pg.is_active = TRUE
  ) THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'El grupo de parking no existe o está desactivado'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- VALIDACIÓN 10: Fecha no está bloqueada
  -- =====================================================
  IF EXISTS (
    SELECT 1 FROM public.blocked_dates bd
    WHERE bd.blocked_date = p_date
      AND (bd.group_id = p_group_id OR bd.group_id IS NULL)
  ) THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'Esta fecha está bloqueada para reservas'::TEXT;
    RETURN;
  END IF;
  
  -- =====================================================
  -- CREAR ENTRADA EN LISTA DE ESPERA
  -- =====================================================
  INSERT INTO public.waitlist_entries (
    user_id,
    group_id,
    reservation_date,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_group_id,
    p_date,
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_entry_id;
  
  -- =====================================================
  -- CALCULAR POSICIÓN EN LA COLA
  -- =====================================================
  v_position := public.calculate_waitlist_position(v_new_entry_id);
  
  -- =====================================================
  -- REGISTRAR EN LOGS DE AUDITORÍA
  -- =====================================================
  INSERT INTO public.waitlist_logs (
    user_id,
    entry_id,
    action,
    details,
    created_at
  )
  VALUES (
    p_user_id,
    v_new_entry_id,
    'entry_created',
    jsonb_build_object(
      'group_id', p_group_id,
      'reservation_date', p_date,
      'position', v_position,
      'timestamp', NOW()
    ),
    NOW()
  );
  
  -- =====================================================
  -- RETORNAR RESULTADO EXITOSO
  -- =====================================================
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    v_new_entry_id::UUID,
    v_position::INTEGER,
    format('Registrado exitosamente en posición %s de la lista de espera', v_position)::TEXT;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Manejar violación de constraint único (race condition)
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      'Ya estás en la lista de espera para este grupo y fecha'::TEXT;
  WHEN OTHERS THEN
    -- Manejar cualquier otro error
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::INTEGER,
      format('Error al registrar en lista de espera: %s', SQLERRM)::TEXT;
END;
$$;

COMMENT ON FUNCTION public.register_in_waitlist(UUID, UUID, DATE) IS 
  'Registra a un usuario en la lista de espera con validaciones completas. Retorna success, entry_id, queue_position y message.';

-- =====================================================
-- GRANTS DE PERMISOS
-- =====================================================
-- Otorgar permisos de ejecución a usuarios autenticados

GRANT EXECUTE ON FUNCTION public.register_in_waitlist(UUID, UUID, DATE) TO authenticated;

-- =====================================================
-- FUNCIÓN AUXILIAR: cancel_waitlist_entry()
-- =====================================================
-- Permite a un usuario cancelar su registro en lista de espera

CREATE OR REPLACE FUNCTION public.cancel_waitlist_entry(
  p_entry_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
BEGIN
  -- Verificar que la entrada existe y pertenece al usuario
  SELECT * INTO v_entry
  FROM public.waitlist_entries
  WHERE id = p_entry_id
    AND user_id = p_user_id;
  
  IF v_entry IS NULL THEN
    RETURN QUERY SELECT 
      FALSE,
      'Entrada de lista de espera no encontrada'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar que la entrada está en estado activo
  IF v_entry.status NOT IN ('active', 'offer_pending') THEN
    RETURN QUERY SELECT 
      FALSE,
      'Esta entrada ya no está activa'::TEXT;
    RETURN;
  END IF;
  
  -- Actualizar estado a cancelada
  UPDATE public.waitlist_entries
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_entry_id;
  
  -- Registrar en logs
  INSERT INTO public.waitlist_logs (
    user_id,
    entry_id,
    action,
    details,
    created_at
  )
  VALUES (
    p_user_id,
    p_entry_id,
    'entry_cancelled',
    jsonb_build_object(
      'group_id', v_entry.group_id,
      'reservation_date', v_entry.reservation_date,
      'cancelled_by_user', TRUE,
      'timestamp', NOW()
    ),
    NOW()
  );
  
  RETURN QUERY SELECT 
    TRUE,
    'Registro en lista de espera cancelado exitosamente'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE,
      format('Error al cancelar registro: %s', SQLERRM)::TEXT;
END;
$$;

COMMENT ON FUNCTION public.cancel_waitlist_entry(UUID, UUID) IS 
  'Permite a un usuario cancelar voluntariamente su registro en lista de espera';

GRANT EXECUTE ON FUNCTION public.cancel_waitlist_entry(UUID, UUID) TO authenticated;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
