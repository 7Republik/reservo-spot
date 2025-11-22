import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BlockedDate } from "@/types/admin";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { offlineCache } from "@/lib/offlineCache";

/**
 * Custom hook for managing blocked dates (reservation blackouts)
 * 
 * Allows admins to block specific dates from reservations:
 * - Global blocks: Apply to all parking groups
 * - Group-specific blocks: Apply only to specific parking group
 * 
 * When a date is blocked, all existing active reservations for that date
 * are automatically cancelled via DB function.
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} Blocked dates state and operations
 * @returns {BlockedDate[]} blockedDates - Array of blocked dates with group info
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadBlockedDates - Loads blocked dates from DB (with cache)
 * @returns {Function} blockDate - Blocks a date globally or for specific group
 * @returns {Function} unblockDate - Unblocks a date
 * 
 * @example
 * ```tsx
 * const {
 *   blockedDates,
 *   loading,
 *   blockDate,
 *   unblockDate
 * } = useBlockedDates();
 * 
 * useEffect(() => {
 *   loadBlockedDates();
 * }, []);
 * 
 * const handleBlock = async () => {
 *   const success = await blockDate(
 *     new Date('2025-12-25'),
 *     'Christmas Day',
 *     null // null = global block
 *   );
 * };
 * ```
 */
export const useBlockedDates = () => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);
  const { isOnline } = useOfflineMode();

  const loadBlockedDates = async (forceReload = false) => {
    // Si ya está en caché y no se fuerza la recarga, no hacer nada
    if (isCached.current && !forceReload) {
      return;
    }

    const cacheKey = 'admin_blocked_dates';

    try {
      setLoading(true);

      // Si estamos offline, cargar desde cache
      if (!isOnline) {
        const cached = await offlineCache.get<BlockedDate[]>(cacheKey);
        if (cached) {
          setBlockedDates(cached);
          toast.warning("Funcionalidad limitada sin conexión", {
            description: "Solo puedes ver datos. Conéctate para realizar cambios."
          });
          isCached.current = true;
          return;
        }
        toast.error("No hay datos de fechas bloqueadas en caché");
        return;
      }

      // Modo online: cargar desde Supabase
      const { data, error } = await supabase
        .from("blocked_dates")
        .select(`
          *,
          parking_groups(name)
        `)
        .order("blocked_date", { ascending: true });

      if (error) throw error;
      setBlockedDates(data || []);
      
      // Cachear datos
      await offlineCache.set(cacheKey, data, {
        dataType: 'admin_blocked_dates',
        userId: 'admin'
      });
      
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading blocked dates:", error);
      
      // Si falla online, intentar cache
      const cached = await offlineCache.get<BlockedDate[]>(cacheKey);
      if (cached) {
        setBlockedDates(cached);
        toast.warning("Mostrando datos en caché", {
          description: "No se pudo conectar al servidor"
        });
        isCached.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  const blockDate = async (
    date: Date,
    reason: string,
    groupId: string | null
  ) => {
    if (!isOnline) {
      toast.error("No puedes bloquear fechas sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    try {
      const dateString = date.toISOString().split('T')[0];
      
      const { data: existingReservations } = await supabase
        .from("reservations")
        .select("id")
        .eq("reservation_date", dateString)
        .eq("status", "active");

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: blockError } = await supabase
        .from("blocked_dates")
        .insert({
          blocked_date: dateString,
          reason: reason,
          created_by: user?.id,
          group_id: groupId
        });

      if (blockError) throw blockError;

      if (existingReservations && existingReservations.length > 0) {
        const { error: cancelError } = await supabase.rpc(
          'cancel_reservations_for_blocked_date',
          {
            _blocked_date: dateString,
            _admin_id: user?.id
          }
        );

        if (cancelError) throw cancelError;
        
        toast.success(
          `Día bloqueado y ${existingReservations.length} reservas canceladas`,
          { duration: 5000 }
        );
      } else {
        toast.success("Día bloqueado correctamente");
      }

      await loadBlockedDates(true);
      return true;
    } catch (error: any) {
      console.error("Error blocking date:", error);
      toast.error("Error al bloquear el día");
      return false;
    }
  };

  const unblockDate = async (dateId: string) => {
    if (!isOnline) {
      toast.error("No puedes desbloquear fechas sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("id", dateId);

      if (error) throw error;
      toast.success("Día desbloqueado correctamente");
      await loadBlockedDates(true);
    } catch (error: any) {
      console.error("Error unblocking date:", error);
      toast.error("Error al desbloquear el día");
    }
  };

  // Sincronizar datos cuando se recupera la conexión
  useEffect(() => {
    if (isOnline) {
      console.log('[useBlockedDates] Sincronizando fechas bloqueadas...');
      loadBlockedDates(true); // forceReload = true
    }
  }, [isOnline]);

  return {
    blockedDates,
    loading,
    loadBlockedDates,
    blockDate,
    unblockDate,
    isOnline,
    canModify: isOnline,
  };
};
