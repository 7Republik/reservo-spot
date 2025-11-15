import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HeatmapData } from '@/types/admin/check-in-stats';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  data: HeatmapData[];
  isLoading?: boolean;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const ActivityHeatmap = ({ data, isLoading = false }: ActivityHeatmapProps) => {
  // Crear matriz de datos
  const matrix: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0));
  
  data.forEach((item) => {
    matrix[item.hour][item.dayOfWeek] = item.count;
  });

  // Calcular valores máximo y mínimo para la escala de colores
  const maxValue = Math.max(...data.map((d) => d.count), 1);

  // Función para obtener el color según el valor
  const getColor = (value: number) => {
    if (value === 0) return 'bg-muted';
    
    const intensity = value / maxValue;
    
    if (intensity <= 0.2) {
      return 'bg-primary/20'; // Muy claro
    } else if (intensity <= 0.4) {
      return 'bg-primary/40'; // Claro
    } else if (intensity <= 0.6) {
      return 'bg-primary/60'; // Medio
    } else if (intensity <= 0.8) {
      return 'bg-primary/80'; // Oscuro
    } else {
      return 'bg-primary'; // Muy oscuro
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap de Actividad</CardTitle>
        <CardDescription>
          Distribución de reservas por día de la semana y hora del día
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header con días de la semana */}
            <div className="flex mb-2">
              <div className="w-12" /> {/* Espacio para las horas */}
              {DAYS.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 text-center text-sm font-medium text-muted-foreground"
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
                  <div className="w-12 text-xs text-muted-foreground text-right pr-2">
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* Celdas del heatmap */}
                  {DAYS.map((_, dayIndex) => {
                    const value = matrix[hour][dayIndex];
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'flex-1 aspect-square rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer',
                          getColor(value)
                        )}
                        title={`${DAYS[dayIndex]} ${String(hour).padStart(2, '0')}:00 - ${value} reservas`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-muted" />
                <div className="w-4 h-4 rounded-sm bg-primary/20" />
                <div className="w-4 h-4 rounded-sm bg-primary/40" />
                <div className="w-4 h-4 rounded-sm bg-primary/60" />
                <div className="w-4 h-4 rounded-sm bg-primary/80" />
                <div className="w-4 h-4 rounded-sm bg-primary" />
              </div>
              <span>Más</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
