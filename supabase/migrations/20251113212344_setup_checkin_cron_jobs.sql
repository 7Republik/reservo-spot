-- =====================================================
-- Setup pg_cron Jobs for Check-in/Check-out System
-- =====================================================
-- This migration configures scheduled jobs for:
-- 1. Daily reset at midnight (00:00)
-- 2. Infraction detection every 15 minutes
-- 3. Warning generation every hour
-- 4. Block expiration every hour
-- =====================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- Job 1: Daily Reset (00:00)
-- =====================================================
-- Executes at midnight every day to:
-- - Detect checkout infractions from previous day
-- - Update status of finalized check-ins
-- Requirements: 3.1, 3.2, 3.3, 3.4

SELECT cron.schedule(
  'checkin-daily-reset',
  '0 0 * * *',  -- Every day at 00:00
  $$
    -- Detect checkout infractions from previous day
    SELECT public.detect_checkout_infractions();
    
    -- Update check-ins from previous days that are finalized
    -- (not continuous reservations that are still active)
    UPDATE public.reservation_checkins
    SET updated_at = NOW()
    WHERE checkin_at::DATE < CURRENT_DATE
      AND checkout_at IS NULL
      AND NOT (
        is_continuous_reservation = TRUE 
        AND continuous_end_date >= CURRENT_DATE
      );
  $$
);

-- =====================================================
-- Job 2: Infraction Detection (Every 15 minutes)
-- =====================================================
-- Runs every 15 minutes during the day to detect
-- check-in infractions as they occur
-- Requirements: 6.1, 6.2

SELECT cron.schedule(
  'checkin-infraction-detection',
  '*/15 * * * *',  -- Every 15 minutes
  $$
    SELECT public.detect_checkin_infractions();
  $$
);

-- =====================================================
-- Job 3: Warning Generation (Every hour)
-- =====================================================
-- Runs every hour to process accumulated infractions
-- and generate automatic warnings and blocks
-- Requirements: 9.1, 9.2, 9.3

SELECT cron.schedule(
  'checkin-warning-generation',
  '0 * * * *',  -- Every hour at minute 0
  $$
    SELECT public.generate_automatic_warnings();
  $$
);

-- =====================================================
-- Job 4: Block Expiration (Every hour)
-- =====================================================
-- Runs every hour to automatically deactivate
-- expired temporary blocks
-- Requirements: 10.5

SELECT cron.schedule(
  'checkin-block-expiration',
  '0 * * * *',  -- Every hour at minute 0
  $$
    UPDATE public.user_blocks
    SET 
      is_active = FALSE,
      unblocked_at = NOW()
    WHERE is_active = TRUE
      AND blocked_until <= NOW()
      AND block_type IN ('automatic_checkin', 'automatic_checkout');
  $$
);

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify all jobs are scheduled:
-- SELECT * FROM cron.job WHERE jobname LIKE 'checkin-%';

-- =====================================================
-- Cleanup Commands (for rollback or testing)
-- =====================================================
-- To remove all checkin cron jobs:
-- SELECT cron.unschedule('checkin-daily-reset');
-- SELECT cron.unschedule('checkin-infraction-detection');
-- SELECT cron.unschedule('checkin-warning-generation');
-- SELECT cron.unschedule('checkin-block-expiration');
