import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader para la tarjeta de reserva del día
 * Se muestra mientras se cargan los datos desde cache o servidor
 */
export const TodayReservationSkeleton = () => {
  return (
    <GlassCard 
      variant="light" 
      blur="md" 
      hover={false}
      className="p-4 md:p-6"
    >
      <div className="space-y-3 md:space-y-4">
        {/* Skeleton de la reserva */}
        <div className="p-3 md:p-5 bg-card border border-border rounded-2xl md:rounded-3xl shadow-sm">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            {/* Número de plaza - IZQUIERDA */}
            <div className="flex items-center gap-2 md:gap-3">
              <Skeleton className="h-14 w-20 md:h-16 md:w-24" />
              <Skeleton className="h-6 w-12" />
            </div>

            {/* Ubicación - DERECHA */}
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24 md:w-32" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Botones de acción */}
        <div className="flex gap-2 md:gap-3">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </div>
    </GlassCard>
  );
};
