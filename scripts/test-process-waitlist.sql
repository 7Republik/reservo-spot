-- Test script for process_waitlist_for_spot function
-- This script tests the waitlist processing logic

-- =====================================================
-- Setup: Create test data
-- =====================================================

DO $$
DECLARE
  v_test_user_id UUID;
  v_test_user2_id UUID;
  v_test_group_id UUID;
  v_test_spot_id UUID;
  v_test_date DATE := CURRENT_DATE + INTERVAL '1 day';
  v_entry_id UUID;
  v_entry2_id UUID;
  v_offer_id UUID;
BEGIN
  RAISE NOTICE '=== Testing process_waitlist_for_spot ===';
  RAISE NOTICE '';

  -- Get a test user with approved license plate
  SELECT u.id INTO v_test_user_id
  FROM auth.users u
  INNER JOIN profiles p ON p.id = u.id
  INNER JOIN license_plates lp ON lp.user_id = u.id
  WHERE p.is_blocked = false
    AND p.is_deactivated = false
    AND lp.status = 'approved'
    AND lp.deleted_at IS NULL
  LIMIT 1;

  IF v_test_user_id IS NULL THEN
    RAISE EXCEPTION 'No test user found with approved license plate';
  END IF;

  RAISE NOTICE 'Test User 1: %', v_test_user_id;

  -- Get a second test user
  SELECT u.id INTO v_test_user2_id
  FROM auth.users u
  INNER JOIN profiles p ON p.id = u.id
  INNER JOIN license_plates lp ON lp.user_id = u.id
  WHERE p.is_blocked = false
    AND p.is_deactivated = false
    AND lp.status = 'approved'
    AND lp.deleted_at IS NULL
    AND u.id != v_test_user_id
  LIMIT 1;

  RAISE NOTICE 'Test User 2: %', COALESCE(v_test_user2_id::text, 'Not found');

  -- Get a test parking group
  SELECT id INTO v_test_group_id
  FROM parking_groups
  WHERE is_active = true
  LIMIT 1;

  IF v_test_group_id IS NULL THEN
    RAISE EXCEPTION 'No active parking group found';
  END IF;

  RAISE NOTICE 'Test Group: %', v_test_group_id;

  -- Get a test parking spot
  SELECT id INTO v_test_spot_id
  FROM parking_spots
  WHERE group_id = v_test_group_id
    AND is_active = true
  LIMIT 1;

  IF v_test_spot_id IS NULL THEN
    RAISE EXCEPTION 'No active parking spot found';
  END IF;

  RAISE NOTICE 'Test Spot: %', v_test_spot_id;
  RAISE NOTICE 'Test Date: %', v_test_date;
  RAISE NOTICE '';

  -- =====================================================
  -- Test 1: Process waitlist with one user
  -- =====================================================
  RAISE NOTICE '--- Test 1: Process waitlist with one user ---';

  -- Create waitlist entry
  INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
  VALUES (v_test_user_id, v_test_group_id, v_test_date, 'active')
  RETURNING id INTO v_entry_id;

  RAISE NOTICE 'Created waitlist entry: %', v_entry_id;

  -- Process waitlist
  v_offer_id := process_waitlist_for_spot(v_test_spot_id, v_test_date);

  IF v_offer_id IS NOT NULL THEN
    RAISE NOTICE '✓ Offer created: %', v_offer_id;
    
    -- Verify offer details
    PERFORM 1 FROM waitlist_offers
    WHERE id = v_offer_id
      AND user_id = v_test_user_id
      AND spot_id = v_test_spot_id
      AND status = 'pending';
    
    IF FOUND THEN
      RAISE NOTICE '✓ Offer details are correct';
    ELSE
      RAISE EXCEPTION '✗ Offer details are incorrect';
    END IF;

    -- Verify entry status updated
    PERFORM 1 FROM waitlist_entries
    WHERE id = v_entry_id
      AND status = 'offer_pending';
    
    IF FOUND THEN
      RAISE NOTICE '✓ Entry status updated to offer_pending';
    ELSE
      RAISE EXCEPTION '✗ Entry status not updated';
    END IF;

    -- Verify log created
    PERFORM 1 FROM waitlist_logs
    WHERE offer_id = v_offer_id
      AND action = 'offer_created';
    
    IF FOUND THEN
      RAISE NOTICE '✓ Log entry created';
    ELSE
      RAISE EXCEPTION '✗ Log entry not created';
    END IF;
  ELSE
    RAISE EXCEPTION '✗ No offer created';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- Test 2: Process waitlist with multiple users (FIFO)
  -- =====================================================
  IF v_test_user2_id IS NOT NULL THEN
    RAISE NOTICE '--- Test 2: Process waitlist with multiple users ---';

    -- Clean up previous test
    DELETE FROM waitlist_offers WHERE id = v_offer_id;
    DELETE FROM waitlist_entries WHERE id = v_entry_id;

    -- Create two waitlist entries (user2 first, user1 second)
    INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status, created_at)
    VALUES 
      (v_test_user2_id, v_test_group_id, v_test_date, 'active', NOW() - INTERVAL '1 hour')
    RETURNING id INTO v_entry2_id;

    INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status, created_at)
    VALUES 
      (v_test_user_id, v_test_group_id, v_test_date, 'active', NOW())
    RETURNING id INTO v_entry_id;

    RAISE NOTICE 'Created two waitlist entries (user2 first, user1 second)';

    -- Process waitlist
    v_offer_id := process_waitlist_for_spot(v_test_spot_id, v_test_date);

    IF v_offer_id IS NOT NULL THEN
      -- Verify offer went to user2 (first in queue)
      PERFORM 1 FROM waitlist_offers
      WHERE id = v_offer_id
        AND user_id = v_test_user2_id;
      
      IF FOUND THEN
        RAISE NOTICE '✓ Offer went to first user in queue (FIFO)';
      ELSE
        RAISE EXCEPTION '✗ Offer did not go to first user';
      END IF;

      -- Verify user1 entry is still active
      PERFORM 1 FROM waitlist_entries
      WHERE id = v_entry_id
        AND status = 'active';
      
      IF FOUND THEN
        RAISE NOTICE '✓ Second user entry remains active';
      ELSE
        RAISE EXCEPTION '✗ Second user entry was modified';
      END IF;
    ELSE
      RAISE EXCEPTION '✗ No offer created';
    END IF;

    RAISE NOTICE '';
  END IF;

  -- =====================================================
  -- Test 3: No eligible users (empty waitlist)
  -- =====================================================
  RAISE NOTICE '--- Test 3: No eligible users ---';

  -- Clean up
  DELETE FROM waitlist_offers;
  DELETE FROM waitlist_entries;

  -- Process waitlist with no entries
  v_offer_id := process_waitlist_for_spot(v_test_spot_id, v_test_date);

  IF v_offer_id IS NULL THEN
    RAISE NOTICE '✓ Correctly returned NULL when no users in waitlist';
    
    -- Verify log created
    PERFORM 1 FROM waitlist_logs
    WHERE action = 'no_eligible_users'
      AND (details->>'spot_id')::uuid = v_test_spot_id;
    
    IF FOUND THEN
      RAISE NOTICE '✓ Log entry created for no eligible users';
    ELSE
      RAISE EXCEPTION '✗ Log entry not created';
    END IF;
  ELSE
    RAISE EXCEPTION '✗ Should have returned NULL';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- Cleanup
  -- =====================================================
  RAISE NOTICE '--- Cleanup ---';
  DELETE FROM waitlist_offers;
  DELETE FROM waitlist_entries;
  RAISE NOTICE '✓ Test data cleaned up';
  RAISE NOTICE '';

  RAISE NOTICE '=== All tests passed! ===';

EXCEPTION WHEN OTHERS THEN
  -- Cleanup on error
  DELETE FROM waitlist_offers;
  DELETE FROM waitlist_entries;
  RAISE NOTICE 'Cleaned up test data after error';
  RAISE;
END $$;
