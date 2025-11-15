-- =====================================================
-- SISTEMA DE LISTA DE ESPERA - SCHEMA COMPLETO
-- =====================================================
-- Migración que crea todas las tablas, índices y políticas RLS
-- para el sistema de lista de espera de RESERVEO
-- =====================================================

-- =====================================================
-- 1. EXTENDER TABLA reservation_settings
-- =====================================================
-- Añadir campos de configuración de lista de espera

ALTER TABLE public.reservation_settings
ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waitlist_acceptance_time_minutes INTEGER NOT NULL DEFAULT 120 
  CHECK (waitlist_acceptance_time_minutes >= 30 AND waitlist_acceptance_time_minutes <= 1440),
ADD COLUMN IF NOT EXISTS waitlist_max_simultaneous INTEGER NOT NULL DEFAULT 5
  CHECK (waitlist_max_simultaneous >= 1 AND waitlist_max_simultaneous <= 10),
ADD COLUMN IF NOT EXISTS waitlist_priority_by_role BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waitlist_penalty_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waitlist_penalty_threshold INTEGER NOT NULL DEFAULT 3
  CHECK (waitlist_penalty_threshold >= 2 AND waitlist_penalty_threshold <= 10),
ADD COLUMN IF NOT EXISTS waitlist_penalty_duration_days INTEGER NOT NULL DEFAULT 7
  CHECK (waitlist_penalty_duration_days >= 1 AND waitlist_penalty_duration_days <= 30);

COMMENT ON COLUMN public.reservation_settings.waitlist_enabled IS 'Habilitar/deshabilitar sistema de lista de espera globalmente';
COMMENT ON COLUMN public.reservation_settings.waitlist_acceptance_time_minutes IS 'Tiempo en minutos para aceptar una oferta (30-1440)';
COMMENT ON COLUMN public.reservation_settings.waitlist_max_simultaneous IS 'Máximo de listas de espera simultáneas por usuario (1-10)';
COMMENT ON COLUMN public.reservation_settings.waitlist_priority_by_role IS 'Usar prioridad de roles en la cola de espera';
COMMENT ON COLUMN public.reservation_settings.waitlist_penalty_enabled IS 'Habilitar sistema de penalización por no responder';
COMMENT ON COLUMN public.reservation_settings.waitlist_penalty_threshold IS 'Umbral de no respuestas para bloqueo temporal (2-10)';
COMMENT ON COLUMN public.reservation_settings.waitlist_penalty_duration_days IS 'Duración del bloqueo temporal en días (1-30)';

-- =====================================================
-- 2. TABLA waitlist_entries
-- =====================================================
-- Almacena las entradas de usuarios en listas de espera

CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'offer_pending', 'completed', 'cancelled')),
  position INTEGER, -- Calculado dinámicamente, puede ser NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un usuario solo puede estar una vez en lista de espera por grupo/fecha
  CONSTRAINT unique_user_group_date UNIQUE(user_id, group_id, reservation_date)
);

COMMENT ON TABLE public.waitlist_entries IS 'Entradas de usuarios en listas de espera para plazas de parking';
COMMENT ON COLUMN public.waitlist_entries.status IS 'Estado: active (en espera), offer_pending (tiene oferta), completed (aceptó), cancelled (cancelada)';
COMMENT ON COLUMN public.waitlist_entries.position IS 'Posición en la cola (calculada dinámicamente)';

-- Índices para optimización de queries
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_group_date 
  ON public.waitlist_entries(group_id, reservation_date, status, created_at);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user 
  ON public.waitlist_entries(user_id, status);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_active_queue
  ON public.waitlist_entries(group_id, reservation_date, created_at)
  WHERE status = 'active';

-- =====================================================
-- 3. TABLA waitlist_offers
-- =====================================================
-- Almacena ofertas de reserva enviadas a usuarios

CREATE TABLE IF NOT EXISTS public.waitlist_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.waitlist_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ
);

