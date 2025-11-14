/**
 * Ejemplos de uso del sistema de mensajes de error offline
 * 
 * Este archivo muestra cómo usar las constantes y helpers
 * para mostrar mensajes de error consistentes en toda la aplicación.
 */

import { toast } from 'sonner';
import {
  OFFLINE_ERROR_CREATE,
  OFFLINE_ERROR_UPDATE,
  OFFLINE_ERROR_DELETE,
  OFFLINE_ERROR_CACHE,
  OFFLINE_WARNING,
  OFFLINE_SUCCESS,
  getOfflineErrorMessage,
  showOfflineError,
  showOfflineWarning,
} from './offlineErrorMessages';

// ============================================================================
// EJEMPLO 1: Uso directo de constantes
// ============================================================================

export const exampleDirectUsage = (isOnline: boolean) => {
  if (!isOnline) {
    // Opción A: Usar constante directamente
    const message = OFFLINE_ERROR_CREATE.RESERVATION;
    toast.error(message.title, {
      description: message.description,
      duration: message.duration,
    });
  }
};

// ============================================================================
// EJEMPLO 2: Uso con helper showOfflineError (RECOMENDADO)
// ============================================================================

export const exampleWithHelper = (isOnline: boolean) => {
  if (!isOnline) {
    // Opción B: Usar helper (asegura <500ms)
    showOfflineError(toast, OFFLINE_ERROR_CREATE.RESERVATION);
  }
};

// ============================================================================
// EJEMPLO 3: Uso en hook de reservas
// ============================================================================

export const exampleInReservationHook = () => {
  const handleReserve = async (date: Date, spotId: string, isOnline: boolean) => {
    // Validar conexión antes de intentar reservar
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_CREATE.RESERVATION);
      return;
    }

    try {
      // ... lógica de reserva
    } catch (error) {
      toast.error('Error al crear reserva');
    }
  };

  const handleCancel = async (reservationId: string, isOnline: boolean) => {
    // Validar conexión antes de cancelar
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_DELETE.RESERVATION);
      return;
    }

    try {
      // ... lógica de cancelación
    } catch (error) {
      toast.error('Error al cancelar reserva');
    }
  };

  return { handleReserve, handleCancel };
};

// ============================================================================
// EJEMPLO 4: Uso en hook de placas
// ============================================================================

export const exampleInLicensePlateHook = () => {
  const handleAddPlate = async (plateNumber: string, isOnline: boolean) => {
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_CREATE.LICENSE_PLATE);
      return;
    }

    try {
      // ... lógica de añadir placa
    } catch (error) {
      toast.error('Error al registrar placa');
    }
  };

  const handleDeletePlate = async (plateId: string, isOnline: boolean) => {
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_DELETE.LICENSE_PLATE);
      return;
    }

    try {
      // ... lógica de eliminar placa
    } catch (error) {
      toast.error('Error al eliminar placa');
    }
  };

  return { handleAddPlate, handleDeletePlate };
};

// ============================================================================
// EJEMPLO 5: Uso en hooks admin
// ============================================================================

export const exampleInAdminHook = () => {
  const createUser = async (userData: any, isOnline: boolean) => {
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_CREATE.USER);
      return;
    }

    try {
      // ... lógica de crear usuario
    } catch (error) {
      toast.error('Error al crear usuario');
    }
  };

  const updateUser = async (userId: string, updates: any, isOnline: boolean) => {
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_UPDATE.USER);
      return;
    }

    try {
      // ... lógica de actualizar usuario
    } catch (error) {
      toast.error('Error al actualizar usuario');
    }
  };

  const deleteUser = async (userId: string, isOnline: boolean) => {
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_DELETE.USER);
      return;
    }

    try {
      // ... lógica de eliminar usuario
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  return { createUser, updateUser, deleteUser };
};

// ============================================================================
// EJEMPLO 6: Manejo de errores de cache
// ============================================================================

