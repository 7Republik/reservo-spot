-- Agregar columna group_id a blocked_dates para bloqueos específicos por grupo
ALTER TABLE public.blocked_dates 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.parking_groups(id) ON DELETE CASCADE;

-- Actualizar el unique constraint para permitir el mismo día bloqueado en diferentes grupos
ALTER TABLE public.blocked_dates DROP CONSTRAINT IF EXISTS blocked_dates_blocked_date_key;

-- Nuevo constraint: un día solo puede estar bloqueado una vez por grupo (o globalmente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_dates_unique 
ON public.blocked_dates(blocked_date, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Actualizar función de validación para considerar bloqueos por grupo
CREATE OR REPLACE FUNCTION public.validate_parking_spot_reservation(_user_id uuid, _spot_id uuid, _reservation_date date)
RETURNS TABLE(is_valid boolean, error_code text, error_message text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_spot RECORD;
  v_user_plate_id UUID;
  v_date_range RECORD;
BEGIN
  -- VALIDACIÓN 0: Verificar rango de fechas permitido
  SELECT * INTO v_date_range FROM public.get_reservable_date_range();
  
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
    SELECT 1 FROM public.blocked_dates 
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

COMMENT ON COLUMN blocked_dates.group_id IS 'Grupo específico bloqueado (NULL = bloqueo global para todos los grupos)';