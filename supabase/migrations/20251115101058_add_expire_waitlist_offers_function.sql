-- Migration: Add expire_waitlist_offers function
-- Description: Expires pending waitlist offers that have passed their expiration time
-- Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 11.2, 11.3, 14.3

-- =====================================================
-- Function: expire_waitlist_offers
-- =====================================================
-- Expires waitlist offers that have passed their expiration time.
-- For each expired offer:
-- - Updates offer status to 'expired'
-- - Updates entry status back to 'active'
-- - Increments no_response_count if penalty is enabled
-- - Blocks user temporarily if threshold is reached
-- - Processes waitlist to find next user
-- - Logs all actions
-- Returns the number of offers expired.

CREATE OR REPLACE FUNCTION public.expire_waitlist_offers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_offer_record RECORD;
  v_penalty_enabled BOOLEAN;
  v_penalty_threshold INTEGER;
  v_penalty_duration_days INTEGER;
  v_current_no_response_count INTEGER;
  v_should_block BOOLEAN;
BEGIN
  -- Get penalty configuration
  SELECT 
    waitlist_penalty_enabled,
    waitlist_penalty_threshold,
    waitlist_penalty_duration_days
  INTO 
    v_penalty_enabled,
    v_penalty_threshold,
    v_penalty_duration_days
  FROM reservation_settings
  LIMIT 1;

  -- Find all expired pending offers
  FOR v_offer_record IN
    SELECT 
      wo.id,
      wo.entry_id,
      wo.user_id,
      wo.spot_id,
      wo.reservation_date,
      wo.expires_at
    FROM waitlist_offers wo
    WHERE wo.status = 'pending'
      AND wo.expires_at < NOW()
    ORDER BY wo.expires_at ASC
  LOOP
    BEGIN
      -- 1. Update offer status to 'expired'
      UPDATE waitlist_offers
      SET 
        status = 'expired',
        responded_at = NOW()
      WHERE id = v_offer_record.id;

      -- 2. Update entry status back to 'active'
      UPDATE waitlist_entries
      SET 
        status = 'active',
        updated_at = NOW()
      WHERE id = v_offer_record.entry_id;

      -- 3. Handle penalty if enabled
      IF v_penalty_enabled THEN
        -- Insert or update penalty record
        INSERT INTO waitlist_penalties (
          user_id,
          rejection_count,
          no_response_count,
          is_blocked,
          last_reset_at,
          created_at,
          updated_at
        )
        VALUES (
          v_offer_record.user_id,
          0,
          1, -- First no-response
          FALSE,
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET 
          no_response_count = waitlist_penalties.no_response_count + 1,
          updated_at = NOW();

        -- Get current no_response_count
        SELECT 
          no_response_count,
          (no_response_count + 1) >= v_penalty_threshold
        INTO 
          v_current_no_response_count,
          v_should_block
        FROM waitlist_penalties
        WHERE user_id = v_offer_record.user_id;

        -- 4. Block user if threshold reached
        IF v_should_block THEN
          UPDATE waitlist_penalties
          SET 
            is_blocked = TRUE,
            blocked_until = NOW() + (v_penalty_duration_days || ' days')::INTERVAL,
            updated_at = NOW()
          WHERE user_id = v_offer_record.user_id;

          -- Log penalty applied
          INSERT INTO waitlist_logs (
            user_id,
            entry_id,
            offer_id,
            action,
            details,
            created_at
          )
          VALUES (
            v_offer_record.user_id,
            v_offer_record.entry_id,
            v_offer_record.id,
            'penalty_applied',
            jsonb_build_object(
              'reason', 'no_response_threshold_reached',
              'no_response_count', v_current_no_response_count,
              'threshold', v_penalty_threshold,
              'blocked_until', NOW() + (v_penalty_duration_days || ' days')::INTERVAL,
              'spot_id', v_offer_record.spot_id,
              'reservation_date', v_offer_record.reservation_date
            ),
            NOW()
          );

          -- Remove user from all active waitlist entries
          DELETE FROM waitlist_entries
          WHERE user_id = v_offer_record.user_id
            AND status = 'active';
        END IF;
      END IF;

      -- 5. Log offer expiration
      INSERT INTO waitlist_logs (
        user_id,
        entry_id,
        offer_id,
        action,
        details,
        created_at
      )
      VALUES (
        v_offer_record.user_id,
        v_offer_record.entry_id,
        v_offer_record.id,
        'offer_expired',
        jsonb_build_object(
          'spot_id', v_offer_record.spot_id,
          'reservation_date', v_offer_record.reservation_date,
          'expires_at', v_offer_record.expires_at,
          'expired_at', NOW(),
          'penalty_enabled', v_penalty_enabled,
          'no_response_count', v_current_no_response_count,
          'user_blocked', v_should_block
        ),
        NOW()
      );

      -- 6. Process waitlist for next user (only if user wasn't blocked)
      IF NOT v_should_block THEN
        PERFORM process_waitlist_for_spot(
          v_offer_record.spot_id, 
          v_offer_record.reservation_date
        );
      ELSE
        -- If user was blocked, still process waitlist but log it
        PERFORM process_waitlist_for_spot(
          v_offer_record.spot_id, 
          v_offer_record.reservation_date
        );
      END IF;

      -- Increment counter
      v_expired_count := v_expired_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other offers
      INSERT INTO waitlist_logs (
        user_id,
        offer_id,
        action,
        details
      ) VALUES (
        v_offer_record.user_id,
        v_offer_record.id,
        'error_occurred',
        jsonb_build_object(
          'error', SQLERRM,
          'error_detail', SQLSTATE,
          'step', 'expire_offer',
          'spot_id', v_offer_record.spot_id,
          'reservation_date', v_offer_record.reservation_date
        )
      );
      -- Continue to next offer
      CONTINUE;
    END;
  END LOOP;

  -- Log summary of expiration run
  IF v_expired_count > 0 THEN
    INSERT INTO waitlist_logs (
      action,
      details,
      created_at
    )
    VALUES (
      'cleanup_executed',
      jsonb_build_object(
        'type', 'expire_offers',
        'expired_count', v_expired_count,
        'executed_at', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN v_expired_count;

EXCEPTION
  WHEN OTHERS THEN
    -- Log critical error
    INSERT INTO waitlist_logs (
      action,
      details
    ) VALUES (
      'error_occurred',
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'step', 'expire_offers_function',
        'expired_count', v_expired_count
      )
    );
    
    -- Re-raise exception
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users (for manual testing)
-- In production, this will be called by cron job
GRANT EXECUTE ON FUNCTION public.expire_waitlist_offers() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.expire_waitlist_offers IS 
'Expires pending waitlist offers that have passed their expiration time. 
Handles penalty system, blocks users if threshold reached, and processes 
waitlist for next eligible user. Returns count of expired offers.';
