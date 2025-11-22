import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useOfflineMode } from "./useOfflineMode";
import { offlineCache } from "@/lib/offlineCache";
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Group with calculated availability metrics
 */
export interface GroupWithAvailability {
  id: string;
  name: string;
  description: string | null;
  totalSpots: number;
  occupiedSpots: number;
  availableSpots: number;
  occupancyRate: number;
  lastUsedSpot?: {
    id: string;
    spotNumber: string;
    isAvailableNow: boolean;
  };
  randomAvailableSpot?: {
    id: string;
    spotNumber: string;
  };
}

/**
 * Custom hook for managing group selection and availability
 * 
 * Loads parking groups with real-time availability data,
 * including last used spots and random available spots for quick reservations.
 * 
 * @param isOpen - Whether the modal is open
 * @param selectedDate - The date to check availability for
 * @param userGroups - Array of group IDs the user has access to
 * @param userId - Current user ID
 * @returns Groups data, loading state, and utility functions
 */
export const useGroupSelection = (
  isOpen: boolean,
  selectedDate: Date | null,
  userGroups: string[],
  userId: string
) => {
  const [groups, setGroups] = useState<GroupWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline, lastSyncTime } = useOfflineMode();

  /**
   * Loads all groups with availability metrics for the selected date
   */
  const loadGroupsWithAvailability = useCallback(async () => {
    try {
      setLoading(true);
      
      // Si no hay grupos asignados, retornar vacío sin error
      if (!userGroups || userGroups.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const cacheKey = `groups_${userId}_${dateStr}`;

      // Modo offline: cargar desde cache
      if (!isOnline) {
        const cached = await offlineCache.get<GroupWithAvailability[]>(cacheKey);
        if (cached) {
          setGroups(cached);
        } else {
          // No mostrar error, solo retornar vacío
          setGroups([]);
        }
        setLoading(false);
        return;
      }

      // Modo online: cargar desde servidor
      const groupsData: GroupWithAvailability[] = [];

      for (const groupId of userGroups) {
        // Get group info
        const { data: group, error: groupError } = await supabase
          .from("parking_groups")
          .select("id, name, description")
          .eq("id", groupId)
          .eq("is_active", true)
          .maybeSingle();

        if (groupError || !group) continue;

        // Get total active spots
        const { data: spots, error: spotsError } = await supabase
          .from("parking_spots")
          .select("id")
          .eq("group_id", groupId)
          .eq("is_active", true);

        if (spotsError) continue;

        const totalSpots = spots?.length || 0;

        // Get occupied spots for the date
        const { data: reservations, error: reservationsError } = await supabase
          .from("reservations")
          .select("spot_id")
          .eq("reservation_date", dateStr)
          .eq("status", "active")
          .in("spot_id", spots?.map(s => s.id) || []);

        if (reservationsError) continue;

        // Get spots with pending waitlist offers
        const { data: pendingOffers, error: offersError } = await supabase
          .from("waitlist_offers")
          .select(`
            spot_id,
            waitlist_entries!inner (
              reservation_date,
              group_id
            )
          `)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .eq("waitlist_entries.reservation_date", dateStr)
          .eq("waitlist_entries.group_id", groupId)
          .in("spot_id", spots?.map(s => s.id) || []);

        if (offersError) {
          console.error(`[useGroupSelection] Error loading pending offers:`, offersError);
        }

        const occupiedByReservations = reservations?.length || 0;
        const occupiedByOffers = pendingOffers?.length || 0;
        const occupiedSpots = occupiedByReservations + occupiedByOffers;
        const availableSpots = totalSpots - occupiedSpots;
        const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

        // Debug log
        console.log(`[useGroupSelection] Group ${group.name}:`, {
          totalSpots,
          occupiedByReservations,
          occupiedByOffers,
          occupiedSpots,
          availableSpots,
          date: dateStr,
          reservations: reservations?.map(r => r.spot_id),
          pendingOffers: pendingOffers?.map(o => o.spot_id)
        });

        // Find last used spot by user in this group
        const { data: lastReservation } = await supabase
          .from("reservations")
          .select(`
            spot_id,
            parking_spots!inner (
              id,
              spot_number,
              group_id
            )
          `)
          .eq("user_id", userId)
          .eq("parking_spots.group_id", groupId)
          .eq("status", "active")
          .order("reservation_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        let lastUsedSpot = undefined;
        if (lastReservation && lastReservation.parking_spots) {
          const spotData = lastReservation.parking_spots as any;
          const spotId = spotData.id;
          const spotNumber = spotData.spot_number;
          
          // Check if it's available for the selected date
          const isOccupied = reservations?.some(r => r.spot_id === spotId);
          
          if (!isOccupied) {
            lastUsedSpot = {
              id: spotId,
              spotNumber: spotNumber,
              isAvailableNow: true
            };
          }
        }

        // Get a random available spot
        let randomAvailableSpot = undefined;
        if (availableSpots > 0) {
          const availableSpotsData = spots?.filter(s => !reservations?.some(r => r.spot_id === s.id)) || [];
          
          if (availableSpotsData.length > 0) {
            const randomSpot = availableSpotsData[Math.floor(Math.random() * availableSpotsData.length)];
            const { data: randomSpotDetail } = await supabase
              .from("parking_spots")
              .select("id, spot_number")
              .eq("id", randomSpot.id)
              .single();
            
            if (randomSpotDetail) {
              randomAvailableSpot = {
                id: randomSpotDetail.id,
                spotNumber: randomSpotDetail.spot_number
              };
            }
          }
        }

        groupsData.push({
          id: group.id,
          name: group.name,
          description: group.description,
          totalSpots,
          occupiedSpots,
          availableSpots,
          occupancyRate,
          lastUsedSpot,
          randomAvailableSpot,
        });
      }

      setGroups(groupsData);

      // Cachear datos cargados
      await offlineCache.set(cacheKey, groupsData, {
        dataType: 'groups',
        userId
      });
    } catch (error) {
      console.error("Error loading groups:", error);
      
      // Si falla online, intentar cache como fallback
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const cacheKey = `groups_${userId}_${dateStr}`;
      const cached = await offlineCache.get<GroupWithAvailability[]>(cacheKey);
      
      if (cached) {
        setGroups(cached);
        toast.warning("Mostrando datos en caché");
      } else {
        toast.error("Error al cargar los grupos");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, userGroups, userId, isOnline]);

  // Load groups when modal opens or dependencies change
  useEffect(() => {
    if (isOpen && selectedDate && userGroups.length > 0) {
      // Siempre recargar cuando se abre el modal para tener datos frescos
      loadGroupsWithAvailability();
    }
  }, [isOpen, selectedDate, userGroups, loadGroupsWithAvailability]);

  // Sincronizar datos cuando se recupera la conexión
  useEffect(() => {
    if (isOnline && isOpen && selectedDate && userGroups.length > 0) {
      console.log('[useGroupSelection] Sincronizando grupos...');
      loadGroupsWithAvailability();
    }
  }, [isOnline, isOpen, selectedDate, userGroups, loadGroupsWithAvailability]);

  /**
   * Returns color class based on occupancy rate
   */
  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-red-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  /**
   * Returns progress bar color class based on occupancy rate
   */
  const getProgressColor = (rate: number) => {
    if (rate >= 80) return "bg-red-500";
    if (rate >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Real-time subscription to reservations changes
  useEffect(() => {
    if (!isOpen || !selectedDate || userGroups.length === 0) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        channel = supabase
          .channel('group-selection-reservations')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'reservations'
            },
            (payload) => {
              console.log('[useGroupSelection] Reservation change detected, reloading groups');
              loadGroupsWithAvailability();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[useGroupSelection] Subscribed to reservations updates');
            }
          });
      } catch (err) {
        console.error('[useGroupSelection] Error setting up subscription:', err);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen, selectedDate, userGroups, loadGroupsWithAvailability]);

  return {
    groups,
    loading,
    getOccupancyColor,
    getProgressColor,
    isOnline,
    lastSyncTime,
  };
};