COMMENT ON TABLE public.waitlist_offers IS 'Ofertas de plazas enviadas a usuarios en lista de espera';
COMMENT ON COLUMN public.waitlist_offers.status IS 'Estado: pending (esperando), accepted (aceptada), rejected (rechazada), expired (expirada)';
COMMENT ON COLUMN public.waitlist_offers.expires_at IS 'Timestamp de expiración de la oferta';
COMMENT ON COLUMN public.waitlist_offers.responded_at IS 'Timestamp de respuesta del usuario';

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_waitlist_offers_user_status 
  ON public.waitlist_offers(user_id, status);

CREATE INDEX IF NOT EXISTS idx_waitlist_offers_expires 
  ON public.waitlist_offers(expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_waitlist_offers_entry
  ON public.waitlist_offers(entry_id);

-- =====================================================
-- 4. TABLA waitlist_logs
-- =====================================================
-- Auditoría de todas las operaciones de lista de espera

CREATE TABLE IF NOT EXISTS public.waitlist_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES public.waitlist_entries(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.waitlist_offers(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'entry_created', 'entry_cancelled', 'offer_created', 
    'offer_accepted', 'offer_rejected', 'offer_expired',
    'penalty_applied', 'cleanup_executed'
  )),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.waitlist_logs IS 'Registro de auditoría de todas las operaciones del sistema de lista de espera';
COMMENT ON COLUMN public.waitlist_logs.action IS 'Tipo de acción registrada';
COMMENT ON COLUMN public.waitlist_logs.details IS 'Información adicional en formato JSON';

-- Índices para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_waitlist_logs_user 
  ON public.waitlist_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waitlist_logs_action 
  ON public.waitlist_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waitlist_logs_created
  ON public.waitlist_logs(created_at DESC);

-- =====================================================
-- 5. TABLA waitlist_penalties
-- =====================================================
-- Almacena penalizaciones de usuarios por no responder ofertas

CREATE TABLE IF NOT EXISTS public.waitlist_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rejection_count INTEGER NOT NULL DEFAULT 0,
  no_response_count INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_penalty UNIQUE(user_id)
);

COMMENT ON TABLE public.waitlist_penalties IS 'Penalizaciones de usuarios por rechazos y no respuestas a ofertas';
COMMENT ON COLUMN public.waitlist_penalties.rejection_count IS 'Número de rechazos en el período actual';
COMMENT ON COLUMN public.waitlist_penalties.no_response_count IS 'Número de no respuestas en el período actual';
COMMENT ON COLUMN public.waitlist_penalties.is_blocked IS 'Si el usuario está bloqueado temporalmente';
COMMENT ON COLUMN public.waitlist_penalties.blocked_until IS 'Timestamp hasta cuando está bloqueado';
COMMENT ON COLUMN public.waitlist_penalties.last_reset_at IS 'Última vez que se resetearon los contadores';

-- Índice para búsquedas de usuarios bloqueados
CREATE INDEX IF NOT EXISTS idx_waitlist_penalties_blocked 
  ON public.waitlist_penalties(user_id)
  WHERE is_blocked = TRUE;

-- =====================================================
-- 6. TABLA notifications
-- =====================================================
-- Sistema de notificaciones in-app

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'waitlist_offer', 'waitlist_reminder', 'waitlist_expired',
    'waitlist_accepted', 'waitlist_penalty'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Datos adicionales (offer_id, enlaces, etc.)
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

COMMENT ON TABLE public.notifications IS 'Notificaciones in-app para usuarios';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación';
COMMENT ON COLUMN public.notifications.data IS 'Datos adicionales en formato JSON (offer_id, enlaces, etc.)';
COMMENT ON COLUMN public.notifications.is_read IS 'Si la notificación fue leída';

-- Índice para búsquedas de notificaciones no leídas
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7.1 POLÍTICAS RLS: waitlist_entries
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to waitlist_entries"
  ON public.waitlist_entries FOR ALL TO anon
  USING (false);

