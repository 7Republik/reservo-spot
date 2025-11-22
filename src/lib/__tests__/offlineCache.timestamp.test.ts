/**
 * Tests para validación de timestamps y antigüedad en offlineCache
 * 
 * Verifica:
 * - Guardado de datos con timestamp
 * - Función loadFromCache() con validación de antigüedad
 * - Formato relativo de timestamps
 * - Advertencias para datos obsoletos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineCache } from '../offlineCache';

describe('OfflineCache - Timestamps y Validación de Antigüedad', () => {
  beforeEach(async () => {
    // Limpiar cache antes de cada test
    await offlineCache.clear();
    await offlineCache.init();
  });

  it('debe guardar datos con timestamp', async () => {
    const testData = { name: 'Test User', email: 'test@example.com' };
    const beforeSave = Date.now();
    
    await offlineCache.set('test_profile', testData);
    
    const timestamp = await offlineCache.getTimestamp('test_profile');
    
    expect(timestamp).not.toBeNull();
    expect(timestamp!.getTime()).toBeGreaterThanOrEqual(beforeSave);
    expect(timestamp!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('debe cargar datos con información de antigüedad', async () => {
    const testData = { name: 'Test User' };
    
    await offlineCache.set('test_data', testData);
    
    const result = await offlineCache.loadFromCache('test_data');
    
    expect(result.data).toEqual(testData);
    expect(result.timestamp).not.toBeNull();
    expect(result.isStale).toBe(false); // Datos recién guardados
    expect(result.ageInHours).toBeLessThan(1);
    expect(result.relativeTime).toContain('hace');
  });

  it('debe detectar datos obsoletos (más de 24 horas)', async () => {
    const testData = { name: 'Old User' };
    
    // Guardar datos
    await offlineCache.set('old_data', testData);
    
    // Simular que pasaron 25 horas modificando el timestamp
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 horas atrás
    
    // Acceder directamente al storage para modificar el timestamp
    // (en producción esto no se haría, es solo para testing)
    if (offlineCache.isUsingFallback()) {
      // @ts-ignore - Acceso privado para testing
      const entry = offlineCache.fallbackMap.get('old_data');
      if (entry) {
        entry.timestamp = oldTimestamp;
      }
    }
    
    const result = await offlineCache.loadFromCache('old_data');
    
    // Si usamos fallback, verificamos que detecta datos obsoletos
    if (offlineCache.isUsingFallback()) {
      expect(result.isStale).toBe(true);
      expect(result.ageInHours).toBeGreaterThan(24);
    }
  });

  it('debe formatear timestamps en formato relativo', async () => {
    const testData = { value: 'test' };
    
    await offlineCache.set('recent_data', testData);
    
    // Esperar un poco para que el tiempo relativo sea medible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await offlineCache.loadFromCache('recent_data');
    
    expect(result.relativeTime).toMatch(/hace (unos segundos|1 minuto|[0-9]+ minutos)/);
  });

  it('debe retornar null para datos inexistentes', async () => {
    const result = await offlineCache.loadFromCache('non_existent_key');
    
    expect(result.data).toBeNull();
    expect(result.timestamp).toBeNull();
    expect(result.isStale).toBe(false);
    expect(result.ageInHours).toBe(0);
    expect(result.relativeTime).toBe('');
  });

  it('debe eliminar datos muy antiguos (más de 7 días)', async () => {
    const testData = { name: 'Very Old User' };
    
    await offlineCache.set('very_old_data', testData);
    
    // Simular que pasaron 8 días
    const veryOldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000);
    
    if (offlineCache.isUsingFallback()) {
      // @ts-ignore - Acceso privado para testing
      const entry = offlineCache.fallbackMap.get('very_old_data');
      if (entry) {
        entry.timestamp = veryOldTimestamp;
      }
      
      const result = await offlineCache.loadFromCache('very_old_data');
      
      // Datos muy antiguos deben ser eliminados
      expect(result.data).toBeNull();
      
      // Verificar que fueron eliminados del cache
      const dataAfterLoad = await offlineCache.get('very_old_data');
      expect(dataAfterLoad).toBeNull();
    }
  });

  it('debe mantener compatibilidad con get() existente', async () => {
    const testData = { name: 'Test User' };
    
    await offlineCache.set('compat_test', testData);
    
    // get() debe seguir funcionando
    const dataFromGet = await offlineCache.get('compat_test');
    expect(dataFromGet).toEqual(testData);
    
    // loadFromCache() debe retornar los mismos datos con info adicional
    const dataFromLoad = await offlineCache.loadFromCache('compat_test');
    expect(dataFromLoad.data).toEqual(testData);
  });
});
