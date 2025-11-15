import { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useWaitlistOffers } from '@/hooks/useWaitlistOffers';
import type { WaitlistOfferWithDetails } from '@/types/waitlist';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WaitlistOfferNotificationProps {
  offer: WaitlistOfferWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WaitlistOfferNotification Component
 * 
 * Displays a modal notification when a user receives a parking spot offer from the waitlist.
 * Features:
 * - Shows spot details (number, group, date)
 * - Visual countdown timer showing time remaining
 * - Accept and Reject buttons
 * - Disables buttons if offer has expired
 * - Shows confirmation messages after actions
 * - Auto-closes after successful action
 * 
 * Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 8.8
 * 
 * @param offer - The waitlist offer with full details
 * @param open - Controls dialog visibility
 * @param onOpenChange - Callback when dialog open state changes
 */
export const WaitlistOfferNotification = ({
  offer,
  open,
  onOpenChange
}: WaitlistOfferNotificationProps) => {
  const { acceptOffer, rejectOffer, isLoading } = useWaitlist();
  const { getTimeRemaining } = useWaitlistOffers();
  
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(offer.expires_at));
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'accept' | 'reject' | null>(null);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(offer.expires_at);
      setTimeRemaining(remaining);

      // Auto-close if expired
      if (remaining.isExpired && open) {
        onOpenChange(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [offer.expires_at, getTimeRemaining, open, onOpenChange]);

  /**
   * Handle accepting the offer
   * Shows confirmation and closes dialog after success
   */
  const handleAccept = async () => {
    try {
      await acceptOffer(offer.id);
      setConfirmationType('accept');
      setShowConfirmation(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setShowConfirmation(false);
        setConfirmationType(null);
      }, 2000);
    } catch (error) {
      console.error('Error accepting offer:', error);
      // Error is already handled by useWaitlist hook with toast
    }
  };

  /**
   * Handle rejecting the offer
   * Shows confirmation and closes dialog after success
   */
  const handleReject = async () => {
    try {
      await rejectOffer(offer.id);
      setConfirmationType('reject');
      setShowConfirmation(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setShowConfirmation(false);
        setConfirmationType(null);
      }, 2000);
    } catch (error) {
      console.error('Error rejecting offer:', error);
      // Error is already handled by useWaitlist hook with toast
    }
  };

  /**
   * Get urgency level based on time remaining
   */
  const getUrgencyLevel = () => {
    if (timeRemaining.isExpired) return 'expired';
    if (timeRemaining.minutes < 15) return 'critical';
    if (timeRemaining.minutes < 30) return 'warning';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  /**
   * Get badge color based on urgency
   */
  const getBadgeVariant = () => {
    switch (urgency) {
      case 'expired':
        return 'destructive';
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  /**
   * Format date for display
   */
  const formattedDate = format(new Date(offer.reservation_date), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es
  });

  // Show confirmation screen
  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {confirmationType === 'accept' ? (
              <>
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    ¡Reserva Confirmada!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tu plaza ha sido reservada exitosamente
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                  <XCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    Oferta Rechazada
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sigues en la lista de espera
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            ¡Plaza Disponible!
          </DialogTitle>
          <DialogDescription>
            Se ha liberado una plaza de parking. Tienes tiempo limitado para aceptar esta oferta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown Timer */}
          <Card className={`border-2 ${
            urgency === 'expired' ? 'border-destructive bg-destructive/5' :
            urgency === 'critical' ? 'border-destructive bg-destructive/5' :
            urgency === 'warning' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
            'border-primary bg-primary/5'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 ${
                    urgency === 'expired' || urgency === 'critical' ? 'text-destructive' :
                    urgency === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                    'text-primary'
                  }`} />
                  <span className="text-sm font-medium text-foreground">
                    Tiempo restante
                  </span>
                </div>
                <Badge variant={getBadgeVariant()} className="text-base px-3 py-1">
                  {timeRemaining.formattedTime}
                </Badge>
              </div>
              
              {urgency === 'expired' && (
                <p className="text-sm text-destructive mt-2">
                  Esta oferta ha expirado
                </p>
              )}
              {urgency === 'critical' && (
                <p className="text-sm text-destructive mt-2">
                  ¡Quedan menos de 15 minutos!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Spot Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Plaza</p>
                <p className="text-lg font-bold text-foreground">
                  {offer.parking_spot?.spot_number || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Grupo</p>
                <p className="text-base font-semibold text-foreground">
                  {offer.parking_group?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                <p className="text-base font-semibold text-foreground capitalize">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Spot Features */}
            {(offer.parking_spot && 
              ('is_accessible' in offer.parking_spot || 
               'has_charger' in offer.parking_spot || 
               'is_compact' in offer.parking_spot)) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {('is_accessible' in offer.parking_spot && offer.parking_spot.is_accessible) && (
                  <Badge variant="outline" className="text-xs">
                    ♿ Accesible
                  </Badge>
                )}
                {('has_charger' in offer.parking_spot && offer.parking_spot.has_charger) && (
                  <Badge variant="outline" className="text-xs">
                    🔌 Cargador
                  </Badge>
                )}
                {('is_compact' in offer.parking_spot && offer.parking_spot.is_compact) && (
                  <Badge variant="outline" className="text-xs">
                    🚗 Compacta
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isLoading || timeRemaining.isExpired}
            className="w-full sm:w-auto"
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading || timeRemaining.isExpired}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aceptar Reserva
          </Button>
        </DialogFooter>

        {timeRemaining.isExpired && (
          <p className="text-sm text-center text-muted-foreground">
            Esta oferta ha expirado. La plaza se ofrecerá al siguiente usuario en la lista.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
