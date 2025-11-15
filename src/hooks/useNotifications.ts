import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Notification } from '@/types/waitlist';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Custom hook for managing in-app notifications
 * 
 * Provides functions for:
 * - Getting unread notifications for the current user
 * - Marking individual notifications as read
 * - Marking all notifications as read
 * - Real-time subscription to new notifications
 * - Counting unread notifications
 * 
 * Automatically subscribes to real-time updates when component mounts
 * and unsubscribes when component unmounts.
 * 
 * @returns {Object} Notifications operations and state
 * @returns {Notification[]} unreadNotifications - Array of unread notifications
 * @returns {number} unreadCount - Count of unread notifications
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {Error | null} error - Error object if any
 * @returns {Function} markAsRead - Mark a notification as read
 * @returns {Function} markAllAsRead - Mark all notifications as read
 * @returns {Function} refetch - Manually refetch notifications
 * 
 * @example
 * ```tsx
 * const {
 *   unreadNotifications,
 *   unreadCount,
 *   isLoading,
 *   markAsRead,
 *   markAllAsRead
 * } = useNotifications();
 * 
 * // Display unread count
 * <Badge>{unreadCount}</Badge>
 * 
 * // Display notifications
 * {unreadNotifications.map(notification => (
 *   <NotificationItem
 *     key={notification.id}
 *     notification={notification}
 *     onRead={() => markAsRead(notification.id)}
 *   />
 * ))}
 * ```
 */
export const useNotifications = () => {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  /**
   * Query to fetch unread notifications for the current user
   */
  const {
    data: unreadNotifications = [],
    isLoading,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Query unread notifications
        const { data, error: queryError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false });

        if (queryError) {
          throw queryError;
        }

        return data || [];
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al obtener notificaciones');
        setError(error);
        console.error('Error en getUnreadNotifications:', err);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  /**
   * Computed value for unread count
   */
  const unreadCount = unreadNotifications.length;

  /**
   * Set up real-time subscription to notifications changes
   */
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }

        // Create channel for real-time updates
        const realtimeChannel = supabase
          .channel('notifications-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Notification change detected:', payload);
              
              // Show toast for new notifications
              if (payload.eventType === 'INSERT') {
                const newNotification = payload.new as Notification;
                
                // Show toast based on notification type
                switch (newNotification.type) {
                  case 'waitlist_offer':
                    toast.success(newNotification.title, {
                      description: newNotification.message,
                      duration: 10000, // 10 seconds for important offers
                    });
                    break;
                  case 'waitlist_reminder':
                    toast.info(newNotification.title, {
                      description: newNotification.message,
                      duration: 8000,
                    });
                    break;
                  case 'waitlist_expired':
                    toast.warning(newNotification.title, {
                      description: newNotification.message,
                      duration: 5000,
                    });
                    break;
                  case 'waitlist_penalty':
                    toast.error(newNotification.title, {
                      description: newNotification.message,
                      duration: 10000,
                    });
                    break;
                  default:
                    toast(newNotification.title, {
                      description: newNotification.message,
                    });
                }
              }
              
              // Invalidate and refetch queries
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              
              // Refetch immediately
              refetch();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Subscribed to notifications real-time updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to notifications channel');
            }
          });

        setChannel(realtimeChannel);
      } catch (err) {
        console.error('Error setting up real-time subscription:', err);
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log('Unsubscribing from notifications real-time updates');
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient, refetch]);

  /**
   * Mutation to mark a notification as read
   */
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Update notification
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', notificationId)
          .eq('user_id', user.id); // Security: ensure user owns the notification

        if (updateError) {
          throw updateError;
        }

        return notificationId;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al marcar notificación como leída');
        console.error('Error en markAsRead:', err);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error('Error al marcar notificación como leída');
      setError(error);
      toast.error('Error al marcar notificación como leída');
    }
  });

  /**
   * Mutation to mark all notifications as read
   */
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Update all unread notifications
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (updateError) {
          throw updateError;
        }

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al marcar todas las notificaciones como leídas');
        console.error('Error en markAllAsRead:', err);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (err) => {
      const error = err instanceof Error ? err : new Error('Error al marcar todas las notificaciones como leídas');
      setError(error);
      toast.error('Error al marcar todas las notificaciones como leídas');
    }
  });

  /**
   * Mark a notification as read
   * 
   * @param notificationId - ID of the notification to mark as read
   * 
   * @example
   * ```tsx
   * <Button onClick={() => markAsRead(notification.id)}>
   *   Marcar como leída
   * </Button>
   * ```
   */
  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  /**
   * Mark all notifications as read
   * 
   * @example
   * ```tsx
   * <Button onClick={markAllAsRead}>
   *   Marcar todas como leídas
   * </Button>
   * ```
   */
  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return {
    unreadNotifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending
  };
};
