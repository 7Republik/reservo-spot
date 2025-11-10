import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParkingSpot } from "@/types/admin";

/**
 * Custom hook for managing individual parking spots
 * 
 * Provides spot management operations including:
 * - Loading all spots with their parking group info
 * - Adding new spots with attributes (accessible, charger, compact)
 * - Toggling spot active/inactive status
 * 
 * **Note**: For visual map editing with coordinates, use `useVisualEditor` instead.
 * This hook is for the "Plazas" tab list view.
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} Parking spots state and operations
 * @returns {ParkingSpot[]} spots - Array of parking spots with group info
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadSpots - Loads all spots from DB (with cache)
 * @returns {Function} addSpot - Creates a new parking spot
 * @returns {Function} toggleSpot - Toggles spot active/inactive status
 * 
 * @example
 * ```tsx
 * const {
 *   spots,
 *   loading,
 *   addSpot,
 *   toggleSpot
 * } = useParkingSpots();
 * 
 * useEffect(() => {
 *   loadSpots();
 * }, []);
 * 
 * const handleAdd = async () => {
 *   const success = await addSpot({
 *     spotNumber: "A-101",
 *     groupId: "group-uuid",
 *     isAccessible: true,
 *     hasCharger: false,
 *     isCompact: false
 *   });
 * };
 * ```
 */
export const useParkingSpots = () => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  const loadSpots = async (forceReload = false) => {
    // Si ya está en caché y no se fuerza la recarga, no hacer nada
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("parking_spots")
        .select(`
          *,
          parking_groups(id, name)
        `)
        .order("spot_number");

      if (error) throw error;
      setSpots(data || []);
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading spots:", error);
      toast.error("Error al cargar las plazas");
    } finally {
      setLoading(false);
    }
  };

  const addSpot = async (spotData: {
    spotNumber: string;
    groupId: string;
    isAccessible: boolean;
    hasCharger: boolean;
    isCompact: boolean;
  }) => {
    if (!spotData.spotNumber.trim()) {
      toast.error("El número de plaza es obligatorio");
      return false;
    }
    
    if (!spotData.groupId) {
      toast.error("Debes seleccionar un grupo de parking");
      return false;
    }

    try {
      const { error } = await supabase
        .from("parking_spots")
        .insert([{
          spot_number: spotData.spotNumber.trim(),
          group_id: spotData.groupId,
          is_accessible: spotData.isAccessible,
          has_charger: spotData.hasCharger,
          is_compact: spotData.isCompact,
          is_active: true,
          visual_size: 'medium',
        }]);

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("Esta plaza ya existe");
        } else {
          throw error;
        }
        return false;
      }

      toast.success("Plaza añadida correctamente");
      loadSpots(true);
      return true;
    } catch (error: any) {
      console.error("Error adding spot:", error);
      toast.error("Error al añadir la plaza");
      return false;
    }
  };

  const toggleSpot = async (spotId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("parking_spots")
        .update({ is_active: !currentStatus })
        .eq("id", spotId);

      if (error) throw error;

      toast.success(`Plaza ${!currentStatus ? "activada" : "desactivada"} correctamente`);
      loadSpots(true);
      return true;
    } catch (error: any) {
      console.error("Error toggling spot:", error);
      toast.error("Error al actualizar la plaza");
      return false;
    }
  };

  return {
    spots,
    loading,
    loadSpots,
    addSpot,
    toggleSpot,
  };
};
