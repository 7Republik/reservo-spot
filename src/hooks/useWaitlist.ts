import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WaitlistEntry } from '@/types/waitlist';

/**
 * Custom hook for managing user waitlist operations
 * 
 * Provides functions for:
 * - Registering in waitlist for specific groups and dates
 * - Canceling waitlist entries
 * - Getting user's active waitlist entries
 * - Accepting waitlist offers
 * - Rejecting waitlist offers
 * 
 * All operations include error handling, toast notifications,
 * and automatic query invalidation for UI updates.
 * 
 * @returns {Object} Waitlist operations and state
 * @returns {Function} registerInWaitlist - Register user in waitlist
 * @returns {Function} cancelWaitlistEntry - Cancel a waitlist entry
 * @returns {Function} getUserWaitlistEntries - Get user's active entries
 * @returns {Function} acceptOffer - Accept a waitlist offer
 * @returns {Function} rejectOffer - Reject a waitlist offer
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {string | null} error - Error message if any
 * 
 * @example
 * ```tsx
 * const {
 *   registerInWaitlist,
 *   cancelWaitlistEntry,
 *   getUserWaitlistEntries,
 *   acceptOffer,
 *   rejectOffer,
 *   isLoading
 * } = useWaitlist();
 * 
 * // Register in waitlist
 * await registerInWaitlist(['group-id-1', 'group-id-2'], '2025-11-20');
 * 
 * // Accept offer
 * await acceptOffer('offer-id');
 * ```
 */
export const useWaitlist = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  /**
   * Register user in waitlist for multiple groups and a specific date
   * 
   * @param groupIds - Array of parking group IDs
   * @param date - Reservation date (YYYY-MM-DD format)
   * @returns Promise that resolves when registration is complete
   * 
   * @throws Error if user is not authenticated
   * @throws Error if registration fails for any group
   */
  const registerInWaitlist = async (groupIds: string[], date: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Register in each group
      const results = await Promise.allSettled(
        groupIds.map(async (groupId) => {
          const { data, error: rpcError } = await supabase.rpc('register_in_waitlist', {
            p_user_id: user.id,
            p_group_id: groupId,
            p_date: date
          });

          if (rpcError) {
            throw rpcError;
          }

          // The function returns a table with one row
          const result = Array.isArray(data) ? data[0] : data;

          if (!result?.success) {
            throw new Error(result?.message || 'Error al registrarse en lista de espera');
          }

          return result;
        })
      );

      // Check results
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      if (successful.length > 0) {
        const firstSuccess = (successful[0] as PromiseFulfilledResult<any>).value;
        
        if (successful.length === groupIds.length) {
          toast.success(
            `Registrado en ${successful.length} lista${successful.length > 1 ? 's' : ''} de espera`,
            {
              description: `Posición en cola: ${firstSuccess.queue_position || 'calculando...'}`
            }
          );
        } else {
          toast.warning(
            `Registrado en ${successful.length} de ${groupIds.length} listas`,
            {
              description: 'Algunas listas no pudieron ser registradas'
            }
          );
        }
      }

      if (failed.length > 0) {
        const firstError = (failed[0] as PromiseRejectedResult).reason;
        const errorMessage = firstError instanceof Error 
          ? firstError.message 
          : 'Error al registrarse en algunas listas';
        
        if (successful.length === 0) {
          throw new Error(errorMessage);
        } else {
          console.error('Algunos registros fallaron:', failed);
        }
      }

      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries'] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist-entries'] });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse en lista de espera';
      setError(message);
      toast.error(message);
      console.error('Error en registerInWaitlist:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel a waitlist entry
   * 
   * @param entryId - ID of the waitlist entry to cancel
   * @returns Promise that resolves when cancellation is complete
   * 
   * @throws Error if user is not authenticated
   * @throws Error if cancellation fails
   */
  const cancelWaitlistEntry = async (entryId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Call cancel function
      const { data, error: rpcError } = await supabase.rpc('cancel_waitlist_entry', {
        p_entry_id: entryId,
        p_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      // The function returns a table with one row
      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.success) {
        throw new Error(result?.message || 'Error al cancelar registro en lista de espera');
      }

      toast.success('Registro en lista de espera cancelado');

      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries'] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist-entries'] });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cancelar registro';
      setError(message);
      toast.error(message);
      console.error('Error en cancelWaitlistEntry:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user's active waitlist entries
   * 
   * @returns Promise that resolves with array of waitlist entries
   * 
   * @throws Error if user is not authenticated
   * @throws Error if query fails
   */
  const getUserWaitlistEntries = async (): Promise<WaitlistEntry[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Query active entries
      const { data, error: queryError } = await supabase
        .from('waitlist_entries')
        .select(`
          *,
          parking_groups(
            id,
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'offer_pending'])
        .order('created_at', { ascending: true });

      if (queryError) {
        throw queryError;
      }

      return data || [];
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener entradas de lista de espera';
      setError(message);
      console.error('Error en getUserWaitlistEntries:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Accept a waitlist offer
   * 
   * Creates a reservation and removes user from all waitlists
   * 
   * @param offerId - ID of the offer to accept
   * @returns Promise that resolves with the created reservation ID
   * 
   * @throws Error if user is not authenticated
   * @throws Error if offer is expired or invalid
   * @throws Error if spot is no longer available
   */
  const acceptOffer = async (offerId: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Call accept function
      const { data: reservationId, error: rpcError } = await supabase.rpc('accept_waitlist_offer', {
        p_offer_id: offerId,
        p_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      if (!reservationId) {
        throw new Error('No se pudo crear la reserva');
      }

      toast.success('¡Oferta aceptada!', {
        description: 'Tu reserva ha sido confirmada. Has sido eliminado de todas las listas de espera.'
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries'] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist-entries'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-offers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-offers'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      return reservationId;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aceptar oferta';
      setError(message);
      toast.error(message);
      console.error('Error en acceptOffer:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reject a waitlist offer
   * 
   * Keeps user in waitlist and processes next user in queue
   * May apply penalty if enabled in settings
   * 
   * @param offerId - ID of the offer to reject
   * @returns Promise that resolves when rejection is complete
   * 
   * @throws Error if user is not authenticated
   * @throws Error if offer is invalid or already responded
   */
  const rejectOffer = async (offerId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Call reject function
      const { error: rpcError } = await supabase.rpc('reject_waitlist_offer', {
        p_offer_id: offerId,
        p_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      toast.info('Oferta rechazada', {
        description: 'Sigues en la lista de espera. La plaza se ofrecerá al siguiente usuario.'
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['waitlist-entries'] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist-entries'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-offers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-offers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al rechazar oferta';
      setError(message);
      toast.error(message);
      console.error('Error en rejectOffer:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    registerInWaitlist,
    cancelWaitlistEntry,
    getUserWaitlistEntries,
    acceptOffer,
    rejectOffer,
    isLoading,
    error
  };
};
