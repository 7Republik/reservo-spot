import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityByHourData } from '@/types/admin/check-in-stats';

interface ActivityByHourChartProps {
  data: ActivityByHourData[];
  isLoading?: boolean;
}

const chartConfig = {
  reservations: {
    label: 'Reservas',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export const ActivityByHourChart = ({
  data,
  isLoading = false,
}: ActivityByHourChartProps) => {
  // Formatear datos para el chart
  const chartData = data.map((item) => ({
    hour: `${String(item.hour).padStart(2, '0')}:00`,
    reservations: item.reservations,
  }));

  // Calcular total y tendencia
  const totalReservations = data.reduce((sum, item) => sum + item.reservations, 0);
  const peakHour = data.length > 0 
    ? data.reduce((max, item) => item.reservations > max.reservations ? item : max)
    : { hour: 0, reservations: 0 };

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Actividad por Hora</CardTitle>
        <CardDescription className="text-xs">
          {totalReservations > 0 ? (
            <>
              {totalReservations.toLocaleString()} reservas · Pico: {String(peakHour.hour).padStart(2, '0')}:00 ({peakHour.reservations})
            </>
          ) : (
            'No hay datos para el periodo seleccionado'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="3 3" 
              className="stroke-muted"
            />
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              className="text-[10px]"
              tickFormatter={(value) => {
                // Mostrar solo cada 3 horas
                const hour = parseInt(value.split(':')[0]);
                return hour % 3 === 0 ? value.replace(':00', 'h') : '';
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              className="text-[10px]"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `${value}`}
                  formatter={(value) => [`${value}`, 'Reservas']}
                />
              }
            />
            <Bar
              dataKey="reservations"
              fill="var(--color-reservations)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
