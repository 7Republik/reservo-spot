// Profile types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  is_blocked: boolean;
  is_deactivated: boolean;
  checkin_reminders_enabled: boolean;
}

export interface ProfileUpdateData {
  full_name: string;
  phone: string;
}

// Warning types
export interface UserWarning {
  id: string;
  user_id: string;
  incident_id: string;
  issued_by: string;
  issued_at: string;
  reason: string;
  notes: string | null;
  viewed_at: string | null;
  created_at: string;
}

export interface UserWarningWithDetails extends UserWarning {
  issuer_name: string;
  incident_details: {
    id: string;
    description: string;
    spot_number: string;
    photo_url: string | null;
    created_at: string;
    status: string;
  };
}

// Statistics types
export interface UserStatistics {
  total_reservations: number;
  active_reservations: number;
  last_reservation_date: string | null;
  total_license_plates: number;
  approved_license_plates: number;
  total_warnings: number;
  member_since: string;
}

// Notification types
export interface WarningNotification {
  warning_id: string;
  reason: string;
  issued_at: string;
}

// User block types
export interface UserBlock {
  id: string;
  user_id: string;
  block_type: 'manual' | 'automatic_checkin' | 'automatic_checkout';
  reason: string;
  blocked_at: string;
  blocked_until: string;
  warning_id: string | null;
  is_active: boolean;
  unblocked_at: string | null;
  created_at: string;
}

export interface UserBlockWithWarning extends UserBlock {
  warning?: {
    id: string;
    reason: string;
    issued_at: string;
  };
}

// Infraction count types
export interface InfractionCounts {
  checkin_infractions: number;
  checkout_infractions: number;
  total_infractions: number;
}
