import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, ProfileUpdateData } from "@/types/profile";
import { toast } from "sonner";

/**
 * Return type for useUserProfile hook
 */
export interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing user profile data
 * 
 * Handles:
 * - Loading user profile from Supabase
 * - Updating profile data with validation
 * - Error handling and user feedback via toast notifications
 * - Loading and error states
 * 
 * @returns Profile data, loading state, error state, and utility functions
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Loads the current user's profile from Supabase
   */
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      // Fetch profile data
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(data);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Error desconocido");
      setError(errorObj);
      console.error("Error loading profile:", err);
      toast.error("Error al cargar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates the user's profile with new data
   * 
   * @param data - Profile update data (full_name, phone)
   */
  const updateProfile = async (data: ProfileUpdateData) => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Reload profile to get updated data
      await loadProfile();
      
      toast.success("Perfil actualizado correctamente");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Error al actualizar perfil");
      throw err;
    }
  };

  /**
   * Refetch profile data (alias for loadProfile)
   */
  const refetch = async () => {
    await loadProfile();
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch,
  };
};
