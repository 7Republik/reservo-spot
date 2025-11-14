import { useState, useEffect } from 'react';
import { WifiOff, Wifi, ChevronDown, ChevronUp } from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/dateUtils';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  autoHide?: boolean;
  autoHideDelay?: number;
  showDetails?: boolean;
}

export const OfflineIndicator = ({
  position = 'top',
  autoHide = true,
  autoHideDelay = 3000,
  showDetails = true,
}: OfflineIndicatorProps) => {
  const { isOnline, isOffline, lastSyncTime, isSyncing } = useOfflineMode();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Controlar visibilidad del indicador
  useEffect(() => {
    if (isOffline) {
      // Mostrar inmediatamente cuando offline
      setIsVisible(true);
      setIsAnimatingOut(false);
    } else if (isOnline && autoHide) {
      // Auto-ocultar después del delay cuando vuelve online
      const timer = setTimeout(() => {
        setIsAnimatingOut(true);
        setTimeout(() => {
          setIsVisible(false);
          setIsAnimatingOut(false);
          setIsExpanded(false);
        }, 300); // Duración de la animación de salida
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [isOnline, isOffline, autoHide, autoHideDelay]);



  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        position === 'top' ? 'top-0' : 'bottom-0',
        isAnimatingOut && 'opacity-0 translate-y-[-100%]'
      )}
    >
      {/* Barra principal */}
      <div
        className={cn(
          'w-full px-4 py-3 shadow-lg transition-all duration-200',
          isOffline
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-green-600 text-white',
          'motion-reduce:transition-none'
        )}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOffline ? (
              <WifiOff className="h-5 w-5 animate-pulse" />
            ) : (
              <Wifi className="h-5 w-5" />
            )}
            <div>
              <p className="font-semibold">
                {isSyncing
                  ? 'Sincronizando...'
                  : isOffline
                  ? 'Sin conexión'
                  : 'Conectado'}
              </p>
              {isOffline && lastSyncTime && (
                <p className="text-sm opacity-90">
                  Última sincronización: {formatRelativeTime(lastSyncTime)}
                </p>
              )}
              {isSyncing && (
                <p className="text-sm opacity-90">
                  Actualizando datos desde el servidor...
                </p>
              )}
            </div>
          </div>

          {showDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'p-2 rounded-md transition-colors',
                'hover:bg-black/10 focus:outline-none focus:ring-2',
                isOffline
                  ? 'focus:ring-destructive-foreground/50'
                  : 'focus:ring-white/50'
              )}
              aria-label={isExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Panel de detalles expandido */}
      {isExpanded && (
        <div
          className={cn(
            'w-full bg-card text-card-foreground border-t border-border',
            'animate-in slide-in-from-top-4 duration-300',
            'motion-reduce:animate-none'
          )}
        >
          <div className="container mx-auto px-4 py-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Estado de Conexión
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Estado:</span>{' '}
                    <span
                      className={cn(
                        'font-medium',
                        isOffline ? 'text-destructive' : 'text-green-600'
                      )}
                    >
                      {isOffline ? 'Desconectado' : 'Conectado'}
                    </span>
                  </p>
                  {lastSyncTime && (
                    <p>
                      <span className="text-muted-foreground">
                        Última sincronización:
                      </span>{' '}
                      {formatRelativeTime(lastSyncTime)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Funcionalidad Disponible
                </h3>
                <div className="space-y-1 text-sm">
                  {isOffline ? (
                    <>
                      <p className="text-green-600">✓ Ver reservas (caché)</p>
                      <p className="text-green-600">✓ Ver plazas (caché)</p>
                      <p className="text-green-600">✓ Ver placas (caché)</p>
                      <p className="text-destructive">✗ Crear reservas</p>
                      <p className="text-destructive">✗ Cancelar reservas</p>
                      <p className="text-destructive">✗ Gestionar placas</p>
                    </>
                  ) : (
                    <p className="text-green-600">
                      ✓ Todas las funciones disponibles
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isOffline && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Estás viendo datos almacenados
                  localmente. Conéctate a internet para realizar cambios o
                  actualizar la información.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
