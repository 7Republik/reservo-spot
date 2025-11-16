# Sistema de Notificaciones - RESERVEO

## Resumen Ejecutivo

Sistema completo de notificaciones in-app y por email que mantiene a los usuarios informados sobre eventos críticos del sistema de reservas de parking.

**Estado:** ✅ Implementado y en producción  
**Última actualización:** 2025-11-16

---

## Características Principales

### Notificaciones In-App
- Campana de notificaciones en header con contador
- Dropdown interactivo con lista scrollable
- Prioridades visuales (urgent, high, medium, low)
- Categorías organizadas (waitlist, warning, reservation, incident, system)
- Navegación directa a acciones relevantes
- Real-time para notificaciones urgentes
- Polling cada 30s para notificaciones normales

### Notificaciones por Email
- Emails transaccionales vía Resend API
- Templates HTML responsive
- Preferencias granulares por tipo
- Master switch para desactivar todos los emails
- Cumplimiento GDPR
- Retry automático con exponential backoff

---

## Tipos de Notificaciones

### Waitlist (Urgentes)
| Tipo | Prioridad | Email | Descripción |
|------|-----------|-------|-------------|
| `waitlist_offer` | urgent | ✅ | Oferta de plaza disponible |
| `waitlist_reminder` | urgent | ✅ | Recordatorio de oferta próxima a expirar |
| `waitlist_accepted` | medium | ❌ | Confirmación de aceptación |
| `waitlist_rejected` | low | ❌ | Confirmación de rechazo |
| `waitlist_expired` | medium | ❌ | Oferta expirada |
| `waitlist_registered` | low | ❌ | Registro en lista confirmado |

### Amonestaciones y Bloqueos (Críticas)
| Tipo | Prioridad | Email | Descripción |
|------|-----------|-------|-------------|
| `warning_received` | high | ✅ | Nueva amonestación recibida |
| `user_blocked` | urgent | ✅ | Bloqueo temporal activado |
| `block_expired` | medium | ❌ | Bloqueo expirado |

### Reservas (Importantes)
| Tipo | Prioridad | Email | Descripción |
|------|-----------|-------|-------------|
| `reservation_cancelled` | high | ✅ | Reserva cancelada por admin |
| `reservation_confirmed` | medium | ❌ | Reserva confirmada desde waitlist |
| `checkin_reminder` | medium | ❌ | Recordatorio de check-in |
| `checkin_success` | low | ❌ | Check-in exitoso |

### Incidentes (Importantes)
| Tipo | Prioridad | Email | Descripción |
|------|-----------|-------|-------------|
| `incident_reassignment` | high | ✅ | Reasignación de plaza por incidente |
| `incident_reported` | low | ❌ | Confirmación de incidente reportado |
| `incident_confirmed` | high | ❌ | Incidente confirmado por admin |

### Sistema (Informativas)
| Tipo | Prioridad | Email | Descripción |
|------|-----------|-------|-------------|
| `license_plate_approved` | medium | ❌ | Matrícula aprobada |
| `license_plate_rejected` | high | ✅ | Matrícula rechazada |
| `group_access_added` | medium | ❌ | Acceso a grupo añadido |
| `group_access_removed` | medium | ❌ | Acceso a grupo removido |

---

## Arquitectura

### Base de Datos

**Tablas:**
- `organizations` - Multi-tenant ready (org por defecto)
- `notifications` - Notificaciones con prioridad y categoría
- `notification_preferences` - Preferencias de email por usuario

**Funciones SQL:**
- `get_user_organization()` - Obtiene org del usuario
- `create_notification()` - Crea notificación con deduplicación
- `should_send_email()` - Verifica preferencias
- `mark_notification_as_read()` - Marca como leída
- `mark_all_notifications_as_read()` - Marca todas como leídas
- `get_unread_count()` - Contador de no leídas
- `cleanup_old_notifications()` - Limpieza automática

**Triggers:**
- `on_waitlist_offer_created` - Oferta de waitlist
- `on_user_warning_created` - Amonestación
- `on_user_block_created` - Bloqueo temporal
- `on_reservation_cancelled_by_admin` - Cancelación por admin
- `on_incident_reassignment` - Reasignación de plaza
- `on_license_plate_status_changed` - Cambio de estado de matrícula

