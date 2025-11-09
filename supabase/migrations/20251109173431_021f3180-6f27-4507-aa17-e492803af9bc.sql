-- Add explicit deny policies for anonymous users to strengthen security posture
-- This prevents any potential anonymous access and silences linter warnings

-- Deny anonymous access to user_roles table (contains sensitive role assignments)
CREATE POLICY "Deny unauthenticated access to user roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to reservations table (contains user parking reservations)
CREATE POLICY "Deny unauthenticated access to reservations"
ON public.reservations
FOR SELECT
TO anon
USING (false);