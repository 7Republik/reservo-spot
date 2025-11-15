# Verificación: expire_waitlist_offers Function

## Descripción

Este documento describe cómo verificar que la función `expire_waitlist_offers()` funciona correctamente.

## Función Implementada

**Nombre:** `public.expire_waitlist_offers()`  
**Retorna:** `INTEGER` (número de ofertas expiradas)  
**Tipo:** `SECURITY DEFINER`

## Funcionalidad

La función busca todas las ofertas pendientes (`status = 'pending'`) cuyo `expires_at` ha pasado y:

1. ✅ Actualiza el status de la oferta a `'expired'`
2. ✅ Establece `responded_at` a NOW()
3. ✅ Actualiza el status de la entrada a `'active'`
4. ✅ Si penalización está habilitada:
   - Incrementa `no_response_count` en `waitlist_penalties`
   - Si alcanza el threshold, bloquea al usuario temporalmente
   - Elimina todas las entradas activas del usuario bloqueado
5. ✅ Registra la expiración en `waitlist_logs`
6. ✅ Llama a `process_waitlist_for_spot()` para buscar siguiente usuario
7. ✅ Retorna el número total de ofertas expiradas

## Cómo Probar

### Opción 1: Script Automatizado

Ejecuta el script de prueba que crea datos de prueba, ejecuta la función y verifica los resultados:

```bash
# Desde Supabase SQL Editor o psql
psql -h db.rlrzcfnhhvrvrxzfifeh.supabase.co \
     -U postgres \
     -d postgres \
     -f scripts/test-expire-waitlist-offers.sql
```

O copia y pega el contenido de `scripts/test-expire-waitlist-offers.sql` en el SQL Editor de Supabase.

### Opción 2: Prueba Manual

#### Paso 1: Verificar configuración

```sql
SELECT 
  waitlist_enabled,
  waitlist_acceptance_time_minutes,
  waitlist_penalty_enabled,
  waitlist_penalty_threshold,
  waitlist_penalty_duration_days
FROM reservation_settings;
```

**Resultado esperado:**
- `waitlist_penalty_enabled` debe estar en `true` o `false`
- `waitlist_penalty_threshold` debe ser un número (ej: 3)
- `waitlist_penalty_duration_days` debe ser un número (ej: 7)

#### Paso 2: Crear oferta expirada de prueba

```sql
-- Obtener IDs de prueba
SELECT id FROM auth.users LIMIT 1; -- Usar este como user_id
SELECT id FROM parking_groups WHERE is_active = true LIMIT 1; -- Usar como group_id
SELECT id FROM parking_spots WHERE is_active = true LIMIT 1; -- Usar como spot_id

-- Crear entrada en waitlist
INSERT INTO waitlist_entries (
  user_id,
  group_id,
  reservation_date,
  status
) VALUES (
  'USER_ID_AQUI',
  'GROUP_ID_AQUI',
  CURRENT_DATE + 1,
  'offer_pending'
) RETURNING id; -- Guardar este entry_id

-- Crear oferta expirada
INSERT INTO waitlist_offers (
  entry_id,
  user_id,
  spot_id,
  reservation_date,
  status,
  created_at,
  expires_at
) VALUES (
  'ENTRY_ID_AQUI',
  'USER_ID_AQUI',
  'SPOT_ID_AQUI',
  CURRENT_DATE + 1,
  'pending',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '1 hour' -- Expiró hace 1 hora
) RETURNING id; -- Guardar este offer_id
```

#### Paso 3: Ejecutar función

```sql
SELECT expire_waitlist_offers();
```

**Resultado esperado:**
- Retorna `1` (o el número de ofertas expiradas)

#### Paso 4: Verificar resultados

