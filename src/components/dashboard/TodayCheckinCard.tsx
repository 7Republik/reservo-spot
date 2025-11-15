import React, { useState } from "react";
import { Clock, CheckCircle2, LogOut, Loader2, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ReservationWithCheckin } from "@/types/checkin.types";
import { useCheckin } from "@/hooks/useCheckin";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { DisabledControlTooltip } from "@/components/DisabledControlTooltip";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { Badge } from "@/components/ui/badge";
import { getIconProps } from "@/lib/iconConfig";

interface TodayCheckinCardProps {
  reservation: ReservationWithCheckin;
  onCheckinSuccess?: () => void;
}

/**
 * Componente para check-in/check-out en la sección "Hoy"
 * Muestra botón "Llegué" cuando no hay check-in
 * Muestra hora de check-in y botón "Me voy" después de check-in
 * 
 * Soporte Offline:
 * - Detecta estado offline y deshabilita botones de check-in/check-out
 * - Muestra tooltips explicativos cuando está offline
 * - Mantiene visualización de estado actual desde cache (solo lectura)
 */
export const TodayCheckinCard = ({ reservation, onCheckinSuccess }: TodayCheckinCardProps) => {
  const { checkin, checkout, isLoading } = useCheckin();
  const { isOnline, isOffline } = useOfflineMode();
  const [showAnimation, setShowAnimation] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const hasCheckin = reservation.checkin?.checkin_at;
  const hasCheckout = reservation.checkin?.checkout_at;

  // Staggered entrance animation (delay 100ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckin = async () => {
    await checkin(reservation.id);
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
    // Recargar datos inmediatamente
    if (onCheckinSuccess) {
      setTimeout(() => onCheckinSuccess(), 500);
    }
  };

  const handleCheckout = async () => {
    await checkout(reservation.id);
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1000);
    // Recargar datos inmediatamente
    if (onCheckinSuccess) {
      setTimeout(() => onCheckinSuccess(), 500);
    }
  };

  // Si ya hizo checkout, no mostrar nada
  if (hasCheckout) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Mensaje de modo offline */}
      {isOffline && (
        <GlassCard 
          variant="light" 
          blur="sm"
          className="border-orange-200 bg-orange-50/80 dark:bg-orange-950/40 dark:border-orange-800 p-3 md:p-4"
        >
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <WifiOff {...getIconProps("sm", "warning")} className="flex-shrink-0" />
            <p className="text-xs md:text-sm">
              <span className="font-medium">Modo offline:</span> El check-in/check-out requiere conexión para validar horarios
            </p>
          </div>
        </GlassCard>
      )}

      {/* Estado de check-in con GlassCard - Fade + Slide animation */}
      <GlassCard
        variant="light"
        blur="md"
        hover={!isOffline}
        className={`
          p-4 md:p-6
          transition-all duration-400 ease-out
          ${isVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4"
          }
          ${showAnimation ? "scale-105 shadow-lg" : "scale-100"}
          ${hasCheckin 
            ? "bg-green-50/80 border-green-200 dark:bg-green-950/40 dark:border-green-800" 
            : "bg-blue-50/80 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
          }
          ${isOffline ? "opacity-75" : ""}
          motion-reduce:transition-none
          motion-reduce:transform-none
          motion-reduce:opacity-100
        `}
      >
        {hasCheckin ? (
          <div className="space-y-3 md:space-y-4">
            {/* Check-in realizado - todo en una línea */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <p className="text-sm md:text-base font-semibold text-green-900 dark:text-green-100">
                  Check-in realizado
                </p>
                <Badge 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs flex-shrink-0"
                >
                  Activo
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300 flex-shrink-0">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-medium">
                  {format(new Date(hasCheckin), "HH:mm", { locale: es })}
                </span>
              </div>
            </div>

            {/* Botón de checkout con GradientButton */}
            <DisabledControlTooltip
              isDisabled={isOffline}
              message="Requiere conexión para validar horarios"
              side="bottom"
            >
              <GradientButton
                onClick={handleCheckout}
                disabled={isLoading || isOffline}
                variant="secondary"
                size="lg"
                loading={isLoading}
                icon={!isLoading ? <LogOut {...getIconProps("md")} /> : undefined}
                iconPosition="left"
                className="w-full md:w-auto bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                aria-label="Realizar check-out y finalizar reserva"
              >
                {isLoading ? "Procesando..." : "Me voy"}
              </GradientButton>
            </DisabledControlTooltip>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {/* Sin check-in */}
            <div className="text-center">
              <p className="text-sm md:text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
                ¿Ya llegaste?
              </p>
              <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300">
                Confirma tu llegada para registrar tu check-in
              </p>
            </div>

            {/* Botón de checkin con GradientButton y AnimatedIcon */}
            <DisabledControlTooltip
              isDisabled={isOffline}
              message="Requiere conexión para validar horarios"
              side="bottom"
            >
              <GradientButton
                onClick={handleCheckin}
                disabled={isLoading || isOffline}
                variant="primary"
                size="lg"
                loading={isLoading}
                icon={!isLoading ? <AnimatedIcon icon={<CheckCircle2 {...getIconProps("md", "success")} />} animation="draw" size="md" /> : undefined}
                iconPosition="left"
                className="w-full md:w-auto"
                aria-label="Realizar check-in y confirmar llegada"
              >
                {isLoading ? "Procesando..." : "Llegué"}
              </GradientButton>
            </DisabledControlTooltip>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
