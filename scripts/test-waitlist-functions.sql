-- Comprehensive test script for waitlist functions
-- Run this to verify all waitlist functions are working correctly

\echo '=== Waitlist Functions Verification ==='
\echo ''

-- =====================================================
-- 1. Check if all required functions exist
-- =====================================================
\echo '--- Checking function existence ---'

SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✓ All required functions exist'
    ELSE '✗ Missing functions: ' || (2 - COUNT(*))::text
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('register_in_waitlist', 'process_waitlist_for_spot');

\echo ''

-- =====================================================
-- 2. Check function signatures
-- =====================================================
\echo '--- Function signatures ---'

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('register_in_waitlist', 'process_waitlist_for_spot')
ORDER BY p.proname;

\echo ''

-- =====================================================
-- 3. Check waitlist tables
-- =====================================================
\echo '--- Checking waitlist tables ---'

SELECT 
  CASE 
    WHEN COUNT(*) = 5 THEN '✓ All waitlist tables exist'
    ELSE '✗ Missing tables: ' || (5 - COUNT(*))::text
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('waitlist_entries', 'waitlist_offers', 'waitlist_logs', 
                     'waitlist_penalties', 'notifications');

\echo ''

-- =====================================================
-- 4. Check reservation_settings has waitlist fields
-- =====================================================
\echo '--- Checking reservation_settings columns ---'

SELECT 
  CASE 
    WHEN COUNT(*) = 7 THEN '✓ All waitlist settings columns exist'
    ELSE '✗ Missing columns: ' || (7 - COUNT(*))::text
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reservation_settings'
  AND column_name IN (
    'waitlist_enabled',
    'waitlist_acceptance_time_minutes',
    'waitlist_max_simultaneous',
    'waitlist_priority_by_role',
    'waitlist_penalty_enabled',
    'waitlist_penalty_threshold',
    'waitlist_penalty_duration_days'
  );

\echo ''

-- =====================================================
-- 5. Check RLS policies on waitlist tables
-- =====================================================
\echo '--- Checking RLS policies ---'

SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('waitlist_entries', 'waitlist_offers', 'waitlist_logs', 
                    'waitlist_penalties', 'notifications')
GROUP BY schemaname, tablename
ORDER BY tablename;

\echo ''

-- =====================================================
-- 6. Check current waitlist settings
-- =====================================================
\echo '--- Current waitlist settings ---'

SELECT 
  waitlist_enabled,
  waitlist_acceptance_time_minutes,
  waitlist_max_simultaneous,
  waitlist_priority_by_role,
  waitlist_penalty_enabled,
  waitlist_penalty_threshold,
  waitlist_penalty_duration_days
FROM reservation_settings
LIMIT 1;

\echo ''

-- =====================================================
-- 7. Check waitlist data counts
-- =====================================================
\echo '--- Current waitlist data ---'

SELECT 
  'waitlist_entries' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM waitlist_entries
UNION ALL
SELECT 
  'waitlist_offers',
  COUNT(*),
  COUNT(CASE WHEN status = 'pending' THEN 1 END)
FROM waitlist_offers
UNION ALL
SELECT 
  'waitlist_logs',
  COUNT(*),
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END)
FROM waitlist_logs
UNION ALL
SELECT 
  'waitlist_penalties',
  COUNT(*),
  COUNT(CASE WHEN is_blocked = true THEN 1 END)
FROM waitlist_penalties;

\echo ''
\echo '=== Verification Complete ==='
