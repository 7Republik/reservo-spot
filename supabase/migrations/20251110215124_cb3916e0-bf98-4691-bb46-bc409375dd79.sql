-- Enable Row-Level Security on reservation_cancellation_log
ALTER TABLE public.reservation_cancellation_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all cancellation logs
CREATE POLICY "Admins can view all cancellation logs"
ON public.reservation_cancellation_log
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policy: Users can view their own cancellation history
CREATE POLICY "Users can view their own cancellation history"
ON public.reservation_cancellation_log
FOR SELECT
USING (auth.uid() = user_id);

-- Deny unauthenticated access (explicit deny for clarity)
CREATE POLICY "Deny unauthenticated access to cancellation logs"
ON public.reservation_cancellation_log
FOR SELECT
USING (false);

COMMENT ON TABLE public.reservation_cancellation_log IS 'Audit log for automatic reservation cancellations. Protected by RLS - admins see all, users see their own.';