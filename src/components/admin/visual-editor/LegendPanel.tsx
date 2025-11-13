import { useState } from "react";
import { cn } from "@/lib/utils";

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
    label: "Plaza Estándar",
    colors: [SPOT_COLORS.standard],
    description: "Plaza sin atributos especiales",
  },
  {
    type: "accessible",
    label: "Plaza Accesible (PMR)",
    colors: [SPOT_COLORS.accessible],
    icon: "♿",
    description: "Plaza para personas con movilidad reducida",
  },
  {
    type: "charger",
    label: "Plaza con Cargador",
    colors: [SPOT_COLORS.charger],
    icon: "🔌",
    description: "Plaza con punto de carga eléctrica",
  },
  {
    type: "compact",
    label: "Plaza Compacta",
    colors: [SPOT_COLORS.compact],
    icon: "📏",
    description: "Plaza de tamaño reducido",
  },
  {
    type: "multi",
    label: "Múltiples Atributos",
    colors: [SPOT_COLORS.accessible, SPOT_COLORS.charger],
    icon: "✨",
    description: "Plaza con varios atributos (colores divididos)",
  },
];

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
    <div className="space-y-3">
      <h3 className="font-semibold mb-3">Leyenda</h3>

      <div className="space-y-2">
        {legendItems.map((item) => (
          <div
            key={item.type}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md transition-all cursor-pointer",
              "hover:bg-muted/50",
              hoveredType === item.type && "bg-muted ring-2 ring-primary/20"
            )}
            onMouseEnter={() => handleMouseEnter(item.type)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Ejemplo visual de la plaza */}
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0"
              style={getSpotBackground(item.colors)}
            >
              {item.icon || "A1"}
            </div>

            {/* Información del tipo de plaza */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center gap-2">
                {item.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nota informativa */}
      <div className="text-xs text-muted-foreground pt-3 border-t">
        <p className="mb-1">
          <strong>Tip:</strong> Pasa el cursor sobre un elemento para resaltar las plazas correspondientes en el plano.
        </p>
        <p>
          Las plazas con múltiples atributos muestran sus colores divididos en secciones.
        </p>
      </div>
    </div>
  );
};
