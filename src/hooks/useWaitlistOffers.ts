import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WaitlistOfferWithDetails } from '@/types/waitlist';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Custom hook for managing waitlist offers
 * 
 * Provides functions for:
 * - Getting pending offers for the current user
 * - Real-time subscription to offer changes
 * - Calculating time remaining for each offer
 * - Getting detailed information about a specific offer
 * 
 * Automatically subscribes to real-time updates when component mounts
 * and unsubscribes when component unmounts.
 * 
 * @returns {Object} Waitlist offers operations and state
 * @returns {WaitlistOfferWithDetails[]} pendingOffers - Array of pending offers
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {Error | null} error - Error object if any
 * @returns {Function} getOfferDetails - Get detailed information about an offer
 * @returns {Function} getTimeRemaining - Calculate time remaining for an offer
 * 
 * @example
 * ```tsx
 * const {
 *   pendingOffers,
 *   isLoading,
 *   getOfferDetails,
 *   getTimeRemaining
 * } = useWaitlistOffers();
 * 
 * // Display pending offers
 * {pendingOffers.map(offer => (
 *   <OfferCard
 *     key={offer.id}
 *     offer={offer}
 *     timeRemaining={getTimeRemaining(offer.expires_at)}
 *   />
 * ))}
 * ```
 */
export const useWaitlistOffers = () => {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  /**
   * Query to fetch pending offers for the current user
   */
  const {
    data: pendingOffers = [],
    isLoading,
    refetch
  } = useQuery<WaitlistOfferWithDetails[]>({
    queryKey: ['pending-offers'],
    queryFn: async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Query pending offers with related data
        const { data, error: queryError } = await supabase
          .from('waitlist_offers')
          .select(`
            *,
            parking_spot:parking_spots(
              id,
              spot_number,
              group_id,
              is_accessible,
              has_charger,
              is_compact
            ),
            parking_group:parking_spots!inner(
              group_id,
              parking_groups(
                id,
                name,
                description
              )
            ),
            waitlist_entry:waitlist_entries(
              id,
              group_id,
              reservation_date,
              position,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('expires_at', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        // Transform data to match WaitlistOfferWithDetails type
        const transformedData = (data || []).map(offer => {
          // Extract parking_group from nested structure
          const spotData = offer.parking_spot as any;
          const groupData = (offer as any).parking_group?.[0]?.parking_groups;

          return {
            ...offer,
            parking_spot: spotData,
            parking_group: groupData,
            waitlist_entry: offer.waitlist_entry as any
          } as WaitlistOfferWithDetails;
        });

        return transformedData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al obtener ofertas pendientes');
        setError(error);
        console.error('Error en getPendingOffers:', err);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds to update time remaining
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  /**
   * Set up real-time subscription to waitlist_offers changes
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
          .channel('waitlist-offers-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'waitlist_offers',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Waitlist offer change detected:', payload);
              
              // Invalidate and refetch queries
              queryClient.invalidateQueries({ queryKey: ['pending-offers'] });
              queryClient.invalidateQueries({ queryKey: ['waitlist-offers'] });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              
              // Refetch immediately
              refetch();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Subscribed to waitlist offers real-time updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to waitlist offers channel');
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
        console.log('Unsubscribing from waitlist offers real-time updates');
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient, refetch]);

  /**
   * Get detailed information about a specific offer
   * 
   * @param offerId - ID of the offer to get details for
   * @returns Promise that resolves with offer details
   * 
   * @throws Error if offer not found or query fails
   */
  const getOfferDetails = async (offerId: string): Promise<WaitlistOfferWithDetails> => {
    try {
      const { data, error: queryError } = await supabase
        .from('waitlist_offers')
        .select(`
          *,
          parking_spot:parking_spots(
            id,
            spot_number,
            group_id,
            is_accessible,
            has_charger,
            is_compact,
            notes
          ),
          parking_group:parking_spots!inner(
            group_id,
            parking_groups(
              id,
              name,
              description,
              capacity
            )
          ),
          waitlist_entry:waitlist_entries(
            id,
            group_id,
            reservation_date,
            position,
            created_at,
            status
          ),
          user:profiles(
            id,
            full_name,
            email
          )
        `)
        .eq('id', offerId)
        .single();

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        throw new Error('Oferta no encontrada');
      }

      // Transform data to match WaitlistOfferWithDetails type
      const spotData = data.parking_spot as any;
      const groupData = (data as any).parking_group?.[0]?.parking_groups;

      return {
        ...data,
        parking_spot: spotData,
        parking_group: groupData,
        waitlist_entry: data.waitlist_entry as any,
        user: data.user as any
      } as WaitlistOfferWithDetails;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al obtener detalles de la oferta');
      setError(error);
      console.error('Error en getOfferDetails:', err);
      throw error;
    }
  };

  /**
   * Calculate time remaining for an offer
   * 
   * @param expiresAt - ISO timestamp when the offer expires
   * @returns Object with time remaining in different units
   * 
   * @example
   * ```tsx
   * const timeRemaining = getTimeRemaining(offer.expires_at);
   * console.log(timeRemaining.minutes); // 45
   * console.log(timeRemaining.isExpired); // false
   * ```
   */
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();

    // Check if expired
    if (diffMs <= 0) {
      return {
        milliseconds: 0,
        seconds: 0,
        minutes: 0,
        hours: 0,
        isExpired: true,
        formattedTime: 'Expirado'
      };
    }

    // Calculate time units
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    // Format time remaining
    let formattedTime = '';
    if (hours > 0) {
      formattedTime = `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      formattedTime = `${minutes}m ${seconds % 60}s`;
    } else {
      formattedTime = `${seconds}s`;
    }

    return {
      milliseconds: diffMs,
      seconds,
      minutes,
      hours,
      isExpired: false,
      formattedTime
    };
  };

  return {
    pendingOffers,
    isLoading,
    error,
    getOfferDetails,
    getTimeRemaining
  };
};
