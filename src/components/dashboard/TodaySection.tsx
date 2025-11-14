import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TodayReservationCard } from "./TodayReservationCard";
import { TodayCheckinCard } from "./TodayCheckinCard";
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
  const [checkinEnabled, setCheckinEnabled] = useState(false);

  const loadTodayReservations = useCallback(async () => {
    // Usar fecha UTC para coincidir con CURRENT_DATE de Supabase
    const now = new Date();
    const today = format(new Date(now.getTime() + now.getTimezoneOffset() * 60000), "yyyy-MM-dd");
    
    // Cargar configuración de check-in
    const { data: settings } = await supabase
      .from("checkin_settings")
      .select("system_enabled")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single();
    
    setCheckinEnabled(settings?.system_enabled || false);
    
    // Cargar reservas con información de check-in
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id,
        user_id,
        reservation_date,
        status,
        created_at,
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
      // Cargar información de check-in para cada reserva
      const reservationIds = data.map(r => r.id);
      const { data: checkins } = await supabase
        .from("reservation_checkins")
        .select("*")
        .in("reservation_id", reservationIds);

      const formattedReservations = data.map(res => {
        const spot = res.parking_spots as any;
        const group = spot?.parking_groups as any;
        const checkin = checkins?.find(c => c.reservation_id === res.id);

        return {
          id: res.id,
          userId: res.user_id,
          spotNumber: spot?.spot_number || "",
          groupName: group?.name || "",
          spotId: spot?.id || "",
          isAccessible: spot?.is_accessible || false,
          hasCharger: spot?.has_charger || false,
          isCompact: spot?.is_compact || false,
          // Datos adicionales para check-in
          user_id: res.user_id,
          spot_id: spot?.id || "",
          reservation_date: res.reservation_date,
          status: res.status,
          created_at: res.created_at,
          checkin: checkin || undefined,
          spot: {
            spot_number: spot?.spot_number || "",
            group: {
              name: group?.name || ""
            }
          }
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
          <div className="space-y-4">
            {/* Check-in/Check-out Card - Solo si está habilitado */}
            {checkinEnabled && <TodayCheckinCard reservation={todayReservations[0]} />}
            
            {/* Información de la reserva y acciones */}
            <TodayReservationCard
              reservations={todayReservations}
              onViewDetails={onViewDetails}
              onReportIncident={onReportIncident}
            />
          </div>
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
