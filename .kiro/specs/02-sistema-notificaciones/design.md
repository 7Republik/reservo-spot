ey# Design Document - 02 Sistema de Notificaciones

## Overview

El sistema de notificaciones de RESERVEO proporciona comunicación crítica entre el sistema y los usuarios a través de dos canales: notificaciones in-app y emails transaccionales. El diseño prioriza notificaciones críticas que requieren acción del usuario, evitando sobrecarga de información. La arquitectura está preparada para multi-tenancy desde el inicio, permitiendo migración futura sin refactorización.

### Principios de Diseño

1. **Notificaciones Críticas Primero**: Solo notificar eventos que requieren acción o impactan el flujo del usuario
2. **Multi-Tenant Ready**: Arquitectura preparada para multi-tenancy con organización por defecto
3. **Performance First**: Índices optimizados, polling inteligente, real-time solo para urgentes
4. **GDPR Compliant**: Preferencias de usuario con opt-out granular por tipo de notificación
5. **Fail-Safe**: Notificaciones in-app siempre funcionan, emails son best-effort
6. **Escalabilidad**: Diseño que soporta crecimiento sin degradación de performance

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │NotificationBell│  │Preferences UI│  │useNotifications│       │
│  │  (Header)    │  │   (Profile)  │  │    (Hook)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Supabase API   │
                    │   (RLS + Auth)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
│  notifications │  │notification_    │  │organizations│
│     (table)    │  │  preferences    │  │   (table)   │
└───────┬────────┘  └─────────────────┘  └─────────────┘
        │
        │ Triggers
        │
┌───────▼────────────────────────────────────────────────┐
│              SQL TRIGGERS                              │
│  • on_waitlist_offer_created                          │
│  • on_user_warning_created                            │
│  • on_user_block_created                              │
│  • on_reservation_cancelled_by_admin                  │
│  • on_incident_reassignment                           │
│  • on_license_plate_status_changed                    │
└───────┬────────────────────────────────────────────────┘
        │
        │ Calls
        │
┌───────▼────────────────────────────────────────────────┐
│         EDGE FUNCTION: send-notification               │
│  1. Check user preferences                            │
│  2. Generate email template                           │
│  3. Send via Resend API                               │
│  4. Update email_sent flag                            │
└───────┬────────────────────────────────────────────────┘
        │
        │ HTTP POST
        │
┌───────▼────────────────────────────────────────────────┐
│              RESEND API                                │
│  • Deliverability garantizado                         │
│  • Free tier: 3,000 emails/mes                        │
│  • Templates HTML responsive                          │
└────────────────────────────────────────────────────────┘
```

### Data Flow

**Escenario 1: Oferta de Waitlist**
```
1. Usuario cancela reserva
   ↓
2. Trigger on_reservation_cancelled
   ↓
3. process_waitlist_for_spot()
   ↓
4. create_waitlist_offer()
   ↓
5. Trigger on_waitlist_offer_created
   ↓
6. create_notification() → INSERT in notifications
   ↓
7. IF email_waitlist_offers = true
   ↓
8. Edge Function send-notification
   ↓
9. Resend API → Email enviado
   ↓
10. UPDATE notifications SET email_sent = true
```

**Escenario 2: Usuario consulta notificaciones**
```
1. NotificationBell monta
   ↓
2. useNotifications() hook
   ↓
3. React Query: getNotifications()
   ↓
4. Supabase: SELECT con RLS
   ↓
5. Real-time subscription (solo urgent)
   ↓
6. Polling cada 30s (no urgent)
   ↓
7. Update badge contador
```

## Components and Interfaces


### Database Schema

#### Table: organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organización por defecto para single-tenant
INSERT INTO organizations (id, name, slug) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default'
);
```

**Propósito**: Preparar sistema para multi-tenancy. Por ahora solo existe organización por defecto.

#### Table: notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Clasificación
  type TEXT NOT NULL, -- 'waitlist_offer', 'warning_received', 'user_blocked', etc.
  category TEXT NOT NULL DEFAULT 'system' 
    CHECK (category IN ('reservation', 'waitlist', 'warning', 'incident', 'system')),
  priority TEXT NOT NULL DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Contenido
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Datos adicionales específicos del tipo
  
  -- Acción
  reference_id UUID, -- ID de la reserva, oferta, warning, etc.
  action_url TEXT, -- URL para acción rápida (ej: /waitlist/offers/123)
  
  -- Estado
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Email
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice compuesto para queries optimizados
CREATE INDEX idx_notifications_user_unread_priority 
ON notifications(organization_id, user_id, is_read, priority DESC, created_at DESC);

