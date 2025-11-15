-- Simple verification script for process_waitlist_for_spot function

-- Check if function exists
SELECT 
  'Function exists: ' || CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '✗' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'process_waitlist_for_spot';

-- Check function signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'process_waitlist_for_spot';
