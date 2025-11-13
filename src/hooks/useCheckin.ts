import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckinResult {
  success: boolean;
  error?: string;
  checkin_at?: string;
  checkout_at?: string;
  was_late?: boolean;
}

interface UseCheckinReturn {
  checkin: (reservationId: string) => Promise<void>;
  checkout: (reservationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useCheckin = (): UseCheckinReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const checkin = async (reservationId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Llamar a la función RPC perform_checkin
      const { data, error: rpcError } = await supabase.rpc('perform_checkin', {
        p_reservation_id: reservationId,
        p_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      const result = data as unknown as CheckinResult;

      if (!result.success) {
        throw new Error(result.error || 'Error al realizar check-in');
      }

      // Mostrar mensaje apropiado según si fue tardío o no
      if (result.was_late) {
        toast.warning('Check-in realizado fuera de tiempo. Se ha registrado una infracción.');
      } else {
        toast.success('Check-in realizado correctamente');
      }

      // Invalidar queries relevantes para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['today-reservation'] });
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['user-checkins'] });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al realizar check-in';
      setError(message);
      toast.error(message);
      console.error('Error en check-in:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (reservationId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Llamar a la función RPC perform_checkout
      const { data, error: rpcError } = await supabase.rpc('perform_checkout', {
        p_reservation_id: reservationId,
        p_user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      const result = data as unknown as CheckinResult;

      if (!result.success) {
        throw new Error(result.error || 'Error al realizar check-out');
      }

      toast.success('Check-out realizado. La plaza está disponible para otros usuarios.');

      // Invalidar queries relevantes para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['today-reservation'] });
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['user-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['available-spots'] });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al realizar check-out';
      setError(message);
      toast.error(message);
      console.error('Error en check-out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkin,
    checkout,
    isLoading,
    error
  };
};
