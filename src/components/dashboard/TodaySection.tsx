import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TodayReservationCard } from "./TodayReservationCard";
import { TodayReservationSkeleton } from "./TodayReservationSkeleton";
import { TodayCheckinCard } from "./TodayCheckinCard";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { getIconProps } from "@/lib/iconConfig";

interface TodaySectionProps {
  userId: string;
  refreshTrigger?: number;
  onViewDetails: (reservation: any) => void;
  onReportIncident: (reservation: any) => void;
  onReservationUpdate?: () => void;
}

// Crear un contexto simple para forzar recarga
let forceReloadCallback: (() => void) | null = null;

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
  onReservationUpdate,
}: TodaySectionProps) => {
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinEnabled, setCheckinEnabled] = useState(false);

  const loadTodayReservations = useCallback(async () => {
    try {
      // Verificar que el usuario esté autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[TodaySection] No active session');
        setLoading(false);
        return;
      }

      // Usar fecha local del usuario (España: UTC+1)
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Cargar configuración de check-in
      const { data: settings } = await supabase
        .from("checkin_settings")
        .select("system_enabled")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();
      
      setCheckinEnabled(settings?.system_enabled || false);
      
      // Cargar reservas del día
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", userId)
        .eq("reservation_date", today)
        .eq("status", "active");

      if (error) {
        // No loggear errores, solo manejarlos silenciosamente
        setTodayReservations([]);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
      // Cargar información de check-in para cada reserva
      const reservationIds = data.map(r => r.id);
      const spotIds = data.map(r => r.spot_id);
      
      const { data: checkins } = await supabase
        .from("reservation_checkins")
        .select("*")
        .in("reservation_id", reservationIds);
      
      // Cargar información de plazas
      const { data: spots } = await supabase
        .from("parking_spots")
        .select("id, spot_number, is_accessible, has_charger, is_compact, group_id")
        .in("id", spotIds);
      
      // Cargar información de grupos
      const groupIds = spots?.map(s => s.group_id).filter(Boolean) || [];
      const { data: groups } = await supabase
        .from("parking_groups")
        .select("id, name")
        .in("id", groupIds);

      const formattedReservations = data.map(res => {
        const spot = spots?.find(s => s.id === res.spot_id);
        const group = groups?.find(g => g.id === spot?.group_id);
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
    } catch (err) {
      // Manejar errores silenciosamente
      setTodayReservations([]);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Solo cargar si hay userId válido
    if (!userId) {
      setLoading(false);
      return;
    }

    loadTodayReservations();
    
    // Registrar callback para recarga forzada
    forceReloadCallback = loadTodayReservations;
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadTodayReservations, 30000);
    
    return () => {
      clearInterval(interval);
      forceReloadCallback = null;
    };
  }, [loadTodayReservations, userId]);

  // Recargar cuando cambia refreshTrigger (cuando se crea/cancela una reserva)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadTodayReservations();
    }
  }, [refreshTrigger, loadTodayReservations]);

  return (
    <div className="today-section-container">
      <Card className="today-section-card">
        <CardHeader className="pb-3 px-4 md:px-6 pt-2 md:pt-4">
          <div className="flex items-center gap-2 md:gap-2.5">
            <AnimatedIcon 
              animation="float" 
              duration={3000}
              icon={<Calendar {...getIconProps("responsive", "primary")} />}
            />
            <p className="text-base md:text-lg capitalize font-semibold text-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TodayReservationSkeleton />
          ) : todayReservations.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {/* Check-in/Check-out Card - Solo si está habilitado */}
              {checkinEnabled && (
                <div className="today-card-animated" style={{ animationDelay: '0ms' }}>
                  <TodayCheckinCard 
                    reservation={todayReservations[0]} 
                    onCheckinSuccess={() => {
                      loadTodayReservations();
                      if (onReservationUpdate) onReservationUpdate();
                    }}
                  />
                </div>
              )}
              
              {/* Información de la reserva y acciones */}
              <div className="today-card-animated" style={{ animationDelay: checkinEnabled ? '100ms' : '0ms' }}>
                <TodayReservationCard
                  reservations={todayReservations}
                  onViewDetails={onViewDetails}
                  onReportIncident={onReportIncident}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm font-medium">No tienes reservas para hoy</p>
              <p className="text-xs mt-1">Selecciona un día en el calendario para reservar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
