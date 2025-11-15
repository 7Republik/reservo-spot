-- =====================================================
-- Función: create_waitlist_offer
-- Descripción: Crea una oferta de reserva para un usuario en lista de espera
-- Autor: Sistema de Lista de Espera
-- Fecha: 2025-11-15
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_waitlist_offer(
  p_entry_id UUID,
  p_spot_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id UUID;
  v_user_id UUID;
  v_reservation_date DATE;
  v_group_id UUID;
  v_acceptance_time_minutes INTEGER;
  v_expires_at TIMESTAMPTZ;
  v_spot_number TEXT;
  v_group_name TEXT;
BEGIN
  -- Obtener información de la entrada de lista de espera
  SELECT 
    we.user_id,
    we.reservation_date,
    we.group_id
  INTO 
    v_user_id,
    v_reservation_date,
    v_group_id
  FROM public.waitlist_entries we
  WHERE we.id = p_entry_id
    AND we.status = 'active';

  -- Verificar que la entrada existe y está activa
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Entrada de lista de espera no encontrada o no está activa';
  END IF;

  -- Obtener configuración de tiempo de aceptación
  SELECT 
    COALESCE(waitlist_acceptance_time_minutes, 120)
  INTO 
    v_acceptance_time_minutes
  FROM public.reservation_settings
  LIMIT 1;

  -- Calcular tiempo de expiración
  v_expires_at := NOW() + (v_acceptance_time_minutes || ' minutes')::INTERVAL;

  -- Obtener información del spot y grupo para logs
  SELECT ps.spot_number INTO v_spot_number
  FROM public.parking_spots ps
  WHERE ps.id = p_spot_id;

  SELECT pg.name INTO v_group_name
  FROM public.parking_groups pg
  WHERE pg.id = v_group_id;

  -- Insertar oferta en waitlist_offers
  INSERT INTO public.waitlist_offers (
    entry_id,
    user_id,
    spot_id,
    reservation_date,
    status,
    expires_at
  )
  VALUES (
    p_entry_id,
    v_user_id,
    p_spot_id,
    v_reservation_date,
    'pending',
    v_expires_at
  )
  RETURNING id INTO v_offer_id;

  -- Actualizar estado de la entrada a 'offer_pending'
  UPDATE public.waitlist_entries
  SET 
    status = 'offer_pending',
    updated_at = NOW()
  WHERE id = p_entry_id;

  -- Registrar en logs
  INSERT INTO public.waitlist_logs (
    user_id,
    entry_id,
    offer_id,
    action,
    details
  )
  VALUES (
    v_user_id,
    p_entry_id,
    v_offer_id,
    'offer_created',
    jsonb_build_object(
      'spot_id', p_spot_id,
      'spot_number', v_spot_number,
      'group_name', v_group_name,
      'reservation_date', v_reservation_date,
      'expires_at', v_expires_at,
      'acceptance_time_minutes', v_acceptance_time_minutes
    )
  );

  -- Retornar offer_id para que pueda ser usado por notificaciones
  RETURN v_offer_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Log del error
    INSERT INTO public.waitlist_logs (
      user_id,
      entry_id,
      action,
      details
    )
    VALUES (
      v_user_id,
      p_entry_id,
      'error_occurred',
      jsonb_build_object(
        'error_code', SQLSTATE,
        'error_message', SQLERRM,
        'function', 'create_waitlist_offer',
        'spot_id', p_spot_id
      )
    );
    
    RAISE;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.create_waitlist_offer(UUID, UUID) IS 
'Crea una oferta de reserva para un usuario en lista de espera. 
Calcula el tiempo de expiración basado en la configuración del sistema,
actualiza el estado de la entrada a offer_pending, y registra la acción en logs.
Retorna el offer_id para ser usado en notificaciones.';

-- Grant de ejecución
GRANT EXECUTE ON FUNCTION public.create_waitlist_offer(UUID, UUID) TO authenticated;
