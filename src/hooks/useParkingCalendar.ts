import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useOfflineMode } from "./useOfflineMode";
import { useOfflineSync } from "./useOfflineSync";
import { OfflineStorageService } from "@/lib/offlineStorage";

interface Reservation {
  id: string;
  reservation_date: string;
  status: string;
  spot_id: string;
}

interface ParkingGroup {
  id: string;
  name: string;
}

/**
 * Custom hook for managing parking calendar and reservations
 * 
 * Handles the complete parking reservation workflow including:
 * - Loading user's parking group assignments
 * - Displaying monthly calendar with availability
 * - Creating, editing, and cancelling reservations
 * - Group selection modal for multi-group users
 * - Quick reservation options (last used spot, random spot)
 * - Reservation details modal with edit/cancel actions
 * - Real-time spot availability calculation
 * - Date validation with blocked dates and reservable range
 * 
 * **Navigation Integration**: Works seamlessly with `/select-parking-spot` page
 * for visual spot selection. Returns state via navigation state after spot selection.
 * 
 * **Permissions**: Automatically loads user's group assignments and includes
 * "General" group if exists. Users without group access receive error feedback.
 * 
 * @param {string} userId - Current user ID (from auth)
 * 
 * @returns {Object} Calendar state and reservation operations
 * @returns {Date} currentMonth - Currently displayed month
 * @returns {Function} setCurrentMonth - Changes displayed month
 * @returns {Reservation[]} reservations - User's active reservations for current month
 * @returns {Record<string,number>} availableSpots - Available spots count per date (YYYY-MM-DD)
 * @returns {boolean} loading - Loading state for reservations
 * @returns {boolean} loadingSpots - Loading state for availability calculation
 * @returns {string[]} userGroups - User's accessible parking group IDs
 * @returns {string[]} userGroupNames - User's accessible parking group names
 * @returns {Date|null} selectedDateForMap - Date selected for reservation
 * @returns {boolean} showGroupSelector - Group selector modal visibility
 * @returns {Function} setShowGroupSelector - Controls group selector modal
 * @returns {boolean} showReservationDetails - Reservation details modal visibility
 * @returns {Function} setShowReservationDetails - Controls details modal
 * @returns {Object|null} selectedReservationDetails - Details of selected reservation
 * @returns {Function} setSelectedReservationDetails - Sets reservation details
 * @returns {Function} handleReserve - Initiates reservation for a date
 * @returns {Function} handleGroupSelected - Handles group selection for reservation
 * @returns {Function} handleQuickReserve - Creates reservation with quick options
 * @returns {Function} loadReservationDetails - Loads details for a reservation
 * @returns {Function} handleEditReservation - Navigates to edit reservation
 * @returns {Function} handleCancel - Cancels an existing reservation
 * 
 * @example
 * ```tsx
 * const {
 *   currentMonth,
 *   setCurrentMonth,
 *   reservations,
 *   availableSpots,
 *   loading,
 *   handleReserve,
 *   handleCancel
 * } = useParkingCalendar(userId);
 * 
 * // Display calendar
 * <Calendar
 *   month={currentMonth}
 *   onMonthChange={setCurrentMonth}
 *   availability={availableSpots}
 *   onDateClick={handleReserve}
 * />
 * 
 * // Cancel reservation
 * await handleCancel(reservationId);
 * ```
 */
