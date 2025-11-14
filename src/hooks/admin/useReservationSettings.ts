import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ReservationSettings } from "@/types/admin";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { OfflineStorageService } from "@/lib/offlineStorage";

/**
 * Custom hook for managing global reservation settings
 * 
 * Controls application-wide reservation rules:
 * - Advance reservation days: How far in advance users can book
 * - Daily refresh hour: When the reservation window "rolls forward"
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} Reservation settings state and operations
 * @returns {ReservationSettings} settings - Current reservation settings
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadSettings - Loads settings from DB (with cache)
 * @returns {Function} saveSettings - Saves settings to DB
 * @returns {Function} updateSettings - Updates local state without saving
 * 
 * @example
 * ```tsx
 * const {
 *   settings,
 *   loading,
 *   updateSettings,
 *   saveSettings
 * } = useReservationSettings();
 * 
 * useEffect(() => {
 *   loadSettings();
 * }, []);
 * 
 * const handleSave = async () => {
 *   const success = await saveSettings({
 *     advance_reservation_days: 14,
 *     daily_refresh_hour: 9
 *   });
 * };
 * ```
 */
export const useReservationSettings = () => {
  const [settings, setSettings] = useState<ReservationSettings>({
    advance_reservation_days: 7,
    daily_refresh_hour: 10
  });
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);
  const { isOnline } = useOfflineMode();
  const storage = new OfflineStorageService();

  const loadSettings = async (forceReload = false) => {
    // Si ya está en caché y no se fuerza la recarga, no hacer nada
    if (isCached.current && !forceReload) {
      return;
    }

    const cacheKey = 'admin_reservation_settings';

    try {
      setLoading(true);

      // Si estamos offline, cargar desde cache
      if (!isOnline) {
        const cached = await storage.get<ReservationSettings>(cacheKey);
        if (cached) {
          setSettings(cached);
          toast.warning("Funcionalidad limitada sin conexión", {
            description: "Solo puedes ver datos. Conéctate para realizar cambios."
          });
          isCached.current = true;
          return;
        }
        toast.error("No hay configuración en caché");
        return;
      }

      // Modo online: cargar desde Supabase
      const { data, error } = await supabase
        .from("reservation_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        const settingsData = {
          advance_reservation_days: data.advance_reservation_days,
          daily_refresh_hour: data.daily_refresh_hour
        };
        setSettings(settingsData);
        
        // Cachear datos
        await storage.set(cacheKey, settingsData, {
          dataType: 'admin_reservation_settings',
          userId: 'admin'
        });
        await storage.recordSync(cacheKey);
      }
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading settings:", error);
      
      // Si falla online, intentar cache
      const cached = await storage.get<ReservationSettings>(cacheKey);
      if (cached) {
        setSettings(cached);
        toast.warning("Mostrando datos en caché", {
          description: "No se pudo conectar al servidor"
        });
        isCached.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: ReservationSettings) => {
    if (!isOnline) {
      toast.error("No puedes guardar configuración sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

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
    isOnline,
    canModify: isOnline,
  };
};
