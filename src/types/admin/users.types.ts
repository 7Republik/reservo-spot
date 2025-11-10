/**
 * Users Domain Types
 * 
 * Defines all types related to user management,
 * including roles, status, and associated data (plates, groups).
 */

/**
 * User status indicators
 */
export type UserStatus = 'active' | 'blocked' | 'deactivated';

/**
 * User management actions
 */
export type UserAction = 'block' | 'unblock' | 'deactivate' | 'reactivate' | 'delete';

/**
 * User role from database enum
 */
export type AppRole = 'general' | 'preferred' | 'director' | 'visitor' | 'admin';

/**
 * User entity with roles and associated data
 */
export interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  is_blocked: boolean;
  is_deactivated: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  deactivated_at: string | null;
  user_roles: Array<{ id: string; role: string }>;
  license_plates?: Array<{
    id: string;
    plate_number: string;
    is_approved: boolean;
    rejected_at: string | null;
    rejection_reason: string | null;
    approved_electric: boolean;
    approved_disability: boolean;
    electric_expires_at?: string | null;
    disability_expires_at?: string | null;
  }>;
}

/**
 * User group assignment mapping
 * Key: user_id, Value: array of group_ids
 */
export type UserGroupAssignments = Record<string, string[]>;
