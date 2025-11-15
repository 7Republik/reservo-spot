-- Migration: Add reject_waitlist_offer function
-- Description: Implements the function to reject a waitlist offer and process next user in queue
-- Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 14.3

-- Function to reject a waitlist offer
CREATE OR REPLACE FUNCTION public.reject_waitlist_offer(
  p_offer_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- 5. Actualizar entrada de lista de espera de vuelta a 'active'
  UPDATE waitlist_entries
  SET 
    status = 'active',
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
      'rejection_count', v_current_rejection_count
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

-- Comentarios de la función
COMMENT ON FUNCTION public.reject_waitlist_offer(UUID, UUID) IS 
'Rechaza una oferta de lista de espera. Valida que la oferta existe y el usuario 
es el destinatario. Actualiza el estado de la oferta a rechazada, mantiene al 
usuario en la lista de espera (status active), incrementa contador de rechazos 
si penalización está habilitada, y busca el siguiente usuario en la cola.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reject_waitlist_offer(UUID, UUID) TO authenticated;
