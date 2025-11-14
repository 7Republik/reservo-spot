/**
 * Utilidades para optimización del cache offline
 * 
 * Proporciona funciones helper para:
 * - Cache selectivo (solo mes actual + 7 días)
 * - Generación de claves de cache optimizadas
 * - Validación de rangos de fechas
 */

import { format, startOfMonth, endOfMonth, addDays, isWithinInterval } from 'date-fns';

/**
 * Obtiene el rango de fechas que deben ser cacheadas
 * Requisito 6.4: Solo cachear mes actual + 7 días hacia adelante
 * 
 * @returns Objeto con fechas de inicio y fin del rango cacheable
 */
export const getCacheableRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = addDays(now, 7);

  return { start, end };
};

/**
 * Verifica si una fecha está dentro del rango cacheable
 * 
 * @param date Fecha a verificar
 * @returns true si la fecha debe ser cacheada
 */
export const isDateCacheable = (date: Date): boolean => {
  const { start, end } = getCacheableRange();
  return isWithinInterval(date, { start, end });
};

/**
 * Genera una clave de cache optimizada para reservas
 * Formato: reservations_{userId}_{yearMonth}
 * 
 * @param userId ID del usuario
 * @param date Fecha de la reserva
 * @returns Clave de cache
 */
export const generateReservationCacheKey = (userId: string, date: Date): string => {
  const yearMonth = format(date, 'yyyy-MM');
  return `reservations_${userId}_${yearMonth}`;
};

/**
 * Genera una clave de cache optimizada para plazas
 * Formato: spots_{groupId}_{date}
 * 
 * @param groupId ID del grupo de parking
 * @param date Fecha
 * @returns Clave de cache
 */
export const generateSpotsCacheKey = (groupId: string, date: Date): string => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return `spots_${groupId}_${dateStr}`;
};

/**
 * Genera una clave de cache optimizada para placas
 * Formato: plates_{userId}
 * 
 * @param userId ID del usuario
 * @returns Clave de cache
 */
export const generatePlatesCacheKey = (userId: string): string => {
  return `plates_${userId}`;
};

/**
 * Genera una clave de cache optimizada para grupos
 * Formato: groups_{userId}
 * 
 * @param userId ID del usuario
 * @returns Clave de cache
 */
export const generateGroupsCacheKey = (userId: string): string => {
  return `groups_${userId}`;
};

/**
 * Filtra un array de fechas para obtener solo las cacheables
 * 
 * @param dates Array de fechas
 * @returns Array de fechas dentro del rango cacheable
 */
export const filterCacheableDates = (dates: Date[]): Date[] => {
  const { start, end } = getCacheableRange();
  return dates.filter(date => isWithinInterval(date, { start, end }));
};

/**
 * Obtiene todas las claves de cache para un rango de fechas
 * Útil para batch operations
 * 
 * @param userId ID del usuario
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin
 * @returns Array de claves de cache
 */
export const getReservationCacheKeysForRange = (
  userId: string,
  startDate: Date,
  endDate: Date
): string[] => {
  const keys: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isDateCacheable(current)) {
      keys.push(generateReservationCacheKey(userId, current));
    }
    // Avanzar al siguiente mes
    current.setMonth(current.getMonth() + 1);
  }

  return keys;
};

/**
 * Calcula el tamaño aproximado de un objeto en bytes
 * Útil para estimar el tamaño del cache
 * 
 * @param obj Objeto a medir
 * @returns Tamaño aproximado en bytes
 */
export const estimateObjectSize = (obj: any): number => {
  try {
    const serialized = JSON.stringify(obj);
    return new Blob([serialized]).size;
  } catch (error) {
    console.error('Error estimating object size:', error);
    return 0;
  }
};

/**
 * Formatea el tamaño en bytes a una cadena legible
 * 
 * @param bytes Tamaño en bytes
 * @returns Cadena formateada (ej: "1.5 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Valida que los datos sean aptos para cache
 * Verifica tamaño y estructura
 * 
 * @param data Datos a validar
 * @param maxSize Tamaño máximo permitido en bytes (default: 1MB)
 * @returns true si los datos son válidos para cache
 */
export const validateCacheData = (data: any, maxSize: number = 1024 * 1024): boolean => {
  if (data === null || data === undefined) {
    return false;
  }

  const size = estimateObjectSize(data);
  if (size > maxSize) {
    console.warn(`[CacheUtils] Data too large for cache: ${formatBytes(size)} > ${formatBytes(maxSize)}`);
    return false;
  }

  return true;
};

/**
 * Agrupa claves de cache por tipo de dato
 * Útil para operaciones batch organizadas
 * 
 * @param keys Array de claves de cache
 * @returns Objeto con claves agrupadas por tipo
 */
export const groupCacheKeysByType = (keys: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {
    reservations: [],
    spots: [],
    plates: [],
    groups: [],
    admin: [],
    other: [],
  };

  keys.forEach(key => {
    if (key.startsWith('reservations_')) {
      groups.reservations.push(key);
    } else if (key.startsWith('spots_')) {
      groups.spots.push(key);
    } else if (key.startsWith('plates_')) {
      groups.plates.push(key);
    } else if (key.startsWith('groups_')) {
      groups.groups.push(key);
    } else if (key.startsWith('admin_')) {
      groups.admin.push(key);
    } else {
      groups.other.push(key);
    }
  });

  return groups;
};
