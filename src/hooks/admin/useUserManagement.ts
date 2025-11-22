import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWithRole } from "@/types/admin";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { offlineCache } from "@/lib/offlineCache";

/**
 * Custom hook for comprehensive user management in the admin panel
 * 
 * Provides complete user lifecycle management including:
 * - Loading users with roles and license plates
 * - Blocking/unblocking users
 * - Deactivating/reactivating users
 * - Permanently deleting users (requires password)
 * - Managing user roles and parking group assignments
 * - Approving/rejecting license plates from user cards
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * **UI State Management**: Includes expanded users tracking and active tabs
 * for accordion-style user cards.
 * 
 * @returns {Object} User management state and operations
 * @returns {UserWithRole[]} users - Array of users with roles and plates
 * @returns {boolean} loading - Loading state indicator
 * @returns {Set<string>} expandedUsers - Set of expanded user IDs (for accordion)
 * @returns {Record<string,string>} activeTab - Active tab per user ID
 * @returns {string|null} savingUserId - ID of user currently being saved
 * @returns {Function} loadUsers - Loads all users from DB (with cache)
 * @returns {Function} handleBlockUser - Blocks a user with reason
 * @returns {Function} handleUnblockUser - Unblocks a user
 * @returns {Function} handleDeactivateUser - Deactivates user (calls DB function)
 * @returns {Function} handleReactivateUser - Reactivates user
 * @returns {Function} handlePermanentlyDeleteUser - Permanently deletes user (requires password)
 * @returns {Function} handleUpdateUserRoles - Updates user roles
 * @returns {Function} debouncedSaveRoles - Debounced version of role update (1s delay)
 * @returns {Function} handleApprovePlateFromUser - Approves plate from user card
 * @returns {Function} handleRejectPlateFromUser - Rejects plate from user card
 * @returns {Function} toggleUserExpanded - Toggles user card expansion
 * @returns {Function} setUserTab - Sets active tab for user
 * 
 * @example
 * ```tsx
 * const {
 *   users,
 *   loading,
 *   handleBlockUser,
 *   handleDeactivateUser
 * } = useUserManagement();
 * 
 * useEffect(() => {
 *   loadUsers();
 * }, []);
 * 
 * const handleBlock = async (userId: string) => {
 *   const success = await handleBlockUser(userId, "Spam behavior");
 *   if (success) {
 *     // Users automatically reloaded
 *   }
 * };
 * ```
 */
