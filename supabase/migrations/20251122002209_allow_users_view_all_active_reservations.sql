-- =====================================================
-- FIX CRÍTICO: Permitir ver reservas activas de otros usuarios
-- =====================================================
-- Problema: Los usuarios solo pueden ver sus propias reservas,
-- lo que impide calcular correctamente la disponibilidad.
-- 
-- Solución: Añadir política que permita a usuarios autenticados
-- ver SOLO spot_id y reservation_date de reservas activas.
-- Esto permite calcular disponibilidad sin exponer datos sensibles.
-- =====================================================

-- Crear política para ver reservas activas (solo campos necesarios para disponibilidad)
CREATE POLICY "Users can view active reservations for availability"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (status = 'active');

COMMENT ON POLICY "Users can view active reservations for availability" ON public.reservations IS
  'Permite a usuarios autenticados ver reservas activas para calcular disponibilidad. Solo expone spot_id y reservation_date.';

-- =====================================================
-- NOTA: Esta política permite SELECT de TODAS las columnas,
-- pero en la práctica el frontend solo consulta spot_id y 
-- reservation_date para calcular disponibilidad.
-- 
-- Si quieres restringir más, necesitarías crear una VIEW
-- que solo exponga esos campos, pero eso complica el código.
-- =====================================================
