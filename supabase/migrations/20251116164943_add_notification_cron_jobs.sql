-- =====================================================
-- MIGRATION: Cron Jobs para Sistema de Notificaciones
-- Descripción: Configurar cron jobs para limpieza automática
--              y recordatorios de ofertas de waitlist
-- Fecha: 2025-11-16
-- =====================================================

-- =====================================================
-- FUNCIÓN: send_waitlist_reminders
-- Propósito: Enviar recordatorios de ofertas próximas a expirar
-- =====================================================

CREATE OR REPLACE FUNCTION send_waitlist_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _offer RECORD;
  _notification_id UUID;
  _minutes_remaining INTEGER;
  _reminder_count INTEGER := 0;
BEGIN
  -- Buscar ofertas que expiran en 15 minutos y no tienen recordatorio
  FOR _offer IN
    SELECT 
      wo.id,
      wo.user_id,
      wo.spot_id,
      wo.entry_id,
      wo.expires_at,
      ps.spot_number,
      pg.name as group_name,
      we.reservation_date
    FROM waitlist_offers wo
    JOIN parking_spots ps ON ps.id = wo.spot_id
    JOIN parking_groups pg ON pg.id = ps.group_id
    JOIN waitlist_entries we ON we.id = wo.entry_id
    WHERE wo.status = 'pending'
      AND wo.expires_at > NOW()
      AND wo.expires_at <= NOW() + INTERVAL '15 minutes'
      -- Verificar que no existe notificación de recordatorio
      AND NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE type = 'waitlist_reminder'
          AND reference_id = wo.id
      )
  LOOP
    -- Calcular minutos restantes
    _minutes_remaining := EXTRACT(EPOCH FROM (_offer.expires_at - NOW())) / 60;
    
    -- Crear notificación de recordatorio
    _notification_id := create_notification(
      _offer.user_id,
      'waitlist_reminder',
      '⏰ Oferta por Expirar',
      format('¡Atención! Tu oferta de plaza %s en %s expira en %s minutos.',
        _offer.spot_number,
        _offer.group_name,
        _minutes_remaining
      ),
      'urgent',
      'waitlist',
      _offer.id,
      format('/waitlist/offers/%s', _offer.id),
      jsonb_build_object(
        'offer_id', _offer.id,
        'spot_number', _offer.spot_number,
        'group_name', _offer.group_name,
        'reservation_date', _offer.reservation_date,
        'expires_at', _offer.expires_at,
        'minutes_remaining', _minutes_remaining,
        'is_reminder', true
      )
    );
    
    IF _notification_id IS NOT NULL THEN
      _reminder_count := _reminder_count + 1;
      RAISE NOTICE 'Recordatorio enviado para oferta % (usuario %)', _offer.id, _offer.user_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Total de recordatorios enviados: %', _reminder_count;
  RETURN _reminder_count;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error enviando recordatorios de waitlist: %', SQLERRM;
    RETURN _reminder_count;
END;
$$;

COMMENT ON FUNCTION send_waitlist_reminders IS 'Envía recordatorios para ofertas de waitlist que expiran en 15 minutos. Para ejecutar en cron job cada 5 minutos.';

-- Permisos
REVOKE EXECUTE ON FUNCTION send_waitlist_reminders FROM PUBLIC;
GRANT EXECUTE ON FUNCTION send_waitlist_reminders TO service_role;

-- =====================================================
-- CRON JOBS
-- =====================================================

-- Verificar que pg_cron está habilitado
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *', -- Diario a las 02:00 AM
  $$SELECT cleanup_old_notifications()$$
);

SELECT cron.schedule(
  'send-waitlist-reminders',
  '*/5 * * * *', -- Cada 5 minutos
  $$SELECT send_waitlist_reminders()$$
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION send_waitlist_reminders IS 'Cron job: Envía recordatorios de ofertas waitlist que expiran en 15 minutos.';
