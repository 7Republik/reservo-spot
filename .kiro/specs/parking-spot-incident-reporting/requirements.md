# Requirements Document

## Introduction

This feature enables users to report incidents when they arrive at their reserved parking spot and find it occupied by another vehicle. The system will guide users through a verification process, collect photographic evidence, automatically reassign an available spot, and log the incident for administrative review. The spot reassignment follows a priority order: first available spots from general groups, then spots from groups designated for incident reserves.

## Glossary

- **Incident Reporting System**: The subsystem that handles the creation, validation, and storage of parking spot occupation incidents
- **Reserved Spot**: A parking spot that has been assigned to a user through an active reservation
- **Occupied Spot**: A parking spot that is physically occupied by a vehicle when the user arrives
- **Incident Reserve Group**: A parking group with a special attribute indicating its spots are reserved for incident reassignments
- **Available Spot**: A parking spot without an active reservation for the current date
- **Photographic Evidence**: An image captured or uploaded by the user showing the occupied parking spot
- **Offending License Plate**: The license plate number of the vehicle incorrectly occupying the reserved spot
- **Offending User**: The user who owns the vehicle that incorrectly occupied another user's reserved spot
- **Affected User**: The user whose reserved spot was occupied and who reported the incident
- **Automatic Reassignment**: The process of assigning a new parking spot to a user when their reserved spot is occupied
- **Warning**: A disciplinary record issued to a user for parking violations
- **Incident Resolution**: The administrative process of validating an incident, issuing warnings, and swapping reservations
- **User**: An authenticated employee with an active reservation
- **Admin**: A user with administrative privileges who can review and resolve incidents

## Requirements

### Requirement 1

**User Story:** As a user, I want to report an incident when my reserved parking spot is occupied, so that I can get an alternative spot and document the problem

#### Acceptance Criteria

1. WHEN a user has an active reservation for the current date, THE Incident Reporting System SHALL provide an option to report an occupied spot
2. WHEN a user initiates an incident report, THE Incident Reporting System SHALL display the user's reserved spot details including spot number and location
3. WHEN a user confirms they want to report an incident, THE Incident Reporting System SHALL prompt the user to verify they are at the correct location and spot
4. IF the user confirms the location is correct, THEN THE Incident Reporting System SHALL proceed to the evidence collection step
5. IF the user indicates the location is incorrect, THEN THE Incident Reporting System SHALL cancel the incident report and display navigation guidance to the correct spot

### Requirement 2

**User Story:** As a user, I want to provide photographic evidence and the license plate of the vehicle occupying my spot, so that administrators can identify and take action against the offending user

#### Acceptance Criteria

1. WHEN the user reaches the evidence collection step, THE Incident Reporting System SHALL provide options to capture a photo or upload an image from the device
2. WHEN the user captures or selects a photo, THE Incident Reporting System SHALL display a preview of the image
3. THE Incident Reporting System SHALL allow the user to retake or reselect the photo before submission
4. WHEN the user confirms the photo, THE Incident Reporting System SHALL prompt the user to enter the license plate number of the occupying vehicle
5. THE Incident Reporting System SHALL validate that the license plate format matches registered license plates in the system
6. WHEN the user submits the license plate, THE Incident Reporting System SHALL attempt to identify the Offending User by matching the license plate
7. WHEN the user confirms both photo and license plate, THE Incident Reporting System SHALL upload the image to secure storage
8. THE Incident Reporting System SHALL validate that the uploaded file is an image format with a maximum size of 10 megabytes

### Requirement 3

**User Story:** As a user, I want to be automatically assigned an alternative parking spot immediately when I report an incident, so that I can park my vehicle without waiting for administrative approval

#### Acceptance Criteria

1. WHEN an incident report is submitted, THE Incident Reporting System SHALL immediately search for available spots following the priority order
2. THE Incident Reporting System SHALL first search for available spots in general parking groups where the user has access
3. IF no spots are available in general groups, THEN THE Incident Reporting System SHALL search for available spots in Incident Reserve Groups where the user has access as a last resort
4. WHEN an available spot is found, THE Incident Reporting System SHALL automatically create a new reservation for the Affected User with the reassigned spot
5. THE Incident Reporting System SHALL display the reassigned spot details including spot number, location, and navigation information
6. THE Incident Reporting System SHALL complete the reassignment without requiring administrative approval

### Requirement 4

**User Story:** As a user, I want to receive clear feedback if no alternative spots are available, so that I understand my options

#### Acceptance Criteria

1. IF no available spots are found in any accessible group, THEN THE Incident Reporting System SHALL display a message indicating no spots are available
2. WHEN no spots are available, THE Incident Reporting System SHALL still record the incident with status indicating no reassignment was possible
3. THE Incident Reporting System SHALL provide contact information for administrative assistance when no spots are available
4. THE Incident Reporting System SHALL log the failed reassignment attempt for administrative review

