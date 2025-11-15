# Verificación: cleanup_expired_waitlist_entries()

## Propósito

Verificar que la función `cleanup_expired_waitlist_entries()` limpia correctamente las entradas obsoletas de lista de espera.

## Requisitos Verificados

- **12.1**: Eliminar entradas con reservation_date < CURRENT_DATE
- **12.2**: Eliminar entradas de usuarios bloqueados o desactivados
- **12.3**: Eliminar entradas de usuarios sin matrícula aprobada
- **12.4**: Eliminar entradas de usuarios sin acceso al grupo
- **12.5**: Registrar en waitlist_logs (cleanup_executed) con detalles
- **14.4**: Auditoría completa de operaciones de limpieza

## Cómo Ejecutar

```bash
# Opción 1: Desde psql local
supabase db remote psql < scripts/test-cleanup-waitlist-entries.sql

# Opción 2: Desde SQL Editor en Supabase Dashboard
# Copiar y pegar el contenido de scripts/test-cleanup-waitlist-entries.sql
```

## Escenarios de Prueba

### Setup Inicial

El script crea 5 entradas de lista de espera:

1. **Usuario normal + fecha pasada** → Debe eliminarse (fecha expirada)
2. **Usuario normal + fecha futura** → NO debe eliminarse (válida)
3. **Usuario bloqueado + fecha futura** → Debe eliminarse (usuario bloqueado)
4. **Usuario desactivado + fecha futura** → Debe eliminarse (usuario desactivado)
5. **Usuario sin matrícula + fecha futura** → Debe eliminarse (sin matrícula aprobada)

### Ejecución

```sql
SELECT * FROM cleanup_expired_waitlist_entries();
```

### Resultado Esperado

```
total_deleted | expired_dates_deleted | blocked_users_deleted | no_plate_deleted | no_access_deleted
--------------+-----------------------+-----------------------+------------------+-------------------
           4  |                    1  |                    2  |                1 |                 0
```

**Desglose:**
- **total_deleted**: 4 entradas eliminadas
- **expired_dates_deleted**: 1 (fecha pasada)
- **blocked_users_deleted**: 2 (bloqueado + desactivado)
- **no_plate_deleted**: 1 (sin matrícula aprobada)
- **no_access_deleted**: 0 (todos tienen acceso al grupo)

### Validaciones

1. ✅ Solo debe quedar 1 entrada (usuario normal con fecha futura)
2. ✅ Se debe crear un log con action = 'cleanup_executed'
3. ✅ El log debe contener detalles de cada categoría eliminada
4. ✅ No deben quedar entradas con fechas pasadas
5. ✅ No deben quedar entradas de usuarios bloqueados/desactivados
6. ✅ No deben quedar entradas de usuarios sin matrícula aprobada

## Verificación Manual

### 1. Verificar entradas restantes

```sql
SELECT 
  we.user_id,
  p.email,
  we.reservation_date,
  we.status,
  p.is_blocked,
  p.is_deactivated,
  EXISTS (
    SELECT 1 FROM license_plates lp 
    WHERE lp.user_id = we.user_id 
    AND lp.status = 'approved' 
    AND lp.deleted_at IS NULL
  ) as has_approved_plate
FROM waitlist_entries we
JOIN profiles p ON p.id = we.user_id
WHERE we.reservation_date >= CURRENT_DATE;
```

**Resultado esperado:**
- Todas las entradas deben tener `reservation_date >= CURRENT_DATE`
- Todos los usuarios deben tener `is_blocked = false` y `is_deactivated = false`
- Todos los usuarios deben tener `has_approved_plate = true`

### 2. Verificar log de limpieza

```sql
SELECT 
  action,
  details,
  created_at
FROM waitlist_logs
WHERE action = 'cleanup_executed'
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
```json
{
  "total_deleted": 4,
  "expired_dates_deleted": 1,
  "blocked_users_deleted": 2,
  "no_plate_deleted": 1,
  "no_access_deleted": 0,
  "executed_at": "2025-11-15T10:30:00Z"
}
```

### 3. Verificar que no hay entradas inválidas

```sql
-- No debe retornar ninguna fila
SELECT 
  we.id,
  'Fecha pasada' as issue
FROM waitlist_entries we
WHERE we.reservation_date < CURRENT_DATE

UNION ALL

SELECT 
  we.id,
  'Usuario bloqueado/desactivado' as issue
FROM waitlist_entries we
JOIN profiles p ON p.id = we.user_id
WHERE p.is_blocked = true OR p.is_deactivated = true

