/**
 * Settings Domain Types
 * 
 * Defines all types related to system settings,
 * including reservation configuration and blocked dates.
 */

/**
 * Reservation system settings
 */
export interface ReservationSettings {
  advance_reservation_days: number;
  daily_refresh_hour: number;
}

/**
 * Block scope: global or group-specific
 */
export type BlockScope = 'global' | 'group';

/**
 * Blocked date entity
 */
export interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string;
  group_id: string | null;
  created_by?: string;
  parking_groups?: {
    name: string;
  };
}

/**
 * Blocked date form data
 */
export interface BlockedDateFormData {
  date: Date;
  reason: string;
  group_id: string | null;
}
