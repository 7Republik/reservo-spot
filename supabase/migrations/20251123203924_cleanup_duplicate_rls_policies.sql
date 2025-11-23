-- =====================================================
-- CLEANUP DUPLICATE RLS POLICIES
-- =====================================================
-- Remove all duplicate and old policies, keep only clean set
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE - Clean all policies and recreate
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anon access" ON public.profiles;
DROP POLICY IF EXISTS "Deny unauthenticated access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "deny_anon_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

-- Recreate clean policies
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
-- 2. RESERVATIONS TABLE - Clean all policies and recreate
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins delete all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins update all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Deny anon access" ON public.reservations;
DROP POLICY IF EXISTS "Users create own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users delete own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "auth_users_active" ON public.reservations;
DROP POLICY IF EXISTS "auth_users_delete" ON public.reservations;
DROP POLICY IF EXISTS "auth_users_insert" ON public.reservations;
DROP POLICY IF EXISTS "auth_users_own" ON public.reservations;
DROP POLICY IF EXISTS "auth_users_update" ON public.reservations;
DROP POLICY IF EXISTS "deny_anon" ON public.reservations;

-- Recreate clean policies
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
-- 3. PARKING_GROUPS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone view active groups" ON public.parking_groups;
DROP POLICY IF EXISTS "Admins manage groups" ON public.parking_groups;
DROP POLICY IF EXISTS "Deny anon access" ON public.parking_groups;
DROP POLICY IF EXISTS "Authenticated users can view active groups" ON public.parking_groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.parking_groups;
DROP POLICY IF EXISTS "deny_anon_parking_groups" ON public.parking_groups;

-- Recreate clean policies
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
-- 4. PARKING_SPOTS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone view active spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Admins manage spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Deny anon access" ON public.parking_spots;
DROP POLICY IF EXISTS "Authenticated users can view active spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Admins can manage spots" ON public.parking_spots;
DROP POLICY IF EXISTS "deny_anon_parking_spots" ON public.parking_spots;

-- Recreate clean policies
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
-- 5. LICENSE_PLATES TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins view all plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users create own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users update own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins update all plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users delete own plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins delete all plates" ON public.license_plates;
DROP POLICY IF EXISTS "Deny anon access" ON public.license_plates;
DROP POLICY IF EXISTS "Users can view their own license plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins can view all license plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users can create their own license plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users can update their own license plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins can update all license plates" ON public.license_plates;
DROP POLICY IF EXISTS "Users can delete their own license plates" ON public.license_plates;
DROP POLICY IF EXISTS "Admins can delete all license plates" ON public.license_plates;
DROP POLICY IF EXISTS "deny_anon_license_plates" ON public.license_plates;
DROP POLICY IF EXISTS "users_view_own_plates" ON public.license_plates;

-- Recreate clean policies
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
-- 6. NOTIFICATIONS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "System create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins update all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Deny anon access" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON public.notifications;
DROP POLICY IF EXISTS "deny_anon_notifications" ON public.notifications;

-- Recreate clean policies
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
-- 7. WAITLIST_ENTRIES TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Admins view all entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Users create own entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "System update entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Admins update all entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Deny anon access" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "System can update entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "Admins can update all entries" ON public.waitlist_entries;
DROP POLICY IF EXISTS "deny_anon_waitlist_entries" ON public.waitlist_entries;

-- Recreate clean policies
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
-- 8. WAITLIST_OFFERS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Admins view all offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "System create offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "System update offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Admins update all offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Deny anon access" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Users can view their own offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Admins can view all offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "System can create offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "System can update offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "Admins can update all offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "deny_anon_waitlist_offers" ON public.waitlist_offers;
DROP POLICY IF EXISTS "users_view_own_offers" ON public.waitlist_offers;

-- Recreate clean policies
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
-- 9. INCIDENT_REPORTS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins view all reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Users create own reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins update all reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Deny anon access" ON public.incident_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON public.incident_reports;
DROP POLICY IF EXISTS "deny_anon_incident_reports" ON public.incident_reports;

-- Recreate clean policies
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
-- 10. USER_WARNINGS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins view all warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins create warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Users update own warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins update all warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Deny anon access" ON public.user_warnings;
DROP POLICY IF EXISTS "Users can view their own warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins can view all warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins can create warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Users can update their own warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "Admins can update all warnings" ON public.user_warnings;
DROP POLICY IF EXISTS "deny_anon_user_warnings" ON public.user_warnings;

-- Recreate clean policies
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
-- 11. RESERVATION_CHECKINS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Admins view all checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Users create own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Users update own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Admins update all checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Deny anon access" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Users can view their own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Admins can view all checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Users can create their own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Users can update their own checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "Admins can update all checkins" ON public.reservation_checkins;
DROP POLICY IF EXISTS "deny_anon_reservation_checkins" ON public.reservation_checkins;

-- Recreate clean policies
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
-- 12. USER_BLOCKS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Admins view all blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Admins manage blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Deny anon access" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Admins can view all blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Admins can manage blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "deny_anon_user_blocks" ON public.user_blocks;

-- Recreate clean policies
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
-- 13. BLOCKED_DATES TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone view blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins manage blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Deny anon access" ON public.blocked_dates;
DROP POLICY IF EXISTS "Authenticated users can view blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "deny_anon_blocked_dates" ON public.blocked_dates;

-- Recreate clean policies
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
-- 14. USER_GROUP_ASSIGNMENTS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Admins view all assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Deny anon access" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.user_group_assignments;
DROP POLICY IF EXISTS "deny_anon_user_group_assignments" ON public.user_group_assignments;

-- Recreate clean policies
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
-- 15. CHECKIN_INFRACTIONS TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Admins view all infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "System create infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Admins manage infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Deny anon access" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Users can view their own infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Admins can view all infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "System can create infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "Admins can manage infractions" ON public.checkin_infractions;
DROP POLICY IF EXISTS "deny_anon_checkin_infractions" ON public.checkin_infractions;

-- Recreate clean policies
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
-- 16. WAITLIST_PENALTIES TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Admins view all penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "System manage penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Admins manage penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Deny anon access" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Users can view their own penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Admins can view all penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "System can manage penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "Admins can manage penalties" ON public.waitlist_penalties;
DROP POLICY IF EXISTS "deny_anon_waitlist_penalties" ON public.waitlist_penalties;

-- Recreate clean policies
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
-- 17. NOTIFICATION_PREFERENCES TABLE - Clean all policies
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users view own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Admins view all preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users update own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Admins update all preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Deny anon access" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Admins can view all preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Admins can update all preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "deny_anon_notification_preferences" ON public.notification_preferences;

-- Recreate clean policies
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
-- VERIFICATION
-- =====================================================

-- Count policies per table to verify cleanup
DO $$
DECLARE
  policy_counts TEXT;
BEGIN
  SELECT string_agg(tablename || ': ' || count::text, ', ' ORDER BY tablename)
  INTO policy_counts
  FROM (
    SELECT tablename, COUNT(*) as count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) t;
  
  RAISE NOTICE 'Policy counts per table: %', policy_counts;
END $$;

-- =====================================================
-- CLEANUP COMPLETE
-- =====================================================
