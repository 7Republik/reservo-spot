-- =====================================================
-- FIX: Constraint único de waitlist_entries
-- =====================================================
-- El constraint actual impide registrarse de nuevo en la misma
-- fecha/grupo incluso si la entrada anterior fue cancelada o completada.
-- 
-- Solución: Cambiar a un constraint parcial que solo aplique
-- para status 'active' y 'offer_pending'
-- =====================================================

-- 1. Eliminar constraint único actual
ALTER TABLE public.waitlist_entries
DROP CONSTRAINT IF EXISTS unique_user_group_date;

-- 2. Crear índice único parcial (solo para entradas activas)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_group_date
  ON public.waitlist_entries(user_id, group_id, reservation_date)
  WHERE status IN ('active', 'offer_pending');

COMMENT ON INDEX public.unique_active_user_group_date IS 
  'Permite solo una entrada activa por usuario/grupo/fecha. Entradas canceladas o completadas no cuentan.';

-- =====================================================
-- Verificación: Ahora un usuario puede:
-- - Tener múltiples entradas 'cancelled' para el mismo grupo/fecha
-- - Tener múltiples entradas 'completed' para el mismo grupo/fecha
-- - Pero solo UNA entrada 'active' o 'offer_pending' por grupo/fecha
-- =====================================================
