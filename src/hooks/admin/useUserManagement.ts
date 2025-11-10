import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWithRole } from "@/types/admin";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
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
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
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
      loadUsers();
      return true;
    } catch (error: any) {
      console.error("Error al bloquear usuario:", error);
      toast.error("Error al bloquear usuario");
      return false;
    }
  };

  const handleUnblockUser = async (userId: string) => {
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
      loadUsers();
      return true;
    } catch (error: any) {
      console.error("Error al desbloquear usuario:", error);
      toast.error("Error al desbloquear usuario");
      return false;
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("deactivate_user", {
        _user_id: userId,
        _admin_id: user?.id
      });
      
      if (error) throw error;
      toast.success("Usuario dado de baja. Matrículas liberadas.");
      loadUsers();
      return true;
    } catch (error: any) {
      console.error("Error al dar de baja usuario:", error);
      toast.error("Error al dar de baja usuario");
      return false;
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("reactivate_user", {
        _user_id: userId,
        _admin_id: user?.id
      });
      
      if (error) throw error;
      toast.success("Usuario reactivado. Debe solicitar matrículas de nuevo.");
      loadUsers();
      return true;
    } catch (error: any) {
      console.error("Error al reactivar usuario:", error);
      toast.error("Error al reactivar usuario");
      return false;
    }
  };

  const handlePermanentlyDeleteUser = async (userId: string, password: string) => {
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
      loadUsers();
      return true;
    } catch (error: any) {
      console.error("Error al borrar usuario:", error);
      toast.error("Error al borrar usuario: " + error.message);
      return false;
    }
  };

  const handleUpdateUserRoles = async (userId: string, roles: string[], isAdmin: boolean) => {
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
      loadUsers();
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
      loadUsers();
    } catch (error: any) {
      console.error("Error approving plate:", error);
      toast.error("Error al aprobar la matrícula");
    }
  };

  const handleRejectPlateFromUser = async (plateId: string, reason: string) => {
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
      loadUsers();
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
  };
};
