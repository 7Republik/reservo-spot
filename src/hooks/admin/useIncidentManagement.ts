import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IncidentReportWithDetails, IncidentStatus } from "@/types/incidents";

/**
 * Custom hook for managing incident reports in the admin panel
 * 
 * Provides complete incident lifecycle management including:
 * - Loading incidents with status filtering and user/spot details
 * - Confirming incidents (issues warning, cancels offender reservation)
 * - Dismissing incidents
 * - Adding/updating admin notes
 * - Querying user warning counts
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * **Transaction Safety**: Confirm incident uses transaction logic to ensure
 * all operations (status update, warning issuance, reservation cancellation)
 * succeed or fail together.
 * 
 * @returns {Object} Incident management state and operations
 * @returns {IncidentReportWithDetails[]} incidents - Array of incidents with joined details
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadIncidents - Loads incidents from DB (with cache and optional status filter)
 * @returns {Function} confirmIncident - Confirms incident, issues warning, cancels offender reservation
 * @returns {Function} dismissIncident - Dismisses incident with optional reason
 * @returns {Function} addAdminNotes - Adds or updates admin notes on incident
 * @returns {Function} getUserWarningCount - Gets total warning count for a user
 * 
 * @example
 * ```tsx
 * const {
 *   incidents,
 *   loading,
 *   loadIncidents,
 *   confirmIncident
 * } = useIncidentManagement();
 * 
 * useEffect(() => {
 *   loadIncidents('pending');
 * }, []);
 * 
 * const handleConfirm = async (incidentId: string) => {
 *   const success = await confirmIncident(incidentId, "Confirmed violation");
 *   if (success) {
 *     // Incidents automatically reloaded
 *   }
 * };
 * ```
 */
