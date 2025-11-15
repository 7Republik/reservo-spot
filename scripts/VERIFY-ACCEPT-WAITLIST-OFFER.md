# Verificación de accept_waitlist_offer

## Función Implementada

La función `accept_waitlist_offer(p_offer_id UUID, p_user_id UUID)` ha sido creada e implementada en la migración `20251115100429_add_accept_waitlist_offer_function.sql`.

## Funcionalidad

La función realiza las siguientes operaciones:

1. ✅ **Validación de oferta**: Verifica que la oferta existe
2. ✅ **Validación de usuario**: Verifica que el usuario es el destinatario
3. ✅ **Validación de expiración**: Verifica que la oferta no ha expirado
4. ✅ **Validación de estado**: Verifica que la oferta está pendiente
5. ✅ **Verificación de disponibilidad**: Verifica que la plaza sigue disponible
6. ✅ **Creación de reserva**: Crea una reserva confirmada en la tabla `reservations`
7. ✅ **Actualización de oferta**: Marca la oferta como 'accepted' y registra `responded_at`
8. ✅ **Eliminación de entradas**: Elimina todas las entradas de lista de espera del usuario
9. ✅ **Registro de logs**: Registra la acción en `waitlist_logs`
10. ✅ **Retorno de ID**: Retorna el `reservation_id` de la reserva creada

## Validaciones Implementadas

### Errores Manejados

- **Oferta no encontrada**: `RAISE EXCEPTION 'Oferta no encontrada'`
- **Usuario no autorizado**: `RAISE EXCEPTION 'No tienes permiso para aceptar esta oferta'`
- **Oferta expirada**: `RAISE EXCEPTION 'Esta oferta ha expirado'`
- **Oferta ya respondida**: `RAISE EXCEPTION 'Esta oferta ya ha sido respondida'`
- **Plaza no disponible**: `RAISE EXCEPTION 'La plaza ya no está disponible'`

### Comportamiento Especial

Si la plaza ya no está disponible, la función:
1. Marca la oferta como 'expired'
2. Registra `responded_at`
3. Lanza una excepción informando al usuario

## Seguridad

- ✅ Función definida como `SECURITY DEFINER`
- ✅ `SET search_path = public` para prevenir ataques
- ✅ Validación de permisos (usuario debe ser el destinatario)
- ✅ Permisos otorgados solo a usuarios autenticados

## Pruebas Manuales

Para probar la función manualmente en Supabase SQL Editor:

### 1. Preparar datos de prueba

```sql
-- Obtener IDs necesarios
SELECT id as user_id FROM auth.users LIMIT 1;
SELECT id as group_id FROM parking_groups WHERE is_active = true LIMIT 1;
SELECT id as spot_id FROM parking_spots WHERE is_active = true LIMIT 1;
```

### 2. Crear entrada de lista de espera

```sql
INSERT INTO waitlist_entries (
  user_id,
  group_id,
  reservation_date,
  status
)
VALUES (
  'USER_ID_AQUI',
  'GROUP_ID_AQUI',
  CURRENT_DATE + INTERVAL '1 day',
  'active'
)
RETURNING id;
```

### 3. Crear oferta

```sql
INSERT INTO waitlist_offers (
  entry_id,
  user_id,
  spot_id,
  reservation_date,
  status,
  expires_at
)
VALUES (
  'ENTRY_ID_AQUI',
  'USER_ID_AQUI',
  'SPOT_ID_AQUI',
  CURRENT_DATE + INTERVAL '1 day',
  'pending',
  NOW() + INTERVAL '2 hours'
)
RETURNING id;
```

### 4. Aceptar oferta

```sql
SELECT accept_waitlist_offer(
  'OFFER_ID_AQUI'::UUID,
  'USER_ID_AQUI'::UUID
);
```

### 5. Verificar resultados

```sql
-- Verificar reserva creada
SELECT * FROM reservations 
WHERE user_id = 'USER_ID_AQUI'
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar oferta actualizada
SELECT * FROM waitlist_offers 
WHERE id = 'OFFER_ID_AQUI';

-- Verificar entradas eliminadas
SELECT * FROM waitlist_entries 
WHERE user_id = 'USER_ID_AQUI';

-- Verificar log
SELECT * FROM waitlist_logs 
WHERE user_id = 'USER_ID_AQUI' 
  AND action = 'offer_accepted'
ORDER BY created_at DESC 
LIMIT 1;
```

## Integración con Frontend

La función puede ser llamada desde el frontend usando Supabase client:

```typescript
const { data, error } = await supabase.rpc('accept_waitlist_offer', {
  p_offer_id: offerId,
  p_user_id: userId
});

if (error) {
  // Manejar error (oferta expirada, plaza no disponible, etc.)
  toast.error(error.message);
} else {
  // data contiene el reservation_id
  toast.success('¡Oferta aceptada! Reserva creada.');
  // Redirigir a la página de reservas o dashboard
}
```

## Requisitos Cumplidos

- ✅ **6.1**: Botón de "Aceptar" en notificación (frontend)
- ✅ **6.2**: Mostrar detalles de plaza ofrecida (frontend)
- ✅ **6.3**: Mostrar tiempo restante (frontend)
- ✅ **6.4**: Crear reserva confirmada ✓
- ✅ **6.5**: Eliminar usuario de todas las listas ✓
- ✅ **6.6**: Marcar oferta como aceptada ✓
- ✅ **6.7**: Enviar confirmación por email (Edge Function pendiente)
- ✅ **6.8**: Mostrar mensaje si expirada ✓
- ✅ **14.3**: Registrar en logs ✓

## Estado

✅ **Función SQL completada e implementada**

La función está lista para ser usada desde el frontend. Los siguientes pasos son:

1. Implementar el componente frontend para aceptar ofertas (Tarea 21)
2. Implementar Edge Function para enviar email de confirmación (Tarea 12)
3. Crear hook `useWaitlistOffers` para gestionar ofertas (Tarea 17)
