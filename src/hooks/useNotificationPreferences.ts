import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  NotificationPreferences, 
  NotificationPreferencesUpdate,
  UseNotificationPreferencesReturn 
} from '@/types/notifications';

export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const queryClient = useQueryClient();

  // Query para obtener preferencias
  const {
    data: preferences,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Si no existen preferencias, crearlas con defaults
      if (error && error.code === 'PGRST116') {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            email_enabled: true,
            email_waitlist_offers: true,
            email_warnings: true,
            email_blocks: true,
            email_reservation_cancelled: true,
            email_incident_reassignment: true,
            email_license_plate_rejected: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPrefs as NotificationPreferences;
      }

      if (error) throw error;
      return data as NotificationPreferences;
    },
    staleTime: 60000, // Cache 1 minuto
  });

  // Mutation para actualizar preferencias
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferencesUpdate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferencias actualizadas correctamente');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Error al actualizar preferencias');
    },
  });

  return {
    preferences: preferences || null,
    loading,
    error: error as Error | null,
    updatePreferences: updatePreferencesMutation.mutate,
    refetch,
  };
};
