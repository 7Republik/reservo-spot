import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Check, X, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

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

const ParkingCalendar = ({ userId, userRole }: ParkingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableSpots, setAvailableSpots] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
    loadAvailableSpots();
  }, [currentMonth, userId]);

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
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end });

      const spotsData: Record<string, number> = {};

      for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        
        // Get total spots based on user role
        const { data: totalSpots, error: spotsError } = await supabase
          .from("parking_spots")
          .select("id")
          .eq("is_active", true);

        if (spotsError) throw spotsError;

        // Get occupied spots for this date
        const { data: occupied, error: occupiedError } = await supabase
          .from("reservations")
          .select("spot_id")
          .eq("reservation_date", dateStr)
          .eq("status", "active");

        if (occupiedError) throw occupiedError;

        const available = (totalSpots?.length || 0) - (occupied?.length || 0);
        spotsData[dateStr] = available;
      }

      setAvailableSpots(spotsData);
    } catch (error: any) {
      console.error("Error loading available spots:", error);
    }
  };

  const handleReserve = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    try {
      // Get all active spots
      const { data: allSpots, error: spotsError } = await supabase
        .from("parking_spots")
        .select("id")
        .eq("is_active", true);

      if (spotsError) throw spotsError;

      if (!allSpots || allSpots.length === 0) {
        toast.error("No hay plazas disponibles");
        return;
      }

      // Get occupied spots for this date
      const { data: occupied, error: occupiedError } = await supabase
        .from("reservations")
        .select("spot_id")
        .eq("reservation_date", dateStr)
        .eq("status", "active");

      if (occupiedError) throw occupiedError;

      const occupiedIds = occupied?.map(r => r.spot_id) || [];
      const availableSpot = allSpots.find(spot => !occupiedIds.includes(spot.id));

      if (!availableSpot) {
        toast.error("No hay plazas disponibles para este día");
        loadAvailableSpots();
        return;
      }

      // Create reservation
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          user_id: userId,
          spot_id: availableSpot.id,
          reservation_date: dateStr,
          status: "active",
        });

      if (insertError) throw insertError;

      toast.success("¡Plaza reservada con éxito!");
      loadReservations();
      loadAvailableSpots();
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error("Error al reservar la plaza");
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
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          ← Anterior
        </Button>
        <h2 className="text-xl font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          Siguiente →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
          <div key={day} className="text-center font-semibold text-xs sm:text-sm text-muted-foreground py-2">
            <span className="hidden sm:inline">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][index]}</span>
            <span className="sm:hidden">{day}</span>
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
              className={`p-2 sm:p-3 min-h-[80px] sm:min-h-[100px] flex flex-col justify-between transition-all relative ${
                !isSameMonth(day, currentMonth) ? "opacity-30" : ""
              } ${isToday(day) ? "ring-2 ring-primary shadow-md" : ""} ${
                reserved ? "bg-success/10 border-success" : 
                available > 0 && !isPast ? "hover:border-primary hover:shadow-sm cursor-pointer active:scale-95" : ""
              } ${isPast ? "opacity-40 cursor-not-allowed" : ""}`}
              onClick={() => {
                if (!reserved && available > 0 && isSameMonth(day, currentMonth) && !isPast) {
                  handleReserve(day);
                }
              }}
            >
              <div className="flex items-start justify-between gap-1">
                <span className={`text-xs sm:text-sm font-semibold ${
                  isToday(day) ? "text-primary" : 
                  reserved ? "text-success" : 
                  "text-foreground"
                }`}>
                  {format(day, "d")}
                </span>
                {reserved && (
                  <div className="bg-success rounded-full p-0.5">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1 mt-auto">
                {!isPast && !reserved && (
                  <div className="text-[10px] sm:text-xs font-medium text-center">
                    {available > 0 ? (
                      <span className={available > 5 ? "text-available" : "text-warning"}>
                        {available}
                      </span>
                    ) : (
                      <span className="text-occupied">0</span>
                    )}
                  </div>
                )}
                {reserved && reservation && !isPast && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-[10px] sm:text-xs h-5 sm:h-6 text-destructive hover:text-destructive hover:bg-destructive/10 px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(reservation.id);
                    }}
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-center text-xs sm:text-sm bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-success bg-success/10 flex items-center justify-center">
            <Check className="h-2 w-2 text-success" />
          </div>
          <span className="text-muted-foreground">Tu reserva</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-available">
            <div className="text-[8px] font-bold text-available text-center leading-[8px]">5+</div>
          </div>
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-occupied">
            <div className="text-[8px] font-bold text-occupied text-center leading-[8px]">0</div>
          </div>
          <span className="text-muted-foreground">Completo</span>
        </div>
      </div>
    </div>
  );
};

export default ParkingCalendar;
