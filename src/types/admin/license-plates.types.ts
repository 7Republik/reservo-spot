/**
 * License Plates Domain Types
 * 
 * Defines all types related to license plate management,
 * including approval status, special permissions, and expiration handling.
 */

/**
 * Main license plate entity with approval status and special permissions
 */
export interface LicensePlate {
  id: string;
  plate_number: string;
  user_id: string;
  is_approved: boolean;
  requested_electric: boolean;
  approved_electric: boolean;
  requested_disability: boolean;
  approved_disability: boolean;
  electric_expires_at?: string | null;
  disability_expires_at?: string | null;
  profiles: {
    email: string;
    full_name: string;
  };
}

/**
 * Permission type for special access (electric charging, disability access)
 */
export type PermissionType = 'electric' | 'disability';

/**
 * Expiration configuration options for permissions
 */
export type ExpirationType = 'none' | 'days' | 'date';

/**
 * Approval status for license plates
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Extended license plate with rejection information
 */
export interface ExtendedLicensePlate extends LicensePlate {
  rejected_at?: string | null;
  rejection_reason?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
}
