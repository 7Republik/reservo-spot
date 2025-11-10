import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LicensePlate, ExpirationType } from "@/types/admin";

/**
 * Custom hook for managing license plate approvals in the admin panel
 * 
 * Handles pending license plate requests from users, including:
 * - Approving plates with optional electric/disability permits
 * - Rejecting plates with reason
 * - Updating permit expiration dates
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} License plates state and operations
 * @returns {LicensePlate[]} pendingPlates - Array of pending license plates
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadPendingPlates - Loads pending plates from DB (with cache)
 * @returns {Function} approvePlate - Approves a license plate with permits
 * @returns {Function} rejectPlate - Rejects a license plate with reason
 * @returns {Function} updatePermissions - Updates electric/disability permits and expiration
 * 
 * @example
 * ```tsx
 * const {
 *   pendingPlates,
 *   loading,
 *   approvePlate,
 *   rejectPlate
 * } = useLicensePlates();
 * 
 * useEffect(() => {
 *   loadPendingPlates();
 * }, []);
 * 
 * const handleApprove = async (plateId: string) => {
 *   await approvePlate(plateId, true, false); // Approve with electric permit
 * };
 * ```
 */
export const useLicensePlates = () => {
  const [pendingPlates, setPendingPlates] = useState<LicensePlate[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  /**
   * Loads all pending license plate requests with user profiles
   * 
   * @param {boolean} forceReload - If true, bypasses cache and fetches fresh data
   * @returns {Promise<void>}
   */
  const loadPendingPlates = async (forceReload = false) => {
    // Si ya está en caché y no se fuerza la recarga, no hacer nada
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      const { data: plates, error } = await supabase
        .from("license_plates")
        .select("*")
        .eq("is_approved", false)
        .is("rejected_at", null)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      
      // Get profiles separately
      const platesWithProfiles = await Promise.all(
        (plates || []).map(async (plate) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", plate.user_id)
            .single();
          
          return {
            ...plate,
            profiles: profile || { email: "", full_name: "" }
          };
        })
      );
      
      setPendingPlates(platesWithProfiles as any);
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading pending plates:", error);
      toast.error("Error al cargar matrículas pendientes");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Approves a license plate request with optional special permits
   * 
   * @param {string} plateId - License plate UUID to approve
   * @param {boolean} approveElectric - Grant electric vehicle permit
   * @param {boolean} approveDisability - Grant disability/PMR permit
   * @returns {Promise<void>}
   * @throws {Error} If approval fails
   */
  const approvePlate = async (
    plateId: string,
    approveElectric: boolean,
    approveDisability: boolean
  ) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("license_plates")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: sessionData.session?.user.id,
          approved_electric: approveElectric,
          approved_disability: approveDisability,
        })
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Matrícula aprobada correctamente");
      await loadPendingPlates(true);
    } catch (error: any) {
      console.error("Error approving plate:", error);
      toast.error("Error al aprobar la matrícula");
      throw error;
    }
  };

  /**
   * Rejects a license plate request with a reason
   * 
   * @param {string} plateId - License plate UUID to reject
   * @param {string} reason - Rejection reason (shown to user)
   * @returns {Promise<void>}
   * @throws {Error} If rejection fails
   */
  const rejectPlate = async (plateId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("license_plates")
        .update({
          rejected_at: new Date().toISOString(),
          is_approved: false,
          rejection_reason: reason.trim() || "No se especificó motivo",
        })
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Matrícula rechazada. El usuario será notificado");
      await loadPendingPlates(true);
    } catch (error: any) {
      console.error("Error rejecting plate:", error);
      toast.error("Error al rechazar la matrícula");
      throw error;
    }
  };

  /**
   * Updates electric and disability permits with expiration dates
   * 
   * Expiration can be set as:
   * - 'never': Permit never expires (null in DB)
   * - 'days': Expires after N days from now
   * - 'date': Expires on specific date
   * 
   * @param {string} plateId - License plate UUID
   * @param {Object} electric - Electric permit configuration
   * @param {boolean} electric.approved - Whether permit is approved
   * @param {ExpirationType} electric.expirationType - 'never' | 'days' | 'date'
   * @param {string} [electric.expirationDays] - Number of days (if type='days')
   * @param {Date} [electric.expirationDate] - Expiration date (if type='date')
   * @param {Object} disability - Disability permit configuration (same structure)
   * @returns {Promise<void>}
   * @throws {Error} If update fails
   */
  const updatePermissions = async (
    plateId: string,
    electric: {
      approved: boolean;
      expirationType: ExpirationType;
      expirationDays?: string;
      expirationDate?: Date;
    },
    disability: {
      approved: boolean;
      expirationType: ExpirationType;
      expirationDays?: string;
      expirationDate?: Date;
    }
  ) => {
    try {
      let electricExpiresAt: string | null = null;
      let disabilityExpiresAt: string | null = null;
      
      // Calcular fecha de expiración eléctrica
      if (electric.approved) {
        if (electric.expirationType === 'days' && electric.expirationDays) {
          const days = parseInt(electric.expirationDays);
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          electricExpiresAt = expiryDate.toISOString();
        } else if (electric.expirationType === 'date' && electric.expirationDate) {
          electricExpiresAt = electric.expirationDate.toISOString();
        }
      }
      
      // Calcular fecha de expiración discapacidad
      if (disability.approved) {
        if (disability.expirationType === 'days' && disability.expirationDays) {
          const days = parseInt(disability.expirationDays);
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          disabilityExpiresAt = expiryDate.toISOString();
        } else if (disability.expirationType === 'date' && disability.expirationDate) {
          disabilityExpiresAt = disability.expirationDate.toISOString();
        }
      }
      
      const { error } = await supabase
        .from("license_plates")
        .update({
          approved_electric: electric.approved,
          electric_expires_at: electricExpiresAt,
          approved_disability: disability.approved,
          disability_expires_at: disabilityExpiresAt,
        })
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Permisos actualizados correctamente");
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      toast.error("Error al actualizar los permisos");
      throw error;
    }
  };

  return {
    pendingPlates,
    loading,
    loadPendingPlates,
    approvePlate,
    rejectPlate,
    updatePermissions,
  };
};
