-- =====================================================
-- ACTUALIZAR FUNCIÓN perform_checkout
-- =====================================================
-- Cuando el usuario hace checkout, marcar la reserva como 'completed'
-- para que no aparezca más en el calendario ni en "Hoy"
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
'Registra el check-out de un usuario y marca la reserva como completada. La reserva ya no aparecerá en el calendario ni podrá ser cancelada.';
