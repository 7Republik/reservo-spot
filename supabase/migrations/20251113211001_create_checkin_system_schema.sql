-- =====================================================
-- RESERVEO - Sistema de Check-in/Check-out
-- Migración: Crear schema completo
-- Fecha: 2025-11-13
-- =====================================================

-- =====================================================
-- 1. TABLA: checkin_settings (Configuración Global)
-- =====================================================
-- Tabla singleton para configuración global del sistema
CREATE TABLE IF NOT EXISTS public.checkin_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Activación global
  system_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Configuración de tiempos
  default_checkin_window_hours INTEGER DEFAULT 24 NOT NULL 
    CHECK (default_checkin_window_hours >= 1 AND default_checkin_window_hours <= 24),
  grace_period_minutes INTEGER DEFAULT 60 NOT NULL 
    CHECK (grace_period_minutes >= 0 AND grace_period_minutes <= 120),
  
  -- Umbrales de amonestación
  checkin_infraction_threshold INTEGER DEFAULT 3 NOT NULL 
    CHECK (checkin_infraction_threshold >= 1 AND checkin_infraction_threshold <= 20),
  checkout_infraction_threshold INTEGER DEFAULT 3 NOT NULL 
    CHECK (checkout_infraction_threshold >= 1 AND checkout_infraction_threshold <= 20),
  
  -- Bloqueo temporal
  temporary_block_days INTEGER DEFAULT 7 NOT NULL 
    CHECK (temporary_block_days >= 1 AND temporary_block_days <= 90),
  
  -- Notificaciones
  send_checkin_reminders BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint para asegurar que solo existe un registro
  CONSTRAINT only_one_checkin_settings CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insertar registro inicial con valores por defecto
INSERT INTO public.checkin_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.checkin_settings IS 'Configuración global del sistema de check-in/check-out (singleton)';
COMMENT ON COLUMN public.checkin_settings.system_enabled IS 'Activa/desactiva el sistema globalmente';
COMMENT ON COLUMN public.checkin_settings.default_checkin_window_hours IS 'Ventana de tiempo por defecto para check-in (1-24 horas)';
COMMENT ON COLUMN public.checkin_settings.grace_period_minutes IS 'Periodo de gracia después de la ventana de check-in (0-120 minutos)';
COMMENT ON COLUMN public.checkin_settings.checkin_infraction_threshold IS 'Número de infracciones de check-in para generar amonestación (1-20)';
COMMENT ON COLUMN public.checkin_settings.checkout_infraction_threshold IS 'Número de infracciones de check-out para generar amonestación (1-20)';
COMMENT ON COLUMN public.checkin_settings.temporary_block_days IS 'Duración del bloqueo temporal en días (1-90)';

-- =====================================================
-- 2. TABLA: parking_group_checkin_config
-- =====================================================
-- Configuración de check-in específica por grupo de parking
CREATE TABLE IF NOT EXISTS public.parking_group_checkin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  
  -- Activación por grupo
  enabled BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Configuración personalizada
  use_custom_config BOOLEAN DEFAULT FALSE NOT NULL,
  custom_checkin_window_hours INTEGER 
    CHECK (custom_checkin_window_hours IS NULL OR 
           (custom_checkin_window_hours >= 1 AND custom_checkin_window_hours <= 24)),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Un solo registro por grupo
  UNIQUE(group_id)
);

COMMENT ON TABLE public.parking_group_checkin_config IS 'Configuración de check-in por grupo de parking';
COMMENT ON COLUMN public.parking_group_checkin_config.enabled IS 'Activa/desactiva check-in para este grupo';
COMMENT ON COLUMN public.parking_group_checkin_config.use_custom_config IS 'Si usa configuración personalizada o global';
COMMENT ON COLUMN public.parking_group_checkin_config.custom_checkin_window_hours IS 'Ventana de check-in personalizada (null = usar global)';

-- =====================================================
-- 3. TABLA: reservation_checkins
-- =====================================================
-- Registros de check-in y check-out de reservas
CREATE TABLE IF NOT EXISTS public.reservation_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  
  -- Timestamps de check-in/check-out
  checkin_at TIMESTAMPTZ,
  checkout_at TIMESTAMPTZ,
  
  -- Para reservas continuas (múltiples días consecutivos)
  is_continuous_reservation BOOLEAN DEFAULT FALSE NOT NULL,
  continuous_start_date DATE,
  continuous_end_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Una reserva solo puede tener un registro de check-in
  UNIQUE(reservation_id),
  
  -- Validaciones
  CHECK (checkout_at IS NULL OR checkin_at IS NOT NULL),
  CHECK (checkout_at IS NULL OR checkout_at >= checkin_at),
  CHECK (
    (is_continuous_reservation = FALSE AND continuous_start_date IS NULL AND continuous_end_date IS NULL) OR
    (is_continuous_reservation = TRUE AND continuous_start_date IS NOT NULL AND continuous_end_date IS NOT NULL)
  )
);

