-- =====================================================
-- MIGRATION: Triggers de Notificaciones Restantes
-- Descripción: Triggers para amonestaciones, bloqueos,
--              reservas, incidentes y matrículas
-- Fecha: 2025-11-16
-- =====================================================

-- =====================================================
-- TRIGGERS: AMONESTACIONES Y BLOQUEOS
-- =====================================================

-- Trigger: Notificar cuando se crea amonestación
CREATE OR REPLACE FUNCTION notify_user_warning_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  -- Crear notificación de amonestación
  _notification_id := create_notification(
    NEW.user_id,
    'warning_received',
    'Amonestación Recibida',
    format('Has recibido una amonestación: %s', NEW.reason),
    'high',
    'warning',
    NEW.id,
    '/profile',
    jsonb_build_object(
      'warning_id', NEW.id,
      'reason', NEW.reason,
      'infraction_type', NEW.infraction_type,
      'infraction_date', NEW.infraction_date,
      'details', NEW.details
    )
  );
  
  RAISE NOTICE 'Notificación de amonestación creada: % para usuario %', _notification_id, NEW.user_id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de amonestación: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_warning_created ON user_warnings;
CREATE TRIGGER on_user_warning_created
AFTER INSERT ON user_warnings
FOR EACH ROW
EXECUTE FUNCTION notify_user_warning_created();

-- Trigger: Notificar cuando se crea bloqueo
CREATE OR REPLACE FUNCTION notify_user_block_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _days_blocked INTEGER;
BEGIN
  -- Calcular días de bloqueo
  _days_blocked := EXTRACT(DAY FROM (NEW.blocked_until - NEW.blocked_at));
  
  -- Crear notificación urgente de bloqueo
  _notification_id := create_notification(
    NEW.user_id,
    'user_blocked',
    'Cuenta Bloqueada Temporalmente',
    format('Tu cuenta ha sido bloqueada hasta el %s (%s días) por: %s',
      TO_CHAR(NEW.blocked_until, 'DD/MM/YYYY HH24:MI'),
      _days_blocked,
      NEW.reason
    ),
    'urgent',
    'warning',
    NEW.id,
    '/profile',
    jsonb_build_object(
      'block_id', NEW.id,
      'reason', NEW.reason,
      'blocked_at', NEW.blocked_at,
      'blocked_until', NEW.blocked_until,
      'days_blocked', _days_blocked,
      'block_type', NEW.block_type
    )
  );
  
  RAISE NOTICE 'Notificación de bloqueo creada: % para usuario %', _notification_id, NEW.user_id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de bloqueo: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_block_created ON user_blocks;
CREATE TRIGGER on_user_block_created
AFTER INSERT ON user_blocks
FOR EACH ROW
EXECUTE FUNCTION notify_user_block_created();

-- Trigger: Notificar cuando expira bloqueo
CREATE OR REPLACE FUNCTION notify_user_block_expired()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  -- Solo procesar cuando is_active cambia a false
  IF OLD.is_active = true AND NEW.is_active = false THEN
    
    -- Crear notificación informativa
    _notification_id := create_notification(
      NEW.user_id,
      'block_expired',
      'Bloqueo Finalizado',
      'Tu bloqueo temporal ha finalizado. Ya puedes volver a usar el sistema.',
      'medium',
      'warning',
      NEW.id,
      '/dashboard',
      jsonb_build_object(
        'block_id', NEW.id,
        'blocked_until', NEW.blocked_until
      )
    );
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de fin de bloqueo: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_block_expired ON user_blocks;
CREATE TRIGGER on_user_block_expired
AFTER UPDATE ON user_blocks
FOR EACH ROW
EXECUTE FUNCTION notify_user_block_expired();

-- =====================================================
-- TRIGGERS: RESERVAS
-- =====================================================

-- Trigger: Notificar cuando admin cancela reserva
CREATE OR REPLACE FUNCTION notify_reservation_cancelled_by_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _spot_number TEXT;
  _group_name TEXT;
BEGIN
  -- Solo procesar cuando status cambia a 'cancelled' y hay cancelled_by
  IF NEW.status = 'cancelled' 
     AND (OLD.status IS NULL OR OLD.status != 'cancelled')
     AND NEW.cancelled_by IS NOT NULL THEN
    
    -- Obtener detalles de la plaza
    SELECT ps.spot_number, pg.name
    INTO _spot_number, _group_name
    FROM parking_spots ps
    JOIN parking_groups pg ON ps.group_id = pg.id
    WHERE ps.id = NEW.spot_id;
    
    -- Crear notificación de cancelación
    _notification_id := create_notification(
      NEW.user_id,
      'reservation_cancelled',
      'Reserva Cancelada',
      format('Tu reserva de la plaza %s en %s para el %s ha sido cancelada por un administrador.',
        _spot_number,
        _group_name,
        TO_CHAR(NEW.reservation_date, 'DD/MM/YYYY')
      ),
      'high',
      'reservation',
      NEW.id,
      '/dashboard',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'spot_number', _spot_number,
        'group_name', _group_name,
        'reservation_date', NEW.reservation_date,
        'cancelled_by', NEW.cancelled_by,
        'cancelled_at', NEW.cancelled_at
      )
    );
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de cancelación: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reservation_cancelled_by_admin ON reservations;
CREATE TRIGGER on_reservation_cancelled_by_admin
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION notify_reservation_cancelled_by_admin();

-- =====================================================
-- TRIGGERS: INCIDENTES
-- =====================================================

