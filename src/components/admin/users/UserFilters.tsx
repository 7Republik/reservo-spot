import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { ParkingGroup } from "@/types/admin";

interface UserFiltersProps {
  roleFilter: string[];
  statusFilter: string[];
  groupFilter: string[];
  parkingGroups: ParkingGroup[];
  onRoleFilterChange: (roles: string[]) => void;
  onStatusFilterChange: (statuses: string[]) => void;
  onGroupFilterChange: (groups: string[]) => void;
  onClearFilters: () => void;
}

export const UserFilters = ({
  roleFilter,
  statusFilter,
  groupFilter,
  parkingGroups,
  onRoleFilterChange,
  onStatusFilterChange,
  onGroupFilterChange,
}: UserFiltersProps) => {
  const roles = [
    { value: "admin", label: "Admin", color: "bg-red-500 hover:bg-red-600" },
    { value: "director", label: "Director", color: "bg-purple-500 hover:bg-purple-600" },
    { value: "preferred", label: "Preferente", color: "bg-blue-500 hover:bg-blue-600" },
    { value: "visitor", label: "Visitante", color: "bg-orange-500 hover:bg-orange-600" },
    { value: "general", label: "General", color: "bg-gray-500 hover:bg-gray-600" },
  ];

  const statuses = [
    { value: "active", label: "Activo", color: "bg-green-500 hover:bg-green-600" },
    { value: "blocked", label: "Bloqueado", color: "bg-red-500 hover:bg-red-600" },
    { value: "deactivated", label: "Desactivado", color: "bg-gray-500 hover:bg-gray-600" },
  ];

  const handleRoleToggle = (role: string) => {
    if (roleFilter.includes(role)) {
      onRoleFilterChange(roleFilter.filter(r => r !== role));
    } else {
      onRoleFilterChange([...roleFilter, role]);
    }
  };

  const handleStatusToggle = (status: string) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    if (groupFilter.includes(groupId)) {
      onGroupFilterChange(groupFilter.filter(g => g !== groupId));
    } else {
      onGroupFilterChange([...groupFilter, groupId]);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Roles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Roles</h4>
              {roleFilter.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {roleFilter.length} seleccionado{roleFilter.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const isSelected = roleFilter.includes(role.value);
                return (
                  <Badge
                    key={role.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? `${role.color} text-white border-transparent` 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleRoleToggle(role.value)}
                  >
                    {role.label}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Estado</h4>
              {statusFilter.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {statusFilter.length} seleccionado{statusFilter.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const isSelected = statusFilter.includes(status.value);
                return (
                  <Badge
                    key={status.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? `${status.color} text-white border-transparent` 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleStatusToggle(status.value)}
                  >
                    {status.label}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Groups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Grupos de Parking</h4>
              {groupFilter.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {groupFilter.length} seleccionado{groupFilter.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
              {parkingGroups.map((group) => {
                const isSelected = groupFilter.includes(group.id);
                return (
                  <Badge
                    key={group.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleGroupToggle(group.id)}
                  >
                    {group.name}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
