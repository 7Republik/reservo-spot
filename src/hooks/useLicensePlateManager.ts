import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useOfflineMode } from "./useOfflineMode";
import { useOfflineSync } from "./useOfflineSync";
import { OfflineStorageService } from "@/lib/offlineStorage";
import { format } from "date-fns";

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

/**
 * Custom hook for managing user's license plates
 * 
 * Handles complete license plate lifecycle for end users:
 * - Submitting new plates with optional electric/disability permit requests
 * - Viewing active and deleted plates
 * - Soft deleting plates (freed for other users)
 * - Validation of Spanish plate format (1234ABC, A1234BC, AB1234C)
 * - Duplicate detection (prevents registering already-approved plates)
 * - UI state management for forms and modals
 * 
 * **Soft Delete**: Deleted plates remain in history but are freed for other users
 * to register. Uses `deleted_at` and `deleted_by_user` columns.
 * 
 * **Approval Flow**: New plates start as `is_approved=false`. Admins must approve
 * in admin panel before user can make reservations.
 * 
 * **Spanish Format**: Uses Zod schema to validate Spanish license plate formats.
 * 
 * @param {string} userId - Current user ID (from auth)
 * 
 * @returns {Object} License plates state and operations
 * @returns {LicensePlate[]} activePlates - User's active license plates
 * @returns {LicensePlate[]} deletedPlates - User's deleted plates (history)
 * @returns {string} newPlate - New plate input value
 * @returns {Function} setNewPlate - Sets new plate input
 * @returns {boolean} loading - Loading state indicator
 * @returns {boolean} requestedElectric - Electric permit checkbox state
 * @returns {Function} setRequestedElectric - Sets electric permit checkbox
 * @returns {boolean} requestedDisability - Disability permit checkbox state
 * @returns {Function} setRequestedDisability - Sets disability permit checkbox
 * @returns {boolean} isFormOpen - License plate form visibility
 * @returns {Function} setIsFormOpen - Controls form visibility
 * @returns {boolean} isHistoryOpen - Deleted plates history visibility
 * @returns {Function} setIsHistoryOpen - Controls history visibility
 * @returns {boolean} deleteDialogOpen - Delete confirmation dialog visibility
 * @returns {Function} setDeleteDialogOpen - Controls delete dialog
 * @returns {LicensePlate|null} plateToDelete - Plate selected for deletion
 * @returns {Function} setPlateToDelete - Sets plate to delete
 * @returns {Function} handleAddPlate - Submits new license plate
 * @returns {Function} handleDeletePlate - Soft deletes a license plate
 * @returns {Function} openDeleteDialog - Opens delete confirmation (if approved)
 * 
 * @example
 * ```tsx
 * const {
 *   activePlates,
 *   deletedPlates,
 *   newPlate,
 *   setNewPlate,
 *   loading,
 *   requestedElectric,
 *   setRequestedElectric,
 *   handleAddPlate,
 *   openDeleteDialog
 * } = useLicensePlateManager(userId);
 * 
 * // Submit new plate
 * <Input
 *   value={newPlate}
 *   onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
 * />
 * <Checkbox
 *   checked={requestedElectric}
 *   onCheckedChange={setRequestedElectric}
 * />
 * <Button onClick={handleAddPlate}>Submit</Button>
 * 
 * // Delete plate
 * <Button onClick={() => openDeleteDialog(plate)}>Delete</Button>
 * ```
 */
export const useLicensePlateManager = (userId: string) => {
  const { isOnline, lastSyncTime } = useOfflineMode();
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
  const storage = new OfflineStorageService();

  /**
   * Loads all license plates for user (active and deleted)
   * 
   * Separates into `activePlates` (deleted_at IS NULL) and
   * `deletedPlates` (deleted_at IS NOT NULL) for display.
   * 
   * **Offline Support**:
   * - When offline: Loads from cache
   * - When online: Loads from server and caches
   * - Fallback to cache if server fails
   * 
   * @returns {Promise<void>}
   */
  const loadPlates = async () => {
    const cacheKey = `plates_${userId}`;
    
    try {
      if (!isOnline) {
        // Modo offline: cargar desde cache
        await storage.init();
        const cached = await storage.get<LicensePlate[]>(cacheKey);
        
        if (cached) {
          const active = cached.filter(p => !p.deleted_at);
          const deleted = cached.filter(p => p.deleted_at);
          
          setActivePlates(active);
          setDeletedPlates(deleted);
          setLoading(false);
          return;
        }
        
        toast.error("No hay datos de matrículas en caché");
        setLoading(false);
        return;
      }

      // Modo online: cargar desde Supabase
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
      
      // Cachear datos
      await storage.init();
      await storage.set(cacheKey, data || [], {
        dataType: 'license_plates',
        userId
      });
      await storage.recordSync(cacheKey);
      
    } catch (error: any) {
      console.error("Error loading plates:", error);
      
      // Fallback a cache si falla online
      if (isOnline) {
        await storage.init();
        const cached = await storage.get<LicensePlate[]>(cacheKey);
        
        if (cached) {
          const active = cached.filter(p => !p.deleted_at);
          const deleted = cached.filter(p => p.deleted_at);
          
          setActivePlates(active);
          setDeletedPlates(deleted);
          toast.warning("Mostrando datos en caché");
        } else {
          toast.error("Error al cargar las matrículas");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submits a new license plate request
   * 
   * **Validation**:
   * - Validates Spanish format with Zod schema
   * - Checks if plate is already approved for another user
   * - Prevents duplicate submissions
   * 
   * **Approval Flow**: Plate starts as `is_approved=false`, requiring admin approval.
   * 
   * **Permits**: Can optionally request electric and/or disability permits.
   * 
   * **Offline Support**: Blocked when offline with clear error message.
   * 
   * Resets form and reloads plates on success.
   * 
   * @returns {Promise<void>}
   */
  const handleAddPlate = async () => {
    // Bloquear cuando offline
    if (!isOnline) {
      toast.error("No puedes registrar matrículas sin conexión", {
        description: "Conéctate a internet para añadir nuevas matrículas"
      });
      return;
    }

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

  /**
   * Soft deletes a license plate
   * 
   * Sets `deleted_at` and `deleted_by_user=true` instead of physical deletion.
   * This frees the plate number for other users while maintaining history.
   * 
   * If plate was approved, shows message that it's now available for others.
   * 
   * **Offline Support**: Blocked when offline with clear error message.
   * 
   * @param {LicensePlate} plate - Plate to delete
   * @returns {Promise<void>}
   */
  const handleDeletePlate = async (plate: LicensePlate) => {
    // Bloquear cuando offline
    if (!isOnline) {
      toast.error("No puedes eliminar matrículas sin conexión", {
        description: "Conéctate a internet para eliminar matrículas"
      });
      return;
    }

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

  /**
   * Opens delete confirmation dialog for approved plates
   * 
   * **Logic**:
   * - If plate is approved: Shows confirmation dialog (warns about consequences)
   * - If plate is not approved: Deletes immediately without confirmation
   * 
   * @param {LicensePlate} plate - Plate to delete
   * @returns {void}
   */
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

  // Sincronizar datos cuando se recupera la conexión
  useOfflineSync(
    () => {
      // Re-habilitar controles inmediatamente (Requisito 5.5: <2s)
      console.log('[useLicensePlateManager] Controles re-habilitados');
    },
    () => {
      // Sincronizar datos después de 3s (Requisito 3.3)
      console.log('[useLicensePlateManager] Sincronizando placas...');
      loadPlates();
    }
  );

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
    isOnline,
    lastSyncTime,
  };
};