**Cron Jobs:**
- `cleanup_old_notifications` - Diario a las 02:00 AM
- `send_waitlist_reminders` - Cada 5 minutos

### Backend

**Edge Function:** `send-notification`
- Validación de parámetros
- Obtención de datos de usuario
- Verificación de preferencias
- Generación de template HTML
- Envío vía Resend API
- Actualización de flags
- Retry con exponential backoff

**Resend API:**
- Proveedor: Resend
- Free tier: 3,000 emails/mes
- Dominio: noreply@reserveo.com
- Templates responsive

### Frontend

**Componentes:**
- `NotificationBell` - Campana con dropdown
- `NotificationItem` - Item individual
- `NotificationPreferences` - Configuración de preferencias

**Hooks:**
- `useNotifications` - Gestión de notificaciones
- `useNotificationPreferences` - Gestión de preferencias

**Tipos:**
- `src/types/notifications.ts` - Tipos y constantes

---

## Configuración

### Variables de Entorno

**Supabase Edge Functions:**
```bash
RESEND_API_KEY=re_xxxxxxxxxx
APP_URL=https://tu-dominio.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**Frontend (.env):**
```bash
VITE_SUPABASE_PROJECT_ID=tu-project-id
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
```

### Resend Setup

1. Crear cuenta en [Resend](https://resend.com)
2. Verificar dominio (noreply@reserveo.com)
3. Obtener API key
4. Configurar en Supabase Edge Functions

### Preferencias por Defecto

```sql
-- Valores por defecto al crear usuario
email_enabled: true
email_waitlist_offers: true
email_warnings: true
email_blocks: true
email_reservation_cancelled: true
email_incident_reassignment: true
email_license_plate_rejected: true
```

---

## Flujo de Notificación

### 1. Evento Ocurre
```
Usuario cancela reserva
  ↓
Trigger detecta cancelación
  ↓
process_waitlist_for_spot()
  ↓
create_waitlist_offer()
```

### 2. Trigger Crea Notificación
```
on_waitlist_offer_created
  ↓
create_notification()
  ↓
INSERT en tabla notifications
  ↓
Deduplicación automática
```

### 3. Verificación de Email
```
should_send_email(user_id, type)
  ↓
Verificar email_enabled
  ↓
Verificar switch específico
  ↓
Retornar true/false
```

### 4. Envío de Email (si aplica)
```
Llamar Edge Function
  ↓
Obtener datos de usuario
  ↓
Generar template HTML
  ↓
Enviar vía Resend
  ↓
Actualizar email_sent
```

### 5. Usuario Ve Notificación
```
NotificationBell monta
  ↓
useNotifications() hook
  ↓
React Query fetch
  ↓
Real-time subscription (urgent)
  ↓
Polling cada 30s (normal)
  ↓
Update badge contador
```

---

## Performance

### Optimizaciones de Base de Datos

**Índices:**
```sql
-- Query principal (< 50ms)
idx_notifications_user_unread_priority

-- Limpieza eficiente
idx_notifications_cleanup

-- Deduplicación
idx_notifications_unique
```

**Limpieza Automática:**
- Notificaciones leídas > 30 días eliminadas
- Cron job diario a las 02:00 AM
- Mantiene notificaciones no leídas indefinidamente

### Optimizaciones de Frontend

**React Query:**
- staleTime: 30 segundos
- cacheTime: 5 minutos
- refetchOnWindowFocus: false

**Real-time:**
- Solo para notificaciones urgentes
- Reduce carga de WebSocket

**Polling:**
- Cada 30 segundos para normales
- Debounce de 1 segundo

**Lazy Loading:**
```typescript
const NotificationBell = lazy(() => 
  import('@/components/notifications/NotificationBell')
);
```

---

## Seguridad

### Row Level Security (RLS)

**Políticas:**
- Usuarios solo ven sus notificaciones
- Solo funciones SECURITY DEFINER pueden crear
- Usuarios solo pueden marcar como leídas sus notificaciones
- Admins ven todas las notificaciones de su organización

### Validación

**Input Validation:**
- Zod schemas en frontend
- Validación de campos en funciones SQL
- Sanitización de datos en templates

**Rate Limiting:**
- Límite de Resend: 3,000 emails/mes (free tier)
- Rate limit en Edge Function (10 requests/min por usuario)

---

## Monitoreo

### Métricas Clave

```sql
-- Total enviadas últimas 24 horas
SELECT COUNT(*) FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Tasa de lectura
SELECT 
  COUNT(*) FILTER (WHERE is_read = true) * 100.0 / COUNT(*) as read_rate
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days';

