-- Quick verification script for on_reservation_cancelled trigger

-- Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'on_reservation_cancelled';

-- Check if function exists
SELECT 
  proname as function_name,
  pronargs as num_args,
  prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'handle_reservation_cancelled';

-- Check recent waitlist logs to see if trigger has fired
SELECT 
  action,
  details->>'trigger' as trigger_name,
  details->>'reservation_id' as reservation_id,
  details->>'spot_id' as spot_id,
  details->>'offer_created' as offer_created,
  created_at
FROM waitlist_logs
WHERE action = 'trigger_executed'
  AND details->>'trigger' = 'on_reservation_cancelled'
ORDER BY created_at DESC
LIMIT 5;