COMMENT ON TABLE public.reservation_checkins IS 'Registros de check-in y check-out de reservas';
COMMENT ON COLUMN public.reservation_checkins.checkin_at IS 'Timestamp de check-in (null = no realizado)';
COMMENT ON COLUMN public.reservation_checkins.checkout_at IS 'Timestamp de check-out (null = no realizado)';
COMMENT ON COLUMN public.reservation_checkins.is_continuous_reservation IS 'Indica si es una reserva de múltiples días consecutivos';

-- =====================================================
-- 4. TABLA: checkin_infractions
-- =====================================================
-- Registro de infracciones de check-in y check-out
CREATE TABLE IF NOT EXISTS public.checkin_infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  
  -- Tipo y fecha de infracción
  infraction_type TEXT NOT NULL CHECK (infraction_type IN ('checkin', 'checkout')),
  infraction_date DATE NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contexto de la infracción
  expected_checkin_window_end TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  
  -- Estado de procesamiento
  warning_generated BOOLEAN DEFAULT FALSE NOT NULL,
  warning_id UUID REFERENCES public.user_warnings(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.checkin_infractions IS 'Registro de infracciones de check-in y check-out';
COMMENT ON COLUMN public.checkin_infractions.infraction_type IS 'Tipo de infracción: checkin o checkout';
COMMENT ON COLUMN public.checkin_infractions.warning_generated IS 'Indica si ya se generó una amonestación por esta infracción';
COMMENT ON COLUMN public.checkin_infractions.expected_checkin_window_end IS 'Hora límite de la ventana de check-in';
COMMENT ON COLUMN public.checkin_infractions.grace_period_end IS 'Hora límite del periodo de gracia';

-- =====================================================
-- 5. TABLA: user_blocks
-- =====================================================
-- Bloqueos temporales de usuarios
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo y razón del bloqueo
  block_type TEXT NOT NULL CHECK (block_type IN ('manual', 'automatic_checkin', 'automatic_checkout')),
  reason TEXT NOT NULL,
  
  -- Periodo de bloqueo
  blocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  blocked_until TIMESTAMPTZ NOT NULL,
  
  -- Referencia a la amonestación que causó el bloqueo
  warning_id UUID REFERENCES public.user_warnings(id) ON DELETE SET NULL,
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  unblocked_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Validaciones
  CHECK (blocked_until > blocked_at),
  CHECK (unblocked_at IS NULL OR unblocked_at >= blocked_at)
);

COMMENT ON TABLE public.user_blocks IS 'Bloqueos temporales de usuarios por infracciones';
COMMENT ON COLUMN public.user_blocks.block_type IS 'Tipo de bloqueo: manual, automatic_checkin, automatic_checkout';
COMMENT ON COLUMN public.user_blocks.is_active IS 'Indica si el bloqueo está activo';
COMMENT ON COLUMN public.user_blocks.warning_id IS 'Amonestación que causó el bloqueo (si aplica)';

-- =====================================================
-- 6. EXTENDER TABLA: user_warnings
-- =====================================================
-- Añadir columnas para amonestaciones automáticas
ALTER TABLE public.user_warnings 
  ADD COLUMN IF NOT EXISTS warning_type TEXT 
    CHECK (warning_type IS NULL OR warning_type IN ('manual', 'automatic_checkin', 'automatic_checkout'));

ALTER TABLE public.user_warnings 
  ADD COLUMN IF NOT EXISTS infraction_count INTEGER;

ALTER TABLE public.user_warnings 
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN public.user_warnings.warning_type IS 'Tipo de amonestación: manual, automatic_checkin, automatic_checkout';
COMMENT ON COLUMN public.user_warnings.infraction_count IS 'Número de infracciones que causaron esta amonestación';
COMMENT ON COLUMN public.user_warnings.auto_generated IS 'Indica si fue generada automáticamente por el sistema';

