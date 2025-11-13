import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckinSettings, UseCheckinSettingsReturn } from '@/types/checkin.types';

export const useCheckinSettings = (): UseCheckinSettingsReturn => {
  const [settings, setSettings] = useState<CheckinSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  const loadSettings = async (forceReload = false) => {
    if (isCached.current && !forceReload) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkin_settings')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();
      
      if (error) throw error;
      setSettings(data);
      isCached.current = true;
    } catch (err) {
      console.error('Error loading checkin settings:', err);
      toast.error('Error al cargar configuración de check-in');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CheckinSettings>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('checkin_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');
      
      if (error) throw error;
      
      toast.success('Configuración actualizada correctamente');
      await loadSettings(true); // Invalidar caché
    } catch (err) {
      console.error('Error updating checkin settings:', err);
      toast.error('Error al actualizar configuración de check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    settings, 
    loading, 
    loadSettings, 
    updateSettings 
  };
};
