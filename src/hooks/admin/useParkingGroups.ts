import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParkingGroup } from "@/types/admin";

/**
 * Custom hook for managing parking groups in the admin panel
 * 
 * Provides complete CRUD operations for parking groups, including:
 * - Creating and updating groups with floor plan uploads
 * - Toggling active status
 * - Deactivating groups (soft delete with cascade cancellations)
 * - Scheduling future deactivations
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} Parking groups state and operations
 * @returns {ParkingGroup[]} parkingGroups - Array of parking groups
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadParkingGroups - Loads groups from DB (with cache)
 * @returns {Function} createGroup - Creates new group with optional floor plan
 * @returns {Function} updateGroup - Updates existing group
 * @returns {Function} toggleGroupActive - Toggles is_active status
 * @returns {Function} deactivateGroup - Permanently deactivates group (calls DB function)
 * @returns {Function} scheduleDeactivation - Sets future deactivation date
 * @returns {Function} cancelScheduledDeactivation - Cancels scheduled deactivation
 * 
 * @example
 * ```tsx
 * const {
 *   parkingGroups,
 *   loading,
 *   createGroup,
 *   updateGroup
 * } = useParkingGroups();
 * 
 * useEffect(() => {
 *   loadParkingGroups();
 * }, []);
 * 
 * const handleCreate = async () => {
 *   const success = await createGroup(
 *     "Parking A",
 *     "Main building",
 *     50,
 *     floorPlanFile
 *   );
 *   if (success) {
 *     // Groups automatically reloaded
 *   }
 * };
 * ```
 */
