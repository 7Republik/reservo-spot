-- =====================================================
-- REVERT MULTI-TENANT CHANGES
-- =====================================================
-- This migration reverts ALL changes made by the multi-tenant system
-- Returns database to single-tenant state (before 2025-11-23)
-- =====================================================

-- =====================================================
-- 1. DROP DEMO REQUESTS TABLE AND RELATED OBJECTS
-- =====================================================

-- Drop trigger first
DROP TRIGGER IF EXISTS on_demo_request_created ON public.demo_requests;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_demo_request_notification();

-- Drop table
DROP TABLE IF EXISTS public.demo_requests CASCADE;

-- =====================================================
-- 2. DROP PLAN PRICING TABLE
-- =====================================================

DROP TABLE IF EXISTS public.plan_pricing CASCADE;

-- =====================================================
-- 3. DROP ORGANIZATIONS TABLE
-- =====================================================

DROP TABLE IF EXISTS public.organizations CASCADE;

-- =====================================================
-- 4. REMOVE organization_id COLUMNS FROM ALL TABLES
-- =====================================================

-- Remove from profiles
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from parking_groups
ALTER TABLE public.parking_groups 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from parking_spots
ALTER TABLE public.parking_spots 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from reservations
ALTER TABLE public.reservations 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from license_plates
ALTER TABLE public.license_plates 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from user_group_assignments
ALTER TABLE public.user_group_assignments 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from blocked_dates
ALTER TABLE public.blocked_dates 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from incident_reports
ALTER TABLE public.incident_reports 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from user_warnings
ALTER TABLE public.user_warnings 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from reservation_checkins
ALTER TABLE public.reservation_checkins 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from checkin_infractions
ALTER TABLE public.checkin_infractions 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from user_blocks
ALTER TABLE public.user_blocks 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from waitlist_entries
ALTER TABLE public.waitlist_entries 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from waitlist_offers
ALTER TABLE public.waitlist_offers 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from waitlist_penalties
ALTER TABLE public.waitlist_penalties 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from notifications
ALTER TABLE public.notifications 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- Remove from notification_preferences
ALTER TABLE public.notification_preferences 
  DROP COLUMN IF EXISTS organization_id CASCADE;

-- =====================================================
-- 5. DROP SUPER ADMIN FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS public.is_super_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_organization_id(UUID);

-- =====================================================
-- 6. RESTORE ORIGINAL RLS POLICIES
-- =====================================================

-- We need to recreate the original policies that were dropped
-- This is a comprehensive restoration of all RLS policies

-- =====================================================
-- 6.1 PROFILES TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anon access" ON public.profiles;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.profiles FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.2 RESERVATIONS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users create own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins update all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users delete own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins delete all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Deny anon access" ON public.reservations;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.reservations FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own reservations"
  ON public.reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all reservations"
  ON public.reservations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users create own reservations"
  ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reservations"
  ON public.reservations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all reservations"
  ON public.reservations FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users delete own reservations"
  ON public.reservations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins delete all reservations"
  ON public.reservations FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- 6.3 PARKING_GROUPS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone view active groups" ON public.parking_groups;
DROP POLICY IF EXISTS "Admins manage groups" ON public.parking_groups;
DROP POLICY IF EXISTS "Deny anon access" ON public.parking_groups;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.parking_groups FOR SELECT TO anon
  USING (false);

CREATE POLICY "Anyone view active groups"
  ON public.parking_groups FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage groups"
  ON public.parking_groups FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.4 PARKING_SPOTS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone view active spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Admins manage spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Deny anon access" ON public.parking_spots;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.parking_spots FOR SELECT TO anon
  USING (false);

CREATE POLICY "Anyone view active spots"
  ON public.parking_spots FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage spots"
  ON public.parking_spots FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.5 LICENSE_PLATES TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins view all plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users create own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users update own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins update all plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users delete own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins delete all plates" ON public.license_plates;