### Requirement 5

**User Story:** As an administrator, I want all incident reports to be logged with complete details including the offending license plate, so that I can review and take appropriate action

#### Acceptance Criteria

1. WHEN an incident is reported, THE Incident Reporting System SHALL create a record containing the Affected User identifier, original reservation identifier, original spot identifier, timestamp, photographic evidence reference, and Offending License Plate
2. THE Incident Reporting System SHALL record the Offending User identifier when the license plate is successfully matched to a registered user
3. THE Incident Reporting System SHALL record the reassigned spot identifier when automatic reassignment occurs
4. THE Incident Reporting System SHALL record the incident status as pending resolution
5. THE Incident Reporting System SHALL store the photographic evidence with a reference link in the incident record
6. THE Incident Reporting System SHALL make incident records accessible to administrators through the admin panel with filtering by status

### Requirement 6

**User Story:** As an administrator, I want to designate specific parking groups for incident reserves, so that there is a fallback option when all general spots are occupied

#### Acceptance Criteria

1. THE Incident Reporting System SHALL support a boolean attribute on parking groups indicating incident reserve status
2. WHEN an administrator enables the incident reserve attribute on a group, THE Incident Reporting System SHALL reserve that group's spots as a last resort for incident reassignments
3. THE Incident Reporting System SHALL use spots from general groups as the first option during automatic reassignment
4. THE Incident Reporting System SHALL use spots from incident reserve groups only when all general groups have no available spots
5. THE Incident Reporting System SHALL allow administrators to toggle the incident reserve attribute through the admin panel
6. THE Incident Reporting System SHALL respect user group access permissions when assigning spots from incident reserve groups

### Requirement 7

**User Story:** As a user, I want the incident reporting process to be mobile-friendly, so that I can easily report incidents from the parking area

#### Acceptance Criteria

1. THE Incident Reporting System SHALL provide a responsive interface that adapts to mobile device screen sizes
2. WHEN accessed on a mobile device with a camera, THE Incident Reporting System SHALL enable direct camera capture for photographic evidence
3. THE Incident Reporting System SHALL provide large touch-friendly buttons for all user actions
4. THE Incident Reporting System SHALL display clear progress indicators showing the current step in the reporting process
5. THE Incident Reporting System SHALL minimize text input requirements to reduce friction on mobile devices

### Requirement 8

**User Story:** As an administrator, I want to review incident reports and take disciplinary action against offending users, so that I can enforce parking rules and deter future violations

#### Acceptance Criteria

1. WHEN an administrator reviews a pending incident, THE Incident Reporting System SHALL display all incident details including Affected User, Offending User, photographic evidence, license plate information, and automatic reassignment details
2. THE Incident Reporting System SHALL provide options to confirm or dismiss the incident
3. WHEN an administrator confirms an incident, THE Incident Reporting System SHALL issue a Warning to the Offending User
4. WHEN an administrator confirms an incident, THE Incident Reporting System SHALL cancel the Offending User's reservation for the affected date
5. WHEN an administrator confirms an incident, THE Incident Reporting System SHALL update the incident status to confirmed
6. WHEN an administrator dismisses an incident, THE Incident Reporting System SHALL update the incident status to dismissed and maintain all existing reservations
7. THE Incident Reporting System SHALL send a notification to the Offending User when an incident is confirmed with warning details
8. THE Incident Reporting System SHALL allow administrators to add notes to incident records for future reference

### Requirement 9

**User Story:** As an administrator, I want to track warnings issued to users, so that I can identify repeat offenders and take escalated action

#### Acceptance Criteria

1. THE Incident Reporting System SHALL maintain a warning count for each user
2. WHEN a Warning is issued, THE Incident Reporting System SHALL increment the user's warning count
3. THE Incident Reporting System SHALL record the warning details including incident reference, date, and reason
4. THE Incident Reporting System SHALL display the warning history in the user's profile in the admin panel
5. THE Incident Reporting System SHALL highlight users with multiple warnings in the admin user management interface

### Requirement 10

**User Story:** As a user, I want to cancel an incident report before submission, so that I can abort if I made a mistake

#### Acceptance Criteria

1. THE Incident Reporting System SHALL provide a cancel option at each step of the incident reporting process
2. WHEN the user cancels an incident report, THE Incident Reporting System SHALL discard all collected information including uploaded photos
3. WHEN the user cancels, THE Incident Reporting System SHALL return the user to the main dashboard or calendar view
4. THE Incident Reporting System SHALL display a confirmation dialog before canceling if photographic evidence has been uploaded
5. THE Incident Reporting System SHALL not create any incident record when a report is canceled
