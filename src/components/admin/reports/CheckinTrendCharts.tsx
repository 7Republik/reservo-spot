import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface CheckinHistoryItem {
  id: string;
  checkin_at: string | null;
  checkout_at: string | null;
  is_continuous: boolean;
  has_checkin_infraction: boolean;
  has_checkout_infraction: boolean;
}

interface CheckinTrendChartsProps {
  checkinHistory: CheckinHistoryItem[];
  loading?: boolean;
}

export const CheckinTrendCharts = ({ checkinHistory, loading }: CheckinTrendChartsProps) => {
  // Procesar datos para la gráfica de tendencia temporal
  const trendData = useMemo(() => {
    if (!checkinHistory.length) return [];

    // Obtener últimos 30 días
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Agrupar check-ins por día
    const dataByDay = dateRange.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayCheckins = checkinHistory.filter(item => {
        if (!item.checkin_at) return false;
        const checkinDate = parseISO(item.checkin_at);
        return checkinDate >= dayStart && checkinDate <= dayEnd;
      });

      const checkouts = dayCheckins.filter(item => item.checkout_at).length;
      const infractions = dayCheckins.filter(
        item => item.has_checkin_infraction || item.has_checkout_infraction
      ).length;

      return {
        date: format(date, 'dd MMM', { locale: es }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: es }),
        checkins: dayCheckins.length,
        checkouts,
        infractions,
        complianceRate: dayCheckins.length > 0 
          ? ((dayCheckins.length - infractions) / dayCheckins.length * 100).toFixed(1)
          : 0
      };
    });

    return dataByDay;
  }, [checkinHistory]);

  // Calcular métricas globales
  const globalMetrics = useMemo(() => {
    if (!checkinHistory.length) return { avgCheckins: 0, avgCompliance: 0, trend: 0 };

    const totalCheckins = checkinHistory.length;
    const totalInfractions = checkinHistory.filter(
      item => item.has_checkin_infraction || item.has_checkout_infraction
    ).length;
    const avgCompliance = ((totalCheckins - totalInfractions) / totalCheckins * 100);

    // Calcular tendencia (últimos 7 días vs 7 días anteriores)
    const last7Days = trendData.slice(-7);
    const previous7Days = trendData.slice(-14, -7);
    
    const last7Avg = last7Days.reduce((sum, d) => sum + d.checkins, 0) / 7;
    const prev7Avg = previous7Days.reduce((sum, d) => sum + d.checkins, 0) / 7;
    
    const trend = prev7Avg > 0 ? ((last7Avg - prev7Avg) / prev7Avg * 100) : 0;

    return {
      avgCheckins: (totalCheckins / 30).toFixed(1),
      avgCompliance: avgCompliance.toFixed(1),
      trend: trend.toFixed(1)
    };
  }, [checkinHistory, trendData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted rounded" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!checkinHistory.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfica 1: Tendencia de Check-ins (Área con gradiente) */}
      <Card className="overflow-hidden border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tendencia de Check-ins
              </CardTitle>
              <CardDescription className="mt-1">
                Últimos 30 días - Promedio: {globalMetrics.avgCheckins} check-ins/día
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                parseFloat(String(globalMetrics.trend)) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(String(globalMetrics.trend)) >= 0 ? '+' : ''}{globalMetrics.trend}%
              </div>
              <div className="text-xs text-muted-foreground">vs semana anterior</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCheckouts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                formatter={(value: number, name: string | number) => {
                  const label = name === 'checkins' ? 'Check-ins' : 'Check-outs';
                  return [value, label];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => value === 'checkins' ? 'Check-ins' : 'Check-outs'}
              />
              <Area 
                type="monotone" 
                dataKey="checkins" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fill="url(#colorCheckins)"
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
              <Area 
                type="monotone" 
                dataKey="checkouts" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                fill="url(#colorCheckouts)"
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica 2: Tasa de Cumplimiento (Línea dual) */}
      <Card className="overflow-hidden border-green-500/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-br from-green-500/5 via-green-500/10 to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-5 w-5 text-green-600" />
                Cumplimiento vs Infracciones
              </CardTitle>
              <CardDescription className="mt-1">
                Tasa promedio de cumplimiento: {globalMetrics.avgCompliance}%
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {globalMetrics.avgCompliance}%
              </div>
              <div className="text-xs text-muted-foreground">cumplimiento</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <defs>
                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorInfractions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                formatter={(value: number, name: string | number) => {
                  if (name === 'complianceRate') {
                    return [`${value}%`, 'Tasa de Cumplimiento'];
                  }
                  return [value, 'Infracciones'];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => {
                  if (value === 'complianceRate') return 'Tasa de Cumplimiento (%)';
                  return 'Infracciones';
                }}
              />
              <Line 
                type="monotone" 
                dataKey="complianceRate" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(142, 76%, 36%)' }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
              <Line 
                type="monotone" 
                dataKey="infractions" 
                stroke="hsl(0, 84%, 60%)" 
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(0, 84%, 60%)', r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(0, 84%, 60%)' }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