-- Trigger: Notificar cuando se reporta incidente
CREATE OR REPLACE FUNCTION notify_incident_reported()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _spot_number TEXT;
BEGIN
  -- Obtener número de plaza
  SELECT spot_number INTO _spot_number
  FROM parking_spots
  WHERE id = NEW.spot_id;
  
  -- Crear notificación de confirmación
  _notification_id := create_notification(
    NEW.reported_by,
    'incident_reported',
    'Incidente Reportado',
    format('Tu reporte de incidente en la plaza %s ha sido registrado. Un administrador lo revisará pronto.',
      _spot_number
    ),
    'low',
    'incident',
    NEW.id,
    '/dashboard',
    jsonb_build_object(
      'incident_id', NEW.id,
      'spot_number', _spot_number,
      'incident_type', NEW.incident_type
    )
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de incidente reportado: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_incident_reported ON incident_reports;
CREATE TRIGGER on_incident_reported
AFTER INSERT ON incident_reports
FOR EACH ROW
EXECUTE FUNCTION notify_incident_reported();

-- Trigger: Notificar cuando se reasigna plaza por incidente
CREATE OR REPLACE FUNCTION notify_incident_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _old_spot_number TEXT;
  _new_spot_number TEXT;
  _group_name TEXT;
BEGIN
  -- Solo procesar cuando se asigna nueva plaza
  IF NEW.reassigned_spot_id IS NOT NULL 
     AND (OLD.reassigned_spot_id IS NULL OR OLD.reassigned_spot_id != NEW.reassigned_spot_id) THEN
    
    -- Obtener números de plazas
    SELECT ps1.spot_number, ps2.spot_number, pg.name
    INTO _old_spot_number, _new_spot_number, _group_name
    FROM parking_spots ps1
    CROSS JOIN parking_spots ps2
    JOIN parking_groups pg ON ps2.group_id = pg.id
    WHERE ps1.id = NEW.spot_id
      AND ps2.id = NEW.reassigned_spot_id;
    
    -- Crear notificación de reasignación
    _notification_id := create_notification(
      NEW.reported_by,
      'incident_reassignment',
      'Plaza Reasignada',
      format('Debido al incidente en la plaza %s, se te ha asignado la plaza %s en %s.',
        _old_spot_number,
        _new_spot_number,
        _group_name
      ),
      'high',
      'incident',
      NEW.id,
      '/dashboard',
      jsonb_build_object(
        'incident_id', NEW.id,
        'old_spot_number', _old_spot_number,
        'new_spot_number', _new_spot_number,
        'group_name', _group_name,
        'reassigned_spot_id', NEW.reassigned_spot_id
      )
    );
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de reasignación: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_incident_reassignment ON incident_reports;
CREATE TRIGGER on_incident_reassignment
AFTER UPDATE ON incident_reports
FOR EACH ROW
EXECUTE FUNCTION notify_incident_reassignment();

-- =====================================================
-- TRIGGERS: MATRÍCULAS
-- =====================================================

-- Trigger: Notificar cuando se aprueba matrícula
CREATE OR REPLACE FUNCTION notify_license_plate_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  -- Solo procesar cuando status cambia a 'approved'
  IF NEW.status = 'approved' 
     AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Crear notificación de aprobación
    _notification_id := create_notification(
      NEW.user_id,
      'license_plate_approved',
      'Matrícula Aprobada',
      format('Tu matrícula %s ha sido aprobada. Ya puedes hacer reservas.',
        NEW.plate_number
      ),
      'medium',
      'system',
      NEW.id,
      '/profile/license-plates',
      jsonb_build_object(
        'license_plate_id', NEW.id,
        'plate_number', NEW.plate_number
      )
    );
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de aprobación de matrícula: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_license_plate_approved ON license_plates;
CREATE TRIGGER on_license_plate_approved
AFTER UPDATE ON license_plates
FOR EACH ROW
EXECUTE FUNCTION notify_license_plate_approved();

-- Trigger: Notificar cuando se rechaza matrícula
CREATE OR REPLACE FUNCTION notify_license_plate_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  -- Solo procesar cuando status cambia a 'rejected'
  IF NEW.status = 'rejected' 
     AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    
    -- Crear notificación de rechazo
    _notification_id := create_notification(
      NEW.user_id,
      'license_plate_rejected',
      'Matrícula Rechazada',
      format('Tu matrícula %s ha sido rechazada. Motivo: %s',
        NEW.plate_number,
        COALESCE(NEW.rejection_reason, 'No especificado')
      ),
      'high',
      'system',
      NEW.id,
      '/profile/license-plates',
      jsonb_build_object(
        'license_plate_id', NEW.id,
        'plate_number', NEW.plate_number,
        'rejection_reason', NEW.rejection_reason
      )
    );
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de rechazo de matrícula: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_license_plate_rejected ON license_plates;
CREATE TRIGGER on_license_plate_rejected
AFTER UPDATE ON license_plates
FOR EACH ROW
EXECUTE FUNCTION notify_license_plate_rejected();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION notify_user_warning_created IS 'Crea notificación cuando usuario recibe amonestación.';
COMMENT ON FUNCTION notify_user_block_created IS 'Crea notificación urgente cuando usuario es bloqueado.';
COMMENT ON FUNCTION notify_user_block_expired IS 'Crea notificación cuando expira bloqueo temporal.';
COMMENT ON FUNCTION notify_reservation_cancelled_by_admin IS 'Crea notificación cuando admin cancela reserva.';
COMMENT ON FUNCTION notify_incident_reported IS 'Crea notificación de confirmación cuando se reporta incidente.';
COMMENT ON FUNCTION notify_incident_reassignment IS 'Crea notificación cuando se reasigna plaza por incidente.';
COMMENT ON FUNCTION notify_license_plate_approved IS 'Crea notificación cuando se aprueba matrícula.';
COMMENT ON FUNCTION notify_license_plate_rejected IS 'Crea notificación cuando se rechaza matrícula.';
