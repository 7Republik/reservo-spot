import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Check, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import ParkingMapSelector from "./ParkingMapSelector";

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableSpots, setAvailableSpots] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [userGroupNames, setUserGroupNames] = useState<string[]>([]);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [selectedDateForMap, setSelectedDateForMap] = useState<Date | null>(null);

  useEffect(() => {
    loadUserGroups();
  }, [userId]);

  useEffect(() => {
    if (userGroups.length > 0) {
      loadReservations();
      loadAvailableSpots();
    }
  }, [currentMonth, userId, userGroups]);

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
      if (userGroups.length === 0) {
        setAvailableSpots({});
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
    }
  };

  const handleReserve = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Validar que el usuario tiene grupos asignados
    if (userGroups.length === 0) {
      toast.error("No tienes acceso a ningún grupo de parking", {
        description: "Contacta con el administrador",
      });
      return;
    }

    // Verificar que hay plazas disponibles
    const available = availableSpots[dateStr] || 0;
    
    if (available === 0) {
      toast.error("No hay plazas disponibles para este día");
      return;
    }

    // Abrir selector visual
    setSelectedDateForMap(date);
    setShowMapSelector(true);
  };

  const createReservationWithSpot = async (spotId: string, spotNumber: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayElement = document.querySelector(`[data-date="${dateStr}"]`);
    
    dayElement?.classList.add('animate-pulse');
    
    try {
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
      setShowMapSelector(false);
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
      {/* Info de grupos asignados */}
      {userGroupNames.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Tienes acceso a {userGroupNames.length} {userGroupNames.length === 1 ? "grupo" : "grupos"} de parking
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {userGroupNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

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

      {/* Month Navigation - Mejorado con diseño moderno */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-100 transition-colors duration-200"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="px-6 py-3 rounded-full bg-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-100 transition-colors duration-200"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid - Con mejoras visuales */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4">
        {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
          <div key={day} className="text-center font-semibold text-[0.95rem] sm:text-sm text-gray-600 py-3">
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
              className={`group relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg min-h-[88px] sm:min-h-[100px] flex flex-col justify-between cursor-pointer ${
                !isSameMonth(day, currentMonth) ? "opacity-30" : ""
              } ${isToday(day) ? "ring-2 ring-blue-500 shadow-md" : ""} ${
                reserved ? "bg-emerald-50 border-emerald-500" : 
                available > 0 && !isPast ? "hover:border-blue-300 hover:shadow-md" : ""
              } ${isPast ? "opacity-40 cursor-not-allowed" : ""}`}
              onClick={() => {
                if (!reserved && available > 0 && isSameMonth(day, currentMonth) && !isPast) {
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
                  if (!reserved && available > 0 && isSameMonth(day, currentMonth) && !isPast) {
                    handleReserve(day);
                  }
                }
              }}
            >
              {/* Fondo con gradiente suave */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              {/* Contenido principal */}
              <div className="relative z-10 p-2 sm:p-3 flex flex-col h-full">
                {/* Número del día con mejor jerarquía */}
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className={`text-lg sm:text-xl font-bold ${
                    isToday(day) ? "text-blue-600" : 
                    reserved ? "text-emerald-700" : 
                    "text-gray-900"
                  }`}>
                    {format(day, "d")}
                  </span>
                  {/* Icono de estado más prominente */}
                  {reserved && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Indicador de disponibilidad más visual */}
                <div className="mt-auto">
                  {!isPast && !reserved && available > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span className="hidden sm:inline text-xs font-medium text-emerald-700">
                        {available} disponibles
                      </span>
                      <span className="sm:hidden text-xs font-semibold text-emerald-700" aria-hidden="true">
                        {available}
                      </span>
                    </div>
                  )}
                  {available === 0 && !isPast && !reserved && (
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden="true" />
                      <span className="hidden sm:inline text-xs font-medium text-red-700">
                        Completo
                      </span>
                      <span className="sr-only">Completo</span>
                    </div>
                  )}
                </div>
                
                {/* Botón de cancelar */}
                {reserved && reservation && !isPast && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs h-7 sm:h-6 text-red-600 hover:text-red-700 hover:bg-red-50 mt-2 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(reservation.id);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend - Rediseñada con estilo moderno */}
      <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm" />
          <span className="text-sm font-medium text-gray-700">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-sm font-medium text-gray-700">Tu reserva</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm" />
          <span className="text-sm font-medium text-gray-700">Completo</span>
        </div>
      </div>

      {/* Parking Map Selector */}
      <ParkingMapSelector
        isOpen={showMapSelector}
        userId={userId}
        selectedDate={selectedDateForMap}
        userGroups={userGroups}
        onSpotSelected={(spotId, spotNumber) => {
          if (selectedDateForMap) {
            createReservationWithSpot(spotId, spotNumber, selectedDateForMap);
          }
        }}
        onCancel={() => setShowMapSelector(false)}
      />
    </div>
  );
};

export default ParkingCalendar;
