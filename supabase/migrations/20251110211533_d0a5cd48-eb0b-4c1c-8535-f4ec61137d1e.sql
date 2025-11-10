-- FASE 1, 2 y 3: Sistema Avanzado de Gestión de Grupos de Parking

-- ============================================
-- PARTE 1: MODIFICAR TABLA parking_groups
-- ============================================
-- Agregar columnas para soft delete y desactivación programada
ALTER TABLE public.parking_groups 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS scheduled_deactivation_date DATE;

COMMENT ON COLUMN parking_groups.deactivated_at IS 'Fecha de baja definitiva del grupo (soft delete)';
COMMENT ON COLUMN parking_groups.deactivated_by IS 'Admin que dio de baja el grupo';
COMMENT ON COLUMN parking_groups.deactivation_reason IS 'Motivo de la baja del grupo';
COMMENT ON COLUMN parking_groups.scheduled_deactivation_date IS 'Fecha programada para desactivar el grupo automáticamente';

-- Índice para mejorar queries
CREATE INDEX IF NOT EXISTS idx_parking_groups_scheduled_deactivation 
ON public.parking_groups(scheduled_deactivation_date) 
WHERE scheduled_deactivation_date IS NOT NULL AND is_active = TRUE;

-- ============================================
-- PARTE 2: CREAR TABLA blocked_dates
-- ============================================
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'Fuerza Mayor',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Admins can manage blocked dates"
ON public.blocked_dates
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Users can view blocked dates"
ON public.blocked_dates
FOR SELECT
TO authenticated
USING (true);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON public.blocked_dates(blocked_date);

COMMENT ON TABLE blocked_dates IS 'Días específicos donde está bloqueada la reserva de plazas en todos los grupos';

-- ============================================
-- PARTE 3: CREAR TABLA reservation_settings
-- ============================================
CREATE TABLE IF NOT EXISTS public.reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_reservation_days INTEGER NOT NULL DEFAULT 7 CHECK (advance_reservation_days > 0 AND advance_reservation_days <= 90),
  daily_refresh_hour INTEGER NOT NULL DEFAULT 10 CHECK (daily_refresh_hour >= 0 AND daily_refresh_hour <= 23),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT only_one_settings CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insertar configuración por defecto (7 días a las 10:00)
INSERT INTO public.reservation_settings (id, advance_reservation_days, daily_refresh_hour)
VALUES ('00000000-0000-0000-0000-000000000001', 7, 10)
ON CONFLICT (id) DO NOTHING;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_reservation_settings_updated_at ON public.reservation_settings;
CREATE TRIGGER update_reservation_settings_updated_at
BEFORE UPDATE ON public.reservation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.reservation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read reservation settings" ON public.reservation_settings;
CREATE POLICY "Everyone can read reservation settings"
ON public.reservation_settings
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can update reservation settings" ON public.reservation_settings;
CREATE POLICY "Admins can update reservation settings"
ON public.reservation_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON TABLE reservation_settings IS 'Configuración global del sistema de reservas (singleton - solo 1 registro)';
COMMENT ON COLUMN reservation_settings.advance_reservation_days IS 'Días por adelantado que los usuarios pueden reservar (default: 7)';
COMMENT ON COLUMN reservation_settings.daily_refresh_hour IS 'Hora del día (0-23) cuando se actualiza la ventana de reserva (default: 10)';

-- ============================================
-- PARTE 4: FUNCIONES
-- ============================================

-- Función para obtener rango de fechas reservables
CREATE OR REPLACE FUNCTION public.get_reservable_date_range()
RETURNS TABLE(min_date DATE, max_date DATE)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_reference_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Obtener configuración
  SELECT advance_reservation_days, daily_refresh_hour 
  INTO v_settings
  FROM public.reservation_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Si no hay configuración, usar defaults
  IF NOT FOUND THEN
    v_settings.advance_reservation_days := 7;
    v_settings.daily_refresh_hour := 10;
  END IF;
  
  -- Calcular tiempo de referencia (hoy a la hora configurada)
  v_reference_time := (CURRENT_DATE + (v_settings.daily_refresh_hour || ' hours')::INTERVAL);
  
  -- Si aún no hemos llegado a la hora de refresh de hoy, usar ayer como referencia
  IF NOW() < v_reference_time THEN
    v_reference_time := v_reference_time - '1 day'::INTERVAL;
  END IF;
  
  -- Calcular rango
  RETURN QUERY SELECT 
    v_reference_time::DATE AS min_date,
    (v_reference_time + (v_settings.advance_reservation_days || ' days')::INTERVAL)::DATE AS max_date;
END;
$$;

COMMENT ON FUNCTION get_reservable_date_range IS 'Devuelve el rango de fechas (min_date, max_date) en las que se puede hacer reservas según configuración';

-- Función para dar de baja un grupo (soft delete)
CREATE OR REPLACE FUNCTION public.deactivate_parking_group(
  _group_id UUID,
  _admin_id UUID,
  _reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el admin tiene permiso
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
  END IF;

  -- Marcar grupo como dado de baja (soft delete)
  UPDATE public.parking_groups
  SET 
    is_active = FALSE,
    deactivated_at = NOW(),
    deactivated_by = _admin_id,
    deactivation_reason = _reason
  WHERE id = _group_id;

  -- Desactivar todas las plazas del grupo
  UPDATE public.parking_spots
  SET is_active = FALSE
  WHERE group_id = _group_id;

  -- Cancelar todas las reservas futuras del grupo
  UPDATE public.reservations
  SET 
    status = 'cancelled',
    cancelled_at = NOW()
  WHERE spot_id IN (
    SELECT id FROM parking_spots WHERE group_id = _group_id
  )
  AND reservation_date >= CURRENT_DATE
  AND status = 'active';
END;
$$;

COMMENT ON FUNCTION deactivate_parking_group IS 'Da de baja definitivamente un grupo de parking, desactiva sus plazas y cancela todas las reservas futuras';

-- Función para cancelar reservas de un día bloqueado
CREATE OR REPLACE FUNCTION public.cancel_reservations_for_blocked_date(
  _blocked_date DATE,
  _admin_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Verificar que el admin tiene permiso
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
  END IF;

  -- Cancelar todas las reservas activas de ese día
  WITH cancelled AS (
    UPDATE public.reservations
    SET 
      status = 'cancelled',
      cancelled_at = NOW()
    WHERE reservation_date = _blocked_date
    AND status = 'active'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cancelled_count FROM cancelled;

  RETURN v_cancelled_count;
END;
$$;

COMMENT ON FUNCTION cancel_reservations_for_blocked_date IS 'Cancela todas las reservas activas de un día específico (usado para días bloqueados)';

-- Actualizar función de validación para incluir nuevas reglas
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
  
  -- VALIDACIÓN 0.5: Verificar día bloqueado
  IF EXISTS (SELECT 1 FROM public.blocked_dates WHERE blocked_date = _reservation_date) THEN
    RETURN QUERY SELECT FALSE, 'DATE_BLOCKED', 
      'Este día está bloqueado para reservas. Contacta con administración.';
    RETURN;
  END IF;

  -- Obtener información de la plaza y su grupo
  SELECT ps.*, pg.name as group_name, pg.scheduled_deactivation_date
  INTO v_spot
  FROM parking_spots ps
  LEFT JOIN parking_groups pg ON ps.group_id = pg.id
  WHERE ps.id = _spot_id;

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