import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

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

export const useParkingCalendar = (userId: string) => {
  const navigate = useNavigate();
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
        .single();

      if (generalError && generalError.code !== "PGRST116") {
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

  const loadReservations = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
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

  const loadReservationDetails = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id,
          reservation_date,
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
        .single();

      if (error) throw error;

      const spot = data.parking_spots as any;
      const group = spot?.parking_groups as any;

      setSelectedReservationDetails({
        id: data.id,
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
          toast.error(validationResult.error_message || "No se puede reservar esta plaza");
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

      if (insertError) throw insertError;

      dayElement?.classList.remove('animate-pulse');
      dayElement?.classList.add('animate-bounce');
      setTimeout(() => {
        dayElement?.classList.remove('animate-bounce');
      }, 500);

      toast.success(`¡Plaza ${spotNumber} reservada con éxito!`);
      loadReservations();
      loadAvailableSpots();
      return true;
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error("Error al reservar la plaza");
      dayElement?.classList.remove('animate-pulse');
      return false;
    }
  };

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

  useEffect(() => {
    const handleNavigationState = async () => {
      const navigationState = window.history.state?.usr;

      if (navigationState?.selectedSpot && navigationState?.reservationDate) {
        const { spotId, spotNumber, reservationDate, editingReservationId } = navigationState.selectedSpot;

        await createReservationWithSpot(
          spotId,
          spotNumber,
          new Date(reservationDate),
          editingReservationId
        );

        window.history.replaceState({}, document.title);
      }
    };

    handleNavigationState();
  }, []);

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
  };
};
