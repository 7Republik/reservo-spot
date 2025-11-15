-- Script to test the on_reservation_cancelled trigger
-- This script verifies that the trigger correctly processes the waitlist

-- =====================================================
-- Test Setup
-- =====================================================

DO $$
DECLARE
  v_test_user_id UUID;
  v_test_spot_id UUID;
  v_test_group_id UUID;
  v_test_date DATE := CURRENT_DATE + INTERVAL '1 day';
  v_reservation_id UUID;
  v_entry_id UUID;
  v_initial_log_count INTEGER;
  v_final_log_count INTEGER;
BEGIN
  RAISE NOTICE '=== Testing on_reservation_cancelled Trigger ===';
  RAISE NOTICE '';

  -- Get a test user (first authenticated user)
  SELECT id INTO v_test_user_id
  FROM auth.users
  WHERE email IS NOT NULL
  LIMIT 1;

  IF v_test_user_id IS NULL THEN
    RAISE EXCEPTION 'No test user found. Need at least one user in auth.users';
  END IF;

  RAISE NOTICE '✓ Test user found: %', v_test_user_id;

  -- Get a test parking spot
  SELECT ps.id, ps.group_id INTO v_test_spot_id, v_test_group_id
  FROM parking_spots ps
  WHERE ps.is_active = true
  LIMIT 1;

  IF v_test_spot_id IS NULL THEN
    RAISE EXCEPTION 'No active parking spot found';
  END IF;

  RAISE NOTICE '✓ Test spot found: % (group: %)', v_test_spot_id, v_test_group_id;

  -- Ensure waitlist is enabled
  UPDATE reservation_settings
  SET waitlist_enabled = true;

  RAISE NOTICE '✓ Waitlist enabled';

  -- Create a waitlist entry for the test user
  INSERT INTO waitlist_entries (
    user_id,
    group_id,
    reservation_date,
    status
  ) VALUES (
    v_test_user_id,
    v_test_group_id,
    v_test_date,
    'active'
  )
  RETURNING id INTO v_entry_id;

  RAISE NOTICE '✓ Waitlist entry created: %', v_entry_id;

  -- Create a test reservation
  INSERT INTO reservations (
    user_id,
    spot_id,
    reservation_date,
    status
  ) VALUES (
    v_test_user_id,
    v_test_spot_id,
    v_test_date,
    'active'
  )
  RETURNING id INTO v_reservation_id;

  RAISE NOTICE '✓ Test reservation created: %', v_reservation_id;

  -- Count logs before cancellation
  SELECT COUNT(*) INTO v_initial_log_count
  FROM waitlist_logs
  WHERE action = 'trigger_executed';

  RAISE NOTICE '✓ Initial trigger log count: %', v_initial_log_count;
  RAISE NOTICE '';
  RAISE NOTICE '--- Cancelling reservation (trigger should fire) ---';
  RAISE NOTICE '';

  -- Cancel the reservation (this should trigger the waitlist processing)
  UPDATE reservations
  SET status = 'cancelled',
      cancelled_at = NOW()
  WHERE id = v_reservation_id;

  RAISE NOTICE '✓ Reservation cancelled';

  -- Wait a moment for trigger to complete
  PERFORM pg_sleep(1);

  -- Count logs after cancellation
  SELECT COUNT(*) INTO v_final_log_count
  FROM waitlist_logs
  WHERE action = 'trigger_executed';

  RAISE NOTICE '✓ Final trigger log count: %', v_final_log_count;
  RAISE NOTICE '';

  -- Verify trigger executed
  IF v_final_log_count > v_initial_log_count THEN
    RAISE NOTICE '✅ SUCCESS: Trigger executed! New logs created: %', 
      v_final_log_count - v_initial_log_count;
    
    -- Show the trigger log
    RAISE NOTICE '';
    RAISE NOTICE '--- Trigger Log Details ---';
    FOR v_log IN 
      SELECT 
        action,
        details->>'trigger' as trigger_name,
        details->>'reservation_id' as reservation_id,
        details->>'spot_id' as spot_id,
        details->>'offer_created' as offer_created,
        created_at
      FROM waitlist_logs
      WHERE action = 'trigger_executed'
      ORDER BY created_at DESC
      LIMIT 1
    LOOP
      RAISE NOTICE 'Action: %', v_log.action;
      RAISE NOTICE 'Trigger: %', v_log.trigger_name;
      RAISE NOTICE 'Reservation ID: %', v_log.reservation_id;
      RAISE NOTICE 'Spot ID: %', v_log.spot_id;
      RAISE NOTICE 'Offer Created: %', v_log.offer_created;
      RAISE NOTICE 'Timestamp: %', v_log.created_at;
    END LOOP;
  ELSE
    RAISE WARNING '❌ FAILED: Trigger did not execute or log was not created';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '--- Cleanup ---';

  -- Cleanup test data
  DELETE FROM reservations WHERE id = v_reservation_id;
  DELETE FROM waitlist_entries WHERE id = v_entry_id;
  
  RAISE NOTICE '✓ Test data cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE '=== Test Complete ===';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '❌ ERROR: %', SQLERRM;
  RAISE NOTICE 'Error Detail: %', SQLSTATE;
  
  -- Attempt cleanup even on error
  BEGIN
    DELETE FROM reservations WHERE user_id = v_test_user_id AND reservation_date = v_test_date;
    DELETE FROM waitlist_entries WHERE user_id = v_test_user_id AND reservation_date = v_test_date;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore cleanup errors
  END;
END;
$$;

-- =====================================================
-- Verify Trigger Exists
-- =====================================================

SELECT 
  'Trigger exists: ' || 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES'
    ELSE '❌ NO'
  END as status
FROM pg_trigger
WHERE tgname = 'on_reservation_cancelled';

-- =====================================================
-- Verify Function Exists
-- =====================================================

SELECT 
  'Function exists: ' || 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES'
    ELSE '❌ NO'
  END as status
FROM pg_proc
WHERE proname = 'handle_reservation_cancelled';