-- Prevenir duplicados
CREATE UNIQUE INDEX idx_notifications_unique 
ON notifications(organization_id, user_id, type, reference_id) 
WHERE is_read = false;

-- Índice para limpieza
CREATE INDEX idx_notifications_cleanup 
ON notifications(created_at) 
WHERE is_read = true;
```

**Campos clave:**
- `organization_id`: Multi-tenant ready, usa org por defecto
- `priority`: Determina urgencia visual y si usa real-time
- `category`: Agrupa notificaciones por dominio
- `reference_id`: Permite deduplicación y navegación
- `action_url`: Enlace directo a la acción relevante

#### Table: notification_preferences

```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id)
    DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Master switch
  email_enabled BOOLEAN DEFAULT true,
  
  -- Notificaciones críticas (recomendado mantener activas)
  email_waitlist_offers BOOLEAN DEFAULT true,
  email_warnings BOOLEAN DEFAULT true,
  email_blocks BOOLEAN DEFAULT true,
  
  -- Notificaciones importantes
  email_reservation_cancelled BOOLEAN DEFAULT true,
  email_incident_reassignment BOOLEAN DEFAULT true,
  email_license_plate_rejected BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE TRIGGER set_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Lógica de preferencias:**
- Si `email_enabled = false`: No se envía ningún email
- Si `email_enabled = true`: Se respetan switches individuales
- Notificaciones in-app siempre activas (no configurables)

### SQL Functions

#### Function: get_user_organization

```sql
CREATE OR REPLACE FUNCTION get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT organization_id FROM profiles WHERE id = _user_id),
    '00000000-0000-0000-0000-000000000001'::UUID
  );
$$;
```

**Propósito**: Obtener organization_id del usuario. Si no existe en profiles (single-tenant actual), retorna org por defecto.

#### Function: create_notification

```sql
CREATE OR REPLACE FUNCTION create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _priority TEXT DEFAULT 'medium',
  _category TEXT DEFAULT 'system',
  _reference_id UUID DEFAULT NULL,
  _action_url TEXT DEFAULT NULL,
  _data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _organization_id UUID;
BEGIN
  -- Obtener organización del usuario
  _organization_id := get_user_organization(_user_id);
  
  -- Insertar notificación
  INSERT INTO notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    priority,
    category,
    reference_id,
    action_url,
    data
  ) VALUES (
    _organization_id,
    _user_id,
    _type,
    _title,
    _message,
    _priority,
    _category,
    _reference_id,
    _action_url,
    _data
  )
  ON CONFLICT (organization_id, user_id, type, reference_id) 
  WHERE is_read = false
  DO NOTHING
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;
```

**Características:**
- Maneja deduplicación automática (ON CONFLICT)
- Obtiene organization_id automáticamente
- Retorna notification_id para logging

#### Function: should_send_email

```sql
CREATE OR REPLACE FUNCTION should_send_email(
  _user_id UUID,
  _notification_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    WHEN 'waitlist_offer' THEN _prefs.email_waitlist_offers
    WHEN 'waitlist_reminder' THEN _prefs.email_waitlist_offers
    WHEN 'warning_received' THEN _prefs.email_warnings
    WHEN 'user_blocked' THEN _prefs.email_blocks
    WHEN 'reservation_cancelled' THEN _prefs.email_reservation_cancelled
    WHEN 'incident_reassignment' THEN _prefs.email_incident_reassignment
    WHEN 'license_plate_rejected' THEN _prefs.email_license_plate_rejected
    ELSE false
  END;
END;
$$;
```

#### Function: mark_notification_as_read

```sql
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  _notification_id UUID,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE id = _notification_id
    AND user_id = _user_id
    AND is_read = false;
  
  RETURN FOUND;
END;
$$;
```

#### Function: cleanup_old_notifications

```sql
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_count INTEGER;
BEGIN
  -- Eliminar notificaciones leídas con más de 30 días
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS _deleted_count = ROW_COUNT;
  
  -- Log resultado
  RAISE NOTICE 'Cleaned up % old notifications', _deleted_count;
  
  RETURN _deleted_count;
END;
$$;
```

### Triggers

#### Trigger: on_waitlist_offer_created

