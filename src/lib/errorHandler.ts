/**
 * Error Handler Utility
 * 
 * Proporciona funciones para manejo robusto de errores en hooks y componentes.
 * Convierte errores de red en estados manejables sin exponer detalles técnicos al usuario.
 * 
 * Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */

import { toast } from "sonner";

/**
 * Tipo de resultado de operación con manejo de errores
 */
export interface OperationResult<T> {
  data: T;
  error: null;
  isEmpty: boolean;
}

export interface OperationError {
  data: null;
  error: Error;
  isEmpty: boolean;
}

export type SafeResult<T> = OperationResult<T> | OperationError;

/**
 * Opciones para el manejo de errores
 */
export interface ErrorHandlerOptions {
  /** Mostrar toast de error al usuario */
  showToast?: boolean;
  /** Mensaje personalizado para el toast */
  toastMessage?: string;
  /** Registrar error en console.error */
  logError?: boolean;
  /** Contexto adicional para logging */
  context?: string;
}

/**
 * Wrapper seguro para operaciones asíncronas con manejo de errores
 * 
 * Intercepta todos los errores y los convierte en estados manejables.
 * Nunca retorna null o undefined, siempre retorna un objeto con data o error.
 * 
 * @param operation - Función asíncrona a ejecutar
 * @param defaultValue - Valor por defecto si hay error (array vacío, objeto vacío, etc.)
 * @param options - Opciones de manejo de errores
 * @returns Resultado con data o error, nunca null
 * 
 * @example
 * ```typescript
 * const result = await safeAsync(
 *   () => supabase.from('table').select('*'),
 *   [],
 *   { showToast: true, context: 'loadData' }
 * );
 * 
 * if (result.error) {
 *   // Manejar error
 *   return;
 * }
 * 
 * // Usar data (siempre array, nunca null)
 * setData(result.data);
 * ```
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  defaultValue: T,
  options: ErrorHandlerOptions = {}
): Promise<SafeResult<T>> {
  const {
    showToast = false,
    toastMessage = "Error al cargar datos",
    logError = true,
    context = "unknown",
  } = options;

  try {
    const data = await operation();
    
    // Verificar si el resultado está vacío
    const isEmpty = Array.isArray(data) 
      ? data.length === 0 
      : data === null || data === undefined;

    return {
      data: data ?? defaultValue,
      error: null,
      isEmpty,
    };
  } catch (error) {
    // Registrar error en console sin mostrarlo al usuario
    if (logError) {
      console.error(`[${context}] Error:`, error);
    }

    // Mostrar mensaje amigable al usuario
    if (showToast) {
      toast.error(toastMessage);
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));

    return {
      data: null,
      error: errorObj,
      isEmpty: true,
    };
  }
}

/**
 * Wrapper para operaciones de Supabase con manejo de errores específico
 * 
 * Maneja errores comunes de Supabase y proporciona mensajes amigables.
 * 
 * @param operation - Operación de Supabase a ejecutar
 * @param defaultValue - Valor por defecto si hay error
 * @param options - Opciones de manejo de errores
 * @returns Resultado con data o error
 * 
 * @example
 * ```typescript
 * const result = await safeSupabaseQuery(
 *   () => supabase.from('profiles').select('*').eq('id', userId).single(),
 *   null,
 *   { showToast: true, context: 'loadProfile' }
 * );
 * ```
 */
export async function safeSupabaseQuery<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  defaultValue: T,
  options: ErrorHandlerOptions = {}
): Promise<SafeResult<T>> {
  const {
    showToast = false,
    toastMessage,
    logError = true,
    context = "supabase",
  } = options;

  try {
    const { data, error } = await operation();

    if (error) {
      // Registrar error técnico
      if (logError) {
        console.error(`[${context}] Supabase error:`, error);
      }

      // Mensaje amigable según el tipo de error
      let friendlyMessage = toastMessage || "Error al cargar datos";

      if (error.code === '23505') {
        friendlyMessage = "El registro ya existe";
      } else if (error.code === '23503') {
        friendlyMessage = "Referencia inválida";
      } else if (error.code === '42501') {
        friendlyMessage = "No tienes permisos para esta acción";
      } else if (error.code === 'PGRST116') {
        friendlyMessage = "No se encontraron datos";
      }

      if (showToast) {
        toast.error(friendlyMessage);
      }

      return {
        data: null,
        error: new Error(friendlyMessage),
        isEmpty: true,
      };
    }

    const isEmpty = Array.isArray(data) 
      ? data.length === 0 
      : data === null || data === undefined;

    return {
      data: data ?? defaultValue,
      error: null,
      isEmpty,
    };
  } catch (error) {
    if (logError) {
      console.error(`[${context}] Unexpected error:`, error);
    }

    if (showToast) {
      toast.error(toastMessage || "Error inesperado");
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));

    return {
      data: null,
      error: errorObj,
      isEmpty: true,
    };
  }
}

