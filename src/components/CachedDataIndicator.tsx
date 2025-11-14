import { Cloud, CloudOff } from 'lucide-react';
import { formatRelativeTime } from '@/lib/dateUtils';

interface CachedDataIndicatorProps {
  lastSyncTime: Date | null;
  isOnline: boolean;
  className?: string;
}

/**
 * Indicador visual que muestra si los datos provienen del cache
 * y cuándo fue la última sincronización exitosa
 */
export const CachedDataIndicator = ({
  lastSyncTime,
  isOnline,
  className = ''
}: CachedDataIndicatorProps) => {
  // No mostrar nada si estamos online y hay sincronización reciente
  if (isOnline && lastSyncTime) {
    const diffMs = new Date().getTime() - lastSyncTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Ocultar si la última sync fue hace menos de 2 minutos
    if (diffMinutes < 2) {
      return null;
    }
  }

  const relativeTime = formatRelativeTime(lastSyncTime);
  const isShowingCachedData = !isOnline || (lastSyncTime && new Date().getTime() - lastSyncTime.getTime() > 120000);

  if (!isShowingCachedData) {
    return null;
  }

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm
        ${isOnline ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}
        ${className}
      `}
    >
      {isOnline ? (
        <Cloud className="h-4 w-4" />
      ) : (
        <CloudOff className="h-4 w-4" />
      )}
      <span>
        {isOnline ? 'Datos en caché' : 'Sin conexión'} · Última sincronización: {relativeTime}
      </span>
    </div>
  );
};
