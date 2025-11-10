/**
 * Parking Groups Domain Types
 * 
 * Defines all types related to parking group management,
 * including configuration, status, and deactivation.
 */

/**
 * Group status
 */
export type GroupStatus = 'active' | 'inactive' | 'deactivated' | 'scheduled';

/**
 * Complete parking group entity
 */
export interface ParkingGroup {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  floor_plan_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  button_size: number;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
  deactivation_reason?: string | null;
  scheduled_deactivation_date?: string | null;
}

/**
 * Deactivation schedule configuration
 */
export interface DeactivationSchedule {
  group_id: string;
  scheduled_date: Date;
  reason?: string;
}

/**
 * Group creation/update data
 */
export interface ParkingGroupFormData {
  name: string;
  description: string | null;
  capacity: number;
  floor_plan_url: string | null;
  is_active: boolean;
}
