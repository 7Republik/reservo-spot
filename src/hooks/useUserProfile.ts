import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, ProfileUpdateData } from "@/types/profile";
import { toast } from "sonner";
import { useOfflineMode } from "./useOfflineMode";
import { offlineCache } from "@/lib/offlineCache";
import { safeSupabaseQuery } from "@/lib/errorHandler";

/**
 * Return type for useUserProfile hook
 */
export interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  updateNotificationPreferences: (checkinRemindersEnabled: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing user profile data
 * 
 * Handles:
 * - Loading user profile from Supabase (online) or cache (offline)
 * - Updating profile data with validation (only when online)
 * - Error handling and user feedback via toast notifications
 * - Loading and error states
 * - Offline mode support with automatic caching
 * 
 * @returns Profile data, loading state, error state, offline state, and utility functions
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline, loadFromCache } = useOfflineMode();

  /**
   * Loads the current user's profile from Supabase or cache
   */
  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    // Get current user
    const authResult = await safeSupabaseQuery(
      () => supabase.auth.getUser(),
      { user: null },
      { logError: true, context: 'getUser' }
    );

    if (authResult.error || !authResult.data?.user) {
      setError(new Error("No hay usuario autenticado"));
      setIsLoading(false);
      return;
    }

    const user = authResult.data.user;

    // If offline, try to load from cache
    if (!isOnline) {
      const cachedProfile = await loadFromCache<UserProfile>('profile');
      if (cachedProfile) {
        setProfile(cachedProfile);
      } else {
        setError(new Error("Datos no disponibles offline"));
        toast.error("Datos no disponibles offline");
      }
      setIsLoading(false);
      return;
    }

    // Fetch profile data from server with fallback to cache
    const profileResult = await safeSupabaseQuery(
      () => supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
      null,
      { logError: true, context: 'loadProfile' }
    );

    if (profileResult.error) {
      // Fallback to cache if online fetch fails
      const cachedProfile = await loadFromCache<UserProfile>('profile');
      if (cachedProfile) {
        setProfile(cachedProfile);
        toast.warning('Mostrando perfil en caché');
      } else {
        setError(profileResult.error);
        toast.error("Error al cargar perfil");
      }
    } else if (profileResult.data) {
      setProfile(profileResult.data);
      // Cache profile data for offline use
      await offlineCache.set('profile', profileResult.data);
    }

    setIsLoading(false);
  };

  /**
   * Updates the user's profile with new data
   * Only works when online
   * 
   * @param data - Profile update data (full_name, phone)
   */
  const updateProfile = async (data: ProfileUpdateData) => {
    // Block updates when offline
    if (!isOnline) {
      toast.error("No puedes editar tu perfil sin conexión");
      throw new Error("Cannot update profile offline");
    }

    // Get current user
    const authResult = await safeSupabaseQuery(
      () => supabase.auth.getUser(),
      { user: null },
      { logError: true, context: 'getUser' }
    );

    if (authResult.error || !authResult.data?.user) {
      toast.error("No hay usuario autenticado");
      throw new Error("No hay usuario autenticado");
    }

    const user = authResult.data.user;

    // Update profile
    const updateResult = await safeSupabaseQuery(
      () => supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id),
      null,
      { showToast: true, toastMessage: "Error al actualizar perfil", context: 'updateProfile' }
    );

    if (updateResult.error) {
      throw updateResult.error;
    }

    // Reload profile to get updated data and update cache
    await loadProfile();
    
    toast.success("Perfil actualizado correctamente");
  };

  /**
   * Updates the user's notification preferences
   * Only works when online
   * 
   * @param checkinRemindersEnabled - Whether to enable check-in reminders
   */
  const updateNotificationPreferences = async (checkinRemindersEnabled: boolean) => {
    // Block updates when offline
    if (!isOnline) {
      toast.error("No puedes cambiar preferencias sin conexión");
      throw new Error("Cannot update preferences offline");
    }

    // Get current user
    const authResult = await safeSupabaseQuery(
      () => supabase.auth.getUser(),
      { user: null },
      { logError: true, context: 'getUser' }
    );

    if (authResult.error || !authResult.data?.user) {
      toast.error("No hay usuario autenticado");
      throw new Error("No hay usuario autenticado");
    }

    const user = authResult.data.user;

    // Update notification preferences
    const updateResult = await safeSupabaseQuery(
      () => supabase
        .from("profiles")
        .update({
          checkin_reminders_enabled: checkinRemindersEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id),
      null,
      { showToast: true, toastMessage: "Error al actualizar preferencias", context: 'updatePreferences' }
    );

    if (updateResult.error) {
      throw updateResult.error;
    }

    // Reload profile to get updated data and update cache
    await loadProfile();
    
    toast.success(
      checkinRemindersEnabled 
        ? "Recordatorios de check-in activados" 
        : "Recordatorios de check-in desactivados"
    );
  };

  /**
   * Refetch profile data (alias for loadProfile)
   */
  const refetch = async () => {
    await loadProfile();
  };

  // Load profile on mount and when online status changes
  useEffect(() => {
    loadProfile();
  }, [isOnline]);

  return {
    profile,
    isLoading,
    error,
    isOffline: !isOnline,
    updateProfile,
    updateNotificationPreferences,
    refetch,
  };
};
