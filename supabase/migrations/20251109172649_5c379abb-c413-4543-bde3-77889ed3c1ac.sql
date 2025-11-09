-- Add explicit deny policies for unauthenticated access to protect PII and sensitive data

-- Deny unauthenticated access to profiles table (contains emails and phone numbers)
CREATE POLICY "Deny unauthenticated access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny unauthenticated access to incident_reports table (contains security incident information)
CREATE POLICY "Deny unauthenticated access to incident reports"
ON public.incident_reports
FOR SELECT
TO anon
USING (false);

-- Deny unauthenticated access to license_plates table (contains vehicle registration data)
CREATE POLICY "Deny unauthenticated access to license plates"
ON public.license_plates
FOR SELECT
TO anon
USING (false);