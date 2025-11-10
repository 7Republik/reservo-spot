import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ReservationSettings } from "@/types/admin";

export const useReservationSettings = () => {
  const [settings, setSettings] = useState<ReservationSettings>({
    advance_reservation_days: 7,
    daily_refresh_hour: 10
  });
  const [loading, setLoading] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reservation_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          advance_reservation_days: data.advance_reservation_days,
          daily_refresh_hour: data.daily_refresh_hour
        });
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: ReservationSettings) => {
    try {
      const { error } = await supabase
        .from("reservation_settings")
        .update({
          advance_reservation_days: newSettings.advance_reservation_days,
          daily_refresh_hour: newSettings.daily_refresh_hour
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;
      toast.success("Configuración actualizada correctamente");
      setSettings(newSettings);
      return true;
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar configuración");
      return false;
    }
  };

  const updateSettings = (updates: Partial<ReservationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return {
    settings,
    loading,
    loadSettings,
    saveSettings,
    updateSettings,
  };
};
