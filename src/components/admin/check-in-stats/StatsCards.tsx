import { Target, Zap, Flame, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GeneralStats } from '@/types/admin/check-in-stats';

interface StatsCardsProps {
  stats: GeneralStats;
  isLoading?: boolean;
}

export const StatsCards = ({ stats, isLoading = false }: StatsCardsProps) => {
  const formatTime = (minutes: number | null) => {
    if (minutes === null || minutes === 0) return '—';
    
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    }
    
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes % 1) * 60);
    
    if (secs === 0) {
      return `${mins}m`;
    }
    
    return `${mins}m ${secs}s`;
  };

  const formatHour = (hour: number | null | undefined) => {
    if (hour === null || hour === undefined) return '—';
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const cards = [
    {
      title: 'Total de Reservas',
      value: stats.totalReservations.toLocaleString(),
      subtitle: 'Reservas totales',
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Tiempo Promedio',
      value: formatTime(stats.avgMinutes),
      subtitle: 'Desde desbloqueo',
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Hora Pico',
      value: formatHour(stats.peakHour),
      subtitle: 'Mayor actividad',
      icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Usuario Más Rápido',
      value: stats.fastestUser || '—',
      subtitle: stats.fastestTime ? formatTime(stats.fastestTime) : 'Sin datos',
      icon: User,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold truncate" title={String(card.value)}>
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
