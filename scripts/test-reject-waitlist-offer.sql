-- Test script for reject_waitlist_offer function
-- This script tests the rejection of a waitlist offer

-- =====================================================
-- Setup: Create test data
-- =====================================================

DO $$
DECLARE
  v_test_user_id UUID;
  v_test_group_id UUID;
  v_test_spot_id UUID;
  v_test_entry_id UUID;
  v_test_offer_id UUID;
  v_test_date DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
  -- Get a test user (first authenticated user)
  SELECT id INTO v_test_user_id
  FROM auth.users
  LIMIT 1;

  IF v_test_user_id IS NULL THEN
    RAISE NOTICE 'No test user found. Please create a user first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using test user: %', v_test_user_id;

  -- Get a test parking group
  SELECT id INTO v_test_group_id
  FROM parking_groups
  WHERE is_active = TRUE
  LIMIT 1;

  IF v_test_group_id IS NULL THEN
    RAISE NOTICE 'No active parking group found.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using test group: %', v_test_group_id;

  -- Get a test parking spot
  SELECT id INTO v_test_spot_id
  FROM parking_spots
  WHERE group_id = v_test_group_id
    AND is_active = TRUE
  LIMIT 1;

  IF v_test_spot_id IS NULL THEN
    RAISE NOTICE 'No active parking spot found in group.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using test spot: %', v_test_spot_id;

  -- Ensure user has access to the group
  INSERT INTO user_group_assignments (user_id, group_id)
  VALUES (v_test_user_id, v_test_group_id)
  ON CONFLICT (user_id, group_id) DO NOTHING;

  -- Ensure user has an approved license plate
  INSERT INTO license_plates (user_id, plate_number, status)
  VALUES (v_test_user_id, 'TEST123', 'approved')
  ON CONFLICT (user_id, plate_number) 
  DO UPDATE SET status = 'approved', deleted_at = NULL;

  -- Enable waitlist in settings
  UPDATE reservation_settings
  SET 
    waitlist_enabled = TRUE,
    waitlist_penalty_enabled = TRUE,
    waitlist_penalty_threshold = 3;

  -- Create a waitlist entry
  INSERT INTO waitlist_entries (
    user_id,
    group_id,
    reservation_date,
    status
  )
  VALUES (
    v_test_user_id,
    v_test_group_id,
    v_test_date,
    'active'
  )
  ON CONFLICT (user_id, group_id, reservation_date) 
  DO UPDATE SET status = 'active'
  RETURNING id INTO v_test_entry_id;

  RAISE NOTICE 'Created waitlist entry: %', v_test_entry_id;

  -- Create a waitlist offer
  INSERT INTO waitlist_offers (
    entry_id,
    user_id,
    spot_id,
    reservation_date,
    status,
    expires_at
  )
  VALUES (
    v_test_entry_id,
    v_test_user_id,
    v_test_spot_id,
    v_test_date,
    'pending',
    NOW() + INTERVAL '2 hours'
  )
  RETURNING id INTO v_test_offer_id;

  RAISE NOTICE 'Created waitlist offer: %', v_test_offer_id;

  -- Update entry status to offer_pending
  UPDATE waitlist_entries
  SET status = 'offer_pending'
  WHERE id = v_test_entry_id;

  RAISE NOTICE '✅ Test data created successfully';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Test 1: Reject the offer';
  RAISE NOTICE '=====================================================';

  -- Test: Reject the offer
  BEGIN
    PERFORM reject_waitlist_offer(v_test_offer_id, v_test_user_id);
    RAISE NOTICE '✅ Offer rejected successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error rejecting offer: %', SQLERRM;
  END;

  -- Verify offer status
  DECLARE
    v_offer_status TEXT;
    v_responded_at TIMESTAMPTZ;
  BEGIN
    SELECT status, responded_at 
    INTO v_offer_status, v_responded_at
    FROM waitlist_offers
    WHERE id = v_test_offer_id;

    IF v_offer_status = 'rejected' AND v_responded_at IS NOT NULL THEN
      RAISE NOTICE '✅ Offer status updated to rejected';
      RAISE NOTICE '   Responded at: %', v_responded_at;
    ELSE
      RAISE NOTICE '❌ Offer status not updated correctly: %', v_offer_status;
    END IF;
  END;

  -- Verify entry status
  DECLARE
    v_entry_status TEXT;
  BEGIN
    SELECT status 
    INTO v_entry_status
    FROM waitlist_entries
    WHERE id = v_test_entry_id;

    IF v_entry_status = 'active' THEN
      RAISE NOTICE '✅ Entry status updated back to active';
    ELSE
      RAISE NOTICE '❌ Entry status not updated correctly: %', v_entry_status;
    END IF;
  END;

  -- Verify penalty counter
  DECLARE
    v_rejection_count INTEGER;
  BEGIN
    SELECT rejection_count 
    INTO v_rejection_count
    FROM waitlist_penalties
    WHERE user_id = v_test_user_id;

    IF v_rejection_count = 1 THEN
      RAISE NOTICE '✅ Rejection count incremented: %', v_rejection_count;
    ELSE
      RAISE NOTICE '❌ Rejection count not updated correctly: %', COALESCE(v_rejection_count, 0);
    END IF;
  END;

  -- Verify log entry
  DECLARE
    v_log_count INTEGER;
  BEGIN
    SELECT COUNT(*) 
    INTO v_log_count
    FROM waitlist_logs
    WHERE offer_id = v_test_offer_id
      AND action = 'offer_rejected';

    IF v_log_count > 0 THEN
      RAISE NOTICE '✅ Log entry created for rejection';
    ELSE
      RAISE NOTICE '❌ No log entry found for rejection';
    END IF;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Test 2: Try to reject already rejected offer';
  RAISE NOTICE '=====================================================';

  -- Test: Try to reject already rejected offer (should fail)
  BEGIN
    PERFORM reject_waitlist_offer(v_test_offer_id, v_test_user_id);
    RAISE NOTICE '❌ Should have failed but succeeded';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ Correctly rejected: %', SQLERRM;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Test 3: Try to reject with wrong user';
  RAISE NOTICE '=====================================================';

  -- Create another offer for testing wrong user
  DECLARE
    v_test_offer_id_2 UUID;
    v_wrong_user_id UUID;
  BEGIN
    -- Get another user
    SELECT id INTO v_wrong_user_id
    FROM auth.users
    WHERE id != v_test_user_id
    LIMIT 1;

    IF v_wrong_user_id IS NULL THEN
      RAISE NOTICE 'Skipping test - no second user available';
    ELSE
      -- Create new entry and offer
      INSERT INTO waitlist_entries (
        user_id,
        group_id,
        reservation_date,
        status
      )
      VALUES (
        v_test_user_id,
        v_test_group_id,
        v_test_date + INTERVAL '1 day',
        'offer_pending'
      )
      RETURNING id INTO v_test_entry_id;

      INSERT INTO waitlist_offers (
        entry_id,
        user_id,
        spot_id,
        reservation_date,
        status,
        expires_at
      )
      VALUES (
        v_test_entry_id,
        v_test_user_id,
        v_test_spot_id,
        v_test_date + INTERVAL '1 day',
        'pending',
        NOW() + INTERVAL '2 hours'
      )
      RETURNING id INTO v_test_offer_id_2;

      -- Try to reject with wrong user
      BEGIN
        PERFORM reject_waitlist_offer(v_test_offer_id_2, v_wrong_user_id);
        RAISE NOTICE '❌ Should have failed but succeeded';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✅ Correctly rejected wrong user: %', SQLERRM;
      END;
    END IF;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'All tests completed!';
  RAISE NOTICE '=====================================================';

END $$;
