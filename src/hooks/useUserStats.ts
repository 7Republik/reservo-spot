import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserStatistics } from "@/types/profile";
import { toast } from "sonner";

/**
 * Return type for useUserStats hook
 */
export interface UseUserStatsReturn {
  stats: UserStatistics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching user statistics
 * 
 * Fetches all user statistics in parallel for optimal performance:
 * - Total reservations count
 * - Active (future) reservations count
 * - Last reservation date
 * - Total license plates count
 * - Approved license plates count
 * - Total warnings count
 * - Member since date
 * 
 * @returns Statistics data, loading state, error state, and refetch function
 */
export const useUserStats = (): UseUserStatsReturn => {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Loads all user statistics using parallel queries for optimal performance
   */
  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      // Execute all queries in parallel using Promise.all
      const [
        totalReservationsResult,
        activeReservationsResult,
        lastReservationResult,
        totalPlatesResult,
        approvedPlatesResult,
        warningCountResult,
        profileResult,
      ] = await Promise.all([
        // Total reservations count
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),

        // Active reservations (future dates with active status)
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("reservation_date", new Date().toISOString().split("T")[0]),

        // Last reservation date
        supabase
          .from("reservations")
          .select("reservation_date")
          .eq("user_id", user.id)
          .order("reservation_date", { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Total license plates (excluding deleted)
        supabase
          .from("license_plates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("deleted_at", null),

        // Approved license plates (excluding deleted)
        supabase
          .from("license_plates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_approved", true)
          .is("deleted_at", null),

        // Total warnings using existing RPC function
        supabase.rpc("get_user_warning_count", { _user_id: user.id }),

        // Profile creation date (member since)
        supabase
          .from("profiles")
          .select("created_at")
          .eq("id", user.id)
          .single(),
      ]);

      // Check for errors in any of the queries
      if (totalReservationsResult.error) throw totalReservationsResult.error;
      if (activeReservationsResult.error) throw activeReservationsResult.error;
      if (lastReservationResult.error && lastReservationResult.error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is acceptable
        throw lastReservationResult.error;
      }
      if (totalPlatesResult.error) throw totalPlatesResult.error;
      if (approvedPlatesResult.error) throw approvedPlatesResult.error;
      if (warningCountResult.error) throw warningCountResult.error;
      if (profileResult.error) throw profileResult.error;

      // Construct statistics object
      const statistics: UserStatistics = {
        total_reservations: totalReservationsResult.count || 0,
        active_reservations: activeReservationsResult.count || 0,
        last_reservation_date: lastReservationResult.data?.reservation_date || null,
        total_license_plates: totalPlatesResult.count || 0,
        approved_license_plates: approvedPlatesResult.count || 0,
        total_warnings: warningCountResult.data || 0,
        member_since: profileResult.data.created_at,
      };

      setStats(statistics);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Error desconocido");
      setError(errorObj);
      console.error("Error loading user statistics:", err);
      toast.error("Error al cargar estadísticas");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refetch statistics data
   */
  const refetch = async () => {
    await loadStats();
  };

  // Load statistics on mount
  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
};