```sql
CREATE OR REPLACE FUNCTION notify_waitlist_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
  _spot_number TEXT;
  _group_name TEXT;
  _should_email BOOLEAN;
BEGIN
  -- Obtener detalles de la plaza
  SELECT ps.spot_number, pg.name
  INTO _spot_number, _group_name
  FROM parking_spots ps
  JOIN parking_groups pg ON ps.group_id = pg.id
  WHERE ps.id = NEW.spot_id;
  
  -- Crear notificación in-app
  _notification_id := create_notification(
    NEW.user_id,
    'waitlist_offer',
    '¡Plaza Disponible!',
    format('Tienes una plaza disponible: %s en %s. Expira en %s minutos.',
      _spot_number, _group_name, 
      EXTRACT(EPOCH FROM (NEW.expires_at - NOW())) / 60
    ),
    'urgent',
    'waitlist',
    NEW.id,
    format('/waitlist/offers/%s', NEW.id),
    jsonb_build_object(
      'offer_id', NEW.id,
      'spot_number', _spot_number,
      'group_name', _group_name,
      'expires_at', NEW.expires_at
    )
  );
  
  -- Verificar si debe enviar email
  _should_email := should_send_email(NEW.user_id, 'waitlist_offer');
  
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
        'type', 'waitlist_offer'
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar la operación principal
    RAISE WARNING 'Error creating waitlist offer notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_waitlist_offer_created
AFTER INSERT ON waitlist_offers
FOR EACH ROW
EXECUTE FUNCTION notify_waitlist_offer();
```

**Nota**: Triggers similares para otros eventos (warnings, blocks, etc.)


### Edge Function: send-notification

**Ubicación**: `supabase/functions/send-notification/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

interface NotificationRequest {
  notification_id: string
  user_id: string
  type: string
}

serve(async (req) => {
  try {
    const { notification_id, user_id, type }: NotificationRequest = await req.json()
    
    // 1. Obtener datos del usuario
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single()
    
    if (userError || !user) {
      throw new Error('User not found')
    }
    
    // 2. Obtener datos de la notificación
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single()
    
    if (notifError || !notification) {
      throw new Error('Notification not found')
    }
    
    // 3. Generar email según tipo
    const emailData = generateEmailTemplate(type, notification, user)
    
    // 4. Enviar email con Resend
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Reserveo <noreply@reserveo.com>',
      to: user.email,
      subject: emailData.subject,
      html: emailData.html
    })
    
    if (emailError) {
      throw emailError
    }
    
    // 5. Actualizar flag de email enviado
    await supabase
      .from('notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', notification_id)
    
    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailTemplate(type: string, notification: any, user: any) {
  const baseUrl = Deno.env.get('APP_URL') || 'https://reserveo.com'
  
  switch (type) {
    case 'waitlist_offer':
      return {
        subject: '¡Plaza Disponible! - Reserveo',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
              .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; 
                       text-decoration: none; border-radius: 6px; font-weight: bold; }
              .button-accept { background: #10b981; color: white; }
              .button-reject { background: #ef4444; color: white; }
              .countdown { background: #fef3c7; padding: 15px; border-radius: 6px; 
                          text-align: center; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>¡Plaza Disponible!</h1>
              </div>
              <div class="content">
                <p>Hola ${user.full_name},</p>
                <p>Tenemos buenas noticias: <strong>hay una plaza disponible para ti</strong>.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Plaza:</strong> ${notification.data.spot_number}</p>
                  <p style="margin: 5px 0;"><strong>Grupo:</strong> ${notification.data.group_name}</p>
                  <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(notification.data.reservation_date).toLocaleDateString('es-ES')}</p>
                </div>
                
                <div class="countdown">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">⏰ Esta oferta expira pronto</p>
                  <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #92400e;">
                    ${Math.floor((new Date(notification.data.expires_at) - new Date()) / 60000)} minutos restantes
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/waitlist/offers/${notification.reference_id}?action=accept" 
                     class="button button-accept">
                    ✓ Aceptar Plaza
                  </a>
                  <a href="${baseUrl}/waitlist/offers/${notification.reference_id}?action=reject" 
                     class="button button-reject">
                    ✗ Rechazar
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  Si no respondes a tiempo, la oferta expirará automáticamente y se ofrecerá al siguiente usuario en la lista.
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
      }
    
    case 'warning_received':
      return {
        subject: 'Amonestación Recibida - Reserveo',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
              .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; 
                            padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Amonestación Recibida</h1>
              </div>
              <div class="content">
                <p>Hola ${user.full_name},</p>
                <p>Has recibido una amonestación por el siguiente motivo:</p>
                
                <div class="warning-box">
                  <p><strong>Motivo:</strong> ${notification.data.reason}</p>
                  <p><strong>Fecha:</strong> ${new Date(notification.created_at).toLocaleDateString('es-ES')}</p>
                  <p><strong>Detalles:</strong> ${notification.message}</p>
                </div>
                
                <p>Por favor, revisa las normas de uso del parking para evitar futuras amonestaciones.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/profile" 
                     style="display: inline-block; padding: 12px 30px; background: #3b82f6; 
                            color: white; text-decoration: none; border-radius: 6px;">
                    Ver Mi Perfil
                  </a>
                </div>
              </div>
              <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                <p>Reserveo - Sistema de Reservas de Parking</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    
    // Más templates para otros tipos...
    
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
      }
  }
}
```

