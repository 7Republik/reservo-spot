import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Accessibility, Zap, Minimize2 } from "lucide-react";
import type { ParkingSpot } from "@/types/admin";
import type { EditorStats } from "@/types/admin/parking-spots.types";

interface StatsPanelProps {
  spots: ParkingSpot[];
  maxSpots: number;
}

/**
 * Calcula estadísticas del editor visual
 * 
 * @param spots - Array de plazas creadas
 * @param maxSpots - Capacidad máxima del grupo
 * @returns Estadísticas calculadas
 */
export const calculateStats = (spots: ParkingSpot[], maxSpots: number): EditorStats => {
  const totalSpots = spots.length;
  const accessibleCount = spots.filter(s => s.is_accessible).length;
  const chargerCount = spots.filter(s => s.has_charger).length;
  const compactCount = spots.filter(s => s.is_compact).length;
  const percentage = maxSpots > 0 ? (totalSpots / maxSpots) * 100 : 0;

  return {
    totalSpots,
    maxSpots,
    accessibleCount,
    chargerCount,
    compactCount,
    percentage,
  };
};

/**
 * Panel de Estadísticas del Editor Visual
 * 
 * Muestra en tiempo real:
 * - Contador de plazas creadas vs límite
 * - Barra de progreso con porcentaje
 * - Desglose de atributos especiales
 * - Alertas visuales al acercarse o alcanzar el límite
 */
export const StatsPanel = ({ spots, maxSpots }: StatsPanelProps) => {
  const stats = calculateStats(spots, maxSpots);

  return (
    <div className="space-y-3">
      <div>
        
        {/* Contador principal */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Plazas creadas:</span>
          <Badge variant={stats.percentage >= 100 ? "destructive" : "secondary"}>
            {stats.totalSpots} / {stats.maxSpots}
          </Badge>
        </div>

        {/* Barra de progreso */}
        <Progress 
          value={stats.percentage} 
          className="h-2 mb-2"
        />
        
        {/* Porcentaje */}
        <div className="text-xs text-muted-foreground text-right">
          {stats.percentage.toFixed(0)}% completado
        </div>
      </div>

      {/* Desglose de atributos */}
      <div>
        <div className="text-xs font-medium mb-2 text-muted-foreground">Atributos especiales</div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col items-center p-2 rounded-md bg-muted">
            <Accessibility className="w-5 h-5 mb-1 text-blue-600" />
            <span className="font-semibold">{stats.accessibleCount}</span>
            <span className="text-xs text-muted-foreground">PMR</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-md bg-muted">
            <Zap className="w-5 h-5 mb-1 text-yellow-600" />
            <span className="font-semibold">{stats.chargerCount}</span>
            <span className="text-xs text-muted-foreground">Cargador</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-md bg-muted">
            <Minimize2 className="w-5 h-5 mb-1 text-gray-600" />
            <span className="font-semibold">{stats.compactCount}</span>
            <span className="text-xs text-muted-foreground">Compacta</span>
          </div>
        </div>
      </div>

      {/* Alerta al 90% */}
      {stats.percentage >= 90 && stats.percentage < 100 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Cerca del límite: {stats.totalSpots}/{stats.maxSpots} plazas
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta al 100% */}
      {stats.percentage >= 100 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Límite alcanzado. No se pueden crear más plazas.
          </AlertDescription>
        </Alert>
      )}

      {/* Plazas restantes */}
      {stats.percentage < 100 && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {stats.maxSpots - stats.totalSpots} plazas disponibles
        </div>
      )}
    </div>
  );
};
