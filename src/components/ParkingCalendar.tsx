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
      // Find an available spot
      const { data: spots, error: spotsError } = await supabase
        .from("parking_spots")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (spotsError) throw spotsError;

      if (!spots || spots.length === 0) {
        toast.error("No hay plazas disponibles");
        return;
      }

      // Check if spot is available for this date
      const { data: existing, error: checkError } = await supabase
        .from("reservations")
        .select("id")
        .eq("spot_id", spots[0].id)
        .eq("reservation_date", dateStr)
        .eq("status", "active");

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        toast.error("Esta plaza ya está ocupada para este día");
        loadAvailableSpots();
        return;
      }

      // Create reservation
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({
          user_id: userId,
          spot_id: spots[0].id,
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
      <div className="grid grid-cols-7 gap-2">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
            {day}
          </div>
        ))}
        
        {/* Add empty cells for days before month starts */}
        {Array.from({ length: startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1 }).map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
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
              className={`p-3 min-h-[100px] flex flex-col justify-between transition-all ${
                !isSameMonth(day, currentMonth) ? "opacity-50" : ""
              } ${isToday(day) ? "ring-2 ring-primary" : ""} ${
                reserved ? "bg-success/10 border-success" : 
                available > 0 && !isPast ? "hover:border-primary cursor-pointer" : ""
              } ${isPast ? "opacity-50" : ""}`}
              onClick={() => {
                if (!reserved && available > 0 && isSameMonth(day, currentMonth) && !isPast) {
                  handleReserve(day);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <span className={`text-sm font-medium ${isToday(day) ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </span>
                {reserved && (
                  <Badge variant="default" className="bg-success text-success-foreground text-xs">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                {!isPast && available > 0 && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${available > 5 ? "border-available text-available" : "border-warning text-warning"}`}
                  >
                    {available} libres
                  </Badge>
                )}
                {!isPast && available === 0 && !reserved && (
                  <Badge variant="outline" className="text-xs border-occupied text-occupied">
                    Completo
                  </Badge>
                )}
                {reserved && reservation && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full text-xs h-6"
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-available bg-success/10" />
          <span className="text-muted-foreground">Tu reserva</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-primary" />
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-occupied" />
          <span className="text-muted-foreground">Completo</span>
        </div>
      </div>
    </div>
  );
};

export default ParkingCalendar;
