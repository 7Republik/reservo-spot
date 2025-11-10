-- ============================================
-- PARTE 1: FUNCIONES AUXILIARES
-- ============================================

-- Función para cancelar reservas futuras de un usuario en un grupo específico
CREATE OR REPLACE FUNCTION public.cancel_user_reservations_in_group(
  _user_id UUID,
  _group_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Cancelar todas las reservas futuras del usuario en plazas de ese grupo
  WITH cancelled AS (
    UPDATE public.reservations
    SET 
      status = 'cancelled',
      cancelled_at = NOW()
    WHERE user_id = _user_id
    AND reservation_date >= CURRENT_DATE
    AND status = 'active'
    AND spot_id IN (
      SELECT id FROM public.parking_spots WHERE group_id = _group_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cancelled_count FROM cancelled;

  RETURN v_cancelled_count;
END;
$$;

COMMENT ON FUNCTION cancel_user_reservations_in_group IS 'Cancela todas las reservas futuras de un usuario en un grupo específico';

-- Función para cancelar todas las reservas futuras de un usuario
CREATE OR REPLACE FUNCTION public.cancel_all_user_future_reservations(
  _user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Cancelar todas las reservas futuras del usuario
  WITH cancelled AS (
    UPDATE public.reservations
    SET 
      status = 'cancelled',
      cancelled_at = NOW()
    WHERE user_id = _user_id
    AND reservation_date >= CURRENT_DATE
    AND status = 'active'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cancelled_count FROM cancelled;

  RETURN v_cancelled_count;
END;
$$;

COMMENT ON FUNCTION cancel_all_user_future_reservations IS 'Cancela todas las reservas futuras activas de un usuario';

-- ============================================
-- PARTE 2: FUNCIONES TRIGGER
-- ============================================

-- Función trigger para cuando se elimina asignación de grupo
CREATE OR REPLACE FUNCTION public.trigger_cancel_reservations_on_group_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- OLD contiene el registro que se está eliminando
  SELECT public.cancel_user_reservations_in_group(OLD.user_id, OLD.group_id)
  INTO v_cancelled_count;

  -- Log para auditoría
  RAISE NOTICE 'Usuario % removido del grupo %: % reservas futuras canceladas', 
    OLD.user_id, OLD.group_id, v_cancelled_count;

  RETURN OLD;
END;
$$;

-- Función trigger para cuando se desaprueba o elimina una matrícula
CREATE OR REPLACE FUNCTION public.trigger_cancel_reservations_on_plate_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Verificar si se desaprobó (is_approved: TRUE → FALSE)
  -- O si se marcó como eliminada (deleted_at: NULL → valor)
  IF (OLD.is_approved = TRUE AND NEW.is_approved = FALSE) 
     OR (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
    
    SELECT public.cancel_all_user_future_reservations(NEW.user_id)
    INTO v_cancelled_count;

    -- Log para auditoría
    RAISE NOTICE 'Matrícula % del usuario %: % reservas futuras canceladas', 
      NEW.plate_number, NEW.user_id, v_cancelled_count;
  END IF;

  RETURN NEW;
END;
$$;

-- Función trigger para cuando se bloquea o desactiva un usuario
CREATE OR REPLACE FUNCTION public.trigger_cancel_reservations_on_user_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Verificar si se bloqueó (is_blocked: FALSE → TRUE)
  -- O si se desactivó (is_deactivated: FALSE → TRUE)
  IF (OLD.is_blocked = FALSE AND NEW.is_blocked = TRUE)
     OR (OLD.is_deactivated = FALSE AND NEW.is_deactivated = TRUE) THEN
    
    SELECT public.cancel_all_user_future_reservations(NEW.id)
    INTO v_cancelled_count;

    -- Log para auditoría
    RAISE NOTICE 'Usuario % bloqueado/desactivado: % reservas futuras canceladas', 
      NEW.id, v_cancelled_count;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- PARTE 3: CREAR TRIGGERS
-- ============================================

-- Trigger cuando se elimina asignación de grupo
DROP TRIGGER IF EXISTS on_user_group_assignment_deleted ON public.user_group_assignments;
CREATE TRIGGER on_user_group_assignment_deleted
  AFTER DELETE ON public.user_group_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cancel_reservations_on_group_removal();

COMMENT ON TRIGGER on_user_group_assignment_deleted ON public.user_group_assignments IS 
  'Cancela automáticamente las reservas futuras cuando se quita acceso a un grupo';

-- Trigger cuando se desaprueba o elimina una matrícula
DROP TRIGGER IF EXISTS on_license_plate_removed ON public.license_plates;
CREATE TRIGGER on_license_plate_removed
  AFTER UPDATE ON public.license_plates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cancel_reservations_on_plate_removal();

COMMENT ON TRIGGER on_license_plate_removed ON public.license_plates IS 
  'Cancela automáticamente las reservas futuras cuando se desaprueba o elimina una matrícula';

-- Trigger cuando se bloquea o desactiva un usuario
DROP TRIGGER IF EXISTS on_user_blocked_or_deactivated ON public.profiles;
CREATE TRIGGER on_user_blocked_or_deactivated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cancel_reservations_on_user_status_change();

COMMENT ON TRIGGER on_user_blocked_or_deactivated ON public.profiles IS 
  'Cancela automáticamente las reservas futuras cuando se bloquea o desactiva un usuario';

-- ============================================
-- PARTE 4: ACTUALIZAR FUNCIÓN EXISTENTE
-- ============================================

-- Actualizar deactivate_user para mejor logging
CREATE OR REPLACE FUNCTION public.deactivate_user(_user_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Verificar que el admin tiene permiso
  IF NOT public.is_admin(_admin_id) THEN
    RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
  END IF;

  -- Marcar usuario como desactivado
  UPDATE public.profiles
  SET 
    is_deactivated = TRUE,
    deactivated_at = NOW(),
    deactivated_by = _admin_id
  WHERE id = _user_id;

  -- Desactivar todas las matrículas del usuario
  UPDATE public.license_plates
  SET is_approved = FALSE
  WHERE user_id = _user_id;

  -- Las reservas se cancelarán automáticamente por los triggers
  RAISE NOTICE 'Usuario % desactivado. Las reservas futuras serán canceladas por triggers', _user_id;
END;
$function$;

-- ============================================
-- PARTE 5: TABLA DE AUDITORÍA (OPCIONAL)
-- ============================================

-- Tabla de auditoría para cancelaciones automáticas
CREATE TABLE IF NOT EXISTS public.reservation_cancellation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancellation_reason TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  metadata JSONB
);

COMMENT ON TABLE reservation_cancellation_log IS 'Log de auditoría para cancelaciones automáticas de reservas';

-- Index para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cancellation_log_user_id ON public.reservation_cancellation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_log_reservation_id ON public.reservation_cancellation_log(reservation_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_log_cancelled_at ON public.reservation_cancellation_log(cancelled_at DESC);