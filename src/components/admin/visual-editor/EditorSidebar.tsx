import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Pencil, 
  Lock, 
  Unlock, 
  Hand, 
  ChevronDown, 
  ChevronRight,
  BarChart3,
  Wrench,
  Palette
} from "lucide-react";
import { toast } from "sonner";
import { hasSeenFirstDrawNotification, markFirstDrawNotificationShown } from "@/lib/visualEditorStorage";
import { StatsPanel } from "./StatsPanel";
import { LegendPanel } from "./LegendPanel";
import { cn } from "@/lib/utils";
import type { ParkingSpot } from "@/types/admin";
import type { EditorTools } from "@/types/admin/parking-spots.types";

interface EditorSidebarProps {
  /**
   * Array de plazas creadas en el editor
   */
  spots: ParkingSpot[];
  
  /**
   * Capacidad máxima del grupo (límite de plazas)
   */
  maxSpots: number;
  
  /**
   * Estado de las herramientas del editor
   */
  tools: EditorTools;
  
  /**
   * Callback para cambios en las herramientas
   * @param tool - Nombre de la herramienta
   * @param value - Nuevo valor
   */
  onToolChange: (tool: keyof EditorTools, value: any) => void;
  
  /**
   * Callback cuando el usuario pasa el cursor sobre un elemento de la leyenda
   * @param type - Tipo de plaza o null
   */
  onLegendHover?: (type: string | null) => void;
}

