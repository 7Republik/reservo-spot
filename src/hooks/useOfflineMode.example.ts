/**
 * Ejemplos de uso del hook useOfflineMode
 * 
 * Este archivo muestra diferentes patrones de uso del hook
 * para gestionar el modo offline en componentes.
 */

import { useOfflineMode } from './useOfflineMode';

/**
 * Ejemplo 1: Uso básico en un componente
 * 
 * Muestra cómo usar el hook para deshabilitar acciones
 * cuando no hay conexión.
 * 
 * @example
 * ```tsx
 * const { isOnline, isOffline, lastSyncTime } = useOfflineMode();
 * 
 * const handleSave = async () => {
 *   if (isOffline) {
 *     toast.error('No puedes guardar sin conexión', {
 *       description: 'Conéctate a internet para guardar cambios'
 *     });
 *     return;
 *   }
 *   // Lógica de guardado...
 * };
 * 
 * return (
 *   <div>
 *     {isOffline && (
 *       <div className="bg-destructive text-destructive-foreground p-4">
 *         Sin conexión - Última sincronización: {lastSyncTime?.toLocaleString()}
 *       </div>
 *     )}
 *     <button onClick={handleSave} disabled={isOffline}>
 *       Guardar
 *     </button>
 *   </div>
 * );
 * ```
 */
export const basicUsageExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};

/**
 * Ejemplo 2: Verificación manual de conexión
 * 
 * Muestra cómo usar checkConnection para verificar
 * la conexión antes de una operación crítica.
 * 
 * @example
 * ```tsx
 * const { checkConnection } = useOfflineMode();
 * 
 * const handleCriticalOperation = async () => {
 *   // Verificar conexión antes de proceder
 *   const isConnected = await checkConnection();
 *   
 *   if (!isConnected) {
 *     toast.error('No hay conexión', {
 *       description: 'Verifica tu conexión a internet'
 *     });
 *     return;
 *   }
 *   // Proceder con operación crítica...
 * };
 * 
 * return (
 *   <button onClick={handleCriticalOperation}>
 *     Operación Crítica
 *   </button>
 * );
 * ```
 */
export const manualCheckExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};

/**
 * Ejemplo 3: Mostrar información de debugging
 * 
 * Muestra cómo usar los contadores de reintentos
 * y fallos consecutivos para debugging.
 * 
 * @example
 * ```tsx
 * const { 
 *   isOnline, 
 *   consecutiveFailures, 
 *   retryCount,
 *   lastSyncTime 
 * } = useOfflineMode();
 * 
 * return (
 *   <div className="p-4 border rounded">
 *     <h3 className="font-bold mb-2">Estado de Conexión</h3>
 *     <ul className="space-y-1 text-sm">
 *       <li>Estado: {isOnline ? '🟢 Online' : '🔴 Offline'}</li>
 *       <li>Fallos consecutivos: {consecutiveFailures}</li>
 *       <li>Reintentos actuales: {retryCount}</li>
 *       <li>Última sincronización: {lastSyncTime?.toLocaleString() || 'Nunca'}</li>
 *     </ul>
 *   </div>
 * );
 * ```
 */
export const debugInfoExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};

/**
 * Ejemplo 4: Integración con formulario
 * 
 * Muestra cómo deshabilitar un formulario completo
 * cuando no hay conexión.
 * 
 * @example
 * ```tsx
 * const { isOffline } = useOfflineMode();
 * 
 * return (
 *   <form>
 *     <fieldset disabled={isOffline}>
 *       <input type="text" placeholder="Nombre" />
 *       <input type="email" placeholder="Email" />
 *       <button type="submit">
 *         {isOffline ? 'Sin conexión' : 'Enviar'}
 *       </button>
 *     </fieldset>
 *     
 *     {isOffline && (
 *       <p className="text-destructive text-sm mt-2">
 *         Conéctate a internet para enviar el formulario
 *       </p>
 *     )}
 *   </form>
 * );
 * ```
 */
export const formExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};

