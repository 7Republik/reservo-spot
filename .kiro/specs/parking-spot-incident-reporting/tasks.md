# Implementation Plan - Parking Spot Incident Reporting

- [x] 1. Database schema and functions setup
  - Create migration to extend `incident_reports` table with new columns (offending_license_plate, offending_user_id, original_spot_id, reassigned_spot_id, reassigned_reservation_id, photo_url, admin_notes, confirmed_by, confirmed_at)
  - Create migration to add `user_warnings` table with RLS policies
  - Create migration to add `is_incident_reserve` boolean column to `parking_groups` table
  - Implement SQL function `find_available_spot_for_incident()` for spot reassignment with priority logic
  - Create indexes for performance (status, license plate, user warnings)
  - Update TypeScript types by running `supabase gen types typescript`
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.4, 9.1, 9.2_

- [x] 2. Storage bucket configuration for incident photos
  - Create `incident-photos` storage bucket in Supabase
  - Configure RLS policies for photo upload and access (users can upload their own, admins can view all)
  - _Requirements: 2.4, 2.7_

- [ ] 3. TypeScript types and interfaces
  - Create `src/types/incidents.ts` with IncidentReport, IncidentReportWithDetails, UserWarning, IncidentReportFormData, and SpotReassignmentResult types
  - Export types from main types index if needed
  - _Requirements: All requirements (foundation)_

- [ ] 4. Utility functions and helpers
  - Create `src/lib/incidentHelpers.ts` with image compression function (target < 500KB)
  - Implement license plate sanitization function (remove special characters, uppercase)
  - Implement photo upload function to Supabase Storage with error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. User incident reporting hook
  - Create `src/hooks/useIncidentReport.ts` with state management for multi-step flow
  - Implement `findUserByLicensePlate()` function to match license plates
  - Implement `findAvailableSpot()` function calling SQL function with priority logic
  - Implement `createIncidentReport()` function with photo upload and database insert
  - Implement `createReassignedReservation()` function for automatic spot assignment
  - Handle all error scenarios (no spots available, photo upload failure, license plate not found)
  - _Requirements: 1.1, 1.2, 1.3, 2.1-2.8, 3.1-3.6, 4.1-4.4_

- [ ] 6. Location verification component
  - Create `src/components/incidents/LocationVerification.tsx` component
  - Display reserved spot details (spot number, group name)
  - Implement confirmation UI with "Yes, I'm at the correct spot" and "No, show directions" buttons
  - Implement cancel button with props callback
  - Style with Tailwind using semantic tokens (bg-card, text-foreground, etc.)
  - Ensure mobile-responsive design
  - _Requirements: 1.3, 1.4, 1.5, 7.1, 7.3_

- [ ] 7. Evidence capture component
  - Create `src/components/incidents/EvidenceCapture.tsx` component
  - Implement camera capture button for mobile devices (using input type="file" accept="image/*" capture="environment")
  - Implement file upload button for desktop/fallback
  - Display photo preview with retake/reselect option
  - Implement license plate input field with validation
  - Validate image file type (JPEG, PNG, HEIC) and size (max 10MB)
  - Display validation errors with toast notifications
  - Style with Tailwind using semantic tokens
  - Ensure mobile-responsive with large touch-friendly buttons
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.5_

- [ ] 8. Spot reassignment display component
  - Create `src/components/incidents/SpotReassignment.tsx` component
  - Display success message with reassigned spot details (spot number, group name)
  - Show mini map with spot highlighted if position data available
  - Display incident reference number
  - Implement "Go to my new spot" button to close flow
  - Handle "no spots available" scenario with appropriate messaging and contact info
  - Style with Tailwind using semantic tokens
  - _Requirements: 3.5, 4.1, 4.2, 4.3, 7.1, 7.3_

- [ ] 9. Incident cancellation dialog
  - Create `src/components/incidents/IncidentCancellation.tsx` component
  - Implement confirmation dialog using shadcn/ui Dialog component
  - Show warning if photo has been uploaded
  - Implement discard logic to clean up uploaded photos if any
  - Style with Tailwind using semantic tokens
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10. Main incident report flow orchestrator
  - Create `src/components/incidents/IncidentReportFlow.tsx` component
  - Implement multi-step state management (verification → evidence → reassignment)
  - Coordinate data accumulation across steps
  - Integrate LocationVerification, EvidenceCapture, and SpotReassignment components
  - Implement step transitions with loading states
  - Handle cancellation at any step with IncidentCancellation dialog
  - Display progress indicators showing current step
  - Integrate with useIncidentReport hook for business logic
  - Handle all error scenarios with appropriate user feedback
  - _Requirements: 1.1-1.5, 2.1-2.8, 3.1-3.6, 7.4, 10.1-10.5_

