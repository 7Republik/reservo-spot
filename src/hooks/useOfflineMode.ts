import { useState, useEffect, useRef, useCallback } from 'react';
import { connectionMonitor } from '@/lib/connectionMonitor';

/**
 * Interface para el retorno del hook useOfflineMode
 */
export interface UseOfflineModeReturn {
  isOnline: boolean;           // Estado actual de conexión
  isOffline: boolean;          // Inverso de isOnline (conveniencia)
  lastSyncTime: Date | null;   // Última sincronización exitosa
  checkConnection: () => Promise<boolean>; // Verificación manual
  retryCount: number;          // Número de reintentos actuales
  consecutiveFailures: number; // Fallos consecutivos de conectividad
  isSyncing: boolean;          // Indica si se está sincronizando
}

/**
 * Hook personalizado para gestionar el modo offline
 * 
 * Integra ConnectionMonitorService para detectar cambios de conectividad
 * y proporciona una API consistente para componentes.
 * 
 * Características:
 * - Detección automática de cambios de conexión
 * - Debounce de 5s para evitar parpadeos
 * - Validación de servidor antes de confirmar online
 * - 3 fallos consecutivos para entrar en modo offline
 * - 2 reintentos automáticos para requests
 * - Sincronización automática al recuperar conexión (3s)
 * 
 * @returns {UseOfflineModeReturn} Estado y funciones de conectividad
 * 
 * @example
 * ```tsx
 * const { isOnline, isOffline, lastSyncTime } = useOfflineMode();
 * 
 * if (isOffline) {
 *   return <OfflineMessage lastSync={lastSyncTime} />;
 * }
 * ```
 */
export const useOfflineMode = (): UseOfflineModeReturn => {
  // Estado de conexión
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);

  // Referencia para el timer de sincronización
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Flag para saber si el monitor ya está iniciado
  const isMonitorStarted = useRef<boolean>(false);

  // Flag para indicar si se está sincronizando
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  /**
   * Sincroniza datos críticos desde el servidor
   * Esta función se llama automáticamente al recuperar la conexión
   */
  const syncCriticalData = useCallback(async () => {
    if (isSyncing) {
      console.log('[useOfflineMode] Sincronización ya en progreso, omitiendo...');
      return;
    }

    setIsSyncing(true);
    console.log('[useOfflineMode] Iniciando sincronización de datos críticos...');

    try {
      // Emitir evento personalizado para que los hooks se suscriban
      // Los hooks individuales manejarán su propia sincronización
      const syncEvent = new CustomEvent('offline-mode-sync', {
        detail: { timestamp: new Date() }
      });
      window.dispatchEvent(syncEvent);

      // Actualizar timestamp de última sincronización
      setLastSyncTime(new Date());
      console.log('[useOfflineMode] Sincronización completada exitosamente');
    } catch (error) {
      console.error('[useOfflineMode] Error durante sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  /**
   * Callback que se ejecuta cuando cambia el estado de conexión
   */
  const handleConnectionChange = useCallback((online: boolean) => {
    const wasOffline = !isOnline;
    setIsOnline(online);
    
    // Actualizar contadores desde el servicio
    const status = connectionMonitor.getStatus();
    setConsecutiveFailures(status.consecutiveFailures);

    // Si recuperamos la conexión (transición offline -> online)
    if (online && wasOffline) {
      console.log('[useOfflineMode] Conexión recuperada, programando sincronización...');
      
      // Limpiar timer anterior si existe
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      // Programar sincronización en 3 segundos (Requisito 3.3)
      syncTimerRef.current = setTimeout(() => {
        syncCriticalData();
      }, 3000);

      // Emitir evento de reconexión inmediatamente para re-habilitar controles (Requisito 5.5)
      // Los controles deben re-habilitarse en <2s, antes de la sincronización
      const reconnectEvent = new CustomEvent('offline-mode-reconnect', {
        detail: { timestamp: new Date() }
      });
      window.dispatchEvent(reconnectEvent);
      console.log('[useOfflineMode] Evento de reconexión emitido para re-habilitar controles');
    }
  }, [isOnline, syncCriticalData]);

  /**
   * Función para verificar conexión manualmente
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const isConnected = await connectionMonitor.check();
      setIsOnline(isConnected);
      
      if (isConnected) {
        setLastSyncTime(new Date());
      }
      
      return isConnected;
    } catch (error) {
      console.error('[useOfflineMode] Error checking connection:', error);
      return false;
    }
  }, []);

  /**
   * Inicializar y limpiar el monitor de conexión
   */
  useEffect(() => {
    // Solo iniciar el monitor una vez (singleton)
    if (!isMonitorStarted.current) {
      // Iniciar monitoreo con callback
      connectionMonitor.start(handleConnectionChange);
      isMonitorStarted.current = true;

      // Establecer última sincronización inicial si estamos online
      if (navigator.onLine) {
        setLastSyncTime(new Date());
      }

      console.log('[useOfflineMode] Monitor iniciado');
    }

    // Cleanup: detener monitor al desmontar
    return () => {
      // Solo detener si este hook fue el que lo inició
      if (isMonitorStarted.current) {
        connectionMonitor.stop();
        isMonitorStarted.current = false;
        console.log('[useOfflineMode] Monitor detenido');
      }

      // Limpiar timer de sincronización
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [handleConnectionChange]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastSyncTime,
    checkConnection,
    retryCount,
    consecutiveFailures,
    isSyncing,
  };
};
