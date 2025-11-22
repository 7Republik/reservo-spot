import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineCache } from '@/lib/offlineCache';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

// Tipos para acciones offline
export interface OfflineAction {
  id: string;
  type: 'checkin' | 'checkout' | 'cancel_reservation';
  data: any;
  timestamp: number;
}

// Estado de precarga
export type PreloadStatus = 'idle' | 'loading' | 'complete' | 'partial';

// Estado detallado de precarga
export interface PreloadResults {
  profile: boolean;
  plates: boolean;
  groups: boolean;
  todayReservation: boolean;
  upcomingReservations: boolean;
  maps: boolean;
}

// Interface del hook
export interface UseOfflineModeReturn {
  isOnline: boolean;
  lastSync: Date | null;
  pendingActions: number;
  preloadStatus: PreloadStatus;
  isPreloadComplete: boolean;
  preloadResults: PreloadResults | null;
  preloadData: () => Promise<void>;
  queueAction: (action: Omit<OfflineAction, 'id'>) => Promise<void>;
  syncPendingActions: () => Promise<void>;
}

export const useOfflineMode = (): UseOfflineModeReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingActions, setPendingActions] = useState(0);
  const [preloadStatus, setPreloadStatus] = useState<PreloadStatus>('idle');
  const [preloadResults, setPreloadResults] = useState<PreloadResults | null>(null);
  
  // Refs para control interno
  const preloadInProgress = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);

  // Detectar cambios de conexión con debounce de 5 segundos
  useEffect(() => {
    const handleOnline = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        setIsOnline(true);
        syncPendingActions();
      }, 5000);
    };
    
    const handleOffline = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        setIsOnline(false);
      }, 5000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Configurar BroadcastChannel para sincronización entre pestañas
  useEffect(() => {
    channel.current = new BroadcastChannel('reserveo_offline');
    
    channel.current.onmessage = (event) => {
      if (event.data.type === 'action_queued') {
        setPendingActions(prev => prev + 1);
      }
      
      if (event.data.type === 'sync_complete') {
        setPendingActions(0);
        preloadData();
      }
      
      if (event.data.type === 'connection_changed') {
        setIsOnline(event.data.isOnline);
      }
    };
    
    return () => {
      channel.current?.close();
    };
  }, []);

  // Notificar cambios de conexión a otras pestañas
  useEffect(() => {
    channel.current?.postMessage({
      type: 'connection_changed',
      isOnline,
    });
  }, [isOnline]);

  // Verificar precarga al montar y cargar contador de acciones pendientes
  // Requisito 1.8: Precarga al abrir la app (no solo al login)
  useEffect(() => {
    const checkPreload = async () => {
      // Inicializar offlineCache
      await offlineCache.init();
      
      const complete = await offlineCache.get<boolean>('preload_complete');
      const results = await offlineCache.get<PreloadResults>('preload_results');
      
      if (complete) {
        setPreloadStatus('complete');
      } else if (isOnline) {
        // Requisito 1.8: Precargar automáticamente al abrir la app
        preloadData();
      }
      
      if (results) {
        setPreloadResults(results);
      }
      
      // Cargar timestamp de última sincronización
      const lastSyncStr = await offlineCache.get<string>('last_sync');
      if (lastSyncStr) {
        setLastSync(new Date(lastSyncStr));
      }
      
      // Cargar contador de acciones pendientes
      const queue = await offlineCache.get<OfflineAction[]>('action_queue') || [];
      setPendingActions(queue.length);
      
      // Requisito 10.1: Limpiar datos antiguos automáticamente
      await offlineCache.cleanOldData();
    };
    
    checkPreload();
  }, []);

  // Precargar datos cuando hay conexión (pero no duplicar si ya se está precargando)
  // DESHABILITADO: La precarga automática causa errores 406 cuando el usuario no está autenticado
  // useEffect(() => {
  //   if (isOnline && preloadStatus === 'idle') {
  //     preloadData();
  //   }
  // }, [isOnline]);

  // Función de precarga de datos
  const preloadData = async () => {
    // Evitar múltiples precargas simultáneas
    if (preloadInProgress.current) {
      console.log('Preload already in progress');
      return;
    }
    
    if (!isOnline) {
      console.log('Cannot preload while offline');
      return;
    }
    
    preloadInProgress.current = true;
    setPreloadStatus('loading');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user authenticated');
        setPreloadStatus('idle');
        return;
      }
      
      const userId = user.id;
      
      // Objeto para rastrear resultados de precarga
      const preloadResults: PreloadResults = {
        profile: false,
        plates: false,
        groups: false,
        todayReservation: false,
        upcomingReservations: false,
        maps: false,
      };
      
      // Cargar datos independientemente con Promise.allSettled
      const results = await Promise.allSettled([
        // 1. Perfil
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              return offlineCache.set('profile', data);
            }
            throw error || new Error('No profile data');
          }),
        
        // 2. Matrículas
        supabase
          .from('license_plates')
          .select('*')
          .eq('user_id', userId)
          .eq('is_approved', true)
          .then(({ data, error }) => {
            if (!error) {
              return offlineCache.set('plates', data || []);
            }
            throw error;
          }),
        
        // 3. Grupos
        supabase
          .from('parking_groups')
          .select('*')
          .eq('is_active', true)
          .then(({ data, error }) => {
            if (!error) {
              return offlineCache.set('groups', data || []);
            }
            throw error;
          }),
        
        // 4. Reserva del día
        (async () => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const { data } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', userId)
            .eq('reservation_date', today)
            .eq('status', 'active')
            .single();
          
          // No es error si no hay reserva del día
          await offlineCache.set('today_reservation', data);
        })(),
        
        // 5. Reservas próximos 7 días
        (async () => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
          const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', userId)
            .gte('reservation_date', today)
            .lte('reservation_date', nextWeek)
            .eq('status', 'active');
          
          if (!error) {
            await offlineCache.set('upcoming_reservations', data || []);
            return data;
          }
          throw error;
        })(),
        
        // 6. Mapas de grupos con reservas
        (async () => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
          const { data: upcomingReservations, error } = await supabase
            .from('reservations')
            .select('spot_id, parking_spots(group_id)')
            .eq('user_id', userId)
            .gte('reservation_date', today)
            .lte('reservation_date', nextWeek)
            .eq('status', 'active');
          
          if (error) throw error;
          
          if (upcomingReservations && upcomingReservations.length > 0) {
            const groupIds = [...new Set(
              upcomingReservations
                .map(r => (r.parking_spots as any)?.group_id)
                .filter(Boolean)
            )];
            
            await Promise.all(
              groupIds.map(async (groupId) => {
                const { data: spots, error: spotsError } = await supabase
                  .from('parking_spots')
                  .select('*')
                  .eq('group_id', groupId)
                  .eq('is_active', true);
                
                if (!spotsError) {
                  await offlineCache.set(`spots_${groupId}`, spots || []);
                }
              })
            );
          }
        })(),
      ]);
      
      // Actualizar estado de precarga según resultados
      preloadResults.profile = results[0].status === 'fulfilled';
      preloadResults.plates = results[1].status === 'fulfilled';
      preloadResults.groups = results[2].status === 'fulfilled';
      preloadResults.todayReservation = results[3].status === 'fulfilled';
      preloadResults.upcomingReservations = results[4].status === 'fulfilled';
      preloadResults.maps = results[5].status === 'fulfilled';
      
      // Guardar estado de precarga
      await offlineCache.set('preload_results', preloadResults);
      setPreloadResults(preloadResults);
      
      // Contar éxitos
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const totalCount = results.length;
      
      // Actualizar estado según resultado
      if (successCount === totalCount) {
        setPreloadStatus('complete');
        await offlineCache.set('preload_complete', true);
        // Solo mostrar toast si es la primera vez en esta sesión
        const toastShown = sessionStorage.getItem('preload_toast_shown');
        if (!toastShown) {
          toast.success('Datos preparados para modo offline');
          sessionStorage.setItem('preload_toast_shown', 'true');
        }
      } else if (successCount > 0) {
        setPreloadStatus('partial');
        await offlineCache.set('preload_complete', false);
        const toastShown = sessionStorage.getItem('preload_toast_shown');
        if (!toastShown) {
          toast.warning(`${successCount}/${totalCount} datos preparados. Algunos pueden no estar disponibles offline.`);
          sessionStorage.setItem('preload_toast_shown', 'true');
        }
      } else {
        setPreloadStatus('idle');
        await offlineCache.set('preload_complete', false);
        const toastShown = sessionStorage.getItem('preload_toast_shown');
        if (!toastShown) {
          toast.error('No se pudieron preparar datos offline. Necesitarás conexión.');
          sessionStorage.setItem('preload_toast_shown', 'true');
        }
      }
      
      // Guardar timestamp de última sincronización
      const now = new Date();
      setLastSync(now);
      await offlineCache.set('last_sync', now.toISOString());
      
    } catch (error) {
      console.error('Preload failed:', error);
      setPreloadStatus('idle');
      // No mostrar error al usuario, solo log
    } finally {
      preloadInProgress.current = false;
    }
  };

  // Añadir acción a la cola
  const queueAction = async (action: Omit<OfflineAction, 'id'>) => {
    const actionWithId: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
    };
    
    // Obtener cola actual
    const queue = await offlineCache.get<OfflineAction[]>('action_queue') || [];
    
    // Añadir nueva acción
    queue.push(actionWithId);
    
    // Guardar cola actualizada
    await offlineCache.set('action_queue', queue);
    
    setPendingActions(queue.length);
    
    // Notificar a otras pestañas
    channel.current?.postMessage({
      type: 'action_queued',
      action: actionWithId,
    });
    
    // Si estamos online, sincronizar inmediatamente
    if (isOnline) {
      await syncPendingActions();
    }
  };

  // Sincronizar acciones pendientes con validación de conflictos
  const syncPendingActions = async () => {
    if (!isOnline) return;
    
    const queue = await offlineCache.get<OfflineAction[]>('action_queue') || [];
    if (queue.length === 0) return;
    
    const failedActions: OfflineAction[] = [];
    const conflictActions: OfflineAction[] = [];
    let successCount = 0;
    
    for (const action of queue) {
      try {
        // Validar que la acción sigue siendo válida antes de ejecutar
        let isValid = true;
        let conflictReason = '';
        
        if (action.type === 'checkin' || action.type === 'checkout') {
          // Verificar que la reserva sigue activa
          const { data: reservation, error } = await supabase
            .from('reservations')
            .select('status, reservation_date')
            .eq('id', action.data.reservationId)
            .single();
          
          if (error || !reservation) {
            isValid = false;
            conflictReason = 'La reserva ya no existe';
          } else if (reservation.status !== 'active') {
            isValid = false;
            conflictReason = `La reserva ya no está activa (estado: ${reservation.status})`;
          }
          
          if (!isValid) {
            conflictActions.push(action);
            const actionName = action.type === 'checkin' ? 'check-in' : 'check-out';
            toast.error(`No se pudo hacer ${actionName}: ${conflictReason}`);
            continue;
          }
        }
        
        if (action.type === 'cancel_reservation') {
          // Verificar que la reserva no está ya cancelada
          const { data: reservation, error } = await supabase
            .from('reservations')
            .select('status')
            .eq('id', action.data.reservationId)
            .single();
          
          if (error || !reservation) {
            isValid = false;
            conflictReason = 'La reserva ya no existe';
          } else if (reservation.status === 'cancelled') {
            isValid = false;
            conflictReason = 'La reserva ya estaba cancelada';
          }
          
          if (!isValid) {
            conflictActions.push(action);
            // Para cancelaciones ya hechas, es un warning no un error
            if (conflictReason === 'La reserva ya estaba cancelada') {
              toast.warning(conflictReason);
            } else {
              toast.error(`No se pudo cancelar: ${conflictReason}`);
            }
            continue;
          }
        }
        
        // Si la acción es válida, ejecutarla
        switch (action.type) {
          case 'checkin':
            await supabase.rpc('perform_checkin', {
              p_reservation_id: action.data.reservationId,
              p_user_id: action.data.userId,
            });
            break;
            
          case 'checkout':
            await supabase.rpc('perform_checkout', {
              p_reservation_id: action.data.reservationId,
              p_user_id: action.data.userId,
            });
            break;
            
          case 'cancel_reservation':
            await supabase
              .from('reservations')
              .update({ 
                status: 'cancelled', 
                cancelled_at: new Date().toISOString() 
              })
              .eq('id', action.data.reservationId);
            break;
        }
        
        successCount++;
        
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failedActions.push(action);
      }
    }
    
    // Actualizar cola solo con acciones que fallaron (no conflictos)
    await offlineCache.set('action_queue', failedActions);
    setPendingActions(failedActions.length);
    
    // Mostrar feedback específico según resultados
    if (conflictActions.length > 0) {
      toast.warning(
        `${conflictActions.length} ${conflictActions.length === 1 ? 'acción' : 'acciones'} no se ${conflictActions.length === 1 ? 'pudo' : 'pudieron'} aplicar por cambios en el servidor`
      );
    }
    
    if (successCount > 0) {
      toast.success(
        `${successCount} ${successCount === 1 ? 'acción sincronizada' : 'acciones sincronizadas'} correctamente`
      );
    }
    
    if (failedActions.length > 0) {
      toast.error(
        `${failedActions.length} ${failedActions.length === 1 ? 'acción falló' : 'acciones fallaron'}. Se reintentará más tarde.`
      );
    }
    
    // Si hubo éxitos o conflictos resueltos, recargar datos frescos
    if (successCount > 0 || conflictActions.length > 0) {
      await preloadData();
      
      // Notificar a otras pestañas
      channel.current?.postMessage({
        type: 'sync_complete',
      });
    }
  };

  return {
    isOnline,
    lastSync,
    pendingActions,
    preloadStatus,
    isPreloadComplete: preloadStatus === 'complete',
    preloadResults,
    preloadData,
    queueAction,
    syncPendingActions,
  };
};
