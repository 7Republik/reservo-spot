import { useState, useEffect, useMemo } from "react";
import { Users, Search, Filter, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUserManagement } from "@/hooks/admin/useUserManagement";
import { UserCard } from "./UserCard";
import { BlockUserDialog } from "./BlockUserDialog";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { BulkActionsPanel } from "./BulkActionsPanel";
import { UserFilters } from "./UserFilters";
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

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string[]>([]);

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Dialogs
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserWithRole | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers(true);
  }, []);

  const getGroupCount = (user: UserWithRole) => {
    return (userGroupAssignments[user.id] || []).length;
  };

  const getPlateCount = (user: UserWithRole) => {
    return user.license_plates?.length || 0;
  };

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = user.name?.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Role filter
      if (roleFilter.length > 0) {
        const userRoles = user.user_roles.map(ur => ur.role);
        const hasMatchingRole = roleFilter.some(role => userRoles.includes(role));
        if (!hasMatchingRole) return false;
      }

      // Status filter
      if (statusFilter.length > 0) {
        if (statusFilter.includes("blocked") && !user.is_blocked) return false;
        if (statusFilter.includes("active") && (user.is_blocked || user.is_deactivated)) return false;
        if (statusFilter.includes("deactivated") && !user.is_deactivated) return false;
      }

      // Group filter
      if (groupFilter.length > 0) {
        const userGroups = userGroupAssignments[user.id] || [];
        const hasMatchingGroup = groupFilter.some(groupId => userGroups.includes(groupId));
        if (!hasMatchingGroup) return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, groupFilter, userGroupAssignments]);

  const handleToggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedUsers(new Set());
    setBulkMode(false);
  };

  const handleBulkActionComplete = () => {
    setSelectedUsers(new Set());
    loadUsers(true);
    onReloadAssignments();
  };

  const selectedUserObjects = useMemo(() => {
    return users.filter(u => selectedUsers.has(u.id));
  }, [users, selectedUsers]);

  if (loading) {
    return <UsersSkeleton />;
  }

  const allSelected = filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length;
  const someSelected = selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>
                Gestiona roles, permisos y matrículas de los usuarios
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={bulkMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBulkMode(!bulkMode);
                  if (bulkMode) setSelectedUsers(new Set());
                }}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {bulkMode ? "Cancelar Selección" : "Selección Múltiple"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <UserFilters
                roleFilter={roleFilter}
                statusFilter={statusFilter}
                groupFilter={groupFilter}
                parkingGroups={parkingGroups}
                onRoleFilterChange={setRoleFilter}
                onStatusFilterChange={setStatusFilter}
                onGroupFilterChange={setGroupFilter}
                onClearFilters={() => {
                  setRoleFilter([]);
                  setStatusFilter([]);
                  setGroupFilter([]);
                }}
              />
            )}

            {/* Results summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </span>
              {(roleFilter.length > 0 || statusFilter.length > 0 || groupFilter.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRoleFilter([]);
                    setStatusFilter([]);
                    setGroupFilter([]);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Bulk selection header */}
          {bulkMode && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleSelectAll}
                  className="h-8 px-2"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : someSelected ? (
                    <Square className="h-4 w-4 opacity-50" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm font-medium">
                  {selectedUsers.size > 0 ? (
                    <>
                      {selectedUsers.size} usuario{selectedUsers.size !== 1 ? "s" : ""} seleccionado{selectedUsers.size !== 1 ? "s" : ""}
                    </>
                  ) : (
                    "Seleccionar todos"
                  )}
                </span>
              </div>
              {selectedUsers.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                >
                  Limpiar selección
                </Button>
              )}
            </div>
          )}

          {/* Bulk actions panel */}
          {bulkMode && selectedUsers.size > 0 && (
            <BulkActionsPanel
              selectedUsers={selectedUserObjects}
              parkingGroups={parkingGroups}
              onActionComplete={handleBulkActionComplete}
            />
          )}

          {/* Users list */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron usuarios con los filtros aplicados
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-start gap-3">
                  {bulkMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleUser(user.id)}
                      className="h-8 w-8 p-0 mt-4"
                    >
                      {selectedUsers.has(user.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <div className="flex-1">
                    <UserCard
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
                  </div>
                </div>
              ))
            )}
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
