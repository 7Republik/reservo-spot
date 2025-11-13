import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ParkingGroupCheckinConfig, UseGroupCheckinConfigReturn } from '@/types/checkin.types';

/**
 * Custom hook for managing check-in configuration per parking group
 * 
 * Provides operations for:
 * - Loading group-specific check-in configuration
 * - Updating group check-in settings (enabled, custom window)
 * - Managing custom vs global configuration
 * 
 * **Caching**: Implements automatic caching per group to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} Group check-in config state and operations
 * @returns {ParkingGroupCheckinConfig|null} config - Group check-in configuration
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadGroupConfig - Loads config for specific group (with cache)
 * @returns {Function} updateGroupConfig - Updates group check-in configuration
 * 
 * @example
 * ```tsx
 * const {
 *   config,
 *   loading,
 *   loadGroupConfig,
 *   updateGroupConfig
 * } = useGroupCheckinConfig();
 * 
 * useEffect(() => {
 *   loadGroupConfig(groupId);
 * }, [groupId]);
 * 
 * const handleToggleEnabled = async () => {
 *   await updateGroupConfig(groupId, {
 *     enabled: !config.enabled
 *   });
 * };
 * ```
 */
export const useGroupCheckinConfig = (): UseGroupCheckinConfigReturn => {
  const [config, setConfig] = useState<ParkingGroupCheckinConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const cachedGroupId = useRef<string | null>(null);
  const isCached = useRef(false);

  /**
   * Loads check-in configuration for a specific parking group
   * 
   * If no configuration exists for the group, returns null.
   * Groups without configuration use global settings by default.
   * 
   * @param {string} groupId - Parking group UUID
   * @param {boolean} forceReload - If true, bypasses cache and fetches fresh data
   * @returns {Promise<void>}
   */
  const loadGroupConfig = async (groupId: string, forceReload = false) => {
    // Si ya está en caché para este grupo y no se fuerza la recarga, no hacer nada
    if (isCached.current && cachedGroupId.current === groupId && !forceReload) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parking_group_checkin_config')
        .select('*')
        .eq('group_id', groupId)
        .maybeSingle(); // Puede no existir configuración para el grupo

      if (error) throw error;
      
      setConfig(data);
      cachedGroupId.current = groupId;
      isCached.current = true;
    } catch (err) {
      console.error('Error loading group checkin config:', err);
      toast.error('Error al cargar configuración de check-in del grupo');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates check-in configuration for a parking group
   * 
   * If no configuration exists, creates a new one.
   * If configuration exists, updates the existing record.
   * 
   * Supports partial updates:
   * - enabled: Enable/disable check-in for this group
   * - use_custom_config: Use custom settings vs global settings
   * - custom_checkin_window_hours: Custom check-in window (1-24 hours)
   * 
   * @param {string} groupId - Parking group UUID
   * @param {Partial<ParkingGroupCheckinConfig>} updates - Configuration updates
   * @returns {Promise<void>}
   */
  const updateGroupConfig = async (
    groupId: string,
    updates: Partial<ParkingGroupCheckinConfig>
  ) => {
    setLoading(true);
    try {
      // Verificar si ya existe configuración para este grupo
      const { data: existingConfig } = await supabase
        .from('parking_group_checkin_config')
        .select('id')
        .eq('group_id', groupId)
        .maybeSingle();

      if (existingConfig) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('parking_group_checkin_config')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('group_id', groupId);

        if (error) throw error;
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('parking_group_checkin_config')
          .insert({
            group_id: groupId,
            enabled: updates.enabled ?? true,
            use_custom_config: updates.use_custom_config ?? false,
            custom_checkin_window_hours: updates.custom_checkin_window_hours ?? null,
          });

        if (error) throw error;
      }

      toast.success('Configuración de check-in actualizada correctamente');
      await loadGroupConfig(groupId, true); // Invalidar caché
    } catch (err) {
      console.error('Error updating group checkin config:', err);
      toast.error('Error al actualizar configuración de check-in del grupo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    loadGroupConfig,
    updateGroupConfig
  };
};
