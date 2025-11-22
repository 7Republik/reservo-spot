-- =====================================================
-- AÑADIR ACTION 'NO_ELIGIBLE_USERS' A WAITLIST_LOGS
-- =====================================================
-- La función process_waitlist_for_spot usa este action
-- cuando no encuentra usuarios elegibles en la lista.
-- =====================================================

-- Eliminar constraint antiguo
ALTER TABLE waitlist_logs 
DROP CONSTRAINT IF EXISTS waitlist_logs_action_check;

-- Crear nuevo constraint con 'no_eligible_users' incluido
ALTER TABLE waitlist_logs
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
  'trigger_executed',
  'error_occurred',
  'no_eligible_users'
));

COMMENT ON CONSTRAINT waitlist_logs_action_check ON waitlist_logs IS 
  'Acciones permitidas en el log de waitlist. no_eligible_users se usa cuando process_waitlist_for_spot no encuentra usuarios válidos.';