export const useParkingGroups = () => {
  const [parkingGroups, setParkingGroups] = useState<ParkingGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  /**
   * Loads all parking groups from database with caching
   * 
   * @param {boolean} forceReload - If true, bypasses cache and fetches fresh data
   * @returns {Promise<void>}
   */
  const loadParkingGroups = async (forceReload = false) => {
    // Si ya está en caché y no se fuerza la recarga, no hacer nada
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("parking_groups")
        .select("*")
        .order("name");

      if (error) throw error;
      setParkingGroups(data || []);
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading parking groups:", error);
      toast.error("Error al cargar grupos de parking");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a new parking group with optional floor plan upload
   * 
   * @param {string} name - Group name (required, unique)
   * @param {string} description - Group description (optional)
   * @param {number} capacity - Total parking spots capacity
   * @param {File|null} floorPlanFile - Floor plan image file (uploaded to Supabase Storage)
   * @param {boolean} isIncidentReserve - Whether this group is reserved for incident reassignments
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const createGroup = async (
    name: string,
    description: string,
    capacity: number,
    floorPlanFile: File | null,
    isIncidentReserve: boolean
  ) => {
    try {
      let floorPlanUrl: string | null = null;

      if (floorPlanFile) {
        const fileName = `${Date.now()}_${floorPlanFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("floor-plans")
          .upload(fileName, floorPlanFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("floor-plans")
          .getPublicUrl(fileName);
        
        floorPlanUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("parking_groups")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          capacity: capacity || 0,
          floor_plan_url: floorPlanUrl,
          is_active: true,
          is_incident_reserve: isIncidentReserve,
        });

      if (error) throw error;
      toast.success("Grupo creado correctamente");
      await loadParkingGroups(true);
      return true;
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast.error("Error al crear el grupo");
      return false;
    }
  };

  /**
   * Updates an existing parking group
   * 
   * @param {string} groupId - Group UUID to update
   * @param {string} name - New group name
   * @param {number} capacity - New capacity
   * @param {File|null} floorPlanFile - New floor plan (if provided, replaces current)
   * @param {string|null} currentFloorPlanUrl - Current floor plan URL (preserved if no new file)
   * @param {boolean} isIncidentReserve - Whether this group is reserved for incident reassignments
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const updateGroup = async (
    groupId: string,
    name: string,
    capacity: number,
    floorPlanFile: File | null,
    currentFloorPlanUrl: string | null,
    isIncidentReserve: boolean
  ) => {
    try {
      let floorPlanUrl = currentFloorPlanUrl;

      if (floorPlanFile) {
        const fileName = `${Date.now()}_${floorPlanFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("floor-plans")
          .upload(fileName, floorPlanFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("floor-plans")
          .getPublicUrl(fileName);
        
        floorPlanUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("parking_groups")
        .update({
          name: name.trim(),
          capacity: capacity || 0,
          floor_plan_url: floorPlanUrl,
          is_incident_reserve: isIncidentReserve,
        })
        .eq("id", groupId);

      if (error) throw error;
      toast.success("Grupo actualizado correctamente");
      await loadParkingGroups(true);
      return true;
    } catch (error: any) {
      console.error("Error updating group:", error);
      toast.error("Error al actualizar el grupo");
      return false;
    }
  };

  /**
   * Toggles the active status of a parking group
   * 
   * @param {string} groupId - Group UUID
   * @param {boolean} isActive - Current active status (will be toggled)
   * @returns {Promise<void>}
   */
  const toggleGroupActive = async (groupId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ is_active: !isActive })
        .eq("id", groupId);

      if (error) throw error;
      toast.success(isActive ? "Grupo desactivado" : "Grupo activado");
      await loadParkingGroups(true);
    } catch (error: any) {
      console.error("Error toggling group status:", error);
      toast.error("Error al cambiar el estado del grupo");
    }
  };

  /**
   * Permanently deactivates a parking group (soft delete)
   * 
   * Calls the `deactivate_parking_group` DB function which:
   * - Marks group as inactive
   * - Deactivates all spots in the group
   * - Cancels all future reservations
   * 
   * @param {string} groupId - Group UUID to deactivate
   * @param {string} reason - Reason for deactivation (stored in DB)
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const deactivateGroup = async (groupId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.rpc('deactivate_parking_group', {
        _group_id: groupId,
        _admin_id: user?.id,
        _reason: reason
      });

      if (error) throw error;

      toast.success(
        "Grupo dado de baja y reservas futuras canceladas",
        { duration: 5000 }
      );
      
      await loadParkingGroups(true);
      return true;
    } catch (error: any) {
      console.error("Error deactivating group:", error);
      toast.error("Error al dar de baja el grupo");
      return false;
    }
  };

  /**
   * Schedules a future deactivation date for a parking group
   * 
   * Prevents new reservations on or after the scheduled date.
   * The group will not be actually deactivated until manual confirmation.
   * 
   * @param {string} groupId - Group UUID
   * @param {Date} scheduledDate - Date when group should be deactivated
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const scheduleDeactivation = async (groupId: string, scheduledDate: Date) => {
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ 
          scheduled_deactivation_date: scheduledDate.toISOString().split('T')[0]
        })
        .eq("id", groupId);

      if (error) throw error;

      toast.success(
        `Desactivación programada correctamente`,
        { duration: 5000 }
      );
      
      await loadParkingGroups(true);
      return true;
    } catch (error: any) {
      console.error("Error scheduling deactivation:", error);
      toast.error("Error al programar desactivación");
      return false;
    }
  };

  /**
   * Cancels a scheduled deactivation for a parking group
   * 
   * @param {string} groupId - Group UUID
   * @returns {Promise<void>}
   */
  const cancelScheduledDeactivation = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ scheduled_deactivation_date: null })
        .eq("id", groupId);

      if (error) throw error;
      toast.success("Desactivación programada cancelada");
      await loadParkingGroups(true);
    } catch (error: any) {
      console.error("Error cancelling scheduled deactivation:", error);
      toast.error("Error al cancelar desactivación programada");
    }
  };

  return {
    parkingGroups,
    loading,
    loadParkingGroups,
    createGroup,
    updateGroup,
    toggleGroupActive,
    deactivateGroup,
    scheduleDeactivation,
    cancelScheduledDeactivation,
  };
};
