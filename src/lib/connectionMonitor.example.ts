/**
 * Ejemplos de uso del ConnectionMonitorService
 * 
 * Este archivo muestra cómo usar el servicio de monitoreo de conexión
 * en diferentes escenarios.
 */

import { connectionMonitor } from './connectionMonitor';

// ============================================================================
// Ejemplo 1: Uso básico - Iniciar y detener monitoreo
// ============================================================================

export function basicUsageExample() {
  // Iniciar monitoreo con callback
  connectionMonitor.start((isOnline) => {
    if (isOnline) {
      console.log('✅ Conexión restaurada');
      // Aquí puedes sincronizar datos, re-habilitar controles, etc.
    } else {
      console.log('❌ Sin conexión');
      // Aquí puedes mostrar indicador offline, deshabilitar controles, etc.
    }
  });

  // Detener monitoreo cuando ya no se necesite
  // (por ejemplo, al desmontar el componente)
  return () => {
    connectionMonitor.stop();
  };
}

// ============================================================================
// Ejemplo 2: Verificación manual de conexión
// ============================================================================

export async function manualCheckExample() {
  const isConnected = await connectionMonitor.check();
  
  if (isConnected) {
    console.log('Hay conexión al servidor');
  } else {
    console.log('No hay conexión al servidor');
  }
}

// ============================================================================
// Ejemplo 3: Obtener estado actual
// ============================================================================

export function getStatusExample() {
  const status = connectionMonitor.getStatus();
  
  console.log('Estado de conexión:', {
    isOnline: status.isOnline,
    lastCheck: status.lastCheck,
    consecutiveFailures: status.consecutiveFailures,
    nextCheckIn: `${status.nextCheckIn / 1000}s`
  });
}

// ============================================================================
// Ejemplo 4: Request con reintentos automáticos
// ============================================================================

export async function retryRequestExample() {
  try {
    // Ejecutar request con 2 reintentos automáticos
    const result = await connectionMonitor.retryRequest(async () => {
      const response = await fetch('/api/some-endpoint');
      if (!response.ok) {
        throw new Error('Request failed');
      }
      return response.json();
    });
    
    console.log('Request exitoso:', result);
  } catch (error) {
    console.error('Request falló después de reintentos:', error);
  }
}

// ============================================================================
// Ejemplo 5: Uso en React Hook
// ============================================================================

import { useEffect, useState } from 'react';

export function useConnectionMonitorExample() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    // Iniciar monitoreo
    connectionMonitor.start((online) => {
      setIsOnline(online);
      const status = connectionMonitor.getStatus();
      setLastCheck(status.lastCheck);
    });

    // Cleanup al desmontar
    return () => {
      connectionMonitor.stop();
    };
  }, []);

  return { isOnline, lastCheck };
}

// ============================================================================
// Ejemplo 6: Integración con operaciones de base de datos
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

export async function databaseOperationWithRetry() {
  try {
    // Ejecutar query con reintentos automáticos
    const { data, error } = await connectionMonitor.retryRequest(async () => {
      const result = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', 'some-user-id');
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    });

    if (error) {
      console.error('Error después de reintentos:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Operación falló completamente:', error);
    return null;
  }
}

// ============================================================================
// Ejemplo 7: Manejo de estados de conexión en UI
// ============================================================================

export function uiStateManagementExample() {
  let isOnline = true;

  connectionMonitor.start((online) => {
    isOnline = online;
    
    if (online) {
      // Conexión restaurada
      // - Ocultar indicador offline
      // - Re-habilitar botones de escritura
      // - Sincronizar datos pendientes
      console.log('UI: Habilitando controles de escritura');
    } else {
      // Sin conexión
      // - Mostrar indicador offline
      // - Deshabilitar botones de escritura
      // - Mostrar datos desde cache
      console.log('UI: Deshabilitando controles de escritura');
    }
  });
}

// ============================================================================
// Ejemplo 8: Sincronización al recuperar conexión
// ============================================================================

export function syncOnReconnectExample() {
  connectionMonitor.start(async (online) => {
    if (online) {
      console.log('Conexión restaurada - Iniciando sincronización...');
      
      // Esperar 3 segundos antes de sincronizar (según requisito 3.3)
      setTimeout(async () => {
        try {
          // Sincronizar datos críticos
          await syncCriticalData();
          console.log('✅ Sincronización completada');
        } catch (error) {
          console.error('❌ Error en sincronización:', error);
        }
      }, 3000);
    }
  });
}

async function syncCriticalData() {
  // Implementar lógica de sincronización
  // Por ejemplo: refrescar reservas, placas, grupos, etc.
  console.log('Sincronizando datos críticos...');
}
