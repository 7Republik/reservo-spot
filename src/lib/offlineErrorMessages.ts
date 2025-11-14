/**
 * Sistema de mensajes de error consistente para modo offline
 * 
 * Todos los mensajes incluyen:
 * - Título claro y descriptivo
 * - Descripción con acción sugerida
 * - Estado de conectividad actual
 * - Duración apropiada para toasts
 * 
 * Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface OfflineErrorMessage {
  title: string;
  description: string;
  status: 'offline';
  duration?: number; // Duración del toast en ms
}

/**
 * Duración estándar para toasts de error offline
 * Requisito 7.1-7.3: Mensajes deben mostrarse en <500ms
 */
export const OFFLINE_TOAST_DURATION = 4000; // 4 segundos

/**
 * Mensajes de error para operaciones de creación (CREATE)
 * Requisito 7.1: Error en <500ms para operaciones CREATE
 */
export const OFFLINE_ERROR_CREATE: Record<string, OfflineErrorMessage> = {
  RESERVATION: {
    title: 'No puedes crear reservas sin conexión',
    description: 'Conéctate a internet para reservar plazas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  LICENSE_PLATE: {
    title: 'No puedes registrar placas sin conexión',
    description: 'Conéctate a internet para añadir nuevas placas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  PARKING_GROUP: {
    title: 'No puedes crear grupos sin conexión',
    description: 'Conéctate a internet para crear grupos de parking',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  PARKING_SPOT: {
    title: 'No puedes crear plazas sin conexión',
    description: 'Conéctate a internet para añadir plazas de parking',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  USER: {
    title: 'No puedes crear usuarios sin conexión',
    description: 'Conéctate a internet para gestionar usuarios',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  BLOCKED_DATE: {
    title: 'No puedes bloquear fechas sin conexión',
    description: 'Conéctate a internet para gestionar fechas bloqueadas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  INCIDENT_REPORT: {
    title: 'No puedes reportar incidentes sin conexión',
    description: 'Conéctate a internet para reportar problemas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  CHECKIN: {
    title: 'No puedes hacer check-in sin conexión',
    description: 'Requiere conexión para validar horarios',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
};

/**
 * Mensajes de error para operaciones de actualización (UPDATE)
 * Requisito 7.2: Error en <500ms para operaciones UPDATE
 */
export const OFFLINE_ERROR_UPDATE: Record<string, OfflineErrorMessage> = {
  RESERVATION: {
    title: 'No puedes modificar reservas sin conexión',
    description: 'Conéctate a internet para editar reservas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  LICENSE_PLATE: {
    title: 'No puedes modificar placas sin conexión',
    description: 'Conéctate a internet para editar placas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  PARKING_GROUP: {
    title: 'No puedes modificar grupos sin conexión',
    description: 'Conéctate a internet para editar grupos',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  PARKING_SPOT: {
    title: 'No puedes modificar plazas sin conexión',
    description: 'Conéctate a internet para editar plazas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  USER: {
    title: 'No puedes modificar usuarios sin conexión',
    description: 'Conéctate a internet para editar usuarios',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  PROFILE: {
    title: 'No puedes actualizar tu perfil sin conexión',
    description: 'Conéctate a internet para guardar cambios',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  SETTINGS: {
    title: 'No puedes cambiar configuración sin conexión',
    description: 'Conéctate a internet para guardar ajustes',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
};

/**
 * Mensajes de error para operaciones de eliminación (DELETE)
 * Requisito 7.3: Error en <500ms para operaciones DELETE
 */
export const OFFLINE_ERROR_DELETE: Record<string, OfflineErrorMessage> = {
  RESERVATION: {
    title: 'No puedes cancelar reservas sin conexión',
    description: 'Conéctate a internet para cancelar',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  LICENSE_PLATE: {
    title: 'No puedes eliminar placas sin conexión',
    description: 'Conéctate a internet para eliminar placas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  PARKING_GROUP: {
    title: 'No puedes eliminar grupos sin conexión',
    description: 'Conéctate a internet para eliminar grupos',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  PARKING_SPOT: {
    title: 'No puedes eliminar plazas sin conexión',
    description: 'Conéctate a internet para eliminar plazas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  USER: {
    title: 'No puedes eliminar usuarios sin conexión',
    description: 'Conéctate a internet para eliminar usuarios',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  BLOCKED_DATE: {
    title: 'No puedes desbloquear fechas sin conexión',
    description: 'Conéctate a internet para gestionar fechas',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
};

/**
 * Mensajes de error para problemas de cache
 * Requisito 7.4: Mensajes deben explicar qué está pasando
 */
export const OFFLINE_ERROR_CACHE: Record<string, OfflineErrorMessage> = {
  NO_CACHE: {
    title: 'No hay datos disponibles offline',
    description: 'Conéctate a internet para cargar los datos',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  CACHE_EXPIRED: {
    title: 'Los datos en caché han expirado',
    description: 'Conéctate a internet para actualizar',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  CACHE_ERROR: {
    title: 'Error al cargar datos guardados',
    description: 'Conéctate a internet para recargar',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  CACHE_FULL: {
    title: 'Almacenamiento local lleno',
    description: 'Algunos datos no se pudieron guardar',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
};

/**
 * Mensajes de advertencia para funcionalidad limitada
 * Requisito 9.4: Advertencia en panel admin offline
 */
export const OFFLINE_WARNING: Record<string, OfflineErrorMessage> = {
  ADMIN_LIMITED: {
    title: 'Funcionalidad limitada sin conexión',
    description: 'Solo puedes ver datos. Conéctate para realizar cambios.',
    status: 'offline',
    duration: 5000, // 5 segundos para advertencias importantes
  },
  READ_ONLY: {
    title: 'Modo solo lectura',
    description: 'Conéctate a internet para realizar cambios',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
  STALE_DATA: {
    title: 'Mostrando datos guardados',
    description: 'Pueden no estar actualizados. Conéctate para refrescar.',
    status: 'offline',
    duration: OFFLINE_TOAST_DURATION,
  },
};

/**
 * Mensajes de éxito para reconexión
 */
export const OFFLINE_SUCCESS = {
  RECONNECTED: {
    title: 'Conexión restaurada',
    description: 'Datos sincronizados correctamente',
  },
  RECONNECTED_PARTIAL: {
    title: 'Conexión restaurada',
    description: 'Algunos datos pueden no estar actualizados',
  },
};

/**
 * Helper para obtener mensaje de error según operación
 * Requisito 7.5: Incluir estado de conectividad actual
 */
export const getOfflineErrorMessage = (
  operation: 'create' | 'update' | 'delete',
  entity: string
): OfflineErrorMessage => {
  const entityUpper = entity.toUpperCase();
  
  switch (operation) {
    case 'create':
      return OFFLINE_ERROR_CREATE[entityUpper] || {
        title: `No puedes crear ${entity} sin conexión`,
        description: 'Conéctate a internet para continuar',
        status: 'offline',
        duration: OFFLINE_TOAST_DURATION,
      };
    case 'update':
      return OFFLINE_ERROR_UPDATE[entityUpper] || {
        title: `No puedes modificar ${entity} sin conexión`,
        description: 'Conéctate a internet para continuar',
        status: 'offline',
        duration: OFFLINE_TOAST_DURATION,
      };
    case 'delete':
      return OFFLINE_ERROR_DELETE[entityUpper] || {
        title: `No puedes eliminar ${entity} sin conexión`,
        description: 'Conéctate a internet para continuar',
        status: 'offline',
        duration: OFFLINE_TOAST_DURATION,
      };
    default:
      return {
        title: 'Operación no disponible sin conexión',
        description: 'Conéctate a internet para continuar',
        status: 'offline',
        duration: OFFLINE_TOAST_DURATION,
      };
  }
};

/**
 * Helper para mostrar toast de error offline
 * Asegura que el mensaje se muestre en <500ms (Requisitos 7.1-7.3)
 */
export const showOfflineError = (
  toast: any,
  message: OfflineErrorMessage
): void => {
  // Usar setTimeout con 0ms para asegurar que se ejecute inmediatamente
  // pero sin bloquear el hilo principal
  setTimeout(() => {
    toast.error(message.title, {
      description: message.description,
      duration: message.duration,
    });
  }, 0);
};

/**
 * Helper para mostrar toast de advertencia offline
 */
export const showOfflineWarning = (
  toast: any,
  message: OfflineErrorMessage
): void => {
  setTimeout(() => {
    toast.warning(message.title, {
      description: message.description,
      duration: message.duration,
    });
  }, 0);
};
