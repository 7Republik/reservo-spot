# Guía: Cómo Añadir Nuevos Tipos de Notificaciones

Esta guía explica paso a paso cómo añadir un nuevo tipo de notificación al sistema.

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Paso 1: Definir el Tipo](#paso-1-definir-el-tipo)
3. [Paso 2: Actualizar Preferencias](#paso-2-actualizar-preferencias)
4. [Paso 3: Crear Trigger](#paso-3-crear-trigger)
5. [Paso 4: Crear Template de Email](#paso-4-crear-template-de-email)
6. [Paso 5: Actualizar Frontend](#paso-5-actualizar-frontend)
7. [Paso 6: Testing](#paso-6-testing)
8. [Ejemplo Completo](#ejemplo-completo)

---

## Visión General

Para añadir un nuevo tipo de notificación necesitas:

1. **Definir el tipo** en `src/types/notifications.ts`
2. **Actualizar preferencias** en la tabla `notification_preferences`
3. **Crear trigger** que genere la notificación automáticamente
4. **Crear template de email** en la Edge Function
5. **Actualizar UI** para mostrar el nuevo tipo
6. **Probar** el flujo completo

**Tiempo estimado:** 1-2 horas

---

## Paso 1: Definir el Tipo

### 1.1 Añadir Constante de Tipo

**Archivo:** `src/types/notifications.ts`

```typescript
export const NOTIFICATION_TYPES = {
  // ... tipos existentes ...
  
  // Nuevo tipo
  MY_NEW_TYPE: 'my_new_type',
} as const;
```

**Convenciones de nombres:**
- Usar `snake_case` para el valor
- Usar `UPPER_SNAKE_CASE` para la constante
- Ser descriptivo pero conciso
- Ejemplos: `waitlist_offer`, `warning_received`, `license_plate_approved`

### 1.2 Decidir Prioridad y Categoría

**Prioridades disponibles:**
- `urgent` - Requiere acción inmediata (rojo)
- `high` - Importante pero no urgente (naranja)
- `medium` - Informativa importante (azul)
- `low` - Informativa general (gris)

**Categorías disponibles:**
- `reservation` - Relacionado con reservas
- `waitlist` - Relacionado con lista de espera
- `warning` - Amonestaciones y bloqueos
- `incident` - Reportes de incidentes
- `system` - Notificaciones del sistema

**Ejemplo de decisión:**
```typescript
// Nueva notificación: "Reserva próxima a expirar"
// Prioridad: high (importante actuar pronto)
// Categoría: reservation
```

---

## Paso 2: Actualizar Preferencias

### 2.1 Añadir Columna a notification_preferences

**Crear migración:**
```bash
supabase migration new add_my_new_type_preference
```

**Archivo:** `supabase/migrations/XXXXXX_add_my_new_type_preference.sql`

```sql
-- Añadir columna para preferencia de email
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_my_new_type BOOLEAN DEFAULT true;

-- Comentario descriptivo
COMMENT ON COLUMN notification_preferences.email_my_new_type IS 
  'Enviar email cuando ocurre mi nuevo tipo de evento';
```

### 2.2 Actualizar Función should_send_email

**En la misma migración:**

```sql
-- Actualizar función para incluir nuevo tipo
CREATE OR REPLACE FUNCTION should_send_email(
  _user_id UUID,
  _notification_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  _prefs RECORD;
BEGIN
  -- Obtener preferencias del usuario
  SELECT * INTO _prefs
  FROM notification_preferences
  WHERE user_id = _user_id;
  
  -- Si no existen preferencias, crear con defaults
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (_user_id)
    RETURNING * INTO _prefs;
  END IF;
  
  -- Si email deshabilitado globalmente, retornar false
  IF NOT _prefs.email_enabled THEN
    RETURN false;
  END IF;
  
  -- Verificar preferencia específica según tipo
  RETURN CASE _notification_type
    -- ... casos existentes ...
    
    -- Nuevo caso
    WHEN 'my_new_type' THEN _prefs.email_my_new_type
    
    ELSE false
  END;
END;
$;
```

### 2.3 Aplicar Migración

```bash
supabase db push
```

---

## Paso 3: Crear Trigger

### 3.1 Identificar Evento Disparador

**Preguntas a responder:**
- ¿Qué tabla genera el evento? (ej: `reservations`, `waitlist_offers`)
- ¿Qué operación? (INSERT, UPDATE, DELETE)
- ¿Qué condición debe cumplirse? (ej: `status = 'confirmed'`)

**Ejemplo:**
```
Evento: Reserva próxima a expirar (24 horas antes)
Tabla: reservations
Operación: Cron job que verifica reservas
Condición: reservation_date = CURRENT_DATE + 1
```

### 3.2 Crear Función de Trigger

**Crear migración:**
```bash
supabase migration new add_my_new_type_trigger
```

**Archivo:** `supabase/migrations/XXXXXX_add_my_new_type_trigger.sql`

```sql
-- Función que crea la notificación
CREATE OR REPLACE FUNCTION notify_my_new_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  _notification_id UUID;
  _should_email BOOLEAN;
BEGIN
  -- Obtener datos adicionales si es necesario
  -- Ejemplo: nombre de plaza, grupo, etc.
  
  -- Crear notificación in-app
  _notification_id := create_notification(
    NEW.user_id,                    -- Usuario destinatario
    'my_new_type',                  -- Tipo de notificación
    'Título de la Notificación',   -- Título
    'Mensaje descriptivo',          -- Mensaje
    'high',                         -- Prioridad
    'reservation',                  -- Categoría
    NEW.id,                         -- ID de referencia
    format('/path/to/action/%s', NEW.id),  -- URL de acción
    jsonb_build_object(             -- Datos adicionales
      'key1', 'value1',
      'key2', 'value2'
    )
  );
  
  -- Verificar si debe enviar email
  _should_email := should_send_email(NEW.user_id, 'my_new_type');
  
  IF _should_email AND _notification_id IS NOT NULL THEN
    -- Llamar Edge Function de forma asíncrona
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'notification_id', _notification_id,
        'user_id', NEW.user_id,
        'type', 'my_new_type'
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar la operación principal
    RAISE WARNING 'Error creating notification: %', SQLERRM;
    RETURN NEW;
END;
$;

-- Crear trigger
CREATE TRIGGER on_my_event_trigger
AFTER INSERT ON my_table  -- O UPDATE, DELETE según necesidad
FOR EACH ROW
EXECUTE FUNCTION notify_my_new_type();
```

### 3.3 Trigger para Cron Job (Opcional)

Si la notificación debe enviarse periódicamente:

```sql
-- Función para cron job
CREATE OR REPLACE FUNCTION send_my_periodic_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  _record RECORD;
  _notification_id UUID;
BEGIN
  -- Buscar registros que necesitan notificación
  FOR _record IN
    SELECT * FROM my_table
    WHERE condition = true
      AND notification_not_sent = true
  LOOP
    -- Crear notificación
    _notification_id := create_notification(
      _record.user_id,
      'my_new_type',
      'Título',
      'Mensaje',
      'high',
      'reservation',
      _record.id,
      format('/path/%s', _record.id),
      NULL
    );
    
    -- Marcar como notificado
    UPDATE my_table
    SET notification_sent = true
    WHERE id = _record.id;
  END LOOP;
END;
$;

-- Programar cron job (cada hora)
SELECT cron.schedule(
  'send-my-periodic-notifications',
  '0 * * * *',  -- Cada hora
  $$ SELECT send_my_periodic_notifications(); $$
);
```

### 3.4 Aplicar Migración

```bash
supabase db push
```

---

## Paso 4: Crear Template de Email

### 4.1 Añadir Template en Edge Function

**Archivo:** `supabase/functions/send-notification/index.ts`

```typescript
function generateEmailTemplate(type: string, notification: any, user: any) {
  const baseUrl = Deno.env.get('APP_URL') || 'https://reserveo.com';
  
  switch (type) {
    // ... casos existentes ...
    
    case 'my_new_type':
      return {
        subject: 'Asunto del Email - Reserveo',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0;
                padding: 0;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                text-align: center; 
                border-radius: 8px 8px 0 0; 
              }
              .content { 
                background: white; 
                padding: 30px; 
                border: 1px solid #e0e0e0; 
                border-top: none;
              }
              .button { 
                display: inline-block; 
                padding: 12px 30px; 
                margin: 10px 5px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold; 
              }
              .button-primary { 
                background: #667eea; 
                color: white; 
              }
              .info-box { 
                background: #f3f4f6; 
                padding: 20px; 
                border-radius: 6px; 
                margin: 20px 0; 
              }
              .footer { 
                text-align: center; 
                padding: 20px; 
                color: #666; 
                font-size: 12px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Título del Email</h1>
              </div>
              <div class="content">
                <p>Hola ${user.full_name},</p>
                <p>${notification.message}</p>
                
                <div class="info-box">
                  <p style="margin: 5px 0;"><strong>Detalle 1:</strong> ${notification.data?.detail1}</p>
                  <p style="margin: 5px 0;"><strong>Detalle 2:</strong> ${notification.data?.detail2}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}${notification.action_url}" 
                     class="button button-primary">
                    Acción Principal
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  Información adicional o instrucciones.
                </p>
              </div>
              <div class="footer">
                <p>Reserveo - Sistema de Reservas de Parking</p>
                <p>
                  <a href="${baseUrl}/profile/preferences">Gestionar preferencias de notificaciones</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };
    
    // ... otros casos ...
    
    default:
      return {
        subject: notification.title,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <p><a href="${baseUrl}">Ir a Reserveo</a></p>
          </body>
          </html>
        `
      };
  }
}
```

### 4.2 Desplegar Edge Function

```bash
# Desplegar cambios
supabase functions deploy send-notification
```

---

## Paso 5: Actualizar Frontend

### 5.1 Actualizar Componente NotificationPreferences

**Archivo:** `src/components/profile/NotificationPreferences.tsx`

```typescript
// Añadir switch para el nuevo tipo
<div className="space-y-4">
  {/* ... switches existentes ... */}
  
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label htmlFor="email_my_new_type">
        Mi Nuevo Tipo de Notificación
      </Label>
      <p className="text-sm text-muted-foreground">
        Descripción de cuándo se envía esta notificación
      </p>
    </div>
    <Switch
      id="email_my_new_type"
      checked={preferences?.email_my_new_type ?? true}
      onCheckedChange={(checked) => 
        handleToggle('email_my_new_type', checked)
      }
      disabled={!preferences?.email_enabled || loading}
    />
  </div>
</div>
```

### 5.2 Actualizar Tipos TypeScript

**Archivo:** `src/types/notifications.ts`

```typescript
export interface NotificationPreferences {
  user_id: string;
  organization_id: string;
  email_enabled: boolean;
  // ... preferencias existentes ...
  email_my_new_type: boolean;  // Añadir nueva
  created_at: string;
  updated_at: string;
}
```

### 5.3 Regenerar Tipos de Supabase

```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

---

## Paso 6: Testing

### 6.1 Test Manual en Base de Datos

```sql
-- Crear notificación de prueba
SELECT create_notification(
  'user-uuid',
  'my_new_type',
  'Test: Mi Nuevo Tipo',
  'Este es un mensaje de prueba',
  'high',
  'reservation',
  NULL,
  '/test',
  jsonb_build_object('test', true)
);

-- Verificar creación
SELECT * FROM notifications
WHERE type = 'my_new_type'
ORDER BY created_at DESC
LIMIT 1;

-- Verificar preferencias
SELECT email_my_new_type
FROM notification_preferences
WHERE user_id = 'user-uuid';

-- Probar función should_send_email
SELECT should_send_email('user-uuid', 'my_new_type');
```

### 6.2 Test de Trigger

```sql
-- Simular evento que dispara el trigger
-- Ejemplo: INSERT en la tabla correspondiente
INSERT INTO my_table (user_id, ...)
VALUES ('user-uuid', ...);

-- Verificar que se creó la notificación
SELECT * FROM notifications
WHERE user_id = 'user-uuid'
  AND type = 'my_new_type'
ORDER BY created_at DESC
LIMIT 1;
```

### 6.3 Test de Email

**Opción 1: Desde Supabase Dashboard**
1. Edge Functions → send-notification
2. Invoke con payload:
```json
{
  "notification_id": "notification-uuid",
  "user_id": "user-uuid",
  "type": "my_new_type"
}
```

**Opción 2: Desde SQL**
```sql
-- Marcar como no enviado para forzar reenvío
UPDATE notifications
SET email_sent = false, email_sent_at = NULL
WHERE id = 'notification-uuid';

-- El trigger intentará enviar de nuevo
```

### 6.4 Test en UI

1. **Abrir aplicación** como usuario de prueba
2. **Verificar campana** de notificaciones
3. **Ver notificación** en la lista
4. **Click en notificación** para marcar como leída
5. **Ir a preferencias** y verificar switch del nuevo tipo
6. **Desactivar email** y verificar que no se envía

### 6.5 Limpiar Tests

```sql
-- Eliminar notificaciones de prueba
DELETE FROM notifications
WHERE type = 'my_new_type'
  AND data->>'test' = 'true';
```

---

## Ejemplo Completo

Vamos a añadir una notificación de "Reserva Próxima a Expirar" (24 horas antes).

### 1. Definir Tipo

```typescript
// src/types/notifications.ts
export const NOTIFICATION_TYPES = {
  // ... existentes ...
  RESERVATION_EXPIRING_SOON: 'reservation_expiring_soon',
} as const;
```

### 2. Migración de Preferencias

```sql
-- supabase/migrations/XXXXXX_add_reservation_expiring_preference.sql

-- Añadir columna
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_reservation_expiring BOOLEAN DEFAULT true;

COMMENT ON COLUMN notification_preferences.email_reservation_expiring IS 
  'Enviar email 24 horas antes de que expire una reserva';

-- Actualizar función
CREATE OR REPLACE FUNCTION should_send_email(
  _user_id UUID,
  _notification_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  _prefs RECORD;
BEGIN
  SELECT * INTO _prefs
  FROM notification_preferences
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (_user_id)
    RETURNING * INTO _prefs;
  END IF;
  
  IF NOT _prefs.email_enabled THEN
    RETURN false;
  END IF;
  
  RETURN CASE _notification_type
    WHEN 'waitlist_offer' THEN _prefs.email_waitlist_offers
    WHEN 'warning_received' THEN _prefs.email_warnings
    WHEN 'user_blocked' THEN _prefs.email_blocks
    WHEN 'reservation_cancelled' THEN _prefs.email_reservation_cancelled
    WHEN 'incident_reassignment' THEN _prefs.email_incident_reassignment
    WHEN 'license_plate_rejected' THEN _prefs.email_license_plate_rejected
    WHEN 'reservation_expiring_soon' THEN _prefs.email_reservation_expiring  -- Nuevo
    ELSE false
  END;
END;
$;
```

### 3. Migración de Trigger

```sql
-- supabase/migrations/XXXXXX_add_reservation_expiring_trigger.sql

-- Función para cron job
CREATE OR REPLACE FUNCTION send_reservation_expiring_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  _reservation RECORD;
  _notification_id UUID;
  _spot_number TEXT;
  _group_name TEXT;
BEGIN
  -- Buscar reservas que expiran mañana y no tienen recordatorio
  FOR _reservation IN
    SELECT r.*
    FROM reservations r
    WHERE r.reservation_date = CURRENT_DATE + 1
      AND r.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.reference_id = r.id
          AND n.type = 'reservation_expiring_soon'
      )
  LOOP
    -- Obtener detalles de la plaza
    SELECT ps.spot_number, pg.name
    INTO _spot_number, _group_name
    FROM parking_spots ps
    JOIN parking_groups pg ON ps.group_id = pg.id
    WHERE ps.id = _reservation.spot_id;
    
    -- Crear notificación
    _notification_id := create_notification(
      _reservation.user_id,
      'reservation_expiring_soon',
      'Tu reserva es mañana',
      format('Recuerda que mañana tienes reservada la plaza %s en %s', 
        _spot_number, _group_name),
      'medium',
      'reservation',
      _reservation.id,
      format('/dashboard'),
      jsonb_build_object(
        'reservation_id', _reservation.id,
        'spot_number', _spot_number,
        'group_name', _group_name,
        'reservation_date', _reservation.reservation_date
      )
    );
    
    -- Enviar email si está habilitado
    IF should_send_email(_reservation.user_id, 'reservation_expiring_soon') 
       AND _notification_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'notification_id', _notification_id,
          'user_id', _reservation.user_id,
          'type', 'reservation_expiring_soon'
        )
      );
    END IF;
  END LOOP;
END;
$;

-- Programar cron job (diario a las 10:00 AM)
SELECT cron.schedule(
  'send-reservation-expiring-reminders',
  '0 10 * * *',
  $$ SELECT send_reservation_expiring_reminders(); $$
);
```

### 4. Template de Email

```typescript
// supabase/functions/send-notification/index.ts

case 'reservation_expiring_soon':
  return {
    subject: 'Recordatorio: Tu reserva es mañana - Reserveo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                   color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
          .info-box { background: #dbeafe; padding: 15px; border-radius: 6px; 
                     border-left: 4px solid #3b82f6; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; 
                   color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Recordatorio de Reserva</h1>
          </div>
          <div class="content">
            <p>Hola ${user.full_name},</p>
            <p>Te recordamos que <strong>mañana</strong> tienes una reserva de plaza de aparcamiento.</p>
            
            <div class="info-box">
              <p style="margin: 5px 0;"><strong>Plaza:</strong> ${notification.data.spot_number}</p>
              <p style="margin: 5px 0;"><strong>Grupo:</strong> ${notification.data.group_name}</p>
              <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(notification.data.reservation_date).toLocaleDateString('es-ES')}</p>
            </div>
            
            <p>No olvides hacer check-in cuando llegues al aparcamiento.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" class="button">
                Ver Mi Reserva
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>Reserveo - Sistema de Reservas de Parking</p>
            <p><a href="${baseUrl}/profile/preferences">Gestionar preferencias</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  };
```

### 5. Actualizar UI

```typescript
// src/components/profile/NotificationPreferences.tsx

<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="email_reservation_expiring">
      Recordatorio de Reserva
    </Label>
    <p className="text-sm text-muted-foreground">
      Recibir recordatorio 24 horas antes de tu reserva
    </p>
  </div>
  <Switch
    id="email_reservation_expiring"
    checked={preferences?.email_reservation_expiring ?? true}
    onCheckedChange={(checked) => 
      handleToggle('email_reservation_expiring', checked)
    }
    disabled={!preferences?.email_enabled || loading}
  />
</div>
```

### 6. Aplicar y Probar

```bash
# Aplicar migraciones
supabase db push

# Regenerar tipos
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Desplegar Edge Function
supabase functions deploy send-notification

# Probar manualmente
# En SQL Editor de Supabase:
SELECT send_reservation_expiring_reminders();
```

---

## Checklist Final

Antes de considerar completa la implementación:

- [ ] Tipo definido en `src/types/notifications.ts`
- [ ] Columna añadida a `notification_preferences`
- [ ] Función `should_send_email` actualizada
- [ ] Trigger o cron job creado
- [ ] Template de email implementado
- [ ] UI actualizada con switch de preferencias
- [ ] Tipos TypeScript regenerados
- [ ] Edge Function desplegada
- [ ] Tests manuales completados
- [ ] Notificación aparece en UI
- [ ] Email se envía correctamente
- [ ] Preferencias funcionan correctamente
- [ ] Documentación actualizada

---

## Recursos Adicionales

- **Documentación de Diseño:** `.kiro/specs/02-sistema-notificaciones/design.md`
- **Requisitos:** `.kiro/specs/02-sistema-notificaciones/requirements.md`
- **Troubleshooting:** `docs/NOTIFICATIONS-TROUBLESHOOTING.md`
- **Código de Referencia:**
  - `src/hooks/useNotifications.ts`
  - `src/components/notifications/NotificationBell.tsx`
  - `supabase/functions/send-notification/index.ts`
  - `supabase/migrations/*_add_notifications_*.sql`
