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
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad por Hora del Día</CardTitle>
        <CardDescription>
          {totalReservations > 0 ? (
            <>
              Total de {totalReservations.toLocaleString()} reservas.
              Hora pico: {String(peakHour.hour).padStart(2, '0')}:00 con{' '}
              {peakHour.reservations} reservas.
            </>
          ) : (
            'No hay datos para el periodo seleccionado'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                // Mostrar solo cada 2 horas en móvil
                const hour = parseInt(value.split(':')[0]);
                return hour % 2 === 0 ? value : '';
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Hora: ${value}`}
                  formatter={(value) => [`${value} reservas`, 'Reservas']}
                />
              }
            />
            <Bar
              dataKey="reservations"
              fill="var(--color-reservations)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
