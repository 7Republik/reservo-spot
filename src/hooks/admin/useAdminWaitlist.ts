import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  AdminWaitlistStats,
  WaitlistEntryWithDetails,
  WaitlistLogWithDetails,
  WaitlistLogsFilter,
} from "@/types/waitlist";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { OfflineStorageService } from "@/lib/offlineStorage";

/**
 * Custom hook for admin management of waitlist system
 * 
 * Provides comprehensive waitlist administration including:
 * - Global statistics and metrics
 * - Viewing waitlist entries by group and date
 * - Manual removal of waitlist entries
 * - Audit logs with filtering
 * - CSV export of logs
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} Admin waitlist state and operations
 * @returns {AdminWaitlistStats|null} stats - Global waitlist statistics
 * @returns {WaitlistEntryWithDetails[]} entries - Waitlist entries for specific group/date
 * @returns {WaitlistLogWithDetails[]} logs - Audit logs with filters
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} getWaitlistStats - Loads global statistics
 * @returns {Function} getWaitlistByGroup - Loads entries for specific group and date
 * @returns {Function} removeWaitlistEntry - Manually removes an entry
 * @returns {Function} getWaitlistLogs - Loads audit logs with filters
 * @returns {Function} exportWaitlistLogs - Exports logs to CSV
 * 
 * @example
 * ```tsx
 * const {
 *   stats,
 *   entries,
 *   getWaitlistStats,
 *   getWaitlistByGroup,
 *   removeWaitlistEntry
 * } = useAdminWaitlist();
 * 
 * useEffect(() => {
 *   getWaitlistStats();
 * }, []);
 * 
 * const handleRemove = async (entryId: string) => {
 *   const success = await removeWaitlistEntry(entryId);
 *   if (success) {
 *     // Entries automatically reloaded
 *   }
 * };
 * ```
 */
