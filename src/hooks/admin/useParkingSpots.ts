import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParkingSpot } from "@/types/admin";

export const useParkingSpots = () => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
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
      loadSpots();
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
      loadSpots();
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