DROP POLICY IF EXISTS "Deny anon access" ON public.license_plates;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.license_plates FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own plates"
  ON public.license_plates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all plates"
  ON public.license_plates FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users create own plates"
  ON public.license_plates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own plates"
  ON public.license_plates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all plates"
  ON public.license_plates FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users delete own plates"
  ON public.license_plates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins delete all plates"
  ON public.license_plates FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- 6.6 NOTIFICATIONS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "System create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins update all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Deny anon access" ON public.notifications;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.notifications FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.7 WAITLIST_ENTRIES TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Admins view all entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Users create own entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "System update entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Admins update all entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Deny anon access" ON public.waitlist_entries;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.waitlist_entries FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own entries"
  ON public.waitlist_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all entries"
  ON public.waitlist_entries FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users create own entries"
  ON public.waitlist_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System update entries"
  ON public.waitlist_entries FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins update all entries"
  ON public.waitlist_entries FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.8 WAITLIST_OFFERS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Admins view all offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "System create offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "System update offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Admins update all offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Deny anon access" ON public.waitlist_offers;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.waitlist_offers FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own offers"
  ON public.waitlist_offers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all offers"
  ON public.waitlist_offers FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System create offers"
  ON public.waitlist_offers FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System update offers"
  ON public.waitlist_offers FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins update all offers"
  ON public.waitlist_offers FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.9 INCIDENT_REPORTS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins view all reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Users create own reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins update all reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Deny anon access" ON public.incident_reports;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.incident_reports FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own reports"
  ON public.incident_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins view all reports"
  ON public.incident_reports FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users create own reports"
  ON public.incident_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins update all reports"
  ON public.incident_reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.10 USER_WARNINGS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins view all warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins create warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Users update own warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins update all warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Deny anon access" ON public.user_warnings;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.user_warnings FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own warnings"
  ON public.user_warnings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all warnings"
  ON public.user_warnings FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins create warnings"
  ON public.user_warnings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users update own warnings"
  ON public.user_warnings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all warnings"
  ON public.user_warnings FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.11 RESERVATION_CHECKINS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Admins view all checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Users create own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Users update own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Admins update all checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Deny anon access" ON public.reservation_checkins;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.reservation_checkins FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own checkins"
  ON public.reservation_checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all checkins"
  ON public.reservation_checkins FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users create own checkins"
  ON public.reservation_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own checkins"
  ON public.reservation_checkins FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all checkins"
  ON public.reservation_checkins FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.12 USER_BLOCKS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Admins view all blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Admins manage blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Deny anon access" ON public.user_blocks;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.user_blocks FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins manage blocks"
  ON public.user_blocks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.13 BLOCKED_DATES TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone view blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins manage blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Deny anon access" ON public.blocked_dates;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.blocked_dates FOR SELECT TO anon
  USING (false);

CREATE POLICY "Anyone view blocked dates"
  ON public.blocked_dates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage blocked dates"
  ON public.blocked_dates FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.14 USER_GROUP_ASSIGNMENTS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Admins view all assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Deny anon access" ON public.user_group_assignments;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.user_group_assignments FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own assignments"
  ON public.user_group_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all assignments"
  ON public.user_group_assignments FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins manage assignments"
  ON public.user_group_assignments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.15 CHECKIN_INFRACTIONS TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Admins view all infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "System create infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Admins manage infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Deny anon access" ON public.checkin_infractions;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.checkin_infractions FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own infractions"
  ON public.checkin_infractions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all infractions"
  ON public.checkin_infractions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System create infractions"
  ON public.checkin_infractions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage infractions"
  ON public.checkin_infractions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.16 WAITLIST_PENALTIES TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Admins view all penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "System manage penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Admins manage penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Deny anon access" ON public.waitlist_penalties;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.waitlist_penalties FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own penalties"
  ON public.waitlist_penalties FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all penalties"
  ON public.waitlist_penalties FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System manage penalties"
  ON public.waitlist_penalties FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins manage penalties"
  ON public.waitlist_penalties FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6.17 NOTIFICATION_PREFERENCES TABLE
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users view own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Admins view all preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users update own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Admins update all preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Deny anon access" ON public.notification_preferences;

-- Recreate original policies
CREATE POLICY "Deny anon access"
  ON public.notification_preferences FOR SELECT TO anon
  USING (false);

CREATE POLICY "Users view own preferences"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all preferences"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users update own preferences"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update all preferences"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

-- Verify that organization_id columns are removed
DO $$
DECLARE
  org_col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'organization_id';
  
  IF org_col_count > 0 THEN
    RAISE EXCEPTION 'Still found % organization_id columns remaining', org_col_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: All organization_id columns removed';
END $$;

-- Verify that multi-tenant tables are dropped
DO $$
DECLARE
  mt_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mt_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('organizations', 'plan_pricing', 'demo_requests');
  
  IF mt_table_count > 0 THEN
    RAISE EXCEPTION 'Still found % multi-tenant tables remaining', mt_table_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: All multi-tenant tables removed';
END $$;

-- =====================================================
-- REVERSION COMPLETE
-- =====================================================
-- Database has been restored to single-tenant state
-- All multi-tenant changes have been reverted
-- =====================================================
