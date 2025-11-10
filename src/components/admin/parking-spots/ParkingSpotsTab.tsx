import { useState } from "react";
import { ParkingSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useParkingSpots } from "@/hooks/admin/useParkingSpots";
import { ParkingSpotsSkeleton } from "../skeletons/AdminSkeletons";
import type { ParkingGroup } from "@/types/admin";

interface ParkingSpotsTabProps {
  parkingGroups: ParkingGroup[];
}

export const ParkingSpotsTab = ({ parkingGroups }: ParkingSpotsTabProps) => {
  const { spots, loading, addSpot, toggleSpot } = useParkingSpots();
  
  const [newSpotNumber, setNewSpotNumber] = useState("");
  const [newSpotGroupId, setNewSpotGroupId] = useState<string>("");
  const [newSpotIsAccessible, setNewSpotIsAccessible] = useState(false);
  const [newSpotHasCharger, setNewSpotHasCharger] = useState(false);
  const [newSpotIsCompact, setNewSpotIsCompact] = useState(false);

  const handleAddSpot = async () => {
    const success = await addSpot({
      spotNumber: newSpotNumber,
      groupId: newSpotGroupId,
      isAccessible: newSpotIsAccessible,
      hasCharger: newSpotHasCharger,
      isCompact: newSpotIsCompact,
    });

    if (success) {
      setNewSpotNumber("");
      setNewSpotGroupId("");
      setNewSpotIsAccessible(false);
      setNewSpotHasCharger(false);
      setNewSpotIsCompact(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ParkingSquare className="h-5 w-5" />
          Gestión de Plazas de Aparcamiento
        </CardTitle>
        <CardDescription>
          Añade, activa o desactiva plazas de aparcamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Spot */}
        <Card className="p-4 bg-secondary/20">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Añadir Nueva Plaza</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spot-number">Número de Plaza *</Label>
                <Input
                  id="spot-number"
                  placeholder="Ej: A-01, P1-15, etc."
                  value={newSpotNumber}
                  onChange={(e) => setNewSpotNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spot-group">Grupo de Parking *</Label>
                <Select value={newSpotGroupId} onValueChange={setNewSpotGroupId}>
                  <SelectTrigger id="spot-group">
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {parkingGroups
                      .filter(g => g.is_active)
                      .map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Atributos Especiales</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="spot-accessible"
                    checked={newSpotIsAccessible}
                    onCheckedChange={(checked) => setNewSpotIsAccessible(checked as boolean)}
                  />
                  <Label htmlFor="spot-accessible" className="cursor-pointer flex items-center gap-1">
                    ♿ Plaza PMR (Movilidad Reducida)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="spot-charger"
                    checked={newSpotHasCharger}
                    onCheckedChange={(checked) => setNewSpotHasCharger(checked as boolean)}
                  />
                  <Label htmlFor="spot-charger" className="cursor-pointer flex items-center gap-1">
                    ⚡ Con Cargador Eléctrico
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="spot-compact"
                    checked={newSpotIsCompact}
                    onCheckedChange={(checked) => setNewSpotIsCompact(checked as boolean)}
                  />
                  <Label htmlFor="spot-compact" className="cursor-pointer flex items-center gap-1">
                    🚗 Plaza Reducida (Aviso)
                  </Label>
                </div>
              </div>
            </div>

            <Button onClick={handleAddSpot} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Plaza
            </Button>
          </div>
        </Card>

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
