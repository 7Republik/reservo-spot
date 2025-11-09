-- Drop and recreate the insert policy for user_roles to fix the RLS issue
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Create a better insert policy that explicitly checks admin status
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
);