import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export interface LicensePlate {
  id: string;
  plate_number: string;
  is_approved: boolean;
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  requested_electric: boolean;
  approved_electric: boolean;
  requested_disability: boolean;
  approved_disability: boolean;
  electric_expires_at?: string | null;
  disability_expires_at?: string | null;
  deleted_at?: string | null;
  deleted_by_user?: boolean;
}

export const plateSchema = z.object({
  plateNumber: z.string()
    .trim()
    .min(4, "La matrícula debe tener al menos 4 caracteres")
    .max(10, "La matrícula no puede tener más de 10 caracteres")
    .regex(/^([A-Z]{1,2}\d{4}[A-Z]{0,2}|\d{4}[A-Z]{3})$/, "Formato inválido. Use formato español: 1234ABC, A1234BC, o AB1234C"),
});

export const useLicensePlateManager = (userId: string) => {
  const [activePlates, setActivePlates] = useState<LicensePlate[]>([]);
  const [deletedPlates, setDeletedPlates] = useState<LicensePlate[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestedElectric, setRequestedElectric] = useState(false);
  const [requestedDisability, setRequestedDisability] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [plateToDelete, setPlateToDelete] = useState<LicensePlate | null>(null);

  const loadPlates = async () => {
    try {
      const { data, error } = await supabase
        .from("license_plates")
        .select("*")
        .eq("user_id", userId)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      
      const active = (data || []).filter(p => !p.deleted_at);
      const deleted = (data || []).filter(p => p.deleted_at);
      
      setActivePlates(active);
      setDeletedPlates(deleted);
    } catch (error: any) {
      console.error("Error loading plates:", error);
      toast.error("Error al cargar las matrículas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlate = async () => {
    try {
      const upperPlate = newPlate.toUpperCase();
      const validated = plateSchema.parse({ plateNumber: upperPlate });

      const { data: existingPlate, error: checkError } = await supabase
        .from("license_plates")
        .select("id, user_id")
        .eq("plate_number", validated.plateNumber)
        .eq("is_approved", true)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking plate:", checkError);
      }

      if (existingPlate && existingPlate.user_id !== userId) {
        toast.error("Esta matrícula ya está registrada y aprobada para otro usuario");
        return;
      }

      const { error } = await supabase
        .from("license_plates")
        .insert({
          user_id: userId,
          plate_number: validated.plateNumber,
          is_approved: false,
          requested_electric: requestedElectric,
          requested_disability: requestedDisability,
        });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("Esta matrícula ya está registrada");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Matrícula añadida. Pendiente de aprobación del administrador");
      setNewPlate("");
      setRequestedElectric(false);
      setRequestedDisability(false);
      loadPlates();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error adding plate:", error);
        toast.error("Error al añadir la matrícula");
      }
    }
  };

  const handleDeletePlate = async (plate: LicensePlate) => {
    try {
      const { error } = await supabase
        .from("license_plates")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by_user: true
        })
        .eq("id", plate.id)
        .eq("user_id", userId);

      if (error) throw error;

      if (plate.is_approved) {
        toast.success("Matrícula eliminada. Ahora está disponible para otros usuarios");
      } else {
        toast.success("Matrícula eliminada");
      }
      
      loadPlates();
      setDeleteDialogOpen(false);
      setPlateToDelete(null);
    } catch (error: any) {
      console.error("Error deleting plate:", error);
      toast.error("Error al eliminar la matrícula");
    }
  };

  const openDeleteDialog = (plate: LicensePlate) => {
    if (plate.is_approved) {
      setPlateToDelete(plate);
      setDeleteDialogOpen(true);
    } else {
      handleDeletePlate(plate);
    }
  };

  useEffect(() => {
    loadPlates();
  }, [userId]);

  return {
    activePlates,
    deletedPlates,
    newPlate,
    setNewPlate,
    loading,
    requestedElectric,
    setRequestedElectric,
    requestedDisability,
    setRequestedDisability,
    isFormOpen,
    setIsFormOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    plateToDelete,
    setPlateToDelete,
    handleAddPlate,
    handleDeletePlate,
    openDeleteDialog,
  };
};
