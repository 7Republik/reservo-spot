import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CheckInStatsFilters,
  CheckInStatsData,
  GeneralStats,
  ActivityByHourData,
  HeatmapData,
  TopUserData,
  ExportTopUsersData,
  ExportAllReservationsData,
  ExportOptions,
} from '@/types/admin/check-in-stats';

/**
 * Hook para gestionar estadísticas de check-in
 * 
 * Proporciona funciones para cargar estadísticas de reservas,
 * incluyendo métricas generales, gráficas y exportación CSV.
 * 
 * Usa patrón de cache con useRef para evitar re-fetches innecesarios.
 */
export const useCheckInStats = () => {
  const [data, setData] = useState<CheckInStatsData>({
    general: {
      totalReservations: 0,
      avgMinutes: null,
      peakHour: null,
      fastestUser: null,
      fastestTime: null,
    },
    activityByHour: [],
    heatmap: [],
    topUsers: [],
    isLoading: false,
    error: null,
  });

  const isCached = useRef(false);
  const currentFilters = useRef<CheckInStatsFilters | null>(null);

  /**
   * Obtiene la hora de desbloqueo configurada
   */
  const getUnlockHour = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('reservation_settings')
        .select('daily_refresh_hour')
        .single();

      if (error) throw error;

      return data?.daily_refresh_hour || 10; // Default: 10:00 AM
    } catch (error) {
      console.error('Error getting unlock hour:', error);
      return 10;
    }
  };

  /**
   * Obtiene el umbral de reserva rápida configurado
   */
  const getFastThreshold = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('reservation_settings')
        .select('fast_reservation_threshold_minutes')
        .single();

      if (error) throw error;

      return data?.fast_reservation_threshold_minutes || 5;
    } catch (error) {
      console.error('Error getting fast threshold:', error);
      return 5;
    }
  };

  /**
   * Carga estadísticas generales
   */
  const loadGeneralStats = async (
    filters: CheckInStatsFilters,
    unlockHour: number,
    fastThreshold: number
  ): Promise<GeneralStats> => {
    // Query para total de reservas
    let totalQuery = supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', filters.startDate.toISOString())
      .lte('created_at', filters.endDate.toISOString());

    if (filters.groupId) {
      const { data: spots } = await supabase
        .from('parking_spots')
        .select('id')
        .eq('group_id', filters.groupId);

      if (spots) {
        const spotIds = spots.map(s => s.id);
        totalQuery = totalQuery.in('spot_id', spotIds);
      }
    }

    const { count: totalReservations } = await totalQuery;

    // Query para tiempo promedio
    const { data: avgData } = await supabase.rpc('get_avg_reservation_time', {
      p_start_date: filters.startDate.toISOString(),
      p_end_date: filters.endDate.toISOString(),
      p_group_id: filters.groupId,
      p_unlock_hour: unlockHour,
    }) as { data: any };

    // Query para hora pico
    const { data: peakData } = await supabase.rpc('get_peak_hour', {
      p_start_date: filters.startDate.toISOString(),
      p_end_date: filters.endDate.toISOString(),
      p_group_id: filters.groupId,
    }) as { data: any };

    // Query para usuario más rápido
    const { data: fastestData } = await supabase.rpc('get_fastest_user', {
      p_start_date: filters.startDate.toISOString(),
      p_end_date: filters.endDate.toISOString(),
      p_group_id: filters.groupId,
      p_unlock_hour: unlockHour,
    }) as { data: any };

    return {
      totalReservations: totalReservations || 0,
      avgMinutes: avgData?.[0]?.avg_minutes || null,
      peakHour: peakData?.[0]?.hour || null,
      fastestUser: fastestData?.[0]?.full_name || null,
      fastestTime: fastestData?.[0]?.fastest_minutes || null,
    };
  };

  /**
   * Carga actividad por hora
   */
  const loadActivityByHour = async (
    filters: CheckInStatsFilters
  ): Promise<ActivityByHourData[]> => {
    const { data, error } = await supabase.rpc('get_activity_by_hour', {
      p_start_date: filters.startDate.toISOString(),
      p_end_date: filters.endDate.toISOString(),
      p_group_id: filters.groupId,
    }) as { data: any; error: any };

    if (error) throw error;

    // Asegurar que tenemos todas las horas (0-23)
    const allHours: ActivityByHourData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      reservations: 0,
    }));

    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        allHours[item.hour] = {
          hour: item.hour,
          reservations: item.reservations,
        };
      });
    }

    return allHours;
  };

  /**
   * Carga datos del heatmap
   */
  const loadHeatmapData = async (
    filters: CheckInStatsFilters
  ): Promise<HeatmapData[]> => {
    const { data, error } = await supabase.rpc('get_heatmap_data', {
      p_start_date: filters.startDate.toISOString(),
      p_end_date: filters.endDate.toISOString(),
      p_group_id: filters.groupId,
    }) as { data: any; error: any };

    if (error) throw error;

    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      dayOfWeek: item.day_of_week,
      hour: item.hour,
      count: item.count,
    }));
  };

  /**
   * Carga top usuarios rápidos
   */
  const loadTopUsers = async (
    filters: CheckInStatsFilters,
    unlockHour: number,
    fastThreshold: number,
    limit: number = 10
  ): Promise<TopUserData[]> => {
    const { data, error } = await supabase.rpc('get_top_fast_users', {
      p_start_date: filters.startDate.toISOString(),
      p_end_date: filters.endDate.toISOString(),
      p_group_id: filters.groupId,
      p_unlock_hour: unlockHour,
      p_fast_threshold: fastThreshold,
      p_limit: limit,
    }) as { data: any; error: any };

    if (error) throw error;

    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      userId: item.user_id,
      fullName: item.full_name,
      email: item.email,
      fastReservations: item.fast_reservations,
      totalReservations: item.total_reservations,
      percentage: item.percentage,
      avgMinutes: item.avg_minutes,
      isPowerUser: item.percentage > 70,
    }));
  };

  /**
   * Carga todas las estadísticas
   */
  const loadStats = useCallback(
    async (filters: CheckInStatsFilters, forceReload: boolean = false) => {
      // Verificar cache
      if (
        isCached.current &&
        !forceReload &&
        currentFilters.current &&
        JSON.stringify(currentFilters.current) === JSON.stringify(filters)
      ) {
        return;
      }

      setData(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const unlockHour = await getUnlockHour();
        const fastThreshold = await getFastThreshold();

        const [general, activityByHour, heatmap, topUsers] = await Promise.all([
          loadGeneralStats(filters, unlockHour, fastThreshold),
          loadActivityByHour(filters),
          loadHeatmapData(filters),
          loadTopUsers(filters, unlockHour, fastThreshold),
        ]);

        setData({
          general,
          activityByHour,
          heatmap,
          topUsers,
          isLoading: false,
          error: null,
        });

        isCached.current = true;
        currentFilters.current = filters;
      } catch (error) {
        console.error('Error loading check-in stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        toast.error('Error al cargar estadísticas', {
          description: errorMessage,
        });
      }
    },
    []
  );

  /**
   * Genera CSV de top usuarios
   */
  const exportTopUsers = useCallback(async (options: ExportOptions) => {
    try {
      const unlockHour = await getUnlockHour();
      const fastThreshold = await getFastThreshold();
      
      const users = await loadTopUsers(
        options.filters,
        unlockHour,
        fastThreshold,
        20 // Exportar top 20
      );

      const csvData: ExportTopUsersData[] = users.map(user => ({
        Usuario: user.fullName,
        Email: user.email,
        'Reservas Rápidas': user.fastReservations,
        'Total Reservas': user.totalReservations,
        Porcentaje: `${user.percentage.toFixed(1)}%`,
        'Hora Promedio': user.avgMinutes
          ? `${Math.floor(user.avgMinutes)}:${String(Math.round((user.avgMinutes % 1) * 60)).padStart(2, '0')}`
          : 'N/A',
      }));

      downloadCSV(csvData, options.filename || 'top-usuarios-rapidos');
      toast.success('CSV exportado correctamente');
    } catch (error) {
      console.error('Error exporting top users:', error);
      toast.error('Error al exportar CSV');
    }
  }, []);

  /**
   * Genera CSV de todas las reservas
   */
  const exportAllReservations = useCallback(async (options: ExportOptions) => {
    try {
      const unlockHour = await getUnlockHour();

      // Obtener reservas
      let reservationsQuery = supabase
        .from('reservations')
        .select('created_at, reservation_date, user_id, spot_id')
        .gte('created_at', options.filters.startDate.toISOString())
        .lte('created_at', options.filters.endDate.toISOString())
        .order('created_at', { ascending: true });

      const { data: reservations, error: reservationsError } = await reservationsQuery;

      if (reservationsError) throw reservationsError;
      if (!reservations || reservations.length === 0) {
        toast.error('No hay reservas para exportar');
        return;
      }

      // Obtener IDs únicos
      const userIds = [...new Set(reservations.map(r => r.user_id))];
      const spotIds = [...new Set(reservations.map(r => r.spot_id))];

      // Obtener perfiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Obtener plazas con grupos
      const { data: spots } = await supabase
        .from('parking_spots')
        .select('id, spot_number, group_id, parking_groups!inner(name)')
        .in('id', spotIds);

      // Filtrar por grupo si es necesario
      const filteredReservations = options.filters.groupId
        ? reservations.filter(r => {
            const spot = spots?.find(s => s.id === r.spot_id);
            return spot?.group_id === options.filters.groupId;
          })
        : reservations;

      // Crear mapa de datos
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const spotsMap = new Map(spots?.map(s => [s.id, s]) || []);

      const csvData: ExportAllReservationsData[] = filteredReservations.map((res) => {
        const createdAt = new Date(res.created_at);
        const dayStart = new Date(createdAt);
        dayStart.setHours(unlockHour, 0, 0, 0);
        
        const diffMs = createdAt.getTime() - dayStart.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffSec = Math.floor((diffMs % 60000) / 1000);

        const profile = profilesMap.get(res.user_id);
        const spot = spotsMap.get(res.spot_id);

        return {
          'Fecha Reserva': new Date(res.reservation_date).toLocaleDateString('es-ES'),
          'Hora Reserva': createdAt.toLocaleTimeString('es-ES'),
          Usuario: profile?.full_name || 'Desconocido',
          Email: profile?.email || 'N/A',
          Grupo: (spot as any)?.parking_groups?.name || 'N/A',
          Plaza: spot?.spot_number || 'N/A',
          'Tiempo desde Desbloqueo': `${diffMin}min ${diffSec}seg`,
        };
      });

      const filename = options.filename || 
        `reservas-${options.filters.startDate.toISOString().split('T')[0]}-${options.filters.endDate.toISOString().split('T')[0]}`;
      
      downloadCSV(csvData, filename);
      toast.success('CSV exportado correctamente');
    } catch (error) {
      console.error('Error exporting all reservations:', error);
      toast.error('Error al exportar CSV');
    }
  }, []);

  /**
   * Descarga un array de objetos como CSV
   */
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Obtener headers
    const headers = Object.keys(data[0]);
    
    // Crear filas CSV
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escapar comillas y envolver en comillas si contiene coma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ),
    ];

    // Crear blob y descargar
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Invalida el cache
   */
  const invalidateCache = useCallback(() => {
    isCached.current = false;
    currentFilters.current = null;
  }, []);

  return {
    data,
    loadStats,
    exportTopUsers,
    exportAllReservations,
    invalidateCache,
  };
};
