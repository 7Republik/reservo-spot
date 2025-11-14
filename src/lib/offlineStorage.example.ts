/**
 * Ejemplos de uso del sistema de limpieza automática de cache
 * 
 * Este archivo documenta cómo funciona la limpieza automática del cache offline
 * y proporciona ejemplos de uso avanzado.
 */

import { getOfflineStorage, STORAGE_LIMITS } from './offlineStorage';

// ============================================================================
// EJEMPLO 1: Limpieza automática al iniciar la aplicación
// ============================================================================

/**
 * La limpieza automática se ejecuta al iniciar la aplicación mediante
 * el hook useOfflineCleanup en App.tsx
 * 
 * Proceso:
 * 1. Elimina datos expirados (TTL vencido)
 * 2. Verifica el tamaño total del cache
 * 3. Si excede el límite, aplica estrategia FIFO
 */
async function exampleStartupCleanup() {
  const storage = getOfflineStorage();
  
  // Esto se ejecuta automáticamente al iniciar la app
  await storage.cleanupOnStartup();
  
  // Logs esperados en consola:
  // [OfflineStorage] Iniciando limpieza automática al arrancar...
  // [OfflineStorage] Datos expirados eliminados
  // [OfflineStorage] Tamaño actual del cache: 8.45 MB
  // [OfflineStorage] Limpieza automática completada
}

// ============================================================================
// EJEMPLO 2: Limpieza al cerrar sesión
// ============================================================================

/**
 * Al cerrar sesión, todo el cache se limpia automáticamente
 * para proteger la privacidad del usuario
 * 
 * Esto se maneja automáticamente mediante el listener de auth
 * en useOfflineCleanup
 */
async function exampleLogoutCleanup() {
  const storage = getOfflineStorage();
  
  // Esto se ejecuta automáticamente al hacer logout
  await storage.cleanupOnLogout();
  
  // Logs esperados en consola:
  // [useOfflineCleanup] Usuario cerró sesión, limpiando cache...
  // [OfflineStorage] Limpiando cache al cerrar sesión...
  // [OfflineStorage] Cache limpiado completamente
}

// ============================================================================
// EJEMPLO 3: Verificar si se está cerca del límite de almacenamiento
// ============================================================================

/**
 * Puedes verificar si el cache está cerca del límite (80%)
 * para mostrar advertencias al usuario
 */
async function exampleCheckStorageLimit() {
  const storage = getOfflineStorage();
  
  const isNearLimit = await storage.isNearStorageLimit();
  
  if (isNearLimit) {
    console.warn('⚠️ El cache está cerca del límite de almacenamiento');
    // Mostrar toast al usuario
    // toast.warning('Cache casi lleno', {
    //   description: 'Algunos datos antiguos serán eliminados automáticamente'
    // });
  }
}

// ============================================================================
// EJEMPLO 4: Limpieza manual de datos expirados
// ============================================================================

/**
 * Aunque la limpieza es automática, puedes ejecutarla manualmente
 * si necesitas liberar espacio inmediatamente
 */
async function exampleManualCleanup() {
  const storage = getOfflineStorage();
  
  // Limpiar solo datos expirados
  await storage.cleanup();
  
  console.log('✅ Datos expirados eliminados');
}

// ============================================================================
// EJEMPLO 5: Aplicar límite de almacenamiento manualmente
// ============================================================================

/**
 * Puedes aplicar el límite de almacenamiento manualmente
 * si detectas que el cache está creciendo demasiado
 */
async function exampleEnforceLimit() {
  const storage = getOfflineStorage();
  
  // Obtener tamaño actual
  const currentSize = await storage.getSize();
  console.log(`Tamaño actual: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Aplicar límite (elimina datos más antiguos primero - FIFO)
  if (currentSize > STORAGE_LIMITS.TOTAL) {
    await storage.enforceStorageLimit(STORAGE_LIMITS.TOTAL);
    
    const newSize = await storage.getSize();
    console.log(`Nuevo tamaño: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  }
}

// ============================================================================
// EJEMPLO 6: Limpiar cache completo manualmente
// ============================================================================

