import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ReservationWithCheckin } from "@/types/checkin.types";
import { useCheckin } from "@/hooks/useCheckin";
import { useState } from "react";

interface TodayCheckinCardProps {
  reservation: ReservationWithCheckin;
  onCheckinSuccess?: () => void;
}

/**
 * Componente para check-in/check-out en la sección "Hoy"
 * Muestra botón "Llegué" cuando no hay check-in
 * Muestra hora de check-in y botón "Me voy" después de check-in
 */
export const TodayCheckinCard = ({ reservation, onCheckinSuccess }: TodayCheckinCardProps) => {
  const { checkin, checkout, isLoading } = useCheckin();
  const [showAnimation, setShowAnimation] = useState(false);

  const hasCheckin = reservation.checkin?.checkin_at;
  const hasCheckout = reservation.checkin?.checkout_at;

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
      {/* Estado de check-in */}
      <div
        className={`
          rounded-lg border p-4 transition-all duration-300
          ${showAnimation ? "scale-105 shadow-lg" : "scale-100"}
          ${hasCheckin 
            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
            : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
          }
        `}
      >
        {hasCheckin ? (
          <div className="space-y-3">
            {/* Check-in realizado */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Check-in realizado
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(hasCheckin), "HH:mm", { locale: es })}
                </p>
              </div>
            </div>

            {/* Botón de checkout */}
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5 mr-2" />
                  Me voy
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Sin check-in */}
            <div className="text-center">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                ¿Ya llegaste?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Confirma tu llegada para registrar tu check-in
              </p>
            </div>

            {/* Botón de checkin */}
            <Button
              onClick={handleCheckin}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Llegué
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