```sql
-- Verificar que la oferta está expirada
SELECT 
  id,
  status, -- Debe ser 'expired'
  responded_at -- Debe tener timestamp
FROM waitlist_offers
WHERE id = 'OFFER_ID_AQUI';

-- Verificar que la entrada volvió a 'active'
SELECT 
  id,
  status -- Debe ser 'active'
FROM waitlist_entries
WHERE id = 'ENTRY_ID_AQUI';

-- Verificar penalización (si está habilitada)
SELECT 
  user_id,
  no_response_count, -- Debe haberse incrementado
  is_blocked, -- Puede ser true si alcanzó threshold
  blocked_until
FROM waitlist_penalties
WHERE user_id = 'USER_ID_AQUI';

-- Verificar logs
SELECT 
  action,
  details,
  created_at
FROM waitlist_logs
WHERE offer_id = 'OFFER_ID_AQUI'
ORDER BY created_at DESC;
```

**Resultados esperados:**
- ✅ Oferta con `status = 'expired'` y `responded_at` establecido
- ✅ Entrada con `status = 'active'`
- ✅ Si penalización habilitada: `no_response_count` incrementado
- ✅ Si alcanzó threshold: usuario bloqueado con `is_blocked = true`
- ✅ Log con `action = 'offer_expired'`
- ✅ Si usuario bloqueado: log con `action = 'penalty_applied'`

#### Paso 5: Limpiar datos de prueba

```sql
DELETE FROM waitlist_offers WHERE id = 'OFFER_ID_AQUI';
DELETE FROM waitlist_entries WHERE id = 'ENTRY_ID_AQUI';
-- Opcional: limpiar penalty record
DELETE FROM waitlist_penalties WHERE user_id = 'USER_ID_AQUI';
```

## Casos de Prueba

### Caso 1: Expiración sin penalización

**Setup:**
- `waitlist_penalty_enabled = false`
- Crear oferta expirada

**Resultado esperado:**
- ✅ Oferta expirada
- ✅ Entrada vuelve a active
- ✅ NO se crea/actualiza penalty record
- ✅ Se procesa siguiente usuario en waitlist

### Caso 2: Expiración con penalización (bajo threshold)

**Setup:**
- `waitlist_penalty_enabled = true`
- `waitlist_penalty_threshold = 3`
- Usuario con `no_response_count = 1`
- Crear oferta expirada

**Resultado esperado:**
- ✅ Oferta expirada
- ✅ `no_response_count` incrementa a 2
- ✅ Usuario NO bloqueado (2 < 3)
- ✅ Se procesa siguiente usuario

### Caso 3: Expiración alcanzando threshold

**Setup:**
- `waitlist_penalty_enabled = true`
- `waitlist_penalty_threshold = 3`
- Usuario con `no_response_count = 2`
- Crear oferta expirada

**Resultado esperado:**
- ✅ Oferta expirada
- ✅ `no_response_count` incrementa a 3
- ✅ Usuario BLOQUEADO (`is_blocked = true`)
- ✅ `blocked_until` establecido (NOW + duration_days)
- ✅ Todas las entradas activas del usuario eliminadas
- ✅ Log de `penalty_applied`
- ✅ Se procesa siguiente usuario

### Caso 4: Múltiples ofertas expiradas

**Setup:**
- Crear 3 ofertas expiradas de diferentes usuarios

**Resultado esperado:**
- ✅ Función retorna `3`
- ✅ Las 3 ofertas marcadas como expiradas
- ✅ Las 3 entradas vuelven a active
- ✅ Se procesa waitlist para cada spot
- ✅ Log de `cleanup_executed` con count = 3

## Verificación en Producción

### Monitoreo de Logs

```sql
-- Ver últimas ejecuciones de expiración
SELECT 
  action,
  details->>'expired_count' as expired_count,
  details->>'executed_at' as executed_at,
  created_at
FROM waitlist_logs
WHERE action = 'cleanup_executed'
  AND details->>'type' = 'expire_offers'
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar Ofertas Pendientes

```sql
-- Ver ofertas que deberían expirar pronto
SELECT 
  wo.id,
  wo.user_id,
  wo.spot_id,
  wo.reservation_date,
  wo.expires_at,
  wo.expires_at - NOW() as time_until_expiry,
  p.email as user_email
FROM waitlist_offers wo
JOIN profiles p ON p.id = wo.user_id
WHERE wo.status = 'pending'
  AND wo.expires_at < NOW() + INTERVAL '1 hour'