- [ ] 11. Add incident reporting trigger to user dashboard
  - Modify `src/components/ReservationDetailsModal.tsx` or relevant component to add "Report Issue" button
  - Show button only for active reservations on current date
  - Open IncidentReportFlow component when clicked
  - Pass reservation details (id, spot_id, spot_number, group_name, date) as props
  - Refresh reservation list after incident report completion
  - _Requirements: 1.1, 1.2_

- [ ] 12. Admin incident management hook
  - Create `src/hooks/admin/useIncidentManagement.ts` following existing admin hook patterns
  - Implement caching pattern with useRef (forceReload parameter)
  - Implement `loadIncidents()` function with status filtering and joins for user/spot details
  - Implement `confirmIncident()` function with transaction logic (update status, issue warning, cancel offender reservation)
  - Implement `dismissIncident()` function to update status
  - Implement `addAdminNotes()` function to update notes
  - Implement `issueWarning()` helper function to create user_warnings record
  - Implement `getUserWarningCount()` function to query warning count by user
  - Handle all error scenarios with toast notifications
  - _Requirements: 5.1-5.5, 8.1-8.8, 9.1-9.5_

- [ ] 13. Admin incident list component
  - Create `src/components/admin/incidents/IncidentList.tsx` component
  - Display incidents in table or card layout with key info (reporter, date, status, offending user)
  - Implement status filter dropdown (All, Pending, Confirmed, Dismissed)
  - Implement search by user name or license plate
  - Implement sort by date (newest first)
  - Highlight pending incidents with visual indicator
  - Show warning count badge for offending users
  - Implement row click to open incident details
  - Style with Tailwind using semantic tokens
  - Follow existing admin component patterns
  - _Requirements: 5.5, 8.1, 9.5_

- [ ] 14. Admin incident details component
  - Create `src/components/admin/incidents/IncidentDetails.tsx` component
  - Display all incident information in sections (reporter, original spot, reassigned spot, offending user, timestamps)
  - Display photo evidence with full-size view (use Dialog or modal)
  - Display license plate prominently
  - Implement editable admin notes field with auto-save
  - Show offending user's warning history if applicable
  - Integrate IncidentActions component for confirm/dismiss buttons
  - Style with Tailwind using semantic tokens
  - Follow existing admin component patterns
  - _Requirements: 5.1-5.5, 8.1, 8.8_

- [ ] 15. Admin incident actions component
  - Create `src/components/admin/incidents/IncidentActions.tsx` component
  - Implement "Confirm Incident" button with confirmation dialog
  - Implement "Dismiss Incident" button with reason input
  - Show warning preview before confirming (what will happen: warning issued, reservation cancelled)
  - Disable actions if incident already resolved
  - Integrate with useIncidentManagement hook for confirm/dismiss logic
  - Display success/error feedback with toast notifications
  - Style with Tailwind using semantic tokens
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 16. Integrate incidents section into admin panel
  - Add "Incidents" navigation item to admin panel sidebar
  - Create route for incidents page (e.g., `/admin/incidents`)
  - Render IncidentList component on incidents page
  - Implement modal or side panel for IncidentDetails when incident selected
  - Add pending incidents count badge to navigation item
  - Follow existing admin panel structure and patterns
  - _Requirements: 5.5, 8.1_

- [ ] 17. Add incident reserve toggle to parking groups admin
  - Modify parking groups admin component to add `is_incident_reserve` checkbox
  - Update `useParkingGroups` hook to handle the new field in create/update operations
  - Display visual indicator for incident reserve groups in groups list
  - Add tooltip explaining the purpose of incident reserve groups
  - _Requirements: 6.1, 6.5, 6.6_

- [ ] 18. Testing and validation
  - [ ] 18.1 Test complete user incident flow (report → reassign → confirm)
    - Verify spot reassignment follows priority order (general → incident reserve)
    - Verify photo upload and storage
    - Verify license plate matching
    - Test "no spots available" scenario
    - _Requirements: 1.1-1.5, 2.1-2.8, 3.1-3.6, 4.1-4.4_
  - [ ] 18.2 Test admin incident management
    - Verify incident list filtering and search
    - Verify incident confirmation issues warning and cancels reservation
    - Verify incident dismissal
    - Verify admin notes saving
    - _Requirements: 5.1-5.5, 8.1-8.8, 9.1-9.5_
  - [ ] 18.3 Test mobile responsiveness
    - Verify camera capture works on mobile devices
    - Verify all components are touch-friendly
    - Verify layout adapts to small screens
    - _Requirements: 7.1-7.5_
  - [ ] 18.4 Test error scenarios
    - Test network errors during photo upload
    - Test concurrent incident modifications
    - Test invalid license plate input
    - _Requirements: All error handling requirements_

- [ ] 19. Documentation
  - [ ] 19.1 Add JSDoc comments to all hooks and utility functions
  - [ ] 19.2 Update README with incident reporting feature description
  - [ ] 19.3 Create admin guide for incident management workflow
