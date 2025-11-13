# Implementation Plan

- [x] 1. Database migration and types setup
  - Create migration file to add `viewed_at` column to `user_warnings` table
  - Add index for performance on `(user_id, viewed_at)` where `viewed_at IS NULL`
  - Create RLS policy to allow users to update `viewed_at` on their own warnings
  - Apply migration to database with `supabase db push`
  - Regenerate TypeScript types with `supabase gen types typescript --linked`
  - _Requirements: 10.2, 10.3, 10.4_

- [x] 2. Create TypeScript type definitions
  - Create `src/types/profile.ts` with interfaces for UserProfile, ProfileUpdateData, UserWarning, UserWarningWithDetails, UserStatistics, and WarningNotification
  - Export all types from the file for use across components
  - _Requirements: 2.3, 4.2, 5.1, 9.1_

- [x] 3. Implement useUserProfile hook
  - Create `src/hooks/useUserProfile.ts` hook
  - Implement `loadProfile` function to fetch user profile from Supabase
  - Implement `updateProfile` function with validation and error handling
  - Add loading and error states
  - Include toast notifications for success/error feedback
  - _Requirements: 2.3, 3.1, 3.3, 3.4, 3.5_

- [x] 4. Implement useUserWarnings hook with realtime
  - Create `src/hooks/useUserWarnings.ts` hook
  - Implement `loadWarnings` function with filter support (all/viewed/unviewed)
  - Implement `markAllAsViewed` function to update `viewed_at` column
  - Add Supabase realtime subscription for new warnings
  - Implement toast notification when new warning is received
  - Include unviewed count calculation
  - _Requirements: 1.5, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4, 10.3, 10.4_

- [x] 5. Implement useUserStats hook
  - Create `src/hooks/useUserStats.ts` hook
  - Implement parallel queries for all statistics (reservations, license plates, warnings, member since)
  - Use `Promise.all` for optimal performance
  - Add loading and error states
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Create AlertBadge component
  - Create `src/components/dashboard/AlertBadge.tsx` component
  - Display badge with unviewed warnings count
  - Add pulse animation for new alerts
  - Hide badge when count is 0
  - Implement click handler to navigate to warnings section
  - Add ARIA labels for accessibility
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.3_

- [x] 7. Create WarningCounter component
  - Create `src/components/profile/WarningCounter.tsx` component
  - Implement color coding logic (green for 0, yellow for 1-2, red for 3+)
  - Add appropriate icons for each state
  - Support different sizes (sm, md, lg)
  - Ensure readability in light and dark mode
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.5_

- [x] 8. Create WarningCard component
  - Create `src/components/profile/WarningCard.tsx` component
  - Display warning details (date, reason, notes, issuer)
  - Implement visual distinction for viewed/unviewed (border color, badge)
  - Add expand/collapse functionality for incident details
  - Include link to incident details
  - Add ARIA labels and semantic HTML
  - _Requirements: 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 10.5_

- [x] 9. Create WarningsList component
  - Create `src/components/profile/WarningsList.tsx` component
  - Implement list rendering with WarningCard components
  - Add filter dropdown (All/Viewed/Unviewed)
  - Implement pagination (10 items per page)
  - Add empty state with positive message
  - Implement loading skeleton
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. Create ProfileEditor component
  - Create `src/components/profile/ProfileEditor.tsx` component
  - Implement form with React Hook Form and Zod validation
  - Add fields for full_name (editable) and phone (editable)
  - Display email as readonly
  - Implement inline validation errors
  - Add loading state during save
  - Show success/error toast notifications
  - Add dirty state detection for unsaved changes warning
  - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Create UserStats component
  - Create `src/components/profile/UserStats.tsx` component
  - Display stat cards in responsive grid (2 cols mobile, 3-4 desktop)
  - Show: total reservations, active reservations, last reservation, license plates, warnings, member since
  - Add appropriate icons for each stat
  - Implement loading skeleton
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Create ProfilePage component
  - Create `src/pages/Profile.tsx` page component
  - Implement tabs structure (Personal Data, Warnings, Statistics)
  - Add header with user name and WarningCounter
  - Integrate ProfileEditor, WarningsList, and UserStats components
  - Handle tab navigation via query parameters
  - Add breadcrumb navigation
  - Ensure responsive layout (stack on mobile, side-by-side on desktop)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2_

- [x] 13. Update Dashboard header with AlertBadge
  - Modify dashboard header component to include AlertBadge
  - Add user avatar dropdown menu
  - Include "Mi Perfil" menu item
  - Include "Amonestaciones" menu item with badge
  - Integrate useUserWarnings hook for unviewed count
  - Add navigation handlers
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x] 14. Add routing for Profile page
  - Add `/profile` route to React Router configuration
  - Support query parameters for tab selection (?tab=personal|warnings|stats)
  - Add redirect from `/profile` to `/profile?tab=personal`
  - Update navigation links throughout the app
  - _Requirements: 2.1, 2.2_

- [x] 15. Implement responsive design and accessibility
  - Apply Tailwind responsive classes to all components
  - Test on mobile (320px+), tablet (768px+), and desktop (1024px+)
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works correctly
  - Test color contrast ratios (minimum 4.5:1)
  - Verify focus indicators are visible
  - Test with screen reader
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 16. Write unit tests for components
  - Write tests for ProfileEditor validation logic
  - Write tests for WarningCard display and expand/collapse
  - Write tests for WarningCounter color coding
  - Write tests for AlertBadge visibility and count display
  - _Requirements: All_

- [ ]* 17. Write integration tests for user flows
  - Test profile edit and save flow
  - Test warnings list viewing and marking as viewed
  - Test realtime notification flow
  - Test navigation between profile sections
  - _Requirements: All_
