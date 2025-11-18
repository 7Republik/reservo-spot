import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Unlock, UserX, UserCheck, Users as UsersIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWithRole, ParkingGroup } from "@/types/admin";

interface BulkActionsPanelProps {
  selectedUsers: UserWithRole[];
  parkingGroups: ParkingGroup[];
  onActionComplete: () => void;
}

type BulkAction = "block" | "unblock" | "deactivate" | "reactivate" | "assign-group" | "remove-group" | "delete";

export const BulkActionsPanel = ({
  selectedUsers,
  parkingGroups,
  onActionComplete,
}: BulkActionsPanelProps) => {
  const [selectedAction, setSelectedAction] = useState<BulkAction | "">("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleExecuteAction = async () => {
    if (!selectedAction) return;

    setProcessing(true);
    try {
      const userIds = selectedUsers.map(u => u.id);

      switch (selectedAction) {
        case "block":
          await bulkBlockUsers(userIds);
          toast.success(`${userIds.length} usuarios bloqueados`);
          break;

        case "unblock":
          await bulkUnblockUsers(userIds);
          toast.success(`${userIds.length} usuarios desbloqueados`);
          break;

        case "deactivate":
          await bulkDeactivateUsers(userIds);
          toast.success(`${userIds.length} usuarios desactivados`);
          break;

        case "reactivate":
          await bulkReactivateUsers(userIds);
          toast.success(`${userIds.length} usuarios reactivados`);
          break;

        case "assign-group":
          if (!selectedGroupId) {
            toast.error("Selecciona un grupo");
            return;
          }
          await bulkAssignGroup(userIds, selectedGroupId);
          toast.success(`Grupo asignado a ${userIds.length} usuarios`);
          break;

        case "remove-group":
          if (!selectedGroupId) {
            toast.error("Selecciona un grupo");
            return;
          }
          await bulkRemoveGroup(userIds, selectedGroupId);
          toast.success(`Grupo removido de ${userIds.length} usuarios`);
          break;

        case "delete":
          await bulkDeleteUsers(userIds);
          toast.success(`${userIds.length} usuarios eliminados`);
          break;
      }

      onActionComplete();
      setConfirmDialogOpen(false);
      setSelectedAction("");
      setSelectedGroupId("");
    } catch (error: any) {
      console.error("Error executing bulk action:", error);
      toast.error(error.message || "Error al ejecutar la acción");
    } finally {
      setProcessing(false);
    }
  };

  const bulkBlockUsers = async (userIds: string[]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: true })
      .in("id", userIds);

    if (error) throw error;
  };

  const bulkUnblockUsers = async (userIds: string[]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: false })
      .in("id", userIds);

    if (error) throw error;
  };

  const bulkDeactivateUsers = async (userIds: string[]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_deactivated: true })
      .in("id", userIds);

    if (error) throw error;
  };

  const bulkReactivateUsers = async (userIds: string[]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_deactivated: false })
      .in("id", userIds);

    if (error) throw error;
  };

  const bulkAssignGroup = async (userIds: string[], groupId: string) => {
    // Get existing assignments
    const { data: existing } = await supabase
      .from("user_group_assignments")
      .select("user_id")
      .in("user_id", userIds)
      .eq("group_id", groupId);

    const existingUserIds = new Set(existing?.map(e => e.user_id) || []);
    const newAssignments = userIds
      .filter(id => !existingUserIds.has(id))
      .map(userId => ({ user_id: userId, group_id: groupId }));

    if (newAssignments.length > 0) {
      const { error } = await supabase
        .from("user_group_assignments")
        .insert(newAssignments);

      if (error) throw error;
    }
  };

  const bulkRemoveGroup = async (userIds: string[], groupId: string) => {
    const { error } = await supabase
      .from("user_group_assignments")
      .delete()
      .in("user_id", userIds)
      .eq("group_id", groupId);

    if (error) throw error;
  };

  const bulkDeleteUsers = async (userIds: string[]) => {
    // Delete in order: user_roles, user_group_assignments, license_plates, profiles
    await supabase.from("user_roles").delete().in("user_id", userIds);
    await supabase.from("user_group_assignments").delete().in("user_id", userIds);
    await supabase.from("license_plates").delete().in("user_id", userIds);
    
    const { error } = await supabase
      .from("profiles")
      .delete()
      .in("id", userIds);

    if (error) throw error;
  };

  const getActionDescription = () => {
    const count = selectedUsers.length;
    const users = count === 1 ? "usuario" : "usuarios";

    switch (selectedAction) {
      case "block":
        return `¿Bloquear ${count} ${users}? No podrán hacer reservas.`;
      case "unblock":
        return `¿Desbloquear ${count} ${users}?`;
      case "deactivate":
        return `¿Desactivar ${count} ${users}? Se cancelarán sus reservas futuras.`;
      case "reactivate":
        return `¿Reactivar ${count} ${users}?`;
      case "assign-group":
        const group = parkingGroups.find(g => g.id === selectedGroupId);
        return `¿Asignar el grupo "${group?.name}" a ${count} ${users}?`;
      case "remove-group":
        const groupToRemove = parkingGroups.find(g => g.id === selectedGroupId);
        return `¿Remover el grupo "${groupToRemove?.name}" de ${count} ${users}? Se cancelarán sus reservas en ese grupo.`;
      case "delete":
        return `¿ELIMINAR PERMANENTEMENTE ${count} ${users}? Esta acción no se puede deshacer.`;
      default:
        return "";
    }
  };

  const needsGroupSelection = selectedAction === "assign-group" || selectedAction === "remove-group";
  const canExecute = selectedAction && (!needsGroupSelection || selectedGroupId);

  return (
    <>
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Acciones Masivas</CardTitle>
          <CardDescription>
            Aplicar acciones a {selectedUsers.length} usuario{selectedUsers.length !== 1 ? "s" : ""} seleccionado{selectedUsers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h3 className="text-base font-semibold">Estado de Usuarios</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-5">
              <Button
                variant={selectedAction === "block" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAction("block")}
                className="justify-start"
              >
                <Lock className="h-4 w-4 mr-2" />
                Bloquear
              </Button>
              <Button
                variant={selectedAction === "unblock" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAction("unblock")}
                className="justify-start"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Desbloquear
              </Button>
              <Button
                variant={selectedAction === "deactivate" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAction("deactivate")}
                className="justify-start"
              >
                <UserX className="h-4 w-4 mr-2" />
                Desactivar
              </Button>
              <Button
                variant={selectedAction === "reactivate" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAction("reactivate")}
                className="justify-start"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Reactivar
              </Button>
            </div>
          </div>

          <div className="border-t" />

          {/* Grupos Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h3 className="text-base font-semibold">Gestión de Grupos</h3>
            </div>
            <div className="space-y-2 pl-5">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedAction === "assign-group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAction("assign-group")}
                  className="justify-start"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Asignar Grupo
                </Button>
                <Button
                  variant={selectedAction === "remove-group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAction("remove-group")}
                  className="justify-start"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Remover Grupo
                </Button>
              </div>
              {needsGroupSelection && (
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {parkingGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* Danger Zone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-destructive rounded-full" />
              <h3 className="text-base font-semibold text-destructive">Zona Peligrosa</h3>
            </div>
            <div className="pl-5">
              <Button
                variant={selectedAction === "delete" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setSelectedAction("delete")}
                className="w-full justify-start border-destructive/50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Permanentemente
              </Button>
            </div>
          </div>

          <div className="border-t" />

          {/* Execute button */}
          <Button
            className="w-full"
            size="lg"
            disabled={!canExecute || processing}
            onClick={() => setConfirmDialogOpen(true)}
          >
            {processing ? "Procesando..." : "Ejecutar Acción"}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Acción Masiva</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteAction}
              disabled={processing}
              className={selectedAction === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {processing ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
