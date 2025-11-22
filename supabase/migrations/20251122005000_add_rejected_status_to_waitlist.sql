-- =====================================================
-- AÑADIR STATUS 'REJECTED' A WAITLIST_ENTRIES
-- =====================================================
-- Permite que las entradas de waitlist puedan marcarse
-- como 'rejected' cuando el usuario rechaza una oferta.
-- =====================================================

-- Eliminar constraint antiguo
ALTER TABLE waitlist_entries 
DROP CONSTRAINT IF EXISTS waitlist_entries_status_check;

-- Crear nuevo constraint con 'rejected' incluido
ALTER TABLE waitlist_entries
ADD CONSTRAINT waitlist_entries_status_check 
CHECK (status IN ('active', 'offer_pending', 'completed', 'cancelled', 'rejected'));

COMMENT ON CONSTRAINT waitlist_entries_status_check ON waitlist_entries IS 
  'Valores permitidos: active (en espera), offer_pending (oferta enviada), completed (oferta aceptada), cancelled (cancelado por usuario), rejected (oferta rechazada - usuario sale de la lista)';
