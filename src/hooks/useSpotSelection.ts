import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useOfflineMode } from "./useOfflineMode";
import { offlineCache } from "@/lib/offlineCache";
import { safeSupabaseQuery, ensureArray } from "@/lib/errorHandler";
import { getSpotAttributesText } from "@/lib/spotIcons";

export interface ParkingGroup {
  id: string;
  name: string;
  description: string | null;
  floor_plan_url: string | null;
  capacity: number;
  button_size: number;
}

export interface SpotWithStatus {
  id: string;
  spot_number: string;
  position_x: number | null;
  position_y: number | null;
  is_accessible: boolean;
  has_charger: boolean;
  is_compact: boolean;
  is_active: boolean;
  visual_size: string;
  status: 'available' | 'occupied' | 'user_reserved' | 'inactive';
}

interface LocationState {
  userId: string;
  selectedDate: string;
  userGroups: string[];
  userGroupNames: string[];
  selectedGroupId: string | null;
  editingReservationId: string | null;
}

/**
 * Custom hook for spot selection in interactive map view
 * 
 * Manages the `/select-parking-spot` page functionality including:
 * - Loading parking groups accessible to user
 * - Fetching spots with real-time status (available, occupied, user_reserved)
 * - Interactive map and list view toggle
 * - Spot color coding based on status and attributes
 * - Click handling with validation and navigation back to calendar
 * - Integration with `react-zoom-pan-pinch` for map interaction
 * 
 * **Status Logic**:
 * - `available`: Spot is active and not reserved
 * - `occupied`: Spot is reserved by another user
 * - `user_reserved`: Spot is reserved by current user (cannot re-reserve)
 * - `inactive`: Spot is not active
 * 
 * **Color Coding**:
 * - Green: Available (standard)
 * - Emerald: Available (no special attributes)
 * - Yellow: Available with charger
 * - Blue: Available with PMR access
 * - Red: Occupied by another user
 * - Dark Blue: Reserved by current user
 * - Gray: Inactive
 * 
 * **Navigation Flow**:
 * 1. User arrives from calendar with date and group context
 * 2. Selects spot on map or list
 * 3. Navigates back to `/dashboard` with spot selection in state
 * 4. Calendar hook receives state and creates/updates reservation
 * 
 * @param {LocationState|null} state - Navigation state from calendar
 * 
 * @returns {Object} Spot selection state and operations
 * @returns {ParkingGroup|null} selectedGroup - Currently selected parking group
 * @returns {Function} setSelectedGroup - Changes selected group
 * @returns {ParkingGroup[]} availableGroups - Groups accessible to user with floor plans
 * @returns {SpotWithStatus[]} spots - Parking spots with status for selected group
 * @returns {'map'|'list'} viewMode - Current view mode (map or list)
 * @returns {Function} setViewMode - Changes view mode
 * @returns {boolean} loading - Loading state indicator
 * @returns {Date} selectedDate - Date for reservation
 * @returns {number} availableCount - Count of available spots
 * @returns {Function} getSpotColor - Returns color class for spot based on status
 * @returns {Function} handleSpotClick - Handles spot selection and navigation
 * @returns {boolean} isOnline - Online/offline status
 * 
 * @example
 * ```tsx
 * const location = useLocation();
 * const {
 *   selectedGroup,
 *   setSelectedGroup,
 *   availableGroups,
 *   spots,
 *   viewMode,
 *   setViewMode,
 *   getSpotColor,
 *   handleSpotClick
 * } = useSpotSelection(location.state);
 * 
 * // Render map with spots
 * <TransformWrapper>
 *   <TransformComponent>
 *     <img src={selectedGroup?.floor_plan_url} />
 *     {spots.map(spot => (
 *       <button
 *         key={spot.id}
 *         className={getSpotColor(spot)}
 *         onClick={() => handleSpotClick(spot)}
 *         style={{
 *           left: spot.position_x,
 *           top: spot.position_y
 *         }}
 *       >
 *         {spot.spot_number}
 *       </button>
 *     ))}
 *   </TransformComponent>
 * </TransformWrapper>
 * ```
 */
