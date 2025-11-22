import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { clearVisualEditorSession } from "@/lib/visualEditorStorage";
import { offlineCache } from "@/lib/offlineCache";

/**
 * User status information
 */
export interface UserStatus {
  isBlocked: boolean;
  blockReason: string;
  isDeactivated: boolean;
}

/**
 * Custom hook for managing dashboard authentication and user state
 * 
 * Handles:
 * - Session management
 * - User role checking (admin, director, preferred, visitor, general)
 * - User status (blocked/deactivated)
 * - Logout with retry logic
 * 
 * @returns Authentication state, user info, and utility functions
 */
export const useDashboardAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("general");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    isBlocked: false,
    blockReason: "",
    isDeactivated: false,
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          // Navigate with delay to avoid aborting ongoing calls (e.g. global logout)
          setTimeout(() => {
            navigate("/auth");
          }, 500);
        } else {
          // Defer role and status checking
          setTimeout(() => {
            checkUserRole(session.user.id);
            checkUserStatus(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        checkUserRole(session.user.id);
        checkUserStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /**
   * Gets and sets the current user's role from Supabase
   */
  const checkUserRole = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      if (roles && roles.length > 0) {
        const hasAdminRole = roles.some(r => r.role === "admin");
        setIsAdmin(hasAdminRole);
        
        // Get highest priority role
        const roleOrder = ["admin", "director", "preferred", "visitor", "general"];
        const userRoles = roles.map(r => r.role as string);
        const highestRole = roleOrder.find(role => userRoles.includes(role)) || "general";
        setUserRole(highestRole);
      }
    } catch (error: any) {
      console.error("Error checking user role:", error);
    }
  };

  /**
   * Checks user status (blocked/deactivated)
   */
  const checkUserStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_blocked, blocked_reason, is_deactivated")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (profile) {
        setUserStatus({
          isBlocked: profile.is_blocked || false,
          blockReason: profile.blocked_reason || "",
          isDeactivated: profile.is_deactivated || false,
        });
      }
    } catch (error: any) {
      console.error("Error checking user status:", error);
    }
  };

  /**
   * Async pause utility
   */
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Signs out with retry logic for network errors
   * Falls back to local sign out if global sign out fails persistently
   */
  const signOutWithRetry = async (maxRetries = 2): Promise<"global" | "local"> => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (!error) {
        return "global";
      }

      const message = (typeof error?.message === "string" ? error.message : "").toLowerCase();
      const isAbortOrNetwork = message.includes("abort") || message.includes("network") || error?.name === "AbortError";

      // Don't retry if not a network/abort error
      if (!isAbortOrNetwork) {
        throw error;
      }

      attempt += 1;
      if (attempt <= maxRetries) {
        // Simple backoff: 200ms, 400ms, ...
        await sleep(200 * attempt);
      }
    }

    // Local fallback if network issues persist
    const { error: localError } = await supabase.auth.signOut({ scope: "local" });
    if (localError) {
      throw localError;
    }
    return "local";
  };

  /**
   * Handles user logout with network error handling
   * Navigation is handled by onAuthStateChange listener
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOutWithRetry(2);
      
      // Clear Visual Editor session state
      clearVisualEditorSession();
      
      // Clear offline cache and pending actions
      try {
        await offlineCache.clear();
        console.log("Offline cache cleared on logout");
      } catch (cacheError) {
        console.error("Error clearing offline cache:", cacheError);
        // Don't block logout if cache clearing fails
      }
      
      if (result === "global") {
        toast.success("Sesión cerrada correctamente");
      } else {
        toast.success("Sesión cerrada localmente. Si el problema persiste, vuelve a intentar.");
      }
      // Navigation handled by onAuthStateChange when session becomes null
    } catch (err: any) {
      const message = (typeof err?.message === "string" ? err.message : "")?.toLowerCase();
      const isNetwork = message.includes("network") || message.includes("abort") || err?.name === "AbortError";
      if (isNetwork) {
        toast.error("Problema de red al cerrar sesión. Revisa tu conexión e inténtalo de nuevo.");
      } else {
        toast.error("No hemos podido cerrar tu sesión. Intenta de nuevo.");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    userRole,
    isLoggingOut,
    userStatus,
    handleLogout,
  };
};
