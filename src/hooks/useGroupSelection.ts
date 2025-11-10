import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

  useEffect(() => {
    if (isOpen && selectedDate && userGroups.length > 0) {
      loadGroupsWithAvailability();
    }
  }, [isOpen, selectedDate, userGroups]);

  /**
   * Loads all groups with availability metrics for the selected date
   */
  const loadGroupsWithAvailability = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate!, "yyyy-MM-dd");

      const groupsData: GroupWithAvailability[] = [];

      for (const groupId of userGroups) {
        // Get group info
        const { data: group, error: groupError } = await supabase
          .from("parking_groups")
          .select("id, name, description")
          .eq("id", groupId)
          .eq("is_active", true)
          .single();

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

        const occupiedSpots = reservations?.length || 0;
        const availableSpots = totalSpots - occupiedSpots;
        const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

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
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Error al cargar los grupos");
    } finally {
      setLoading(false);
    }
  };

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

  return {
    groups,
    loading,
    getOccupancyColor,
    getProgressColor,
  };
};
