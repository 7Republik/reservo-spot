-- Add viewed_at column to user_warnings table for tracking when users view their warnings
-- This enables the "mark as viewed" functionality and unviewed count tracking

-- Add viewed_at column
ALTER TABLE public.user_warnings
  ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance on unviewed warnings queries
-- This index is partial (WHERE viewed_at IS NULL) to optimize queries for unviewed warnings
CREATE INDEX idx_user_warnings_viewed_at
  ON public.user_warnings(user_id, viewed_at)
  WHERE viewed_at IS NULL;

-- Add RLS policy to allow users to update viewed_at on their own warnings
-- This policy ensures users can only mark their own warnings as viewed
-- Note: RLS policies cannot enforce column-level restrictions, so we rely on
-- application-level validation to ensure only viewed_at is updated
CREATE POLICY "Users can mark their warnings as viewed"
  ON public.user_warnings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.user_warnings.viewed_at IS 
  'Timestamp when the user viewed this warning. NULL means unviewed.';
