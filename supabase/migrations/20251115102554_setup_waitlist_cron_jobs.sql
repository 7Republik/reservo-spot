-- =====================================================
-- SETUP WAITLIST CRON JOBS
-- =====================================================
-- Description: Configura los cron jobs para el sistema de lista de espera
-- - Expiración de ofertas cada 5 minutos
-- - Limpieza de entradas expiradas diariamente a las 00:00
-- - Envío de recordatorios cada 15 minutos (preparado para futuro)
-- =====================================================

-- Habilitar extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- TABLA DE LOGS DE CRON JOBS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.waitlist_cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'error')),
  records_affected INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas por job y fecha
CREATE INDEX IF NOT EXISTS idx_waitlist_cron_logs_job_date 
  ON public.waitlist_cron_logs(job_name, created_at DESC);

-- Índice para consultas por status
CREATE INDEX IF NOT EXISTS idx_waitlist_cron_logs_status 
  ON public.waitlist_cron_logs(execution_status, created_at DESC);

-- RLS: Solo admins pueden ver logs de cron jobs
ALTER TABLE public.waitlist_cron_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view cron logs"
  ON public.waitlist_cron_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- FUNCIÓN WRAPPER PARA EXPIRAR OFERTAS CON LOGGING
-- =====================================================

CREATE OR REPLACE FUNCTION public.cron_expire_waitlist_offers()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_records_affected INTEGER;
  v_error_message TEXT;
BEGIN
  v_start_time := clock_timestamp();
  
  BEGIN
    -- Llamar a la función principal
    SELECT public.expire_waitlist_offers() INTO v_records_affected;
    
    v_end_time := clock_timestamp();
    
    -- Registrar éxito
    INSERT INTO public.waitlist_cron_logs (
      job_name,
      execution_status,
      records_affected,
      execution_time_ms
    ) VALUES (
      'expire_waitlist_offers',
      'success',
      v_records_affected,
      EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER
    );
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    v_end_time := clock_timestamp();
    
    -- Registrar error
    INSERT INTO public.waitlist_cron_logs (
      job_name,
      execution_status,
      records_affected,
      error_message,
      execution_time_ms
    ) VALUES (
      'expire_waitlist_offers',
      'error',
      0,
      v_error_message,
      EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER
    );
    
    -- Re-lanzar el error para que pg_cron lo registre también
    RAISE;
  END;
END;
$$;

-- =====================================================
-- FUNCIÓN WRAPPER PARA LIMPIAR ENTRADAS CON LOGGING
-- =====================================================

CREATE OR REPLACE FUNCTION public.cron_cleanup_expired_waitlist_entries()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_records_affected INTEGER;
  v_error_message TEXT;
BEGIN
  v_start_time := clock_timestamp();
  
  BEGIN
    -- Llamar a la función principal
    SELECT public.cleanup_expired_waitlist_entries() INTO v_records_affected;
    
    v_end_time := clock_timestamp();
    
    -- Registrar éxito
    INSERT INTO public.waitlist_cron_logs (
      job_name,
      execution_status,
      records_affected,
      execution_time_ms
    ) VALUES (
      'cleanup_expired_waitlist_entries',
      'success',
      v_records_affected,
      EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER
    );
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    v_end_time := clock_timestamp();
    
    -- Registrar error
    INSERT INTO public.waitlist_cron_logs (
      job_name,
      execution_status,
      records_affected,
      error_message,
      execution_time_ms
    ) VALUES (
      'cleanup_expired_waitlist_entries',
      'error',
      0,
      v_error_message,
      EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER
    );
    
    -- Re-lanzar el error
    RAISE;
  END;
END;
$$;

-- =====================================================
-- CONFIGURAR CRON JOBS
-- =====================================================

-- IMPORTANTE: Los cron jobs en Supabase se ejecutan en UTC
-- Ajustar horarios según necesidad

-- 1. Expirar ofertas cada 5 minutos
-- Ejecuta: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 de cada hora
SELECT cron.schedule(
  'expire-waitlist-offers',           -- Nombre del job
  '*/5 * * * *',                      -- Cada 5 minutos
  $$SELECT public.cron_expire_waitlist_offers()$$
);

-- 2. Limpiar entradas expiradas diariamente a las 00:00 UTC
SELECT cron.schedule(
  'cleanup-expired-waitlist-entries', -- Nombre del job
  '0 0 * * *',                        -- Diario a las 00:00 UTC
  $$SELECT public.cron_cleanup_expired_waitlist_entries()$$
);

-- 3. Envío de recordatorios cada 15 minutos (PREPARADO PARA FUTURO)
-- NOTA: Esta función aún no está implementada (Task 13)
-- Descomentar cuando se implemente la Edge Function de recordatorios
-- SELECT cron.schedule(
--   'send-waitlist-reminders',
--   '*/15 * * * *',
--   $$SELECT public.cron_send_waitlist_reminders()$$
-- );

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.waitlist_cron_logs IS 
'Logs de ejecución de cron jobs del sistema de lista de espera. Registra éxitos, errores y tiempos de ejecución.';

COMMENT ON FUNCTION public.cron_expire_waitlist_offers() IS 
'Wrapper para expire_waitlist_offers() que añade logging automático. Ejecutado por cron cada 5 minutos.';

COMMENT ON FUNCTION public.cron_cleanup_expired_waitlist_entries() IS 
'Wrapper para cleanup_expired_waitlist_entries() que añade logging automático. Ejecutado por cron diariamente a las 00:00 UTC.';

-- =====================================================
-- VERIFICACIÓN DE CRON JOBS
-- =====================================================

-- Para verificar que los cron jobs están configurados:
-- SELECT * FROM cron.job;

-- Para ver el historial de ejecuciones:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Para ver logs de nuestra aplicación:
-- SELECT * FROM public.waitlist_cron_logs ORDER BY created_at DESC LIMIT 20;

-- Para desactivar un cron job temporalmente:
-- SELECT cron.unschedule('expire-waitlist-offers');

-- Para reactivarlo:
-- SELECT cron.schedule('expire-waitlist-offers', '*/5 * * * *', $$SELECT public.cron_expire_waitlist_offers()$$);
