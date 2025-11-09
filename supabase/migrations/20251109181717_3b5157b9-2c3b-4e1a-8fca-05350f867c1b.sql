-- Add DELETE policy for admins on license_plates table
CREATE POLICY "Admins can delete license plates" 
ON public.license_plates 
FOR DELETE 
USING (is_admin(auth.uid()));