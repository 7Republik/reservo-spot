import { useEffect, useState } from 'react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator = () => {
  const { isOnline, lastSync, pendingActions } = useOfflineMode();
  const [show, setShow] = useState(!isOnline);

  // Controlar visibilidad del banner
  useEffect(() => {
    if (!isOnline) {
      // Mostrar inmediatamente cuando offline
      setShow(true);
    } else {
      // Mostrar banner verde cuando vuelve conexión
      setShow(true);
      
      // Auto-ocultar después de 3 segundos
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // No renderizar si está oculto
  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      )}
    >
      <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
        {/* Icono de estado */}
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}

        {/* Mensaje principal */}
        <span>
          {isOnline ? '✓ Conectado' : '⚠️ Sin conexión'}
        </span>

        {/* Timestamp de última sincronización (solo offline) */}
        {!isOnline && lastSync && (
          <span className="text-xs opacity-90">
            · Última sincronización: {formatDistanceToNow(lastSync, { 
              locale: es,
              addSuffix: true 
            })}
          </span>
        )}

        {/* Contador de acciones pendientes (solo si hay) */}
        {pendingActions > 0 && (
          <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs">
            {pendingActions} {pendingActions === 1 ? 'acción pendiente' : 'acciones pendientes'}
          </span>
        )}
      </div>
    </div>
  );
};