/**
 * En casos excepcionales, puedes limpiar todo el cache manualmente
 * (por ejemplo, si el usuario reporta problemas con datos corruptos)
 */
async function exampleClearAll() {
  const storage = getOfflineStorage();
  
  // Advertencia: esto elimina TODOS los datos cacheados
  await storage.clear();
  
  console.log('🗑️ Cache completamente limpiado');
}

// ============================================================================
// EJEMPLO 7: Monitorear el tamaño del cache
// ============================================================================

/**
 * Puedes monitorear el tamaño del cache para debugging
 * o para mostrar información al usuario
 */
async function exampleMonitorSize() {
  const storage = getOfflineStorage();
  
  const size = await storage.getSize();
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  const limitMB = (STORAGE_LIMITS.TOTAL / 1024 / 1024).toFixed(2);
  const percentage = ((size / STORAGE_LIMITS.TOTAL) * 100).toFixed(1);
  
  console.log(`📊 Cache: ${sizeMB} MB / ${limitMB} MB (${percentage}%)`);
  
  if (size > STORAGE_LIMITS.TOTAL * STORAGE_LIMITS.WARNING_THRESHOLD) {
    console.warn('⚠️ Cache cerca del límite');
  }
}

// ============================================================================
// EJEMPLO 8: Estrategia de cache con TTL personalizado
// ============================================================================

/**
 * Puedes guardar datos con diferentes TTL según su importancia
 * Los datos con TTL más corto se limpiarán antes
 */
async function exampleCustomTTL() {
  const storage = getOfflineStorage();
  
  // Datos críticos: 7 días (default)
  await storage.set('reservations_user123', { /* ... */ }, {
    dataType: 'reservations',
    userId: 'user123'
    // ttl no especificado = 7 días
  });
  
  // Datos temporales: 1 día
  await storage.set('temp_spots_groupA', { /* ... */ }, {
    dataType: 'spots',
    userId: 'user123',
    ttl: 24 * 60 * 60 * 1000 // 1 día en milisegundos
  });
  
  // Datos muy temporales: 1 hora
  await storage.set('temp_search_results', { /* ... */ }, {
    dataType: 'search',
    userId: 'user123',
    ttl: 60 * 60 * 1000 // 1 hora en milisegundos
  });
}

// ============================================================================
// LÍMITES DE ALMACENAMIENTO
// ============================================================================

/**
 * Límites configurados en el sistema:
 * 
 * - USER_DATA: 10 MB (datos de usuario normal)
 * - ADMIN_DATA: 5 MB (datos de panel admin)
 * - TOTAL: 15 MB (límite total del cache)
 * - WARNING_THRESHOLD: 80% (umbral de advertencia)
 * 
 * Cuando se alcanza el límite total, se aplica estrategia FIFO:
 * - Los datos más antiguos se eliminan primero
 * - Se elimina hasta volver al límite configurado
 * - Los datos con TTL más corto se priorizan para eliminación
 */

// ============================================================================
// FLUJO DE LIMPIEZA AUTOMÁTICA
// ============================================================================

/**
 * Flujo completo de limpieza automática:
 * 
 * 1. AL INICIAR LA APP (useOfflineCleanup):
 *    - Se ejecuta cleanupOnStartup()
 *    - Elimina datos expirados
 *    - Verifica límites de almacenamiento
 *    - Aplica FIFO si es necesario
 * 
 * 2. AL CERRAR SESIÓN (listener de auth):
 *    - Se ejecuta cleanupOnLogout()
 *    - Elimina TODO el cache
 *    - Protege privacidad del usuario
 * 
 * 3. AL GUARDAR DATOS (automático):
 *    - Si se alcanza el límite durante set()
 *    - Se puede aplicar enforceStorageLimit()
 *    - Elimina datos antiguos (FIFO)
 * 
 * 4. AL LEER DATOS (automático):
 *    - Si el dato ha expirado (TTL)
 *    - Se elimina automáticamente
 *    - Retorna null
 */

export {
  exampleStartupCleanup,
  exampleLogoutCleanup,
  exampleCheckStorageLimit,
  exampleManualCleanup,
  exampleEnforceLimit,
  exampleClearAll,
  exampleMonitorSize,
  exampleCustomTTL,
};
