-- Migration: Add accept_waitlist_offer function
-- Description: Implements the function to accept a waitlist offer and create a reservation
-- Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 14.3

-- Function to accept a waitlist offer
CREATE OR REPLACE FUNCTION public.accept_waitlist_offer(
  p_offer_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer RECORD;
  v_reservation_id UUID;
  v_spot_available BOOLEAN;
BEGIN
  -- 1. Validar que la oferta existe y obtener sus datos
  SELECT 
    wo.id,
    wo.entry_id,
    wo.user_id,
    wo.spot_id,
    wo.reservation_date,
    wo.status,
    wo.expires_at
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
    RAISE EXCEPTION 'No tienes permiso para aceptar esta oferta'
      USING ERRCODE = 'P0001';
  END IF;

  -- 3. Validar que la oferta no ha expirado
  IF v_offer.expires_at < NOW() THEN
    RAISE EXCEPTION 'Esta oferta ha expirado'
      USING ERRCODE = 'P0001';
  END IF;

  -- 4. Validar que la oferta está pendiente
  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Esta oferta ya ha sido respondida'
      USING ERRCODE = 'P0001';
  END IF;

  -- 5. Verificar que la plaza sigue disponible (no hay reserva activa)
  SELECT NOT EXISTS (
    SELECT 1 
    FROM reservations r
    WHERE r.spot_id = v_offer.spot_id
      AND r.reservation_date = v_offer.reservation_date
      AND r.status = 'active'
  ) INTO v_spot_available;

  IF NOT v_spot_available THEN
    -- Marcar oferta como expirada si la plaza ya no está disponible
    UPDATE waitlist_offers
    SET 
      status = 'expired',
      responded_at = NOW()
    WHERE id = p_offer_id;

    RAISE EXCEPTION 'La plaza ya no está disponible'
      USING ERRCODE = 'P0001';
  END IF;

  -- 6. Crear reserva confirmada
  INSERT INTO reservations (
    user_id,
    spot_id,
    reservation_date,
    status,
    created_at
  )
  VALUES (
    p_user_id,
    v_offer.spot_id,
    v_offer.reservation_date,
    'active',
    NOW()
  )
  RETURNING id INTO v_reservation_id;

  -- 7. Actualizar oferta como aceptada
  UPDATE waitlist_offers
  SET 
    status = 'accepted',
    responded_at = NOW()
  WHERE id = p_offer_id;

  -- 8. Eliminar todas las entradas de lista de espera del usuario
  -- (el usuario sale de todas las listas al aceptar una oferta)
  DELETE FROM waitlist_entries
  WHERE user_id = p_user_id;

  -- 9. Registrar en logs
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
    'offer_accepted',
    jsonb_build_object(
      'reservation_id', v_reservation_id,
      'spot_id', v_offer.spot_id,
      'reservation_date', v_offer.reservation_date,
      'accepted_at', NOW()
    ),
    NOW()
  );

  -- 10. Retornar el ID de la reserva creada
  RETURN v_reservation_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-lanzar la excepción para que el cliente la maneje
    RAISE;
END;
$$;

-- Comentarios de la función
COMMENT ON FUNCTION public.accept_waitlist_offer(UUID, UUID) IS 
'Acepta una oferta de lista de espera y crea una reserva confirmada. 
Valida que la oferta existe, no ha expirado, el usuario es el destinatario, 
y la plaza sigue disponible. Elimina todas las entradas de lista de espera 
del usuario al aceptar.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_waitlist_offer(UUID, UUID) TO authenticated;
