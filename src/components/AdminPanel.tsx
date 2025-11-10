import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, ParkingSquare, Plus, Trash2, ChevronDown, ChevronUp, CreditCard, Shield, UserCircle, Settings, Calendar as CalendarIcon, ZoomIn, ZoomOut, Maximize2, X, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type {
  UserWithRole,
  ParkingSpot,
  ParkingGroup,
} from "@/types/admin";
import { LicensePlatesTab } from "@/components/admin/license-plates/LicensePlatesTab";

const AdminPanel = () => {
  // State for Users tab
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [newSpotNumber, setNewSpotNumber] = useState("");
  const [newSpotGroupId, setNewSpotGroupId] = useState<string>("");
  const [newSpotIsAccessible, setNewSpotIsAccessible] = useState(false);
  const [newSpotHasCharger, setNewSpotHasCharger] = useState(false);
  const [newSpotIsCompact, setNewSpotIsCompact] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  
  // Permissions dialog state for editing plates in users tab
  const [selectedPlateForAction, setSelectedPlateForAction] = useState<string | null>(null);
  const [rejectReasonForPlate, setRejectReasonForPlate] = useState("");

  // Parking groups state
  const [parkingGroups, setParkingGroups] = useState<ParkingGroup[]>([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ParkingGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupCapacity, setGroupCapacity] = useState("0");
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);

  // User group assignments state
  const [userGroupAssignments, setUserGroupAssignments] = useState<Record<string, string[]>>({});
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserGroups, setSelectedUserGroups] = useState<string[]>([]);

  // Visual editor state
  const [selectedGroupForEditor, setSelectedGroupForEditor] = useState<ParkingGroup | null>(null);
  const [editorSpots, setEditorSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpotForEdit, setSelectedSpotForEdit] = useState<ParkingSpot | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [floorPlanDimensions, setFloorPlanDimensions] = useState({ width: 0, height: 0 });
  const [spotButtonSize, setSpotButtonSize] = useState(32);

  // Spot attributes dialog state
  const [spotAttributesDialogOpen, setSpotAttributesDialogOpen] = useState(false);
  const [editSpotNumber, setEditSpotNumber] = useState("");
  const [editSpotAccessible, setEditSpotAccessible] = useState(false);
  const [editSpotCharger, setEditSpotCharger] = useState(false);
  const [editSpotCompact, setEditSpotCompact] = useState(false);

  // User management state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserWithRole | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  // Advanced parking management state
  const [reservationSettings, setReservationSettings] = useState({
    advance_reservation_days: 7,
    daily_refresh_hour: 10
  });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Array<{
    id: string;
    blocked_date: string;
    reason: string;
    group_id: string | null;
  }>>([]);
  const [blockDateDialogOpen, setBlockDateDialogOpen] = useState(false);
  const [dateToBlock, setDateToBlock] = useState<Date | undefined>(undefined);
  const [blockDateReason, setBlockDateReason] = useState("Fuerza Mayor");
  const [blockDateGroupId, setBlockDateGroupId] = useState<string | null>(null);
  const [deactivateGroupDialogOpen, setDeactivateGroupDialogOpen] = useState(false);
  const [groupToDeactivate, setGroupToDeactivate] = useState<ParkingGroup | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [groupToSchedule, setGroupToSchedule] = useState<ParkingGroup | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [showDeactivatedGroups, setShowDeactivatedGroups] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSpots();
    loadParkingGroups();
    loadUserGroupAssignments();
    loadReservationSettings();
    loadBlockedDates();
  }, []);

  // User Management Functions
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
      setBlockDialogOpen(false);
    } catch (error: any) {
      console.error("Error al bloquear usuario:", error);
      toast.error("Error al bloquear usuario");
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
    } catch (error: any) {
      console.error("Error al desbloquear usuario:", error);
      toast.error("Error al desbloquear usuario");
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
      setDeactivateDialogOpen(false);
    } catch (error: any) {
      console.error("Error al dar de baja usuario:", error);
      toast.error("Error al dar de baja usuario");
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
    } catch (error: any) {
      console.error("Error al reactivar usuario:", error);
      toast.error("Error al reactivar usuario");
    }
  };

  const handlePermanentlyDeleteUser = async (userId: string, password: string) => {
    if (password !== "12345678") {
      toast.error("Contraseña incorrecta");
      return;
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
      setDeleteDialogOpen(false);
      setDeletePassword("");
    } catch (error: any) {
      console.error("Error al borrar usuario:", error);
      toast.error("Error al borrar usuario: " + error.message);
    }
  };

  const loadUsers = async () => {
    try {
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
    }
  };

  const loadSpots = async () => {
    try {
      const { data, error } = await supabase
        .from("parking_spots")
        .select(`
          *,
          parking_groups(id, name)
        `)
        .order("spot_number");

      if (error) throw error;
      setSpots(data || []);
    } catch (error: any) {
      console.error("Error loading spots:", error);
      toast.error("Error al cargar las plazas");
    }
  };


  const handleUpdateUserRoles = async (userId: string, roles: string[], isAdmin: boolean) => {
    try {
      setSavingUserId(userId);
      
      // Delete existing non-admin roles (preserve admin if not being changed)
      const { data: currentRoles } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId);

      // Delete all parking spot roles (not admin)
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
        // Add admin role
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: 'admin' });
      } else if (!isAdmin && hasAdminRole) {
        // Remove admin role
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
      setSelectedPlateForAction(null);
      setRejectReasonForPlate("");
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

  const getGroupCount = (user: UserWithRole) => {
    return (userGroupAssignments[user.id] || []).length;
  };

  const getPlateCount = (user: UserWithRole) => {
    return user.license_plates?.length || 0;
  };

  const handleAddSpot = async () => {
    if (!newSpotNumber.trim()) {
      toast.error("El número de plaza es obligatorio");
      return;
    }
    
    if (!newSpotGroupId) {
      toast.error("Debes seleccionar un grupo de parking");
      return;
    }

    try {
      const { error } = await supabase
        .from("parking_spots")
        .insert([{
          spot_number: newSpotNumber.trim(),
          group_id: newSpotGroupId,
          is_accessible: newSpotIsAccessible,
          has_charger: newSpotHasCharger,
          is_compact: newSpotIsCompact,
          is_active: true,
          visual_size: 'medium',
        }]);

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("Esta plaza ya existe");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Plaza añadida correctamente");
      setNewSpotNumber("");
      setNewSpotGroupId("");
      setNewSpotIsAccessible(false);
      setNewSpotHasCharger(false);
      setNewSpotIsCompact(false);
      loadSpots();
    } catch (error: any) {
      console.error("Error adding spot:", error);
      toast.error("Error al añadir la plaza");
    }
  };

  const handleToggleSpot = async (spotId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("parking_spots")
        .update({ is_active: !currentStatus })
        .eq("id", spotId);

      if (error) throw error;

      toast.success(`Plaza ${!currentStatus ? "activada" : "desactivada"} correctamente`);
      loadSpots();
    } catch (error: any) {
      console.error("Error toggling spot:", error);
      toast.error("Error al actualizar la plaza");
    }
  };

  // Parking groups functions
  const loadParkingGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("parking_groups")
        .select("*")
        .order("name");

      if (error) throw error;
      setParkingGroups(data || []);
    } catch (error: any) {
      console.error("Error loading parking groups:", error);
      toast.error("Error al cargar grupos de parking");
    }
  };

  const loadUserGroupAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("user_group_assignments")
        .select("user_id, group_id");

      if (error) throw error;

      const assignments: Record<string, string[]> = {};
      data?.forEach(assignment => {
        if (!assignments[assignment.user_id]) {
          assignments[assignment.user_id] = [];
        }
        assignments[assignment.user_id].push(assignment.group_id);
      });

      setUserGroupAssignments(assignments);
    } catch (error: any) {
      console.error("Error loading user group assignments:", error);
    }
  };

  const resetGroupForm = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupCapacity("0");
    setFloorPlanFile(null);
    setEditingGroup(null);
  };

  const openCreateGroupDialog = () => {
    resetGroupForm();
    setGroupDialogOpen(true);
  };

  const openEditGroupDialog = (group: ParkingGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setGroupCapacity(group.capacity.toString());
    setGroupDialogOpen(true);
  };

  const handleCreateOrUpdateGroup = async () => {
    try {
      let floorPlanUrl = editingGroup?.floor_plan_url || null;

      if (floorPlanFile) {
        setUploadingFloorPlan(true);
        const fileName = `${Date.now()}_${floorPlanFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("floor-plans")
          .upload(fileName, floorPlanFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("floor-plans")
          .getPublicUrl(fileName);
        
        floorPlanUrl = urlData.publicUrl;
        setUploadingFloorPlan(false);
      }

      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || null,
        capacity: parseInt(groupCapacity) || 0,
        floor_plan_url: floorPlanUrl,
        is_active: true,
      };

      if (editingGroup) {
        const { error } = await supabase
          .from("parking_groups")
          .update(groupData)
          .eq("id", editingGroup.id);

        if (error) throw error;
        toast.success("Grupo actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("parking_groups")
          .insert(groupData);

        if (error) throw error;
        toast.success("Grupo creado correctamente");
      }

      setGroupDialogOpen(false);
      resetGroupForm();
      loadParkingGroups();
    } catch (error: any) {
      console.error("Error saving group:", error);
      toast.error("Error al guardar el grupo");
      setUploadingFloorPlan(false);
    }
  };

  const handleToggleGroupActive = async (groupId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ is_active: !isActive })
        .eq("id", groupId);

      if (error) throw error;
      toast.success(isActive ? "Grupo desactivado" : "Grupo activado");
      loadParkingGroups();
    } catch (error: any) {
      console.error("Error toggling group status:", error);
      toast.error("Error al cambiar el estado del grupo");
    }
  };

  const openAssignGroupsDialog = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedUserGroups(userGroupAssignments[userId] || []);
    setAssignDialogOpen(true);
  };

  const toggleGroupForUser = (groupId: string) => {
    setSelectedUserGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSaveUserGroupAssignments = async () => {
    if (!selectedUserId) return;

    try {
      await supabase
        .from("user_group_assignments")
        .delete()
        .eq("user_id", selectedUserId);

      if (selectedUserGroups.length > 0) {
        const assignments = selectedUserGroups.map(groupId => ({
          user_id: selectedUserId,
          group_id: groupId,
        }));

        const { error } = await supabase
          .from("user_group_assignments")
          .insert(assignments);

        if (error) throw error;
      }

      toast.success("Grupos asignados correctamente");
      setAssignDialogOpen(false);
      loadUserGroupAssignments();
    } catch (error: any) {
      console.error("Error saving user group assignments:", error);
      toast.error("Error al asignar grupos");
    }
  };

  // Advanced parking management functions
  const loadReservationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("reservation_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setReservationSettings({
          advance_reservation_days: data.advance_reservation_days,
          daily_refresh_hour: data.daily_refresh_hour
        });
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
    }
  };

  const loadBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select(`
          *,
          parking_groups(name)
        `)
        .order("blocked_date", { ascending: true });

      if (error) throw error;
      setBlockedDates(data || []);
    } catch (error: any) {
      console.error("Error loading blocked dates:", error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from("reservation_settings")
        .update({
          advance_reservation_days: reservationSettings.advance_reservation_days,
          daily_refresh_hour: reservationSettings.daily_refresh_hour
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;
      toast.success("Configuración actualizada correctamente");
      setSettingsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar configuración");
    }
  };

  const handleBlockDate = async () => {
    if (!dateToBlock) return;

    try {
      const { data: existingReservations } = await supabase
        .from("reservations")
        .select("id")
        .eq("reservation_date", format(dateToBlock, 'yyyy-MM-dd'))
        .eq("status", "active");

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: blockError } = await supabase
        .from("blocked_dates")
        .insert({
          blocked_date: format(dateToBlock, 'yyyy-MM-dd'),
          reason: blockDateReason,
          created_by: user?.id,
          group_id: blockDateGroupId
        });

      if (blockError) throw blockError;

      if (existingReservations && existingReservations.length > 0) {
        const { error: cancelError } = await supabase.rpc(
          'cancel_reservations_for_blocked_date',
          {
            _blocked_date: format(dateToBlock, 'yyyy-MM-dd'),
            _admin_id: user?.id
          }
        );

        if (cancelError) throw cancelError;
        
        toast.success(
          `Día bloqueado y ${existingReservations.length} reservas canceladas`,
          { duration: 5000 }
        );
      } else {
        toast.success("Día bloqueado correctamente");
      }

      setBlockDateDialogOpen(false);
      setDateToBlock(undefined);
      setBlockDateReason("Fuerza Mayor");
      setBlockDateGroupId(null);
      loadBlockedDates();
    } catch (error: any) {
      console.error("Error blocking date:", error);
      toast.error("Error al bloquear el día");
    }
  };

  const handleUnblockDate = async (dateId: string) => {
    try {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("id", dateId);

      if (error) throw error;
      toast.success("Día desbloqueado correctamente");
      loadBlockedDates();
    } catch (error: any) {
      console.error("Error unblocking date:", error);
      toast.error("Error al desbloquear el día");
    }
  };

  const handleDeactivateGroup = async () => {
    if (!groupToDeactivate || !deactivationReason.trim()) {
      toast.error("Debes proporcionar un motivo para dar de baja el grupo");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.rpc('deactivate_parking_group', {
        _group_id: groupToDeactivate.id,
        _admin_id: user?.id,
        _reason: deactivationReason
      });

      if (error) throw error;

      toast.success(
        `Grupo "${groupToDeactivate.name}" dado de baja y reservas futuras canceladas`,
        { duration: 5000 }
      );
      
      setDeactivateGroupDialogOpen(false);
      setGroupToDeactivate(null);
      setDeactivationReason("");
      loadParkingGroups();
    } catch (error: any) {
      console.error("Error deactivating group:", error);
      toast.error("Error al dar de baja el grupo");
    }
  };

  const handleScheduleDeactivation = async () => {
    if (!groupToSchedule || !scheduledDate) return;

    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ scheduled_deactivation_date: format(scheduledDate, 'yyyy-MM-dd') })
        .eq("id", groupToSchedule.id);

      if (error) throw error;

      toast.success(
        `Grupo "${groupToSchedule.name}" se desactivará automáticamente el ${format(scheduledDate, 'dd/MM/yyyy', { locale: es })}`,
        { duration: 5000 }
      );
      
      setScheduleDialogOpen(false);
      setGroupToSchedule(null);
      setScheduledDate(undefined);
      loadParkingGroups();
    } catch (error: any) {
      console.error("Error scheduling deactivation:", error);
      toast.error("Error al programar desactivación");
    }
  };

  const handleCancelScheduledDeactivation = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ scheduled_deactivation_date: null })
        .eq("id", groupId);

      if (error) throw error;
      toast.success("Desactivación programada cancelada");
      loadParkingGroups();
    } catch (error: any) {
      console.error("Error cancelling scheduled deactivation:", error);
      toast.error("Error al cancelar desactivación programada");
    }
  };

  // Visual editor functions
  const loadEditorSpots = async (groupId: string) => {
    try {
      // Cargar grupo con button_size
      const { data: groupData, error: groupError } = await supabase
        .from("parking_groups")
        .select("button_size")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      
      // Actualizar estado con el valor guardado
      setSpotButtonSize(groupData?.button_size || 32);

      // Cargar spots del grupo
      const { data, error } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("group_id", groupId)
        .order("spot_number");

      if (error) throw error;
      setEditorSpots(data || []);
    } catch (error: any) {
      console.error("Error loading editor spots:", error);
      toast.error("Error al cargar las plazas del grupo");
    }
  };

  const handleButtonSizeChange = async (newSize: number) => {
    setSpotButtonSize(newSize);
    
    if (!selectedGroupForEditor) return;
    
    try {
      const { error } = await supabase
        .from("parking_groups")
        .update({ button_size: newSize })
        .eq("id", selectedGroupForEditor.id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating button size:", error);
      toast.error("Error al guardar el tamaño");
    }
  };

  const handleFloorPlanClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !selectedGroupForEditor) {
      toast.error("Activa el modo dibujo primero");
      return;
    }

    // Obtener coordenadas relativas a la imagen, no al contenedor con zoom
    const imgElement = e.currentTarget.querySelector('img');
    if (!imgElement) return;
    
    const rect = imgElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const nextSpotNumber = `${selectedGroupForEditor.name.substring(0, 2).toUpperCase()}-${editorSpots.length + 1}`;

    try {
      const { data, error } = await supabase
        .from("parking_spots")
        .insert([{
          spot_number: nextSpotNumber,
          group_id: selectedGroupForEditor.id,
          position_x: parseFloat(x.toFixed(2)),
          position_y: parseFloat(y.toFixed(2)),
          is_active: true,
          is_accessible: false,
          has_charger: false,
          is_compact: false,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Plaza ${nextSpotNumber} creada`);
      loadEditorSpots(selectedGroupForEditor.id);
      loadSpots();
    } catch (error: any) {
      console.error("Error creating spot:", error);
      toast.error("Error al crear la plaza");
    }
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    if (isDrawingMode) return;
    
    setSelectedSpotForEdit(spot);
    setEditSpotNumber(spot.spot_number);
    setEditSpotAccessible(spot.is_accessible);
    setEditSpotCharger(spot.has_charger);
    setEditSpotCompact(spot.is_compact);
    setSpotAttributesDialogOpen(true);
  };

  const handleUpdateSpotAttributes = async () => {
    if (!selectedSpotForEdit) return;

    try {
      const { error } = await supabase
        .from("parking_spots")
        .update({
          spot_number: editSpotNumber.trim(),
          is_accessible: editSpotAccessible,
          has_charger: editSpotCharger,
          is_compact: editSpotCompact,
        })
        .eq("id", selectedSpotForEdit.id);

      if (error) throw error;

      toast.success("Atributos actualizados");
      setSpotAttributesDialogOpen(false);
      if (selectedGroupForEditor) {
        loadEditorSpots(selectedGroupForEditor.id);
      }
      loadSpots();
    } catch (error: any) {
      console.error("Error updating spot:", error);
      toast.error("Error al actualizar la plaza");
    }
  };

  const handleDeleteSpot = async () => {
    if (!selectedSpotForEdit || !selectedGroupForEditor) return;

    if (!confirm(`¿Eliminar la plaza ${selectedSpotForEdit.spot_number}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("parking_spots")
        .delete()
        .eq("id", selectedSpotForEdit.id);

      if (error) throw error;

      toast.success("Plaza eliminada");
      setSpotAttributesDialogOpen(false);
      loadEditorSpots(selectedGroupForEditor.id);
      loadSpots();
    } catch (error: any) {
      console.error("Error deleting spot:", error);
      toast.error("Error al eliminar la plaza");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plates">
            <CreditCard className="w-4 h-4 mr-2" />
            Matrículas
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="spots">
            <ParkingSquare className="w-4 h-4 mr-2" />
            Plazas
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plates" className="space-y-4">
          <LicensePlatesTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>
                Gestiona roles, permisos y matrículas de los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <Collapsible 
                    key={user.id} 
                    open={expandedUsers.has(user.id)}
                    onOpenChange={() => toggleUserExpanded(user.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <UserCircle className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{user.full_name || "Sin nombre"}</p>
                                  {user.user_roles.some(ur => ur.role === 'admin') && (
                                    <Badge variant="destructive" className="gap-1">
                                      <Shield className="h-3 w-3" />
                                      ADMIN
                                    </Badge>
                                  )}
                                  {user.is_blocked && (
                                    <Badge variant="destructive" className="gap-1">
                                      🚫 BLOQUEADO
                                    </Badge>
                                  )}
                                  {user.is_deactivated && (
                                    <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500">
                                      ⚠️ DADO DE BAJA
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <ParkingSquare className="h-3 w-3" />
                                    {getGroupCount(user)} grupos
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {getPlateCount(user)} matrículas
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {expandedUsers.has(user.id) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t p-4 bg-muted/20">
                          <Tabs 
                            value={activeTab[user.id] || "permissions"} 
                            onValueChange={(value) => setUserTab(user.id, value)}
                            className="w-full"
                          >
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="permissions">Permisos</TabsTrigger>
                              <TabsTrigger value="groups">Grupos</TabsTrigger>
                              <TabsTrigger value="plates">Matrículas</TabsTrigger>
                            </TabsList>

                            <TabsContent value="permissions" className="space-y-3 mt-4">
                              <div className="flex items-center space-x-2 p-3 bg-background rounded-lg border">
                                <Checkbox
                                  id={`${user.id}-admin`}
                                  checked={user.user_roles.some(ur => ur.role === 'admin')}
                                  onCheckedChange={(checked) => {
                                    const currentRoles = user.user_roles.filter(ur => ur.role !== 'admin').map(ur => ur.role);
                                    debouncedSaveRoles(user.id, currentRoles, !!checked);
                                  }}
                                  disabled={savingUserId === user.id}
                                />
                                <label
                                  htmlFor={`${user.id}-admin`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Acceso al Panel de Administración
                                </label>
                              </div>
                              {savingUserId === user.id && (
                                <p className="text-xs text-muted-foreground">Guardando cambios...</p>
                              )}
                            </TabsContent>

                            <TabsContent value="groups" className="space-y-3 mt-4">
                              <p className="text-xs text-muted-foreground">
                                Selecciona los grupos de parking a los que este usuario tendrá acceso
                              </p>
                              
                              {parkingGroups.filter(g => g.is_active).length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No hay grupos de parking configurados
                                </p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {parkingGroups
                                    .filter(g => g.is_active)
                                    .map((group) => {
                                      const isAssigned = (userGroupAssignments[user.id] || []).includes(group.id);
                                      
                                      return (
                                        <div 
                                          key={group.id} 
                                          className="flex items-center space-x-2 p-2 bg-background rounded-lg border"
                                        >
                                          <Checkbox
                                            id={`${user.id}-group-${group.id}`}
                                            checked={isAssigned}
                                            onCheckedChange={async (checked) => {
                                              const currentAssignments = userGroupAssignments[user.id] || [];
                                              const newAssignments = checked
                                                ? [...currentAssignments, group.id]
                                                : currentAssignments.filter(gId => gId !== group.id);
                                              
                                              try {
                                                setSavingUserId(user.id);
                                                
                                                await supabase
                                                  .from("user_group_assignments")
                                                  .delete()
                                                  .eq("user_id", user.id);
                                                
                                                if (newAssignments.length > 0) {
                                                  const assignments = newAssignments.map(groupId => ({
                                                    user_id: user.id,
                                                    group_id: groupId,
                                                  }));
                                                  
                                                  await supabase
                                                    .from("user_group_assignments")
                                                    .insert(assignments);
                                                }
                                                
                                                toast.success(
                                                  checked 
                                                    ? `Acceso al grupo "${group.name}" concedido` 
                                                    : `Acceso al grupo "${group.name}" revocado`
                                                );
                                                
                                                loadUserGroupAssignments();
                                              } catch (error) {
                                                console.error("Error updating group assignment:", error);
                                                toast.error("Error al actualizar acceso a grupos");
                                              } finally {
                                                setSavingUserId(null);
                                              }
                                            }}
                                            disabled={savingUserId === user.id}
                                          />
                                          <label
                                            htmlFor={`${user.id}-group-${group.id}`}
                                            className="text-sm font-medium leading-none cursor-pointer"
                                          >
                                            {group.name}
                                          </label>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                              
                              {savingUserId === user.id && (
                                <p className="text-xs text-muted-foreground">Guardando cambios...</p>
                              )}
                            </TabsContent>

                            <TabsContent value="plates" className="space-y-3 mt-4">
                              {user.license_plates && user.license_plates.length > 0 ? (
                                <div className="space-y-2">
                                  {user.license_plates.map((plate) => (
                                    <div key={plate.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                      <div className="flex items-center gap-3">
                                        {/* European License Plate Design */}
                                        <div className="flex items-center border-2 border-black rounded overflow-hidden shadow-sm">
                                          <div className="bg-[#003399] flex flex-col items-center justify-center px-1.5 py-1.5 text-white">
                                            <div className="text-[10px] leading-none mb-0.5" style={{ color: '#FFD700' }}>★</div>
                                            <div className="text-[10px] font-bold leading-none">E</div>
                                          </div>
                                          <div className="bg-white px-3 py-1.5">
                                            <div className="font-mono font-bold text-base text-black tracking-wider">
                                              {plate.plate_number}
                                            </div>
                                          </div>
                                        </div>
                                        <div>
                                          {plate.rejected_at ? (
                                            <Badge variant="destructive" className="gap-1">
                                              <X className="h-3 w-3" />
                                              Rechazada
                                            </Badge>
                                           ) : plate.is_approved ? (
                                            <div className="flex flex-col gap-1">
                                              <div className="flex items-center gap-2">
                                                <Badge variant="default" className="bg-success gap-1">
                                                  <Check className="h-3 w-3" />
                                                  Aprobada
                                                </Badge>
                                                {plate.approved_electric && (
                                                  <Badge 
                                                    variant="outline" 
                                                    className={cn(
                                                      "gap-1 text-xs",
                                                      plate.electric_expires_at && new Date(plate.electric_expires_at) < new Date()
                                                        ? "bg-red-500/10 text-red-700 border-red-200"
                                                        : "bg-yellow-500/10 text-yellow-700 border-yellow-200"
                                                    )}
                                                  >
                                                    ⚡
                                                    {plate.electric_expires_at && new Date(plate.electric_expires_at) < new Date() && " EXPIRADO"}
                                                  </Badge>
                                                )}
                                                {plate.approved_disability && (
                                                  <Badge 
                                                    variant="outline" 
                                                    className={cn(
                                                      "gap-1 text-xs",
                                                      plate.disability_expires_at && new Date(plate.disability_expires_at) < new Date()
                                                        ? "bg-red-500/10 text-red-700 border-red-200"
                                                        : "bg-blue-500/10 text-blue-700 border-blue-200"
                                                    )}
                                                  >
                                                    ♿
                                                    {plate.disability_expires_at && new Date(plate.disability_expires_at) < new Date() && " EXPIRADO"}
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                                {plate.approved_electric && plate.electric_expires_at && (
                                                  <span>
                                                    ⚡ {new Date(plate.electric_expires_at) > new Date() 
                                                      ? `Válido hasta: ${new Date(plate.electric_expires_at).toLocaleDateString()}`
                                                      : 'Expirado'}
                                                  </span>
                                                )}
                                                {plate.approved_disability && plate.disability_expires_at && (
                                                  <span>
                                                    ♿ {new Date(plate.disability_expires_at) > new Date() 
                                                      ? `Válido hasta: ${new Date(plate.disability_expires_at).toLocaleDateString()}`
                                                      : 'Expirado'}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <Badge variant="outline" className="border-warning text-warning">
                                              Pendiente
                                            </Badge>
                                          )}
                                          {plate.rejection_reason && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {plate.rejection_reason}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        {!plate.is_approved && !plate.rejected_at && (
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleApprovePlateFromUser(plate.id)}
                                            className="bg-success hover:bg-success/90"
                                          >
                                            <Check className="h-3 w-3 mr-1" />
                                            Aprobar
                                          </Button>
                                        )}
                                         {plate.is_approved && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              // Edit permissions functionality would be here
                                              toast.info("Funcionalidad de edición de permisos en desarrollo");
                                            }}
                                          >
                                            <Settings className="h-3 w-3 mr-1" />
                                            Editar Permisos
                                          </Button>
                                        )}
                                        {!plate.rejected_at && (
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={async () => {
                                              const reason = prompt("Motivo del rechazo:");
                                              if (reason !== null) {
                                                await handleRejectPlateFromUser(plate.id, reason);
                                              }
                                            }}
                                          >
                                            <X className="h-3 w-3 mr-1" />
                                            Rechazar
                                          </Button>
                                        )}
                                        {plate.rejected_at && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleApprovePlateFromUser(plate.id)}
                                          >
                                            <Check className="h-3 w-3 mr-1" />
                                            Aprobar
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                  Este usuario no tiene matrículas registradas
                                </p>
                              )}
                            </TabsContent>
                          </Tabs>

                          {/* User Management Actions */}
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <p className="text-sm font-medium">Acciones de Gestión</p>
                            <div className="flex flex-wrap gap-2">
                              {!user.is_blocked ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserForAction(user);
                                    setBlockReason("");
                                    setBlockDialogOpen(true);
                                  }}
                                >
                                  🚫 Bloquear Usuario
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUnblockUser(user.id)}
                                >
                                  ✅ Desbloquear Usuario
                                </Button>
                              )}

                              {!user.is_deactivated ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserForAction(user);
                                    setDeactivateDialogOpen(true);
                                  }}
                                >
                                  ⚠️ Dar de Baja
                                </Button>
                              ) : (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleReactivateUser(user.id)}
                                >
                                  ♻️ Reactivar Usuario
                                </Button>
                              )}

                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setDeletePassword("");
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                🗑️ Borrar Permanente
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ParkingSquare className="h-5 w-5" />
                Gestión de Plazas de Aparcamiento
              </CardTitle>
              <CardDescription>
                Añade, activa o desactiva plazas de aparcamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Spot */}
              <Card className="p-4 bg-secondary/20">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Añadir Nueva Plaza</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spot-number">Número de Plaza *</Label>
                      <Input
                        id="spot-number"
                        placeholder="Ej: A-01, P1-15, etc."
                        value={newSpotNumber}
                        onChange={(e) => setNewSpotNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spot-group">Grupo de Parking *</Label>
                      <Select value={newSpotGroupId} onValueChange={setNewSpotGroupId}>
                        <SelectTrigger id="spot-group">
                          <SelectValue placeholder="Selecciona un grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {parkingGroups
                            .filter(g => g.is_active)
                            .map(group => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Atributos Especiales</Label>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="spot-accessible"
                          checked={newSpotIsAccessible}
                          onCheckedChange={(checked) => setNewSpotIsAccessible(checked as boolean)}
                        />
                        <Label htmlFor="spot-accessible" className="cursor-pointer flex items-center gap-1">
                          ♿ Plaza PMR (Movilidad Reducida)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="spot-charger"
                          checked={newSpotHasCharger}
                          onCheckedChange={(checked) => setNewSpotHasCharger(checked as boolean)}
                        />
                        <Label htmlFor="spot-charger" className="cursor-pointer flex items-center gap-1">
                          ⚡ Con Cargador Eléctrico
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="spot-compact"
                          checked={newSpotIsCompact}
                          onCheckedChange={(checked) => setNewSpotIsCompact(checked as boolean)}
                        />
                        <Label htmlFor="spot-compact" className="cursor-pointer flex items-center gap-1">
                          🚗 Plaza Reducida (Aviso)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAddSpot} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Plaza
                  </Button>
                </div>
              </Card>

              {/* Spots List */}
              <div className="grid gap-3">
                {spots.map((spot) => (
                  <Card key={spot.id} className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-lg min-w-[80px] text-center">
                          {spot.spot_number}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="font-medium">
                            📍 {spot.parking_groups?.name || "Sin grupo"}
                          </Badge>

                          {spot.is_accessible && (
                            <Badge variant="outline" className="bg-blue-50 border-blue-200">
                              ♿ PMR
                            </Badge>
                          )}
                          {spot.has_charger && (
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-200">
                              ⚡ Cargador
                            </Badge>
                          )}
                          {spot.is_compact && (
                            <Badge variant="outline" className="bg-gray-100 border-gray-300">
                              🚗 Reducida
                            </Badge>
                          )}

                          {spot.position_x !== null && spot.position_y !== null && (
                            <Badge variant="outline" className="bg-green-50 border-green-200">
                              🗺️ Posicionada en plano
                            </Badge>
                          )}

                          <Badge 
                            variant={spot.is_active ? "default" : "secondary"}
                            className={spot.is_active ? "bg-success" : ""}
                          >
                            {spot.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={spot.is_active ? "outline" : "default"}
                        onClick={() => handleToggleSpot(spot.id, spot.is_active)}
                      >
                        {spot.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Tabs defaultValue="groups-list" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="groups-list">Grupos de Parking</TabsTrigger>
              <TabsTrigger value="assign-users">Asignar Usuarios</TabsTrigger>
              <TabsTrigger value="visual-editor">
                Editor Visual
              </TabsTrigger>
            </TabsList>

            {/* Sub-tab: Lista de Grupos */}
            <TabsContent value="groups-list">
              {/* Configuración Global de Reservas */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración de Reservas
                  </CardTitle>
                  <CardDescription>
                    Configura las reglas globales del sistema de reservas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Días de antelación permitidos</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="90"
                          value={reservationSettings.advance_reservation_days}
                          onChange={(e) => setReservationSettings(prev => ({
                            ...prev,
                            advance_reservation_days: parseInt(e.target.value) || 7
                          }))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">días naturales</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Los usuarios podrán reservar hasta {reservationSettings.advance_reservation_days} días por adelantado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Hora de actualización diaria</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={reservationSettings.daily_refresh_hour.toString()}
                          onValueChange={(value) => setReservationSettings(prev => ({
                            ...prev,
                            daily_refresh_hour: parseInt(value)
                          }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">horas</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        La ventana de reserva se actualiza a las {reservationSettings.daily_refresh_hour}:00
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings}>
                    Guardar Configuración
                  </Button>
                </CardContent>
              </Card>

              {/* Gestión de Días Bloqueados */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Días Bloqueados
                      </CardTitle>
                      <CardDescription>
                        Días donde no se permiten reservas en ningún grupo
                      </CardDescription>
                    </div>
                    <Button onClick={() => setBlockDateDialogOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Bloquear Día
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {blockedDates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay días bloqueados
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {blockedDates.map(date => {
                        const groupName = date.group_id ? (date as any).parking_groups?.name : null;
                        return (
                          <div 
                            key={date.id}
                            className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {format(new Date(date.blocked_date), 'dd/MM/yyyy', { locale: es })}
                                </p>
                                {groupName ? (
                                  <Badge variant="outline" className="text-xs">
                                    📍 {groupName}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    🌍 Global
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{date.reason}</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUnblockDate(date.id)}
                            >
                              Desbloquear
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle>Grupos de Parking</CardTitle>
                    <CardDescription>
                      Gestiona las zonas y grupos de plazas
                    </CardDescription>
                  </div>
                  <Button onClick={openCreateGroupDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Grupo
                  </Button>
                </CardHeader>
                <CardContent>
                  {parkingGroups.filter(g => !g.deactivated_at).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay grupos de parking activos</p>
                      <p className="text-sm mt-2">Crea tu primer grupo para comenzar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {parkingGroups
                        .filter(g => !g.deactivated_at)
                        .map(group => (
                        <Card key={group.id} className={cn(
                          "relative overflow-hidden",
                          !group.is_active && "opacity-50"
                        )}>
                          {/* Badge de desactivación programada */}
                          {group.scheduled_deactivation_date && (
                            <Badge 
                              variant="outline" 
                              className="absolute top-2 right-2 z-10 bg-yellow-50 text-yellow-700 border-yellow-300"
                            >
                              🕒 {format(new Date(group.scheduled_deactivation_date), 'dd/MM/yyyy')}
                            </Badge>
                          )}
                          
                          {group.floor_plan_url && (
                            <div className="h-32 bg-muted overflow-hidden">
                              <img
                                src={group.floor_plan_url}
                                alt={`Plano de ${group.name}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {group.description || "Sin descripción"}
                                </CardDescription>
                              </div>
                              <Badge variant={group.is_active ? "default" : "secondary"}>
                                {group.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Capacidad:</span>
                              <span className="font-semibold">{group.capacity} plazas</span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => openEditGroupDialog(group)}
                              >
                                Editar
                              </Button>
                              
                              {group.is_active && (
                                <>
                                  {group.scheduled_deactivation_date ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelScheduledDeactivation(group.id)}
                                    >
                                      ❌ Cancelar
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setGroupToSchedule(group);
                                        setScheduleDialogOpen(true);
                                      }}
                                    >
                                      🕒 Programar
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant={group.is_active ? "secondary" : "default"}
                                    onClick={() => handleToggleGroupActive(group.id, group.is_active)}
                                  >
                                    {group.is_active ? "Pausar" : "Reanudar"}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => {
                                      setGroupToDeactivate(group);
                                      setDeactivateGroupDialogOpen(true);
                                    }}
                                  >
                                    🗑️ Dar de Baja
                                  </Button>
                                </>
                              )}
                              
                              {!group.is_active && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleToggleGroupActive(group.id, group.is_active)}
                                >
                                  Reactivar
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Sección colapsable de Grupos Dados de Baja */}
                  {parkingGroups.filter(g => g.deactivated_at).length > 0 && (
                    <Collapsible open={showDeactivatedGroups} onOpenChange={setShowDeactivatedGroups} className="mt-6">
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                Grupos Dados de Baja
                                <Badge variant="outline" className="ml-2">
                                  {parkingGroups.filter(g => g.deactivated_at).length}
                                </Badge>
                              </CardTitle>
                              <ChevronDown 
                                className={cn(
                                  "h-5 w-5 transition-transform duration-200 text-muted-foreground",
                                  showDeactivatedGroups && "transform rotate-180"
                                )} 
                              />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="space-y-3 pt-4">
                            {parkingGroups
                              .filter(g => g.deactivated_at)
                              .map(group => (
                              <div 
                                key={group.id}
                                className="p-4 bg-muted/30 rounded-lg border border-muted"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <p className="font-medium">{group.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {group.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {group.capacity} plazas
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Dado de baja: {format(new Date(group.deactivated_at!), 'dd/MM/yyyy HH:mm')}
                                      </Badge>
                                    </div>
                                    {group.deactivation_reason && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        <span className="font-medium">Motivo:</span> {group.deactivation_reason}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sub-tab: Asignar Usuarios */}
            <TabsContent value="assign-users">
              <Card>
                <CardHeader>
                  <CardTitle>Asignar Usuarios a Grupos</CardTitle>
                  <CardDescription>
                    Controla qué usuarios pueden acceder a qué grupos de plazas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map(user => {
                      const assignedGroups = userGroupAssignments[user.id] || [];
                      const groupNames = assignedGroups
                        .map(gId => parkingGroups.find(g => g.id === gId)?.name)
                        .filter(Boolean);

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{user.full_name || user.email}</p>
                              {user.user_roles.some(ur => ur.role === 'admin') && (
                                <Badge variant="destructive" className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  ADMIN
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {groupNames.length > 0 ? (
                                groupNames.map((name, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {name}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">Sin grupos asignados</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignGroupsDialog(user.id)}
                            className="ml-4 flex-shrink-0"
                          >
                            Editar Grupos
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sub-tab: Editor Visual */}
            <TabsContent value="visual-editor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Editor Visual de Plazas</CardTitle>
                  <CardDescription>
                    Dibuja y posiciona plazas directamente sobre el plano del parking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Selecciona un Grupo para Editar</Label>
                    <Select
                      value={selectedGroupForEditor?.id || ""}
                      onValueChange={(value) => {
                        const group = parkingGroups.find(g => g.id === value);
                        setSelectedGroupForEditor(group || null);
                        if (group) {
                          loadEditorSpots(group.id);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un grupo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {parkingGroups
                          .filter(g => g.is_active && g.floor_plan_url)
                          .map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name} ({group.capacity} plazas)
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGroupForEditor && selectedGroupForEditor.floor_plan_url ? (
                    <>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-4">
                          <Button
                            variant={isDrawingMode ? "default" : "outline"}
                            onClick={() => setIsDrawingMode(!isDrawingMode)}
                          >
                            {isDrawingMode ? "🖊️ Modo Dibujo Activo" : "✏️ Activar Modo Dibujo"}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {isDrawingMode 
                              ? "Haz clic en el plano para añadir plazas" 
                              : "Haz clic en una plaza para editarla"}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {editorSpots.length} plazas en este grupo
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <span className="font-semibold">Leyenda:</span>
                        <span>🟦 Plaza normal</span>
                        <span>🟦♿ Plaza PMR</span>
                        <span>🟨⚡ Con cargador</span>
                        <span>🟩 Múltiples atributos</span>
                        <span>⚪ Inactiva</span>
                      </div>

                      <div className="space-y-4">
                        {/* Controles de zoom y tamaño */}
                        <div className="flex flex-wrap items-center gap-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Controles:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="spot-size" className="text-sm text-gray-600 whitespace-nowrap">
                              Tamaño botones:
                            </Label>
                            <input
                              id="spot-size"
                              type="range"
                              min="16"
                              max="64"
                              value={spotButtonSize}
                              onChange={(e) => handleButtonSizeChange(Number(e.target.value))}
                              className="w-32"
                            />
                            <span className="text-xs text-gray-500 min-w-[3rem]">{spotButtonSize}px</span>
                          </div>
                        </div>

                        {/* Editor con zoom/pan */}
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                          <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={4}
                            centerOnInit={true}
                            wheel={{ step: 0.1 }}
                            doubleClick={{ mode: "zoomIn" }}
                            panning={{ velocityDisabled: true }}
                          >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                              <>
                                {/* Controles de zoom flotantes */}
                                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => zoomIn()}
                                    className="h-8 w-8 p-0"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => zoomOut()}
                                    className="h-8 w-8 p-0"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resetTransform()}
                                    className="h-8 w-8 p-0"
                                    title="Reset Zoom"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <TransformComponent
                                  wrapperStyle={{ width: '100%', height: '100%', minHeight: '500px' }}
                                  contentStyle={{ width: '100%', height: '100%' }}
                                >
                                  <div
                                    className="relative cursor-crosshair"
                                    onClick={handleFloorPlanClick}
                                    style={{ minHeight: '500px', width: '100%' }}
                                  >
                                    <img
                                      src={selectedGroupForEditor.floor_plan_url}
                                      alt={`Plano de ${selectedGroupForEditor.name}`}
                                      className="w-full h-auto"
                                      onLoad={(e) => {
                                        setFloorPlanDimensions({
                                          width: e.currentTarget.naturalWidth,
                                          height: e.currentTarget.naturalHeight,
                                        });
                                      }}
                                    />

                                    {editorSpots.map(spot => {
                                      if (spot.position_x === null || spot.position_y === null) return null;

                                      let bgColor = "bg-blue-500";
                                      if (!spot.is_active) bgColor = "bg-gray-300";
                                      else if (spot.is_accessible && spot.has_charger) bgColor = "bg-green-500";
                                      else if (spot.has_charger) bgColor = "bg-yellow-500";
                                      else if (spot.is_accessible) bgColor = "bg-blue-600";

                                      const fontSize = Math.max(spotButtonSize * 0.35, 10);

                                      return (
                                        <div
                                          key={spot.id}
                                          className={cn(
                                            "absolute transform -translate-x-1/2 -translate-y-1/2",
                                            "rounded-lg flex items-center justify-center",
                                            "text-white font-bold shadow-lg border-2 border-white",
                                            "cursor-pointer hover:scale-110 transition-transform",
                                            bgColor
                                          )}
                                          style={{
                                            left: `${spot.position_x}%`,
                                            top: `${spot.position_y}%`,
                                            width: `${spotButtonSize}px`,
                                            height: `${spotButtonSize}px`,
                                            fontSize: `${fontSize}px`,
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSpotClick(spot);
                                          }}
                                          title={`${spot.spot_number}${spot.is_accessible ? ' ♿' : ''}${spot.has_charger ? ' ⚡' : ''}${spot.is_compact ? ' 🚗' : ''}`}
                                        >
                                          <span className="drop-shadow-md">
                                            {spot.spot_number.split('-')[1] || spot.spot_number}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </TransformComponent>
                              </>
                            )}
                          </TransformWrapper>
                        </div>
                      </div>

                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="pt-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Modo Dibujo:</strong> Haz clic en el plano para crear nuevas plazas. 
                            Se creará automáticamente con el siguiente número disponible.
                          </p>
                          <p className="text-sm text-yellow-800 mt-2">
                            <strong>Modo Edición:</strong> Haz clic en una plaza existente para editar sus atributos, 
                            cambiar su número o eliminarla.
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="p-8 text-center bg-muted/50">
                      <p className="text-muted-foreground">
                        {selectedGroupForEditor 
                          ? "Este grupo no tiene un plano cargado. Sube uno en la pestaña 'Grupos de Parking'."
                          : "Selecciona un grupo con plano para comenzar a dibujar plazas"}
                      </p>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>


      {/* Create/Edit Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar Grupo" : "Crear Nuevo Grupo"}
            </DialogTitle>
            <DialogDescription>
              Configura el grupo de plazas de parking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nombre del grupo *</Label>
              <Input
                id="group-name"
                placeholder="Ej: Planta Baja, Zona VIP, etc."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-desc">Descripción</Label>
              <Textarea
                id="group-desc"
                placeholder="Descripción opcional del grupo"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-capacity">Capacidad (número de plazas)</Label>
              <Input
                id="group-capacity"
                type="number"
                min="0"
                value={groupCapacity}
                onChange={(e) => setGroupCapacity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor-plan">Plano del parking (imagen)</Label>
              <Input
                id="floor-plan"
                type="file"
                accept="image/*"
                onChange={(e) => setFloorPlanFile(e.target.files?.[0] || null)}
              />
              {editingGroup?.floor_plan_url && !floorPlanFile && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Plano actual:</p>
                  <img
                    src={editingGroup.floor_plan_url}
                    alt="Plano actual"
                    className="w-full max-h-48 object-contain border rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrUpdateGroup}
              disabled={!groupName.trim() || uploadingFloorPlan}
            >
              {uploadingFloorPlan ? "Subiendo..." : editingGroup ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Groups Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Grupos</DialogTitle>
            <DialogDescription>
              Selecciona los grupos a los que tendrá acceso el usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {parkingGroups.filter(g => g.is_active).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay grupos activos disponibles
              </p>
            ) : (
              parkingGroups.filter(g => g.is_active).map(group => (
                <div key={group.id} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={selectedUserGroups.includes(group.id)}
                    onCheckedChange={() => toggleGroupForUser(group.id)}
                    className="mt-1"
                  />
                  <Label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Capacidad: {group.capacity} plazas
                      </p>
                    </div>
                  </Label>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserGroupAssignments}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spot Attributes Dialog */}
      <Dialog open={spotAttributesDialogOpen} onOpenChange={setSpotAttributesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plaza</DialogTitle>
            <DialogDescription>
              Modifica el número y los atributos especiales de esta plaza
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-spot-number">Número de Plaza</Label>
              <Input
                id="edit-spot-number"
                value={editSpotNumber}
                onChange={(e) => setEditSpotNumber(e.target.value)}
                placeholder="Ej: A-01"
              />
            </div>

            <div className="space-y-3">
              <Label>Atributos Especiales</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-accessible"
                  checked={editSpotAccessible}
                  onCheckedChange={(checked) => setEditSpotAccessible(checked as boolean)}
                />
                <Label htmlFor="edit-accessible" className="cursor-pointer">
                  ♿ Plaza PMR (Movilidad Reducida)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-charger"
                  checked={editSpotCharger}
                  onCheckedChange={(checked) => setEditSpotCharger(checked as boolean)}
                />
                <Label htmlFor="edit-charger" className="cursor-pointer">
                  ⚡ Con Cargador Eléctrico
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-compact"
                  checked={editSpotCompact}
                  onCheckedChange={(checked) => setEditSpotCompact(checked as boolean)}
                />
                <Label htmlFor="edit-compact" className="cursor-pointer">
                  🚗 Plaza Reducida (Aviso)
                </Label>
              </div>
            </div>

            {selectedSpotForEdit && (
              <Card className="p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Posición en plano:</strong> X: {selectedSpotForEdit.position_x?.toFixed(1)}%, 
                  Y: {selectedSpotForEdit.position_y?.toFixed(1)}%
                </p>
              </Card>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteSpot}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Plaza
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSpotAttributesDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateSpotAttributes}>
                Guardar Cambios
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Bloqueo de Usuario */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Usuario</DialogTitle>
            <DialogDescription>
              El usuario no podrá acceder al sistema hasta que lo desbloquees.
              Se le mostrará el motivo del bloqueo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo del bloqueo (visible para el usuario)</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ej: Incumplimiento de normas de aparcamiento..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedUserForAction) {
                  handleBlockUser(selectedUserForAction.id, blockReason);
                }
              }}
              disabled={!blockReason.trim()}
            >
              Bloquear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Baja de Usuario */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de Baja Usuario</DialogTitle>
            <DialogDescription>
              El usuario será dado de baja manteniendo todo su historial.
              Sus matrículas serán liberadas para otros usuarios.
              Si lo reactivas, deberá solicitar sus matrículas de nuevo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedUserForAction) {
                  handleDeactivateUser(selectedUserForAction.id);
                }
              }}
            >
              Dar de Baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Borrado Permanente */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              ⚠️ BORRADO PERMANENTE ⚠️
            </DialogTitle>
            <DialogDescription className="text-destructive font-semibold">
              ESTA ACCIÓN ES IRREVERSIBLE
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Se eliminará permanentemente:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
              <li>Cuenta de usuario</li>
              <li>Todas las matrículas</li>
              <li>Historial de reservas</li>
              <li>Reportes de incidentes</li>
              <li>Asignaciones de grupos</li>
              <li>Roles y permisos</li>
            </ul>
            <div className="bg-destructive/10 p-4 rounded-md border border-destructive">
              <p className="text-sm font-semibold text-destructive mb-2">
                Ingresa la contraseña de confirmación:
              </p>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Contraseña de confirmación"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Contraseña: 12345678
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletePassword("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedUserForAction) {
                  handlePermanentlyDeleteUser(selectedUserForAction.id, deletePassword);
                }
              }}
              disabled={deletePassword !== "12345678"}
            >
              BORRAR PERMANENTEMENTE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Bloquear día */}
      <Dialog open={blockDateDialogOpen} onOpenChange={setBlockDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Día para Reservas</DialogTitle>
            <DialogDescription>
              Selecciona un día en el que NO se permitirán reservas en ningún grupo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha a bloquear</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateToBlock && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateToBlock 
                      ? format(dateToBlock, 'dd/MM/yyyy', { locale: es })
                      : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateToBlock}
                    onSelect={setDateToBlock}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-reason">Motivo del bloqueo</Label>
              <Input
                id="block-reason"
                value={blockDateReason}
                onChange={(e) => setBlockDateReason(e.target.value)}
                placeholder="Ej: Fuerza Mayor, Mantenimiento..."
              />
            </div>

            <div className="space-y-2">
              <Label>Aplicar bloqueo a</Label>
              <Select
                value={blockDateGroupId || "global"}
                onValueChange={(value) => setBlockDateGroupId(value === "global" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">🌍 Todos los grupos (Global)</SelectItem>
                  {parkingGroups.filter(g => g.is_active && !g.deactivated_at).map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      📍 {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {blockDateGroupId 
                  ? "Este bloqueo solo afectará al grupo seleccionado"
                  : "Este bloqueo afectará a todos los grupos de parking"}
              </p>
            </div>

            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs space-y-1">
              <p className="font-medium text-destructive">⚠️ Atención:</p>
              <p className="text-muted-foreground">
                Si ya existen reservas para este día, serán <strong>canceladas automáticamente</strong> con el motivo especificado.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setBlockDateDialogOpen(false);
                setDateToBlock(undefined);
                setBlockDateReason("Fuerza Mayor");
                setBlockDateGroupId(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleBlockDate}
              disabled={!dateToBlock}
              className="w-full sm:w-auto"
            >
              Bloquear Día
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Dar de baja grupo */}
      <Dialog open={deactivateGroupDialogOpen} onOpenChange={setDeactivateGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              ⚠️ Dar de Baja Grupo: {groupToDeactivate?.name}
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong>irreversible</strong> y tendrá los siguientes efectos:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>El grupo se marcará como dado de baja permanentemente</li>
              <li>Todas las plazas del grupo se desactivarán</li>
              <li>Todas las reservas futuras se cancelarán automáticamente</li>
              <li>El grupo quedará en el historial pero no será utilizable</li>
            </ul>

            <div className="space-y-2 pt-4">
              <Label htmlFor="deactivation-reason">
                Motivo de la baja <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="deactivation-reason"
                placeholder="Explica por qué se da de baja este grupo..."
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeactivateGroupDialogOpen(false);
                setGroupToDeactivate(null);
                setDeactivationReason("");
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeactivateGroup}
              disabled={!deactivationReason.trim()}
              className="w-full sm:w-auto"
            >
              Confirmar Baja Definitiva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Programar desactivación */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Programar Desactivación: {groupToSchedule?.name}
            </DialogTitle>
            <DialogDescription>
              Selecciona la fecha desde la cual el grupo se desactivará automáticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha de desactivación</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate 
                      ? format(scheduledDate, 'dd/MM/yyyy', { locale: es })
                      : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                A partir de esta fecha, no se aceptarán nuevas reservas para este grupo
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
              <p className="font-medium">ℹ️ Efectos de la desactivación programada:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Las reservas anteriores a esta fecha seguirán siendo válidas</li>
                <li>No se podrá reservar en este grupo desde esta fecha en adelante</li>
                <li>Puedes cancelar la programación en cualquier momento antes de la fecha</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setScheduleDialogOpen(false);
                setGroupToSchedule(null);
                setScheduledDate(undefined);
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleScheduleDeactivation}
              disabled={!scheduledDate}
              className="w-full sm:w-auto"
            >
              Programar Desactivación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
