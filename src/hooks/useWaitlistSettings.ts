import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { WaitlistSettings, WaitlistSettingsUpdate } from "@/types/waitlist";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { OfflineStorageService } from "@/lib/offlineStorage";

/**
 * Custom hook for managing waitlist system settings
 * 
 * Controls waitlist configuration:
 * - Enable/disable waitlist system globally
 * - Acceptance time for offers (30-1440 minutes)
 * - Maximum simultaneous waitlists per user (1-10)
 * - Priority by role in queue
 * - Penalty system for non-responses
 * - Penalty threshold and duration
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} Waitlist settings state and operations
 * @returns {WaitlistSettings} settings - Current waitlist settings
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadSettings - Loads settings from DB (with cache)
 * @returns {Function} saveSettings - Saves settings to DB (admin only)
 * @returns {Function} updateSettings - Updates local state without saving
 * @returns {boolean} isOnline - Online status
 * @returns {boolean} canModify - Whether user can modify settings (online + admin)
 * 
 * @example
 * ```tsx
 * const {
 *   settings,
 *   loading,
 *   loadSettings,
 *   updateSettings,
 *   saveSettings
 * } = useWaitlistSettings();
 * 
 * useEffect(() => {
 *   loadSettings();
 * }, []);
 * 
 * const handleSave = async () => {
 *   const success = await saveSettings({
 *     waitlist_enabled: true,
 *     waitlist_acceptance_time_minutes: 120
 *   });
 * };
 * ```
 */
export const useWaitlistSettings = () => {
  const [settings, setSettings] = useState<WaitlistSettings>({
    waitlist_enabled: false,
    waitlist_acceptance_time_minutes: 120,
    waitlist_max_simultaneous: 5,
    waitlist_priority_by_role: false,
    waitlist_penalty_enabled: false,
    waitlist_penalty_threshold: 3,
    waitlist_penalty_duration_days: 7,
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

    const cacheKey = 'admin_waitlist_settings';

    try {
      setLoading(true);

      // Si estamos offline, cargar desde cache
      if (!isOnline) {
        const cached = await storage.get<WaitlistSettings>(cacheKey);
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
        .select(`
          waitlist_enabled,
          waitlist_acceptance_time_minutes,
          waitlist_max_simultaneous,
          waitlist_priority_by_role,
          waitlist_penalty_enabled,
          waitlist_penalty_threshold,
          waitlist_penalty_duration_days
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        const settingsData: WaitlistSettings = {
          waitlist_enabled: data.waitlist_enabled ?? false,
          waitlist_acceptance_time_minutes: data.waitlist_acceptance_time_minutes ?? 120,
          waitlist_max_simultaneous: data.waitlist_max_simultaneous ?? 5,
          waitlist_priority_by_role: data.waitlist_priority_by_role ?? false,
          waitlist_penalty_enabled: data.waitlist_penalty_enabled ?? false,
          waitlist_penalty_threshold: data.waitlist_penalty_threshold ?? 3,
          waitlist_penalty_duration_days: data.waitlist_penalty_duration_days ?? 7,
        };
        
        setSettings(settingsData);
        
        // Cachear datos
        await storage.set(cacheKey, settingsData, {
          dataType: 'admin_waitlist_settings',
          userId: 'admin'
        });
        await storage.recordSync(cacheKey);
      }
      
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading waitlist settings:", error);
      
      // Si falla online, intentar cache
      const cached = await storage.get<WaitlistSettings>(cacheKey);
      if (cached) {
        setSettings(cached);
        toast.warning("Mostrando datos en caché", {
          description: "No se pudo conectar al servidor"
        });
        isCached.current = true;
      } else {
        toast.error("Error al cargar configuración de lista de espera");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: WaitlistSettingsUpdate) => {
    if (!isOnline) {
      toast.error("No puedes guardar configuración sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    try {
      // Validar rangos antes de guardar
      if (newSettings.waitlist_acceptance_time_minutes !== undefined) {
        if (newSettings.waitlist_acceptance_time_minutes < 30 || newSettings.waitlist_acceptance_time_minutes > 1440) {
          toast.error("Tiempo de aceptación debe estar entre 30 y 1440 minutos");
          return false;
        }
      }

      if (newSettings.waitlist_max_simultaneous !== undefined) {
        if (newSettings.waitlist_max_simultaneous < 1 || newSettings.waitlist_max_simultaneous > 10) {
          toast.error("Máximo de listas simultáneas debe estar entre 1 y 10");
          return false;
        }
      }

      if (newSettings.waitlist_penalty_threshold !== undefined) {
        if (newSettings.waitlist_penalty_threshold < 2 || newSettings.waitlist_penalty_threshold > 10) {
          toast.error("Umbral de penalización debe estar entre 2 y 10");
          return false;
        }
      }

      if (newSettings.waitlist_penalty_duration_days !== undefined) {
        if (newSettings.waitlist_penalty_duration_days < 1 || newSettings.waitlist_penalty_duration_days > 30) {
          toast.error("Duración de bloqueo debe estar entre 1 y 30 días");
          return false;
        }
      }

      const { error } = await supabase
        .from("reservation_settings")
        .update(newSettings)
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;

      toast.success("Configuración de lista de espera actualizada correctamente");
      
      // Actualizar estado local con los nuevos valores
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // Invalidar cache para forzar recarga en próxima consulta
      isCached.current = false;
      
      return true;
    } catch (error: any) {
      console.error("Error saving waitlist settings:", error);
      toast.error("Error al guardar configuración de lista de espera");
      return false;
    }
  };

  const updateSettings = (updates: WaitlistSettingsUpdate) => {
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