### Frontend Components

#### Component: NotificationBell

**Ubicación**: `src/components/notifications/NotificationBell.tsx`

```typescript
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold">Notificaciones</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Cargando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No tienes notificaciones
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => markAsRead(notification.id)}
            />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

#### Hook: useNotifications

**Ubicación**: `src/hooks/useNotifications.ts`

```typescript
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Query para obtener notificaciones
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    staleTime: 30000, // Cache 30 segundos
  });

  // Calcular contador de no leídas
  useEffect(() => {
    const count = notifications.filter(n => !n.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Subscription real-time solo para notificaciones urgentes
  useEffect(() => {
    const channel = supabase
      .channel('urgent-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `priority=eq.urgent`,
        },
        (payload) => {
          // Invalidar cache para refrescar
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // Mostrar toast
          toast.info(payload.new.title, {
            description: payload.new.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Polling cada 30s para notificaciones no urgentes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Mutation para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        _notification_id: notificationId,
        _user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        _user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
  });

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};
```


## Data Models

### Notification Types

```typescript
// src/types/notifications.ts

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory = 'reservation' | 'waitlist' | 'warning' | 'incident' | 'system';

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any> | null;
  reference_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  organization_id: string;
  email_enabled: boolean;
  email_waitlist_offers: boolean;
  email_warnings: boolean;
  email_blocks: boolean;
  email_reservation_cancelled: boolean;
  email_incident_reassignment: boolean;
  email_license_plate_rejected: boolean;
  created_at: string;
  updated_at: string;
}

// Mapeo de tipos de notificación
export const NOTIFICATION_TYPES = {
  // Waitlist
  WAITLIST_REGISTERED: 'waitlist_registered',
  WAITLIST_OFFER: 'waitlist_offer',
  WAITLIST_REMINDER: 'waitlist_reminder',
  WAITLIST_ACCEPTED: 'waitlist_accepted',
  WAITLIST_REJECTED: 'waitlist_rejected',
  WAITLIST_EXPIRED: 'waitlist_expired',
  
  // Warnings & Blocks
  WARNING_RECEIVED: 'warning_received',
  USER_BLOCKED: 'user_blocked',
  BLOCK_EXPIRED: 'block_expired',
  
  // Reservations
  RESERVATION_CONFIRMED: 'reservation_confirmed',
  RESERVATION_CANCELLED: 'reservation_cancelled',
  CHECKIN_REMINDER: 'checkin_reminder',
  CHECKIN_SUCCESS: 'checkin_success',
  
  // Incidents
  INCIDENT_REPORTED: 'incident_reported',
  INCIDENT_REASSIGNMENT: 'incident_reassignment',
  INCIDENT_CONFIRMED: 'incident_confirmed',
  
  // System
  LICENSE_PLATE_APPROVED: 'license_plate_approved',
  LICENSE_PLATE_REJECTED: 'license_plate_rejected',
  GROUP_ACCESS_ADDED: 'group_access_added',
  GROUP_ACCESS_REMOVED: 'group_access_removed',
} as const;

// Configuración visual por prioridad
export const PRIORITY_CONFIG = {
  urgent: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '🔴',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '🟠',
  },
  medium: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🔵',
  },
  low: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: '⚪',
  },
} as const;
```

## Error Handling

### Database Errors

```typescript
// Manejo de errores en hooks
try {
  const { data, error } = await supabase
    .from('notifications')
    .select('*');
    
  if (error) {
    if (error.code === '42501') {
      // RLS policy violation
      toast.error('No tienes permisos para ver estas notificaciones');
    } else if (error.code === '23505') {
      // Unique constraint violation (notificación duplicada)
      console.warn('Notificación duplicada, ignorando');
    } else {
      toast.error('Error al cargar notificaciones');
      console.error('Database error:', error);
    }
  }
} catch (err) {
  toast.error('Error inesperado');
  console.error('Unexpected error:', err);
}
```

### Edge Function Errors

```typescript
// En Edge Function
try {
  const { data, error } = await resend.emails.send({...});
  
  if (error) {
    // Log detallado para debugging
    console.error('Resend error:', {
      code: error.code,
      message: error.message,
      user_id: user_id,
      notification_id: notification_id,
    });
    
    // No actualizar email_sent si falla
    throw new Error(`Email send failed: ${error.message}`);
  }
} catch (error) {
  // Registrar en logs de Supabase
  await supabase
    .from('email_logs')
    .insert({
      notification_id,
      user_id,
      error: error.message,
      attempted_at: new Date().toISOString(),
    });
  
  // Retornar error sin romper el flujo
  return new Response(
    JSON.stringify({ success: false, error: error.message }),
    { status: 500 }
  );
}
```

### Retry Logic

```typescript
// Retry con exponential backoff para Resend
async function sendEmailWithRetry(emailData: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send(emailData);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Testing Strategy

### Unit Tests

**SQL Functions:**
```sql
-- Test create_notification
BEGIN;
  SELECT plan(5);
  
  -- Test 1: Crear notificación básica
  SELECT ok(
    create_notification(
      'user-id',
      'test_notification',
      'Test Title',
      'Test Message'
    ) IS NOT NULL,
    'Should create notification and return ID'
  );
  
  -- Test 2: Deduplicación
  SELECT is(
    (SELECT COUNT(*) FROM notifications 
     WHERE type = 'test_notification' AND is_read = false),
    1::bigint,
    'Should not create duplicate unread notifications'
  );
  
  -- Test 3: Organization ID automático
  SELECT is(
    (SELECT organization_id FROM notifications WHERE type = 'test_notification'),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Should use default organization ID'
  );
  
  SELECT * FROM finish();
ROLLBACK;
```

**React Hooks:**
```typescript
// tests/hooks/useNotifications.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';

describe('useNotifications', () => {
  it('should load notifications on mount', async () => {
    const { result } = renderHook(() => useNotifications());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.notifications).toBeDefined();
  });
  
  it('should calculate unread count correctly', async () => {
    const { result } = renderHook(() => useNotifications());
    
    await waitFor(() => {
      expect(result.current.unreadCount).toBeGreaterThanOrEqual(0);
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/notifications.test.ts
describe('Notification Flow', () => {
  it('should create notification when waitlist offer is created', async () => {
    // 1. Crear oferta de waitlist
    const { data: offer } = await supabase
      .from('waitlist_offers')
      .insert({
        user_id: testUserId,
        spot_id: testSpotId,
        entry_id: testEntryId,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      })
      .select()
      .single();
    
    // 2. Esperar a que trigger cree notificación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Verificar notificación creada
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('reference_id', offer.id)
      .eq('type', 'waitlist_offer')
      .single();
    
    expect(notification).toBeDefined();
    expect(notification.priority).toBe('urgent');
    expect(notification.category).toBe('waitlist');
  });
});
```

### E2E Tests

```typescript
// tests/e2e/notifications.spec.ts
import { test, expect } from '@playwright/test';

test('user can view and mark notifications as read', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // 2. Verificar badge de notificaciones
  const badge = page.locator('[data-testid="notification-badge"]');
  await expect(badge).toBeVisible();
  
  // 3. Abrir dropdown
  await page.click('[data-testid="notification-bell"]');
  
  // 4. Verificar lista de notificaciones
  const notifications = page.locator('[data-testid="notification-item"]');
  await expect(notifications).toHaveCount(await notifications.count());
  
  // 5. Marcar como leída
  await notifications.first().click();
  
  // 6. Verificar contador actualizado
  await expect(badge).toHaveText(String(await notifications.count() - 1));
});
```

## Performance Considerations

### Database Optimization

**Índices críticos:**
```sql
-- Índice compuesto para queries principales
CREATE INDEX idx_notifications_user_unread_priority 
ON notifications(organization_id, user_id, is_read, priority DESC, created_at DESC);

-- Índice para limpieza
CREATE INDEX idx_notifications_cleanup 
ON notifications(created_at) 
WHERE is_read = true;

-- Índice para deduplicación
CREATE UNIQUE INDEX idx_notifications_unique 
ON notifications(organization_id, user_id, type, reference_id) 
WHERE is_read = false;
```

**Query optimization:**
```sql
-- ✅ BUENO: Usa índice compuesto
SELECT * FROM notifications
WHERE organization_id = 'org-id'
  AND user_id = 'user-id'
  AND is_read = false
ORDER BY priority DESC, created_at DESC
LIMIT 50;

-- ❌ MALO: No usa índice eficientemente
SELECT * FROM notifications
WHERE user_id = 'user-id'
ORDER BY created_at DESC; -- Falta filtro por is_read
```

### Frontend Optimization

**React Query configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 segundos
      cacheTime: 300000, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Lazy loading:**
```typescript
// Cargar NotificationBell solo cuando usuario está autenticado
const NotificationBell = lazy(() => import('@/components/notifications/NotificationBell'));

// En Header
{isAuthenticated && (
  <Suspense fallback={<Bell className="h-5 w-5 text-muted-foreground" />}>
    <NotificationBell />
  </Suspense>
)}
```

**Debounce en polling:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedRefresh = useDebouncedCallback(
  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  1000 // 1 segundo
);
```

### Email Optimization

**Batch processing:**
```typescript
// Procesar múltiples emails en una invocación
async function sendBatchEmails(notifications: Notification[]) {
  const batchSize = 100;
  
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(notification => 
        sendEmailWithRetry(notification)
      )
    );
    
    // Pequeña pausa entre batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

## Security Considerations

### RLS Policies

```sql
-- Usuarios solo ven sus notificaciones
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = get_user_organization(auth.uid())
);

-- Solo funciones SECURITY DEFINER pueden crear
CREATE POLICY "Only functions create notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (false);

-- Usuarios solo pueden marcar como leídas sus notificaciones
CREATE POLICY "Users mark own notifications as read"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND is_read = true
  AND read_at IS NOT NULL
);
```

### Input Validation

```typescript
// Validar datos antes de crear notificación
function validateNotificationData(data: any) {
  const schema = z.object({
    user_id: z.string().uuid(),
    type: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    category: z.enum(['reservation', 'waitlist', 'warning', 'incident', 'system']),
  });
  
  return schema.parse(data);
}
```

### Rate Limiting

```typescript
// Rate limit en Edge Function
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Limpiar requests antiguos
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
}
```

## Monitoring and Logging

### Metrics to Track

```typescript
// Métricas importantes
interface NotificationMetrics {
  total_sent: number;
  total_read: number;
  read_rate: number;
  email_sent: number;
  email_failed: number;
  email_success_rate: number;
  avg_time_to_read: number; // en minutos
  by_priority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  by_category: {
    waitlist: number;
    warning: number;
    reservation: number;
    incident: number;
    system: number;
  };
}
```

### Logging Strategy

```typescript
// Structured logging en Edge Function
console.log(JSON.stringify({
  level: 'info',
  event: 'email_sent',
  notification_id: notification.id,
  user_id: user.id,
  type: notification.type,
  email_id: emailResult.id,
  timestamp: new Date().toISOString(),
}));

// Error logging
console.error(JSON.stringify({
  level: 'error',
  event: 'email_failed',
  notification_id: notification.id,
  user_id: user.id,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
}));
```

### Alerts

```sql
-- Query para detectar problemas
-- Tasa de error de emails > 5%
SELECT 
  COUNT(*) FILTER (WHERE email_sent = false) * 100.0 / COUNT(*) as error_rate
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND type IN ('waitlist_offer', 'warning_received', 'user_blocked');

-- Notificaciones no leídas antiguas (> 7 días)
SELECT COUNT(*)
FROM notifications
WHERE is_read = false
  AND priority IN ('urgent', 'high')
  AND created_at < NOW() - INTERVAL '7 days';
```

## Deployment Checklist

- [ ] Crear tabla `organizations` con org por defecto
- [ ] Crear tabla `notifications` con índices
- [ ] Crear tabla `notification_preferences`
- [ ] Crear funciones SQL (create_notification, should_send_email, etc.)
- [ ] Crear triggers para eventos críticos
- [ ] Configurar Edge Function `send-notification`
- [ ] Configurar Resend API key en variables de entorno
- [ ] Configurar cron job para limpieza (diario 02:00 AM)
- [ ] Implementar hook `useNotifications`
- [ ] Implementar componente `NotificationBell`
- [ ] Integrar NotificationBell en Header
- [ ] Crear página de preferencias
- [ ] Configurar templates de email
- [ ] Probar envío de emails en staging
- [ ] Configurar monitoreo y alertas
- [ ] Documentar tipos de notificaciones
- [ ] Actualizar README con configuración