-- Usuarios ven solo sus entradas
CREATE POLICY "Users view own waitlist entries"
  ON public.waitlist_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins ven todas las entradas
CREATE POLICY "Admins view all waitlist entries"
  ON public.waitlist_entries FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Usuarios crean sus propias entradas
CREATE POLICY "Users create own waitlist entries"
  ON public.waitlist_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuarios actualizan sus propias entradas (cancelar)
CREATE POLICY "Users update own waitlist entries"
  ON public.waitlist_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins pueden modificar cualquier entrada
CREATE POLICY "Admins modify all waitlist entries"
  ON public.waitlist_entries FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 7.2 POLÍTICAS RLS: waitlist_offers
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to waitlist_offers"
  ON public.waitlist_offers FOR ALL TO anon
  USING (false);

-- Usuarios ven solo sus ofertas
CREATE POLICY "Users view own waitlist offers"
  ON public.waitlist_offers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins ven todas las ofertas
CREATE POLICY "Admins view all waitlist offers"
  ON public.waitlist_offers FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Solo funciones SECURITY DEFINER pueden crear ofertas
-- Los usuarios NO pueden crear ofertas directamente
CREATE POLICY "Only functions create waitlist offers"
  ON public.waitlist_offers FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Usuarios pueden actualizar sus ofertas (aceptar/rechazar)
CREATE POLICY "Users update own waitlist offers"
  ON public.waitlist_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins pueden modificar cualquier oferta
CREATE POLICY "Admins modify all waitlist offers"
  ON public.waitlist_offers FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 7.3 POLÍTICAS RLS: waitlist_logs
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to waitlist_logs"
  ON public.waitlist_logs FOR ALL TO anon
  USING (false);

-- Usuarios ven solo sus logs
CREATE POLICY "Users view own waitlist logs"
  ON public.waitlist_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins ven todos los logs
CREATE POLICY "Admins view all waitlist logs"
  ON public.waitlist_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Solo funciones pueden insertar logs
CREATE POLICY "Only functions create waitlist logs"
  ON public.waitlist_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- =====================================================
-- 7.4 POLÍTICAS RLS: waitlist_penalties
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to waitlist_penalties"
  ON public.waitlist_penalties FOR ALL TO anon
  USING (false);

-- Usuarios ven solo sus penalizaciones
CREATE POLICY "Users view own waitlist penalties"
  ON public.waitlist_penalties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins ven todas las penalizaciones
CREATE POLICY "Admins view all waitlist penalties"
  ON public.waitlist_penalties FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Solo funciones pueden modificar penalizaciones
CREATE POLICY "Only functions modify waitlist penalties"
  ON public.waitlist_penalties FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- =====================================================
-- 7.5 POLÍTICAS RLS: notifications
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to notifications"
  ON public.notifications FOR ALL TO anon
  USING (false);

-- Usuarios ven solo sus notificaciones
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins ven todas las notificaciones
CREATE POLICY "Admins view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Solo funciones pueden crear notificaciones
CREATE POLICY "Only functions create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Usuarios pueden marcar sus notificaciones como leídas
CREATE POLICY "Users mark own notifications as read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_read = true);

-- Admins pueden modificar cualquier notificación
CREATE POLICY "Admins modify all notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para actualizar updated_at en waitlist_entries
CREATE OR REPLACE FUNCTION public.update_waitlist_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waitlist_entries_updated_at
  BEFORE UPDATE ON public.waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_waitlist_entries_updated_at();

-- Trigger para actualizar updated_at en waitlist_penalties
CREATE OR REPLACE FUNCTION public.update_waitlist_penalties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waitlist_penalties_updated_at
  BEFORE UPDATE ON public.waitlist_penalties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_waitlist_penalties_updated_at();

-- =====================================================
-- 9. COMENTARIOS FINALES
-- =====================================================

COMMENT ON SCHEMA public IS 'Schema público con sistema de lista de espera implementado';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
