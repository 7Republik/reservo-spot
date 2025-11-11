# RESERVEO - Product Overview

RESERVEO is a corporate parking reservation system that enables employees to book parking spots in advance through an interactive calendar and visual map interface.

## Core Features

- **User Parking Reservations**: Employees can reserve parking spots for specific dates within a configurable advance booking window
- **License Plate Management**: Users register vehicle license plates that require admin approval before use
- **Interactive Spot Selection**: Visual map-based interface for selecting parking spots with real-time availability
- **Multi-Group System**: Parking spots organized into groups (e.g., "Floor -1", "North Zone") with user access control
- **Admin Panel**: Comprehensive management interface for users, groups, spots, license plates, and system configuration
- **Visual Editor**: Drag-and-drop editor for positioning parking spots on floor plan images
- **Blocked Dates**: Admins can block specific dates globally or per group
- **User Status Management**: Block or deactivate users with automatic reservation cancellation
- **Role-Based Access**: 5 role levels (general, visitor, preferred, director, admin) with priority-based spot access

## User Roles

1. **General** (Priority 1) - Standard employee
2. **Visitor** (Priority 2) - Temporary visitor
3. **Preferred** (Priority 3) - Preferred employee
4. **Director** (Priority 4) - Management level
5. **Admin** (Priority 5) - Full system access

## Key Business Rules

- Users must have an approved license plate to make reservations
- Reservations can only be made within the configured advance booking window
- Blocking or deactivating a user automatically cancels all future reservations
- Removing a user from a group cancels their reservations in that group
- Disapproving a license plate cancels all user's future reservations
- Each parking spot can only have one active reservation per date
- Spots can have attributes: accessible (PMR), electric charger, compact size