export const useSpotSelection = (state: LocationState | null) => {
  const navigate = useNavigate();
  const { isOnline, lastSync } = useOfflineMode();
  const [selectedGroup, setSelectedGroup] = useState<ParkingGroup | null>(null);
  const [availableGroups, setAvailableGroups] = useState<ParkingGroup[]>([]);
  const [spots, setSpots] = useState<SpotWithStatus[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);

  const selectedDate = state?.selectedDate ? new Date(state.selectedDate) : new Date();
  const availableCount = spots.filter(s => s.status === 'available').length;

  /**
   * Loads parking groups accessible to user with floor plans
   * 
   * **Pre-selected Group**: If `state.selectedGroupId` exists (from group selector modal),
   * loads only that specific group. Otherwise loads all user's groups with floor plans.
   * 
   * Automatically selects first available group if multiple.
   * 
   * @returns {Promise<void>}
   */
  const loadAvailableGroups = async () => {
    if (!state?.userId || !state?.userGroups) return;

    const cacheKey = state.selectedGroupId 
      ? `groups_single_${state.selectedGroupId}`
      : `groups_${state.userId}`;

    setLoading(true);

    // Modo offline: cargar desde cache
    if (!isOnline) {
      const cached = await offlineCache.get<ParkingGroup[]>(cacheKey);
      if (cached) {
        setAvailableGroups(cached);
        if (cached.length > 0) {
          setSelectedGroup(cached[0]);
        }
      } else {
        // Siempre retornar array vacío, nunca null
        setAvailableGroups([]);
        toast.error("No hay datos de grupos en caché");
      }
      setLoading(false);
      return;
    }

    // Modo online: cargar desde servidor
    if (state.selectedGroupId) {
      const result = await safeSupabaseQuery(
        async () => {
          const query = await supabase
            .from("parking_groups")
            .select("*")
            .eq("id", state.selectedGroupId)
            .eq("is_active", true)
            .single();
          return query;
        },
        null,
        { logError: true, context: 'loadSingleGroup' }
      );

      if (result.error) {
        // Fallback a cache
        const cached = await offlineCache.get<ParkingGroup[]>(cacheKey);
        if (cached) {
          setAvailableGroups(cached);
          if (cached.length > 0) {
            setSelectedGroup(cached[0]);
          }
          toast.warning("Mostrando datos en caché");
        } else {
          setAvailableGroups([]);
        }
      } else if (result.data) {
        const groupsArray = [result.data];
        setAvailableGroups(groupsArray);
        setSelectedGroup(result.data);
        await offlineCache.set(cacheKey, groupsArray);
      }
      
      setLoading(false);
      return;
    }

    const result = await safeSupabaseQuery(
      async () => {
        const query = await supabase
          .from("parking_groups")
          .select("*")
          .in("id", state.userGroups)
          .eq("is_active", true)
          .not("floor_plan_url", "is", null);
        return query;
      },
      [],
      { logError: true, context: 'loadGroups' }
    );

    if (result.error) {
      // Fallback a cache
      const cached = await offlineCache.get<ParkingGroup[]>(cacheKey);
      if (cached) {
        setAvailableGroups(cached);
        if (cached.length > 0) {
          setSelectedGroup(cached[0]);
        }
        toast.warning("Mostrando datos en caché");
      } else {
        setAvailableGroups([]);
        toast.error("Error al cargar los grupos");
      }
    } else {
      const groups = ensureArray(result.data);
      setAvailableGroups(groups);
      if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      } else {
        toast.error("No hay grupos con planos disponibles");
      }
      await offlineCache.set(cacheKey, groups);
    }

    setLoading(false);
  };

  /**
   * Loads parking spots for a group with reservation status
   * 
   * Fetches spots with coordinates (position_x, position_y not null) and
   * assigns status based on:
   * - Spot is_active flag
   * - Existing reservations for selected date
   * - Current user's reservations
   * 
   * @param {string} groupId - Parking group UUID
   * @param {Date} date - Reservation date
   * @returns {Promise<void>}
   */
  const loadSpotsForGroup = async (groupId: string, date: Date) => {
    if (!state?.userId) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const cacheKey = `spots_${groupId}_${dateStr}`;

    // Modo offline: cargar desde cache
    if (!isOnline) {
      const cached = await offlineCache.get<SpotWithStatus[]>(cacheKey);
      if (cached) {
        setSpots(cached);
      } else {
        // Siempre retornar array vacío, nunca null
        setSpots([]);
        toast.error("No hay datos de plazas en caché");
      }
      return;
    }

    // Modo online: cargar desde servidor
    const spotsResult = await safeSupabaseQuery(
      async () => {
        const query = await supabase
          .from("parking_spots")
          .select("*")
          .eq("group_id", groupId)
          .not("position_x", "is", null)
          .not("position_y", "is", null);
        return query;
      },
      [],
      { logError: true, context: 'loadSpots' }
    );

    const reservationsResult = await safeSupabaseQuery(
      async () => {
        const query = await supabase
          .from("reservations")
          .select("spot_id, user_id")
          .eq("reservation_date", dateStr)
          .eq("status", "active");
        return query;
      },
      [],
      { logError: true, context: 'loadReservations' }
    );

    // Cargar ofertas pendientes de waitlist
    const pendingOffersResult = await safeSupabaseQuery(
      async () => {
        const query = await supabase
          .from("waitlist_offers")
          .select(`
            spot_id,
            waitlist_entries!inner (
              reservation_date
            )
          `)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .eq("waitlist_entries.reservation_date", dateStr);
        return query;
      },
      [],
      { logError: true, context: 'loadPendingOffers' }
    );

    if (spotsResult.error || reservationsResult.error || pendingOffersResult.error) {
      // Fallback a cache si falla online
      const cached = await offlineCache.get<SpotWithStatus[]>(cacheKey);
      if (cached) {
        setSpots(cached);
        toast.warning("Mostrando datos en caché");
      } else {
        setSpots([]);
        toast.error("Error al cargar las plazas");
      }
      return;
    }

    const spotsData = ensureArray(spotsResult.data);
    const reservations = ensureArray(reservationsResult.data);
    const pendingOffers = ensureArray(pendingOffersResult.data);

    const spotsWithStatus: SpotWithStatus[] = spotsData.map(spot => {
      const reservation = reservations.find(r => r.spot_id === spot.id);
      const hasPendingOffer = pendingOffers.some(o => o.spot_id === spot.id);

      let status: SpotWithStatus['status'] = 'available';
      if (!spot.is_active) {
        status = 'inactive';
      } else if (reservation) {
        status = reservation.user_id === state.userId ? 'user_reserved' : 'occupied';
      } else if (hasPendingOffer) {
        // Plazas con ofertas pendientes se marcan como ocupadas
        status = 'occupied';
      }

      return {
        ...spot,
        status,
      };
    });

    setSpots(spotsWithStatus);
    
    // Cachear datos
    await offlineCache.set(cacheKey, spotsWithStatus);
  };

  /**
   * Returns Tailwind CSS color class based on spot status and attributes
   * 
   * Color hierarchy:
   * - Available + PMR + Charger: Green (bg-green-500)
   * - Available + Charger: Yellow (bg-yellow-500)
   * - Available + PMR: Blue (bg-blue-500)
   * - Available (standard): Emerald (bg-emerald-500)
   * - Occupied: Red (bg-red-500)
   * - User Reserved: Dark Blue (bg-blue-600)
   * - Inactive: Gray (bg-gray-300)
   * 
   * @param {SpotWithStatus} spot - Spot with status
   * @returns {string} Tailwind CSS color class
   */
  const getSpotColor = (spot: SpotWithStatus): string => {
    switch (spot.status) {
      case 'available':
        if (spot.is_accessible && spot.has_charger) return 'bg-green-500';
        if (spot.has_charger) return 'bg-yellow-500';
        if (spot.is_accessible) return 'bg-blue-500';
        return 'bg-emerald-500';
      case 'occupied':
        return 'bg-red-500';
      case 'user_reserved':
        return 'bg-blue-600';
      case 'inactive':
        return 'bg-gray-300';
      default:
        return 'bg-gray-400';
    }
  };

  /**
   * Handles spot click/selection
   * 
   * **Validation**:
   * - Only available spots can be selected
   * - Shows appropriate error/info toast for non-available spots
   * 
   * **Navigation**: Navigates back to `/dashboard` with spot selection in state.
   * Calendar hook (useParkingCalendar) receives this state via navigation event
   * and creates/updates the reservation.
   * 
   * @param {SpotWithStatus} spot - Selected spot
   * @returns {void}
   */
  const handleSpotClick = (spot: SpotWithStatus) => {
    // Bloquear selección cuando offline
    if (!isOnline) {
      toast.error("No puedes seleccionar plazas sin conexión", {
        description: "Conéctate a internet para reservar plazas"
      });
      return;
    }

    if (spot.status !== 'available') {
      if (spot.status === 'occupied') {
        toast.error(`La plaza ${spot.spot_number} ya está ocupada`);
      } else if (spot.status === 'user_reserved') {
        toast.info(`Ya tienes reservada la plaza ${spot.spot_number} este día`);
      } else {
        toast.error(`La plaza ${spot.spot_number} no está disponible`);
      }
      return;
    }

    const attributesText = getSpotAttributesText(spot);
    const formattedAttributes = attributesText ? ` (${attributesText})` : '';

    toast.success(`Plaza ${spot.spot_number}${attributesText} seleccionada`);

    navigate("/dashboard", {
      state: {
        selectedSpot: {
          spotId: spot.id,
          spotNumber: spot.spot_number,
          reservationDate: selectedDate.toISOString(),
          editingReservationId: state?.editingReservationId
        }
      }
    });
  };

  useEffect(() => {
    if (!state?.userId || !state?.selectedDate) {
      toast.error("Datos de sesión inválidos");
      navigate("/dashboard");
    } else {
      loadAvailableGroups();
    }
  }, []);

  useEffect(() => {
    if (selectedGroup && selectedDate) {
      loadSpotsForGroup(selectedGroup.id, selectedDate);
    }
  }, [selectedGroup, selectedDate]);

  return {
    selectedGroup,
    setSelectedGroup,
    availableGroups,
    spots,
    viewMode,
    setViewMode,
    loading,
    selectedDate,
    availableCount,
    getSpotColor,
    handleSpotClick,
    isOnline,
    lastSync,
  };
};
