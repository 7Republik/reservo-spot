/**
 * useNotifications Hook - Usage Examples
 * 
 * This file demonstrates how to use the useNotifications hook
 * for managing in-app notifications in the waitlist system.
 */

import { useNotifications } from './useNotifications';

// ============================================================================
// Example 1: Basic Notification Bell Component
// ============================================================================

export function NotificationBellExample() {
  const { unreadCount, unreadNotifications, markAsRead } = useNotifications();

  return (
    <div className="relative">
      {/* Bell icon with badge */}
      <button className="relative">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown with notifications */}
      <div className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg">
        {unreadNotifications.length === 0 ? (
          <p className="p-4 text-muted-foreground text-center">
            No hay notificaciones nuevas
          </p>
        ) : (
          <div className="divide-y">
            {unreadNotifications.map(notification => (
              <div
                key={notification.id}
                className="p-4 hover:bg-muted cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 2: Notification List with Mark All as Read
// ============================================================================

export function NotificationListExample() {
  const {
    unreadNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead
  } = useNotifications();

  if (isLoading) {
    return <div>Cargando notificaciones...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with count and mark all button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Notificaciones ({unreadCount})
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={isMarkingAllAsRead}
            className="text-sm text-primary hover:underline"
          >
            {isMarkingAllAsRead ? 'Marcando...' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      {/* Notifications list */}
      {unreadNotifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tienes notificaciones pendientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {unreadNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => markAsRead(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Notification Card Component
// ============================================================================

export function NotificationCard({ notification, onMarkAsRead }) {
  // Get icon and color based on notification type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'waitlist_offer':
        return {
          icon: '🎉',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'waitlist_reminder':
        return {
          icon: '⏰',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'waitlist_expired':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'waitlist_penalty':
        return {
          icon: '🚫',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      default:
        return {
          icon: '📢',
          bgColor: 'bg-muted',
          borderColor: 'border-border'
        };
    }
  };

  const style = getNotificationStyle(notification.type);

  return (
    <div
      className={`p-4 rounded-lg border ${style.bgColor} ${style.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{style.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold">{notification.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {new Date(notification.created_at).toLocaleString()}
            </span>
            <button
              onClick={onMarkAsRead}
              className="text-xs text-primary hover:underline"
            >
              Marcar como leída
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Notification Badge in Header
// ============================================================================

export function HeaderWithNotificationsExample() {
  const { unreadCount } = useNotifications();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">RESERVEO</h1>
      
      <nav className="flex items-center gap-4">
        <a href="/dashboard">Dashboard</a>
        <a href="/reservations">Reservas</a>
        <a href="/waitlist">Lista de Espera</a>
        
        {/* Notification bell with badge */}
        <a href="/notifications" className="relative">
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </a>
      </nav>
    </header>
  );
}

// ============================================================================
// Example 5: Auto-refresh Notifications
// ============================================================================

export function AutoRefreshNotificationsExample() {
  const { unreadNotifications, refetch } = useNotifications();

  // Manual refetch on button click
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div>
      <button onClick={handleRefresh} className="mb-4">
        🔄 Actualizar notificaciones
      </button>
      
      <div className="space-y-2">
        {unreadNotifications.map(notification => (
          <div key={notification.id} className="p-4 bg-card rounded-lg">
            <h4>{notification.title}</h4>
            <p className="text-sm">{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Notification with Action Buttons (Waitlist Offer)
// ============================================================================

export function WaitlistOfferNotificationExample() {
  const { unreadNotifications, markAsRead } = useNotifications();
  const { acceptOffer, rejectOffer } = useWaitlist();

  // Filter only waitlist offer notifications
  const offerNotifications = unreadNotifications.filter(
    n => n.type === 'waitlist_offer'
  );

  return (
    <div className="space-y-4">
      {offerNotifications.map(notification => {
        // Extract offer data from notification.data
        const offerData = notification.data as any;
        const offerId = offerData?.offerId;

        return (
          <div
            key={notification.id}
            className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <h3 className="font-bold text-lg">{notification.title}</h3>
            <p className="text-sm mt-1">{notification.message}</p>
            
            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  await acceptOffer(offerId);
                  markAsRead(notification.id);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Aceptar Oferta
              </button>
              <button
                onClick={async () => {
                  await rejectOffer(offerId);
                  markAsRead(notification.id);
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg"
              >
                Rechazar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Example 7: Notification Types Reference
// ============================================================================

/**
 * Notification Types and Their Meanings:
 * 
 * 1. waitlist_offer
 *    - User receives an offer for a parking spot
 *    - Contains: offerId, spotNumber, groupName, date, expiresAt
 *    - Action: Accept or Reject
 * 
 * 2. waitlist_reminder
 *    - Reminder about pending offer (halfway or final)
 *    - Contains: offerId, timeRemaining, urgency
 *    - Action: Accept or Reject before expiration
 * 
 * 3. waitlist_expired
 *    - Offer expired without response
 *    - Contains: spotNumber, groupName, date, expiredAt
 *    - Action: None (informational)
 * 
 * 4. waitlist_accepted
 *    - Confirmation that offer was accepted
 *    - Contains: reservationId, spotNumber, groupName, date
 *    - Action: None (informational)
 * 
 * 5. waitlist_penalty
 *    - User received penalty or warning
 *    - Contains: penaltyType, noResponseCount, threshold, blockedUntil
 *    - Action: None (informational)
 */

// ============================================================================
// Example 8: Error Handling
// ============================================================================

export function NotificationsWithErrorHandlingExample() {
  const {
    unreadNotifications,
    isLoading,
    error,
    markAsRead
  } = useNotifications();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
        <h3 className="font-semibold text-destructive">Error al cargar notificaciones</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {unreadNotifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          {notification.title}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 9: Real-time Toast Notifications
// ============================================================================

/**
 * The hook automatically shows toast notifications when new notifications arrive:
 * 
 * - waitlist_offer: Success toast (green) - 10 seconds
 * - waitlist_reminder: Info toast (blue) - 8 seconds
 * - waitlist_expired: Warning toast (yellow) - 5 seconds
 * - waitlist_penalty: Error toast (red) - 10 seconds
 * 
 * No additional code needed - toasts appear automatically via real-time subscription!
 */

// ============================================================================
// Example 10: Integration with Dashboard
// ============================================================================

export function DashboardWithNotificationsExample() {
  const { unreadCount, unreadNotifications } = useNotifications();

  return (
    <div className="p-6">
      {/* Show alert if there are unread notifications */}
      {unreadCount > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="font-semibold">
            Tienes {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
          </p>
          <a href="/notifications" className="text-sm text-primary hover:underline">
            Ver todas →
          </a>
        </div>
      )}

      {/* Show recent notifications */}
      {unreadNotifications.slice(0, 3).map(notification => (
        <div key={notification.id} className="mb-2 p-3 bg-card rounded-lg">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-xs text-muted-foreground">{notification.message}</p>
        </div>
      ))}

      {/* Rest of dashboard content */}
      <div className="mt-6">
        <h2>Mis Reservas</h2>
        {/* ... */}
      </div>
    </div>
  );
}
