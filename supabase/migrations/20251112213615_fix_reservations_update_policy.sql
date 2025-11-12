-- Migration: Fix reservations UPDATE policy to allow cancellation
-- This migration fixes the RLS policy that prevents users from cancelling their own reservations

-- ============================================================================
-- Drop existing UPDATE policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can cancel their own reservations" ON public.reservations;

-- ============================================================================
-- Create new UPDATE policy with proper WITH CHECK clause
-- ============================================================================

-- Policy: Users can update (cancel) their own reservations
CREATE POLICY "Users can cancel their own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON POLICY "Users can cancel their own reservations" ON public.reservations IS 
'Allows authenticated users to update (cancel) their own reservations. Both USING and WITH CHECK ensure the user owns the reservation.';
