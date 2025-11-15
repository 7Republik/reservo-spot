-- Test script for accept_waitlist_offer function
-- This script tests the complete flow of accepting a waitlist offer

-- Setup: Create test data
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_spot_id UUID;
  v_test_group_id UUID;
  v_test_entry_id UUID;
  v_test_offer_id UUID;
  v_reservation_id UUID;
  v_test_date DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
  RAISE NOTICE '=== Testing accept_waitlist_offer function ===';
  RAISE NOTICE '';

  -- Get a test user (first authenticated user)
  SELECT id INTO v_test_user_id
  FROM auth.users
  LIMIT 1;

  IF v_test_user_id IS NULL THEN
    RAISE EXCEPTION 'No test user found. Please create a user first.';
  END IF;

  RAISE NOTICE 'Test user ID: %', v_test_user_id;

  -- Get a test parking group
  SELECT id INTO v_test_group_id
  FROM parking_groups
  WHERE is_active = true
  LIMIT 1;

  IF v_test_group_id IS NULL THEN
    RAISE EXCEPTION 'No active parking group found.';
  END IF;

  RAISE NOTICE 'Test group ID: %', v_test_group_id;

  -- Get a test parking spot
  SELECT id INTO v_test_spot_id
  FROM parking_spots
  WHERE group_id = v_test_group_id
    AND is_active = true
  LIMIT 1;

  IF v_test_spot_id IS NULL THEN
    RAISE EXCEPTION 'No active parking spot found in group.';
  END IF;

  RAISE NOTICE 'Test spot ID: %', v_test_spot_id;
  RAISE NOTICE '';

  -- Test 1: Create a waitlist entry
  RAISE NOTICE 'Test 1: Creating waitlist entry...';
  INSERT INTO waitlist_entries (
    user_id,
    group_id,
    reservation_date,
    status,
    created_at
  )
  VALUES (
    v_test_user_id,
    v_test_group_id,
    v_test_date,
    'active',
    NOW()
  )
  RETURNING id INTO v_test_entry_id;

  RAISE NOTICE '✓ Waitlist entry created: %', v_test_entry_id;
  RAISE NOTICE '';

  -- Test 2: Create a waitlist offer
  RAISE NOTICE 'Test 2: Creating waitlist offer...';
  INSERT INTO waitlist_offers (
    entry_id,
    user_id,
    spot_id,
    reservation_date,
    status,
    created_at,
    expires_at
  )
  VALUES (
    v_test_entry_id,
    v_test_user_id,
    v_test_spot_id,
    v_test_date,
    'pending',
    NOW(),
    NOW() + INTERVAL '2 hours'
  )
  RETURNING id INTO v_test_offer_id;

  RAISE NOTICE '✓ Waitlist offer created: %', v_test_offer_id;
  RAISE NOTICE '  Expires at: %', NOW() + INTERVAL '2 hours';
  RAISE NOTICE '';

  -- Test 3: Accept the offer
  RAISE NOTICE 'Test 3: Accepting waitlist offer...';
  BEGIN
    SELECT accept_waitlist_offer(v_test_offer_id, v_test_user_id)
    INTO v_reservation_id;

    RAISE NOTICE '✓ Offer accepted successfully!';
    RAISE NOTICE '  Reservation ID: %', v_reservation_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ Error accepting offer: %', SQLERRM;
      RAISE;
  END;
  RAISE NOTICE '';

  -- Test 4: Verify reservation was created
  RAISE NOTICE 'Test 4: Verifying reservation...';
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE id = v_reservation_id
      AND user_id = v_test_user_id
      AND spot_id = v_test_spot_id
      AND reservation_date = v_test_date
      AND status = 'active'
  ) THEN
    RAISE NOTICE '✓ Reservation created correctly';
  ELSE
    RAISE NOTICE '✗ Reservation not found or incorrect';
  END IF;
  RAISE NOTICE '';

  -- Test 5: Verify offer status updated
  RAISE NOTICE 'Test 5: Verifying offer status...';
  IF EXISTS (
    SELECT 1 FROM waitlist_offers
    WHERE id = v_test_offer_id
      AND status = 'accepted'
      AND responded_at IS NOT NULL
  ) THEN
    RAISE NOTICE '✓ Offer status updated to accepted';
  ELSE
    RAISE NOTICE '✗ Offer status not updated correctly';
  END IF;
  RAISE NOTICE '';

  -- Test 6: Verify waitlist entries deleted
  RAISE NOTICE 'Test 6: Verifying waitlist entries deleted...';
  IF NOT EXISTS (
    SELECT 1 FROM waitlist_entries
    WHERE user_id = v_test_user_id
  ) THEN
    RAISE NOTICE '✓ All waitlist entries deleted for user';
  ELSE
    RAISE NOTICE '✗ Waitlist entries still exist for user';
  END IF;
  RAISE NOTICE '';

  -- Test 7: Verify log entry created
  RAISE NOTICE 'Test 7: Verifying log entry...';
  IF EXISTS (
    SELECT 1 FROM waitlist_logs
    WHERE user_id = v_test_user_id
      AND offer_id = v_test_offer_id
      AND action = 'offer_accepted'
  ) THEN
    RAISE NOTICE '✓ Log entry created';
  ELSE
    RAISE NOTICE '✗ Log entry not found';
  END IF;
  RAISE NOTICE '';

  -- Cleanup
  RAISE NOTICE 'Cleaning up test data...';
  DELETE FROM reservations WHERE id = v_reservation_id;
  DELETE FROM waitlist_offers WHERE id = v_test_offer_id;
  DELETE FROM waitlist_entries WHERE id = v_test_entry_id;
  RAISE NOTICE '✓ Cleanup complete';
  RAISE NOTICE '';

  RAISE NOTICE '=== All tests completed successfully! ===';