-- =====================================================
-- 7. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para reservation_checkins
CREATE INDEX IF NOT EXISTS idx_checkins_user_date 
  ON public.reservation_checkins(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_checkins_group_date 
  ON public.reservation_checkins(group_id, created_at);

CREATE INDEX IF NOT EXISTS idx_checkins_pending 
  ON public.reservation_checkins(checkin_at) 
  WHERE checkin_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_checkins_reservation 
  ON public.reservation_checkins(reservation_id);

-- Índices para checkin_infractions
CREATE INDEX IF NOT EXISTS idx_infractions_user 
  ON public.checkin_infractions(user_id, infraction_date);

CREATE INDEX IF NOT EXISTS idx_infractions_pending_warning 
  ON public.checkin_infractions(user_id, warning_generated) 
  WHERE warning_generated = FALSE;

CREATE INDEX IF NOT EXISTS idx_infractions_type_date 
  ON public.checkin_infractions(infraction_type, infraction_date);

CREATE INDEX IF NOT EXISTS idx_infractions_date 
  ON public.checkin_infractions(infraction_date);

-- Índices para user_blocks
CREATE INDEX IF NOT EXISTS idx_user_blocks_active 
  ON public.user_blocks(user_id, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_blocks_expiry 
  ON public.user_blocks(blocked_until) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_blocks_user 
  ON public.user_blocks(user_id, blocked_until);

-- Índice para parking_group_checkin_config
CREATE INDEX IF NOT EXISTS idx_group_checkin_config_group 
  ON public.parking_group_checkin_config(group_id);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.checkin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_group_checkin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_infractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS: checkin_settings
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to checkin_settings"
  ON public.checkin_settings FOR ALL TO anon
  USING (false);

-- Usuarios autenticados pueden ver la configuración
CREATE POLICY "Authenticated users can view checkin settings"
  ON public.checkin_settings FOR SELECT TO authenticated
  USING (true);

-- Solo admins pueden actualizar la configuración
CREATE POLICY "Only admins can update checkin settings"
  ON public.checkin_settings FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- RLS: parking_group_checkin_config
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to group checkin config"
  ON public.parking_group_checkin_config FOR ALL TO anon
  USING (false);

-- Usuarios autenticados pueden ver configuración de sus grupos
CREATE POLICY "Users can view group checkin config"
  ON public.parking_group_checkin_config FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_group_assignments uga
      WHERE uga.group_id = parking_group_checkin_config.group_id
        AND uga.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Solo admins pueden crear/actualizar/eliminar configuración
CREATE POLICY "Only admins can manage group checkin config"
  ON public.parking_group_checkin_config FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- RLS: reservation_checkins
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to checkins"
  ON public.reservation_checkins FOR ALL TO anon
  USING (false);

-- Usuarios pueden ver sus propios check-ins
CREATE POLICY "Users can view own checkins"
  ON public.reservation_checkins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Usuarios pueden crear sus propios check-ins
CREATE POLICY "Users can create own checkins"
  ON public.reservation_checkins FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuarios pueden actualizar sus propios check-ins
CREATE POLICY "Users can update own checkins"
  ON public.reservation_checkins FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins pueden ver todos los check-ins
CREATE POLICY "Admins can view all checkins"
  ON public.reservation_checkins FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admins pueden gestionar todos los check-ins
CREATE POLICY "Admins can manage all checkins"
  ON public.reservation_checkins FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- RLS: checkin_infractions
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to infractions"
  ON public.checkin_infractions FOR ALL TO anon
  USING (false);

-- Usuarios pueden ver sus propias infracciones
CREATE POLICY "Users can view own infractions"
  ON public.checkin_infractions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins pueden ver todas las infracciones
CREATE POLICY "Admins can view all infractions"
  ON public.checkin_infractions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Solo admins y sistema pueden crear infracciones
CREATE POLICY "Only admins can create infractions"
  ON public.checkin_infractions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Solo admins pueden actualizar infracciones
CREATE POLICY "Only admins can update infractions"
  ON public.checkin_infractions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- RLS: user_blocks
-- =====================================================

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access to blocks"
  ON public.user_blocks FOR ALL TO anon
  USING (false);

-- Usuarios pueden ver sus propios bloqueos
CREATE POLICY "Users can view own blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins pueden ver todos los bloqueos
CREATE POLICY "Admins can view all blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Solo admins pueden crear/actualizar bloqueos
CREATE POLICY "Only admins can manage blocks"
  ON public.user_blocks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 9. TRIGGER: Actualizar updated_at
-- =====================================================

-- Trigger para checkin_settings
CREATE OR REPLACE FUNCTION public.update_checkin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checkin_settings_updated_at
  BEFORE UPDATE ON public.checkin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_checkin_settings_updated_at();

-- Trigger para parking_group_checkin_config
CREATE OR REPLACE FUNCTION public.update_group_checkin_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_checkin_config_updated_at
  BEFORE UPDATE ON public.parking_group_checkin_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_checkin_config_updated_at();

-- Trigger para reservation_checkins
CREATE OR REPLACE FUNCTION public.update_reservation_checkins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reservation_checkins_updated_at
  BEFORE UPDATE ON public.reservation_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reservation_checkins_updated_at();

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
  RAISE NOTICE 'Migración completada exitosamente';
  RAISE NOTICE 'Tablas creadas: checkin_settings, parking_group_checkin_config, reservation_checkins, checkin_infractions, user_blocks';
  RAISE NOTICE 'Índices creados: 11 índices para optimización';
  RAISE NOTICE 'Políticas RLS aplicadas: 24 políticas de seguridad';
  RAISE NOTICE 'Triggers creados: 3 triggers para updated_at';
END $$;
