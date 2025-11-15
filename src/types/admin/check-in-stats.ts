/**
 * Tipos para el Dashboard de Estadísticas de Check-in
 * 
 * Este módulo define las interfaces para el sistema de estadísticas
 * de reservas, incluyendo filtros, métricas, gráficas y exportación.
 */

/**
 * Filtros para las estadísticas de check-in
 */
export interface CheckInStatsFilters {
  /** ID del grupo de parking (null = todos los grupos) */
  groupId: string | null;
  /** Fecha de inicio del rango */
  startDate: Date;
  /** Fecha de fin del rango */
  endDate: Date;
}

/**
 * Rangos de fecha predefinidos para el selector
 */
export type DateRangePreset = 
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

/**
 * Datos para una tarjeta de estadística (Stats Card)
 */
export interface StatsCardData {
  /** Título de la métrica */
  title: string;
  /** Valor principal a mostrar */
  value: string | number;
  /** Subtítulo o descripción */
  subtitle: string;
  /** Nombre del icono de lucide-react */
  icon: string;
  /** Indica si está cargando */
  isLoading?: boolean;
}

/**
 * Datos de actividad por hora del día
 */
export interface ActivityByHourData {
  /** Hora del día (0-23) */
  hour: number;
  /** Número de reservas en esa hora */
  reservations: number;
}

/**
 * Datos para el heatmap de actividad
 */
export interface HeatmapData {
  /** Día de la semana (0=Domingo, 6=Sábado) */
  dayOfWeek: number;
  /** Hora del día (0-23) */
  hour: number;
  /** Número de reservas */
  count: number;
}

/**
 * Datos procesados para el heatmap (matriz)
 */
export interface HeatmapMatrix {
  /** Matriz [hora][día] con conteo de reservas */
  data: number[][];
  /** Valor máximo en la matriz (para escala de colores) */
  maxValue: number;
  /** Valor mínimo en la matriz */
  minValue: number;
}

/**
 * Datos de un usuario en el ranking de velocidad
 */
export interface TopUserData {
  /** ID del usuario */
  userId: string;
  /** Nombre completo */
  fullName: string;
  /** Email del usuario */
  email: string;
  /** Número de reservas rápidas */
  fastReservations: number;
  /** Total de reservas */
  totalReservations: number;
  /** Porcentaje de reservas rápidas */
  percentage: number;
  /** Tiempo promedio en minutos desde desbloqueo */
  avgMinutes: number | null;
  /** Indica si es un "power user" (>70% rápidas) */
  isPowerUser: boolean;
}

/**
 * Estadísticas generales del periodo
 */
export interface GeneralStats {
  /** Total de reservas en el periodo */
  totalReservations: number;
  /** Tiempo promedio de primera reserva (en minutos) */
  avgMinutes: number | null;
  /** Hora pico del día */
  peakHour: number | null;
  /** Nombre del usuario más rápido */
  fastestUser: string | null;
  /** Tiempo del usuario más rápido (en minutos) */
  fastestTime: number | null;
}

/**
 * Datos completos de estadísticas
 */
export interface CheckInStatsData {
  /** Estadísticas generales */
  general: GeneralStats;
  /** Actividad por hora */
  activityByHour: ActivityByHourData[];
  /** Datos del heatmap */
  heatmap: HeatmapData[];
  /** Top usuarios rápidos */
  topUsers: TopUserData[];
  /** Indica si los datos están cargando */
  isLoading: boolean;
  /** Error si ocurrió alguno */
  error: string | null;
}

/**
 * Datos para exportación CSV - Top Usuarios
 */
export interface ExportTopUsersData {
  Usuario: string;
  Email: string;
  'Reservas Rápidas': number;
  'Total Reservas': number;
  Porcentaje: string;
  'Hora Promedio': string;
}

/**
 * Datos para exportación CSV - Todas las Reservas
 */
export interface ExportAllReservationsData {
  'Fecha Reserva': string;
  'Hora Reserva': string;
  Usuario: string;
  Email: string;
  Grupo: string;
  Plaza: string;
  'Tiempo desde Desbloqueo': string;
}

/**
 * Configuración de colores para el heatmap
 */
export interface HeatmapColorConfig {
  /** Color para 0 reservas */
  empty: string;
  /** Color para baja actividad (1-5) */
  low: string;
  /** Color para actividad media (6-15) */
  medium: string;
  /** Color para actividad alta (16-30) */
  high: string;
  /** Color para actividad muy alta (31+) */
  veryHigh: string;
}

/**
 * Opciones para la exportación CSV
 */
export interface ExportOptions {
  /** Tipo de exportación */
  type: 'topUsers' | 'allReservations';
  /** Filtros aplicados */
  filters: CheckInStatsFilters;
  /** Nombre del archivo (sin extensión) */
  filename?: string;
}
