import { Card } from "@/components/ui/card";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomControls } from "./ZoomControls";
import { cn } from "@/lib/utils";
import { ParkingGroup, SpotWithStatus } from "@/hooks/useSpotSelection";

interface InteractiveMapProps {
  selectedGroup: ParkingGroup | null;
  spots: SpotWithStatus[];
  onSpotClick: (spot: SpotWithStatus) => void;
  getSpotColor: (spot: SpotWithStatus) => string;
}

export const InteractiveMap = ({ 
  selectedGroup, 
  spots, 
  onSpotClick, 
  getSpotColor 
}: InteractiveMapProps) => {
  const buttonSize = selectedGroup?.button_size || 32;

  return (
    <Card className="overflow-hidden">
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
                {selectedGroup?.floor_plan_url ? (
                  <>
                    <img
                      src={selectedGroup.floor_plan_url}
                      alt={`Plano ${selectedGroup.name}`}
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />

                    {spots.map(spot => (
                      <div
                        key={spot.id}
                        className={cn(
                          "absolute transform -translate-x-1/2 -translate-y-1/2",
                          "rounded-lg flex items-center justify-center",
                          "text-white font-bold shadow-lg border-2 border-white",
                          "transition-all duration-200",
                          getSpotColor(spot),
                          spot.status === 'available'
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
