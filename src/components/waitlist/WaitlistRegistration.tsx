import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useWaitlistSettings } from '@/hooks/useWaitlistSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParkingGroup {
  id: string;
  name: string;
  location?: string;
}

interface WaitlistRegistrationProps {
  date: Date;
  availableGroups: ParkingGroup[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * WaitlistRegistration Component
 * 
 * Allows users to register in waitlist when no parking spots are available.
 * 
 * Features:
 * - Select specific groups or all available groups
 * - Validates simultaneous waitlist limit before submission
 * - Shows estimated queue position after registration
 * - Displays blocking status if user is penalized
 * - Handles loading and error states
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.8
 * 
 * @param date - The date for which to register in waitlist
 * @param availableGroups - List of parking groups user has access to
 * @param onSuccess - Callback when registration is successful
 * @param onCancel - Callback when user cancels registration
 */
export const WaitlistRegistration = ({
  date,
  availableGroups,
  onSuccess,
  onCancel
}: WaitlistRegistrationProps) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  const [currentWaitlistCount, setCurrentWaitlistCount] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const { registerInWaitlist, isLoading } = useWaitlist();
  const { settings, loading: settingsLoading, loadSettings } = useWaitlistSettings();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check user's penalty status and current waitlist count
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        setCheckingStatus(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check penalty status
        const { data: penaltyData } = await supabase
          .from('waitlist_penalties')
          .select('is_blocked, blocked_until')
          .eq('user_id', user.id)
          .single();

        if (penaltyData?.is_blocked) {
          setIsBlocked(true);
          setBlockedUntil(penaltyData.blocked_until);
        }

        // Count current active waitlist entries
        const { count } = await supabase
          .from('waitlist_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['active', 'offer_pending']);

        setCurrentWaitlistCount(count || 0);
      } catch (error) {
        console.error('Error checking user status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUserStatus();
  }, []);

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedGroups(availableGroups.map(g => g.id));
    } else {
      setSelectedGroups([]);
    }
  };

  // Handle individual group selection
  const handleGroupToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, groupId]);
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
      setSelectAll(false);
    }
  };

  // Validate if user can register
  const canRegister = () => {
    if (isBlocked) return false;
    if (selectedGroups.length === 0) return false;
    
    const newTotal = currentWaitlistCount + selectedGroups.length;
    return newTotal <= settings.waitlist_max_simultaneous;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!canRegister()) {
      toast.error('No puedes registrarte en más listas de espera');
      return;
    }

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      await registerInWaitlist(selectedGroups, dateString);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is already handled in the hook
      console.error('Registration error:', error);
    }
  };

  // Loading state
  if (settingsLoading || checkingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Waitlist disabled
  if (!settings.waitlist_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Lista de espera no disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            El sistema de lista de espera está temporalmente deshabilitado.
          </p>
        </CardContent>
      </Card>
    );
  }

  // User is blocked
  if (isBlocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Acceso bloqueado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Estás bloqueado temporalmente de la lista de espera por no responder a ofertas anteriores.
              {blockedUntil && (
                <span className="block mt-2">
                  Podrás volver a registrarte después del{' '}
                  <strong>
                    {format(new Date(blockedUntil), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </strong>
                </span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const newTotal = currentWaitlistCount + selectedGroups.length;
  const wouldExceedLimit = newTotal > settings.waitlist_max_simultaneous;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Registrarse en lista de espera
        </CardTitle>
        <CardDescription>
          No hay plazas disponibles para el{' '}
          <span className="font-semibold capitalize">
            {format(date, "d 'de' MMMM", { locale: es })}
          </span>
          . Regístrate en la lista de espera y te notificaremos si se libera una plaza.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info about waitlist system */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>¿Cómo funciona?</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Te notificaremos por email si se libera una plaza</li>
              <li>• Tendrás {settings.waitlist_acceptance_time_minutes} minutos para aceptar la oferta</li>
              <li>• Si aceptas, se creará tu reserva automáticamente</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Current waitlist count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            Tienes {currentWaitlistCount} de {settings.waitlist_max_simultaneous} listas de espera activas
          </span>
        </div>

        {/* Group selection */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              disabled={isLoading}
            />
            <Label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Seleccionar todos los grupos ({availableGroups.length})
            </Label>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={`group-${group.id}`}
                  checked={selectedGroups.includes(group.id)}
                  onCheckedChange={(checked) => handleGroupToggle(group.id, checked as boolean)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor={`group-${group.id}`}
                  className="flex-1 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <div>
                    <div className="font-medium">{group.name}</div>
                    {group.location && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {group.location}
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Warning if would exceed limit */}
        {wouldExceedLimit && selectedGroups.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Has seleccionado {selectedGroups.length} grupos, pero solo puedes tener{' '}
              {settings.waitlist_max_simultaneous - currentWaitlistCount} listas más.
              Reduce tu selección o cancela algunas listas existentes.
            </AlertDescription>
          </Alert>
        )}

        {/* Success message preview */}
        {selectedGroups.length > 0 && !wouldExceedLimit && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription>
              Te registrarás en {selectedGroups.length} lista{selectedGroups.length > 1 ? 's' : ''} de espera.
              Te notificaremos si se libera una plaza en cualquiera de estos grupos.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleRegister}
          disabled={!canRegister() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Registrarse en lista de espera
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
