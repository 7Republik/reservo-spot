import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Loader2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/waitlist";

/**
 * NotificationBell Component
 * 
 * Displays a bell icon with a badge showing the count of unread notifications.
 * When clicked, opens a dropdown with the list of notifications.
 * 
 * Features:
 * - Badge with unread count
 * - Dropdown with notification list
 * - Mark individual notifications as read on click
 * - "Mark all as read" button
 * - Real-time updates via useNotifications hook
 * - Empty state when no notifications
 * - Loading states
 * - Responsive design
 * 
 * Requirements: 13.1, 13.5
 * 
 * @example
 * ```tsx
 * <NotificationBell />
 * ```
 */
export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    unreadNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead
  } = useNotifications();

  /**
   * Get icon for notification type
   */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'waitlist_offer':
        return '🎉';
      case 'waitlist_reminder':
        return '⏰';
      case 'waitlist_expired':
        return '⏱️';
      case 'waitlist_accepted':
        return '✅';
      case 'waitlist_penalty':
        return '⚠️';
      default:
        return '📢';
    }
  };

  /**
   * Get color class for notification type
   */
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'waitlist_offer':
        return 'bg-primary/10 border-primary/20';
      case 'waitlist_reminder':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'waitlist_expired':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'waitlist_accepted':
        return 'bg-green-500/10 border-green-500/20';
      case 'waitlist_penalty':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-muted border-border';
    }
  };

  /**
   * Format notification timestamp
   */
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return 'Hace un momento';
    }
  };

  /**
   * Handle notification click - mark as read
   */
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-accent transition-colors"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} notificaciones sin leer`
              : 'Ver notificaciones'
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <>
              {/* Badge with count */}
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center border-2 border-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
              {/* Pulse animation ring */}
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary animate-ping opacity-75" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuLabel>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="h-8 text-xs"
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Marcar todas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : unreadNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                No hay notificaciones
              </p>
              <p className="text-xs text-muted-foreground">
                Te avisaremos cuando haya novedades
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {unreadNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  disabled={isMarkingAsRead}
                  className={cn(
                    "w-full text-left p-4 transition-colors hover:bg-accent/50",
                    "focus:outline-none focus:bg-accent/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "relative"
                  )}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border",
                        getNotificationColor(notification.type)
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.created_at)}
                        </span>

                        {!notification.is_read && (
                          <span className="text-xs text-primary font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Marcar leída
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer - Only show if there are notifications */}
        {unreadNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3 mr-1" />
                Cerrar
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
