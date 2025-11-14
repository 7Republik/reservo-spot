/**
 * Componente de prueba para verificar la re-habilitación de controles
 * 
 * Este componente demuestra cómo los controles se re-habilitan automáticamente
 * cuando se recupera la conexión, cumpliendo con los requisitos:
 * - Requisito 3.3: Sincronización automática al reconectar (dentro de 3s)
 * - Requisito 5.5: Re-habilitar controles en menos de 2 segundos
 */

import { useState, useEffect } from 'react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OfflineReconnectTest = () => {
  const { isOnline, isOffline, lastSyncTime, isSyncing, consecutiveFailures } = useOfflineMode();
  const [controlsEnabled, setControlsEnabled] = useState(isOnline);
  const [syncCount, setSyncCount] = useState(0);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastReconnectTime, setLastReconnectTime] = useState<Date | null>(null);

  // Actualizar estado de controles cuando cambia isOnline
  useEffect(() => {
    setControlsEnabled(isOnline);
  }, [isOnline]);

  // Escuchar eventos de reconexión y sincronización
  useOfflineSync(
    () => {
      // Re-habilitar controles inmediatamente
      console.log('[Test] Evento de reconexión recibido');
      setControlsEnabled(true);
      setReconnectCount(prev => prev + 1);
      setLastReconnectTime(new Date());
    },
    () => {
      // Sincronizar datos
      console.log('[Test] Evento de sincronización recibido');
      setSyncCount(prev => prev + 1);
    }
  );

  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    return date.toLocaleTimeString();
  };

  const handleTestAction = () => {
    console.log('[Test] Acción de prueba ejecutada');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
          Test de Re-habilitación de Controles
        </CardTitle>
        <CardDescription>
          Verifica que los controles se re-habiliten automáticamente al recuperar la conexión
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estado de Conexión */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Estado de Conexión</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estado:</p>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sincronizando:</p>
              <Badge variant={isSyncing ? 'secondary' : 'outline'}>
                {isSyncing ? 'Sí' : 'No'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fallos consecutivos:</p>
              <Badge variant="outline">{consecutiveFailures}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Última sincronización:</p>
              <p className="text-sm font-mono">{formatTime(lastSyncTime)}</p>
            </div>
          </div>
        </div>

        {/* Contadores de Eventos */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Eventos Recibidos</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Reconexiones:</p>
              <Badge variant="secondary">{reconnectCount}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sincronizaciones:</p>
              <Badge variant="secondary">{syncCount}</Badge>
            </div>
            {lastReconnectTime && (
              <div className="col-span-2 space-y-1">
                <p className="text-sm text-muted-foreground">Última reconexión:</p>
                <p className="text-sm font-mono">{formatTime(lastReconnectTime)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Estado de Controles */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Estado de Controles</h3>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Controles habilitados:</p>
            <Badge variant={controlsEnabled ? 'default' : 'destructive'}>
              {controlsEnabled ? 'Sí' : 'No'}
            </Badge>
          </div>
        </div>

        {/* Botón de Prueba */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Prueba de Acción</h3>
          <Button
            onClick={handleTestAction}
            disabled={!controlsEnabled}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {controlsEnabled ? 'Ejecutar Acción de Prueba' : 'Requiere Conexión'}
          </Button>
          {!controlsEnabled && (
            <p className="text-sm text-muted-foreground">
              Este botón se habilitará automáticamente cuando se recupere la conexión
            </p>
          )}
        </div>

        {/* Instrucciones */}
        <div className="bg-muted p-4 rounded-md space-y-2">
          <h3 className="text-sm font-semibold">Instrucciones de Prueba</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Desactiva tu conexión a internet (WiFi o datos móviles)</li>
            <li>Observa cómo el estado cambia a "Offline" y el botón se deshabilita</li>
            <li>Reactiva tu conexión a internet</li>
            <li>Verifica que:
              <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                <li>El botón se re-habilita en menos de 2 segundos</li>
                <li>El contador de "Reconexiones" aumenta</li>
                <li>Después de 3 segundos, el contador de "Sincronizaciones" aumenta</li>
              </ul>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
