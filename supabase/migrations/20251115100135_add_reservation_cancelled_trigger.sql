-- Migration: Add trigger for reservation cancellation to process waitlist
-- Description: Automatically processes waitlist when a reservation is cancelled
-- Requirements: 5.1

-- =====================================================
-- Trigger Function: handle_reservation_cancelled
-- =====================================================
-- This function is called when a reservation status changes to 'cancelled'.
-- It automatically processes the waitlist for that spot and date.

CREATE OR REPLACE FUNCTION public.handle_reservation_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id UUID;
  v_waitlist_enabled BOOLEAN;
BEGIN
  -- Only process if status changed to 'cancelled'
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    
    -- Check if waitlist is enabled globally
    SELECT waitlist_enabled INTO v_waitlist_enabled
    FROM reservation_settings
    LIMIT 1;

    -- Only process waitlist if it's enabled
    IF v_waitlist_enabled THEN
      BEGIN
        -- Process waitlist for this spot and date
        v_offer_id := process_waitlist_for_spot(NEW.spot_id, NEW.reservation_date);
        
        -- Log the trigger execution
        INSERT INTO waitlist_logs (
          action,
          details
        ) VALUES (
          'trigger_executed',
          jsonb_build_object(
            'trigger', 'on_reservation_cancelled',
            'reservation_id', NEW.id,
            'spot_id', NEW.spot_id,
            'date', NEW.reservation_date,
            'offer_created', v_offer_id IS NOT NULL,
            'offer_id', v_offer_id
          )
        );

      EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the cancellation
        INSERT INTO waitlist_logs (
          action,
          details
        ) VALUES (
          'error_occurred',
          jsonb_build_object(
            'trigger', 'on_reservation_cancelled',
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'reservation_id', NEW.id,
            'spot_id', NEW.spot_id,
            'date', NEW.reservation_date
          )
        );
        
        -- Don't raise exception - allow cancellation to proceed
        -- even if waitlist processing fails
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- Trigger: on_reservation_cancelled
-- =====================================================
-- Fires AFTER UPDATE on reservations table
-- Calls handle_reservation_cancelled() function

DROP TRIGGER IF EXISTS on_reservation_cancelled ON public.reservations;

CREATE TRIGGER on_reservation_cancelled
  AFTER UPDATE ON public.reservations
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled'))
  EXECUTE FUNCTION public.handle_reservation_cancelled();

-- Add comments
COMMENT ON FUNCTION public.handle_reservation_cancelled IS 
'Trigger function that processes waitlist when a reservation is cancelled';

COMMENT ON TRIGGER on_reservation_cancelled ON public.reservations IS 
'Automatically processes waitlist when a reservation status changes to cancelled';