export const exampleCacheErrors = async (cacheKey: string) => {
  try {
    const cached = await localStorage.getItem(cacheKey);
    
    if (!cached) {
      // No hay datos en cache
      showOfflineError(toast, OFFLINE_ERROR_CACHE.NO_CACHE);
      return null;
    }

    const data = JSON.parse(cached);
    const isExpired = Date.now() > data.expiresAt;

    if (isExpired) {
      // Cache expirado
      showOfflineError(toast, OFFLINE_ERROR_CACHE.CACHE_EXPIRED);
      return null;
    }

    return data;
  } catch (error) {
    // Error al leer cache
    showOfflineError(toast, OFFLINE_ERROR_CACHE.CACHE_ERROR);
    return null;
  }
};

// ============================================================================
// EJEMPLO 7: Advertencias en panel admin
// ============================================================================

export const exampleAdminWarning = (isOnline: boolean) => {
  if (!isOnline) {
    // Mostrar advertencia al entrar al panel admin offline
    showOfflineWarning(toast, OFFLINE_WARNING.ADMIN_LIMITED);
  }
};

// ============================================================================
// EJEMPLO 8: Uso con getOfflineErrorMessage (dinámico)
// ============================================================================

export const exampleDynamicMessage = (
  operation: 'create' | 'update' | 'delete',
  entity: string,
  isOnline: boolean
) => {
  if (!isOnline) {
    const message = getOfflineErrorMessage(operation, entity);
    showOfflineError(toast, message);
    return;
  }

  // ... continuar con la operación
};

// ============================================================================
// EJEMPLO 9: Mensajes de éxito al reconectar
// ============================================================================

export const exampleReconnectionSuccess = (allDataSynced: boolean) => {
  if (allDataSynced) {
    toast.success(OFFLINE_SUCCESS.RECONNECTED.title, {
      description: OFFLINE_SUCCESS.RECONNECTED.description,
    });
  } else {
    toast.success(OFFLINE_SUCCESS.RECONNECTED_PARTIAL.title, {
      description: OFFLINE_SUCCESS.RECONNECTED_PARTIAL.description,
    });
  }
};

// ============================================================================
// EJEMPLO 10: Mostrar datos desde cache con advertencia
// ============================================================================

export const exampleShowCachedData = (data: any, isOnline: boolean) => {
  if (!isOnline && data) {
    // Mostrar advertencia de que son datos guardados
    showOfflineWarning(toast, OFFLINE_WARNING.STALE_DATA);
  }

  return data;
};

// ============================================================================
// EJEMPLO 11: Check-in offline
// ============================================================================

export const exampleCheckinOffline = (isOnline: boolean) => {
  const handleCheckin = async () => {
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_CREATE.CHECKIN);
      return;
    }

    try {
      // ... lógica de check-in
    } catch (error) {
      toast.error('Error al hacer check-in');
    }
  };

  return { handleCheckin };
};

// ============================================================================
// PATRÓN RECOMENDADO: Validación temprana
// ============================================================================

export const recommendedPattern = () => {
  const performOperation = async (
    isOnline: boolean,
    operation: () => Promise<void>,
    errorMessage: any
  ) => {
    // 1. Validar conexión PRIMERO
    if (!isOnline) {
      showOfflineError(toast, errorMessage);
      return;
    }

    // 2. Ejecutar operación
    try {
      await operation();
      toast.success('Operación exitosa');
    } catch (error) {
      toast.error('Error en la operación');
    }
  };

  return { performOperation };
};

// ============================================================================
// ANTI-PATRÓN: NO hacer esto
// ============================================================================

export const antiPattern = () => {
  const badExample = async (isOnline: boolean) => {
    try {
      // ❌ MAL: Intentar operación sin validar conexión primero
      await fetch('/api/data');
    } catch (error) {
      // ❌ MAL: Validar conexión después del error
      if (!isOnline) {
        toast.error('Sin conexión');
      }
    }
  };

  const goodExample = async (isOnline: boolean) => {
    // ✅ BIEN: Validar conexión ANTES de intentar
    if (!isOnline) {
      showOfflineError(toast, OFFLINE_ERROR_CREATE.RESERVATION);
      return;
    }

    try {
      await fetch('/api/data');
    } catch (error) {
      toast.error('Error en el servidor');
    }
  };

  return { badExample, goodExample };
};
