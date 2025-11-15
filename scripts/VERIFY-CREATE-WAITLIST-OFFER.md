# Verificación de create_waitlist_offer()

## Función Implementada

✅ **Función:** `public.create_waitlist_offer(p_entry_id UUID, p_spot_id UUID)`

**Características:**
- Crea una oferta de reserva para un usuario en lista de espera
- Calcula tiempo de expiración basado en configuración del sistema
- Actualiza el estado de la entrada a `offer_pending`
- Registra la acción en `waitlist_logs` con detalles completos
- Retorna el `offer_id` para ser usado en notificaciones
- Manejo de errores con logging automático

## Verificación Manual

### Opción 1: Usar Supabase SQL Editor

1. Abre el SQL Editor en Supabase Dashboard:
   https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/sql/new

2. Ejecuta los queries del archivo `scripts/test-create-offer-simple.sql` paso a paso

### Opción 2: Verificación Rápida

Ejecuta este query en el SQL Editor:

```sql
-- Verificar que la función existe
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_waitlist_offer';
```

**Resultado esperado:**
- `routine_name`: create_waitlist_offer
- `routine_type`: FUNCTION
- `return_type`: uuid

## Prueba Completa

### Paso 1: Preparar datos de prueba

```sql
-- Obtener IDs necesarios
WITH test_data AS (
  SELECT 
    (SELECT id FROM auth.users LIMIT 1) as user_id,
    (SELECT id FROM public.parking_groups WHERE is_active = true LIMIT 1) as group_id,
    (SELECT id FROM public.parking_spots WHERE is_active = true LIMIT 1) as spot_id
)
SELECT * FROM test_data;
```

### Paso 2: Crear entrada de lista de espera

```sql
-- Reemplazar <user_id> y <group_id> con valores del paso anterior
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
RETURNING id, user_id, group_id, reservation_date, status;
```

### Paso 3: Crear oferta

```sql
-- Reemplazar <entry_id> y <spot_id> con valores reales
SELECT public.create_waitlist_offer(
  '<entry_id>'::UUID,
  '<spot_id>'::UUID
) as offer_id;
```

### Paso 4: Verificar resultados

```sql
-- Verificar oferta creada
SELECT 
  wo.id as offer_id,
  wo.status,
  wo.expires_at,
  EXTRACT(EPOCH FROM (wo.expires_at - NOW())) / 60 as minutes_remaining,
  ps.spot_number,
  pg.name as group_name,
  u.email as user_email
FROM public.waitlist_offers wo
JOIN public.parking_spots ps ON wo.spot_id = ps.id
JOIN public.parking_groups pg ON ps.group_id = pg.id
JOIN auth.users u ON wo.user_id = u.id
WHERE wo.entry_id = '<entry_id>'::UUID;

-- Verificar entrada actualizada
SELECT 
  id,
  status,
  updated_at
FROM public.waitlist_entries
WHERE id = '<entry_id>'::UUID;

-- Verificar log
SELECT 
  action,
  details->>'spot_number' as spot_number,
  details->>'group_name' as group_name,
  details->>'reservation_date' as reservation_date,
  details->>'acceptance_time_minutes' as acceptance_time,
  created_at
FROM public.waitlist_logs
WHERE entry_id = '<entry_id>'::UUID
  AND action = 'offer_created'
ORDER BY created_at DESC
LIMIT 1;
```

## Validaciones Esperadas

### ✅ Oferta creada correctamente
- `status` = 'pending'
- `expires_at` > NOW()
- `expires_at` <= NOW() + tiempo configurado (default: 120 minutos)

### ✅ Entrada actualizada
- `status` = 'offer_pending'
- `updated_at` actualizado

### ✅ Log registrado
- `action` = 'offer_created'
- `details` contiene:
  - spot_id
  - spot_number
  - group_name
  - reservation_date
  - expires_at
  - acceptance_time_minutes

## Prueba de Errores

### Error con entrada inválida

```sql
-- Debe lanzar error
SELECT public.create_waitlist_offer(
  gen_random_uuid(),  -- entrada que no existe
  (SELECT id FROM public.parking_spots WHERE is_active = true LIMIT 1)
);
```

**Resultado esperado:** Error "Entrada de lista de espera no encontrada o no está activa"

## Configuración de Tiempo de Aceptación

Para cambiar el tiempo de aceptación:

```sql
-- Cambiar a 60 minutos
UPDATE public.reservation_settings
SET waitlist_acceptance_time_minutes = 60;

-- Verificar
SELECT waitlist_acceptance_time_minutes
FROM public.reservation_settings;
```

## Limpieza de Datos de Prueba

```sql
-- Eliminar ofertas de prueba
DELETE FROM public.waitlist_offers 
WHERE entry_id IN (
  SELECT id FROM public.waitlist_entries 
  WHERE reservation_date > CURRENT_DATE + INTERVAL '2 days'
);

-- Eliminar entradas de prueba
DELETE FROM public.waitlist_entries 
WHERE reservation_date > CURRENT_DATE + INTERVAL '2 days';
```

## Archivos Relacionados

- **Migración:** `supabase/migrations/20251115095744_add_create_waitlist_offer_function.sql`
- **Script de prueba completo:** `scripts/test-create-waitlist-offer.sql`
- **Script de prueba simple:** `scripts/test-create-offer-simple.sql`

## Próximos Pasos

Una vez verificada esta función, continuar con:
- ✅ Tarea 6: Implementar trigger de cancelación de reserva
- ✅ Tarea 7: Implementar función de aceptación de oferta
- ✅ Tarea 8: Implementar función de rechazo de oferta
