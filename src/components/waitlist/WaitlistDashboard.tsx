import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Users, X, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWaitlist } from '@/hooks/useWaitlist';
import { supabase } from '@/integrations/supabase/client';
import type { WaitlistEntryWithDetails } from '@/types/waitlist';

interface WaitlistEntryWithPosition extends WaitlistEntryWithDetails {
  queue_position?: number;
  people_ahead?: number;
}

/**
 * WaitlistDashboard Component
 * 
 * Displays user's active waitlist entries with real-time position updates.
 * 
 * Features:
 * - Lists all active waitlist entries
 * - Shows queue position for each entry
 * - Displays number of people ahead in queue
 * - Allows voluntary cancellation of entries
 * - Real-time position updates via subscriptions
 * - Empty state when no active entries
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export const WaitlistDashboard = () => {
  const [entryToCancel, setEntryToCancel] = useState<WaitlistEntryWithPosition | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  const { cancelWaitlistEntry, isLoading: isCanceling } = useWaitlist();

  // Fetch user's waitlist entries with position calculation
  const {
    data: entries = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-waitlist-entries'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get user's entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('waitlist_entries')
        .select(`
          *,
          parking_group:parking_groups(
            id,
            name,
            location
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'offer_pending'])
        .order('created_at', { ascending: true });

      if (entriesError) throw entriesError;

      // Calculate position for each entry
      const entriesWithPosition: WaitlistEntryWithPosition[] = await Promise.all(
        (entriesData || []).map(async (entry: any) => {
          try {
            // Count entries ahead in queue for same group and date
            const { count } = await supabase
              .from('waitlist_entries')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', entry.group_id)
              .eq('reservation_date', entry.reservation_date)
              .eq('status', 'active')
              .lt('created_at', entry.created_at);

            const position = (count || 0) + 1;
            const peopleAhead = count || 0;

            return {
              ...entry,
              parking_group: Array.isArray(entry.parking_group) 
                ? entry.parking_group[0] 
                : entry.parking_group,
              queue_position: position,
              people_ahead: peopleAhead
            };
          } catch (error) {
            console.error('Error calculating position:', error);
            return {
              ...entry,
              parking_group: Array.isArray(entry.parking_group) 
                ? entry.parking_group[0] 
                : entry.parking_group,
              queue_position: undefined,
              people_ahead: undefined
            };
          }
        })
      );

      return entriesWithPosition;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Subscribe to real-time changes in waitlist_entries
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const channel = supabase
        .channel('waitlist-entries-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'waitlist_entries',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refetch when any change occurs
            refetch();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [refetch]);

  // Handle cancel entry
  const handleCancelEntry = async () => {
    if (!entryToCancel) return;

    try {
      await cancelWaitlistEntry(entryToCancel.id);
      setCancelDialogOpen(false);
      setEntryToCancel(null);
      refetch();
    } catch (error) {
      // Error is handled in the hook
      console.error('Error canceling entry:', error);
    }
  };

  // Open cancel dialog
  const openCancelDialog = (entry: WaitlistEntryWithPosition) => {
    setEntryToCancel(entry);
    setCancelDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error al cargar listas de espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Error desconocido'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Mis listas de espera
          </CardTitle>
          <CardDescription>
            Gestiona tus registros en listas de espera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No tienes listas de espera activas
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Cuando intentes reservar una plaza y no haya disponibilidad, 
              podrás registrarte en la lista de espera y aparecerá aquí.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Mis listas de espera
          </CardTitle>
          <CardDescription>
            Tienes {entries.length} registro{entries.length !== 1 ? 's' : ''} activo{entries.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Entry info */}
                    <div className="flex-1 space-y-3">
                      {/* Group name and location */}
                      <div>
                        <h4 className="font-semibold text-lg">
                          {entry.parking_group?.name || 'Grupo desconocido'}
                        </h4>
                        {entry.parking_group?.location && (
                          <p className="text-sm text-muted-foreground">
                            {entry.parking_group.location}
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">
                          {format(new Date(entry.reservation_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </div>

                      {/* Queue position */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            Posición en cola:{' '}
                            {entry.queue_position !== undefined ? (
                              <span className="text-primary font-bold">
                                #{entry.queue_position}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Calculando...
                              </span>
                            )}
                          </span>
                        </div>

                        {entry.people_ahead !== undefined && entry.people_ahead > 0 && (
                          <Badge variant="secondary">
                            {entry.people_ahead} persona{entry.people_ahead !== 1 ? 's' : ''} delante
                          </Badge>
                        )}

                        {entry.people_ahead === 0 && (
                          <Badge variant="default" className="bg-green-600">
                            ¡Eres el primero!
                          </Badge>
                        )}
                      </div>

                      {/* Status badge */}
                      {entry.status === 'offer_pending' && (
                        <Badge variant="default" className="bg-amber-600">
                          Oferta pendiente
                        </Badge>
                      )}

                      {/* Registration time */}
                      <p className="text-xs text-muted-foreground">
                        Registrado el{' '}
                        {format(new Date(entry.created_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>

                    {/* Cancel button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCancelDialog(entry)}
                      disabled={isCanceling || entry.status === 'offer_pending'}
                      className="shrink-0"
                      title={entry.status === 'offer_pending' ? 'No puedes cancelar mientras tienes una oferta pendiente' : 'Cancelar registro'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info alert */}
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Nota:</strong> Las posiciones se actualizan automáticamente cada 30 segundos.
              Te notificaremos por email si se libera una plaza.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar registro en lista de espera?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cancelar tu registro en la lista de espera para:
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="font-semibold">
                  {entryToCancel?.parking_group?.name}
                </p>
                <p className="text-sm capitalize">
                  {entryToCancel && format(new Date(entryToCancel.reservation_date), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
                {entryToCancel?.queue_position && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Posición actual: #{entryToCancel.queue_position}
                  </p>
                )}
              </div>
              <p className="mt-3">
                Si cancelas, perderás tu posición en la cola y no recibirás notificaciones 
                si se libera una plaza para esta fecha.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>
              No, mantener registro
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelEntry}
              disabled={isCanceling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sí, cancelar registro'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
