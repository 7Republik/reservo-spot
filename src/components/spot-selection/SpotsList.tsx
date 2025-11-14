import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SpotWithStatus } from "@/hooks/useSpotSelection";
import { DisabledControlTooltip } from "@/components/DisabledControlTooltip";

interface SpotsListProps {
  spots: SpotWithStatus[];
  onSpotClick: (spot: SpotWithStatus) => void;
  getSpotColor: (spot: SpotWithStatus) => string;
  isOnline?: boolean;
}

export const SpotsList = ({ spots, onSpotClick, getSpotColor, isOnline = true }: SpotsListProps) => {
  const sortedSpots = [...spots].sort((a, b) => {
    if (a.status === 'available' && b.status !== 'available') return -1;
    if (a.status !== 'available' && b.status === 'available') return 1;
    return a.spot_number.localeCompare(b.spot_number);
  });

  return (
    <ScrollArea className="h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)]">
      <div className="grid gap-2 sm:gap-3">
        {sortedSpots.map(spot => (
          <DisabledControlTooltip
            key={spot.id}
            isDisabled={!isOnline && spot.status === 'available'}
            message="Requiere conexión a internet"
          >
            <Card
              className={cn(
                "p-3 sm:p-4 transition-all duration-200",
                spot.status === 'available' && isOnline
                  ? "cursor-pointer hover:shadow-md hover:border-emerald-500"
                  : "opacity-60 cursor-not-allowed"
              )}
              onClick={() => onSpotClick(spot)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-md",
                    getSpotColor(spot)
                  )}>
                    {spot.spot_number.split('-')[1] || spot.spot_number}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">Plaza {spot.spot_number}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {spot.is_accessible && (
                        <Badge variant="outline" className="text-[0.65rem] sm:text-xs">♿ PMR</Badge>
                      )}
                      {spot.has_charger && (
                        <Badge variant="outline" className="text-[0.65rem] sm:text-xs">⚡ Cargador</Badge>
                      )}
                      {spot.is_compact && (
                        <Badge variant="outline" className="text-[0.65rem] sm:text-xs">🚗 Reducida</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={spot.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                  {spot.status === 'available' ? 'Disponible' :
                    spot.status === 'occupied' ? 'Ocupada' :
                      spot.status === 'user_reserved' ? 'Tu reserva' :
                        'No disponible'}
                </Badge>
              </div>
            </Card>
          </DisabledControlTooltip>
        ))}
      </div>
    </ScrollArea>
  );
};
