// RESERVEO - Check-in/Check-out System Types
// Auto-generated types are in src/integrations/supabase/types.ts
// These are application-level types for the check-in system

// ============================================================================
// Database Table Interfaces
// ============================================================================

export interface CheckinSettings {
  id: string;
  system_enabled: boolean;
  default_checkin_window_hours: number;
  grace_period_minutes: number;
  checkin_infraction_threshold: number;
  checkout_infraction_threshold: number;
  temporary_block_days: number;
  send_checkin_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParkingGroupCheckinConfig {
  id: string;
  group_id: string;
  enabled: boolean;
  use_custom_config: boolean;
  custom_checkin_window_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationCheckin {
  id: string;
  reservation_id: string;
  user_id: string;
  spot_id: string;
  group_id: string;
  checkin_at: string | null;
  checkout_at: string | null;
  is_continuous_reservation: boolean;
  continuous_start_date: string | null;
  continuous_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckinInfraction {
  id: string;
  user_id: string;
  reservation_id: string;
  spot_id: string;
  group_id: string;
  infraction_type: 'checkin' | 'checkout';
  infraction_date: string;
  detected_at: string;
  expected_checkin_window_end: string | null;
  grace_period_end: string | null;
  warning_generated: boolean;
  warning_id: string | null;
  created_at: string;
}

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

export interface CheckinNotification {
  id: string;
  user_id: string;
  reservation_id: string;
  notification_type: 'checkin_reminder' | 'late_checkin_warning' | 'infraction_notice';
  subject: string;
  message: string;
  spot_number: string | null;
  group_name: string | null;
  minutes_remaining: number | null;
  sent_at: string;
  delivery_status: 'sent' | 'failed' | 'pending';
  created_at: string;
}

// ============================================================================
// Extended/Composite Interfaces
// ============================================================================

export interface ReservationWithCheckin {
  id: string;
  user_id: string;
  spot_id: string;
  reservation_date: string;
  status: string;
  created_at: string;
  checkin?: ReservationCheckin;
  spot: {
    spot_number: string;
    group: {
      name: string;
    };
  };
}

// ============================================================================
// Reporting Interfaces
// ============================================================================

export interface CheckinReportItem {
  user_id: string;
  user_name: string;
  spot_number: string;
  group_name: string;
  reservation_date: string;
  infraction_type: 'checkin' | 'checkout';
  detected_at: string;
  expected_window_end?: string;
  grace_period_end?: string;
}

export interface CheckinHistoryItem {
  id: string;
  user_name: string;
  spot_number: string;
  group_name: string;
  checkin_at: string | null;
  checkout_at: string | null;
  duration_minutes: number | null;
  is_continuous: boolean;
}

export interface CheckinStats {
  total_checkins: number;
  total_checkouts: number;
  total_infractions: number;
  checkin_infractions: number;
  checkout_infractions: number;
  compliance_rate: number;
  avg_checkin_time: string;
  avg_checkout_time: string;
}

// ============================================================================
// Error Handling
// ============================================================================

export enum CheckinErrorCode {
  SYSTEM_DISABLED = 'SYSTEM_DISABLED',
  GROUP_DISABLED = 'GROUP_DISABLED',
  NO_ACTIVE_RESERVATION = 'NO_ACTIVE_RESERVATION',
  ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN',
  NO_CHECKIN_FOUND = 'NO_CHECKIN_FOUND',
  USER_BLOCKED = 'USER_BLOCKED',
  LATE_CHECKIN = 'LATE_CHECKIN',
  INVALID_DATE = 'INVALID_DATE',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

export class CheckinError extends Error {
  constructor(
    public code: CheckinErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CheckinError';
  }
}

export const CHECKIN_ERROR_MESSAGES: Record<CheckinErrorCode, string> = {
  [CheckinErrorCode.SYSTEM_DISABLED]: 'El sistema de check-in está desactivado',
  [CheckinErrorCode.GROUP_DISABLED]: 'El check-in está desactivado para este grupo',
  [CheckinErrorCode.NO_ACTIVE_RESERVATION]: 'No tienes una reserva activa para hoy',
  [CheckinErrorCode.ALREADY_CHECKED_IN]: 'Ya has realizado el check-in',
  [CheckinErrorCode.NO_CHECKIN_FOUND]: 'No se encontró un check-in activo',
  [CheckinErrorCode.USER_BLOCKED]: 'Tu cuenta está bloqueada temporalmente',
  [CheckinErrorCode.LATE_CHECKIN]: 'Check-in realizado fuera de tiempo',
  [CheckinErrorCode.INVALID_DATE]: 'Fecha de reserva inválida',
  [CheckinErrorCode.DATABASE_ERROR]: 'Error al procesar la solicitud'
};

// ============================================================================
// RPC Function Response Types
// ============================================================================

export interface PerformCheckinResponse {
  success: boolean;
  error?: string;
  checkin_at?: string;
  was_late?: boolean;
}

export interface PerformCheckoutResponse {
  success: boolean;
  error?: string;
  checkout_at?: string;
}

// ============================================================================
// Filter and Query Types
// ============================================================================

export interface CheckinReportFilters {
  group_id?: string;
  user_id?: string;
  infraction_type?: 'checkin' | 'checkout';
  date_from?: string;
  date_to?: string;
}

export interface CheckinHistoryFilters {
  group_id?: string;
  user_id?: string;
  spot_id?: string;
  date_from?: string;
  date_to?: string;
  has_checkout?: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface TodayCheckinCardProps {
  reservation: ReservationWithCheckin;
  onCheckin: () => Promise<void>;
  onCheckout: () => Promise<void>;
  isLoading?: boolean;
}

export interface AdminCheckinConfigTabProps {
  // No props needed - loads settings internally
}

export interface GroupCheckinConfigSectionProps {
  groupId: string;
  groupName: string;
}

export interface CheckinReportPanelProps {
  // No props needed - loads data internally
}

export interface CheckinHistoryPanelProps {
  // No props needed - loads data internally
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseCheckinReturn {
  checkin: (reservationId: string) => Promise<void>;
  checkout: (reservationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseCheckinSettingsReturn {
  settings: CheckinSettings | null;
  loading: boolean;
  loadSettings: (forceReload?: boolean) => Promise<void>;
  updateSettings: (updates: Partial<CheckinSettings>) => Promise<void>;
}

export interface UseGroupCheckinConfigReturn {
  config: ParkingGroupCheckinConfig | null;
  loading: boolean;
  loadGroupConfig: (groupId: string, forceReload?: boolean) => Promise<void>;
  updateGroupConfig: (groupId: string, updates: Partial<ParkingGroupCheckinConfig>) => Promise<void>;
}

export interface UseCheckinReportsReturn {
  reports: CheckinReportItem[];
  loading: boolean;
  loadTodayInfractions: () => Promise<void>;
  loadCheckinHistory: (filters?: CheckinHistoryFilters) => Promise<void>;
  exportToCSV: (data: CheckinReportItem[] | CheckinHistoryItem[]) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type InfractionType = 'checkin' | 'checkout';
export type BlockType = 'manual' | 'automatic_checkin' | 'automatic_checkout';
export type NotificationType = 'checkin_reminder' | 'late_checkin_warning' | 'infraction_notice';
export type DeliveryStatus = 'sent' | 'failed' | 'pending';

// Type guard functions
export const isCheckinInfraction = (infraction: CheckinInfraction): boolean => {
  return infraction.infraction_type === 'checkin';
};

export const isCheckoutInfraction = (infraction: CheckinInfraction): boolean => {
  return infraction.infraction_type === 'checkout';
};

export const isAutomaticBlock = (block: UserBlock): boolean => {
  return block.block_type === 'automatic_checkin' || block.block_type === 'automatic_checkout';
};

export const isBlockActive = (block: UserBlock): boolean => {
  return block.is_active && new Date(block.blocked_until) > new Date();
};
