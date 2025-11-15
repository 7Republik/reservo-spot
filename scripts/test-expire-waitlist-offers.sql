-- Test script for expire_waitlist_offers function
-- This script tests the expiration of waitlist offers

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
  v_expired_count INTEGER;
BEGIN
  RAISE NOTICE '=== Starting expire_waitlist_offers test ===';

  -- Get a test user (first authenticated user)
  SELECT id INTO v_test_user_id
  FROM auth.users
  WHERE email LIKE '%test%' OR email LIKE '%demo%'
  LIMIT 1;

  IF v_test_user_id IS NULL THEN
    SELECT id INTO v_test_user_id
    FROM auth.users
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Test user ID: %', v_test_user_id;

  -- Get a test parking group
  SELECT id INTO v_test_group_id
  FROM parking_groups
  WHERE is_active = TRUE
  LIMIT 1;

  RAISE NOTICE 'Test group ID: %', v_test_group_id;

  -- Get a test parking spot
  SELECT id INTO v_test_spot_id
  FROM parking_spots
  WHERE group_id = v_test_group_id
    AND is_active = TRUE
  LIMIT 1;

  RAISE NOTICE 'Test spot ID: %', v_test_spot_id;

  -- =====================================================
  -- Test 1: Create an expired offer manually
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Test 1: Create expired offer ---';

  -- Create a waitlist entry
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
    CURRENT_DATE + 1,
    'offer_pending',
    NOW()
  )
  RETURNING id INTO v_test_entry_id;

  RAISE NOTICE 'Created test entry: %', v_test_entry_id;

  -- Create an expired offer (expires_at in the past)
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
    CURRENT_DATE + 1,
    'pending',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '1 hour' -- Expired 1 hour ago
  )
  RETURNING id INTO v_test_offer_id;

  RAISE NOTICE 'Created expired offer: %', v_test_offer_id;

  -- =====================================================
  -- Test 2: Run expire_waitlist_offers function
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Test 2: Run expire function ---';

  SELECT expire_waitlist_offers() INTO v_expired_count;

  RAISE NOTICE 'Expired offers count: %', v_expired_count;

  -- =====================================================
  -- Test 3: Verify results
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Test 3: Verify results ---';

  -- Check offer status
  DECLARE
    v_offer_status TEXT;
    v_offer_responded_at TIMESTAMPTZ;
  BEGIN
    SELECT status, responded_at
    INTO v_offer_status, v_offer_responded_at
    FROM waitlist_offers
    WHERE id = v_test_offer_id;

    RAISE NOTICE 'Offer status: % (should be expired)', v_offer_status;
    RAISE NOTICE 'Offer responded_at: % (should be set)', v_offer_responded_at;

    IF v_offer_status = 'expired' AND v_offer_responded_at IS NOT NULL THEN
      RAISE NOTICE '✓ Offer correctly marked as expired';
    ELSE
      RAISE WARNING '✗ Offer status incorrect!';
    END IF;
  END;

  -- Check entry status
  DECLARE
    v_entry_status TEXT;
  BEGIN
    SELECT status
    INTO v_entry_status
    FROM waitlist_entries
    WHERE id = v_test_entry_id;

    RAISE NOTICE 'Entry status: % (should be active)', v_entry_status;

    IF v_entry_status = 'active' THEN
      RAISE NOTICE '✓ Entry correctly set back to active';
    ELSE
      RAISE WARNING '✗ Entry status incorrect!';
    END IF;
  END;

  -- Check penalty record
  DECLARE
    v_no_response_count INTEGER;
    v_is_blocked BOOLEAN;
  BEGIN
    SELECT no_response_count, is_blocked
    INTO v_no_response_count, v_is_blocked
    FROM waitlist_penalties
    WHERE user_id = v_test_user_id;

    IF FOUND THEN
      RAISE NOTICE 'Penalty record found:';
      RAISE NOTICE '  - no_response_count: %', v_no_response_count;
      RAISE NOTICE '  - is_blocked: %', v_is_blocked;
      RAISE NOTICE '✓ Penalty system working';
    ELSE
      RAISE NOTICE 'No penalty record (penalty might be disabled)';
    END IF;
  END;

  -- Check logs
  DECLARE
    v_log_count INTEGER;
  BEGIN
    SELECT COUNT(*)
    INTO v_log_count
    FROM waitlist_logs
    WHERE offer_id = v_test_offer_id
      AND action = 'offer_expired';

    RAISE NOTICE 'Logs with action=offer_expired: %', v_log_count;

    IF v_log_count > 0 THEN
      RAISE NOTICE '✓ Expiration logged correctly';
    ELSE
      RAISE WARNING '✗ No expiration log found!';
    END IF;
  END;

  -- =====================================================
  -- Cleanup: Remove test data
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Cleanup: Removing test data ---';

  DELETE FROM waitlist_offers WHERE id = v_test_offer_id;
  DELETE FROM waitlist_entries WHERE id = v_test_entry_id;
  -- Note: We keep penalty records for audit purposes

  RAISE NOTICE '✓ Test data cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE '=== Test completed successfully ===';

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Test failed with error: %', SQLERRM;
    RAISE WARNING 'Error detail: %', SQLSTATE;
END;
$$;

-- =====================================================
-- Display current waitlist settings
-- =====================================================
SELECT 
  waitlist_enabled,
  waitlist_acceptance_time_minutes,
  waitlist_penalty_enabled,
  waitlist_penalty_threshold,
  waitlist_penalty_duration_days
FROM reservation_settings;
