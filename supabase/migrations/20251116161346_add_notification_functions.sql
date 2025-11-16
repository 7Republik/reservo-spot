-- =====================================================
-- MIGRATION: Funciones SQL para Sistema de Notificaciones
-- Descripción: Funciones de utilidad para gestión de notificaciones
-- Fecha: 2025-11-16
-- =====================================================

-- =====================================================
-- FUNCIÓN: get_user_organization
-- Propósito: Obtener organization_id del usuario
-- Retorna: UUID de la organización (default si no existe)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Por ahora siempre retorna organización por defecto
  -- Cuando se implemente multi-tenant, se actualizará para leer de profiles
  SELECT '00000000-0000-0000-0000-000000000001'::UUID;
$$;

COMMENT ON FUNCTION get_user_organization IS 'Obtiene organization_id del usuario. Retorna org por defecto si no existe en profiles.';

-- =====================================================
-- FUNCIÓN: create_notification
-- Propósito: Crear notificación con deduplicación automática
-- Retorna: UUID de la notificación creada (NULL si duplicada)
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _priority TEXT DEFAULT 'medium',
  _category TEXT DEFAULT 'system',
  _reference_id UUID DEFAULT NULL,
  _action_url TEXT DEFAULT NULL,
  _data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _organization_id UUID;
BEGIN
  -- Validar parámetros
  IF _user_id IS NULL OR _type IS NULL OR _title IS NULL OR _message IS NULL THEN
    RAISE EXCEPTION 'user_id, type, title y message son requeridos';
  END IF;
  
  IF _priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
    RAISE EXCEPTION 'priority debe ser: low, medium, high o urgent';
  END IF;
  
  IF _category NOT IN ('reservation', 'waitlist', 'warning', 'incident', 'system') THEN
    RAISE EXCEPTION 'category debe ser: reservation, waitlist, warning, incident o system';
  END IF;
  
  -- Obtener organización del usuario
  _organization_id := get_user_organization(_user_id);
  
  -- Insertar notificación con deduplicación automática
  INSERT INTO notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    priority,
    category,
    reference_id,
    action_url,
    data
  ) VALUES (
    _organization_id,
    _user_id,
    _type,
    _title,
    _message,
    _priority,
    _category,
    _reference_id,
    _action_url,
    _data
  )
  ON CONFLICT (organization_id, user_id, type, reference_id) 
  WHERE is_read = false AND reference_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO _notification_id;
  
  -- Log si se creó la notificación
  IF _notification_id IS NOT NULL THEN
    RAISE NOTICE 'Notificación creada: % (type: %, priority: %)', _notification_id, _type, _priority;
  ELSE
    RAISE NOTICE 'Notificación duplicada ignorada (type: %, reference_id: %)', _type, _reference_id;
  END IF;
  
  RETURN _notification_id;
END;
$$;

COMMENT ON FUNCTION create_notification IS 'Crea notificación con deduplicación automática. Retorna NULL si ya existe notificación no leída del mismo tipo y referencia.';

-- =====================================================
-- FUNCIÓN: should_send_email
-- Propósito: Verificar si debe enviar email según preferencias
-- Retorna: BOOLEAN (true si debe enviar)
-- =====================================================

CREATE OR REPLACE FUNCTION should_send_email(
  _user_id UUID,
  _notification_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefs RECORD;
BEGIN
  -- Obtener preferencias del usuario
  SELECT * INTO _prefs
  FROM notification_preferences
  WHERE user_id = _user_id;
  
  -- Si no existen preferencias, crear con defaults
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (_user_id)
    RETURNING * INTO _prefs;
  END IF;
  
  -- Si email deshabilitado globalmente, retornar false
  IF NOT _prefs.email_enabled THEN
    RETURN false;
  END IF;
  
  -- Verificar preferencia específica según tipo
  RETURN CASE _notification_type
    WHEN 'waitlist_offer' THEN _prefs.email_waitlist_offers
    WHEN 'waitlist_reminder' THEN _prefs.email_waitlist_offers
    WHEN 'warning_received' THEN _prefs.email_warnings
    WHEN 'user_blocked' THEN _prefs.email_blocks
    WHEN 'block_expired' THEN false -- No enviar email cuando expira bloqueo
    WHEN 'reservation_cancelled' THEN _prefs.email_reservation_cancelled
    WHEN 'incident_reassignment' THEN _prefs.email_incident_reassignment
    WHEN 'incident_confirmed' THEN _prefs.email_incident_reassignment
    WHEN 'license_plate_approved' THEN false -- No enviar email para aprobaciones
    WHEN 'license_plate_rejected' THEN _prefs.email_license_plate_rejected
    ELSE false -- Por defecto no enviar
  END;
END;
$$;

COMMENT ON FUNCTION should_send_email IS 'Verifica preferencias del usuario para determinar si enviar email. Crea preferencias con defaults si no existen.';

-- =====================================================
-- FUNCIÓN: mark_notification_as_read
-- Propósito: Marcar notificación como leída
-- Retorna: BOOLEAN (true si se actualizó)
-- =====================================================

CREATE OR REPLACE FUNCTION mark_notification_as_read(
  _notification_id UUID,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE id = _notification_id
    AND user_id = _user_id
    AND is_read = false;
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION mark_notification_as_read IS 'Marca notificación como leída. Solo funciona si el usuario es propietario y la notificación no estaba leída.';

-- =====================================================
-- FUNCIÓN: mark_all_notifications_as_read
-- Propósito: Marcar todas las notificaciones como leídas
-- Retorna: INTEGER (número de notificaciones actualizadas)
-- =====================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(
  _user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE user_id = _user_id
    AND is_read = false;
  
  GET DIAGNOSTICS _updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Marcadas % notificaciones como leídas para usuario %', _updated_count, _user_id;
  
  RETURN _updated_count;
END;
$$;

COMMENT ON FUNCTION mark_all_notifications_as_read IS 'Marca todas las notificaciones no leídas del usuario como leídas. Retorna número de notificaciones actualizadas.';

-- =====================================================
-- FUNCIÓN: get_unread_count
-- Propósito: Obtener contador de notificaciones no leídas
-- Retorna: INTEGER (número de notificaciones no leídas)
-- =====================================================

CREATE OR REPLACE FUNCTION get_unread_count(
  _user_id UUID
)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = _user_id
    AND is_read = false;
$$;

COMMENT ON FUNCTION get_unread_count IS 'Retorna número de notificaciones no leídas del usuario.';

-- =====================================================
-- FUNCIÓN: cleanup_old_notifications
-- Propósito: Eliminar notificaciones antiguas (> 30 días)
-- Retorna: INTEGER (número de notificaciones eliminadas)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_count INTEGER;
BEGIN
  -- Eliminar notificaciones leídas con más de 30 días
  -- Mantener notificaciones no leídas independientemente de la fecha
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS _deleted_count = ROW_COUNT;
  
  -- Log resultado
  RAISE NOTICE 'Limpieza completada: % notificaciones antiguas eliminadas', _deleted_count;
  
  RETURN _deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Elimina notificaciones leídas con más de 30 días. Mantiene notificaciones no leídas. Para ejecutar en cron job diario.';

-- =====================================================
-- PERMISOS
-- =====================================================

-- Permitir ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_user_organization TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION should_send_email TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count TO authenticated;

-- cleanup_old_notifications solo para service_role (cron jobs)
REVOKE EXECUTE ON FUNCTION cleanup_old_notifications FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO service_role;
