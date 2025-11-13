import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserWarningWithDetails } from "@/types/profile";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Options for useUserWarnings hook
 */
export interface UseUserWarningsOptions {
  markAsViewed?: boolean;
  filter?: "all" | "viewed" | "unviewed";
}

/**
 * Return type for useUserWarnings hook
 */
export interface UseUserWarningsReturn {
  warnings: UserWarningWithDetails[];
  unviewedCount: number;
  isLoading: boolean;
  error: Error | null;
  markAllAsViewed: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing user warnings with realtime updates
 * 
 * Features:
 * - Load warnings with filter support (all/viewed/unviewed)
 * - Mark warnings as viewed
 * - Realtime subscription for new warnings
 * - Toast notifications for new warnings
 * - Unviewed count calculation
 * 
 * @param options - Configuration options
 * @returns Warnings data, loading state, error state, and utility functions
 */
export const useUserWarnings = (
  options: UseUserWarningsOptions = {}
): UseUserWarningsReturn => {
  const { markAsViewed = false, filter = "all" } = options;
  
  const [warnings, setWarnings] = useState<UserWarningWithDetails[]>([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Loads warnings from Supabase with optional filtering
   */
  const loadWarnings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      setUserId(user.id);

      // Build query with joins (sin el issuer porque issued_by referencia auth.users)
      let query = supabase
        .from("user_warnings")
        .select(`
          *,
          incident:incident_reports(
            id,
            description,
            photo_url,
            created_at,
            status,
            spot:parking_spots!incident_reports_original_spot_id_fkey(spot_number)
          )
        `)
        .eq("user_id", user.id);

      // Apply filter
      if (filter === "viewed") {
        query = query.not("viewed_at", "is", null);
      } else if (filter === "unviewed") {
        query = query.is("viewed_at", null);
      }

      // Order by most recent first
      query = query.order("issued_at", { ascending: false });

      const { data, error: queryError } = await query;
      
      if (queryError) throw queryError;

      // Cargar información del emisor manualmente para cada warning
      const transformedData: UserWarningWithDetails[] = await Promise.all(
        (data || []).map(async (w: any) => {
          // Obtener el perfil del emisor
          const { data: issuerProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", w.issued_by)
            .single();

          // Generar URL pública de la foto si existe
          let photoUrl = null;
          if (w.incident?.photo_url) {
            const { data: publicUrlData } = supabase.storage
              .from("incident-photos")
              .getPublicUrl(w.incident.photo_url);
            photoUrl = publicUrlData.publicUrl;
          }

          return {
            id: w.id,
            user_id: w.user_id,
            incident_id: w.incident_id,
            issued_by: w.issued_by,
            issued_at: w.issued_at,
            reason: w.reason,
            notes: w.notes,
            viewed_at: w.viewed_at,
            created_at: w.created_at,
            issuer_name: issuerProfile?.full_name || "Administrador",
            incident_details: {
              id: w.incident?.id || "",
              description: w.incident?.description || "",
              spot_number: w.incident?.spot?.spot_number || "N/A",
              photo_url: photoUrl,
              created_at: w.incident?.created_at || "",
              status: w.incident?.status || "",
            },
          };
        })
      );

      setWarnings(transformedData);

      // Get unviewed count
      const { count, error: countError } = await supabase
        .from("user_warnings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("viewed_at", null);

      if (countError) throw countError;

      setUnviewedCount(count || 0);

      // Mark as viewed if requested and there are unviewed warnings
      if (markAsViewed && count && count > 0) {
        await markAllAsViewed();
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Error desconocido");
      setError(errorObj);
      console.error("Error loading warnings:", err);
      toast.error("Error al cargar amonestaciones");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Marks all unviewed warnings as viewed
   */
  const markAllAsViewed = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) return;

      // Update viewed_at for all unviewed warnings
      const { error: updateError } = await supabase
        .from("user_warnings")
        .update({ viewed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("viewed_at", null);

      if (updateError) throw updateError;

      // Update local state
      setUnviewedCount(0);
      
      // Reload warnings to reflect changes
      await loadWarnings();
    } catch (err) {
      console.error("Error marking warnings as viewed:", err);
      // Don't show toast error for this - it's a background operation
    }
  };

  /**
   * Refetch warnings data (alias for loadWarnings)
   */
  const refetch = async () => {
    await loadWarnings();
  };

  // Setup realtime subscription for new warnings
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel("user_warnings_changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_warnings",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("New warning received:", payload);
            
            // Show toast notification with action
            toast.error("Nueva amonestación recibida", {
              action: {
                label: "Ver detalles",
                onClick: () => {
                  // Navigate to warnings section
                  window.location.href = "/profile?tab=warnings";
                },
              },
              duration: 10000, // Show for 10 seconds
            });

            // Reload warnings to include the new one
            loadWarnings();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  // Load warnings on mount and when filter changes
  useEffect(() => {
    loadWarnings();
  }, [filter]);

  return {
    warnings,
    unviewedCount,
    isLoading,
    error,
    markAllAsViewed,
    refetch,
  };
};
