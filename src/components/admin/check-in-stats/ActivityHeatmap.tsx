import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HeatmapData } from '@/types/admin/check-in-stats';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  data: HeatmapData[];
  isLoading?: boolean;
}

const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const ActivityHeatmap = ({ data, isLoading = false }: ActivityHeatmapProps) => {
  // Crear matriz de datos
  const matrix: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0));
  
  data.forEach((item) => {
    matrix[item.hour][item.dayOfWeek] = item.count;
  });

  // Calcular valores máximo y mínimo para la escala de colores
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  // Función para obtener el color según el valor (estilo GitHub)
  const getColor = (value: number) => {
    if (value === 0) return 'bg-muted/50';
    
    const intensity = value / maxValue;
    
    if (intensity <= 0.25) {
      return 'bg-emerald-200 dark:bg-emerald-900/40';
    } else if (intensity <= 0.5) {
      return 'bg-emerald-400 dark:bg-emerald-700/60';
    } else if (intensity <= 0.75) {
      return 'bg-emerald-600 dark:bg-emerald-600/80';
    } else {
      return 'bg-emerald-700 dark:bg-emerald-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalReservations = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Heatmap de Actividad</CardTitle>
        <CardDescription className="text-xs">
          {totalReservations > 0 
            ? `${totalReservations.toLocaleString()} reservas en el periodo`
            : 'No hay datos para el periodo seleccionado'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header con días de la semana */}
          <div className="flex items-center gap-1">
            <div className="w-8" /> {/* Espacio para las horas */}
            {DAYS.map((day, index) => (
              <div
                key={index}
                className="flex-1 text-center text-[10px] font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Filas del heatmap */}
          <div className="space-y-1">
            {HOURS.map((hour) => (
              <div key={hour} className="flex items-center gap-1">
                {/* Hora */}
                <div className="w-8 text-[9px] text-muted-foreground text-right pr-1">
                  {hour % 3 === 0 ? `${String(hour).padStart(2, '0')}h` : ''}
                </div>

                {/* Celdas del heatmap */}
                {DAYS.map((_, dayIndex) => {
                  const value = matrix[hour][dayIndex];
                  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        'flex-1 h-3 rounded-[2px] transition-all hover:ring-1 hover:ring-foreground/20 hover:scale-110 cursor-pointer',
                        getColor(value)
                      )}
                      title={`${dayNames[dayIndex]} ${String(hour).padStart(2, '0')}:00 - ${value} reservas`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="pt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Menos</span>
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/50" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 dark:bg-emerald-900/40" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-700/60" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 dark:bg-emerald-600/80" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700 dark:bg-emerald-500" />
            </div>
            <span>Más</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