export const useAdminWaitlist = () => {
  const [stats, setStats] = useState<AdminWaitlistStats | null>(null);
  const [entries, setEntries] = useState<WaitlistEntryWithDetails[]>([]);
  const [logs, setLogs] = useState<WaitlistLogWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  
  const statsCache = useRef(false);
  const entriesCache = useRef<{ groupId: string; date: string } | null>(null);
  const logsCache = useRef<WaitlistLogsFilter | null>(null);
  
  const { isOnline } = useOfflineMode();
  const storage = new OfflineStorageService();

  /**
   * Loads global waitlist statistics
   * 
   * Calculates:
   * - Total active entries
   * - Total pending offers
   * - Total unique users in waitlist
   * - Acceptance/rejection/expiration rates
   * - Average wait time
   * - Entries by group
   * - Offers by status
   * 
   * @param {boolean} forceReload - If true, bypasses cache and fetches fresh data
   * @returns {Promise<void>}
   */
  const getWaitlistStats = async (forceReload = false) => {
    if (statsCache.current && !forceReload) {
      return;
    }

    const cacheKey = 'admin_waitlist_stats';

    try {
      setLoading(true);

      if (!isOnline) {
        const cached = await storage.get<AdminWaitlistStats>(cacheKey);
        if (cached) {
          setStats(cached);
          toast.warning("Mostrando estadísticas en caché", {
            description: "Conéctate para ver datos actualizados"
          });
          statsCache.current = true;
          return;
        }
        toast.error("No hay estadísticas en caché");
        return;
      }

      // Get total active entries
      const { count: totalActiveEntries } = await supabase
        .from("waitlist_entries")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get total pending offers
      const { count: totalPendingOffers } = await supabase
        .from("waitlist_offers")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get unique users in waitlist
      const { data: uniqueUsers } = await supabase
        .from("waitlist_entries")
        .select("user_id")
        .eq("status", "active");

      const totalUsersInWaitlist = new Set(uniqueUsers?.map(u => u.user_id) || []).size;

      // Get offer statistics
      const { data: allOffers } = await supabase
        .from("waitlist_offers")
        .select("status");

      const totalOffers = allOffers?.length || 0;
      const acceptedOffers = allOffers?.filter(o => o.status === "accepted").length || 0;
      const rejectedOffers = allOffers?.filter(o => o.status === "rejected").length || 0;
      const expiredOffers = allOffers?.filter(o => o.status === "expired").length || 0;

      const acceptanceRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;
      const rejectionRate = totalOffers > 0 ? (rejectedOffers / totalOffers) * 100 : 0;
      const expirationRate = totalOffers > 0 ? (expiredOffers / totalOffers) * 100 : 0;

      // Get average wait time (from entry creation to offer creation)
      const { data: completedEntries } = await supabase
        .from("waitlist_entries")
        .select("created_at, updated_at")
        .eq("status", "completed");

      let averageWaitTime = 0;
      if (completedEntries && completedEntries.length > 0) {
        const totalWaitMs = completedEntries.reduce((sum, entry) => {
          const created = new Date(entry.created_at).getTime();
          const updated = new Date(entry.updated_at).getTime();
          return sum + (updated - created);
        }, 0);
        averageWaitTime = totalWaitMs / completedEntries.length / (1000 * 60 * 60); // Convert to hours
      }

      // Get entries by group
      const { data: entriesByGroupData } = await supabase
        .from("waitlist_entries")
        .select(`
          group_id,
          parking_groups!inner(id, name)
        `)
        .eq("status", "active");

      const groupCounts = new Map<string, { groupId: string; groupName: string; count: number }>();
      entriesByGroupData?.forEach((entry: any) => {
        const groupId = entry.group_id;
        const groupName = entry.parking_groups.name;
        const existing = groupCounts.get(groupId);
        if (existing) {
          existing.count++;
        } else {
          groupCounts.set(groupId, { groupId, groupName, count: 1 });
        }
      });

      const entriesByGroup = Array.from(groupCounts.values());

      // Get offers by status
      const offersByStatus = [
        { status: "pending" as const, count: allOffers?.filter(o => o.status === "pending").length || 0 },
        { status: "accepted" as const, count: acceptedOffers },
        { status: "rejected" as const, count: rejectedOffers },
        { status: "expired" as const, count: expiredOffers },
      ];

      const statsData: AdminWaitlistStats = {
        totalActiveEntries: totalActiveEntries || 0,
        totalPendingOffers: totalPendingOffers || 0,
        totalUsersInWaitlist,
        acceptanceRate,
        rejectionRate,
        expirationRate,
        averageWaitTime,
        entriesByGroup,
        offersByStatus,
      };

      setStats(statsData);

      // Cache data
      await storage.set(cacheKey, statsData, {
        dataType: 'admin_waitlist_stats',
        userId: 'admin'
      });
      await storage.recordSync(cacheKey);

      statsCache.current = true;
    } catch (error: any) {
      console.error("Error loading waitlist stats:", error);

      const cached = await storage.get<AdminWaitlistStats>(cacheKey);
      if (cached) {
        setStats(cached);
        toast.warning("Mostrando estadísticas en caché", {
          description: "No se pudo conectar al servidor"
        });
        statsCache.current = true;
      } else {
        toast.error("Error al cargar estadísticas de lista de espera");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads waitlist entries for a specific group and date
   * 
   * @param {string} groupId - Parking group UUID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {boolean} forceReload - If true, bypasses cache
   * @returns {Promise<void>}
   */
  const getWaitlistByGroup = async (groupId: string, date: string, forceReload = false) => {
    if (
      entriesCache.current &&
      entriesCache.current.groupId === groupId &&
      entriesCache.current.date === date &&
      !forceReload
    ) {
      return;
    }

    const cacheKey = `admin_waitlist_entries_${groupId}_${date}`;

    try {
      setLoading(true);

      if (!isOnline) {
        const cached = await storage.get<WaitlistEntryWithDetails[]>(cacheKey);
        if (cached) {
          setEntries(cached);
          toast.warning("Mostrando entradas en caché", {
            description: "Conéctate para ver datos actualizados"
          });
          entriesCache.current = { groupId, date };
          return;
        }
        toast.error("No hay entradas en caché");
        return;
      }

      // Get waitlist entries with parking group info
      const { data: entriesData, error: entriesError } = await supabase
        .from("waitlist_entries")
        .select(`
          *,
          parking_groups!inner(id, name, description)
        `)
        .eq("group_id", groupId)
        .eq("reservation_date", date)
        .eq("status", "active")
        .order("created_at", { ascending: true });

      if (entriesError) throw entriesError;

      // Get user profiles for all entries
      const userIds = (entriesData || []).map((entry: any) => entry.user_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by id for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map((profile: any) => [profile.id, profile])
      );

      // Combine entries with their user profiles
      const entriesWithDetails: WaitlistEntryWithDetails[] = (entriesData || []).map((entry: any) => ({
        ...entry,
        parking_group: entry.parking_groups,
        user: profilesMap.get(entry.user_id) || null,
      }));

      setEntries(entriesWithDetails);

      // Cache data
      await storage.set(cacheKey, entriesWithDetails, {
        dataType: 'admin_waitlist_entries',
        userId: 'admin'
      });
      await storage.recordSync(cacheKey);

      entriesCache.current = { groupId, date };
    } catch (error: any) {
      console.error("Error loading waitlist entries:", error);

      const cached = await storage.get<WaitlistEntryWithDetails[]>(cacheKey);
      if (cached) {
        setEntries(cached);
        toast.warning("Mostrando entradas en caché", {
          description: "No se pudo conectar al servidor"
        });
        entriesCache.current = { groupId, date };
      } else {
        toast.error("Error al cargar entradas de lista de espera");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manually removes a waitlist entry
   * 
   * This cancels the user's registration in the waitlist.
   * 
   * @param {string} entryId - Waitlist entry UUID to remove
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const removeWaitlistEntry = async (entryId: string) => {
    if (!isOnline) {
      toast.error("No puedes eliminar entradas sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    try {
      // Get entry details for logging
      const { data: entry } = await supabase
        .from("waitlist_entries")
        .select("user_id, group_id, reservation_date")
        .eq("id", entryId)
        .single();

      if (!entry) {
        toast.error("Entrada no encontrada");
        return false;
      }

      // Delete the entry
      const { error: deleteError } = await supabase
        .from("waitlist_entries")
        .delete()
        .eq("id", entryId);

      if (deleteError) throw deleteError;

      // Log the action
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("waitlist_logs")
        .insert({
          user_id: entry.user_id,
          entry_id: entryId,
          action: "entry_cancelled",
          details: {
            cancelled_by: "admin",
            admin_id: user?.id,
            group_id: entry.group_id,
            reservation_date: entry.reservation_date,
            reason: "Eliminado manualmente por administrador",
          },
        });

      toast.success("Entrada eliminada correctamente");

      // Invalidate caches
      statsCache.current = false;
      entriesCache.current = null;

      // Reload data
      await getWaitlistStats(true);
      
      return true;
    } catch (error: any) {
      console.error("Error removing waitlist entry:", error);
      toast.error("Error al eliminar entrada");
      return false;
    }
  };

  /**
   * Loads audit logs with optional filters
   * 
   * @param {WaitlistLogsFilter} filters - Filter criteria
   * @param {boolean} forceReload - If true, bypasses cache
   * @returns {Promise<void>}
   */
  const getWaitlistLogs = async (filters: WaitlistLogsFilter = {}, forceReload = false) => {
    if (
      logsCache.current &&
      JSON.stringify(logsCache.current) === JSON.stringify(filters) &&
      !forceReload
    ) {
      return;
    }

    const cacheKey = `admin_waitlist_logs_${JSON.stringify(filters)}`;

    try {
      setLoading(true);

      if (!isOnline) {
        const cached = await storage.get<WaitlistLogWithDetails[]>(cacheKey);
        if (cached) {
          setLogs(cached);
          toast.warning("Mostrando logs en caché", {
            description: "Conéctate para ver datos actualizados"
          });
          logsCache.current = filters;
          return;
        }
        toast.error("No hay logs en caché");
        return;
      }

      let query = supabase
        .from("waitlist_logs")
        .select(`
          *,
          profiles(id, full_name, email),
          waitlist_entries(id, group_id, reservation_date),
          waitlist_offers(id, spot_id, status)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.action) {
        query = query.eq("action", filters.action);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const logsWithDetails: WaitlistLogWithDetails[] = (data || []).map((log: any) => ({
        ...log,
        user: log.profiles,
        waitlist_entry: log.waitlist_entries,
        waitlist_offer: log.waitlist_offers,
      }));

      setLogs(logsWithDetails);

      // Cache data
      await storage.set(cacheKey, logsWithDetails, {
        dataType: 'admin_waitlist_logs',
        userId: 'admin'
      });
      await storage.recordSync(cacheKey);

      logsCache.current = filters;
    } catch (error: any) {
      console.error("Error loading waitlist logs:", error);

      const cached = await storage.get<WaitlistLogWithDetails[]>(cacheKey);
      if (cached) {
        setLogs(cached);
        toast.warning("Mostrando logs en caché", {
          description: "No se pudo conectar al servidor"
        });
        logsCache.current = filters;
      } else {
        toast.error("Error al cargar logs de lista de espera");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exports waitlist logs to CSV format
   * 
   * @param {WaitlistLogsFilter} filters - Filter criteria for export
   * @returns {Promise<void>}
   */
  const exportWaitlistLogs = async (filters: WaitlistLogsFilter = {}) => {
    if (!isOnline) {
      toast.error("No puedes exportar logs sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return;
    }

    try {
      // Load logs with filters (no limit for export)
      let query = supabase
        .from("waitlist_logs")
        .select(`
          *,
          profiles(id, full_name, email),
          waitlist_entries(id, group_id, reservation_date),
          waitlist_offers(id, spot_id, status)
        `)
        .order("created_at", { ascending: false });

      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.action) {
        query = query.eq("action", filters.action);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning("No hay logs para exportar");
        return;
      }

      // Generate CSV
      const headers = [
        "Fecha/Hora",
        "Acción",
        "Usuario",
        "Email",
        "Grupo",
        "Fecha Reserva",
        "Detalles",
      ];

      const rows = data.map((log: any) => [
        new Date(log.created_at).toLocaleString("es-ES"),
        log.action,
        log.profiles?.full_name || "N/A",
        log.profiles?.email || "N/A",
        log.waitlist_entries?.group_id || "N/A",
        log.waitlist_entries?.reservation_date || "N/A",
        JSON.stringify(log.details || {}),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `waitlist_logs_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Logs exportados correctamente");
    } catch (error: any) {
      console.error("Error exporting waitlist logs:", error);
      toast.error("Error al exportar logs");
    }
  };

  // Sync data when connection is restored
  useOfflineSync(
    () => {
      console.log('[useAdminWaitlist] Controles re-habilitados');
    },
    () => {
      console.log('[useAdminWaitlist] Sincronizando datos de lista de espera...');
      getWaitlistStats(true);
    }
  );

  return {
    stats,
    entries,
    logs,
    loading,
    getWaitlistStats,
    getWaitlistByGroup,
    removeWaitlistEntry,
    getWaitlistLogs,
    exportWaitlistLogs,
    isOnline,
    canModify: isOnline,
  };
};
