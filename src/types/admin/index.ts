/**
 * Admin Panel Types
 * 
 * Central export point for all admin-related types.
 * Organized by domain for better maintainability.
 */

// License Plates Domain
export type {
  LicensePlate,
  PermissionType,
  ExpirationType,
  ApprovalStatus,
  ExtendedLicensePlate,
} from './license-plates.types';

// Users Domain
export type {
  UserWithRole,
  UserStatus,
  UserAction,
  AppRole,
  UserGroupAssignments,
} from './users.types';

// Parking Spots Domain
export type {
  ParkingSpot,
  VisualSize,
  SpotPosition,
  SpotAttributes,
  FloorPlanDimensions,
  SpotButtonSize,
  EditorStats,
  EditorTools,
  GhostPreview,
  DragState,
  CanvasState,
} from './parking-spots.types';

// Parking Groups Domain
export type {
  ParkingGroup,
  GroupStatus,
  DeactivationSchedule,
  ParkingGroupFormData,
} from './parking-groups.types';

// Settings Domain
export type {
  ReservationSettings,
  BlockScope,
  BlockedDate,
  BlockedDateFormData,
} from './settings.types';
