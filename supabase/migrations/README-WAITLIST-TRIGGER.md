# Trigger de Cancelación de Reserva - Lista de Espera

## Descripción

El trigger `on_reservation_cancelled` se ejecuta automáticamente cuando una reserva cambia su estado a `'cancelled'`. Su función principal es procesar la lista de espera para ofrecer la plaza liberada al siguiente usuario en la cola.

## Componentes

### 1. Función del Trigger: `handle_reservation_cancelled()`

**Ubicación:** `supabase/migrations/20251115100135_add_reservation_cancelled_trigger.sql`

**Características:**
- **Tipo:** `TRIGGER FUNCTION`
- **Seguridad:** `SECURITY DEFINER` (se ejecuta con permisos elevados)
- **Retorno:** `TRIGGER`

**Flujo de Ejecución:**

1. **Detección de Cancelación**
   - Verifica que el status cambió a `'cancelled'`
   - Solo se ejecuta si el status anterior era diferente

2. **Verificación de Lista de Espera**
   - Consulta `reservation_settings.waitlist_enabled`
   - Solo procesa si la lista de espera está habilitada globalmente

3. **Procesamiento de Lista de Espera**
   - Llama a `process_waitlist_for_spot(spot_id, date)`
   - Busca el siguiente usuario elegible en la cola
   - Crea una oferta si encuentra un usuario válido

4. **Logging**
   - Registra la ejecución del trigger en `waitlist_logs`
   - Incluye detalles: reservation_id, spot_id, date, offer_id
   - Registra errores sin fallar la cancelación

5. **Manejo de Errores**
   - Captura excepciones con `EXCEPTION WHEN OTHERS`
   - Registra el error en `waitlist_logs`
   - **NO falla la cancelación** aunque el procesamiento de lista de espera falle

### 2. Trigger: `on_reservation_cancelled`

**Tabla:** `public.reservations`
**Evento:** `AFTER UPDATE`
**Condición:** `NEW.status = 'cancelled' AND OLD.status != 'cancelled'`

**Características:**
- Se ejecuta **después** de que la actualización se confirma
- Solo se dispara cuando el status cambia a `'cancelled'`
- Ejecuta la función `handle_reservation_cancelled()`

## Flujo Completo

```
Usuario cancela reserva
    ↓
UPDATE reservations SET status = 'cancelled'
    ↓
Trigger: on_reservation_cancelled se dispara
    ↓
Función: handle_reservation_cancelled()
    ↓
Verifica: ¿waitlist_enabled = true?
    ↓ (sí)
Llama: process_waitlist_for_spot(spot_id, date)
    ↓
Busca: Primer usuario elegible en lista de espera
    ↓
Valida: Usuario activo + matrícula aprobada
    ↓
Crea: Oferta con create_waitlist_offer()
    ↓
Registra: Log en waitlist_logs
    ↓
Notifica: Usuario recibe email + notificación in-app
```

## Ejemplo de Log

Cuando el trigger se ejecuta correctamente, crea un registro en `waitlist_logs`:

```json
{
  "action": "trigger_executed",
  "details": {
    "trigger": "on_reservation_cancelled",
    "reservation_id": "uuid-de-reserva",
    "spot_id": "uuid-de-plaza",
    "date": "2025-11-20",
    "offer_created": true,
    "offer_id": "uuid-de-oferta"
  }
}
```

## Verificación

### Verificar que el Trigger Existe

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled
FROM pg_trigger
WHERE tgname = 'on_reservation_cancelled';
```

### Verificar Ejecuciones del Trigger

```sql
SELECT 
  action,
  details->>'trigger' as trigger_name,
  details->>'reservation_id' as reservation_id,
  details->>'offer_created' as offer_created,
  created_at
FROM waitlist_logs
WHERE action = 'trigger_executed'
  AND details->>'trigger' = 'on_reservation_cancelled'
ORDER BY created_at DESC
LIMIT 10;
```

### Script de Prueba

Ejecutar: `scripts/test-reservation-cancelled-trigger.sql`

Este script:
1. Crea una entrada en lista de espera
2. Crea una reserva de prueba
3. Cancela la reserva
4. Verifica que el trigger se ejecutó
5. Limpia los datos de prueba

## Seguridad

### Row Level Security (RLS)

El trigger se ejecuta con `SECURITY DEFINER`, lo que significa:
- Se ejecuta con permisos del owner de la función (superusuario)
- Puede acceder a todas las tablas sin restricciones RLS
- Necesario para procesar la lista de espera automáticamente

### Protección contra Errores

- **No falla la cancelación**: Si el procesamiento de lista de espera falla, la cancelación se completa de todos modos
- **Logging de errores**: Todos los errores se registran en `waitlist_logs` para debugging
- **Validaciones**: Verifica que la lista de espera esté habilitada antes de procesar

## Dependencias

El trigger depende de:

1. **Tablas:**
   - `reservations` (tabla donde se aplica el trigger)
   - `reservation_settings` (configuración de lista de espera)
   - `waitlist_entries` (entradas de lista de espera)
   - `waitlist_logs` (logs de auditoría)

2. **Funciones:**
   - `process_waitlist_for_spot(UUID, DATE)` - Procesa la lista de espera
   - `create_waitlist_offer(UUID, UUID)` - Crea ofertas

3. **Configuración:**
   - `reservation_settings.waitlist_enabled` debe ser `true`

## Troubleshooting

### El trigger no se ejecuta

1. Verificar que el trigger existe:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_reservation_cancelled';
   ```

2. Verificar que la lista de espera está habilitada:
   ```sql
   SELECT waitlist_enabled FROM reservation_settings;
   ```

3. Verificar logs de error:
   ```sql
   SELECT * FROM waitlist_logs 
   WHERE action = 'error_occurred' 
     AND details->>'trigger' = 'on_reservation_cancelled'
   ORDER BY created_at DESC;
   ```

### El trigger se ejecuta pero no crea ofertas

1. Verificar que hay usuarios en lista de espera:
   ```sql
   SELECT * FROM waitlist_entries 
   WHERE status = 'active' 
     AND reservation_date = 'fecha-de-la-reserva';
   ```

2. Verificar que los usuarios son elegibles:
   - Usuario activo (no bloqueado/desactivado)
   - Matrícula aprobada
   - Acceso al grupo de parking

3. Revisar logs de `process_waitlist_for_spot`:
   ```sql
   SELECT * FROM waitlist_logs 
   WHERE details->>'spot_id' = 'uuid-de-plaza'
   ORDER BY created_at DESC;
   ```

## Mantenimiento

### Deshabilitar el Trigger Temporalmente

```sql
ALTER TABLE reservations DISABLE TRIGGER on_reservation_cancelled;
```

### Habilitar el Trigger

```sql
ALTER TABLE reservations ENABLE TRIGGER on_reservation_cancelled;
```

### Eliminar el Trigger

```sql
DROP TRIGGER IF EXISTS on_reservation_cancelled ON reservations;
DROP FUNCTION IF EXISTS handle_reservation_cancelled();
```

## Referencias

- **Migración:** `20251115100135_add_reservation_cancelled_trigger.sql`
- **Requisito:** 5.1 del documento de requisitos
- **Diseño:** Ver `.kiro/specs/01-sistema-lista-espera/design.md`
