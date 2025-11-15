import { Database } from '@/integrations/supabase/types';

// ============================================================================
// Database Table Types
// ============================================================================

export type WaitlistEntry = Database['public']['Tables']['waitlist_entries']['Row'];
export type WaitlistEntryInsert = Database['public']['Tables']['waitlist_entries']['Insert'];
export type WaitlistEntryUpdate = Database['public']['Tables']['waitlist_entries']['Update'];

export type WaitlistOffer = Database['public']['Tables']['waitlist_offers']['Row'];
export type WaitlistOfferInsert = Database['public']['Tables']['waitlist_offers']['Insert'];
export type WaitlistOfferUpdate = Database['public']['Tables']['waitlist_offers']['Update'];

export type WaitlistLog = Database['public']['Tables']['waitlist_logs']['Row'];
export type WaitlistLogInsert = Database['public']['Tables']['waitlist_logs']['Insert'];
export type WaitlistLogUpdate = Database['public']['Tables']['waitlist_logs']['Update'];

export type WaitlistPenalty = Database['public']['Tables']['waitlist_penalties']['Row'];
export type WaitlistPenaltyInsert = Database['public']['Tables']['waitlist_penalties']['Insert'];
export type WaitlistPenaltyUpdate = Database['public']['Tables']['waitlist_penalties']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

// ============================================================================
// Enums and Constants
// ============================================================================

