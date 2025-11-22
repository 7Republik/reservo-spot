import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader para el mapa interactivo de plazas
 * Se muestra mientras se cargan los datos desde cache o servidor
 */
export const MapSkeleton = () => {
  // Generar algunos spots de ejemplo para el skeleton
  const skeletonSpots = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 15 + (i % 4) * 20,
    y: 20 + Math.floor(i / 4) * 25,
  }));

  return (
    <Card className="overflow-hidden relative">
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Área del mapa */}
      <div 
        className="relative bg-muted/30"
        style={{ 
          height: window.innerWidth < 640 ? "350px" : window.innerWidth < 1024 ? "450px" : "550px",
          width: "100%"
        }}
      >
        {/* Skeleton del plano de fondo */}
        <Skeleton className="absolute inset-0" />

        {/* Skeleton de las plazas */}
        {skeletonSpots.map((spot) => (
          <Skeleton
            key={spot.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-lg"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: "32px",
              height: "32px",
            }}
          />
        ))}

        {/* Mensaje de carga */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
