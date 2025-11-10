import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParkingGroup } from "@/types/admin";

export const useParkingGroups = () => {
  const [parkingGroups, setParkingGroups] = useState<ParkingGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

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

  const createGroup = async (
    name: string,
    description: string,
    capacity: number,
    floorPlanFile: File | null
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

  const updateGroup = async (
    groupId: string,
    name: string,
    capacity: number,
    floorPlanFile: File | null,
    currentFloorPlanUrl: string | null
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
