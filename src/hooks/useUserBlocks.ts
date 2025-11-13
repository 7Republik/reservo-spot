import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserBlockWithWarning, InfractionCounts } from "@/types/profile";
import { toast } from "sonner";

/**
 * Return type for useUserBlocks hook
 */
export interface UseUserBlocksReturn {
  blocks: UserBlockWithWarning[];
  infractionCounts: InfractionCounts | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing user blocks and infractions
 * 
 * Handles:
 * - Loading active blocks for the current user
 * - Loading infraction counts (pending infractions not yet converted to warnings)
 * - Error handling and user feedback
 * - Loading and error states
 * 
 * @returns Blocks data, infraction counts, loading state, error state, and utility functions
 */
export const useUserBlocks = (): UseUserBlocksReturn => {
  const [blocks, setBlocks] = useState<UserBlockWithWarning[]>([]);
  const [infractionCounts, setInfractionCounts] = useState<InfractionCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Loads active blocks and infraction counts for the current user
   */
  const loadBlocksAndInfractions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      // Fetch active blocks with warning details
      const { data: blocksData, error: blocksError } = await supabase
        .from("user_blocks")
        .select(`
          *,
          warning:user_warnings(id, reason, issued_at)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gt("blocked_until", new Date().toISOString())
        .order("blocked_at", { ascending: false });

      if (blocksError) throw blocksError;

      // Cast to proper type
      const typedBlocks = (blocksData || []) as UserBlockWithWarning[];

      // Fetch infraction counts (pending infractions not yet converted to warnings)
      const { data: infractionData, error: infractionError } = await supabase
        .from("checkin_infractions")
        .select("infraction_type")
        .eq("user_id", user.id)
        .eq("warning_generated", false);

      if (infractionError) throw infractionError;

      // Count infractions by type
      const checkinCount = infractionData?.filter(i => i.infraction_type === 'checkin').length || 0;
      const checkoutCount = infractionData?.filter(i => i.infraction_type === 'checkout').length || 0;

      setBlocks(typedBlocks);
      setInfractionCounts({
        checkin_infractions: checkinCount,
        checkout_infractions: checkoutCount,
        total_infractions: checkinCount + checkoutCount
      });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Error desconocido");
      setError(errorObj);
      console.error("Error loading blocks and infractions:", err);
      toast.error("Error al cargar información de bloqueos");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refetch blocks and infractions data
   */
  const refetch = async () => {
    await loadBlocksAndInfractions();
  };

  // Load data on mount
  useEffect(() => {
    loadBlocksAndInfractions();
  }, []);

  return {
    blocks,
    infractionCounts,
    isLoading,
    error,
    refetch,
  };
};
