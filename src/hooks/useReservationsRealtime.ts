import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for real-time updates of reservations
 * 
 * Subscribes to INSERT, UPDATE, DELETE events on reservations table
 * and invalidates relevant queries to trigger refetch.
 * 
 * This ensures all clients see up-to-date availability when:
 * - Someone creates a reservation
 * - Someone cancels a reservation
 * - Someone accepts a waitlist offer (creates reservation)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useReservationsRealtime();
 *   // Component will automatically update when reservations change
 * }
 * ```
 */
export const useReservationsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to all changes in reservations table
        channel = supabase
          .channel('reservations-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'reservations'
            },
            (payload) => {
              console.log('[Realtime] Reservation change detected:', payload.eventType);
              
              // Invalidate all queries that depend on reservations
              queryClient.invalidateQueries({ queryKey: ['reservations'] });
              queryClient.invalidateQueries({ queryKey: ['available-spots'] });
              queryClient.invalidateQueries({ queryKey: ['groups-with-availability'] });
              queryClient.invalidateQueries({ queryKey: ['user-reservations'] });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] Subscribed to reservations updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime] Error subscribing to reservations channel');
            }
          });
      } catch (err) {
        console.error('[Realtime] Error setting up subscription:', err);
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log('[Realtime] Unsubscribing from reservations updates');
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);
};
