-- =====================================================
-- FIX: Corregir validación de matrícula en process_waitlist_for_spot
-- =====================================================
-- La función usa "status = 'approved'" pero la columna correcta
-- es "is_approved = TRUE"
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_waitlist_for_spot(
  p_spot_id UUID,
  p_date DATE
)
RETURNS UUID -- Returns offer_id if created, NULL if no eligible users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_priority_enabled BOOLEAN;
  v_entry_record RECORD;
  v_offer_id UUID;
  v_user_active BOOLEAN;
  v_has_approved_plate BOOLEAN;
BEGIN
  -- Get the parking group for this spot
  SELECT group_id INTO v_group_id
  FROM parking_spots
  WHERE id = p_spot_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Spot not found: %', p_spot_id;
  END IF;

  -- Get waitlist settings
  SELECT waitlist_priority_by_role INTO v_priority_enabled
  FROM reservation_settings
  LIMIT 1;

  -- Find eligible users in waitlist for this group and date
  -- Order by priority (if enabled) and timestamp
  FOR v_entry_record IN
    SELECT 
      we.id,
      we.user_id,
      we.group_id,
      we.reservation_date,
      COALESCE(get_user_role_priority(we.user_id), 1) as priority
    FROM waitlist_entries we
    WHERE we.group_id = v_group_id
      AND we.reservation_date = p_date
      AND we.status = 'active'
    ORDER BY 
      CASE 
        WHEN v_priority_enabled THEN COALESCE(get_user_role_priority(we.user_id), 1)
        ELSE 1
      END DESC,
      we.created_at ASC
  LOOP
    -- Validate user is still active
    v_user_active := is_user_active(v_entry_record.user_id);
    
    IF NOT v_user_active THEN
      -- User is blocked/deactivated, skip and log
      INSERT INTO waitlist_logs (
        user_id,
        entry_id,
        action,
        details
      ) VALUES (
        v_entry_record.user_id,
        v_entry_record.id,
        'entry_cancelled',
        jsonb_build_object(
          'reason', 'user_inactive',
          'spot_id', p_spot_id,
          'date', p_date
        )
      );
      
      -- Delete invalid entry
      DELETE FROM waitlist_entries WHERE id = v_entry_record.id;
      CONTINUE;
    END IF;

    -- Validate user has approved license plate
    -- FIX: Usar is_approved en lugar de status
    SELECT EXISTS (
      SELECT 1 
      FROM license_plates 
      WHERE user_id = v_entry_record.user_id 
        AND is_approved = TRUE
        AND deleted_at IS NULL
    ) INTO v_has_approved_plate;

    IF NOT v_has_approved_plate THEN
      -- User has no approved plate, skip and log
      INSERT INTO waitlist_logs (
        user_id,
        entry_id,
        action,
        details
      ) VALUES (
        v_entry_record.user_id,
        v_entry_record.id,
        'entry_cancelled',
        jsonb_build_object(
          'reason', 'no_approved_plate',
          'spot_id', p_spot_id,
          'date', p_date
        )
      );
      
      -- Delete invalid entry
      DELETE FROM waitlist_entries WHERE id = v_entry_record.id;
      CONTINUE;
    END IF;

    -- User is valid! Create offer
    BEGIN
      v_offer_id := create_waitlist_offer(v_entry_record.id, p_spot_id);
      
      -- Log offer creation
      INSERT INTO waitlist_logs (
        user_id,
        entry_id,
        offer_id,
        action,
        details
      ) VALUES (
        v_entry_record.user_id,
        v_entry_record.id,
        v_offer_id,
        'offer_created',
        jsonb_build_object(
          'spot_id', p_spot_id,
          'date', p_date,
          'priority', v_entry_record.priority
        )
      );

      -- Return the offer_id
      RETURN v_offer_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue to next user
      INSERT INTO waitlist_logs (
        user_id,
        entry_id,
        action,
        details
      ) VALUES (
        v_entry_record.user_id,
        v_entry_record.id,
        'error_occurred',
        jsonb_build_object(
          'error', SQLERRM,
          'spot_id', p_spot_id,
          'date', p_date,
          'step', 'create_offer'
        )
      );
      CONTINUE;
    END;
  END LOOP;

  -- No eligible users found
  INSERT INTO waitlist_logs (
    action,
    details
  ) VALUES (
    'no_eligible_users',
    jsonb_build_object(
      'spot_id', p_spot_id,
      'group_id', v_group_id,
      'date', p_date
    )
  );

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.process_waitlist_for_spot IS 
'Processes waitlist when a spot becomes available. Finds next eligible user and creates offer. FIXED: Uses is_approved instead of status.';
