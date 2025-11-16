// =====================================================
// TIPOS: Sistema de Notificaciones
// =====================================================

import { Database } from '@/integrations/supabase/types';

// Tipos base de Supabase
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];
export type NotificationPreferencesInsert = Database['public']['Tables']['notification_preferences']['Insert'];
export type NotificationPreferencesUpdate = Database['public']['Tables']['notification_preferences']['Update'];

// Enums
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory = 'reservation' | 'waitlist' | 'warning' | 'incident' | 'system';

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  // Waitlist
  WAITLIST_REGISTERED: 'waitlist_registered',
  WAITLIST_OFFER: 'waitlist_offer',
  WAITLIST_REMINDER: 'waitlist_reminder',
  WAITLIST_ACCEPTED: 'waitlist_accepted',
  WAITLIST_REJECTED: 'waitlist_rejected',
  WAITLIST_EXPIRED: 'waitlist_expired',
  
  // Warnings & Blocks
  WARNING_RECEIVED: 'warning_received',
  USER_BLOCKED: 'user_blocked',
  BLOCK_EXPIRED: 'block_expired',
  
  // Reservations
  RESERVATION_CONFIRMED: 'reservation_confirmed',
  RESERVATION_CANCELLED: 'reservation_cancelled',
  CHECKIN_REMINDER: 'checkin_reminder',
  CHECKIN_SUCCESS: 'checkin_success',
  
  // Incidents
  INCIDENT_REPORTED: 'incident_reported',
  INCIDENT_REASSIGNMENT: 'incident_reassignment',
  INCIDENT_CONFIRMED: 'incident_confirmed',
  
  // System
  LICENSE_PLATE_APPROVED: 'license_plate_approved',
  LICENSE_PLATE_REJECTED: 'license_plate_rejected',
  GROUP_ACCESS_ADDED: 'group_access_added',
  GROUP_ACCESS_REMOVED: 'group_access_removed',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Configuración visual por prioridad
export interface PriorityConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const PRIORITY_CONFIG: Record<NotificationPriority, PriorityConfig> = {
  urgent: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '🔴',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '🟠',
  },
  medium: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🔵',
  },
  low: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: '⚪',
  },
};

// Iconos por categoría
export const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  reservation: '🅿️',
  waitlist: '⏳',
  warning: '⚠️',
  incident: '🚨',
  system: 'ℹ️',
};

// Helper para obtener configuración de prioridad
export function getPriorityConfig(priority: NotificationPriority): PriorityConfig {
  return PRIORITY_CONFIG[priority];
}

// Helper para obtener icono de categoría
export function getCategoryIcon(category: NotificationCategory): string {
  return CATEGORY_ICONS[category];
}

// Helper para formatear tiempo relativo
export function getRelativeTime(date: string): string {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Hace ${diffInWeeks}sem`;
  }

  return notificationDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

// Tipo para el hook useNotifications
export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

// Tipo para el hook useNotificationPreferences
export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: Error | null;
  updatePreferences: (updates: Partial<NotificationPreferencesUpdate>) => Promise<void>;
  refetch: () => Promise<void>;
}
