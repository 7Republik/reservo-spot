-- =====================================================
-- MIGRATION: Añadir llamadas a Edge Function en triggers
-- Descripción: Actualiza trigger de waitlist_offer para
--              llamar a Edge Function de envío de emails
-- Fecha: 2025-11-16
-- =====================================================

-- Habilitar extensión http si no está habilitada
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- =====================================================
-- ACTUALIZAR: notify_waitlist_offer
-- Añadir llamada a Edge Function para envío de email
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
  _should_send_email BOOLEAN;
  _supabase_url TEXT;
  _service_role_key TEXT;
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
  
  -- Verificar si debe enviar email
  SELECT should_send_email(NEW.user_id, 'waitlist_offer')
  INTO _should_send_email;
  
  -- Si debe enviar email, llamar a Edge Function
  IF _should_send_email AND _notification_id IS NOT NULL THEN
    -- Obtener configuración de Supabase
    _supabase_url := current_setting('app.settings.supabase_url', true);
    _service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- Si no están configurados, usar valores por defecto (no fallar)
    IF _supabase_url IS NULL THEN
      _supabase_url := 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
    END IF;
    
    -- Llamar Edge Function de forma asíncrona (no esperar respuesta)
    BEGIN
      PERFORM extensions.http_post(
        url := _supabase_url || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(_service_role_key, '')
        ),
        body := jsonb_build_object(
          'notification_id', _notification_id,
          'user_id', NEW.user_id,
          'type', 'waitlist_offer'
        )::text
      );
      
      RAISE NOTICE 'Edge Function llamada para notificación %', _notification_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error pero no fallar
        RAISE WARNING 'Error llamando Edge Function: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar la operación principal
    RAISE WARNING 'Error creando notificación de oferta waitlist: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_waitlist_offer_created ON waitlist_offers;
CREATE TRIGGER on_waitlist_offer_created
AFTER INSERT ON waitlist_offers
FOR EACH ROW
EXECUTE FUNCTION notify_waitlist_offer();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION notify_waitlist_offer IS 'Crea notificación y llama a Edge Function para envío de email cuando se genera oferta de waitlist.';