export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const isCached = useRef(false);
  const { isOnline } = useOfflineMode();

  const loadUsers = async (forceReload = false) => {
    // Si ya está en caché y no se fuerza la recarga, no hacer nada
    if (isCached.current && !forceReload) {
      return;
    }

    const cacheKey = 'admin_users';

    try {
      setLoading(true);

      // Si estamos offline, cargar desde cache
      if (!isOnline) {
        const cached = await offlineCache.get<UserWithRole[]>(cacheKey);
        if (cached) {
          setUsers(cached);
          toast.warning("Funcionalidad limitada sin conexión", {
            description: "Solo puedes ver datos. Conéctate para realizar cambios."
          });
          isCached.current = true;
          return;
        }
        toast.error("No hay datos de usuarios en caché");
        return;
      }

      // Modo online: cargar desde Supabase
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_blocked, is_deactivated, blocked_reason, blocked_at, deactivated_at")
        .order("email");

      if (error) throw error;
      
      // Get roles and plates for each user
      const usersWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("id, role")
            .eq("user_id", profile.id);
          
          const { data: plates } = await supabase
            .from("license_plates")
            .select("id, plate_number, is_approved, rejected_at, rejection_reason, approved_electric, approved_disability, electric_expires_at, disability_expires_at")
            .eq("user_id", profile.id)
            .order("requested_at", { ascending: false });
          
          return {
            ...profile,
            user_roles: roles || [],
            license_plates: plates || []
          };
        })
      );
      
      setUsers(usersWithData as any);
      
      // Cachear datos
      await offlineCache.set(cacheKey, usersWithData, {
        dataType: 'admin_users',
        userId: 'admin'
      });
      
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading users:", error);
      
      // Si falla online, intentar cache
      const cached = await offlineCache.get<UserWithRole[]>(cacheKey);
      if (cached) {
        setUsers(cached);
        toast.warning("Mostrando datos en caché", {
          description: "No se pudo conectar al servidor"
        });
        isCached.current = true;
      } else {
        toast.error("Error al cargar usuarios");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    if (!isOnline) {
      toast.error("No puedes bloquear usuarios sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
          blocked_by: user?.id
        })
        .eq("id", userId);
      
      if (error) throw error;
      toast.success("Usuario bloqueado correctamente");
      loadUsers(true);
      return true;
    } catch (error: any) {
      console.error("Error al bloquear usuario:", error);
      toast.error("Error al bloquear usuario");
      return false;
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!isOnline) {
      toast.error("No puedes desbloquear usuarios sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          blocked_by: null
        })
        .eq("id", userId);
      
      if (error) throw error;
      toast.success("Usuario desbloqueado correctamente");
      loadUsers(true);
      return true;
    } catch (error: any) {
      console.error("Error al desbloquear usuario:", error);
      toast.error("Error al desbloquear usuario");
      return false;
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!isOnline) {
      toast.error("No puedes dar de baja usuarios sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("deactivate_user", {
        _user_id: userId,
        _admin_id: user?.id
      });
      
      if (error) throw error;
      toast.success("Usuario dado de baja. Matrículas liberadas.");
      loadUsers(true);
      return true;
    } catch (error: any) {
      console.error("Error al dar de baja usuario:", error);
      toast.error("Error al dar de baja usuario");
      return false;
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!isOnline) {
      toast.error("No puedes reactivar usuarios sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("reactivate_user", {
        _user_id: userId,
        _admin_id: user?.id
      });
      
      if (error) throw error;
      toast.success("Usuario reactivado. Debe solicitar matrículas de nuevo.");
      loadUsers(true);
      return true;
    } catch (error: any) {
      console.error("Error al reactivar usuario:", error);
      toast.error("Error al reactivar usuario");
      return false;
    }
  };

  const handlePermanentlyDeleteUser = async (userId: string, password: string) => {
    if (!isOnline) {
      toast.error("No puedes eliminar usuarios sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return false;
    }

    if (password !== "12345678") {
      toast.error("Contraseña incorrecta");
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("permanently_delete_user", {
        _user_id: userId,
        _admin_id: user?.id,
        _password_confirmation: password
      });
      
      if (error) throw error;
      toast.success("Usuario eliminado permanentemente");
      loadUsers(true);
      return true;
    } catch (error: any) {
      console.error("Error al borrar usuario:", error);
      toast.error("Error al borrar usuario: " + error.message);
      return false;
    }
  };

  const handleUpdateUserRoles = async (userId: string, roles: string[], isAdmin: boolean) => {
    if (!isOnline) {
      toast.error("No puedes actualizar roles sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return;
    }

    try {
      setSavingUserId(userId);
      
      // Delete existing non-admin roles
      const { data: currentRoles } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId);

      if (currentRoles) {
        const parkingRoleIds = currentRoles
          .filter(r => r.role !== 'admin')
          .map(r => r.id);
        
        if (parkingRoleIds.length > 0) {
          await supabase
            .from("user_roles")
            .delete()
            .in("id", parkingRoleIds);
        }
      }

      // Handle admin role separately
      const hasAdminRole = currentRoles?.some(r => r.role === 'admin');
      
      if (isAdmin && !hasAdminRole) {
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: 'admin' });
      } else if (!isAdmin && hasAdminRole) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
      }

      // Insert new parking spot roles
      if (roles.length > 0) {
        const { error } = await supabase
          .from("user_roles")
          .insert(roles.map(role => ({
            user_id: userId,
            role: role as any,
          })));

        if (error) throw error;
      }

      toast.success("Roles actualizados");
      loadUsers(true);
    } catch (error: any) {
      console.error("Error updating roles:", error);
      toast.error("Error al actualizar los roles");
    } finally {
      setSavingUserId(null);
    }
  };

  const debouncedSaveRoles = useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return (userId: string, roles: string[], isAdmin: boolean) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          handleUpdateUserRoles(userId, roles, isAdmin);
        }, 1000);
      };
    },
    []
  );

  const handleApprovePlateFromUser = async (plateId: string) => {
    if (!isOnline) {
      toast.error("No puedes aprobar matrículas sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("license_plates")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: sessionData.session?.user.id,
          rejected_at: null,
          rejection_reason: null,
        })
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Matrícula aprobada");
      loadUsers(true);
    } catch (error: any) {
      console.error("Error approving plate:", error);
      toast.error("Error al aprobar la matrícula");
    }
  };

  const handleRejectPlateFromUser = async (plateId: string, reason: string) => {
    if (!isOnline) {
      toast.error("No puedes rechazar matrículas sin conexión", {
        description: "Conéctate a internet para realizar esta acción"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("license_plates")
        .update({
          rejected_at: new Date().toISOString(),
          is_approved: false,
          rejection_reason: reason || "No se especificó motivo",
        })
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Matrícula rechazada");
      loadUsers(true);
    } catch (error: any) {
      console.error("Error rejecting plate:", error);
      toast.error("Error al rechazar la matrícula");
    }
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const setUserTab = (userId: string, tab: string) => {
    setActiveTab(prev => ({ ...prev, [userId]: tab }));
  };

  // Sincronizar datos cuando se recupera la conexión
  useEffect(() => {
    if (isOnline) {
      console.log('[useUserManagement] Sincronizando usuarios...');
      loadUsers(true); // forceReload = true
    }
  }, [isOnline]);

  return {
    users,
    loading,
    expandedUsers,
    activeTab,
    savingUserId,
    loadUsers,
    handleBlockUser,
    handleUnblockUser,
    handleDeactivateUser,
    handleReactivateUser,
    handlePermanentlyDeleteUser,
    handleUpdateUserRoles,
    debouncedSaveRoles,
    handleApprovePlateFromUser,
    handleRejectPlateFromUser,
    toggleUserExpanded,
    setUserTab,
    isOnline,
    canModify: isOnline,
  };
};
