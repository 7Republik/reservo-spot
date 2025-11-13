import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Lock, Unlock, Hand } from "lucide-react";
import { toast } from "sonner";
import { hasSeenFirstDrawNotification, markFirstDrawNotificationShown } from "@/lib/visualEditorStorage";
import { StatsPanel } from "./StatsPanel";
import { LegendPanel } from "./LegendPanel";
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

  return (
    <aside className="w-80 border-l bg-card flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Sección: Estadísticas */}
          <section>
            <StatsPanel spots={spots} maxSpots={maxSpots} />
          </section>

          <Separator />

          {/* Sección: Herramientas */}
          <section>
            <h3 className="font-semibold mb-3">Herramientas</h3>
            <div className="space-y-3">
              {/* Modo Dibujo */}
              <div className="space-y-2">
                <Label>Modo Dibujo</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tools.isDrawingMode ? "default" : "outline"}
                        onClick={handleDrawingModeToggle}
                        disabled={!tools.isDrawingMode && isLimitReached}
                        className="w-full"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {tools.isDrawingMode ? "Modo Dibujo ACTIVO" : "Activar Modo Dibujo"}
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
                <Label>Herramienta Mano</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tools.isHandToolActive ? "default" : "outline"}
                        onClick={() => onToolChange("isHandToolActive", !tools.isHandToolActive)}
                        className="w-full"
                      >
                        <Hand className="w-4 h-4 mr-2" />
                        {tools.isHandToolActive ? "Herramienta ACTIVA" : "Activar Herramienta"}
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
                <Label>Control de Canvas</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tools.isCanvasLocked ? "default" : "outline"}
                        onClick={() => onToolChange("isCanvasLocked", !tools.isCanvasLocked)}
                        className="w-full"
                      >
                        {tools.isCanvasLocked ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Canvas Bloqueado
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Canvas Desbloqueado
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
                  <Label>Tamaño de Botones</Label>
                  <span className="text-sm font-medium text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">
                  Ajusta el tamaño de las plazas (12-64px)
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Sección: Leyenda */}
          <section>
            <LegendPanel onHoverItem={onLegendHover} />
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
};
