import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCanvasLockState, setCanvasLockState, getHandToolState, setHandToolState } from "@/lib/visualEditorStorage";
import type { ParkingSpot, ParkingGroup } from "@/types/admin";

/**
 * Debounce utility function
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Custom hook for visual parking map editor
 * 
 * Manages the interactive visual editor where admins can:
 * - Place parking spots on a floor plan image by clicking
 * - Edit spot attributes (number, accessible, charger, compact)
 * - Delete spots from the map
 * - Adjust spot button size (persisted to `parking_groups.button_size`)
 * - Toggle drawing mode for rapid spot creation
 * - Lock/unlock canvas for zoom vs scroll behavior
 * 
 * **No Caching**: This hook doesn't implement caching as it's used in a single
 * editing session. Spots are always reloaded after mutations for accuracy.
 * 
 * **Coordinates**: Stores X,Y positions relative to floor plan natural size.
 * Used by both admin editor and user map view with `react-zoom-pan-pinch`.
 * 
 * **Canvas Lock**: When locked, scroll wheel zooms the canvas. When unlocked,
 * scroll wheel scrolls the page normally. State persisted in sessionStorage.
 * 
 * @returns {Object} Visual editor state and operations
 * @returns {ParkingGroup|null} selectedGroup - Currently selected parking group
 * @returns {Function} setSelectedGroup - Sets the selected group
 * @returns {ParkingSpot[]} spots - Spots in the selected group
 * @returns {boolean} isDrawingMode - Whether drawing mode is active
 * @returns {Function} setIsDrawingMode - Toggles drawing mode
 * @returns {number} spotButtonSize - Current button size in pixels (16-64)
 * @returns {Function} setSpotButtonSize - Sets button size locally
 * @returns {Object} floorPlanDimensions - Floor plan image dimensions {width, height}
 * @returns {Function} setFloorPlanDimensions - Sets floor plan dimensions
 * @returns {boolean} loading - Loading state indicator
 * @returns {boolean} isCanvasLocked - Whether canvas is locked for zoom
 * @returns {boolean} isHandToolActive - Whether hand tool is active for panning
 * @returns {Object|null} ghostPosition - Ghost preview position {x, y} in percentage
 * @returns {Function} setGhostPosition - Sets ghost preview position
 * @returns {Object} dragState - Drag state {isDragging, spotId, startPosition, currentPosition}
 * @returns {Function} setDragState - Sets drag state
 * @returns {Function} toggleCanvasLock - Toggles canvas lock state
 * @returns {Function} toggleHandTool - Toggles hand tool state
 * @returns {Function} loadEditorSpots - Loads spots for selected group
 * @returns {Function} updateButtonSize - Saves button size to DB
 * @returns {Function} createSpot - Creates spot at X,Y coordinates
 * @returns {Function} updateSpot - Updates spot attributes
 * @returns {Function} deleteSpot - Deletes a spot
 * @returns {Function} updateSpotPosition - Updates spot position after drag & drop
 * 
 * @example
 * ```tsx
 * const {
 *   selectedGroup,
 *   setSelectedGroup,
 *   spots,
 *   isDrawingMode,
 *   isCanvasLocked,
 *   toggleCanvasLock,
 *   createSpot,
 *   spotButtonSize,
 *   updateButtonSize
 * } = useVisualEditor();
 * 
 * const handleMapClick = async (x: number, y: number) => {
 *   if (isDrawingMode) {
 *     await createSpot(x, y);
 *   }
 * };
 * 
 * const handleSizeChange = (newSize: number) => {
 *   updateButtonSize(newSize); // Saves to DB
 * };
 * ```
 */
