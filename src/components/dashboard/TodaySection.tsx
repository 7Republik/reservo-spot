import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TodayReservationCard } from "./TodayReservationCard";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TodaySectionProps {
  userId: string;
  refreshTrigger?: number;
  onViewDetails: (reservation: any) => void;
  onReportIncident: (reservation: any) => void;
}

/**
 * Sección HOY del dashboard
 * Muestra las reservas activas del día actual
 * Siempre visible, incluso si no hay reservas
 * Se actualiza automáticamente cuando refreshTrigger cambia
 */
export const TodaySection = ({
  userId,
  refreshTrigger = 0,
  onViewDetails,
  onReportIncident,
}: TodaySectionProps) => {
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTodayReservations = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id,
        user_id,
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
      .eq("user_id", userId)
      .eq("reservation_date", today)
      .eq("status", "active");

    if (error) {
      console.error("Error loading today's reservations:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const formattedReservations = data.map(res => {
        const spot = res.parking_spots as any;
        const group = spot?.parking_groups as any;

        return {
          id: res.id,
          userId: res.user_id,
          spotNumber: spot?.spot_number || "",
          groupName: group?.name || "",
          spotId: spot?.id || "",
          isAccessible: spot?.is_accessible || false,
          hasCharger: spot?.has_charger || false,
          isCompact: spot?.is_compact || false,
        };
      });

      setTodayReservations(formattedReservations);
    } else {
      setTodayReservations([]);
    }
    
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadTodayReservations();
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadTodayReservations, 30000);
    
    return () => clearInterval(interval);
  }, [loadTodayReservations]);

  // Recargar cuando cambia refreshTrigger (cuando se crea/cancela una reserva)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadTodayReservations();
    }
  }, [refreshTrigger, loadTodayReservations]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-primary" />
          Hoy
        </CardTitle>
        <CardDescription className="text-sm capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Cargando...
          </div>
        ) : todayReservations.length > 0 ? (
          <TodayReservationCard
            reservations={todayReservations}
            onViewDetails={onViewDetails}
            onReportIncident={onReportIncident}
          />
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm font-medium">No tienes reservas para hoy</p>
            <p className="text-xs mt-1">Selecciona un día en el calendario para reservar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
