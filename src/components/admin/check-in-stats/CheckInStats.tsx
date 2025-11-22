import { useEffect, useState } from 'react';
import { subDays } from 'date-fns';
import { useCheckInStats } from '@/hooks/admin/useCheckInStats';
import { CheckInStatsFilters } from '@/types/admin/check-in-stats';
import { StatsFilters } from './StatsFilters';
import { StatsCards } from './StatsCards';
import { ActivityByHourChart } from './ActivityByHourChart';
import { ActivityHeatmap } from './ActivityHeatmap';
import { MobileHeatmapPlaceholder } from './MobileHeatmapPlaceholder';
import { TopUsersTable } from './TopUsersTable';

export const CheckInStats = () => {
  const { data, loadStats, exportTopUsers, exportAllReservations } = useCheckInStats();
  const [isExporting, setIsExporting] = useState(false);

  // Filtros iniciales: últimos 7 días, todos los grupos
  const [filters, setFilters] = useState<CheckInStatsFilters>({
    groupId: null,
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  });

  // Cargar datos al montar y cuando cambien los filtros
  useEffect(() => {
    loadStats(filters);
  }, [filters, loadStats]);

  const handleExportTopUsers = async () => {
    setIsExporting(true);
    try {
      await exportTopUsers({ type: 'topUsers', filters });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllReservations = async () => {
    setIsExporting(true);
    try {
      await exportAllReservations({ type: 'allReservations', filters });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <StatsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExportTopUsers={handleExportTopUsers}
        onExportAllReservations={handleExportAllReservations}
        isExporting={isExporting}
      />

      {/* Stats Cards */}
      <StatsCards stats={data.general} isLoading={data.isLoading} />

      {/* Gráficos en grid para mejor uso del espacio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfica de Actividad por Hora */}
        <ActivityByHourChart data={data.activityByHour} isLoading={data.isLoading} />

        {/* Heatmap - Solo visible en tablet/desktop */}
        <div className="hidden md:block">
          <ActivityHeatmap data={data.heatmap} isLoading={data.isLoading} />
        </div>
      </div>

      {/* Placeholder para móvil */}
      <MobileHeatmapPlaceholder />

      {/* Tabla de Top Usuarios */}
      <TopUsersTable users={data.topUsers} isLoading={data.isLoading} />
    </div>
  );
};