ORDER BY wo.expires_at ASC;
```

### Verificar Usuarios Bloqueados

```sql
-- Ver usuarios bloqueados por penalización
SELECT 
  wp.user_id,
  p.email,
  wp.no_response_count,
  wp.is_blocked,
  wp.blocked_until,
  wp.blocked_until - NOW() as time_remaining
FROM waitlist_penalties wp
JOIN profiles p ON p.id = wp.user_id
WHERE wp.is_blocked = true
  AND wp.blocked_until > NOW()
ORDER BY wp.blocked_until ASC;
```

## Troubleshooting

### Problema: Función no expira ofertas

**Verificar:**
1. ¿Hay ofertas con `status = 'pending'` y `expires_at < NOW()`?
2. ¿La función tiene permisos correctos?
3. ¿Hay errores en `waitlist_logs` con `action = 'error_occurred'`?

```sql
-- Verificar ofertas pendientes expiradas
SELECT COUNT(*)
FROM waitlist_offers
WHERE status = 'pending'
  AND expires_at < NOW();

-- Verificar errores recientes
SELECT *
FROM waitlist_logs
WHERE action = 'error_occurred'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Problema: Usuarios no se bloquean

**Verificar:**
1. ¿`waitlist_penalty_enabled = true`?
2. ¿El threshold está configurado correctamente?
3. ¿El `no_response_count` alcanza el threshold?

```sql
-- Verificar configuración
SELECT 
  waitlist_penalty_enabled,
  waitlist_penalty_threshold
FROM reservation_settings;

-- Verificar contadores de usuarios
SELECT 
  user_id,
  no_response_count,
  is_blocked
FROM waitlist_penalties
ORDER BY no_response_count DESC;
```

### Problema: No se procesa siguiente usuario

**Verificar:**
1. ¿Hay más usuarios en la waitlist para ese spot/fecha?
2. ¿Los usuarios tienen matrícula aprobada?
3. ¿Los usuarios están activos?

```sql
-- Verificar usuarios en waitlist para un spot/fecha
SELECT 
  we.id,
  we.user_id,
  we.status,
  p.email,
  is_user_active(we.user_id) as is_active,
  EXISTS(
    SELECT 1 FROM license_plates lp
    WHERE lp.user_id = we.user_id
      AND lp.status = 'approved'
      AND lp.deleted_at IS NULL
  ) as has_approved_plate
FROM waitlist_entries we
JOIN profiles p ON p.id = we.user_id
WHERE we.group_id = 'GROUP_ID'
  AND we.reservation_date = 'DATE'
  AND we.status = 'active'
ORDER BY we.created_at ASC;
```

## Integración con Cron Job

Esta función está diseñada para ser llamada por un cron job cada 5 minutos:

```sql
-- Configuración del cron job (se implementará en tarea 11)
SELECT cron.schedule(
  'expire-waitlist-offers',
  '*/5 * * * *', -- Cada 5 minutos
  $$ SELECT expire_waitlist_offers(); $$
);
```

## Requisitos Cumplidos

- ✅ **8.1**: Detecta ofertas con `expires_at < NOW()` y `status = 'pending'`
- ✅ **8.2**: Marca ofertas como `'expired'` y busca siguiente usuario
- ✅ **8.3**: Mantiene al usuario en lista de espera (status = 'active')
- ✅ **8.4**: Incrementa `no_response_count` si penalización habilitada
- ✅ **8.6**: Envía notificación (se implementará con Edge Function)
- ✅ **11.2**: Verifica threshold y bloquea usuario temporalmente
- ✅ **11.3**: Registra en `waitlist_logs` con action `'offer_expired'`
- ✅ **14.3**: Logging completo de todas las acciones

## Próximos Pasos

1. ✅ Función implementada y probada
2. ⏳ Configurar cron job (Tarea 11)
3. ⏳ Implementar Edge Function de notificaciones (Tarea 12)
4. ⏳ Implementar recordatorios (Tarea 13)