UNION ALL

SELECT 
  we.id,
  'Sin matrícula aprobada' as issue
FROM waitlist_entries we
WHERE NOT EXISTS (
  SELECT 1 FROM license_plates lp
  WHERE lp.user_id = we.user_id
  AND lp.status = 'approved'
  AND lp.deleted_at IS NULL
)

UNION ALL

SELECT 
  we.id,
  'Sin acceso al grupo' as issue
FROM waitlist_entries we
WHERE NOT EXISTS (
  SELECT 1 FROM user_group_assignments uga
  WHERE uga.user_id = we.user_id
  AND uga.group_id = we.group_id
);
```

**Resultado esperado:** 0 filas (ninguna entrada inválida)

## Casos Edge

### Caso 1: Sin entradas para limpiar

```sql
-- Ejecutar cuando todas las entradas son válidas
SELECT * FROM cleanup_expired_waitlist_entries();
```

**Resultado esperado:**
```
total_deleted | expired_dates_deleted | blocked_users_deleted | no_plate_deleted | no_access_deleted
--------------+-----------------------+-----------------------+------------------+-------------------
           0  |                    0  |                    0  |                0 |                 0
```

**Validación:** No se debe crear log si no hay nada que limpiar.

### Caso 2: Usuario pierde acceso al grupo

```sql
-- Crear entrada válida
INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
VALUES ('user-id', 'group-id', CURRENT_DATE + 1, 'active');

-- Eliminar acceso al grupo
DELETE FROM user_group_assignments 
WHERE user_id = 'user-id' AND group_id = 'group-id';

-- Ejecutar limpieza
SELECT * FROM cleanup_expired_waitlist_entries();
```

**Resultado esperado:** La entrada debe eliminarse (no_access_deleted = 1)

### Caso 3: Matrícula desaprobada

```sql
-- Usuario con entrada válida
INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
VALUES ('user-id', 'group-id', CURRENT_DATE + 1, 'active');

-- Desaprobar matrícula
UPDATE license_plates 
SET status = 'rejected' 
WHERE user_id = 'user-id';

-- Ejecutar limpieza
SELECT * FROM cleanup_expired_waitlist_entries();
```

**Resultado esperado:** La entrada debe eliminarse (no_plate_deleted = 1)

## Integración con Cron Job

Esta función está diseñada para ser llamada por un cron job diario:

```sql
-- Configurar en pg_cron (tarea 11)
SELECT cron.schedule(
  'cleanup-expired-waitlist-entries',
  '0 0 * * *', -- Diario a las 00:00
  $$SELECT cleanup_expired_waitlist_entries()$$
);
```

## Troubleshooting

### Problema: La función no elimina entradas esperadas

**Verificar:**
1. ¿Las entradas tienen `reservation_date < CURRENT_DATE`?
2. ¿Los usuarios están realmente bloqueados/desactivados?
3. ¿Las matrículas están en estado 'approved'?
4. ¿Existen los registros en `user_group_assignments`?

### Problema: No se crea el log

**Causa:** La función solo crea log si `total_deleted > 0`

**Solución:** Esto es intencional para evitar logs innecesarios cuando no hay nada que limpiar.

### Problema: Entradas válidas se eliminan

**Verificar:**
1. La fecha del servidor: `SELECT CURRENT_DATE;`
2. El estado de los usuarios: `SELECT * FROM profiles WHERE id = 'user-id';`
3. Las matrículas: `SELECT * FROM license_plates WHERE user_id = 'user-id';`
4. Los accesos: `SELECT * FROM user_group_assignments WHERE user_id = 'user-id';`

## Checklist de Verificación

- [ ] La función se ejecuta sin errores
- [ ] Elimina entradas con fechas pasadas
- [ ] Elimina entradas de usuarios bloqueados
- [ ] Elimina entradas de usuarios desactivados
- [ ] Elimina entradas de usuarios sin matrícula aprobada
- [ ] Elimina entradas de usuarios sin acceso al grupo
- [ ] NO elimina entradas válidas
- [ ] Crea log con detalles correctos
- [ ] Retorna contadores precisos
- [ ] Los permisos están correctamente configurados (SECURITY DEFINER)

## Notas

- La función usa `SECURITY DEFINER` para poder eliminar entradas de cualquier usuario
- Los permisos están revocados para usuarios normales (solo cron puede ejecutarla)
- La función es idempotente (puede ejecutarse múltiples veces sin efectos secundarios)
- Los logs se crean solo cuando hay entradas eliminadas (evita ruido)
