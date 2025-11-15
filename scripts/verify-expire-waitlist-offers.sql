-- Verification script for expire_waitlist_offers function
-- This script verifies the function exists and can be called

-- =====================================================
-- 1. Verify function exists
-- =====================================================
SELECT 
  p.proname as function_name,
  pg_catalog.pg_get_function_result(p.oid) as return_type,
  p.prosecdef as is_security_definer,
  pg_catalog.pg_get_function_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'expire_waitlist_offers'
  AND n.nspname = 'public';

-- =====================================================
-- 2. Test function call (should return 0 if no expired offers)
-- =====================================================
SELECT expire_waitlist_offers() as expired_count;

-- =====================================================
-- 3. Check waitlist configuration
-- =====================================================
SELECT 
  COALESCE(waitlist_enabled, FALSE) as waitlist_enabled,
  COALESCE(waitlist_acceptance_time_minutes, 120) as acceptance_time_minutes,
  COALESCE(waitlist_penalty_enabled, FALSE) as penalty_enabled,
  COALESCE(waitlist_penalty_threshold, 3) as penalty_threshold,
  COALESCE(waitlist_penalty_duration_days, 7) as penalty_duration_days
FROM reservation_settings
LIMIT 1;

-- =====================================================
-- 4. Check for any pending offers
-- =====================================================
SELECT 
  COUNT(*) as pending_offers_count,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_offers_count
FROM waitlist_offers
WHERE status = 'pending';

-- =====================================================
-- 5. Check recent logs
-- =====================================================
SELECT 
  action,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM waitlist_logs
WHERE action IN ('offer_expired', 'cleanup_executed', 'penalty_applied')
GROUP BY action
ORDER BY last_occurrence DESC NULLS LAST;
