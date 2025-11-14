import { useEffect, useCallback } from 'react';

/**
 * Hook de utilidad para sincronizar datos cuando se recupera la conexión
 * 
 * Este hook escucha los eventos personalizados emitidos por useOfflineMode
 * y ejecuta callbacks cuando:
 * - Se recupera la conexión (para re-habilitar controles)
 * - Se inicia la sincronización (para recargar datos)
 * 
 * @param onReconnect Callback a ejecutar cuando se recupera la conexión (inmediato)
 * @param onSync Callback a ejecutar cuando se inicia la sincronización (después de 3s)
 * 
 * @example
 * ```tsx
 * const loadData = async (forceReload = false) => {
 *   // Lógica de carga...
 * };
 * 
 * useOfflineSync(
 *   () => {
 *     // Re-habilitar controles inmediatamente
 *     console.log('Controles re-habilitados');
 *   },
 *   () => {
 *     // Sincronizar datos después de 3s
 *     loadData(true);
 *   }
 * );
 * ```
 */
export const useOfflineSync = (
  onReconnect?: () => void,
  onSync?: () => void
) => {
  const handleReconnect = useCallback(() => {
    if (onReconnect) {
      console.log('[useOfflineSync] Evento de reconexión recibido');
      onReconnect();
    }
  }, [onReconnect]);

  const handleSync = useCallback(() => {
    if (onSync) {
      console.log('[useOfflineSync] Evento de sincronización recibido');
      onSync();
    }
  }, [onSync]);

  useEffect(() => {
    // Escuchar evento de reconexión (inmediato, <2s)
    window.addEventListener('offline-mode-reconnect', handleReconnect);

    // Escuchar evento de sincronización (después de 3s)
    window.addEventListener('offline-mode-sync', handleSync);

    return () => {
      window.removeEventListener('offline-mode-reconnect', handleReconnect);
      window.removeEventListener('offline-mode-sync', handleSync);
    };
  }, [handleReconnect, handleSync]);
};
