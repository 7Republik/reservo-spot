import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BlockedDate } from "@/types/admin";

export const useBlockedDates = () => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  const loadBlockedDates = async (forceReload = false) => {
    // Si ya está en caché y no se fuerza la recarga, no hacer nada
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blocked_dates")
        .select(`
          *,
          parking_groups(name)
        `)
        .order("blocked_date", { ascending: true });

      if (error) throw error;
      setBlockedDates(data || []);
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading blocked dates:", error);
    } finally {
      setLoading(false);
    }
  };

  const blockDate = async (
    date: Date,
    reason: string,
    groupId: string | null
  ) => {
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

  return {
    blockedDates,
    loading,
    loadBlockedDates,
    blockDate,
    unblockDate,
  };
};
