-- =====================================================
-- MIGRATION: Sistema de Notificaciones
-- Descripción: Implementa sistema completo de notificaciones
--              in-app y por email, preparado para multi-tenancy
-- Fecha: 2025-11-16
-- =====================================================

-- =====================================================
-- 1. TABLA: organizations
-- Propósito: Preparar sistema para multi-tenancy
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar organización por defecto para single-tenant actual
INSERT INTO organizations (id, name, slug) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default'
)
ON CONFLICT (id) DO NOTHING;

-- RLS para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own organization" ON organizations;
CREATE POLICY "Users view own organization"
ON organizations FOR SELECT TO authenticated
USING (
  -- Por ahora todos ven la organización por defecto
  -- Cuando se implemente multi-tenant, se actualizará esta policy
  id = '00000000-0000-0000-0000-000000000001'::UUID
);

DROP POLICY IF EXISTS "Deny anon access to organizations" ON organizations;
CREATE POLICY "Deny anon access to organizations"
ON organizations FOR ALL TO anon
USING (false);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_organizations_updated_at ON organizations;
CREATE TRIGGER set_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABLA: notifications (ACTUALIZAR EXISTENTE)
-- Propósito: Añadir campos faltantes a tabla existente
-- =====================================================

-- Añadir columnas nuevas si no existen
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL REFERENCES organizations(id) 
  DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'system' 
  CHECK (category IN ('reservation', 'waitlist', 'warning', 'incident', 'system'));

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS reference_id UUID;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Índice compuesto para queries optimizados
DROP INDEX IF EXISTS idx_notifications_user_unread_priority;
CREATE INDEX idx_notifications_user_unread_priority 
ON notifications(organization_id, user_id, is_read, priority DESC, created_at DESC);

-- Prevenir duplicados de notificaciones no leídas
DROP INDEX IF EXISTS idx_notifications_unique;
CREATE UNIQUE INDEX idx_notifications_unique 
ON notifications(organization_id, user_id, type, reference_id) 
WHERE is_read = false AND reference_id IS NOT NULL;

-- Índice para limpieza de notificaciones antiguas
DROP INDEX IF EXISTS idx_notifications_cleanup;
CREATE INDEX idx_notifications_cleanup 
ON notifications(created_at) 
WHERE is_read = true;

-- Índice para búsqueda por referencia
DROP INDEX IF EXISTS idx_notifications_reference;
CREATE INDEX idx_notifications_reference 
ON notifications(reference_id) 
WHERE reference_id IS NOT NULL;

-- Actualizar RLS policies
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  -- Por ahora todos usan organización por defecto
  AND organization_id = '00000000-0000-0000-0000-000000000001'::UUID
);

DROP POLICY IF EXISTS "Users mark own notifications as read" ON notifications;
CREATE POLICY "Users mark own notifications as read"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND is_read = true
);

DROP POLICY IF EXISTS "Only functions create notifications" ON notifications;
CREATE POLICY "Only functions create notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (false);

-- =====================================================
-- 3. TABLA: notification_preferences
-- Propósito: Preferencias de usuario para emails (GDPR)
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
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

-- RLS para notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny anon access to notification preferences" ON notification_preferences;
CREATE POLICY "Deny anon access to notification preferences"
ON notification_preferences FOR ALL TO anon
USING (false);

DROP POLICY IF EXISTS "Users manage own preferences" ON notification_preferences;
CREATE POLICY "Users manage own preferences"
ON notification_preferences FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all preferences" ON notification_preferences;
CREATE POLICY "Admins view all preferences"
ON notification_preferences FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER set_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE organizations IS 'Organizaciones/tenants del sistema. Por ahora solo existe organización por defecto.';
COMMENT ON TABLE notifications IS 'Notificaciones in-app para usuarios. Incluye tracking de emails enviados.';
COMMENT ON TABLE notification_preferences IS 'Preferencias de usuario para notificaciones por email (GDPR compliant).';

COMMENT ON COLUMN notifications.organization_id IS 'Multi-tenant ready. Usa organización por defecto hasta migración.';
COMMENT ON COLUMN notifications.priority IS 'Determina urgencia visual y si usa real-time subscription.';
COMMENT ON COLUMN notifications.category IS 'Agrupa notificaciones por dominio funcional.';
COMMENT ON COLUMN notifications.reference_id IS 'ID del objeto relacionado (reserva, oferta, warning, etc.)';
COMMENT ON COLUMN notifications.action_url IS 'URL para navegación directa desde notificación.';
COMMENT ON COLUMN notifications.data IS 'Datos adicionales en formato JSON para templates de email.';
