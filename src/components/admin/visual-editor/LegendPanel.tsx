import { useState } from "react";
import { cn } from "@/lib/utils";
import { Accessibility, Zap, Minimize2, Sparkles, Square } from "lucide-react";

/**
 * Colores definidos para cada atributo de plaza
 * Estos colores se usarán tanto en la leyenda como en las plazas del plano
 */
export const SPOT_COLORS = {
  accessible: "#3b82f6", // Azul
  charger: "#22c55e",    // Verde
  compact: "#eab308",    // Amarillo
  standard: "hsl(var(--primary))", // Color primario del tema
} as const;

interface LegendItem {
  type: "standard" | "accessible" | "charger" | "compact" | "multi";
  label: string;
  colors: string[];
  icon?: string;
  description: string;
}

const legendItems: LegendItem[] = [
  {
    type: "standard",
    label: "Estándar",
    colors: [SPOT_COLORS.standard],
    description: "Sin atributos especiales",
  },
  {
    type: "accessible",
    label: "PMR",
    colors: [SPOT_COLORS.accessible],
    icon: "accessible",
    description: "Movilidad reducida",
  },
  {
    type: "charger",
    label: "Cargador",
    colors: [SPOT_COLORS.charger],
    icon: "charger",
    description: "Punto de carga eléctrica",
  },
  {
    type: "compact",
    label: "Compacta",
    colors: [SPOT_COLORS.compact],
    icon: "compact",
    description: "Tamaño reducido",
  },
  {
    type: "multi",
    label: "Múltiples",
    colors: [SPOT_COLORS.accessible, SPOT_COLORS.charger],
    icon: "multi",
    description: "Varios atributos",
  },
];

const getIconComponent = (iconType?: string) => {
  switch (iconType) {
    case "accessible":
      return <Accessibility className="w-4 h-4" />;
    case "charger":
      return <Zap className="w-4 h-4" />;
    case "compact":
      return <Minimize2 className="w-4 h-4" />;
    case "multi":
      return <Sparkles className="w-4 h-4" />;
    default:
      return <Square className="w-4 h-4" />;
  }
};

interface LegendPanelProps {
  /**
   * Callback que se ejecuta cuando el usuario pasa el cursor sobre un elemento de la leyenda
   * @param type - Tipo de plaza ("standard" | "accessible" | "charger" | "compact" | "multi") o null
   * 
   * @example
   * ```tsx
   * <LegendPanel 
   *   onHoverItem={(type) => {
   *     // Resaltar plazas del tipo correspondiente en el plano
   *     if (type === "accessible") {
   *       highlightAccessibleSpots();
   *     }
   *   }}
   * />
   * ```
   */
  onHoverItem?: (type: string | null) => void;
}

/**
 * Panel de Leyenda del Editor Visual
 * 
 * Muestra una guía visual de los colores y símbolos usados en el editor:
 * - Plazas estándar (color primario)
 * - Plazas accesibles (azul)
 * - Plazas con cargador (verde)
 * - Plazas compactas (amarillo)
 * - Plazas con múltiples atributos (colores divididos)
 * 
 * Incluye hover effect para resaltar plazas correspondientes en el plano
 * 
 * @example
 * ```tsx
 * import { LegendPanel } from "@/components/admin/visual-editor";
 * 
 * function EditorSidebar() {
 *   const [hoveredType, setHoveredType] = useState<string | null>(null);
 * 
 *   return (
 *     <aside className="w-80 p-4">
 *       <LegendPanel onHoverItem={setHoveredType} />
 *     </aside>
 *   );
 * }
 * ```
 */
export const LegendPanel = ({ onHoverItem }: LegendPanelProps) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleMouseEnter = (type: string) => {
    setHoveredType(type);
    onHoverItem?.(type);
  };

  const handleMouseLeave = () => {
    setHoveredType(null);
    onHoverItem?.(null);
  };

  /**
   * Genera el estilo de fondo para una plaza según sus colores
   */
  const getSpotBackground = (colors: string[]): React.CSSProperties => {
    if (colors.length === 1) {
      return { backgroundColor: colors[0] };
    }

    if (colors.length === 2) {
      return {
        background: `linear-gradient(90deg, ${colors[0]} 50%, ${colors[1]} 50%)`,
      };
    }

    if (colors.length === 3) {
      return {
        background: `linear-gradient(90deg, ${colors[0]} 33.33%, ${colors[1]} 33.33% 66.66%, ${colors[2]} 66.66%)`,
      };
    }

    return { backgroundColor: colors[0] };
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {legendItems.map((item) => (
          <div
            key={item.type}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md transition-all cursor-pointer",
              "hover:bg-muted/50",
              hoveredType === item.type && "bg-muted ring-1 ring-primary/30"
            )}
            onMouseEnter={() => handleMouseEnter(item.type)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Ejemplo visual de la plaza */}
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-white shadow-sm flex-shrink-0"
              style={getSpotBackground(item.colors)}
            >
              {getIconComponent(item.icon)}
            </div>

            {/* Información del tipo de plaza */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">
                {item.label}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nota informativa */}
      <div className="text-[10px] text-muted-foreground pt-2 border-t">
        <p>
          Pasa el cursor para resaltar plazas en el plano
        </p>
      </div>
    </div>
  );
};
