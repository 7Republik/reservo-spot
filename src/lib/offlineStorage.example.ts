/**
 * Ejemplos de uso de OfflineStorageService
 * 
 * Este archivo muestra cómo usar el servicio de almacenamiento offline
 * en diferentes escenarios de la aplicación.
 */

import { getOfflineStorage } from './offlineStorage';

// ============================================================================
// Ejemplo 1: Cachear reservas de usuario
// ============================================================================
export async function cacheUserReservations(userId: string, reservations: any[]) {
  const storage = getOfflineStorage();
  
  const cacheKey = `reservations_${userId}_${new Date().toISOString().slice(0, 7)}`;
  
  await storage.set(cacheKey, reservations, {
    dataType: 'reservations',
    userId: userId,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 días
  });
  
  // Registrar sincronización exitosa
  await storage.recordSync(cacheKey);
}

// ============================================================================
// Ejemplo 2: Recuperar reservas desde cache
// ============================================================================
export async function loadCachedReservations(userId: string): Promise<any[] | null> {
  const storage = getOfflineStorage();
  
  const cacheKey = `reservations_${userId}_${new Date().toISOString().slice(0, 7)}`;
  
  const cached = await storage.get<any[]>(cacheKey);
  
  if (cached) {
    // Obtener última sincronización para mostrar al usuario
    const lastSync = await storage.getLastSync(cacheKey);
    console.log('Datos cargados desde cache. Última sincronización:', lastSync);
  }
  
  return cached;
}

// ============================================================================
// Ejemplo 3: Cachear plazas de parking
// ============================================================================
export async function cacheParkingSpots(groupId: string, date: string, spots: any[]) {
  const storage = getOfflineStorage();
  
  const cacheKey = `spots_${groupId}_${date}`;
  
  await storage.set(cacheKey, spots, {
    dataType: 'spots',
    metadata: { groupId, date },
  });
}

// ============================================================================
// Ejemplo 4: Verificar si hay datos en cache
// ============================================================================
export async function hasCachedData(key: string): Promise<boolean> {
  const storage = getOfflineStorage();
  return await storage.has(key);
}

// ============================================================================
// Ejemplo 5: Limpiar cache al cerrar sesión
// ============================================================================
export async function clearCacheOnLogout() {
  const storage = getOfflineStorage();
  await storage.clear();
  console.log('Cache limpiado completamente');
}

// ============================================================================
// Ejemplo 6: Limpieza automática al iniciar la app
// ============================================================================
export async function initializeApp() {
  const storage = getOfflineStorage();
  
  // Inicializar base de datos
  await storage.init();
  
  // Limpiar datos expirados
  await storage.cleanup();
  
  console.log('App inicializada y cache limpiado');
}

// ============================================================================
// Ejemplo 7: Verificar tamaño del cache
// ============================================================================
export async function checkCacheSize() {
  const storage = getOfflineStorage();
  
  const sizeInBytes = await storage.getSize();
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
  
  console.log(`Tamaño del cache: ${sizeInMB} MB`);
  
  return sizeInBytes;
}

// ============================================================================
// Ejemplo 8: Cachear datos de admin (con límite diferente)
// ============================================================================
export async function cacheAdminData(dataType: string, data: any) {
  const storage = getOfflineStorage();
  
  const cacheKey = `admin_${dataType}`;
  
  await storage.set(cacheKey, data, {
    dataType: `admin_${dataType}`,
    userId: 'admin',
    ttl: 7 * 24 * 60 * 60 * 1000,
  });
  
  // Verificar que no excedemos el límite de 5 MB para admin
  const size = await storage.getSize();
  const adminLimit = 5 * 1024 * 1024; // 5 MB
  
  if (size > adminLimit) {
    console.warn('Cache de admin excede el límite de 5 MB');
    await storage.enforceStorageLimit(adminLimit);
  }
}

// ============================================================================
// Ejemplo 9: Patrón de uso en un hook
// ============================================================================
export async function loadDataWithCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  isOnline: boolean
): Promise<T | null> {
  const storage = getOfflineStorage();
  
  if (!isOnline) {
    // Modo offline: solo cache
    const cached = await storage.get<T>(cacheKey);
    if (!cached) {
      throw new Error('No hay datos disponibles offline');
    }
    return cached;
  }
  
  try {
    // Modo online: intentar servidor
    const data = await fetchFn();
    
    // Cachear datos
    await storage.set(cacheKey, data);
    await storage.recordSync(cacheKey);
    
    return data;
  } catch (error) {
    // Error en servidor: fallback a cache
    console.error('Error cargando desde servidor, usando cache:', error);
    const cached = await storage.get<T>(cacheKey);
    return cached;
  }
}