export const useParkingCalendar = (userId: string, onReservationUpdate?: () => void) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, lastSyncTime } = useOfflineMode();
  const [storage] = useState(() => new OfflineStorageService());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableSpots, setAvailableSpots] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [userGroupNames, setUserGroupNames] = useState<string[]>([]);
  const [selectedDateForMap, setSelectedDateForMap] = useState<Date | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showReservationDetails, setShowReservationDetails] = useState(false);
  const [selectedReservationDetails, setSelectedReservationDetails] = useState<any>(null);

  /**
   * Loads user's parking group assignments
   * 
   * Fetches groups from `user_group_assignments` table plus "General" group if exists.
   * Sets `userGroups` (IDs) and `userGroupNames` for access control.
   * 
   * Shows error toast if user has no group access.
   * 
   * @returns {Promise<void>}
   */
  const loadUserGroups = async () => {
    try {
      const { data: assignments, error: assignError } = await supabase
        .from("user_group_assignments")
        .select(`
          group_id,
          parking_groups (
            id,
            name
          )
        `)
        .eq("user_id", userId);

      if (assignError) throw assignError;

      const { data: generalGroup, error: generalError } = await supabase
        .from("parking_groups")
        .select("id, name")
        .eq("name", "General")
        .eq("is_active", true)
        .maybeSingle();

      if (generalError) {
        console.error("Error loading general group:", generalError);
      }

      const assignedGroupIds = assignments?.map(a => a.group_id) || [];
      const assignedGroupNames = assignments?.map(a => (a.parking_groups as any)?.name).filter(Boolean) || [];
      
      const allGroupIds = generalGroup 
        ? [...new Set([...assignedGroupIds, generalGroup.id])]
        : assignedGroupIds;
      
      const allGroupNames = generalGroup 
        ? [...new Set([...assignedGroupNames, generalGroup.name])]
        : assignedGroupNames;

      setUserGroups(allGroupIds);
      setUserGroupNames(allGroupNames);

      if (allGroupIds.length === 0) {
        toast.error("No tienes acceso a ningún grupo de parking", {
          description: "Contacta con el administrador para obtener acceso",
        });
      }
    } catch (error: any) {
      console.error("Error loading user groups:", error);
      toast.error("Error al cargar tus permisos de acceso");
    }
  };

  /**
   * Loads user's active reservations for current month
   * Solo carga reservas con status = 'active'
   * Las reservas completadas o canceladas no se muestran en el calendario
   * 
   * @returns {Promise<void>}
   */
  const loadReservations = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active") // Solo reservas activas
        .gte("reservation_date", format(start, "yyyy-MM-dd"))
        .lte("reservation_date", format(end, "yyyy-MM-dd"));

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      console.error("Error loading reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads available spots count for each day in current month
   * 
   * Complex calculation considering:
   * - User's group assignments
   * - Global and group-specific blocked dates
   * - Reservable date range from settings
   * - Active spots in user's groups
   * - Existing reservations
   * 
   * Updates `availableSpots` with format: { "2025-01-15": 3, "2025-01-16": 5 }
   * 
   * @returns {Promise<void>}
   */
  const loadAvailableSpots = async () => {
    try {
      setLoadingSpots(true);
      
      if (userGroups.length === 0) {
        setAvailableSpots({});
        setLoadingSpots(false);
        return;
      }

      const { data: dateRange, error: rangeError } = await supabase
        .rpc('get_reservable_date_range')
        .single();

      if (rangeError) {
        console.error("Error getting date range:", rangeError);
      }

      const { data: blockedDates, error: blockedError } = await supabase
        .from("blocked_dates")
        .select("blocked_date, group_id")
        .or(`group_id.is.null,group_id.in.(${userGroups.join(',')})`);

      if (blockedError) {
        console.error("Error getting blocked dates:", blockedError);
      }

      const blockedDatesMap: Record<string, Set<string>> = {};
      blockedDates?.forEach(bd => {
        const dateStr = bd.blocked_date;
        if (!blockedDatesMap[dateStr]) {
          blockedDatesMap[dateStr] = new Set();
        }
        if (bd.group_id === null) {
          blockedDatesMap[dateStr].add('__GLOBAL__');
        } else {
          blockedDatesMap[dateStr].add(bd.group_id);
        }
      });

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end });

      const spotsData: Record<string, number> = {};

      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        
        const isOutOfRange = dateRange && (dateStr < dateRange.min_date || dateStr > dateRange.max_date);

        if (isOutOfRange) {
          spotsData[dateStr] = 0;
          continue;
        }

        const blockedForDate = blockedDatesMap[dateStr];
        const hasGlobalBlock = blockedForDate && blockedForDate.has('__GLOBAL__');

        if (hasGlobalBlock) {
          spotsData[dateStr] = 0;
          continue;
        }

        const availableGroups = userGroups.filter(gId => 
          !blockedForDate || !blockedForDate.has(gId)
        );

        if (availableGroups.length === 0) {
          spotsData[dateStr] = 0;
          continue;
        }

        const { data: totalSpots, error: spotsError } = await supabase
          .from("parking_spots")
          .select("id, group_id")
          .eq("is_active", true)
          .in("group_id", availableGroups);

        if (spotsError) throw spotsError;

        const { data: occupied, error: occupiedError } = await supabase
          .from("reservations")
          .select("spot_id")
          .eq("reservation_date", dateStr)
          .eq("status", "active");

        if (occupiedError) throw occupiedError;

        const occupiedIds = occupied?.map(r => r.spot_id) || [];
        const availableInUserGroups = totalSpots?.filter(spot => !occupiedIds.includes(spot.id)) || [];
        
        spotsData[dateStr] = availableInUserGroups.length;
      }

      setAvailableSpots(spotsData);
    } catch (error: any) {
      console.error("Error loading available spots:", error);
    } finally {
      setLoadingSpots(false);
    }
  };

  /**
   * Initiates reservation flow for a selected date
   * 
   * - Validates user has group access
   * - Checks spot availability
   * - If single group: navigates directly to spot selection
   * - If multiple groups: opens group selector modal
   * 
   * @param {Date} date - Selected reservation date
   * @returns {Promise<void>}
   */
  const handleReserve = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    if (userGroups.length === 0) {
      toast.error("No tienes acceso a ningún grupo de parking", {
        description: "Contacta con el administrador",
      });
      return;
    }

    const available = availableSpots[dateStr] || 0;

    if (available === 0) {
      toast.error("No hay plazas disponibles para este día");
      return;
    }

    setSelectedDateForMap(date);

    if (userGroups.length === 1) {
      navigate("/select-parking-spot", {
        state: {
          userId,
          selectedDate: date.toISOString(),
          userGroups,
          userGroupNames,
          selectedGroupId: userGroups[0],
          editingReservationId: null
        }
      });
      return;
    }

    setShowGroupSelector(true);
  };

  /**
   * Handles group selection from modal
   * 
   * Navigates to spot selection page with selected group and date.
   * 
   * @param {string} groupId - Selected parking group UUID
   * @param {string} groupName - Selected parking group name
   * @returns {void}
   */
  const handleGroupSelected = (groupId: string, groupName: string) => {
    setShowGroupSelector(false);

    navigate("/select-parking-spot", {
      state: {
        userId,
        selectedDate: selectedDateForMap?.toISOString(),
        userGroups,
        userGroupNames,
        selectedGroupId: groupId,
        editingReservationId: null
      }
    });
  };

  /**
   * Creates reservation with pre-selected spot (quick reserve)
   * 
   * Used by quick reservation options:
   * - "Last used spot": Reserves user's most recent spot if available
   * - "Random spot": Reserves a randomly assigned available spot
   * 
   * Shows loading toast during reservation process.
   * 
   * @param {string} groupId - Parking group UUID
   * @param {string} groupName - Parking group name
   * @param {string} spotId - Pre-selected spot UUID
   * @param {string} spotNumber - Spot identifier for display
   * @param {'last'|'random'} type - Quick reservation type
   * @returns {Promise<void>}
   */
  const handleQuickReserve = async (
    groupId: string, 
    groupName: string, 
    spotId: string, 
    spotNumber: string,
    type: 'last' | 'random'
  ) => {
    setShowGroupSelector(false);
    
    if (selectedDateForMap) {
      const message = type === 'last' 
        ? `Reservando tu plaza habitual (${spotNumber})...`
        : `Asignando plaza aleatoria (${spotNumber})...`;
      
      toast.loading(message, { id: 'quick-reserve' });
      
      await createReservationWithSpot(spotId, spotNumber, selectedDateForMap);
      
      toast.dismiss('quick-reserve');
    }
  };

  /**
   * Loads full details of a reservation for display in modal
   * 
   * Fetches reservation with spot and group information.
   * Opens reservation details modal with loaded data.
   * 
   * @param {string} reservationId - Reservation UUID
   * @returns {Promise<void>}
   */
  const loadReservationDetails = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id,
          user_id,
          reservation_date,
          status,
          parking_spots (
            id,
            spot_number,
            is_accessible,
            has_charger,
            is_compact,
            parking_groups (
              name
            )
          )
        `)
        .eq("id", reservationId)
        .eq("status", "active")
        .single();

      if (error) throw error;

      const spot = data.parking_spots as any;
      const group = spot?.parking_groups as any;

      setSelectedReservationDetails({
        id: data.id,
        userId: data.user_id,
        date: new Date(data.reservation_date),
        spotNumber: spot?.spot_number || "",
        groupName: group?.name || "",
        spotId: spot?.id || "",
        isAccessible: spot?.is_accessible || false,
        hasCharger: spot?.has_charger || false,
        isCompact: spot?.is_compact || false,
      });
      setShowReservationDetails(true);
    } catch (error: any) {
      console.error("Error loading reservation details:", error);
      toast.error("Error al cargar detalles de la reserva");
    }
  };

  /**
   * Initiates reservation editing flow
   * 
   * Navigates to spot selection page with reservation context for editing.
   * Allows user to change spot while keeping same date.
   * 
   * @param {string} reservationId - Reservation UUID to edit
   * @param {Date} date - Reservation date
   * @returns {Promise<void>}
   */
  const handleEditReservation = async (reservationId: string, date: Date) => {
    setShowReservationDetails(false);

    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("parking_spots(group_id, parking_groups(name))")
        .eq("id", reservationId)
        .single();

      if (error) throw error;

      const spot = data.parking_spots as any;
      const groupId = spot?.group_id;

      if (groupId) {
        navigate("/select-parking-spot", {
          state: {
            userId,
            selectedDate: date.toISOString(),
            userGroups,
            userGroupNames,
            selectedGroupId: groupId,
            editingReservationId: reservationId
          }
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al preparar la edición");
    }
  };

  /**
   * Creates or updates a reservation with validation
   * 
   * **Validation**: Calls `validate_parking_spot_reservation` DB function to check:
   * - Date range validity
   * - Blocked dates
   * - User permissions
   * - Spot attributes (PMR, charger)
   * 
   * **Visual Feedback**: Adds CSS animations to calendar date cell.
   * 
   * **Edit Mode**: If `editingId` provided, updates existing reservation instead of creating new.
   * 
   * @param {string} spotId - Spot UUID to reserve
   * @param {string} spotNumber - Spot identifier for display
   * @param {Date} date - Reservation date
   * @param {string|null} [editingId] - Existing reservation ID if editing
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const createReservationWithSpot = async (
    spotId: string, 
    spotNumber: string, 
    date: Date,
    editingId?: string | null
  ) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayElement = document.querySelector(`[data-date="${dateStr}"]`);
    
    dayElement?.classList.add('animate-pulse');
    
    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("reservations")
          .update({ spot_id: spotId })
          .eq("id", editingId);

        if (updateError) throw updateError;

        dayElement?.classList.remove('animate-pulse');
        dayElement?.classList.add('animate-bounce');
        setTimeout(() => {
          dayElement?.classList.remove('animate-bounce');
        }, 500);

        toast.success(`Plaza cambiada a ${spotNumber}`);
        loadReservations();
        loadAvailableSpots();
        if (onReservationUpdate) onReservationUpdate();
        return true;
      }

      const { data: validation, error: validationError } = await supabase
        .rpc("validate_parking_spot_reservation", {
          _user_id: userId,
          _spot_id: spotId,
          _reservation_date: dateStr,
        });

      if (validationError) {
        console.error("Validation error:", validationError);
        toast.error("Error al validar la reserva");
        dayElement?.classList.remove('animate-pulse');
        return false;
      }

      if (validation && validation.length > 0) {
        const validationResult = validation[0];
        if (!validationResult.is_valid) {
          // Mostrar mensaje más prominente para usuarios bloqueados
          if (validationResult.error_code === "USER_BLOCKED") {
            toast.error(validationResult.error_message || "Tu cuenta está bloqueada temporalmente", {
              duration: 8000, // 8 segundos para que el usuario pueda leer la fecha
            });
          } else {
            toast.error(validationResult.error_message || "No se puede reservar esta plaza");
          }
          dayElement?.classList.remove('animate-pulse');
          return false;
        }
        if (validationResult.error_code === "COMPACT_SPOT_WARNING") {
          toast.warning(validationResult.error_message);
        }
      }

      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          user_id: userId,
          spot_id: spotId,
          reservation_date: dateStr,
          status: "active",
        });

      if (insertError) {
        // Detectar error de constraint único (plaza ya reservada)
        if (insertError.code === '23505') {
          dayElement?.classList.remove('animate-pulse');
          toast.error(`La plaza ${spotNumber} ya fue reservada por otro usuario`, {
            description: 'Por favor, selecciona otra plaza disponible',
            duration: 5000,
          });
          // Recargar disponibilidad para actualizar el calendario
          loadAvailableSpots();
          return false;
        }
        throw insertError;
      }

      dayElement?.classList.remove('animate-pulse');
      dayElement?.classList.add('animate-bounce');
      setTimeout(() => {
        dayElement?.classList.remove('animate-bounce');
      }, 500);

      toast.success(`¡Plaza ${spotNumber} reservada con éxito!`);
      loadReservations();
      loadAvailableSpots();
      if (onReservationUpdate) onReservationUpdate();
      return true;
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      dayElement?.classList.remove('animate-pulse');
      
      // Mensaje de error específico según el tipo
      if (error.code === '23505') {
        toast.error(`La plaza ${spotNumber} ya fue reservada por otro usuario`, {
          description: 'Por favor, selecciona otra plaza disponible',
          duration: 5000,
        });
        loadAvailableSpots();
      } else {
        toast.error("Error al reservar la plaza", {
          description: error.message || 'Inténtalo de nuevo',
        });
      }
      return false;
    }
  };

  /**
   * Cancels an existing reservation
   * 
   * Sets status to 'cancelled' and records cancellation timestamp.
   * Reloads reservations and availability after cancellation.
   * 
   * @param {string} reservationId - Reservation UUID to cancel
   * @returns {Promise<void>}
   */
  const handleCancel = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", reservationId);

      if (error) throw error;

      toast.success("Reserva cancelada correctamente");
      loadReservations();
      loadAvailableSpots();
      if (onReservationUpdate) onReservationUpdate();
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      toast.error("Error al cancelar la reserva");
    }
  };

  useEffect(() => {
    loadUserGroups();
  }, [userId]);

  useEffect(() => {
    if (userGroups.length > 0) {
      loadReservations();
      loadAvailableSpots();
    }
  }, [currentMonth, userId, userGroups]);

  // Recargar cuando se llama a onReservationUpdate desde el exterior
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userGroups.length > 0) {
        loadReservations();
        loadAvailableSpots();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userGroups]);

  // Sincronizar datos cuando se recupera la conexión
  useOfflineSync(
    () => {
      // Re-habilitar controles inmediatamente (Requisito 5.5: <2s)
      console.log('[useParkingCalendar] Controles re-habilitados');
    },
    () => {
      // Sincronizar datos después de 3s (Requisito 3.3)
      if (userGroups.length > 0) {
        console.log('[useParkingCalendar] Sincronizando reservas y disponibilidad...');
        loadReservations();
        loadAvailableSpots();
      }
    }
  );

  useEffect(() => {
    const handleNavigationState = async () => {
      const navigationState = location.state as any;

      if (navigationState?.selectedSpot) {
        const { spotId, spotNumber, reservationDate, editingReservationId } = navigationState.selectedSpot;

        console.log("Processing spot selection:", { spotId, spotNumber, reservationDate, editingReservationId });

        await createReservationWithSpot(
          spotId,
          spotNumber,
          new Date(reservationDate),
          editingReservationId
        );

        // Limpiar el estado de navegación
        navigate(location.pathname, { replace: true, state: {} });
      }
    };

    handleNavigationState();
  }, [location.state]);

  /**
   * Refreshes reservations and available spots data
   * 
   * Used after operations that modify reservations (e.g., incident reports)
   * to ensure UI displays current state.
   * 
   * @returns {Promise<void>}
   */
  const refreshData = async () => {
    await loadReservations();
    await loadAvailableSpots();
  };

  return {
    currentMonth,
    setCurrentMonth,
    reservations,
    availableSpots,
    loading,
    loadingSpots,
    userGroups,
    userGroupNames,
    selectedDateForMap,
    showGroupSelector,
    setShowGroupSelector,
    showReservationDetails,
    setShowReservationDetails,
    selectedReservationDetails,
    setSelectedReservationDetails,
    handleReserve,
    handleGroupSelected,
    handleQuickReserve,
    loadReservationDetails,
    handleEditReservation,
    handleCancel,
    refreshData,
    isOnline,
    lastSyncTime,
  };
};
