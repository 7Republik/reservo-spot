-- Test simple de create_waitlist_offer()
-- Ejecutar manualmente en Supabase SQL Editor

-- 1. Verificar que la función existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_waitlist_offer';

-- 2. Obtener un usuario de prueba
SELECT id, email 
FROM auth.users 
WHERE email LIKE '%@example.com' 
LIMIT 1;

-- 3. Obtener un grupo activo
SELECT id, name 
FROM public.parking_groups 
WHERE is_active = true 
LIMIT 1;

-- 4. Obtener un spot activo
SELECT ps.id, ps.spot_number, pg.name as group_name
FROM public.parking_spots ps
JOIN public.parking_groups pg ON ps.group_id = pg.id
WHERE ps.is_active = true 
  AND pg.is_active = true
LIMIT 1;

-- 5. Crear una entrada de lista de espera de prueba
-- REEMPLAZAR <user_id> y <group_id> con valores reales de los queries anteriores
/*
INSERT INTO public.waitlist_entries (
  user_id,
  group_id,
  reservation_date,
  status
)
VALUES (
  '<user_id>'::UUID,
  '<group_id>'::UUID,
  CURRENT_DATE + INTERVAL '3 days',
  'active'
)
RETURNING id;
*/

-- 6. Llamar a la función create_waitlist_offer
-- REEMPLAZAR <entry_id> y <spot_id> con valores reales
/*
SELECT public.create_waitlist_offer(
  '<entry_id>'::UUID,
  '<spot_id>'::UUID
);
*/

-- 7. Verificar que la oferta se creó
/*
SELECT 
  wo.id,
  wo.status,
  wo.expires_at,
  wo.expires_at - NOW() as time_remaining,
  ps.spot_number,
  pg.name as group_name
FROM public.waitlist_offers wo
JOIN public.parking_spots ps ON wo.spot_id = ps.id
JOIN public.parking_groups pg ON ps.group_id = pg.id
WHERE wo.entry_id = '<entry_id>'::UUID;
*/

-- 8. Verificar que la entrada se actualizó
/*
SELECT id, status, updated_at
FROM public.waitlist_entries
WHERE id = '<entry_id>'::UUID;
*/

-- 9. Verificar el log
/*
SELECT 
  action,
  details->>'spot_number' as spot_number,
  details->>'group_name' as group_name,
  details->>'acceptance_time_minutes' as acceptance_time,
  created_at
FROM public.waitlist_logs
WHERE entry_id = '<entry_id>'::UUID
  AND action = 'offer_created';
*/
