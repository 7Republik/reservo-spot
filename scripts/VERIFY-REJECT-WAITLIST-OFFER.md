# Verificación de reject_waitlist_offer

## Función Implementada

✅ **reject_waitlist_offer(p_offer_id UUID, p_user_id UUID)**

### Descripción
Rechaza una oferta de lista de espera. Valida que la oferta existe y el usuario es el destinatario. Actualiza el estado de la oferta a rechazada, mantiene al usuario en la lista de espera (status active), incrementa contador de rechazos si penalización está habilitada, y busca el siguiente usuario en la cola.

## Validaciones Implementadas

1. ✅ Validar que la oferta existe
2. ✅ Validar que el usuario es el destinatario
3. ✅ Validar que la oferta está pendiente (no ya respondida)
4. ✅ Actualizar oferta status a 'rejected' y responded_at
5. ✅ Actualizar entrada de lista de espera status a 'active'
6. ✅ Incrementar rejection_count si penalización habilitada
7. ✅ Registrar en waitlist_logs (offer_rejected)
8. ✅ Llamar a process_waitlist_for_spot() para siguiente usuario

## Flujo de la Función

```
1. Obtener datos de la oferta
   ↓
2. Validar que existe y usuario es destinatario
   ↓
3. Validar que está pendiente
   ↓
4. Actualizar oferta → status='rejected', responded_at=NOW()
   ↓
5. Actualizar entrada → status='active'
   ↓
6. Si penalización habilitada:
   - Incrementar rejection_count
   - Registrar en waitlist_penalties
   ↓
7. Registrar en waitlist_logs
   ↓
8. Llamar a process_waitlist_for_spot()
   (busca siguiente usuario en cola)
```

## Casos de Error Manejados

- ❌ Oferta no encontrada → Exception 'Oferta no encontrada'
- ❌ Usuario no es destinatario → Exception 'No tienes permiso para rechazar esta oferta'
- ❌ Oferta ya respondida → Exception 'Esta oferta ya ha sido respondida'
- ❌ Cualquier otro error → Registrado en waitlist_logs y re-lanzado

## Pruebas Manuales

### Preparación
```sql
-- 1. Habilitar lista de espera y penalización
UPDATE reservation_settings
SET 
  waitlist_enabled = TRUE,
  waitlist_penalty_enabled = TRUE,
  waitlist_penalty_threshold = 3;

-- 2. Verificar que tienes un usuario con matrícula aprobada
SELECT u.id, u.email, lp.plate_number, lp.status
FROM auth.users u
LEFT JOIN license_plates lp ON lp.user_id = u.id
WHERE lp.status = 'approved'
LIMIT 1;

-- 3. Crear una entrada de lista de espera y oferta
-- (Usar el script test-reject-waitlist-offer.sql)
```

### Test 1: Rechazo exitoso
```sql
-- Ejecutar la función
SELECT reject_waitlist_offer(
  '<offer_id>'::UUID,
  '<user_id>'::UUID
);

-- Verificar oferta actualizada
SELECT id, status, responded_at
FROM waitlist_offers
WHERE id = '<offer_id>';
-- Esperado: status='rejected', responded_at NOT NULL

-- Verificar entrada actualizada
SELECT id, status
FROM waitlist_entries
WHERE id = '<entry_id>';
-- Esperado: status='active'

-- Verificar contador de rechazos
SELECT user_id, rejection_count
FROM waitlist_penalties
WHERE user_id = '<user_id>';
-- Esperado: rejection_count=1

-- Verificar log
SELECT action, details
FROM waitlist_logs
WHERE offer_id = '<offer_id>'
  AND action = 'offer_rejected';
-- Esperado: 1 registro con detalles del rechazo
```

### Test 2: Rechazo de oferta ya respondida
```sql
-- Intentar rechazar la misma oferta de nuevo
SELECT reject_waitlist_offer(
  '<offer_id>'::UUID,
  '<user_id>'::UUID
);
-- Esperado: ERROR: Esta oferta ya ha sido respondida
```

### Test 3: Rechazo con usuario incorrecto
```sql
-- Intentar rechazar con otro usuario
SELECT reject_waitlist_offer(
  '<offer_id>'::UUID,
  '<otro_user_id>'::UUID
);
-- Esperado: ERROR: No tienes permiso para rechazar esta oferta
```

### Test 4: Verificar que se busca siguiente usuario
```sql
-- Crear segunda entrada en lista de espera
INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
VALUES ('<otro_user_id>', '<group_id>', '<date>', 'active');

-- Rechazar primera oferta
SELECT reject_waitlist_offer('<offer_id>', '<user_id>');

-- Verificar que se creó nueva oferta para segundo usuario
SELECT wo.id, wo.user_id, wo.status
FROM waitlist_offers wo
WHERE wo.spot_id = '<spot_id>'
  AND wo.reservation_date = '<date>'
  AND wo.status = 'pending'
ORDER BY wo.created_at DESC
LIMIT 1;
-- Esperado: Nueva oferta para segundo usuario
```

## Integración con Otras Funciones

### Funciones Llamadas
- ✅ `process_waitlist_for_spot(spot_id, date)` - Busca siguiente usuario en cola

### Funciones que Llaman a Esta
- Frontend: Hook `useWaitlist.rejectOffer(offerId)`
- Componente: `WaitlistOfferNotification` botón "Rechazar"

## Permisos

```sql
-- Verificar permisos
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'reject_waitlist_offer';
-- Esperado: SECURITY DEFINER

-- Verificar grants
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'reject_waitlist_offer';
-- Esperado: authenticated → EXECUTE
```

## Archivos Relacionados

- **Migración**: `supabase/migrations/20251115100741_add_reject_waitlist_offer_function.sql`
- **Script de Test**: `scripts/test-reject-waitlist-offer.sql`
- **Documentación**: Este archivo

## Requisitos Cumplidos

- ✅ **7.1**: Botón de "Rechazar" en notificación de oferta
- ✅ **7.2**: Marcar oferta como "rechazada"
- ✅ **7.3**: Mantener usuario en lista de espera
- ✅ **7.4**: Buscar siguiente usuario en cola
- ✅ **7.5**: Registrar rechazo en logs de auditoría
- ✅ **7.6**: Incrementar contador de rechazos si penalización habilitada
- ✅ **14.3**: Registrar acción en waitlist_logs

## Próximos Pasos

1. ✅ Función implementada y migración aplicada
2. ⏳ Implementar función `expire_waitlist_offers()` (Tarea 9)
3. ⏳ Implementar función `cleanup_expired_waitlist_entries()` (Tarea 10)
4. ⏳ Configurar cron jobs (Tarea 11)
5. ⏳ Implementar Edge Functions de notificaciones (Tareas 12-13)
6. ⏳ Implementar frontend (Tareas 14-24)

## Notas Importantes

- La función usa `SECURITY DEFINER` para ejecutar con permisos elevados
- El contador de rechazos se incrementa pero NO bloquea al usuario (solo no_response_count bloquea)
- La función llama a `process_waitlist_for_spot()` de forma síncrona
- Todos los errores se registran en `waitlist_logs` antes de re-lanzarse
- La entrada de lista de espera vuelve a status 'active' para que el usuario siga en la cola
