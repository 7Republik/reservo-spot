import { useEffect, useState } from "react";
import { useVisualEditor } from "@/hooks/admin/useVisualEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SpotAttributesDialog } from "./SpotAttributesDialog";
import type { ParkingGroup, ParkingSpot } from "@/types/admin";

interface VisualEditorTabProps {
  parkingGroups: ParkingGroup[];
}

export const VisualEditorTab = ({ parkingGroups }: VisualEditorTabProps) => {
  const editor = useVisualEditor();
  const [selectedSpotForEdit, setSelectedSpotForEdit] = useState<ParkingSpot | null>(null);
  const [spotDialogOpen, setSpotDialogOpen] = useState(false);

  // Actualizar el grupo seleccionado si cambió en parkingGroups
  useEffect(() => {
    if (editor.selectedGroup) {
      const updatedGroup = parkingGroups.find(g => g.id === editor.selectedGroup?.id);
      if (updatedGroup) {
        editor.setSelectedGroup(updatedGroup);
      }
    }
  }, [parkingGroups]);

  const handleSelectGroup = (groupId: string) => {
    const group = parkingGroups.find(g => g.id === groupId);
    if (group) {
      editor.setSelectedGroup(group);
      editor.loadEditorSpots(groupId);
    }
  };

  const handleFloorPlanClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor.isDrawingMode || !editor.selectedGroup) {
      return;
    }

    const imgElement = e.currentTarget.querySelector('img');
    if (!imgElement) return;
    
    const rect = imgElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    await editor.createSpot(x, y);
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    if (editor.isDrawingMode) return;
    
    setSelectedSpotForEdit(spot);
    setSpotDialogOpen(true);
  };

  const handleSaveSpot = async (
    spotNumber: string,
    isAccessible: boolean,
    hasCharger: boolean,
    isCompact: boolean
  ) => {
    if (!selectedSpotForEdit) return false;

    const success = await editor.updateSpot(selectedSpotForEdit.id, {
      spot_number: spotNumber,
      is_accessible: isAccessible,
      has_charger: hasCharger,
      is_compact: isCompact,
    });

    if (success) {
      setSpotDialogOpen(false);
    }
    return success;
  };

  const handleDeleteSpot = async () => {
    if (!selectedSpotForEdit) return false;

    if (!confirm(`¿Eliminar la plaza ${selectedSpotForEdit.spot_number}?`)) {
      return false;
    }

    const success = await editor.deleteSpot(selectedSpotForEdit.id);
    if (success) {
      setSpotDialogOpen(false);
    }
    return success;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Editor Visual de Plazas</CardTitle>
          <CardDescription>
            Coloca las plazas sobre el plano de planta haciendo clic en la imagen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seleccionar Grupo</Label>
              <Select
                value={editor.selectedGroup?.id || ""}
                onValueChange={handleSelectGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {parkingGroups
                    .filter(g => g.floor_plan_url && g.is_active)
                    .map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {editor.selectedGroup && (
              <>
                <div className="space-y-2">
                  <Label>Tamaño de Botones (px)</Label>
                  <Select
                    value={editor.spotButtonSize.toString()}
                    onValueChange={(value) => editor.updateButtonSize(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[16, 20, 24, 28, 32, 40, 48, 56, 64].map(size => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modo Dibujo</Label>
                  <Button
                    variant={editor.isDrawingMode ? "default" : "outline"}
                    onClick={() => editor.setIsDrawingMode(!editor.isDrawingMode)}
                    className="w-full"
                  >
                    {editor.isDrawingMode ? (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Modo Dibujo ACTIVO
                      </>
                    ) : (
                      "Activar Modo Dibujo"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {editor.selectedGroup && editor.selectedGroup.floor_plan_url && (
            <div className="border rounded-lg overflow-hidden bg-muted">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
                doubleClick={{ mode: "zoomIn" }}
                panning={{ velocityDisabled: true }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="flex items-center justify-between p-2 bg-background border-b">
                      <Badge variant="secondary">
                        {editor.spots.length} plazas colocadas
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => zoomIn()}>
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => zoomOut()}>
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => resetTransform()}>
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <TransformComponent
                      wrapperStyle={{
                        width: "100%",
                        height: "600px",
                      }}
                    >
                      <div
                        className="relative cursor-crosshair"
                        onClick={handleFloorPlanClick}
                        onLoad={(e) => {
                          const img = e.currentTarget.querySelector('img');
                          if (img) {
                            editor.setFloorPlanDimensions({
                              width: img.naturalWidth,
                              height: img.naturalHeight
                            });
                          }
                        }}
                      >
                        <img
                          src={editor.selectedGroup.floor_plan_url}
                          alt="Plano de planta"
                          className="w-full h-auto select-none"
                          draggable={false}
                        />
                        
                        {editor.spots.map(spot => (
                          <button
                            key={spot.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpotClick(spot);
                            }}
                            className={cn(
                              "absolute rounded-md font-bold text-xs transition-all hover:scale-110 hover:z-10",
                              "flex items-center justify-center shadow-lg",
                              spot.is_accessible && "ring-2 ring-blue-500",
                              spot.has_charger && "ring-2 ring-green-500",
                              spot.is_compact && "ring-2 ring-yellow-500"
                            )}
                            style={{
                              left: `${spot.position_x}%`,
                              top: `${spot.position_y}%`,
                              width: `${editor.spotButtonSize}px`,
                              height: `${editor.spotButtonSize}px`,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: 'hsl(var(--primary))',
                              color: 'hsl(var(--primary-foreground))',
                            }}
                          >
                            {spot.spot_number}
                          </button>
                        ))}
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          )}

          {!editor.selectedGroup && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Selecciona un grupo con plano de planta para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SpotAttributesDialog
        open={spotDialogOpen}
        onOpenChange={setSpotDialogOpen}
        spot={selectedSpotForEdit}
        onSave={handleSaveSpot}
        onDelete={handleDeleteSpot}
      />
    </>
  );
};
