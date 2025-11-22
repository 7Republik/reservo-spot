/**
 * Ejemplo de uso del hook useOfflineMode
 * 
 * Este hook gestiona el modo offline de la aplicación, incluyendo:
 * - Detección de conexión con debounce de 5 segundos
 * - Precarga inteligente de datos críticos
 * - Cola de acciones pendientes
 * - Sincronización automática al reconectar
 * - Sincronización entre pestañas con BroadcastChannel
 */

import { useOfflineMode } from './useOfflineMode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export const OfflineModeExample = () => {
  const {
    isOnline,
    lastSync,
    pendingActions,
    preloadStatus,
    isPreloadComplete,
    preloadResults,
    preloadData,
    queueAction,
    syncPendingActions,
  } = useOfflineMode();

  // Ejemplo: Hacer check-in offline
  const handleCheckin = async () => {
    await queueAction({
      type: 'checkin',
      data: {
        reservationId: 'reservation-uuid',
        userId: 'user-uuid',
      },
      timestamp: Date.now(),
    });
  };

  // Ejemplo: Cancelar reserva offline
  const handleCancelReservation = async () => {
    await queueAction({
      type: 'cancel_reservation',
      data: {
        reservationId: 'reservation-uuid',
      },
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Estado de conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                Sin conexión
              </>
            )}
          </CardTitle>
          <CardDescription>
            {lastSync && `Última sincronización: ${lastSync.toLocaleString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Estado de precarga */}
            <div className="flex items-center justify-between">
              <span>Estado de precarga:</span>
              <Badge variant={
                preloadStatus === 'complete' ? 'default' :
                preloadStatus === 'partial' ? 'secondary' :
                preloadStatus === 'loading' ? 'outline' : 'destructive'
              }>
                {preloadStatus}
              </Badge>
            </div>

            {/* Acciones pendientes */}
            {pendingActions > 0 && (
              <div className="flex items-center justify-between">
                <span>Acciones pendientes:</span>
                <Badge variant="secondary">{pendingActions}</Badge>
              </div>
            )}

            {/* Detalles de precarga */}
            {preloadResults && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Datos precargados:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {preloadResults.profile ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Perfil
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.plates ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Matrículas
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.groups ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Grupos
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.todayReservation ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Reserva del día
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.upcomingReservations ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Reservas próximas
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.maps ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Mapas
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => preloadData()}
            disabled={preloadStatus === 'loading'}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar datos
          </Button>

          {pendingActions > 0 && isOnline && (
            <Button
              onClick={() => syncPendingActions()}
              variant="secondary"
              className="w-full"
            >
              Sincronizar acciones pendientes
            </Button>
          )}

          {/* Ejemplos de acciones offline */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Ejemplos de acciones offline:</p>
            <div className="space-y-2">
              <Button
                onClick={handleCheckin}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Hacer check-in (ejemplo)
              </Button>
              <Button
                onClick={handleCancelReservation}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Cancelar reserva (ejemplo)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Uso en componentes:
 * 
 * import { useOfflineMode } from '@/hooks/useOfflineMode';
 * 
 * const MyComponent = () => {
 *   const { isOnline, preloadStatus, queueAction } = useOfflineMode();
 *   
 *   // Verificar si estamos online
 *   if (!isOnline) {
 *     return <div>Sin conexión</div>;
 *   }
 *   
 *   // Verificar si la precarga está completa
 *   if (preloadStatus !== 'complete') {
 *     return <div>Cargando datos...</div>;
 *   }
 *   
 *   // Hacer una acción offline
 *   const handleAction = async () => {
 *     await queueAction({
 *       type: 'checkin',
 *       data: { reservationId: 'xxx', userId: 'yyy' },
 *       timestamp: Date.now(),
 *     });
 *   };
 *   
 *   return <button onClick={handleAction}>Acción</button>;
 * };
 */

/**
 * VALIDACIÓN DE CONFLICTOS EN SINCRONIZACIÓN
 * 
 * La función syncPendingActions() ahora valida cada acción antes de ejecutarla:
 * 
 * 1. Check-in/Check-out:
 *    - Verifica que la reserva existe
 *    - Verifica que la reserva sigue activa (status = 'active')
 *    - Si no es válida, se marca como conflicto y se notifica al usuario
 * 
 * 2. Cancelación:
 *    - Verifica que la reserva existe
 *    - Verifica que la reserva no está ya cancelada
 *    - Si ya está cancelada, muestra warning (no error)
 * 
 * 3. Separación de resultados:
 *    - Acciones exitosas: Se ejecutan y se eliminan de la cola
 *    - Conflictos: Se eliminan de la cola y se notifican específicamente
 *    - Fallos: Se mantienen en la cola para reintentar más tarde
 * 
 * 4. Feedback específico:
 *    - Éxitos: "X acciones sincronizadas correctamente"
 *    - Conflictos: "X acciones no se pudieron aplicar por cambios en el servidor"
 *    - Fallos: "X acciones fallaron. Se reintentará más tarde."
 * 
 * 5. Recarga de datos:
 *    - Después de sincronización exitosa, se recargan datos frescos
 *    - Esto asegura que el cache está actualizado con el estado del servidor
 * 
 * Ejemplo de escenario:
 * - Usuario hace check-in offline a las 9:00
 * - Admin cancela la reserva a las 9:05
 * - Usuario recupera conexión a las 9:10
 * - Sincronización detecta conflicto: "No se pudo hacer check-in: La reserva ya no está activa (estado: cancelled)"
 * - La acción se elimina de la cola (no se reintenta)
 * - Se recargan datos frescos para reflejar el estado actual
 */
