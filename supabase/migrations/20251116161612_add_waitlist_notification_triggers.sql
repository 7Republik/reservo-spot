-- =====================================================
-- MIGRATION: Triggers de Notificaciones para Waitlist
-- Descripción: Triggers automáticos para crear notificaciones
--              cuando ocurren eventos de waitlist
-- Fecha: 2025-11-16
-- =====================================================

-- =====================================================
-- TRIGGER: on_waitlist_offer_created
-- Propósito: Notificar cuando se crea oferta de waitlist
-- =====================================================

CREATE OR REPLACE FUNCTION notify_waitlist_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _spot_number TEXT;
  _group_name TEXT;
  _reservation_date DATE;
  _minutes_remaining INTEGER;
BEGIN
  -- Obtener detalles de la plaza y fecha
  SELECT 
    ps.spot_number, 
    pg.name,
    we.reservation_date
  INTO _spot_number, _group_name, _reservation_date
  FROM parking_spots ps
  JOIN parking_groups pg ON ps.group_id = pg.id
  JOIN waitlist_entries we ON we.id = NEW.entry_id
  WHERE ps.id = NEW.spot_id;
  
  -- Calcular minutos restantes
  _minutes_remaining := EXTRACT(EPOCH FROM (NEW.expires_at - NOW())) / 60;
  
  -- Crear notificación in-app
  _notification_id := create_notification(
    NEW.user_id,
    'waitlist_offer',
    '¡Plaza Disponible!',
    format('Tienes una plaza disponible: %s en %s para el %s. Expira en %s minutos.',
      _spot_number, 
      _group_name,
      TO_CHAR(_reservation_date, 'DD/MM/YYYY'),
      _minutes_remaining
    ),
    'urgent', -- priority
    'waitlist', -- category
    NEW.id, -- reference_id
    format('/waitlist/offers/%s', NEW.id), -- action_url
    jsonb_build_object(
      'offer_id', NEW.id,
      'spot_id', NEW.spot_id,
      'spot_number', _spot_number,
      'group_name', _group_name,
      'reservation_date', _reservation_date,
      'expires_at', NEW.expires_at,
      'minutes_remaining', _minutes_remaining
    )
  );
  
  -- Log para debugging
  RAISE NOTICE 'Notificación de oferta waitlist creada: % para usuario %', _notification_id, NEW.user_id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar la operación principal
    RAISE WARNING 'Error creando notificación de oferta waitlist: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS on_waitlist_offer_created ON waitlist_offers;
CREATE TRIGGER on_waitlist_offer_created
AFTER INSERT ON waitlist_offers
FOR EACH ROW
EXECUTE FUNCTION notify_waitlist_offer();

COMMENT ON FUNCTION notify_waitlist_offer IS 'Crea notificación cuando se genera oferta de waitlist. Incluye detalles de plaza y countdown.';

-- =====================================================
-- TRIGGER: on_waitlist_offer_accepted
-- Propósito: Notificar cuando usuario acepta oferta
-- =====================================================

CREATE OR REPLACE FUNCTION notify_waitlist_offer_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _spot_number TEXT;
  _group_name TEXT;
  _reservation_date DATE;
BEGIN
  -- Solo procesar cuando status cambia a 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Obtener detalles
    SELECT 
      ps.spot_number, 
      pg.name,
      we.reservation_date
    INTO _spot_number, _group_name, _reservation_date
    FROM parking_spots ps
    JOIN parking_groups pg ON ps.group_id = pg.id
    JOIN waitlist_entries we ON we.id = NEW.entry_id
    WHERE ps.id = NEW.spot_id;
    
    -- Crear notificación de confirmación
    _notification_id := create_notification(
      NEW.user_id,
      'waitlist_accepted',
      'Reserva Confirmada',
      format('Has aceptado la plaza %s en %s para el %s.',
        _spot_number,
        _group_name,
        TO_CHAR(_reservation_date, 'DD/MM/YYYY')
      ),
      'medium',
      'waitlist',
      NEW.id,
      '/dashboard',
      jsonb_build_object(
        'offer_id', NEW.id,
        'spot_number', _spot_number,
        'group_name', _group_name,
        'reservation_date', _reservation_date
      )
    );
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de aceptación: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_waitlist_offer_accepted ON waitlist_offers;
CREATE TRIGGER on_waitlist_offer_accepted
AFTER UPDATE ON waitlist_offers
FOR EACH ROW
EXECUTE FUNCTION notify_waitlist_offer_accepted();

-- =====================================================
-- TRIGGER: on_waitlist_offer_expired
-- Propósito: Notificar cuando oferta expira sin respuesta
-- =====================================================

CREATE OR REPLACE FUNCTION notify_waitlist_offer_expired()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  -- Solo procesar cuando status cambia a 'expired'
  IF NEW.status = 'expired' AND (OLD.status IS NULL OR OLD.status != 'expired') THEN
    
    -- Crear notificación informativa
    _notification_id := create_notification(
      NEW.user_id,
      'waitlist_expired',
      'Oferta Expirada',
      'La oferta de plaza ha expirado por falta de respuesta. Seguirás en la lista de espera.',
      'medium',
      'waitlist',
      NEW.id,
      '/waitlist',
      jsonb_build_object(
        'offer_id', NEW.id,
        'expired_at', NEW.expires_at
      )
    );
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de expiración: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_waitlist_offer_expired ON waitlist_offers;
CREATE TRIGGER on_waitlist_offer_expired
AFTER UPDATE ON waitlist_offers
FOR EACH ROW
EXECUTE FUNCTION notify_waitlist_offer_expired();

-- =====================================================
-- TRIGGER: on_waitlist_entry_created
-- Propósito: Notificar cuando usuario se registra en waitlist
-- =====================================================

CREATE OR REPLACE FUNCTION notify_waitlist_entry_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _group_name TEXT;
  _position INTEGER;
BEGIN
  -- Obtener nombre del grupo
  SELECT name INTO _group_name
  FROM parking_groups
  WHERE id = NEW.group_id;
  
  -- Calcular posición en la lista
  _position := calculate_waitlist_position(NEW.id);
  
  -- Crear notificación de confirmación
  _notification_id := create_notification(
    NEW.user_id,
    'waitlist_registered',
    'Registrado en Lista de Espera',
    format('Te has registrado en la lista de espera de %s para el %s. Posición: %s',
      _group_name,
      TO_CHAR(NEW.reservation_date, 'DD/MM/YYYY'),
      _position
    ),
    'low',
    'waitlist',
    NEW.id,
    '/waitlist',
    jsonb_build_object(
      'entry_id', NEW.id,
      'group_name', _group_name,
      'reservation_date', NEW.reservation_date,
      'position', _position
    )
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación de registro en waitlist: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_waitlist_entry_created ON waitlist_entries;
CREATE TRIGGER on_waitlist_entry_created
AFTER INSERT ON waitlist_entries
FOR EACH ROW
EXECUTE FUNCTION notify_waitlist_entry_created();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TRIGGER on_waitlist_offer_created ON waitlist_offers IS 'Crea notificación urgente cuando se genera oferta de plaza.';
COMMENT ON TRIGGER on_waitlist_offer_accepted ON waitlist_offers IS 'Crea notificación de confirmación cuando usuario acepta oferta.';
COMMENT ON TRIGGER on_waitlist_offer_expired ON waitlist_offers IS 'Crea notificación informativa cuando oferta expira.';
COMMENT ON TRIGGER on_waitlist_entry_created ON waitlist_entries IS 'Crea notificación de confirmación cuando usuario se registra en waitlist.';