export const useVisualEditor = () => {
  const [selectedGroup, setSelectedGroup] = useState<ParkingGroup | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [spotButtonSize, setSpotButtonSize] = useState(32);
  const [floorPlanDimensions, setFloorPlanDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);
  
  // Canvas lock state - persisted in sessionStorage
  const [isCanvasLocked, setIsCanvasLocked] = useState(() => getCanvasLockState());

  // Hand tool state - persisted in sessionStorage
  const [isHandToolActive, setIsHandToolActive] = useState(() => getHandToolState());

  // Ghost preview position for drawing mode
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);

  // Drag state for moving spots
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    spotId: string | null;
    startPosition: { x: number; y: number } | null;
    currentPosition: { x: number; y: number } | null;
  }>({
    isDragging: false,
    spotId: null,
    startPosition: null,
    currentPosition: null,
  });

  // Track last created spot ID for animation
  const [lastCreatedSpotId, setLastCreatedSpotId] = useState<string | null>(null);

  const loadEditorSpots = async (groupId: string) => {
    try {
      setLoading(true);
      
      // Load group with button_size
      const { data: groupData, error: groupError } = await supabase
        .from("parking_groups")
        .select("button_size")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      
      setSpotButtonSize(groupData?.button_size || 32);

      // Load spots for the group
      const { data, error } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("group_id", groupId)
        .order("spot_number");

      if (error) throw error;
      setSpots(data || []);
    } catch (error: any) {
      console.error("Error loading editor spots:", error);
      toast.error("Error al cargar las plazas del grupo");
    } finally {
      setLoading(false);
    }
  };

  // Función interna para guardar en DB (sin debounce)
  const saveButtonSizeToDB = async (newSize: number, groupId: string) => {
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ button_size: newSize })
        .eq("id", groupId);

      if (error) {
        console.error("Error updating button size:", error);
        
        // Mensajes específicos según el tipo de error
        if (error.code === '23514') {
          toast.error("Tamaño inválido. Debe estar entre 12 y 64 píxeles.");
        } else if (error.code === '23503') {
          toast.error("El grupo no existe. Selecciona otro grupo.");
        } else if (error.code === '42501') {
          toast.error("No tienes permisos para cambiar el tamaño. El cambio visual se mantendrá en esta sesión.");
        } else {
          toast.error("Error al guardar el tamaño en la base de datos. El cambio visual se mantendrá en esta sesión.");
        }
        return;
      }
    } catch (error: any) {
      console.error("Unexpected error updating button size:", error);
      toast.error("Error inesperado al guardar el tamaño. El cambio visual se mantendrá en esta sesión.");
    }
  };

  // Crear versión debounced de la función de guardado (300ms)
  const debouncedSaveToDB = useMemo(
    () => debounce(saveButtonSizeToDB, 300),
    []
  );

  const updateButtonSize = useCallback((newSize: number) => {
    // Actualizar estado inmediatamente para feedback visual instantáneo
    setSpotButtonSize(newSize);
    
    // Guardar en DB con debounce para reducir llamadas
    if (selectedGroup) {
      debouncedSaveToDB(newSize, selectedGroup.id);
    }
  }, [selectedGroup, debouncedSaveToDB]);

  const createSpot = async (x: number, y: number) => {
    // Validación: Sin grupo seleccionado
    if (!selectedGroup) {
      toast.error("No hay grupo seleccionado. Selecciona un grupo primero para crear plazas.");
      return false;
    }

    // Validación: Límite de plazas alcanzado
    if (spots.length >= selectedGroup.capacity) {
      toast.error(`Límite alcanzado: ${selectedGroup.capacity} plazas máximo. Elimina plazas existentes o aumenta la capacidad del grupo.`);
      // Deshabilitar modo dibujo automáticamente
      setIsDrawingMode(false);
      return false;
    }

    try {
      // Get the highest spot number GLOBALLY with this prefix to ensure uniqueness
      const groupPrefix = selectedGroup.name.substring(0, 2).toUpperCase();
      
      const { data: allSpots, error: countError } = await supabase
        .from("parking_spots")
        .select("spot_number")
        .like("spot_number", `${groupPrefix}-%`);

      if (countError) {
        console.error("Error counting spots:", countError);
        toast.error("Error al verificar plazas existentes. Inténtalo de nuevo.");
        return false;
      }

      // Extract numeric part from all spots with this prefix and find the max
      let maxNumber = 0;
      if (allSpots && allSpots.length > 0) {
        allSpots.forEach(spot => {
          const match = spot.spot_number.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) maxNumber = num;
          }
        });
      }

      const nextNumber = maxNumber + 1;
      const nextSpotNumber = `${groupPrefix}-${nextNumber}`;

      const { data, error } = await supabase
        .from("parking_spots")
        .insert([{
          spot_number: nextSpotNumber,
          group_id: selectedGroup.id,
          position_x: parseFloat(x.toFixed(2)),
          position_y: parseFloat(y.toFixed(2)),
          is_active: true,
          is_accessible: false,
          has_charger: false,
          is_compact: false,
        }])
        .select()
        .single();

      if (error) {
        console.error("Error inserting spot:", error);
        
        // Mensajes específicos según el tipo de error
        if (error.code === '23505') {
          toast.error(`La plaza ${nextSpotNumber} ya existe. Recarga la página e inténtalo de nuevo.`);
        } else if (error.code === '23503') {
          toast.error("El grupo seleccionado no existe. Selecciona otro grupo.");
        } else {
          toast.error("Error al crear la plaza. Verifica tu conexión e inténtalo de nuevo.");
        }
        return false;
      }

      toast.success(`Plaza ${nextSpotNumber} creada`);
      
      // Set the last created spot ID for animation
      setLastCreatedSpotId(data.id);
      
      // Clear the animation flag after animation completes (300ms)
      setTimeout(() => {
        setLastCreatedSpotId(null);
      }, 300);
      
      await loadEditorSpots(selectedGroup.id);
      
      // Si después de crear alcanzamos el límite, deshabilitar modo dibujo
      if (spots.length + 1 >= selectedGroup.capacity) {
        setIsDrawingMode(false);
        toast.info("Límite de plazas alcanzado. Modo dibujo desactivado.");
      }
      
      return true;
    } catch (error: any) {
      console.error("Unexpected error creating spot:", error);
      toast.error("Error inesperado al crear la plaza. Inténtalo de nuevo.");
      return false;
    }
  };

  const updateSpot = async (
    spotId: string,
    updates: {
      spot_number?: string;
      is_accessible?: boolean;
      has_charger?: boolean;
      is_compact?: boolean;
    }
  ) => {
    try {
      const { error } = await supabase
        .from("parking_spots")
        .update(updates)
        .eq("id", spotId);

      if (error) throw error;

      toast.success("Atributos actualizados");
      if (selectedGroup) {
        await loadEditorSpots(selectedGroup.id);
      }
      return true;
    } catch (error: any) {
      console.error("Error updating spot:", error);
      toast.error("Error al actualizar la plaza");
      return false;
    }
  };

  const deleteSpot = async (spotId: string) => {
    try {
      const { error } = await supabase
        .from("parking_spots")
        .delete()
        .eq("id", spotId);

      if (error) throw error;

      toast.success("Plaza eliminada");
      if (selectedGroup) {
        await loadEditorSpots(selectedGroup.id);
        
        // Si había límite alcanzado y ahora hay espacio, informar al usuario
        // (no reactivamos automáticamente el modo dibujo para no interrumpir el flujo)
        if (spots.length === selectedGroup.capacity) {
          toast.info("Ahora puedes crear más plazas. Activa el modo dibujo.");
        }
      }
      return true;
    } catch (error: any) {
      console.error("Error deleting spot:", error);
      toast.error("Error al eliminar la plaza");
      return false;
    }
  };

  /**
   * Update spot position after drag & drop
   * @param spotId - ID of the spot to move
   * @param x - New X position (percentage)
   * @param y - New Y position (percentage)
   * @returns Success status
   */
  const updateSpotPosition = async (spotId: string, x: number, y: number) => {
    // Guardar posición original para revertir en caso de error
    const originalSpot = spots.find(s => s.id === spotId);
    
    try {
      const { error } = await supabase
        .from("parking_spots")
        .update({
          position_x: parseFloat(x.toFixed(2)),
          position_y: parseFloat(y.toFixed(2)),
        })
        .eq("id", spotId);

      if (error) {
        console.error("Error updating spot position:", error);
        
        // Mensajes específicos según el tipo de error
        if (error.code === '23503') {
          toast.error("La plaza no existe. Recarga la página.");
        } else if (error.code === '42501') {
          toast.error("No tienes permisos para mover esta plaza.");
        } else {
          toast.error("Error al mover la plaza. La posición se ha revertido. Verifica tu conexión e inténtalo de nuevo.");
        }
        
        // Recargar spots para revertir a posición original
        if (selectedGroup) {
          await loadEditorSpots(selectedGroup.id);
        }
        return false;
      }

      toast.success("Posición actualizada");
      if (selectedGroup) {
        await loadEditorSpots(selectedGroup.id);
      }
      return true;
    } catch (error: any) {
      console.error("Unexpected error updating spot position:", error);
      toast.error("Error inesperado al mover la plaza. La posición se ha revertido.");
      
      // Recargar spots para revertir a posición original
      if (selectedGroup) {
        await loadEditorSpots(selectedGroup.id);
      }
      return false;
    }
  };

  /**
   * Toggle canvas lock state
   * When locked: scroll wheel zooms the canvas
   * When unlocked: scroll wheel scrolls the page normally
   */
  const toggleCanvasLock = useCallback(() => {
    setIsCanvasLocked(prev => {
      const newValue = !prev;
      setCanvasLockState(newValue);
      return newValue;
    });
  }, []);

  /**
   * Toggle hand tool state
   * When active: allows panning the canvas without interacting with spots
   * Disables spot creation and selection
   */
  const toggleHandTool = useCallback(() => {
    setIsHandToolActive(prev => {
      const newValue = !prev;
      setHandToolState(newValue);
      return newValue;
    });
  }, []);

  return {
    selectedGroup,
    setSelectedGroup,
    spots,
    isDrawingMode,
    setIsDrawingMode,
    spotButtonSize,
    setSpotButtonSize,
    floorPlanDimensions,
    setFloorPlanDimensions,
    loading,
    isCanvasLocked,
    isHandToolActive,
    ghostPosition,
    setGhostPosition,
    dragState,
    setDragState,
    lastCreatedSpotId,
    toggleCanvasLock,
    toggleHandTool,
    loadEditorSpots,
    updateButtonSize,
    createSpot,
    updateSpot,
    deleteSpot,
    updateSpotPosition,
  };
};
