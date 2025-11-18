import { UserCircle, Shield, ChevronDown, ChevronUp, ParkingSquare, CreditCard, Check, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserWithRole, ParkingGroup } from "@/types/admin";
import { supabase } from "@/integrations/supabase/client";

interface UserCardProps {
  user: UserWithRole;
  isExpanded: boolean;
  activeTab: string;
  savingUserId: string | null;
  parkingGroups: ParkingGroup[];
  userGroupAssignments: Record<string, string[]>;
  onToggleExpanded: () => void;
  onSetTab: (tab: string) => void;
  onDebouncedSaveRoles: (userId: string, roles: string[], isAdmin: boolean) => void;
  onApprovePlate: (plateId: string) => Promise<void>;
  onRejectPlate: (plateId: string, reason: string) => Promise<void>;
  onBlockUser: () => void;
  onUnblockUser: (userId: string) => Promise<boolean>;
  onDeactivateUser: () => void;
  onReactivateUser: (userId: string) => Promise<boolean>;
  onDeleteUser: () => void;
  onReloadAssignments: () => void;
  getGroupCount: (user: UserWithRole) => number;
  getPlateCount: (user: UserWithRole) => number;
}

export const UserCard = ({
  user,
  isExpanded,
  activeTab,
  savingUserId,
  parkingGroups,
  userGroupAssignments,
  onToggleExpanded,
  onSetTab,
  onDebouncedSaveRoles,
  onApprovePlate,
  onRejectPlate,
  onBlockUser,
  onUnblockUser,
  onDeactivateUser,
  onReactivateUser,
  onDeleteUser,
  onReloadAssignments,
  getGroupCount,
  getPlateCount,
}: UserCardProps) => {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
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
                {isExpanded ? (
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
              value={activeTab || "permissions"} 
              onValueChange={onSetTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 bg-card">
                <TabsTrigger 
                  value="permissions"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Permisos
                </TabsTrigger>
                <TabsTrigger 
                  value="groups"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Grupos
                </TabsTrigger>
                <TabsTrigger 
                  value="plates"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Matrículas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="permissions" className="space-y-3 mt-4">
                <div className="flex items-center space-x-2 p-3 bg-background rounded-lg border">
                  <Checkbox
                    id={`${user.id}-admin`}
                    checked={user.user_roles.some(ur => ur.role === 'admin')}
                    onCheckedChange={(checked) => {
                      const currentRoles = user.user_roles.filter(ur => ur.role !== 'admin').map(ur => ur.role);
                      onDebouncedSaveRoles(user.id, currentRoles, !!checked);
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
                                  
                                  onReloadAssignments();
                                } catch (error) {
                                  console.error("Error updating group assignment:", error);
                                  toast.error("Error al actualizar acceso a grupos");
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
                              onClick={() => onApprovePlate(plate.id)}
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
                                  await onRejectPlate(plate.id, reason);
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
                              onClick={() => onApprovePlate(plate.id)}
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
                    onClick={onBlockUser}
                  >
                    🚫 Bloquear Usuario
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onUnblockUser(user.id)}
                  >
                    ✅ Desbloquear Usuario
                  </Button>
                )}

                {!user.is_deactivated ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onDeactivateUser}
                  >
                    ⚠️ Dar de Baja
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onReactivateUser(user.id)}
                  >
                    ♻️ Reactivar Usuario
                  </Button>
                )}

                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={onDeleteUser}
                >
                  🗑️ Borrar Permanente
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
