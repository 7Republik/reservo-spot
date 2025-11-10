import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Users, ParkingSquare, Plus, Trash2, ChevronDown, ChevronUp, CreditCard, Shield, UserCircle } from "lucide-react";
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

interface LicensePlate {
  id: string;
  plate_number: string;
  user_id: string;
  is_approved: boolean;
  requested_electric: boolean;
  approved_electric: boolean;
  requested_disability: boolean;
  approved_disability: boolean;
  profiles: {
    email: string;
    full_name: string;
  };
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  user_roles: Array<{ id: string; role: string }>;
  license_plates?: Array<{
    id: string;
    plate_number: string;
    is_approved: boolean;
    rejected_at: string | null;
    rejection_reason: string | null;
    approved_electric: boolean;
    approved_disability: boolean;
  }>;
}

interface ParkingSpot {
  id: string;
  spot_number: string;
  spot_type: string;
  is_active: boolean;
}

const AdminPanel = () => {
  const [pendingPlates, setPendingPlates] = useState<LicensePlate[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [newSpotNumber, setNewSpotNumber] = useState("");
  const [newSpotType, setNewSpotType] = useState("general");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState<LicensePlate | null>(null);
  const [approveElectric, setApproveElectric] = useState(false);
  const [approveDisability, setApproveDisability] = useState(false);

  useEffect(() => {
    loadPendingPlates();
    loadUsers();
    loadSpots();
  }, []);

  const loadPendingPlates = async () => {
    try {
      const { data: plates, error } = await supabase
        .from("license_plates")
        .select("*")
        .eq("is_approved", false)
        .is("rejected_at", null)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      
      // Get profiles separately
      const platesWithProfiles = await Promise.all(
        (plates || []).map(async (plate) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", plate.user_id)
            .single();
          
          return {
            ...plate,
            profiles: profile || { email: "", full_name: "" }
          };
        })
      );
      
      setPendingPlates(platesWithProfiles as any);
    } catch (error: any) {
      console.error("Error loading pending plates:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
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
            .select("id, plate_number, is_approved, rejected_at, rejection_reason")
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
        .select("*")
        .order("spot_number");

      if (error) throw error;
      setSpots(data || []);
    } catch (error: any) {
      console.error("Error loading spots:", error);
    }
  };

  const handleApprovePlateWithPermissions = (plate: LicensePlate) => {
    setSelectedPlate(plate);
    setApproveElectric(plate.requested_electric);
    setApproveDisability(plate.requested_disability);
    setApproveDialogOpen(true);
  };

  const confirmApproval = async () => {
    if (!selectedPlate) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("license_plates")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: sessionData.session?.user.id,
          approved_electric: approveElectric,
          approved_disability: approveDisability,
        })
        .eq("id", selectedPlate.id);

      if (error) throw error;

      toast.success("Matrícula aprobada correctamente");
      setApproveDialogOpen(false);
      setSelectedPlate(null);
      loadPendingPlates();
    } catch (error: any) {
      console.error("Error approving plate:", error);
      toast.error("Error al aprobar la matrícula");
    }
  };

  const handleRejectPlate = async () => {
    if (!selectedPlateId) return;
    
    try {
      const { error } = await supabase
        .from("license_plates")
        .update({
          rejected_at: new Date().toISOString(),
          is_approved: false,
          rejection_reason: rejectionReason.trim() || "No se especificó motivo",
        })
        .eq("id", selectedPlateId);

      if (error) throw error;

      toast.success("Matrícula rechazada. El usuario será notificado");
      setRejectDialogOpen(false);
      setSelectedPlateId(null);
      setRejectionReason("");
      loadPendingPlates();
    } catch (error: any) {
      console.error("Error rejecting plate:", error);
      toast.error("Error al rechazar la matrícula");
    }
  };

  const openRejectDialog = (plateId: string) => {
    setSelectedPlateId(plateId);
    setRejectionReason("");
    setRejectDialogOpen(true);
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

  const getRoleCount = (user: UserWithRole) => {
    return user.user_roles.filter(ur => ur.role !== 'admin').length;
  };

  const getPlateCount = (user: UserWithRole) => {
    return user.license_plates?.length || 0;
  };

  const handleAddSpot = async () => {
    // Validate input with Zod schema
    const spotSchema = z.object({
      spotNumber: z.string()
        .trim()
        .min(1, "El número de plaza no puede estar vacío")
        .max(20, "El número de plaza no puede tener más de 20 caracteres")
        .regex(/^[A-Z0-9-]+$/i, "Solo se permiten letras, números y guiones"),
      spotType: z.enum(['general', 'preferred', 'director', 'visitor', 'admin'] as const, {
        errorMap: () => ({ message: "Tipo de plaza no válido" })
      })
    });

    const validation = spotSchema.safeParse({
      spotNumber: newSpotNumber,
      spotType: newSpotType
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      const { error } = await supabase
        .from("parking_spots")
        .insert([{
          spot_number: validation.data.spotNumber,
          spot_type: validation.data.spotType,
          is_active: true,
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
      setNewSpotType("general");
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plates">Matrículas Pendientes</TabsTrigger>
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="spots">Gestión de Plazas</TabsTrigger>
        </TabsList>

        <TabsContent value="plates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Matrículas Pendientes de Aprobación
              </CardTitle>
              <CardDescription>
                Revisa y aprueba las solicitudes de registro de matrículas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPlates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay matrículas pendientes de aprobación
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPlates.map((plate) => (
                    <Card key={plate.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-lg">
                              {plate.plate_number}
                            </div>
                            <div>
                              <p className="font-medium">{plate.profiles.full_name || "Sin nombre"}</p>
                              <p className="text-sm text-muted-foreground">{plate.profiles.email}</p>
                            </div>
                          </div>
                        </div>

                        {(plate.requested_electric || plate.requested_disability) && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium mb-2">Permisos solicitados:</p>
                            <div className="space-y-2">
                              {plate.requested_electric && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="gap-1">
                                    ⚡ Vehículo eléctrico
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    (Solicita acceso a plazas con cargador)
                                  </span>
                                </div>
                              )}
                              {plate.requested_disability && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="gap-1">
                                    ♿ Movilidad reducida
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    (Solicita acceso a plazas PMR)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprovePlateWithPermissions(plate)}
                            className="bg-success hover:bg-success/90"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(plate.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <ParkingSquare className="h-3 w-3" />
                                    {getRoleCount(user)} grupos
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
                                Selecciona los tipos de plazas que este usuario puede reservar
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {["general", "preferred", "director", "visitor"].map((role) => (
                                  <div key={role} className="flex items-center space-x-2 p-2 bg-background rounded-lg border">
                                    <Checkbox
                                      id={`${user.id}-${role}`}
                                      checked={user.user_roles.some(ur => ur.role === role)}
                                      onCheckedChange={(checked) => {
                                        const currentRoles = user.user_roles.filter(ur => ur.role !== 'admin').map(ur => ur.role);
                                        const newRoles = checked 
                                          ? [...currentRoles.filter(r => r !== role), role]
                                          : currentRoles.filter(r => r !== role);
                                        const isAdmin = user.user_roles.some(ur => ur.role === 'admin');
                                        debouncedSaveRoles(user.id, newRoles, isAdmin);
                                      }}
                                      disabled={savingUserId === user.id}
                                    />
                                    <label
                                      htmlFor={`${user.id}-${role}`}
                                      className="text-sm font-medium leading-none cursor-pointer capitalize"
                                    >
                                      {role === 'general' ? 'General' : 
                                       role === 'preferred' ? 'Preferente' :
                                       role === 'director' ? 'Director' :
                                       'Visitante'}
                                    </label>
                                  </div>
                                ))}
                              </div>
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
                                            <div className="flex items-center gap-2">
                                              <Badge variant="default" className="bg-success gap-1">
                                                <Check className="h-3 w-3" />
                                                Aprobada
                                              </Badge>
                                              {plate.approved_electric && (
                                                <Badge variant="outline" className="gap-1 text-xs">⚡</Badge>
                                              )}
                                              {plate.approved_disability && (
                                                <Badge variant="outline" className="gap-1 text-xs">♿</Badge>
                                              )}
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
                                        {!plate.rejected_at && (
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                              setSelectedPlateId(plate.id);
                                              setRejectionReason("");
                                              setRejectDialogOpen(true);
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
                  <Label>Añadir Nueva Plaza</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Número de plaza (ej: A-01)"
                      value={newSpotNumber}
                      onChange={(e) => setNewSpotNumber(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={newSpotType} onValueChange={setNewSpotType}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="preferred">Preferente</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddSpot}>
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Spots List */}
              <div className="grid gap-3">
                {spots.map((spot) => (
                  <Card key={spot.id} className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-lg">
                          {spot.spot_number}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{spot.spot_type}</Badge>
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
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Matrícula</DialogTitle>
            <DialogDescription>
              Especifica el motivo del rechazo. El usuario podrá ver esta información.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo del rechazo</Label>
              <Textarea
                id="reason"
                placeholder="Ej: Matrícula no coincide con los registros de la empresa"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRejectDialogOpen(false);
              setSelectedPlateId(null);
              setRejectionReason("");
            }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => {
              if (selectedPlateId) {
                handleRejectPlate();
              }
            }}>
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve with Permissions Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Matrícula</DialogTitle>
            <DialogDescription>
              Selecciona qué permisos especiales deseas conceder para la matrícula{" "}
              <strong>{selectedPlate?.plate_number}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedPlate?.requested_electric && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="approve-electric"
                    checked={approveElectric}
                    onCheckedChange={(checked) => setApproveElectric(checked as boolean)}
                  />
                  <Label htmlFor="approve-electric" className="cursor-pointer">
                    ⚡ Conceder permiso de vehículo eléctrico
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Permitirá al usuario reservar plazas con cargador eléctrico
                </p>
              </div>
            )}
            
            {selectedPlate?.requested_disability && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="approve-disability"
                    checked={approveDisability}
                    onCheckedChange={(checked) => setApproveDisability(checked as boolean)}
                  />
                  <Label htmlFor="approve-disability" className="cursor-pointer">
                    ♿ Conceder permiso de movilidad reducida
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Permitirá al usuario reservar plazas PMR
                </p>
              </div>
            )}
            
            {!selectedPlate?.requested_electric && !selectedPlate?.requested_disability && (
              <p className="text-sm text-muted-foreground">
                El usuario no ha solicitado permisos especiales
              </p>
            )}
            
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm">
                💡 <strong>Nota:</strong> Puedes aprobar la matrícula sin conceder todos los permisos solicitados.
                Por ejemplo, si la empresa no permite cargar vehículos eléctricos en el parking.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmApproval} className="bg-success hover:bg-success/90">
              Aprobar Matrícula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
