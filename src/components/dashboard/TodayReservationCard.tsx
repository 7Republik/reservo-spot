import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { MapPin, AlertCircle, Calendar } from "lucide-react";
import { getIconProps } from "@/lib/iconConfig";

interface Reservation {
  id: string;
  spotNumber: string;
  groupName: string;
  isAccessible: boolean;
  hasCharger: boolean;
  isCompact: boolean;
}

interface TodayReservationCardProps {
  reservations: Reservation[];
  onViewDetails: (reservation: Reservation) => void;
  onReportIncident: (reservation: Reservation) => void;
}

/**
 * Contenido de las reservas de hoy
 * Muestra todas las reservas activas del día con diseño premium
 */
export const TodayReservationCard = ({
  reservations,
  onViewDetails,
  onReportIncident,
}: TodayReservationCardProps) => {
  // Empty state cuando no hay reservas
  if (!reservations || reservations.length === 0) {
    return (
      <GlassCard 
        variant="light" 
        blur="md" 
        hover={false}
        className="p-4 md:p-6"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <AnimatedIcon
            icon={<Calendar {...getIconProps("2xl", "muted")} />}
            animation="float"
            size="xl"
          />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              No tienes reservas para hoy
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              ¡Reserva tu plaza ahora y asegura tu espacio de estacionamiento!
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Reservas */}
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        {reservations.map((reservation, index) => {
          const attributes = [];
          if (reservation.isAccessible) attributes.push("♿");
          if (reservation.hasCharger) attributes.push("⚡");
          if (reservation.isCompact) attributes.push("🚗");

          return (
            <div
              key={reservation.id}
              className="p-3 md:p-5 flex-1 min-w-0 bg-card border border-border rounded-2xl md:rounded-3xl shadow-sm relative"
            >
              <div className="flex items-center justify-between gap-3 md:gap-4 relative z-10">
                {/* Número de plaza con mejor contraste - IZQUIERDA */}
                <div className="flex items-center gap-2 md:gap-3 relative z-20">
                  <span 
                    className="font-extrabold text-primary"
                    style={{
                      fontSize: "clamp(40px, 8vw, 56px)",
                      letterSpacing: "-0.03em",
                      lineHeight: "1",
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    }}
                  >
                    {reservation.spotNumber}
                  </span>
                  {attributes.length > 0 && (
                    <span className="text-xl md:text-2xl">
                      {attributes.join(" ")}
                    </span>
                  )}
                </div>

                {/* Ubicación con icono animado - DERECHA */}
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                  <AnimatedIcon
                    icon={<MapPin {...getIconProps("responsive", "primary")} />}
                    animation="pulse"
                    size="md"
                    duration={2000}
                  />
                  <p className="text-sm md:text-base text-muted-foreground truncate font-medium">
                    {reservation.groupName}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider entre reservas y acciones */}
      <div className="h-px bg-border md:bg-gradient-to-r md:from-transparent md:via-primary/30 md:to-transparent my-2 md:my-3" />

      {/* Botones de acción - siempre en la misma línea */}
      <div className="flex gap-2 md:gap-3">
        <GradientButton
          variant="primary"
          size="sm"
          icon={
            <AnimatedIcon
              icon={<AlertCircle className="h-4 w-4 text-white" />}
              animation="bounce"
              size="md"
            />
          }
          iconPosition="left"
          onClick={() => onReportIncident(reservations[0])}
          className="flex-1 text-white text-xs md:text-sm px-3 md:px-4"
          aria-label="Reportar incidencia en la plaza de estacionamiento"
        >
          Reportar Incidencia
        </GradientButton>
        
        <GradientButton
          variant="secondary"
          size="sm"
          icon={<MapPin className="h-4 w-4 text-white" />}
          iconPosition="left"
          onClick={() => onViewDetails(reservations[0])}
          className="flex-1 text-xs md:text-sm px-3 md:px-4"
          aria-label="Ver ubicación de la plaza en el mapa"
        >
          Ver Ubicación
        </GradientButton>
      </div>
    </div>
  );
};
