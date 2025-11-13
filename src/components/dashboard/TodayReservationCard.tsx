import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, ChevronRight } from "lucide-react";

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
 * Muestra todas las reservas activas del día en formato horizontal compacto
 */
export const TodayReservationCard = ({
  reservations,
  onViewDetails,
  onReportIncident,
}: TodayReservationCardProps) => {
  return (
    <div className="space-y-3">
      {/* Reservas */}
      <div className="flex items-center gap-3 flex-wrap">
        {reservations.map((reservation) => {
          const attributes = [];
          if (reservation.isAccessible) attributes.push("♿");
          if (reservation.hasCharger) attributes.push("⚡");
          if (reservation.isCompact) attributes.push("🚗");

          return (
            <div
              key={reservation.id}
              className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 min-w-0"
            >
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl text-foreground">
                    {reservation.spotNumber}
                  </span>
                  {attributes.length > 0 && (
                    <span className="text-sm">
                      {attributes.join(" ")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {reservation.groupName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-orange-500 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-950/20"
          onClick={() => onReportIncident(reservations[0])}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Reportar Incidencia
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails(reservations[0])}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Ver Ubicación
        </Button>
      </div>
    </div>
  );
};
