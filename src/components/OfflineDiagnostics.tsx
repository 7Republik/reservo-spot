import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { offlineCache } from '@/lib/offlineCache';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente de diagnóstico del modo offline
 * 
 * Muestra:
 * - Estado de conexión
 * - Estadísticas del caché
 * - Estado de precarga
 * - Acciones pendientes
 * - Datos en caché
 * 
 * Útil para debugging y verificar que el modo offline funciona correctamente
 */
export const OfflineDiagnostics = () => {
  const { isOnline, lastSync, pendingActions, preloadStatus, preloadResults, preloadData } = useOfflineMode();
  const [stats, setStats] = useState<any>(null);
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const cacheStats = await offlineCache.getStats();
      setStats(cacheStats);

      // Obtener claves del caché
      const keys = [
        'profile',
        'plates',
        'groups',
        'today_reservation',
        'upcoming_reservations',
        'preload_complete',
        'preload_results',
        'last_sync',
        'action_queue'
      ];

      const existingKeys: string[] = [];
      for (const key of keys) {
        const data = await offlineCache.get(key);
        if (data !== null) {
          existingKeys.push(key);
        }
      }

      setCacheKeys(existingKeys);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await preloadData();
      await loadStats();
      toast.success('Datos actualizados');
    } catch (error) {
      toast.error('Error al actualizar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar todo el caché?')) {
      return;
    }

    try {
      await offlineCache.clear();
      await loadStats();
      toast.success('Caché limpiado');
    } catch (error) {
      toast.error('Error al limpiar caché');
    }
  };

  const getPreloadStatusBadge = () => {
    switch (preloadStatus) {
      case 'complete':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completo</Badge>;
      case 'partial':
        return <Badge variant="secondary">Parcial</Badge>;
      case 'loading':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Cargando...</Badge>;
      default:
        return <Badge variant="outline">No iniciado</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnóstico de Modo Offline
          </CardTitle>
          <CardDescription>
            Información sobre el estado del caché y la sincronización
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado de Conexión */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
              Estado de Conexión
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={isOnline ? 'bg-green-500' : 'bg-red-500'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              {lastSync && (
                <span className="text-sm text-muted-foreground">
                  Última sincronización: {formatDistanceToNow(lastSync, { locale: es, addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          {/* Estado de Precarga */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Estado de Precarga</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getPreloadStatusBadge()}
              </div>
              {preloadResults && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {preloadResults.profile ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    Perfil
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.plates ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    Matrículas
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.groups ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    Grupos
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.todayReservation ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    Reserva del día
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.upcomingReservations ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    Próximas reservas
                  </div>
                  <div className="flex items-center gap-2">
                    {preloadResults.maps ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    Mapas
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones Pendientes */}
          {pendingActions > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Acciones Pendientes
              </h3>
              <Badge variant="secondary">
                {pendingActions} {pendingActions === 1 ? 'acción' : 'acciones'} pendiente{pendingActions === 1 ? '' : 's'}
              </Badge>
            </div>
          )}

          {/* Estadísticas del Caché */}
          {stats && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Estadísticas del Caché
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tamaño usado</p>
                  <p className="font-medium">{stats.totalSizeFormatted} / {stats.maxSizeFormatted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Porcentaje</p>
                  <p className="font-medium">{stats.percentageUsed.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entradas</p>
                  <p className="font-medium">{stats.entryCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comprimidas</p>
                  <p className="font-medium">{stats.compressedCount}</p>
                </div>
                {stats.oldestEntry && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Entrada más antigua</p>
                    <p className="font-medium text-xs">
                      {formatDistanceToNow(stats.oldestEntry, { locale: es, addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datos en Caché */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Datos en Caché</h3>
            <div className="flex flex-wrap gap-2">
              {cacheKeys.length > 0 ? (
                cacheKeys.map(key => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos en caché</p>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={loading || !isOnline}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar Datos
            </Button>
            <Button
              onClick={handleClearCache}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Caché
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
