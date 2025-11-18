import { useEffect } from "react";
import { useAdminWaitlist } from "@/hooks/admin/useAdminWaitlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * AdminWaitlistStats Component
 * 
 * Displays comprehensive statistics in a single scrollable view
 */
export const AdminWaitlistStats = () => {
  const { stats, loading, getWaitlistStats } = useAdminWaitlist();

  useEffect(() => {
    getWaitlistStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getWaitlistStats(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return <StatsLoadingSkeleton />;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No hay estadísticas disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  const entriesByGroupData = stats.entriesByGroup.map((group: any) => ({
    name: group.groupName,
    usuarios: group.count,
  }));

  const offersByStatusData = stats.offersByStatus.map((offer: any) => ({
    name: getStatusLabel(offer.status),
    value: offer.count,
  }));

  const COLORS = {
    pending: "#f59e0b",
    accepted: "#10b981",
    rejected: "#ef4444",
    expired: "#6b7280",
  };

  return (
    <div className="space-y-8">
      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Usuarios en Espera"
          value={stats.totalUsersInWaitlist}
          description="Usuarios únicos en listas activas"
          icon={Users}
          iconColor="text-primary"
        />
        
        <MetricCard
          title="Entradas Activas"
          value={stats.totalActiveEntries}
          description="Total de registros en listas"
          icon={Clock}
          iconColor="text-amber-500"
        />
        
        <MetricCard
          title="Ofertas Pendientes"
          value={stats.totalPendingOffers}
          description="Esperando respuesta"
          icon={AlertCircle}
          iconColor="text-orange-500"
        />
        
        <MetricCard
          title="Tiempo Promedio"
          value={`${stats.averageWaitTime.toFixed(1)}h`}
          description="Tiempo de espera promedio"
          icon={Clock}
          iconColor="text-blue-500"
        />
      </div>

      <Separator />

      {/* Tasas de Respuesta */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Tasas de Respuesta</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <RateCard
            title="Tasa de Aceptación"
            rate={stats.acceptanceRate}
            icon={CheckCircle}
            iconColor="text-green-500"
            description="Ofertas aceptadas"
          />
          
          <RateCard
            title="Tasa de Rechazo"
            rate={stats.rejectionRate}
            icon={XCircle}
            iconColor="text-red-500"
            description="Ofertas rechazadas"
          />
          
          <RateCard
            title="Tasa de Expiración"
            rate={stats.expirationRate}
            icon={AlertCircle}
            iconColor="text-gray-500"
            description="Ofertas sin respuesta"
          />
        </div>
      </div>

      <Separator />

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entradas por Grupo */}
        <Card>
          <CardHeader>
            <CardTitle>Entradas por Grupo</CardTitle>
            <CardDescription>
              Distribución de usuarios en espera por grupo de parking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entriesByGroupData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={entriesByGroupData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="usuarios" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ofertas por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Ofertas por Estado</CardTitle>
            <CardDescription>
              Distribución de ofertas según su estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offersByStatusData.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={offersByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {offersByStatusData.map((entry: any, index: number) => {
                      const status = stats.offersByStatus[index].status;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[status as keyof typeof COLORS]} 
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No hay ofertas registradas
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

const MetricCard = ({ title, value, description, icon: Icon, iconColor }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${iconColor}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

/**
 * Rate Card Component
 */
interface RateCardProps {
  title: string;
  rate: number;
  icon: React.ElementType;
  iconColor: string;
  description: string;
}

const RateCard = ({ title, rate, icon: Icon, iconColor, description }: RateCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${iconColor}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{rate.toFixed(1)}%</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

/**
 * Loading Skeleton
 */
const StatsLoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

/**
 * Helper function to get status label in Spanish
 */
const getStatusLabel = (status: "pending" | "accepted" | "rejected" | "expired"): string => {
  const labels = {
    pending: "Pendientes",
    accepted: "Aceptadas",
    rejected: "Rechazadas",
    expired: "Expiradas",
  };
  return labels[status];
};

/**
 * Custom label renderer for pie chart
 */
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
