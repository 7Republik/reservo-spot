import { useEffect, useState } from "react";
import { useVisualEditor } from "@/hooks/admin/useVisualEditor";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SpotAttributesDialog } from "./SpotAttributesDialog";
import { MobileRestrictionMessage } from "./MobileRestrictionMessage";
import { EditorSidebar } from "./EditorSidebar";
import { DraggableSpot } from "./DraggableSpot";
import { HelpDialog, useHelpDialogTracking } from "./HelpDialog";
import type { ParkingGroup, ParkingSpot } from "@/types/admin";
import type { EditorTools } from "@/types/admin/parking-spots.types";

interface VisualEditorTabProps {
  parkingGroups: ParkingGroup[];
}

export const VisualEditorTab = ({ parkingGroups }: VisualEditorTabProps) => {
  const editor = useVisualEditor();
  const [selectedSpotForEdit, setSelectedSpotForEdit] = useState<ParkingSpot | null>(null);
  const [spotDialogOpen, setSpotDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Detectar si la pantalla es de tablet o mayor (>= 768px)
  const isTabletOrLarger = useMediaQuery("(min-width: 768px)");
  
  // Tracking de primera visita para mostrar ayuda automáticamente
  const { shouldShowHelp, markHelpAsViewed } = useHelpDialogTracking();

  // Actualizar el grupo seleccionado si cambió en parkingGroups
  useEffect(() => {
    if (editor.selectedGroup) {
      const updatedGroup = parkingGroups.find(g => g.id === editor.selectedGroup?.id);
      if (updatedGroup) {
        editor.setSelectedGroup(updatedGroup);
      }
    }
  }, [parkingGroups]);

  // Listener para tecla Escape - desbloquea el canvas y desactiva herramienta mano
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editor.isCanvasLocked) {
          editor.toggleCanvasLock();
        }
        if (editor.isHandToolActive) {
          editor.toggleHandTool();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [editor.isCanvasLocked, editor.isHandToolActive, editor.toggleCanvasLock, editor.toggleHandTool]);

  // Desactivar modo dibujo automáticamente cuando se alcance el límite
  useEffect(() => {
    if (editor.selectedGroup && editor.isDrawingMode) {
      const isLimitReached = editor.spots.length >= editor.selectedGroup.capacity;
      if (isLimitReached) {
        editor.setIsDrawingMode(false);
      }
    }
  }, [editor.spots.length, editor.selectedGroup?.capacity, editor.isDrawingMode, editor.setIsDrawingMode, editor.selectedGroup]);

  // Mostrar ayuda automáticamente en primera visita
  useEffect(() => {
    if (shouldShowHelp && isTabletOrLarger) {
      setHelpDialogOpen(true);
    }
  }, [shouldShowHelp, isTabletOrLarger]);

  // Marcar ayuda como vista cuando se cierra el diálogo
  const handleHelpDialogChange = (open: boolean) => {
    setHelpDialogOpen(open);
    if (!open && shouldShowHelp) {
      markHelpAsViewed();
    }
  };

  const handleSelectGroup = (groupId: string) => {
    const group = parkingGroups.find(g => g.id === groupId);
    if (group) {
      editor.setSelectedGroup(group);
      editor.loadEditorSpots(groupId);
    }
  };

  const handleFloorPlanClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // No crear plazas si la herramienta mano está activa
    if (!editor.isDrawingMode || !editor.selectedGroup || editor.isHandToolActive) {
      return;
    }

    const imgElement = e.currentTarget.querySelector('img');
    if (!imgElement) return;
    
    const rect = imgElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    await editor.createSpot(x, y);
  };

  const handleFloorPlanMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo mostrar preview fantasma si modo dibujo está activo y herramienta mano no está activa
    if (!editor.isDrawingMode || editor.isHandToolActive) {
      if (editor.ghostPosition) {
        editor.setGhostPosition(null);
      }
      return;
    }

    const imgElement = e.currentTarget.querySelector('img');
    if (!imgElement) return;
    
    const rect = imgElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    editor.setGhostPosition({ x, y });
  };

  const handleFloorPlanMouseLeave = () => {
    // Ocultar preview fantasma cuando el cursor sale del plano
    if (editor.ghostPosition) {
      editor.setGhostPosition(null);
    }
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    // No abrir diálogo si está en modo dibujo o herramienta mano activa
    if (editor.isDrawingMode || editor.isHandToolActive) return;
    
    setSelectedSpotForEdit(spot);
    setSpotDialogOpen(true);
  };

  const handleDragStart = (spotId: string) => {
    const spot = editor.spots.find(s => s.id === spotId);
    if (!spot) return;

    editor.setDragState({
      isDragging: true,
      spotId: spotId,
      startPosition: { x: spot.position_x || 0, y: spot.position_y || 0 },
      currentPosition: { x: spot.position_x || 0, y: spot.position_y || 0 },
    });
  };

  const handleDragMove = (spotId: string, x: number, y: number) => {
    if (editor.dragState.spotId !== spotId) return;

    editor.setDragState({
      ...editor.dragState,
      currentPosition: { x, y },
    });
  };

  const handleDragEnd = async (spotId: string, x: number, y: number) => {
    if (editor.dragState.spotId !== spotId) return;

    const originalPosition = editor.dragState.startPosition;
    
    // Reset drag state
    editor.setDragState({
      isDragging: false,
      spotId: null,
      startPosition: null,
      currentPosition: null,
    });

    // Try to save the new position
    const success = await editor.updateSpotPosition(spotId, x, y);
    
    // If failed, the hook will reload spots which reverts to original position
    if (!success && originalPosition) {
      // Position already reverted by loadEditorSpots in updateSpotPosition
      console.log("Position reverted to original");
    }
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

  // Si la pantalla es menor a 768px, mostrar mensaje de restricción
  if (!isTabletOrLarger) {
    return <MobileRestrictionMessage />;
  }

  // Preparar objeto de herramientas para el EditorSidebar
  const editorTools: EditorTools = {
    isDrawingMode: editor.isDrawingMode,
    isHandToolActive: editor.isHandToolActive,
    isCanvasLocked: editor.isCanvasLocked,
    spotButtonSize: editor.spotButtonSize,
  };

  const handleToolChange = (tool: keyof EditorTools, value: any) => {
    switch (tool) {
      case "isDrawingMode":
        editor.setIsDrawingMode(value);
        break;
      case "spotButtonSize":
        editor.updateButtonSize(value);
        break;
      case "isCanvasLocked":
        editor.toggleCanvasLock();
        break;
      case "isHandToolActive":
        editor.toggleHandTool();
        break;
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Área principal del editor */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Editor Visual de Plazas</CardTitle>
                  <CardDescription>
                    Coloca las plazas sobre el plano de planta haciendo clic en la imagen
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setHelpDialogOpen(true)}
                  className="shrink-0"
                  title="Ayuda"
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Selector de grupo */}
              <div className="space-y-2">
                <Label>Seleccionar Grupo</Label>
                <Select
                  value={editor.selectedGroup?.id || ""}
                  onValueChange={handleSelectGroup}
                >
                  <SelectTrigger className="max-w-md">
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

              {/* Canvas del editor */}
              {editor.selectedGroup && editor.selectedGroup.floor_plan_url && (
                <div className={cn(
                  "flex-1 border rounded-lg overflow-hidden bg-muted",
                  editor.isDrawingMode && "editor-canvas-active"
                )}>
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                    centerOnInit
                    doubleClick={{ mode: "zoomIn" }}
                    panning={{ 
                      velocityDisabled: true,
                      disabled: !editor.isCanvasLocked // Solo permitir pan cuando está bloqueado
                    }}
                    wheel={{ 
                      disabled: !editor.isCanvasLocked // Solo permitir zoom con scroll cuando está bloqueado
                    }}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        <div className="flex items-center justify-between p-2 bg-background border-b">
                          <Badge variant="secondary">
                            {editor.spots.length} plazas colocadas
                          </Badge>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => zoomIn()}>
                                    <ZoomIn className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Zoom in</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => zoomOut()}>
                                    <ZoomOut className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Zoom out</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => resetTransform()}>
                                    <Maximize2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Restablecer vista</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </div>

                        <TransformComponent
                          wrapperStyle={{
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <div
                            className={cn(
                              "relative",
                              editor.isHandToolActive ? "cursor-grab" : "cursor-crosshair"
                            )}
                            onClick={handleFloorPlanClick}
                            onMouseMove={handleFloorPlanMouseMove}
                            onMouseLeave={handleFloorPlanMouseLeave}
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
                            <div data-floor-plan-container>
                              <img
                                src={editor.selectedGroup.floor_plan_url}
                                alt="Plano de planta"
                                className="w-full h-auto select-none"
                                draggable={false}
                                loading="lazy"
                                decoding="async"
                              />
                              
                              {editor.spots.map(spot => {
                                const isDraggingThisSpot = editor.dragState.isDragging && editor.dragState.spotId === spot.id;
                                const displayPosition = isDraggingThisSpot && editor.dragState.currentPosition
                                  ? editor.dragState.currentPosition
                                  : { x: spot.position_x || 0, y: spot.position_y || 0 };

                                return (
                                  <div key={spot.id}>
                                    {/* Shadow indicator at original position during drag */}
                                    {isDraggingThisSpot && editor.dragState.startPosition && (
                                      <div
                                        className="absolute rounded-md border-2 border-dashed border-muted-foreground/50 bg-muted/30 pointer-events-none"
                                        style={{
                                          left: `${editor.dragState.startPosition.x}%`,
                                          top: `${editor.dragState.startPosition.y}%`,
                                          width: `${editor.spotButtonSize}px`,
                                          height: `${editor.spotButtonSize}px`,
                                          transform: 'translate(-50%, -50%)',
                                        }}
                                      />
                                    )}

                                    {/* The actual spot */}
                                    <DraggableSpot
                                      spot={{
                                        ...spot,
                                        position_x: displayPosition.x,
                                        position_y: displayPosition.y,
                                      }}
                                      size={editor.spotButtonSize}
                                      onClick={() => handleSpotClick(spot)}
                                      isDrawingMode={editor.isDrawingMode}
                                      isHandToolActive={editor.isHandToolActive}
                                      isDragging={isDraggingThisSpot}
                                      isNewlyCreated={editor.lastCreatedSpotId === spot.id}
                                      onDragStart={() => handleDragStart(spot.id)}
                                      onDragMove={(x, y) => handleDragMove(spot.id, x, y)}
                                      onDragEnd={(x, y) => handleDragEnd(spot.id, x, y)}
                                    />
                                  </div>
                                );
                              })}

                              {/* Ghost preview en modo dibujo */}
                              {editor.isDrawingMode && editor.ghostPosition && !editor.isHandToolActive && (
                                <div
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: `${editor.ghostPosition.x}%`,
                                    top: `${editor.ghostPosition.y}%`,
                                    width: `${editor.spotButtonSize}px`,
                                    height: `${editor.spotButtonSize}px`,
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                >
                                  <div className="w-full h-full rounded-md bg-primary/30 border-2 border-primary border-dashed animate-pulse" />
                                </div>
                              )}
                            </div>
                          </div>
                        </TransformComponent>
                      </>
                    )}
                  </TransformWrapper>
                </div>
              )}

              {editor.selectedGroup && !editor.selectedGroup.floor_plan_url && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
                  <div className="text-muted-foreground space-y-2">
                    <p className="text-lg font-medium">No hay plano de planta configurado</p>
                    <p className="text-sm max-w-md">
                      Este grupo no tiene una imagen de plano de planta. 
                      Por favor, sube una imagen en la configuración del grupo para poder usar el editor visual.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // El usuario puede ir a la pestaña de grupos para subir el plano
                      toast.info("Ve a la pestaña 'Grupos' para subir un plano de planta");
                    }}
                  >
                    Ir a configuración de grupos
                  </Button>
                </div>
              )}

              {!editor.selectedGroup && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>Selecciona un grupo con plano de planta para comenzar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral con estadísticas, herramientas y leyenda */}
        {editor.selectedGroup && (
          <EditorSidebar
            spots={editor.spots}
            maxSpots={editor.selectedGroup.capacity}
            tools={editorTools}
            onToolChange={handleToolChange}
          />
        )}
      </div>

      <SpotAttributesDialog
        open={spotDialogOpen}
        onOpenChange={setSpotDialogOpen}
        spot={selectedSpotForEdit}
        onSave={handleSaveSpot}
        onDelete={handleDeleteSpot}
      />

      <HelpDialog
        open={helpDialogOpen}
        onOpenChange={handleHelpDialogChange}
      />
    </>
  );
};