-- Tasa de error de emails
SELECT 
  COUNT(*) FILTER (WHERE email_sent = false) * 100.0 / COUNT(*) as error_rate
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND type IN ('waitlist_offer', 'warning_received', 'user_blocked');
```

### Alertas

**Configurar alertas para:**
- Tasa de error de emails > 5%
- Notificaciones urgentes no leídas > 7 días
- Cron jobs fallando
- Edge Function con errores

---

## Documentación Adicional

### Guías
- **Troubleshooting:** `docs/NOTIFICATIONS-TROUBLESHOOTING.md`
- **Añadir Nuevo Tipo:** `docs/NOTIFICATIONS-ADD-NEW-TYPE.md`

### Especificaciones
- **Requisitos:** `.kiro/specs/02-sistema-notificaciones/requirements.md`
- **Diseño:** `.kiro/specs/02-sistema-notificaciones/design.md`
- **Tareas:** `.kiro/specs/02-sistema-notificaciones/tasks.md`

### Código de Referencia
- **Hooks:** `src/hooks/useNotifications.ts`
- **Componentes:** `src/components/notifications/`
- **Edge Function:** `supabase/functions/send-notification/`
- **Migraciones:** `supabase/migrations/*_add_notifications_*.sql`

---

## Diseño de Emails

### Mejoras Implementadas
- ✅ **Logo embebido** en base64 (48x48px)
- ✅ **HTML responsive** compatible con todos los clientes
- ✅ **Headers anti-spam** (List-Unsubscribe, Reply-To)
- ✅ **Tags de organización** para analytics
- ✅ **Diseño profesional** con gradientes y botones

### Configuración DNS Requerida
Para evitar spam, configura estos registros:

**SPF:**
```dns
Tipo: TXT
Nombre: @
Valor: v=spf1 include:_spf.resend.com ~all
```

**DKIM:** (Resend te proporciona los valores)
```dns
Tipo: TXT
Nombre: resend._domainkey
Valor: [proporcionado por Resend]
```

**DMARC:**
```dns
Tipo: TXT
Nombre: _dmarc
Valor: v=DMARC1; p=quarantine; rua=mailto:dmarc@reserveo.app
```

### Personalizar Logo
```bash
# Convertir tu logo a base64
node scripts/convert-logo-to-base64.js public/logo.png

# Actualizar en: supabase/functions/send-notification/index.ts
const logoBase64 = 'data:image/png;base64,...'
```

**Ver documentación completa:** `docs/EMAIL-BEST-PRACTICES.md`

**Ver ejemplo de email:** `docs/email-template-example.html`

---

## Roadmap Futuro

### Mejoras Planificadas
- [ ] Notificaciones push (PWA)
- [ ] Agrupación de notificaciones similares
- [ ] Snooze de notificaciones
- [ ] Filtros avanzados en UI
- [ ] Exportación de historial
- [ ] Notificaciones por SMS (Twilio)
- [ ] Webhooks para integraciones externas

### Optimizaciones
- [ ] Paginación en lista de notificaciones
- [ ] Virtualización para listas largas
- [ ] Compresión de datos en cache
- [ ] CDN para templates de email

---

## Contacto y Soporte

**Documentación:**
- README.md - Sección de Notificaciones
- Esta guía (NOTIFICATIONS-SYSTEM.md)
- Troubleshooting (NOTIFICATIONS-TROUBLESHOOTING.md)

**Código:**
- GitHub: [repositorio del proyecto]
- Supabase Dashboard: [enlace al proyecto]

**Equipo:**
- Desarrollador Principal: [nombre]
- Email: [email de soporte]
