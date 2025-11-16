import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notifications';
import { getPriorityConfig, getCategoryIcon, getRelativeTime } from '@/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

export const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
  const navigate = useNavigate();
  const priorityConfig = getPriorityConfig(notification.priority as any);
  const categoryIcon = getCategoryIcon(notification.category as any);

  const handleClick = () => {
    // Marcar como leída
    if (!notification.is_read) {
      onRead();
    }

    // Navegar si hay action_url
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-3 border-l-4 cursor-pointer transition-all hover:bg-accent/50',
        priorityConfig.borderColor,
        notification.is_read ? 'opacity-60' : 'bg-accent/20'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icono de categoría */}
        <div className="text-xl flex-shrink-0 mt-0.5">
          {categoryIcon}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Título y prioridad */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={cn(
              'font-semibold text-sm',
              notification.is_read ? 'text-muted-foreground' : 'text-foreground'
            )}>
              {notification.title}
            </h4>
            <span className="text-xs flex-shrink-0">
              {priorityConfig.icon}
            </span>
          </div>

          {/* Mensaje */}
          <p className={cn(
            'text-sm line-clamp-2',
            notification.is_read ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {notification.message}
          </p>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground mt-1">
            {getRelativeTime(notification.created_at)}
          </p>
        </div>

        {/* Indicador de no leída */}
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
};
