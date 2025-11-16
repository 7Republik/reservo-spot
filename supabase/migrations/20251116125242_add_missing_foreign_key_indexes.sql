-- Add Missing Foreign Key Indexes for Performance
-- Issue: 22 foreign keys without covering indexes
-- Severity: INFO (Performance optimization)
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

-- Strategy: Only add indexes for foreign keys that are frequently queried
-- We skip audit fields (created_by, approved_by, etc.) that are rarely used in WHERE clauses

-- ============================================================================
-- HIGH PRIORITY: Frequently queried foreign keys
-- ============================================================================

-- incident_reports: reservation_id (used in incident flow)
CREATE INDEX IF NOT EXISTS idx_incident_reports_reservation_id 
ON public.incident_reports(reservation_id);

-- incident_reports: reassigned_spot_id (used in incident reassignment)
CREATE INDEX IF NOT EXISTS idx_incident_reports_reassigned_spot_id 
ON public.incident_reports(reassigned_spot_id);

-- incident_reports: original_spot_id (used in incident queries)
CREATE INDEX IF NOT EXISTS idx_incident_reports_original_spot_id 
ON public.incident_reports(original_spot_id);

-- reservation_checkins: spot_id (used in check-in statistics)
CREATE INDEX IF NOT EXISTS idx_reservation_checkins_spot_id 
ON public.reservation_checkins(spot_id);

-- waitlist_offers: spot_id (used in waitlist processing)
CREATE INDEX IF NOT EXISTS idx_waitlist_offers_spot_id 
ON public.waitlist_offers(spot_id);

-- ============================================================================
-- MEDIUM PRIORITY: Moderately queried foreign keys
-- ============================================================================

-- checkin_infractions: reservation_id (used in infraction detection)
CREATE INDEX IF NOT EXISTS idx_checkin_infractions_reservation_id 
ON public.checkin_infractions(reservation_id);

-- checkin_infractions: spot_id (used in infraction queries)
CREATE INDEX IF NOT EXISTS idx_checkin_infractions_spot_id 
ON public.checkin_infractions(spot_id);

-- checkin_infractions: group_id (used in group statistics)
CREATE INDEX IF NOT EXISTS idx_checkin_infractions_group_id 
ON public.checkin_infractions(group_id);

-- waitlist_logs: entry_id (used in audit queries)
CREATE INDEX IF NOT EXISTS idx_waitlist_logs_entry_id 
ON public.waitlist_logs(entry_id);

-- waitlist_logs: offer_id (used in audit queries)
CREATE INDEX IF NOT EXISTS idx_waitlist_logs_offer_id 
ON public.waitlist_logs(offer_id);

-- blocked_dates: group_id (used in date validation)
CREATE INDEX IF NOT EXISTS idx_blocked_dates_group_id 
ON public.blocked_dates(group_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_incident_reports_reservation_id IS 
'Improves performance when querying incidents by reservation';

COMMENT ON INDEX idx_incident_reports_reassigned_spot_id IS 
'Improves performance when querying reassigned spots in incidents';

COMMENT ON INDEX idx_incident_reports_original_spot_id IS 
'Improves performance when querying original spots in incidents';

COMMENT ON INDEX idx_reservation_checkins_spot_id IS 
'Improves performance for check-in statistics by spot';

COMMENT ON INDEX idx_waitlist_offers_spot_id IS 
'Improves performance when processing waitlist by spot';

COMMENT ON INDEX idx_checkin_infractions_reservation_id IS 
'Improves performance when detecting infractions by reservation';

COMMENT ON INDEX idx_checkin_infractions_spot_id IS 
'Improves performance when querying infractions by spot';

COMMENT ON INDEX idx_checkin_infractions_group_id IS 
'Improves performance for group-level infraction statistics';

COMMENT ON INDEX idx_waitlist_logs_entry_id IS 
'Improves performance for waitlist audit queries by entry';

COMMENT ON INDEX idx_waitlist_logs_offer_id IS 
'Improves performance for waitlist audit queries by offer';

COMMENT ON INDEX idx_blocked_dates_group_id IS 
'Improves performance when validating blocked dates by group';

-- ============================================================================
-- SKIPPED INDEXES (Audit fields - rarely queried)
-- ============================================================================

-- The following foreign keys were intentionally NOT indexed because they are
-- only used for audit purposes and rarely appear in WHERE clauses:
--
-- - blocked_dates.created_by
-- - profiles.blocked_by
-- - profiles.deactivated_by
-- - license_plates.approved_by
-- - parking_groups.deactivated_by
-- - incident_reports.confirmed_by
-- - incident_reports.reassigned_reservation_id (rarely queried directly)
-- - user_warnings.issued_by
-- - user_blocks.warning_id
-- - checkin_infractions.warning_id
--
-- These can be added later if query patterns change.
