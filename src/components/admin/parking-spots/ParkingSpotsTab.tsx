import { useEffect } from "react";
import { ParkingSquare, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParkingSpots } from "@/hooks/admin/useParkingSpots";
import { ParkingSpotsSkeleton } from "../skeletons/AdminSkeletons";
import type { ParkingGroup } from "@/types/admin";

interface ParkingSpotsTabProps {
  parkingGroups: ParkingGroup[];
  onOpenVisualEditor?: () => void;
}

export const ParkingSpotsTab = ({ parkingGroups, onOpenVisualEditor }: ParkingSpotsTabProps) => {
  const { spots, loading, loadSpots, toggleSpot } = useParkingSpots();
  
  useEffect(() => {
    // Forzar recarga cada vez que se monta el componente
    loadSpots(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ParkingSquare className="h-5 w-5" />
              Gestión de Plazas de Aparcamiento
            </CardTitle>
            <CardDescription>
              Visualiza y gestiona las plazas de aparcamiento
            </CardDescription>
          </div>
          {onOpenVisualEditor && (
            <Button onClick={onOpenVisualEditor} size="lg" className="gap-2">
              <Edit className="h-5 w-5" />
              Abrir Editor Visual
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Edit className="h-4 w-4" />
          <AlertDescription>
            Para añadir nuevas plazas, usa el <strong>Editor Visual</strong> donde podrás posicionarlas en el plano del parking.
            Las plazas se crean arrastrando botones al mapa y configurando sus atributos.
          </AlertDescription>
        </Alert>

        {/* Spots List */}
        {loading ? (
          <ParkingSpotsSkeleton />
        ) : (
          <div className="grid gap-3">
            {spots.map((spot) => (
              <Card key={spot.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-lg min-w-[80px] text-center">
                      {spot.spot_number}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="font-medium">
                        📍 {spot.parking_groups?.name || "Sin grupo"}
                      </Badge>

                      {spot.is_accessible && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-200">
                          ♿ PMR
                        </Badge>
                      )}
                      {spot.has_charger && (
                        <Badge variant="outline" className="bg-yellow-50 border-yellow-200">
                          ⚡ Cargador
                        </Badge>
                      )}
                      {spot.is_compact && (
                        <Badge variant="outline" className="bg-gray-100 border-gray-300">
                          🚗 Reducida
                        </Badge>
                      )}

                      {spot.position_x !== null && spot.position_y !== null && (
                        <Badge variant="outline" className="bg-green-50 border-green-200">
                          🗺️ Posicionada en plano
                        </Badge>
                      )}

                      <Badge 
                        variant={spot.is_active ? "default" : "secondary"}
                        className={spot.is_active ? "bg-success" : ""}
                      >
                        {spot.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={spot.is_active ? "outline" : "default"}
                    onClick={() => toggleSpot(spot.id, spot.is_active)}
                  >
                    {spot.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
