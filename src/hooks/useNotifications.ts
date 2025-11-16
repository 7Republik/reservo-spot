import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Notification, UseNotificationsReturn } from '@/types/notifications';

export const useNotifications = (): UseNotificationsReturn => {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Query para obtener notificaciones
  const {
    data: notifications = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    staleTime: 30000, // Cache 30 segundos
    refetchOnWindowFocus: false,
  });

  // Calcular contador de no leídas
  useEffect(() => {
    const count = notifications.filter(n => !n.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Subscription real-time solo para notificaciones urgentes
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      channel = supabase
        .channel('urgent-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            
            // Solo mostrar toast para notificaciones urgentes
            if (newNotification.priority === 'urgent') {
              toast.info(newNotification.title, {
                description: newNotification.message,
                duration: 5000,
              });
            }
            
            // Invalidar cache para refrescar
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  // Polling cada 30s para notificaciones no urgentes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Mutation para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase.rpc('mark_notification_as_read', {
        _notification_id: notificationId,
        _user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar notificación como leída');
    },
  });

  // Mutation para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        _user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error al marcar todas como leídas');
    },
  });

  return {
    notifications,
    unreadCount,
    loading,
    error: error as Error | null,
    markAsRead: async (notificationId: string) => {
      return new Promise<void>((resolve, reject) => {
        markAsReadMutation.mutate(notificationId, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });
    },
    markAllAsRead: async () => {
      return new Promise<void>((resolve, reject) => {
        markAllAsReadMutation.mutate(undefined, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });
    },
    refetch: async () => {
      await refetch();
    },
  };
};