/**
 * Ejemplo 5: Carga de datos con fallback a cache
 * 
 * Muestra cómo cargar datos desde el servidor cuando hay conexión
 * y desde cache cuando no hay.
 * 
 * @example
 * ```tsx
 * const { isOnline } = useOfflineMode();
 * 
 * const loadData = async () => {
 *   if (!isOnline) {
 *     // Cargar desde cache
 *     const cached = await loadFromCache();
 *     if (cached) {
 *       toast.info('Mostrando datos en caché', {
 *         description: 'Conéctate para actualizar'
 *       });
 *       return cached;
 *     }
 *     
 *     toast.error('No hay datos disponibles offline');
 *     return null;
 *   }
 * 
 *   // Cargar desde servidor
 *   try {
 *     const data = await loadFromServer();
 *     await saveToCache(data);
 *     return data;
 *   } catch (error) {
 *     // Fallback a cache si falla el servidor
 *     const cached = await loadFromCache();
 *     if (cached) {
 *       toast.warning('Error al cargar. Mostrando datos en caché');
 *       return cached;
 *     }
 *     throw error;
 *   }
 * };
 * ```
 */
export const dataLoadingExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};

/**
 * Ejemplo 6: Sincronización automática al reconectar
 * 
 * El hook automáticamente actualiza lastSyncTime cuando
 * se recupera la conexión (después de 3 segundos).
 * 
 * @example
 * ```tsx
 * const { isOnline, lastSyncTime, isSyncing } = useOfflineMode();
 * 
 * // Este efecto se ejecutará cuando cambie isOnline
 * useEffect(() => {
 *   if (isOnline) {
 *     console.log('Conexión recuperada. Sincronización automática en 3s...');
 *     // El hook ya maneja la sincronización automática
 *     // lastSyncTime se actualizará automáticamente
 *   }
 * }, [isOnline]);
 * 
 * return (
 *   <div>
 *     {isSyncing && (
 *       <span className="text-blue-600">
 *         🔄 Sincronizando datos...
 *       </span>
 *     )}
 *     {!isSyncing && isOnline ? (
 *       <span className="text-green-600">
 *         ✓ Conectado - Última sync: {lastSyncTime?.toLocaleString()}
 *       </span>
 *     ) : (
 *       <span className="text-red-600">
 *         ✗ Sin conexión
 *       </span>
 *     )}
 *   </div>
 * );
 * ```
 */
export const autoSyncExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};

/**
 * Ejemplo 7: Escuchar eventos de reconexión para re-habilitar controles
 * 
 * Los hooks pueden escuchar el evento 'offline-mode-reconnect' para
 * re-habilitar controles inmediatamente (antes de la sincronización).
 * 
 * @example
 * ```tsx
 * const { isOnline } = useOfflineMode();
 * const [isButtonEnabled, setIsButtonEnabled] = useState(isOnline);
 * 
 * useEffect(() => {
 *   // Escuchar evento de reconexión
 *   const handleReconnect = () => {
 *     console.log('Reconexión detectada, re-habilitando controles...');
 *     setIsButtonEnabled(true);
 *     // Recargar datos si es necesario
 *     loadData(true); // forceReload = true
 *   };
 * 
 *   window.addEventListener('offline-mode-reconnect', handleReconnect);
 * 
 *   return () => {
 *     window.removeEventListener('offline-mode-reconnect', handleReconnect);
 *   };
 * }, []);
 * 
 * // Actualizar estado cuando cambia isOnline
 * useEffect(() => {
 *   setIsButtonEnabled(isOnline);
 * }, [isOnline]);
 * 
 * return (
 *   <button 
 *     onClick={handleAction} 
 *     disabled={!isButtonEnabled}
 *   >
 *     {isButtonEnabled ? 'Realizar Acción' : 'Sin conexión'}
 *   </button>
 * );
 * ```
 */
export const reconnectEventExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};

/**
 * Ejemplo 8: Escuchar eventos de sincronización para actualizar datos
 * 
 * Los hooks pueden escuchar el evento 'offline-mode-sync' para
 * sincronizar sus datos cuando se recupera la conexión.
 * 
 * @example
 * ```tsx
 * const { isOnline } = useOfflineMode();
 * const [data, setData] = useState([]);
 * 
 * const loadData = async (forceReload = false) => {
 *   // Lógica de carga con cache...
 * };
 * 
 * useEffect(() => {
 *   // Escuchar evento de sincronización
 *   const handleSync = () => {
 *     console.log('Sincronización iniciada, recargando datos...');
 *     loadData(true); // Forzar recarga desde servidor
 *   };
 * 
 *   window.addEventListener('offline-mode-sync', handleSync);
 * 
 *   return () => {
 *     window.removeEventListener('offline-mode-sync', handleSync);
 *   };
 * }, []);
 * 
 * return (
 *   <div>
 *     {data.map(item => (
 *       <div key={item.id}>{item.name}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const syncEventExample = () => {
  // Ver ejemplo en el comentario JSDoc arriba
};
