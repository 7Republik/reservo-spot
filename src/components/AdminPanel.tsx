import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Users, ParkingSquare, Calendar, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";

interface LicensePlate {
  id: string;
  plate_number: string;
  user_id: string;
  is_approved: boolean;
  profiles: {
    email: string;
    full_name: string;
  };
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  user_roles: Array<{ role: string }>;
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
      
      // Get roles separately
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);
          
          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );
      
      setUsers(usersWithRoles as any);
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

  const handleApprovePlate = async (plateId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("license_plates")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: sessionData.session?.user.id,
        })
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Matrícula aprobada correctamente");
      loadPendingPlates();
    } catch (error: any) {
      console.error("Error approving plate:", error);
      toast.error("Error al aprobar la matrícula");
    }
  };

  const handleRejectPlate = async (plateId: string) => {
    try {
      const { error } = await supabase
        .from("license_plates")
        .delete()
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Matrícula rechazada y eliminada");
      loadPendingPlates();
    } catch (error: any) {
      console.error("Error rejecting plate:", error);
      toast.error("Error al rechazar la matrícula");
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      // Delete existing roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{
          user_id: userId,
          role: newRole as any,
        }]);

      if (error) throw error;

      toast.success("Rol actualizado correctamente");
      loadUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar el rol");
    }
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
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-lg">
                            {plate.plate_number}
                          </div>
                          <div>
                            <p className="font-medium">{plate.profiles.full_name || "Sin nombre"}</p>
                            <p className="text-sm text-muted-foreground">{plate.profiles.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprovePlate(plate.id)}
                            className="bg-success hover:bg-success/90"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectPlate(plate.id)}
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
                Gestión de Roles de Usuario
              </CardTitle>
              <CardDescription>
                Asigna roles y permisos a los usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="font-medium">{user.full_name || "Sin nombre"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          defaultValue={user.user_roles[0]?.role || "general"}
                          onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="preferred">Preferente</SelectItem>
                            <SelectItem value="director">Director</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant="outline">
                          {user.user_roles[0]?.role || "general"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
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
    </div>
  );
};

export default AdminPanel;
