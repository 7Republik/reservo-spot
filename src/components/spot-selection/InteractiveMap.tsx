import { Card } from "@/components/ui/card";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomControls } from "./ZoomControls";
import { MapSkeleton } from "./MapSkeleton";
import { cn } from "@/lib/utils";
import { ParkingGroup, SpotWithStatus } from "@/hooks/useSpotSelection";
import { DisabledControlTooltip } from "@/components/DisabledControlTooltip";
import { Badge } from "@/components/ui/badge";
import { WifiOff } from "lucide-react";

interface InteractiveMapProps {
  selectedGroup: ParkingGroup | null;
  spots: SpotWithStatus[];
  onSpotClick: (spot: SpotWithStatus) => void;
  getSpotColor: (spot: SpotWithStatus) => string;
  isOnline?: boolean;
  lastSync?: Date | null;
  loading?: boolean;
}

export const InteractiveMap = ({ 
  selectedGroup, 
  spots, 
  onSpotClick, 
  getSpotColor,
  isOnline = true,
  lastSync = null,
  loading = false
}: InteractiveMapProps) => {
  const buttonSize = selectedGroup?.button_size || 32;

  // Verificar si hay datos disponibles
  const hasData = selectedGroup && spots.length > 0;
  const showOfflineBadge = !isOnline && hasData;

  // Mostrar skeleton mientras carga
  if (loading) {
    return <MapSkeleton />;
  }

  return (
    <Card className="overflow-hidden relative">
      {/* Badge de modo offline */}
      {showOfflineBadge && (
        <div className="absolute top-2 right-2 z-50">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
            <WifiOff className="h-3 w-3 mr-1" />
            Modo offline
          </Badge>
        </div>
      )}

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: "zoomIn" }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <ZoomControls
              onZoomIn={() => zoomIn()}
              onZoomOut={() => zoomOut()}
              onReset={() => resetTransform()}
            />

            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: window.innerWidth < 640 ? "350px" : window.innerWidth < 1024 ? "450px" : "550px",
                backgroundColor: "#f9fafb"
              }}
              contentStyle={{
                width: "100%",
                minHeight: "100%"
              }}
            >
              <div style={{ position: "relative", width: "100%", minHeight: "400px" }}>
                {!hasData && !isOnline ? (
                  // Mensaje cuando no hay cache offline
                  <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                    <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      Mapa no disponible offline
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Conéctate a internet para ver el mapa de plazas
                    </p>
                  </div>
                ) : selectedGroup?.floor_plan_url ? (
                  <>
                    <img
                      src={selectedGroup.floor_plan_url}
                      alt={`Plano ${selectedGroup.name}`}
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />

                    {spots.map(spot => (
                      <DisabledControlTooltip
                        key={spot.id}
                        isDisabled={!isOnline && spot.status === 'available'}
                        message="Requiere conexión a internet"
                      >
                        <div
                          className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2",
                            "rounded-lg flex items-center justify-center",
                            "text-white font-bold shadow-lg border-2 border-white",
                            "transition-all duration-200",
                            getSpotColor(spot),
                            // Resaltar plaza reservada incluso offline
                            spot.status === 'user_reserved' 
                              ? "ring-4 ring-blue-300 ring-offset-2 scale-110 z-40"
                              : "",
                            // Permitir hover solo en plazas disponibles y online
                            spot.status === 'available' && isOnline
                              ? "cursor-pointer hover:scale-125 hover:shadow-xl hover:z-50"
                              : "cursor-not-allowed opacity-70"
                          )}
                          style={{
                            left: `${spot.position_x}%`,
                            top: `${spot.position_y}%`,
                            width: `${buttonSize}px`,
                            height: `${buttonSize}px`,
                            fontSize: `${Math.max(buttonSize * 0.35, 10)}px`,
                          }}
                          onClick={() => onSpotClick(spot)}
                          title={`Plaza ${spot.spot_number} - ${spot.status === 'available' ? 'Disponible' :
                            spot.status === 'occupied' ? 'Ocupada' :
                              spot.status === 'user_reserved' ? 'Tu reserva' :
                                'No disponible'
                            }`}
                        >
                          <span className="drop-shadow-md">
                            {spot.spot_number.split('-')[1] || spot.spot_number}
                          </span>
                        </div>
                      </DisabledControlTooltip>
                    ))}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No hay plano disponible
                  </div>
                )}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </Card>
  );
};
