import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParkingSpot, ParkingGroup } from "@/types/admin";

export const useVisualEditor = () => {
  const [selectedGroup, setSelectedGroup] = useState<ParkingGroup | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [spotButtonSize, setSpotButtonSize] = useState(32);
  const [floorPlanDimensions, setFloorPlanDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);

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

  const updateButtonSize = async (newSize: number) => {
    setSpotButtonSize(newSize);
    
    if (!selectedGroup) return;
    
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ button_size: newSize })
        .eq("id", selectedGroup.id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating button size:", error);
      toast.error("Error al guardar el tamaño");
    }
  };

  const createSpot = async (x: number, y: number) => {
    if (!selectedGroup) {
      toast.error("Selecciona un grupo primero");
      return false;
    }

    const nextSpotNumber = `${selectedGroup.name.substring(0, 2).toUpperCase()}-${spots.length + 1}`;

    try {
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

      if (error) throw error;

      toast.success(`Plaza ${nextSpotNumber} creada`);
      await loadEditorSpots(selectedGroup.id);
      return true;
    } catch (error: any) {
      console.error("Error creating spot:", error);
      toast.error("Error al crear la plaza");
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
      }
      return true;
    } catch (error: any) {
      console.error("Error deleting spot:", error);
      toast.error("Error al eliminar la plaza");
      return false;
    }
  };

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
    loadEditorSpots,
    updateButtonSize,
    createSpot,
    updateSpot,
    deleteSpot,
  };
};
