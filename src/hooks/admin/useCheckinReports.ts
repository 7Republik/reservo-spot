import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CheckinReportItem, CheckinHistoryItem, CheckinStats } from '@/types/checkin.types';

interface CheckinReportsFilters {
  groupId?: string;
  userId?: string;
  infractionType?: 'checkin' | 'checkout';
  startDate?: string;
  endDate?: string;
}

interface CheckinHistoryFilters {
  groupId?: string;
  userId?: string;
  spotId?: string;
  startDate?: string;
  endDate?: string;
}

export const useCheckinReports = () => {
  const [todayInfractions, setTodayInfractions] = useState<CheckinReportItem[]>([]);
  const [checkinHistory, setCheckinHistory] = useState<CheckinHistoryItem[]>([]);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  /**
   * Carga las infracciones del día actual
   */
  const loadTodayInfractions = async (filters?: CheckinReportsFilters) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('checkin_infractions')
        .select(`
          id,
          user_id,
          spot_id,
          group_id,
          infraction_type,
          infraction_date,
          detected_at,
          expected_checkin_window_end,
          grace_period_end
        `)
        .eq('infraction_date', today);

      // Aplicar filtros
      if (filters?.groupId) {
        query = query.eq('group_id', filters.groupId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.infractionType) {
        query = query.eq('infraction_type', filters.infractionType);
      }

      query = query.order('detected_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setTodayInfractions([]);
        isCached.current = true;
        return;
      }

      // Obtener IDs únicos
      const userIds = [...new Set(data.map(item => item.user_id))];
      const spotIds = [...new Set(data.map(item => item.spot_id))];
      const groupIds = [...new Set(data.map(item => item.group_id))];

      // Cargar datos relacionados en paralelo
      const [profilesData, spotsData, groupsData] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', userIds),
        supabase.from('parking_spots').select('id, spot_number').in('id', spotIds),
        supabase.from('parking_groups').select('id, name').in('id', groupIds)
      ]);

      // Crear mapas para búsqueda rápida
      const profilesMap = new Map(
        (profilesData.data || []).map(p => [p.id, p.full_name])
      );
      const spotsMap = new Map(
        (spotsData.data || []).map(s => [s.id, s.spot_number])
      );
      const groupsMap = new Map(
        (groupsData.data || []).map(g => [g.id, g.name])
      );

      // Transformar datos al formato esperado
      const formattedData: CheckinReportItem[] = data.map((item: any) => ({
        user_id: item.user_id,
        user_name: profilesMap.get(item.user_id) || 'Usuario desconocido',
        spot_number: spotsMap.get(item.spot_id) || 'N/A',
        group_name: groupsMap.get(item.group_id) || 'N/A',
        reservation_date: item.infraction_date,
        infraction_type: item.infraction_type,
        detected_at: item.detected_at,
        expected_window_end: item.expected_checkin_window_end,
        grace_period_end: item.grace_period_end
      }));

      setTodayInfractions(formattedData);
      isCached.current = true;
    } catch (err) {
      console.error('Error loading today infractions:', err);
      toast.error('Error al cargar infracciones del día');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga el histórico completo de check-ins y check-outs
   */
  const loadCheckinHistory = async (filters?: CheckinHistoryFilters) => {
    setLoading(true);
    try {
      let query = supabase
        .from('reservation_checkins')
        .select(`
          id,
          user_id,
          spot_id,
          group_id,
          checkin_at,
          checkout_at,
          is_continuous_reservation
        `);

      // Aplicar filtros
      if (filters?.groupId) {
        query = query.eq('group_id', filters.groupId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.spotId) {
        query = query.eq('spot_id', filters.spotId);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      query = query.order('created_at', { ascending: false }).limit(500);

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setCheckinHistory([]);
        return;
      }

      // Obtener IDs únicos
      const userIds = [...new Set(data.map(item => item.user_id))];
      const spotIds = [...new Set(data.map(item => item.spot_id))];
      const groupIds = [...new Set(data.map(item => item.group_id))];

      // Cargar datos relacionados en paralelo
      const [profilesData, spotsData, groupsData] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', userIds),
        supabase.from('parking_spots').select('id, spot_number').in('id', spotIds),
        supabase.from('parking_groups').select('id, name').in('id', groupIds)
      ]);

      // Crear mapas para búsqueda rápida
      const profilesMap = new Map(
        (profilesData.data || []).map(p => [p.id, p.full_name])
      );
      const spotsMap = new Map(
        (spotsData.data || []).map(s => [s.id, s.spot_number])
      );
      const groupsMap = new Map(
        (groupsData.data || []).map(g => [g.id, g.name])
      );

      // Transformar datos y calcular duración
      const formattedData: CheckinHistoryItem[] = data.map((item: any) => {
        let durationMinutes = null;
        if (item.checkin_at && item.checkout_at) {
          const checkinTime = new Date(item.checkin_at).getTime();
          const checkoutTime = new Date(item.checkout_at).getTime();
          durationMinutes = Math.round((checkoutTime - checkinTime) / (1000 * 60));
        }

        return {
          id: item.id,
          user_name: profilesMap.get(item.user_id) || 'Usuario desconocido',
          spot_number: spotsMap.get(item.spot_id) || 'N/A',
          group_name: groupsMap.get(item.group_id) || 'N/A',
          checkin_at: item.checkin_at,
          checkout_at: item.checkout_at,
          duration_minutes: durationMinutes,
          is_continuous: item.is_continuous_reservation
        };
      });

      setCheckinHistory(formattedData);
    } catch (err) {
      console.error('Error loading checkin history:', err);
      toast.error('Error al cargar histórico de check-ins');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcula estadísticas de cumplimiento
   */
  const calculateStats = async (filters?: CheckinHistoryFilters) => {
    setLoading(true);
    try {
      // Obtener total de check-ins
      let checkinQuery = supabase
        .from('reservation_checkins')
        .select('id, checkin_at, checkout_at', { count: 'exact', head: false });

      if (filters?.startDate) {
        checkinQuery = checkinQuery.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        checkinQuery = checkinQuery.lte('created_at', filters.endDate);
      }

      const { data: checkins, count: totalCheckins, error: checkinError } = await checkinQuery;
      if (checkinError) throw checkinError;

      // Obtener total de infracciones
      let infractionQuery = supabase
        .from('checkin_infractions')
        .select('infraction_type', { count: 'exact', head: false });

      if (filters?.startDate) {
        infractionQuery = infractionQuery.gte('infraction_date', filters.startDate);
      }
      if (filters?.endDate) {
        infractionQuery = infractionQuery.lte('infraction_date', filters.endDate);
      }

      const { data: infractions, count: totalInfractions, error: infractionError } = await infractionQuery;
      if (infractionError) throw infractionError;

      // Contar por tipo
      const checkinInfractions = (infractions || []).filter((i: any) => i.infraction_type === 'checkin').length;
      const checkoutInfractions = (infractions || []).filter((i: any) => i.infraction_type === 'checkout').length;

      // Contar check-ins y check-outs completados
      const completedCheckins = (checkins || []).filter((c: any) => c.checkin_at !== null).length;
      const completedCheckouts = (checkins || []).filter((c: any) => c.checkout_at !== null).length;

      // Calcular tasa de cumplimiento
      const complianceRate = totalCheckins && totalInfractions !== null
        ? ((completedCheckins - (totalInfractions || 0)) / completedCheckins) * 100
        : 100;

      // Calcular promedios de tiempo (simplificado)
      const avgCheckinTime = '10:30'; // Placeholder - requeriría cálculo más complejo
      const avgCheckoutTime = '18:45'; // Placeholder - requeriría cálculo más complejo

      const calculatedStats: CheckinStats = {
        total_checkins: completedCheckins || 0,
        total_checkouts: completedCheckouts || 0,
        total_infractions: totalInfractions || 0,
        checkin_infractions: checkinInfractions,
        checkout_infractions: checkoutInfractions,
        compliance_rate: Math.max(0, Math.min(100, complianceRate)),
        avg_checkin_time: avgCheckinTime,
        avg_checkout_time: avgCheckoutTime
      };

      setStats(calculatedStats);
    } catch (err) {
      console.error('Error calculating stats:', err);
      toast.error('Error al calcular estadísticas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exporta datos a CSV
   */
  const exportToCSV = (data: CheckinReportItem[] | CheckinHistoryItem[], filename: string) => {
    try {
      let csv: string;

      if (data.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }

      // Determinar tipo de datos
      const isInfractionReport = 'infraction_type' in data[0];

      if (isInfractionReport) {
        // Exportar infracciones
        const infractions = data as CheckinReportItem[];
        csv = [
          ['Usuario', 'Plaza', 'Grupo', 'Fecha', 'Tipo', 'Detectado', 'Ventana Esperada', 'Fin Gracia'],
          ...infractions.map(r => [
            r.user_name,
            r.spot_number,
            r.group_name,
            r.reservation_date,
            r.infraction_type === 'checkin' ? 'Check-in' : 'Check-out',
            new Date(r.detected_at).toLocaleString('es-ES'),
            r.expected_window_end ? new Date(r.expected_window_end).toLocaleString('es-ES') : 'N/A',
            r.grace_period_end ? new Date(r.grace_period_end).toLocaleString('es-ES') : 'N/A'
          ])
        ].map(row => row.join(',')).join('\n');
      } else {
        // Exportar histórico
        const history = data as CheckinHistoryItem[];
        csv = [
          ['Usuario', 'Plaza', 'Grupo', 'Check-in', 'Check-out', 'Duración (min)', 'Continua'],
          ...history.map(h => [
            h.user_name,
            h.spot_number,
            h.group_name,
            h.checkin_at ? new Date(h.checkin_at).toLocaleString('es-ES') : 'N/A',
            h.checkout_at ? new Date(h.checkout_at).toLocaleString('es-ES') : 'N/A',
            h.duration_minutes?.toString() || 'N/A',
            h.is_continuous ? 'Sí' : 'No'
          ])
        ].map(row => row.join(',')).join('\n');
      }

      // Crear y descargar archivo
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Archivo CSV descargado correctamente');
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      toast.error('Error al exportar a CSV');
    }
  };

  return {
    todayInfractions,
    checkinHistory,
    stats,
    loading,
    loadTodayInfractions,
    loadCheckinHistory,
    calculateStats,
    exportToCSV
  };
};