/**
 * Detecta si un error es de red (sin conexión)
 * 
 * @param error - Error a verificar
 * @returns true si es error de red
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError'
  );
}

/**
 * Convierte errores de red en estados manejables
 * 
 * @param error - Error a convertir
 * @returns Estado manejable (loading, error, empty)
 */
export function convertNetworkError(error: Error): {
  state: 'loading' | 'error' | 'empty';
  message: string;
} {
  if (isNetworkError(error)) {
    return {
      state: 'error',
      message: 'Sin conexión a internet',
    };
  }

  return {
    state: 'error',
    message: 'Error al cargar datos',
  };
}

/**
 * Maneja errores de fetch con fallback a cache
 * 
 * @param fetchFn - Función de fetch a ejecutar
 * @param cacheFn - Función para obtener datos del cache
 * @param defaultValue - Valor por defecto si todo falla
 * @param options - Opciones de manejo de errores
 * @returns Resultado con data o error
 * 
 * @example
 * ```typescript
 * const result = await safeWithCache(
 *   () => supabase.from('table').select('*'),
 *   () => offlineCache.get('table_data'),
 *   [],
 *   { showToast: true, context: 'loadTable' }
 * );
 * ```
 */
export async function safeWithCache<T>(
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  cacheFn: () => Promise<T | null>,
  defaultValue: T,
  options: ErrorHandlerOptions = {}
): Promise<SafeResult<T>> {
  const { logError = true, context = "cache" } = options;

  try {
    // Intentar fetch primero
    const { data, error } = await fetchFn();

    if (error) {
      if (logError) {
        console.error(`[${context}] Fetch error, trying cache:`, error);
      }

      // Fallback a cache
      const cached = await cacheFn();
      if (cached !== null && cached !== undefined) {
        toast.warning("Mostrando datos en caché");
        return {
          data: cached,
          error: null,
          isEmpty: Array.isArray(cached) ? cached.length === 0 : false,
        };
      }

      // Sin cache disponible
      return {
        data: null,
        error: new Error("Datos no disponibles"),
        isEmpty: true,
      };
    }

    const isEmpty = Array.isArray(data) 
      ? data.length === 0 
      : data === null || data === undefined;

    return {
      data: data ?? defaultValue,
      error: null,
      isEmpty,
    };
  } catch (error) {
    if (logError) {
      console.error(`[${context}] Unexpected error:`, error);
    }

    // Intentar cache como último recurso
    try {
      const cached = await cacheFn();
      if (cached !== null && cached !== undefined) {
        toast.warning("Mostrando datos en caché");
        return {
          data: cached,
          error: null,
          isEmpty: Array.isArray(cached) ? cached.length === 0 : false,
        };
      }
    } catch (cacheError) {
      if (logError) {
        console.error(`[${context}] Cache error:`, cacheError);
      }
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));

    return {
      data: null,
      error: errorObj,
      isEmpty: true,
    };
  }
}

/**
 * Asegura que un valor nunca sea null o undefined
 * 
 * @param value - Valor a verificar
 * @param defaultValue - Valor por defecto
 * @returns Valor o defaultValue, nunca null/undefined
 */
export function ensureValue<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Asegura que un array nunca sea null o undefined
 * 
 * @param value - Array a verificar
 * @returns Array o array vacío, nunca null/undefined
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return value ?? [];
}

/**
 * Asegura que un objeto nunca sea null o undefined
 * 
 * @param value - Objeto a verificar
 * @param defaultValue - Objeto por defecto
 * @returns Objeto o defaultValue, nunca null/undefined
 */
export function ensureObject<T extends object>(
  value: T | null | undefined,
  defaultValue: T
): T {
  return value ?? defaultValue;
}
