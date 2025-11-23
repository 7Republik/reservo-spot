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
        ${isOnline ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'}
        ${className}
      `}
    >
      {isOnline ? (
        <Cloud className="h-4 w-4" />
      ) : (
        <CloudOff className="h-4 w-4" />
      )}
      <span>
        {isOnline 
          ? `Mostrando información guardada · Actualizado ${relativeTime}` 
          : `Sin conexión · Última actualización ${relativeTime}`
        }
      </span>
    </div>
  );
};
