-- =====================================================
-- BLOQUEAR PLAZAS CON OFERTAS PENDIENTES DE WAITLIST
-- =====================================================
-- Si una plaza tiene una oferta pendiente de waitlist,
-- NADIE puede reservarla directamente (ni el usuario
-- con la oferta ni otros usuarios). La plaza está
-- "reservada" para quien tiene la oferta hasta que:
-- 1. Acepte la oferta (se crea reserva automáticamente)
-- 2. Rechace la oferta (se procesa siguiente en lista)
-- 3. Expire la oferta (se procesa siguiente en lista)
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_parking_spot_reservation(_user_id uuid, _spot_id uuid, _reservation_date date)
RETURNS TABLE(is_valid boolean, error_code text, error_message text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spot RECORD;
  v_user_plate_id UUID;
  v_date_range RECORD;
  v_block_info RECORD;
  v_waitlist_enabled BOOLEAN;
  v_has_active_waitlist BOOLEAN;
  v_has_pending_offer BOOLEAN;
  v_offer_user_email TEXT;
BEGIN
  -- VALIDACIÓN -1: Verificar si el usuario está bloqueado
  SELECT 
    ub.blocked_until,
    ub.reason,
    ub.block_type
  INTO v_block_info
  FROM user_blocks ub
  WHERE ub.user_id = _user_id
    AND ub.is_active = TRUE
    AND ub.blocked_until > NOW()
    AND ub.block_type IN ('automatic_checkin', 'automatic_checkout', 'manual')
  ORDER BY ub.blocked_until DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      'USER_BLOCKED', 
      'Tu cuenta está bloqueada temporalmente hasta el ' || 
      TO_CHAR(v_block_info.blocked_until, 'DD/MM/YYYY HH24:MI') || 
      '. Motivo: ' || v_block_info.reason;
    RETURN;
  END IF;

  -- VALIDACIÓN 0: Verificar rango de fechas permitido
  SELECT * INTO v_date_range FROM get_reservable_date_range();
  
  IF _reservation_date < v_date_range.min_date THEN
    RETURN QUERY SELECT FALSE, 'DATE_TOO_EARLY', 
      'No puedes reservar para esa fecha aún. Intenta desde el ' || 
      TO_CHAR(v_date_range.min_date, 'DD/MM/YYYY');
    RETURN;
  END IF;
  
  IF _reservation_date > v_date_range.max_date THEN
    RETURN QUERY SELECT FALSE, 'DATE_TOO_FAR', 
      'Solo puedes reservar hasta ' || 
      TO_CHAR(v_date_range.max_date, 'DD/MM/YYYY');
    RETURN;
  END IF;

  -- Obtener información de la plaza y su grupo
  SELECT ps.*, pg.name as group_name, pg.scheduled_deactivation_date, ps.group_id
  INTO v_spot
  FROM parking_spots ps
  LEFT JOIN parking_groups pg ON ps.group_id = pg.id
  WHERE ps.id = _spot_id;

  -- VALIDACIÓN 0.5: Verificar día bloqueado (global o específico del grupo)
  IF EXISTS (
    SELECT 1 FROM blocked_dates 
    WHERE blocked_date = _reservation_date 
    AND (group_id IS NULL OR group_id = v_spot.group_id)
  ) THEN
    RETURN QUERY SELECT FALSE, 'DATE_BLOCKED', 
      'Este día está bloqueado para reservas. Contacta con administración.';
    RETURN;
  END IF;

  -- VALIDACIÓN 1: Plaza existe y está activa
  IF NOT FOUND OR v_spot.is_active = FALSE THEN
    RETURN QUERY SELECT FALSE, 'SPOT_NOT_AVAILABLE', 'Esta plaza no está disponible';
    RETURN;
  END IF;
  
  -- VALIDACIÓN 1.5: Grupo no está programado para desactivación antes de la fecha de reserva
  IF v_spot.scheduled_deactivation_date IS NOT NULL 
     AND _reservation_date >= v_spot.scheduled_deactivation_date THEN
    RETURN QUERY SELECT FALSE, 'GROUP_SCHEDULED_DEACTIVATION', 
      'Este grupo estará desactivado en la fecha seleccionada';
    RETURN;
  END IF;

  -- VALIDACIÓN 2: Plaza no está ya reservada
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE spot_id = _spot_id
    AND reservation_date = _reservation_date
    AND status = 'active'
  ) THEN
    RETURN QUERY SELECT FALSE, 'SPOT_ALREADY_RESERVED', 'Esta plaza ya está reservada para este día';
    RETURN;
  END IF;

  -- =====================================================
  -- NUEVA VALIDACIÓN 2.3: Verificar oferta pendiente para esta plaza específica
  -- =====================================================
  -- Si esta plaza tiene una oferta pendiente de waitlist,
  -- está "reservada" para quien tiene la oferta
  
  SELECT waitlist_enabled INTO v_waitlist_enabled
  FROM reservation_settings
  LIMIT 1;
  
  IF v_waitlist_enabled THEN
    -- Verificar si esta plaza específica tiene una oferta pendiente
    SELECT EXISTS (
      SELECT 1 
      FROM waitlist_offers wo
      JOIN waitlist_entries we ON wo.entry_id = we.id
      WHERE wo.spot_id = _spot_id
        AND we.reservation_date = _reservation_date
        AND wo.status = 'pending'
        AND wo.expires_at > NOW()
    ) INTO v_has_pending_offer;
    
    IF v_has_pending_offer THEN
      -- Obtener email del usuario con la oferta (para mensaje más informativo)
      SELECT p.email INTO v_offer_user_email
      FROM waitlist_offers wo
      JOIN waitlist_entries we ON wo.entry_id = we.id
      JOIN profiles p ON we.user_id = p.id
      WHERE wo.spot_id = _spot_id
        AND we.reservation_date = _reservation_date
        AND wo.status = 'pending'
        AND wo.expires_at > NOW()
      LIMIT 1;
      
      RETURN QUERY SELECT FALSE, 'SPOT_HAS_PENDING_OFFER', 
        'Esta plaza tiene una oferta pendiente de lista de espera. Espera a que se procese o selecciona otra plaza.';
      RETURN;
    END IF;
  
    -- VALIDACIÓN 2.5: Verificar lista de espera activa en el grupo
    -- (solo si no hay oferta pendiente para esta plaza específica)
    SELECT EXISTS (
      SELECT 1 
      FROM waitlist_entries we
      WHERE we.group_id = v_spot.group_id
        AND we.reservation_date = _reservation_date
        AND we.status IN ('active', 'offer_pending')
    ) INTO v_has_active_waitlist;
    
    IF v_has_active_waitlist THEN
      RETURN QUERY SELECT FALSE, 'WAITLIST_ACTIVE', 
        'Hay usuarios en lista de espera para este grupo y fecha. Las plazas se asignan automáticamente por orden de llegada.';
      RETURN;
    END IF;
  END IF;

  -- Obtener la matrícula activa del usuario
  SELECT id INTO v_user_plate_id
  FROM license_plates
  WHERE user_id = _user_id
  AND is_approved = TRUE
  AND deleted_at IS NULL
  ORDER BY approved_at DESC
  LIMIT 1;

  -- VALIDACIÓN 3: Usuario tiene matrícula aprobada
  IF v_user_plate_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NO_APPROVED_PLATE', 'No tienes ninguna matrícula aprobada';
    RETURN;
  END IF;

  -- VALIDACIÓN 4: Plaza accesible requiere permiso vigente
  IF v_spot.is_accessible = TRUE THEN
    IF NOT has_valid_disability_permit(v_user_plate_id) THEN
      RETURN QUERY SELECT FALSE, 'REQUIRES_DISABILITY_PERMIT', 
        'Esta plaza requiere permiso de movilidad reducida vigente';
      RETURN;
    END IF;
  END IF;

  -- VALIDACIÓN 5: Plaza con cargador requiere permiso vigente
  IF v_spot.has_charger = TRUE THEN
    IF NOT has_valid_electric_permit(v_user_plate_id) THEN
      RETURN QUERY SELECT FALSE, 'REQUIRES_ELECTRIC_PERMIT', 
        'Esta plaza requiere permiso de vehículo eléctrico vigente';
      RETURN;
    END IF;
  END IF;

  -- VALIDACIÓN 6: Plaza reducida (advertencia)
  IF v_spot.is_compact = TRUE THEN
    RETURN QUERY SELECT TRUE, 'COMPACT_SPOT_WARNING', 
      '⚠️ Esta plaza es de tamaño reducido';
    RETURN;
  END IF;

  -- VALIDACIÓN 7: Acceso al grupo
  IF v_spot.group_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_group_assignments
      WHERE user_id = _user_id
      AND group_id = v_spot.group_id
    ) AND v_spot.group_name != 'General' THEN
      RETURN QUERY SELECT FALSE, 'NO_GROUP_ACCESS', 
        'No tienes acceso a este grupo de plazas';
      RETURN;
    END IF;
  END IF;

  -- Todo OK
  RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION validate_parking_spot_reservation IS 
  'Valida si un usuario puede reservar una plaza. Incluye verificación de bloqueos, ofertas pendientes de waitlist, waitlist activa, permisos, fechas y disponibilidad.';
