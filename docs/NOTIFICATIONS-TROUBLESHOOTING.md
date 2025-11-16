# Guía de Troubleshooting - Sistema de Notificaciones

## Tabla de Contenidos

1. [Emails No Recibidos](#emails-no-recibidos)
2. [Notificaciones In-App No Aparecen](#notificaciones-in-app-no-aparecen)
3. [Contador de Notificaciones Incorrecto](#contador-de-notificaciones-incorrecto)
4. [Notificaciones Duplicadas](#notificaciones-duplicadas)
5. [Errores en Edge Function](#errores-en-edge-function)
6. [Problemas de Performance](#problemas-de-performance)
7. [Verificación del Sistema](#verificación-del-sistema)

---

## Emails No Recibidos

### Síntoma
Los usuarios no reciben emails de notificaciones (ofertas de waitlist, amonestaciones, etc.)

### Diagnóstico

#### 1. Verificar Preferencias del Usuario

```sql
-- Ver preferencias de notificación del usuario
SELECT * FROM notification_preferences
WHERE user_id = 'user-uuid';
```

**Verificar:**
- `email_enabled` debe ser `true`
- El switch específico del tipo de notificación debe estar en `true`
- Ejemplo: `email_waitlist_offers` para ofertas de waitlist

**Solución:**
```sql
-- Activar emails globalmente
UPDATE notification_preferences
SET email_enabled = true
WHERE user_id = 'user-uuid';

-- Activar tipo específico
UPDATE notification_preferences
SET email_waitlist_offers = true
WHERE user_id = 'user-uuid';
```

#### 2. Verificar Email del Usuario

```sql
-- Ver email del perfil
SELECT email, full_name FROM profiles
WHERE id = 'user-uuid';
```

**Verificar:**
- El email existe y es válido
- No hay typos en el email

#### 3. Verificar Notificación Creada

```sql
-- Ver notificaciones del usuario
SELECT 
  id,
  type,
  title,
  email_sent,
  email_sent_at,
  created_at
FROM notifications
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

**Verificar:**
- La notificación existe en la tabla
- `email_sent` está en `true` (si debería haberse enviado)
- `email_sent_at` tiene timestamp

**Si `email_sent = false`:**
- El email no se intentó enviar
- Verificar que `should_send_email()` retorna `true`

```sql
-- Verificar función should_send_email
SELECT should_send_email('user-uuid', 'waitlist_offer');
-- Debe retornar true
```

#### 4. Verificar Logs de Edge Function

**En Supabase Dashboard:**
1. Ir a Edge Functions → send-notification
2. Ver logs recientes
3. Buscar errores relacionados con el `notification_id`

**Errores comunes:**
- `User not found` - El user_id no existe en profiles
- `Notification not found` - El notification_id no existe
- `Resend error` - Error de la API de Resend
- `Rate limit exceeded` - Límite de Resend alcanzado

#### 5. Verificar Configuración de Resend

**Variables de entorno:**
```bash
# En Supabase Dashboard → Edge Functions → Environment Variables
RESEND_API_KEY=re_xxxxxxxxxx
APP_URL=https://tu-dominio.com
```

**Verificar API Key:**
1. Ir a [Resend Dashboard](https://resend.com/api-keys)
2. Verificar que la key existe y está activa
3. Verificar límites de uso (free tier: 3,000 emails/mes)

**Verificar Dominio:**
1. Ir a [Resend Domains](https://resend.com/domains)
2. Verificar que el dominio está verificado
3. Verificar registros DNS (SPF, DKIM)

#### 6. Verificar Carpeta de Spam

**Instrucciones para el usuario:**
1. Revisar carpeta de spam/correo no deseado
2. Marcar como "No es spam" si está ahí
3. Añadir noreply@reserveo.com a contactos

### Soluciones Rápidas

**Reenviar email manualmente:**
```sql
-- Marcar notificación como no enviada
UPDATE notifications
SET email_sent = false, email_sent_at = NULL
WHERE id = 'notification-uuid';

-- El trigger intentará enviar de nuevo
-- O llamar Edge Function manualmente desde Dashboard
```

**Crear preferencias si no existen:**
```sql
-- Crear preferencias con defaults
INSERT INTO notification_preferences (user_id)
VALUES ('user-uuid')
ON CONFLICT (user_id) DO NOTHING;
```

---

## Notificaciones In-App No Aparecen

### Síntoma
Las notificaciones no se muestran en la campana del header

### Diagnóstico

#### 1. Verificar Notificaciones en Base de Datos

```sql
-- Ver notificaciones del usuario
SELECT 
  id,
  type,
  title,
  message,
  priority,
  is_read,
  created_at
FROM notifications
WHERE user_id = 'user-uuid'
  AND organization_id = get_user_organization('user-uuid')
ORDER BY priority DESC, created_at DESC
LIMIT 20;
```

**Si no hay notificaciones:**
- Los triggers no están funcionando
- Verificar que los eventos se están generando (ofertas, amonestaciones, etc.)

#### 2. Verificar Políticas RLS

```sql
-- Verificar que el usuario puede ver sus notificaciones
SELECT * FROM notifications
WHERE user_id = auth.uid()
LIMIT 1;
```

**Si retorna error de permisos:**
- Las políticas RLS están mal configuradas
- Verificar política "Users view own notifications"

```sql
-- Ver políticas de la tabla
SELECT * FROM pg_policies
WHERE tablename = 'notifications';
```

#### 3. Verificar Hook useNotifications

**En DevTools del navegador:**
```javascript
// Abrir consola y verificar
console.log('Notifications:', notifications);
console.log('Unread count:', unreadCount);
console.log('Loading:', loading);
console.log('Error:', error);
```

**Errores comunes:**
- `RLS policy violation` - Problema de permisos
- `Network error` - Problema de conexión
- `Invalid token` - Usuario no autenticado

#### 4. Verificar Real-time Subscription

**En consola del navegador:**
```javascript
// Ver estado de subscripciones
supabase.getChannels();
```

**Verificar:**
- Canal `urgent-notifications` está activo
- Estado es `SUBSCRIBED`

**Si no está suscrito:**
- Verificar que el componente NotificationBell está montado
- Verificar que no hay errores en useEffect

#### 5. Verificar Cache de React Query

**En React Query DevTools:**
1. Abrir DevTools
2. Buscar query `['notifications']`
3. Ver estado: `success`, `error`, `loading`
4. Ver datos en cache

**Invalidar cache manualmente:**
```javascript
queryClient.invalidateQueries({ queryKey: ['notifications'] });
```

### Soluciones Rápidas

**Forzar recarga:**
```javascript
// En consola del navegador
window.location.reload();
```

**Limpiar cache:**
```javascript
// En consola del navegador
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

---

## Contador de Notificaciones Incorrecto

### Síntoma
El badge muestra un número incorrecto de notificaciones no leídas

### Diagnóstico

#### 1. Verificar Contador en Base de Datos

```sql
-- Contar notificaciones no leídas
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = 'user-uuid'
  AND is_read = false;
```

**Comparar con el contador mostrado en UI**

#### 2. Verificar Función get_unread_count

```sql
-- Llamar función directamente
SELECT get_unread_count('user-uuid');
```

**Debe coincidir con el COUNT manual**

#### 3. Verificar Lógica en useNotifications

```typescript
// En src/hooks/useNotifications.ts
useEffect(() => {
  const count = notifications.filter(n => !n.is_read).length;
  setUnreadCount(count);
}, [notifications]);
```

**Verificar:**
- El filtro está correcto
- El estado se actualiza correctamente

### Soluciones Rápidas

**Recalcular contador:**
```sql
-- Marcar todas como leídas y empezar de nuevo
UPDATE notifications
SET is_read = true, read_at = NOW()
WHERE user_id = 'user-uuid';
```

**Invalidar cache:**
```javascript
queryClient.invalidateQueries({ queryKey: ['notifications'] });
```

---

## Notificaciones Duplicadas

### Síntoma
El usuario recibe múltiples notificaciones idénticas

### Diagnóstico

#### 1. Verificar Índice de Deduplicación

```sql
-- Ver índice único
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
  AND indexname = 'idx_notifications_unique';
```

**Debe existir:**
```sql
CREATE UNIQUE INDEX idx_notifications_unique 
ON notifications(organization_id, user_id, type, reference_id) 
WHERE is_read = false;
```

#### 2. Verificar Notificaciones Duplicadas

```sql
-- Buscar duplicados
SELECT 
  type,
  reference_id,
  COUNT(*) as count
FROM notifications
WHERE user_id = 'user-uuid'
  AND is_read = false
GROUP BY type, reference_id
HAVING COUNT(*) > 1;
```

#### 3. Verificar Función create_notification

```sql
-- Ver definición de la función
SELECT prosrc FROM pg_proc
WHERE proname = 'create_notification';
```

**Debe incluir:**
```sql
ON CONFLICT (organization_id, user_id, type, reference_id) 
WHERE is_read = false
DO NOTHING
```

### Soluciones Rápidas

**Eliminar duplicados:**
```sql
-- Mantener solo la más reciente de cada grupo
DELETE FROM notifications
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, type, reference_id 
        ORDER BY created_at DESC
      ) as rn
    FROM notifications
    WHERE is_read = false
  ) t
  WHERE rn > 1
);
```

**Recrear índice:**
```sql
DROP INDEX IF EXISTS idx_notifications_unique;
CREATE UNIQUE INDEX idx_notifications_unique 
ON notifications(organization_id, user_id, type, reference_id) 
WHERE is_read = false;
```

---

## Errores en Edge Function

### Síntoma
La Edge Function `send-notification` falla al enviar emails

### Diagnóstico

#### 1. Ver Logs de Edge Function

**En Supabase Dashboard:**
1. Edge Functions → send-notification
2. Logs → Ver últimos logs
3. Filtrar por errores

**Errores comunes y soluciones:**

**Error: `User not found`**
```typescript
// Verificar que el user_id existe
SELECT id, email FROM profiles WHERE id = 'user-uuid';
```

**Error: `Notification not found`**
```typescript
// Verificar que el notification_id existe
SELECT id FROM notifications WHERE id = 'notification-uuid';
```

**Error: `Resend API error: 429 Too Many Requests`**
- Límite de Resend alcanzado (free tier: 3,000/mes)
- Solución: Upgrade a plan de pago o esperar al siguiente mes

**Error: `Resend API error: 401 Unauthorized`**
- API key inválida o expirada
- Solución: Regenerar API key en Resend Dashboard

**Error: `Resend API error: 400 Bad Request`**
- Email inválido o template mal formado
- Verificar email del usuario y template HTML

#### 2. Probar Edge Function Manualmente

**Desde Supabase Dashboard:**
1. Edge Functions → send-notification
2. Invoke → Añadir payload de prueba:

```json
{
  "notification_id": "notification-uuid",
  "user_id": "user-uuid",
  "type": "waitlist_offer"
}
```

3. Ver respuesta y logs

#### 3. Verificar Variables de Entorno

```bash
# En Supabase Dashboard → Edge Functions → Environment Variables
RESEND_API_KEY=re_xxxxxxxxxx
APP_URL=https://tu-dominio.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Soluciones Rápidas

**Reintentar envío:**
```sql
-- Marcar como no enviado para reintentar
UPDATE notifications
SET email_sent = false, email_sent_at = NULL
WHERE id = 'notification-uuid';
```

**Verificar conectividad:**
```bash
# Desde terminal local
curl https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@reserveo.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

---

## Problemas de Performance

### Síntoma
Las notificaciones cargan lentamente o causan lag en la UI

### Diagnóstico

#### 1. Verificar Índices

```sql
-- Ver índices de la tabla notifications
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'notifications';
```

**Índices requeridos:**
- `idx_notifications_user_unread_priority` - Query principal
- `idx_notifications_cleanup` - Limpieza
- `idx_notifications_unique` - Deduplicación

#### 2. Analizar Query Performance

```sql
-- Analizar query principal
EXPLAIN ANALYZE
SELECT * FROM notifications
WHERE organization_id = 'org-id'
  AND user_id = 'user-uuid'
  AND is_read = false
ORDER BY priority DESC, created_at DESC
LIMIT 50;
```

**Verificar:**
- Usa `Index Scan` (no `Seq Scan`)
- Tiempo de ejecución < 50ms

#### 3. Verificar Cantidad de Notificaciones

```sql
-- Contar notificaciones por usuario
SELECT 
  user_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread
FROM notifications
GROUP BY user_id
ORDER BY total DESC
LIMIT 10;
```

**Si hay usuarios con > 1000 notificaciones:**
- Implementar paginación
- Ejecutar limpieza manual

#### 4. Verificar Polling Frequency

```typescript
// En useNotifications.ts
useEffect(() => {
  const interval = setInterval(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, 30000); // 30 segundos
  
  return () => clearInterval(interval);
}, [queryClient]);
```

**Verificar:**
- Intervalo no es demasiado corto (< 10s)
- Interval se limpia correctamente

### Soluciones Rápidas

**Ejecutar limpieza manual:**
```sql
-- Eliminar notificaciones leídas antiguas
DELETE FROM notifications
WHERE is_read = true
  AND created_at < NOW() - INTERVAL '30 days';
```

**Recrear índices:**
```sql
-- Recrear índice principal
DROP INDEX IF EXISTS idx_notifications_user_unread_priority;
CREATE INDEX idx_notifications_user_unread_priority 
ON notifications(organization_id, user_id, is_read, priority DESC, created_at DESC);

-- Analizar tabla
ANALYZE notifications;
```

**Aumentar staleTime:**
```typescript
// En useNotifications.ts
const { data: notifications = [], isLoading } = useQuery({
  queryKey: ['notifications'],
  queryFn: async () => { ... },
  staleTime: 60000, // Aumentar a 60 segundos
});
```

---

## Verificación del Sistema

### Checklist Completo

#### Base de Datos

```sql
-- 1. Verificar tablas existen
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'notifications', 'notification_preferences');

-- 2. Verificar organización por defecto
SELECT * FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Verificar funciones existen
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_organization',
    'create_notification',
    'should_send_email',
    'mark_notification_as_read',
    'mark_all_notifications_as_read',
    'get_unread_count',
    'cleanup_old_notifications'
  );

-- 4. Verificar triggers existen
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%notify%';

-- 5. Verificar políticas RLS
SELECT policyname, tablename
FROM pg_policies
WHERE tablename = 'notifications';

-- 6. Verificar cron jobs
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname LIKE '%notification%';
```

#### Edge Function

```bash
# Verificar Edge Function existe
supabase functions list

# Verificar variables de entorno
# En Supabase Dashboard → Edge Functions → Environment Variables
```

#### Frontend

```typescript
// Verificar componentes existen
// src/components/notifications/NotificationBell.tsx
// src/components/notifications/NotificationItem.tsx
// src/components/profile/NotificationPreferences.tsx

// Verificar hooks existen
// src/hooks/useNotifications.ts
// src/hooks/useNotificationPreferences.ts

// Verificar tipos existen
// src/types/notifications.ts
```

### Test de Extremo a Extremo

**1. Crear notificación de prueba:**
```sql
SELECT create_notification(
  'user-uuid',
  'test_notification',
  'Test de Notificación',
  'Este es un mensaje de prueba',
  'medium',
  'system',
  NULL,
  NULL,
  NULL
);
```

**2. Verificar aparece en UI:**
- Abrir aplicación
- Ver campana de notificaciones
- Debe aparecer la notificación de prueba

**3. Marcar como leída:**
- Click en la notificación
- Verificar que desaparece del contador

**4. Verificar en base de datos:**
```sql
SELECT is_read, read_at
FROM notifications
WHERE type = 'test_notification'
  AND user_id = 'user-uuid';
```

**5. Limpiar:**
```sql
DELETE FROM notifications
WHERE type = 'test_notification';
```

---

## Contacto y Soporte

Si después de seguir esta guía el problema persiste:

1. **Recopilar información:**
   - Logs de Edge Function
   - Queries SQL ejecutadas
   - Mensajes de error exactos
   - Screenshots de la UI

2. **Verificar documentación:**
   - README.md - Sección de Notificaciones
   - .kiro/specs/02-sistema-notificaciones/design.md
   - .kiro/specs/02-sistema-notificaciones/requirements.md

3. **Revisar código:**
   - src/hooks/useNotifications.ts
   - src/components/notifications/NotificationBell.tsx
   - supabase/functions/send-notification/index.ts
   - supabase/migrations/*_add_notifications_*.sql

---

## Apéndice: Comandos Útiles

### Queries de Diagnóstico

```sql
-- Ver últimas 10 notificaciones de un usuario
SELECT 
  id,
  type,
  title,
  priority,
  is_read,
  email_sent,
  created_at
FROM notifications
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;

-- Ver preferencias de un usuario
SELECT * FROM notification_preferences
WHERE user_id = 'user-uuid';

-- Ver estadísticas generales
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE email_sent = true) as emails_sent,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days';

-- Ver tasa de error de emails
SELECT 
  COUNT(*) FILTER (WHERE email_sent = false) * 100.0 / COUNT(*) as error_rate
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND type IN ('waitlist_offer', 'warning_received', 'user_blocked');
```

### Comandos de Mantenimiento

```sql
-- Limpiar notificaciones antiguas manualmente
DELETE FROM notifications
WHERE is_read = true
  AND created_at < NOW() - INTERVAL '30 days';

-- Recrear preferencias para todos los usuarios
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- Marcar todas las notificaciones como leídas para un usuario
UPDATE notifications
SET is_read = true, read_at = NOW()
WHERE user_id = 'user-uuid'
  AND is_read = false;

-- Ver usuarios con más notificaciones no leídas
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY user_id
ORDER BY unread_count DESC
LIMIT 10;
```