/**
 * Panel Lateral del Editor Visual
 * 
 * Organiza los controles del editor en tres secciones principales:
 * 1. Estadísticas - Resumen de plazas creadas y atributos
 * 2. Herramientas - Controles para modo dibujo y otras herramientas
 * 3. Leyenda - Guía visual de colores y símbolos
 * 
 * El panel tiene un ancho fijo de 320px y se posiciona a la derecha del canvas.
 * Incluye scroll interno para contenido que exceda la altura disponible.
 * 
 * @example
 * ```tsx
 * import { EditorSidebar } from "@/components/admin/visual-editor";
 * 
 * function VisualEditor() {
 *   const [tools, setTools] = useState<EditorTools>({
 *     isDrawingMode: false,
 *     isHandToolActive: false,
 *     isCanvasLocked: false,
 *     spotButtonSize: 32,
 *   });
 * 
 *   const handleToolChange = (tool: keyof EditorTools, value: any) => {
 *     setTools(prev => ({ ...prev, [tool]: value }));
 *   };
 * 
 *   return (
 *     <div className="flex">
 *       <div className="flex-1">
 *         {/* Canvas del editor *\/}
 *       </div>
 *       <EditorSidebar
 *         spots={spots}
 *         maxSpots={50}
 *         tools={tools}
 *         onToolChange={handleToolChange}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const EditorSidebar = ({
  spots,
  maxSpots,
  tools,
  onToolChange,
  onLegendHover,
}: EditorSidebarProps) => {
  // Estado de secciones colapsadas
  const [collapsedSections, setCollapsedSections] = useState({
    stats: false,
    tools: false,
    legend: false,
  });

  // Verificar si se alcanzó el límite de plazas
  const isLimitReached = spots.length >= maxSpots;

  // Mostrar notificación la primera vez que se activa el modo dibujo
  useEffect(() => {
    if (tools.isDrawingMode) {
      if (!hasSeenFirstDrawNotification()) {
        toast.info('Haz clic en el plano para crear plazas. Ajusta el tamaño con el slider antes de dibujar.', {
          duration: 5000,
        });
        markFirstDrawNotificationShown();
      }
    }
  }, [tools.isDrawingMode]);

  const handleDrawingModeToggle = () => {
    // Si se alcanzó el límite, no permitir activar modo dibujo
    if (!tools.isDrawingMode && isLimitReached) {
      toast.error(`Límite alcanzado: ${maxSpots} plazas máximo`);
      return;
    }
    
    onToolChange("isDrawingMode", !tools.isDrawingMode);
  };

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <aside className="w-80 border-l bg-card flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Sección: Estadísticas */}
          <section className="border rounded-lg overflow-hidden bg-background">
            <button
              onClick={() => toggleSection('stats')}
              className={cn(
                "w-full px-3 py-2 flex items-center justify-between",
                "hover:bg-accent transition-colors",
                "text-sm font-medium"
              )}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Estadísticas</span>
              </div>
              {collapsedSections.stats ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {!collapsedSections.stats && (
              <div className="p-3 border-t">
                <StatsPanel spots={spots} maxSpots={maxSpots} />
              </div>
            )}
          </section>

          {/* Sección: Herramientas */}
          <section className="border rounded-lg overflow-hidden bg-background">
            <button
              onClick={() => toggleSection('tools')}
              className={cn(
                "w-full px-3 py-2 flex items-center justify-between",
                "hover:bg-accent transition-colors",
                "text-sm font-medium"
              )}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span>Herramientas</span>
              </div>
              {collapsedSections.tools ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {!collapsedSections.tools && (
              <div className="p-3 border-t space-y-3">
              {/* Modo Dibujo */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Modo Dibujo</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tools.isDrawingMode ? "default" : "outline"}
                        onClick={handleDrawingModeToggle}
                        disabled={!tools.isDrawingMode && isLimitReached}
                        className="w-full justify-start"
                        size="sm"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {tools.isDrawingMode ? "Activo" : "Dibujar"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isLimitReached && !tools.isDrawingMode
                          ? "Límite de plazas alcanzado. Elimina plazas para continuar."
                          : "Activa para crear plazas haciendo clic en el plano"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {tools.isDrawingMode && (
                  <p className="text-xs text-muted-foreground">
                    Haz clic en el plano para crear plazas
                  </p>
                )}
                {isLimitReached && !tools.isDrawingMode && (
                  <p className="text-xs text-destructive">
                    Límite alcanzado ({maxSpots} plazas)
                  </p>
                )}
              </div>

              {/* Herramienta Mano */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Herramienta Mano</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tools.isHandToolActive ? "default" : "outline"}
                        onClick={() => onToolChange("isHandToolActive", !tools.isHandToolActive)}
                        className="w-full justify-start"
                        size="sm"
                      >
                        <Hand className="w-4 h-4 mr-2" />
                        {tools.isHandToolActive ? "Activo" : "Navegar"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Navega por el plano sin interactuar con plazas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {tools.isHandToolActive && (
                  <p className="text-xs text-muted-foreground">
                    Arrastra para mover el plano
                  </p>
                )}
              </div>

              {/* Bloqueo de Canvas */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Control de Canvas</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tools.isCanvasLocked ? "default" : "outline"}
                        onClick={() => onToolChange("isCanvasLocked", !tools.isCanvasLocked)}
                        className="w-full justify-start"
                        size="sm"
                      >
                        {tools.isCanvasLocked ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Bloqueado
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Desbloqueado
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {tools.isCanvasLocked 
                          ? "Bloqueado: scroll hace zoom. Presiona Escape para desbloquear"
                          : "Desbloqueado: scroll normal de página"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-xs text-muted-foreground">
                  {tools.isCanvasLocked 
                    ? "🔒 Scroll hace zoom en el plano"
                    : "📄 Scroll normal de página"
                  }
                </p>
              </div>

              {/* Tamaño de Botones */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Tamaño</Label>
                  <span className="text-xs font-medium text-foreground">
                    {tools.spotButtonSize}px
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Slider
                          min={12}
                          max={64}
                          step={4}
                          value={[tools.spotButtonSize]}
                          onValueChange={(value) => onToolChange("spotButtonSize", value[0])}
                          className="w-full"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajusta el tamaño de los botones de plaza</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
          </section>

          {/* Sección: Leyenda */}
          <section className="border rounded-lg overflow-hidden bg-background">
            <button
              onClick={() => toggleSection('legend')}
              className={cn(
                "w-full px-3 py-2 flex items-center justify-between",
                "hover:bg-accent transition-colors",
                "text-sm font-medium"
              )}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span>Leyenda</span>
              </div>
              {collapsedSections.legend ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {!collapsedSections.legend && (
              <div className="p-3 border-t">
                <LegendPanel onHoverItem={onLegendHover} />
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
};