export const useIncidentManagement = () => {
  const [incidents, setIncidents] = useState<IncidentReportWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);
  const lastStatusFilter = useRef<IncidentStatus | 'all' | null>(null);

  /**
   * Loads incidents from database with optional status filtering
   * Includes joins for reporter, offending user, and spot details
   * 
   * @param {IncidentStatus | 'all'} statusFilter - Filter by status or 'all' for no filter
   * @param {boolean} forceReload - If true, bypasses cache and fetches fresh data
   * @returns {Promise<void>}
   */
  const loadIncidents = async (
    statusFilter: IncidentStatus | 'all' = 'all',
    forceReload = false
  ) => {
    // Si el filtro cambió, siempre recargar
    const filterChanged = lastStatusFilter.current !== statusFilter;
    
    // Si ya está en caché, el filtro no cambió y no se fuerza la recarga, no hacer nada
    if (isCached.current && !filterChanged && !forceReload) {
      return;
    }
    
    // Si el filtro cambió, invalidar cache
    if (filterChanged) {
      isCached.current = false;
    }

    try {
      setLoading(true);
      
      // Build base query - get incident reports first
      let query = supabase
        .from("incident_reports")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: incidents, error } = await query;

      if (error) throw error;
      if (!incidents || incidents.length === 0) {
        setIncidents([]);
        isCached.current = true;
        lastStatusFilter.current = statusFilter;
        return;
      }

      // Collect all unique user IDs and spot IDs
      const userIds = new Set<string>();
      const spotIds = new Set<string>();

      incidents.forEach((incident: any) => {
        if (incident.reporter_id) userIds.add(incident.reporter_id);
        if (incident.offending_user_id) userIds.add(incident.offending_user_id);
        if (incident.original_spot_id) spotIds.add(incident.original_spot_id);
        if (incident.reassigned_spot_id) spotIds.add(incident.reassigned_spot_id);
      });

      // Fetch all profiles in one query
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(userIds));

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
      }

      // Fetch all spots with groups in one query
      const { data: spots, error: spotsError } = await supabase
        .from("parking_spots")
        .select(`
          id,
          spot_number,
          group:parking_groups!parking_spots_group_id_fkey (
            name
          )
        `)
        .in("id", Array.from(spotIds));

      if (spotsError) {
        console.error("Error loading spots:", spotsError);
      }

      // Create lookup maps
      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, p])
      );
      const spotMap = new Map(
        (spots || []).map((s: any) => [s.id, s])
      );

      // Transform data to match IncidentReportWithDetails interface
      const transformedData: IncidentReportWithDetails[] = incidents.map((incident: any) => {
        const reporter = profileMap.get(incident.reporter_id);
        const offendingUser = incident.offending_user_id 
          ? profileMap.get(incident.offending_user_id) 
          : null;
        const originalSpot = incident.original_spot_id 
          ? spotMap.get(incident.original_spot_id) 
          : null;
        const reassignedSpot = incident.reassigned_spot_id 
          ? spotMap.get(incident.reassigned_spot_id) 
          : null;

        return {
          ...incident,
          reporter: reporter ? {
            id: reporter.id,
            full_name: reporter.full_name || 'Usuario desconocido',
            email: reporter.email || '',
          } : {
            id: '',
            full_name: 'Usuario desconocido',
            email: '',
          },
          offending_user: offendingUser ? {
            id: offendingUser.id,
            full_name: offendingUser.full_name || 'Usuario desconocido',
            email: offendingUser.email || '',
          } : null,
          original_spot: originalSpot ? {
            spot_number: originalSpot.spot_number,
            group_name: (originalSpot.group as any)?.name || 'Grupo desconocido',
          } : null,
          reassigned_spot: reassignedSpot ? {
            spot_number: reassignedSpot.spot_number,
            group_name: (reassignedSpot.group as any)?.name || 'Grupo desconocido',
          } : null,
        };
      });

      setIncidents(transformedData);
      isCached.current = true;
      lastStatusFilter.current = statusFilter;
    } catch (error: any) {
      console.error("Error loading incidents:", error);
      toast.error("Error al cargar incidentes");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Issues a warning to a user for a parking violation
   * Helper function used by confirmIncident
   * 
   * @param {string} userId - User ID to issue warning to
   * @param {string} incidentId - Incident ID that triggered the warning
   * @param {string} adminId - Admin ID issuing the warning
   * @param {string} reason - Reason for the warning
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const issueWarning = async (
    userId: string,
    incidentId: string,
    adminId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("user_warnings")
        .insert({
          user_id: userId,
          incident_id: incidentId,
          issued_by: adminId,
          reason: reason,
          notes: null,
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error issuing warning:", error);
      throw error;
    }
  };

  /**
   * Confirms an incident report with transaction logic
   * 
   * Performs the following operations atomically:
   * 1. Updates incident status to 'confirmed'
   * 2. Sets confirmed_by and confirmed_at
   * 3. Issues warning to offending user (if identified)
   * 4. Cancels offending user's reservation for the affected date
   * 5. Logs cancellation in reservation_cancellation_log
   * 
   * @param {string} incidentId - Incident ID to confirm
   * @param {string} notes - Optional admin notes
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const confirmIncident = async (
    incidentId: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No se pudo obtener el usuario actual");
        return false;
      }

      // Get incident details first
      const { data: incident, error: fetchError } = await supabase
        .from("incident_reports")
        .select(`
          *,
          reservation:reservation_id (
            reservation_date,
            spot_id
          )
        `)
        .eq("id", incidentId)
        .single();

      if (fetchError) throw fetchError;
      if (!incident) {
        toast.error("Incidente no encontrado");
        return false;
      }

      // Check if already confirmed
      if (incident.status === 'confirmed') {
        toast.error("Este incidente ya ha sido confirmado");
        return false;
      }

      // Update incident status
      const { error: updateError } = await supabase
        .from("incident_reports")
        .update({
          status: 'confirmed',
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          admin_notes: notes || incident.admin_notes,
        })
        .eq("id", incidentId);

      if (updateError) throw updateError;

      // If offending user is identified, issue warning and cancel their reservation
      if (incident.offending_user_id && incident.reservation) {
        // Issue warning
        await issueWarning(
          incident.offending_user_id,
          incidentId,
          user.id,
          "Ocupó la plaza reservada de otro usuario"
        );

        // Find and cancel offending user's reservation for that date and spot
        const { data: offenderReservations, error: reservationError } = await supabase
          .from("reservations")
          .select("id")
          .eq("user_id", incident.offending_user_id)
          .eq("reservation_date", (incident.reservation as any).reservation_date)
          .eq("spot_id", incident.original_spot_id)
          .eq("status", "active");

        if (reservationError) {
          console.error("Error finding offender reservation:", reservationError);
        } else if (offenderReservations && offenderReservations.length > 0) {
          // Cancel the reservation
          const { error: cancelError } = await supabase
            .from("reservations")
            .update({ status: "cancelled" })
            .eq("id", offenderReservations[0].id);

          if (cancelError) {
            console.error("Error cancelling offender reservation:", cancelError);
          } else {
            // Log the cancellation
            await supabase
              .from("reservation_cancellation_log")
              .insert({
                reservation_id: offenderReservations[0].id,
                user_id: incident.offending_user_id,
                cancellation_reason: `Incidente confirmado: ocupó plaza reservada (ID: ${incidentId})`,
                triggered_by: 'admin_incident_confirmation',
                metadata: { admin_id: user.id, incident_id: incidentId },
              });
          }
        }
      }

      toast.success(
        incident.offending_user_id 
          ? "Incidente confirmado. Amonestación emitida y reserva cancelada."
          : "Incidente confirmado",
        { duration: 5000 }
      );
      
      await loadIncidents(lastStatusFilter.current || 'all', true);
      return true;
    } catch (error: any) {
      console.error("Error confirming incident:", error);
      toast.error("Error al confirmar el incidente");
      return false;
    }
  };

  /**
   * Dismisses an incident report
   * Updates status to 'dismissed' without issuing warnings or cancelling reservations
   * 
   * @param {string} incidentId - Incident ID to dismiss
   * @param {string} reason - Reason for dismissal (stored in admin_notes)
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const dismissIncident = async (
    incidentId: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No se pudo obtener el usuario actual");
        return false;
      }

      const { error } = await supabase
        .from("incident_reports")
        .update({
          status: 'dismissed',
          admin_notes: reason || null,
        })
        .eq("id", incidentId);

      if (error) throw error;

      toast.success("Incidente desestimado");
      await loadIncidents(lastStatusFilter.current || 'all', true);
      return true;
    } catch (error: any) {
      console.error("Error dismissing incident:", error);
      toast.error("Error al desestimar el incidente");
      return false;
    }
  };

  /**
   * Adds or updates admin notes on an incident
   * 
   * @param {string} incidentId - Incident ID
   * @param {string} notes - Admin notes to add/update
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const addAdminNotes = async (
    incidentId: string,
    notes: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("incident_reports")
        .update({ admin_notes: notes })
        .eq("id", incidentId);

      if (error) throw error;

      toast.success("Notas actualizadas");
      await loadIncidents(lastStatusFilter.current || 'all', true);
      return true;
    } catch (error: any) {
      console.error("Error updating admin notes:", error);
      toast.error("Error al actualizar las notas");
      return false;
    }
  };

  /**
   * Gets the total warning count for a user
   * Uses the database function get_user_warning_count
   * 
   * @param {string} userId - User ID to query
   * @returns {Promise<number>} Warning count (0 if error)
   */
  const getUserWarningCount = async (userId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_warning_count', { _user_id: userId });

      if (error) throw error;
      return data || 0;
    } catch (error: any) {
      console.error("Error getting user warning count:", error);
      return 0;
    }
  };

  return {
    incidents,
    loading,
    loadIncidents,
    confirmIncident,
    dismissIncident,
    addAdminNotes,
    getUserWarningCount,
  };
};
