import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Check, X, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import ReservationDetailsModal from "./ReservationDetailsModal";
import GroupSelectorModal from "./GroupSelectorModal";

interface ParkingCalendarProps {
  userId: string;
  userRole: string;
}

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

const ParkingCalendar = ({ userId, userRole }: ParkingCalendarProps) => {
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

  const loadUserGroups = async () => {
    try {
      // Obtener grupos asignados al usuario
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

      // Obtener el grupo "General" que es accesible por todos
      const { data: generalGroup, error: generalError } = await supabase
        .from("parking_groups")
        .select("id, name")
        .eq("name", "General")
        .eq("is_active", true)
        .single();

      if (generalError && generalError.code !== "PGRST116") {
        console.error("Error loading general group:", generalError);
      }

      // Combinar grupos asignados + grupo General
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

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end });

      const spotsData: Record<string, number> = {};

      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        
        // Get total spots from user's accessible groups
        const { data: totalSpots, error: spotsError } = await supabase
          .from("parking_spots")
          .select("id, group_id")
          .eq("is_active", true)
          .in("group_id", userGroups);

        if (spotsError) throw spotsError;

        // Get occupied spots for this date
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

      // Validate reservation using database function
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

      // Check validation result
      if (validation && validation.length > 0) {
        const validationResult = validation[0];
        if (!validationResult.is_valid) {
          toast.error(validationResult.error_message || "No se puede reservar esta plaza");
          dayElement?.classList.remove('animate-pulse');
          return false;
        }
        // Show warning if compact spot
        if (validationResult.error_code === "COMPACT_SPOT_WARNING") {
          toast.warning(validationResult.error_message);
        }
      }

      // Create reservation
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          user_id: userId,
          spot_id: spotId,
          reservation_date: dateStr,
          status: "active",
        });

      if (insertError) throw insertError;

      // Success animation
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

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const isReserved = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return reservations.some(r => r.reservation_date === dateStr);
  };

  const getReservation = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return reservations.find(r => r.reservation_date === dateStr);
  };

  const isPastDate = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  return (
    <div className="space-y-6">

      {userGroups.length === 0 && !loading && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                No tienes acceso a ningún grupo de parking
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Contacta con el administrador para que te asigne acceso a los grupos correspondientes
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Month Navigation - Optimizado para móvil */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        
        <div className="px-3 py-2 sm:px-6 sm:py-3 rounded-full bg-gray-100">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight capitalize">
            {format(currentMonth, "MMM yyyy", { locale: es })}
          </h2>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Calendar Grid - Optimizado para móvil */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
        {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
          <div key={day} className="text-center font-bold text-[0.7rem] sm:text-sm text-gray-700 py-1 sm:py-2">
            {day}
          </div>
        ))}
        
        {/* Add empty cells for days before month starts */}
        {Array.from({ length: startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1 }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        
        {days.map((day) => {
          const reserved = isReserved(day);
          const reservation = getReservation(day);
          const dateStr = format(day, "yyyy-MM-dd");
          const available = availableSpots[dateStr] || 0;
          const isPast = isPastDate(day);

          return (
            <Card
              key={day.toString()}
              data-date={dateStr}
              className={`group relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg min-h-[70px] sm:min-h-[90px] md:min-h-[100px] flex flex-col justify-between cursor-pointer ${
                !isSameMonth(day, currentMonth) ? "opacity-30" : ""
              } ${isToday(day) ? "ring-2 ring-blue-500 shadow-md" : ""} ${
                reserved ? "bg-emerald-50 border-emerald-500" : 
                available > 0 && !isPast ? "hover:border-blue-300 hover:shadow-md" : ""
              } ${isPast ? "opacity-40 cursor-not-allowed" : ""}`}
              onClick={() => {
                if (reserved && reservation && !isPast) {
                  loadReservationDetails(reservation.id);
                } else if (!reserved && available > 0 && isSameMonth(day, currentMonth) && !isPast) {
                  handleReserve(day);
                }
              }}
              role="button"
              aria-label={`Día ${format(day, "d")}, ${available} plazas disponibles`}
              aria-pressed={reserved}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (reserved && reservation && !isPast) {
                    loadReservationDetails(reservation.id);
                  } else if (!reserved && available > 0 && isSameMonth(day, currentMonth) && !isPast) {
                    handleReserve(day);
                  }
                }
              }}
            >
              {/* Fondo con gradiente suave */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              {/* Contenido principal */}
              <div className="relative z-10 p-1 sm:p-2 md:p-3 flex flex-col h-full">
                {/* Número del día */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-base sm:text-lg md:text-xl font-bold ${
                    isToday(day) ? "text-blue-600" : 
                    reserved ? "text-emerald-700" : 
                    "text-gray-900"
                  }`}>
                    {format(day, "d")}
                  </span>
                  {/* Icono de estado */}
                  {reserved && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Indicador de disponibilidad */}
                <div className="mt-auto">
                  {/* Mostrar skeleton mientras carga */}
                  {loadingSpots && !reserved && !isPast && (
                    <div className="flex items-center gap-0.5 sm:gap-1 animate-pulse">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300" />
                      <div className="h-3 w-6 bg-gray-200 rounded" />
                    </div>
                  )}
                  
                  {/* Mostrar disponibilidad real solo cuando terminó de cargar */}
                  {!loadingSpots && !isPast && !reserved && available > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span className="text-[0.6rem] sm:text-xs font-medium text-emerald-700">
                        {available}
                      </span>
                    </div>
                  )}
                  {!loadingSpots && available === 0 && !isPast && !reserved && (
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" aria-hidden="true" />
                      <span className="text-[0.6rem] sm:text-xs font-medium text-red-700">
                        No
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend - Ultra compacta para móvil */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-1 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">Disponible</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-emerald-50 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
          <span className="text-[0.65rem] sm:text-xs font-medium text-emerald-700 whitespace-nowrap">Tu reserva</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
          <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">Completo</span>
        </div>
      </div>

      {/* Parking Map Selector */}
      <GroupSelectorModal
        isOpen={showGroupSelector}
        selectedDate={selectedDateForMap}
        userGroups={userGroups}
        userId={userId}
        onGroupSelected={handleGroupSelected}
        onQuickReserve={handleQuickReserve}
        onCancel={() => setShowGroupSelector(false)}
      />

      <ReservationDetailsModal
        isOpen={showReservationDetails}
        reservation={selectedReservationDetails}
        onCancel={handleCancel}
        onEdit={handleEditReservation}
        onClose={() => {
          setShowReservationDetails(false);
          setSelectedReservationDetails(null);
        }}
      />
    </div>
  );
};

export default ParkingCalendar;
