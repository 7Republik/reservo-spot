-- =====================================================
-- FIX: Añadir actions faltantes a waitlist_logs
-- =====================================================
-- El trigger handle_reservation_cancelled usa 'trigger_executed'
-- y 'error_occurred' pero no están en el constraint CHECK
-- =====================================================

-- Eliminar constraint actual
ALTER TABLE public.waitlist_logs
DROP CONSTRAINT IF EXISTS waitlist_logs_action_check;

-- Crear constraint con todos los actions necesarios
ALTER TABLE public.waitlist_logs
ADD CONSTRAINT waitlist_logs_action_check
CHECK (action IN (
  'entry_created',
  'entry_cancelled',
  'offer_created',
  'offer_accepted',
  'offer_rejected',
  'offer_expired',
  'penalty_applied',
  'cleanup_executed',
  'trigger_executed',  -- Usado por triggers
  'error_occurred'     -- Usado para logging de errores
));

COMMENT ON CONSTRAINT waitlist_logs_action_check ON public.waitlist_logs IS 
  'Permite actions estándar del sistema de waitlist más trigger_executed y error_occurred';
