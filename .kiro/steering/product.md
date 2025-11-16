# RESERVEO - Product Overview

RESERVEO is a corporate parking reservation system that enables employees to book parking spots in advance through an interactive calendar and visual map interface.
Siempre hablame en español.

## Core Features

### Reservation System
- **User Parking Reservations**: Employees can reserve parking spots for specific dates within a configurable advance booking window
- **License Plate Management**: Users register vehicle license plates that require admin approval before use
- **Interactive Spot Selection**: Visual map-based interface for selecting parking spots with real-time availability
- **Multi-Group System**: Parking spots organized into groups (e.g., "Floor -1", "North Zone") with user access control
- **Blocked Dates**: Admins can block specific dates globally or per group
- **Role-Based Access**: 5 role levels (general, visitor, preferred, director, admin) with priority-based spot access

### Check-in/Check-out System ✅ IMPLEMENTED
- **Physical Presence Validation**: Users must check-in when arriving and check-out when leaving
- **Configurable Windows**: Admins set check-in window (default: 2 hours before) and grace period (default: 30 minutes)
- **Automatic Infraction Detection**: System detects missing check-ins and check-outs
- **Automatic Warnings**: Warnings generated when infraction threshold reached
- **Temporary Blocks**: Users blocked temporarily after accumulating warnings
- **Early Checkout**: Spots released immediately when user checks out early
- **Notifications**: Automatic reminders to check-in
- **Reporting**: Real-time dashboards with statistics and compliance metrics
- **Per-Group Configuration**: Each parking group can have custom check-in settings

### Waitlist System ✅ IMPLEMENTED
- **Automatic Registration**: Users can join waitlist when no spots available
- **Multiple Groups**: Register in multiple parking groups simultaneously
- **Priority Processing**: Optional priority by user role
- **Automatic Offers**: System creates offers when spots become available
- **Time-Limited Offers**: Users have limited time to accept (configurable, default: 60 minutes)
- **Penalty System**: Track rejections and no-responses, block users after threshold
- **Position Tracking**: Users see their position in queue
- **Notifications**: Real-time alerts for new offers and reminders
- **Admin Dashboard**: Statistics, active lists, configuration, and audit logs
- **Automatic Cleanup**: Old entries and invalid users removed automatically

### Incident Reporting System ✅ IMPLEMENTED
- **User Flow**: Verify location → Capture photo → Enter license plate → Get reassigned spot
- **Photo Evidence**: Camera capture on mobile, file upload on desktop, automatic compression
- **Smart Reassignment**: Automatic search for alternative spot with priority logic
- **Admin Management**: Review, confirm, or dismiss incidents with full details
- **Automatic Warnings**: Confirmed incidents issue warnings to offenders
- **Incident Reserve Groups**: Special groups designated for incident reassignments
- **License Plate Matching**: Automatic identification of offending user

### User Profile and Warnings ✅ IMPLEMENTED
- **Profile Management**: Edit personal information (name, phone)
- **Statistics Dashboard**: View reservation history, license plates, warnings, membership
- **Warning System**: Complete history of warnings with details
- **Real-time Notifications**: Badge in header for new warnings
- **Active Blocks**: View temporary blocks with expiration dates
- **Warning Counter**: Visual indicator with color coding (green/yellow/red)

### Offline Mode Support ✅ IMPLEMENTED
- **Connection Monitoring**: Automatic detection of online/offline status
- **Local Cache**: IndexedDB storage for critical data (7-day TTL)
- **Read-Only Offline**: View reservations, spots, and groups from cache
- **Write Protection**: All modification operations disabled when offline
- **Visual Indicators**: Clear banner showing connection status
- **Automatic Sync**: Data synchronized when connection restored
- **Smart Reconnection**: Exponential backoff with debounce to avoid flapping

### Visual Enhancements ✅ IMPLEMENTED
- **Dashboard Redesign**: Glassmorphism effects, animated gradients, smooth transitions
- **Visual Editor Improvements**: 
  - Color-coded spots by attributes (accessible, charger, compact)
  - Slider for button size control (12-64px)
  - Hand tool for navigation
  - Canvas lock for zoom control
  - Ghost preview when creating spots
  - Drag & drop to move spots
  - Statistics panel with progress bar
  - Legend panel with color explanations
  - Mobile restriction with friendly message
  - Contextual help system
- **Responsive Design**: Mobile-first approach with optimizations
- **Performance**: Lazy loading, connection-aware effects, reduced motion support
- **Dark Mode**: Complete support with adapted gradients and colors

### Admin Panel
- **User Management**: Block, deactivate, or delete users with automatic reservation cancellation
- **Group Management**: Create and configure parking groups with special attributes
- **Spot Management**: Manage individual spots with attributes (accessible, charger, compact)
- **Visual Editor**: Professional drag-and-drop editor for positioning spots on floor plans
- **License Plate Approval**: Review and approve/reject license plate registration requests
- **Incident Management**: Review, confirm, or dismiss incident reports with full details
- **Check-in Management**: Global and per-group configuration, real-time reports, statistics
- **Waitlist Management**: Configuration, statistics, active lists, audit logs
- **System Configuration**: Global settings for reservations and system behavior

## User Roles

1. **General** (Priority 1) - Standard employee
2. **Visitor** (Priority 2) - Temporary visitor
3. **Preferred** (Priority 3) - Preferred employee
4. **Director** (Priority 4) - Management level
5. **Admin** (Priority 5) - Full system access

## Key Business Rules

### Reservations
- Users must have an approved license plate to make reservations
- Reservations can only be made within the configured advance booking window
- Blocking or deactivating a user automatically cancels all future reservations
- Removing a user from a group cancels their reservations in that group
- Disapproving a license plate cancels all user's future reservations
- Each parking spot can only have one active reservation per date
- Spots can have attributes: accessible (PMR), electric charger, compact size
- Users with active blocks (check-in or waitlist) cannot create new reservations

### Check-in/Check-out
- Check-in must be done within the configured window (default: 2 hours before start)
- Grace period applies after window expires (default: 30 minutes)
- Infractions detected automatically after grace period
- Warnings generated automatically when threshold reached (configurable)
- Warnings create temporary blocks (duration configurable)
- All future reservations cancelled during block period
- Early check-out releases spot immediately for same-day use
- Each parking group can override global check-in settings

### Waitlist
- Users can register when no spots available
- Maximum simultaneous lists configurable (default: 3)
- Offers have time limit for acceptance (default: 60 minutes)
- Processing order: priority by role (optional) + timestamp
- Rejections and expirations count toward penalty
- Penalty threshold triggers temporary block (configurable)
- Accepting offer removes user from all active lists
- Cancelled reservations trigger automatic waitlist processing

### Incidents and Warnings
- Confirmed incidents issue warnings to offenders
- Offender's reservation cancelled automatically
- Warnings permanently recorded in user history
- Unviewed warnings shown with badge in header
- Active blocks displayed in user profile with expiration
- Incident reserve groups used as last resort for reassignments