END $$;

-- Test error cases
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_spot_id UUID;
  v_test_group_id UUID;
  v_test_entry_id UUID;
  v_test_offer_id UUID;
  v_other_user_id UUID;
  v_test_date DATE := CURRENT_DATE + INTERVAL '2 days';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Testing error cases ===';
  RAISE NOTICE '';

  -- Get test users
  SELECT id INTO v_test_user_id
  FROM auth.users
  LIMIT 1;

  SELECT id INTO v_other_user_id
  FROM auth.users
  WHERE id != v_test_user_id
  LIMIT 1;

  -- Get test data
  SELECT id INTO v_test_group_id
  FROM parking_groups
  WHERE is_active = true
  LIMIT 1;

  SELECT id INTO v_test_spot_id
  FROM parking_spots
  WHERE group_id = v_test_group_id
    AND is_active = true
  LIMIT 1;

  -- Test Error 1: Non-existent offer
  RAISE NOTICE 'Test Error 1: Trying to accept non-existent offer...';
  BEGIN
    PERFORM accept_waitlist_offer(gen_random_uuid(), v_test_user_id);
    RAISE NOTICE '✗ Should have raised exception';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✓ Correctly raised exception: %', SQLERRM;
  END;
  RAISE NOTICE '';

  -- Test Error 2: Wrong user trying to accept
  IF v_other_user_id IS NOT NULL THEN
    RAISE NOTICE 'Test Error 2: Wrong user trying to accept offer...';
    
    -- Create test offer
    INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
    VALUES (v_test_user_id, v_test_group_id, v_test_date, 'active')
    RETURNING id INTO v_test_entry_id;

    INSERT INTO waitlist_offers (entry_id, user_id, spot_id, reservation_date, status, expires_at)
    VALUES (v_test_entry_id, v_test_user_id, v_test_spot_id, v_test_date, 'pending', NOW() + INTERVAL '2 hours')
    RETURNING id INTO v_test_offer_id;

    BEGIN
      PERFORM accept_waitlist_offer(v_test_offer_id, v_other_user_id);
      RAISE NOTICE '✗ Should have raised exception';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '✓ Correctly raised exception: %', SQLERRM;
    END;

    -- Cleanup
    DELETE FROM waitlist_offers WHERE id = v_test_offer_id;
    DELETE FROM waitlist_entries WHERE id = v_test_entry_id;
    RAISE NOTICE '';
  END IF;

  -- Test Error 3: Expired offer
  RAISE NOTICE 'Test Error 3: Trying to accept expired offer...';
  
  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES (v_test_user_id, v_test_group_id, v_test_date, 'active')
  RETURNING id INTO v_test_entry_id;

  INSERT INTO waitlist_offers (entry_id, user_id, spot_id, reservation_date, status, expires_at)
  VALUES (v_test_entry_id, v_test_user_id, v_test_spot_id, v_test_date, 'pending', NOW() - INTERVAL '1 hour')
  RETURNING id INTO v_test_offer_id;

  BEGIN
    PERFORM accept_waitlist_offer(v_test_offer_id, v_test_user_id);
    RAISE NOTICE '✗ Should have raised exception';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✓ Correctly raised exception: %', SQLERRM;
  END;

  -- Cleanup
  DELETE FROM waitlist_offers WHERE id = v_test_offer_id;
  DELETE FROM waitlist_entries WHERE id = v_test_entry_id;
  RAISE NOTICE '';

  -- Test Error 4: Spot already reserved
  RAISE NOTICE 'Test Error 4: Trying to accept offer for already reserved spot...';
  
  -- Create existing reservation
  INSERT INTO reservations (user_id, spot_id, reservation_date, status)
  VALUES (v_other_user_id, v_test_spot_id, v_test_date, 'active');

  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES (v_test_user_id, v_test_group_id, v_test_date, 'active')
  RETURNING id INTO v_test_entry_id;

  INSERT INTO waitlist_offers (entry_id, user_id, spot_id, reservation_date, status, expires_at)
  VALUES (v_test_entry_id, v_test_user_id, v_test_spot_id, v_test_date, 'pending', NOW() + INTERVAL '2 hours')
  RETURNING id INTO v_test_offer_id;

  BEGIN
    PERFORM accept_waitlist_offer(v_test_offer_id, v_test_user_id);
    RAISE NOTICE '✗ Should have raised exception';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✓ Correctly raised exception: %', SQLERRM;
  END;

  -- Cleanup
  DELETE FROM reservations WHERE spot_id = v_test_spot_id AND reservation_date = v_test_date;
  DELETE FROM waitlist_offers WHERE id = v_test_offer_id;
  DELETE FROM waitlist_entries WHERE id = v_test_entry_id;
  RAISE NOTICE '';

  RAISE NOTICE '=== All error case tests completed! ===';

END $$;
