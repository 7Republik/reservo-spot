-- =====================================================
-- ELIMINAR DE WAITLIST AL RECHAZAR OFERTA
-- =====================================================
-- Cuando un usuario rechaza una oferta, debe salir
-- completamente de la lista de espera para ese grupo/fecha.
-- No puede volver a entrar en el ciclo para evitar bucles.
-- =====================================================

CREATE OR REPLACE FUNCTION public.reject_waitlist_offer(p_offer_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offer RECORD;
  v_penalty_enabled BOOLEAN;
  v_penalty_threshold INTEGER;
  v_current_rejection_count INTEGER;
BEGIN
  -- 1. Validar que la oferta existe y obtener sus datos
  SELECT 
    wo.id,
    wo.entry_id,
    wo.user_id,
    wo.spot_id,
    wo.reservation_date,
    wo.status
  INTO v_offer
  FROM waitlist_offers wo
  WHERE wo.id = p_offer_id;

  -- Verificar que la oferta existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Oferta no encontrada'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Validar que el usuario es el destinatario
  IF v_offer.user_id != p_user_id THEN
    RAISE EXCEPTION 'No tienes permiso para rechazar esta oferta'
      USING ERRCODE = 'P0001';
  END IF;

  -- 3. Validar que la oferta está pendiente
  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Esta oferta ya ha sido respondida'
      USING ERRCODE = 'P0001';
  END IF;

  -- 4. Actualizar oferta como rechazada
  UPDATE waitlist_offers
  SET 
    status = 'rejected',
    responded_at = NOW()
  WHERE id = p_offer_id;

  -- =====================================================
  -- CAMBIO CRÍTICO: Marcar entrada como 'rejected' en lugar de 'active'
  -- =====================================================
  -- El usuario rechazó la oferta, por lo tanto sale de la lista
  -- de espera para ese grupo/fecha. No puede volver a entrar
  -- en el ciclo para evitar bucles infinitos.
  -- =====================================================
  UPDATE waitlist_entries
  SET 
    status = 'rejected',
    updated_at = NOW()
  WHERE id = v_offer.entry_id;

  -- 6. Obtener configuración de penalización
  SELECT 
    waitlist_penalty_enabled,
    waitlist_penalty_threshold
  INTO 
    v_penalty_enabled,
    v_penalty_threshold
  FROM reservation_settings
  LIMIT 1;

  -- 7. Si penalización está habilitada, incrementar contador de rechazos
  IF v_penalty_enabled THEN
    -- Insertar o actualizar registro de penalización
    INSERT INTO waitlist_penalties (
      user_id,
      rejection_count,
      no_response_count,
      is_blocked,
      last_reset_at,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      1, -- Primer rechazo
      0,
      FALSE,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      rejection_count = waitlist_penalties.rejection_count + 1,
      updated_at = NOW();

    -- Obtener el contador actual de rechazos
    SELECT rejection_count INTO v_current_rejection_count
    FROM waitlist_penalties
    WHERE user_id = p_user_id;

    -- Verificar si alcanza el umbral (nota: no bloqueamos por rechazos, solo por no respuestas)
    -- Pero registramos el contador para futuras decisiones de negocio
  END IF;

  -- 8. Registrar en logs
  INSERT INTO waitlist_logs (
    user_id,
    entry_id,
    offer_id,
    action,
    details,
    created_at
  )
  VALUES (
    p_user_id,
    v_offer.entry_id,
    p_offer_id,
    'offer_rejected',
    jsonb_build_object(
      'spot_id', v_offer.spot_id,
      'reservation_date', v_offer.reservation_date,
      'rejected_at', NOW(),
      'rejection_count', v_current_rejection_count,
      'removed_from_waitlist', TRUE
    ),
    NOW()
  );

  -- 9. Llamar a process_waitlist_for_spot() para buscar siguiente usuario
  -- Esto se hace de forma asíncrona para no bloquear la respuesta al usuario
  PERFORM process_waitlist_for_spot(v_offer.spot_id, v_offer.reservation_date);

EXCEPTION
  WHEN OTHERS THEN
    -- Registrar error en logs
    INSERT INTO waitlist_logs (
      user_id,
      offer_id,
      action,
      details
    ) VALUES (
      p_user_id,
      p_offer_id,
      'error_occurred',
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'step', 'reject_offer'
      )
    );
    
    -- Re-lanzar la excepción para que el cliente la maneje
    RAISE;
END;
$$;

COMMENT ON FUNCTION reject_waitlist_offer IS 
  'Rechaza una oferta de waitlist y ELIMINA al usuario de la lista de espera para ese grupo/fecha. El usuario no volverá a recibir ofertas para evitar bucles infinitos.';