export const WAITLIST_ENTRY_STATUS = {
  ACTIVE: 'active',
  OFFER_PENDING: 'offer_pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type WaitlistEntryStatus = typeof WAITLIST_ENTRY_STATUS[keyof typeof WAITLIST_ENTRY_STATUS];

export const WAITLIST_OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type WaitlistOfferStatus = typeof WAITLIST_OFFER_STATUS[keyof typeof WAITLIST_OFFER_STATUS];

export const WAITLIST_LOG_ACTION = {
  ENTRY_CREATED: 'entry_created',
  ENTRY_CANCELLED: 'entry_cancelled',
  OFFER_CREATED: 'offer_created',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_REJECTED: 'offer_rejected',
  OFFER_EXPIRED: 'offer_expired',
  PENALTY_APPLIED: 'penalty_applied',
  CLEANUP_EXECUTED: 'cleanup_executed',
} as const;

export type WaitlistLogAction = typeof WAITLIST_LOG_ACTION[keyof typeof WAITLIST_LOG_ACTION];

export const NOTIFICATION_TYPE = {
  WAITLIST_OFFER: 'waitlist_offer',
  WAITLIST_REMINDER: 'waitlist_reminder',
  WAITLIST_EXPIRED: 'waitlist_expired',
  WAITLIST_ACCEPTED: 'waitlist_accepted',
  WAITLIST_PENALTY: 'waitlist_penalty',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

// ============================================================================
// Configuration Types
// ============================================================================

export interface WaitlistSettings {
  waitlist_enabled: boolean;
  waitlist_acceptance_time_minutes: number;
  waitlist_max_simultaneous: number;
  waitlist_priority_by_role: boolean;
  waitlist_penalty_enabled: boolean;
  waitlist_penalty_threshold: number;
  waitlist_penalty_duration_days: number;
}

export interface WaitlistSettingsUpdate {
  waitlist_enabled?: boolean;
  waitlist_acceptance_time_minutes?: number;
  waitlist_max_simultaneous?: number;
  waitlist_priority_by_role?: boolean;
  waitlist_penalty_enabled?: boolean;
  waitlist_penalty_threshold?: number;
  waitlist_penalty_duration_days?: number;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface WaitlistEntryWithDetails extends WaitlistEntry {
  parking_groups?: {
    id: string;
    name: string;
    description?: string;
  };
  user?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

export interface WaitlistOfferWithDetails extends WaitlistOffer {
  parking_spot?: {
    id: string;
    spot_number: string;
    group_id: string;
  };
  parking_group?: {
    id: string;
    name: string;
    description?: string;
  };
  user?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  waitlist_entry?: WaitlistEntry;
}

export interface WaitlistLogWithDetails extends WaitlistLog {
  user?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  waitlist_entry?: WaitlistEntry;
  waitlist_offer?: WaitlistOffer;
}

// ============================================================================
// UI/Component Types
// ============================================================================

export interface WaitlistRegistrationData {
  groupIds: string[];
  date: string;
}

export interface WaitlistOfferNotificationData {
  offerId: string;
  spotNumber: string;
  groupName: string;
  date: string;
  expiresAt: string;
  timeRemaining: number; // milliseconds
}

export interface WaitlistDashboardData {
  activeEntries: WaitlistEntryWithDetails[];
  pendingOffers: WaitlistOfferWithDetails[];
  penalty?: WaitlistPenalty;
}

export interface WaitlistStatsData {
  totalActiveEntries: number;
  totalPendingOffers: number;
  acceptanceRate: number;
  rejectionRate: number;
  expirationRate: number;
  averageWaitTime: number; // hours
}

// ============================================================================
// Function Parameter Types
// ============================================================================

export interface RegisterInWaitlistParams {
  userId: string;
  groupId: string;
  date: string;
}

export interface AcceptWaitlistOfferParams {
  offerId: string;
  userId: string;
}

export interface RejectWaitlistOfferParams {
  offerId: string;
  userId: string;
}

export interface ProcessWaitlistParams {
  spotId: string;
  date: string;
}

export interface CreateWaitlistOfferParams {
  entryId: string;
  spotId: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface WaitlistRegistrationResponse {
  success: boolean;
  entryId?: string;
  position?: number;
  message?: string;
  error?: string;
}

export interface WaitlistOfferResponse {
  success: boolean;
  reservationId?: string;
  message?: string;
  error?: string;
}

export interface WaitlistPositionResponse {
  position: number;
  totalInQueue: number;
  estimatedWaitTime?: number; // hours
}

// ============================================================================
// Filter and Query Types
// ============================================================================

export interface WaitlistEntriesFilter {
  userId?: string;
  groupId?: string;
  date?: string;
  status?: WaitlistEntryStatus;
}

export interface WaitlistOffersFilter {
  userId?: string;
  status?: WaitlistOfferStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface WaitlistLogsFilter {
  userId?: string;
  action?: WaitlistLogAction;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminWaitlistStats {
  totalActiveEntries: number;
  totalPendingOffers: number;
  totalUsersInWaitlist: number;
  acceptanceRate: number;
  rejectionRate: number;
  expirationRate: number;
  averageWaitTime: number;
  entriesByGroup: {
    groupId: string;
    groupName: string;
    count: number;
  }[];
  offersByStatus: {
    status: WaitlistOfferStatus;
    count: number;
  }[];
}

export interface AdminWaitlistEntry extends WaitlistEntryWithDetails {
  canRemove: boolean;
}

export interface AdminWaitlistTableData {
  entries: AdminWaitlistEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Notification Data Types
// ============================================================================

export interface WaitlistOfferNotificationPayload {
  offerId: string;
  spotNumber: string;
  groupName: string;
  date: string;
  expiresAt: string;
  acceptUrl: string;
  rejectUrl: string;
}

export interface WaitlistReminderNotificationPayload {
  offerId: string;
  spotNumber: string;
  groupName: string;
  date: string;
  expiresAt: string;
  timeRemaining: number; // minutes
  urgency: 'halfway' | 'final';
  acceptUrl: string;
  rejectUrl: string;
}

export interface WaitlistExpiredNotificationPayload {
  spotNumber: string;
  groupName: string;
  date: string;
  expiredAt: string;
}

export interface WaitlistPenaltyNotificationPayload {
  penaltyType: 'warning' | 'blocked';
  noResponseCount: number;
  rejectionCount: number;
  threshold: number;
  blockedUntil?: string;
  message: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface WaitlistValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface WaitlistLimitCheck {
  currentCount: number;
  maxAllowed: number;
  canRegister: boolean;
}

export interface WaitlistPenaltyCheck {
  isBlocked: boolean;
  blockedUntil?: string;
  noResponseCount: number;
  rejectionCount: number;
  threshold: number;
  message?: string;
}
