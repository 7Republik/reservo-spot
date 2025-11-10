import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserManagement } from "@/hooks/admin/useUserManagement";
import { UserCard } from "./UserCard";
import { BlockUserDialog } from "./BlockUserDialog";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UsersSkeleton } from "../skeletons/AdminSkeletons";
import type { UserWithRole, ParkingGroup } from "@/types/admin";

interface UsersTabProps {
  parkingGroups: ParkingGroup[];
  userGroupAssignments: Record<string, string[]>;
  onReloadAssignments: () => void;
}

export const UsersTab = ({ parkingGroups, userGroupAssignments, onReloadAssignments }: UsersTabProps) => {
  const {
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
    debouncedSaveRoles,
    handleApprovePlateFromUser,
    handleRejectPlateFromUser,
    toggleUserExpanded,
    setUserTab,
  } = useUserManagement();

  useEffect(() => {
    loadUsers();
  }, []);

  const [selectedUserForAction, setSelectedUserForAction] = useState<UserWithRole | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getGroupCount = (user: UserWithRole) => {
    return (userGroupAssignments[user.id] || []).length;
  };

  const getPlateCount = (user: UserWithRole) => {
    return user.license_plates?.length || 0;
  };

  if (loading) {
    return <UsersSkeleton />;
  }

  return (
    <>
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
              <UserCard
                key={user.id}
                user={user}
                isExpanded={expandedUsers.has(user.id)}
                activeTab={activeTab[user.id]}
                savingUserId={savingUserId}
                parkingGroups={parkingGroups}
                userGroupAssignments={userGroupAssignments}
                onToggleExpanded={() => toggleUserExpanded(user.id)}
                onSetTab={(tab) => setUserTab(user.id, tab)}
                onDebouncedSaveRoles={debouncedSaveRoles}
                onApprovePlate={handleApprovePlateFromUser}
                onRejectPlate={handleRejectPlateFromUser}
                onBlockUser={() => {
                  setSelectedUserForAction(user);
                  setBlockDialogOpen(true);
                }}
                onUnblockUser={handleUnblockUser}
                onDeactivateUser={() => {
                  setSelectedUserForAction(user);
                  setDeactivateDialogOpen(true);
                }}
                onReactivateUser={handleReactivateUser}
                onDeleteUser={() => {
                  setSelectedUserForAction(user);
                  setDeleteDialogOpen(true);
                }}
                onReloadAssignments={onReloadAssignments}
                getGroupCount={getGroupCount}
                getPlateCount={getPlateCount}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <BlockUserDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        user={selectedUserForAction}
        onConfirm={handleBlockUser}
      />

      <DeactivateUserDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        user={selectedUserForAction}
        onConfirm={handleDeactivateUser}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUserForAction}
        onConfirm={handlePermanentlyDeleteUser}
      />
    </>
  );
};
