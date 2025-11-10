import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

export const useSpotSelection = (state: LocationState | null) => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<ParkingGroup | null>(null);
  const [availableGroups, setAvailableGroups] = useState<ParkingGroup[]>([]);
  const [spots, setSpots] = useState<SpotWithStatus[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);

  const selectedDate = state?.selectedDate ? new Date(state.selectedDate) : new Date();
  const availableCount = spots.filter(s => s.status === 'available').length;

  const loadAvailableGroups = async () => {
    if (!state?.userId || !state?.userGroups) return;

    try {
      setLoading(true);

      if (state.selectedGroupId) {
        const { data, error } = await supabase
          .from("parking_groups")
          .select("*")
          .eq("id", state.selectedGroupId)
          .eq("is_active", true)
          .single();

        if (error) throw error;

        setAvailableGroups([data]);
        setSelectedGroup(data);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("parking_groups")
        .select("*")
        .in("id", state.userGroups)
        .eq("is_active", true)
        .not("floor_plan_url", "is", null);

      if (error) throw error;

      setAvailableGroups(data || []);
      if (data && data.length > 0) {
        setSelectedGroup(data[0]);
      } else {
        toast.error("No hay grupos con planos disponibles");
      }
    } catch (error: any) {
      console.error("Error loading groups:", error);
      toast.error("Error al cargar los grupos");
    } finally {
      setLoading(false);
    }
  };

  const loadSpotsForGroup = async (groupId: string, date: Date) => {
    if (!state?.userId) return;

    try {
      const dateStr = format(date, "yyyy-MM-dd");

      const { data: spotsData, error: spotsError } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("group_id", groupId)
        .not("position_x", "is", null)
        .not("position_y", "is", null);

      if (spotsError) throw spotsError;

      const { data: reservations, error: reservationsError } = await supabase
        .from("reservations")
        .select("spot_id, user_id")
        .eq("reservation_date", dateStr)
        .eq("status", "active");

      if (reservationsError) throw reservationsError;

      const spotsWithStatus: SpotWithStatus[] = (spotsData || []).map(spot => {
        const reservation = reservations?.find(r => r.spot_id === spot.id);

        let status: SpotWithStatus['status'] = 'available';
        if (!spot.is_active) {
          status = 'inactive';
        } else if (reservation) {
          status = reservation.user_id === state.userId ? 'user_reserved' : 'occupied';
        }

        return {
          ...spot,
          status,
        };
      });

      setSpots(spotsWithStatus);
    } catch (error: any) {
      console.error("Error loading spots:", error);
      toast.error("Error al cargar las plazas");
    }
  };

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

  const handleSpotClick = (spot: SpotWithStatus) => {
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

    const attributes = [];
    if (spot.is_accessible) attributes.push('♿ PMR');
    if (spot.has_charger) attributes.push('⚡ Cargador');
    if (spot.is_compact) attributes.push('🚗 Reducida');

    const attributesText = attributes.length > 0 ? ` (${attributes.join(', ')})` : '';

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
  };
};
