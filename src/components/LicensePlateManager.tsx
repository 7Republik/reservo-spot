import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Check, Clock, Trash2, X, AlertCircle } from "lucide-react";
import { z } from "zod";

interface LicensePlateManagerProps {
  userId: string;
}

interface LicensePlate {
  id: string;
  plate_number: string;
  is_approved: boolean;
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  requested_electric: boolean;
  approved_electric: boolean;
  requested_disability: boolean;
  approved_disability: boolean;
}

const plateSchema = z.object({
  plateNumber: z.string()
    .trim()
    .min(4, "La matrícula debe tener al menos 4 caracteres")
    .max(10, "La matrícula no puede tener más de 10 caracteres")
    .regex(/^([A-Z]{1,2}\d{4}[A-Z]{0,2}|\d{4}[A-Z]{3})$/, "Formato inválido. Use formato español: 1234ABC, A1234BC, o AB1234C"),
});

const LicensePlateManager = ({ userId }: LicensePlateManagerProps) => {
  const [plates, setPlates] = useState<LicensePlate[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestedElectric, setRequestedElectric] = useState(false);
  const [requestedDisability, setRequestedDisability] = useState(false);

  useEffect(() => {
    loadPlates();
  }, [userId]);

  const loadPlates = async () => {
    try {
      const { data, error } = await supabase
        .from("license_plates")
        .select("*")
        .eq("user_id", userId)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setPlates(data || []);
    } catch (error: any) {
      console.error("Error loading plates:", error);
      toast.error("Error al cargar las matrículas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlate = async () => {
    try {
      const upperPlate = newPlate.toUpperCase();
      const validated = plateSchema.parse({ plateNumber: upperPlate });

      const { error } = await supabase
        .from("license_plates")
        .insert({
          user_id: userId,
          plate_number: validated.plateNumber,
          is_approved: false,
          requested_electric: requestedElectric,
          requested_disability: requestedDisability,
        });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("Esta matrícula ya está registrada");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Matrícula añadida. Pendiente de aprobación del administrador");
      setNewPlate("");
      setRequestedElectric(false);
      setRequestedDisability(false);
      loadPlates();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error adding plate:", error);
        toast.error("Error al añadir la matrícula");
      }
    }
  };

  const handleDeletePlate = async (plateId: string) => {
    try {
      const { error } = await supabase
        .from("license_plates")
        .delete()
        .eq("id", plateId);

      if (error) throw error;

      toast.success("Matrícula eliminada. Puedes volver a solicitarla");
      loadPlates();
    } catch (error: any) {
      console.error("Error deleting plate:", error);
      toast.error("Error al eliminar la matrícula");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Plate */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="plate">Nueva Matrícula</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="plate"
                placeholder="1234ABC"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                maxLength={10}
                className="flex-1"
              />
              <Button onClick={handleAddPlate} disabled={!newPlate.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              La matrícula debe ser aprobada por un administrador antes de poder usarse
            </p>
          </div>

          <div className="space-y-3 mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Permisos especiales (opcional)</p>
            <p className="text-xs text-muted-foreground">
              Marca las opciones que apliquen a este vehículo. El administrador revisará tu solicitud.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="electric" 
                  checked={requestedElectric}
                  onCheckedChange={(checked) => setRequestedElectric(checked as boolean)}
                />
                <Label htmlFor="electric" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  ⚡ Mi vehículo es eléctrico
                  <span className="text-xs text-muted-foreground">(para acceso a plazas con cargador)</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="disability" 
                  checked={requestedDisability}
                  onCheckedChange={(checked) => setRequestedDisability(checked as boolean)}
                />
                <Label htmlFor="disability" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  ♿ Tengo permiso de movilidad reducida
                  <span className="text-xs text-muted-foreground">(para acceso a plazas PMR)</span>
                </Label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Plates List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Mis Matrículas</h3>
        
        {plates.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <p>No tienes matrículas registradas</p>
              <p className="text-sm mt-2">Añade tu primera matrícula para empezar</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {plates.map((plate) => (
              <Card key={plate.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* European License Plate Design */}
                    <div className="flex items-center border-2 border-black rounded overflow-hidden shadow-md">
                      {/* Blue EU Section */}
                      <div className="bg-[#003399] flex flex-col items-center justify-center px-2 py-2 text-white">
                        <div className="text-sm leading-none mb-1" style={{ color: '#FFD700' }}>★</div>
                        <div className="text-xs font-bold leading-none">E</div>
                      </div>
                      {/* White Plate Section */}
                      <div className="bg-white px-4 py-2">
                        <div className="font-mono font-bold text-2xl text-black tracking-wider">
                          {plate.plate_number}
                        </div>
                      </div>
                    </div>
                    <div>
                      {plate.rejected_at ? (
                        <>
                          <Badge variant="destructive" className="gap-1">
                            <X className="h-3 w-3" />
                            Rechazada
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Rechazada el {new Date(plate.rejected_at).toLocaleDateString()}
                          </p>
                        </>
                      ) : plate.is_approved ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-success text-success-foreground gap-1">
                              <Check className="h-3 w-3" />
                              Aprobada
                            </Badge>
                            {plate.approved_electric && (
                              <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800">
                                ⚡
                              </Badge>
                            )}
                            {plate.approved_disability && (
                              <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800">
                                ♿
                              </Badge>
                            )}
                          </div>
                          {plate.approved_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Aprobada el {new Date(plate.approved_at).toLocaleDateString()}
                            </p>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="border-warning text-warning gap-1">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  </div>
                  {plate.rejected_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlate(plate.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
                {plate.rejected_at && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-destructive mb-1">
                        Matrícula rechazada
                      </p>
                      {plate.rejection_reason && (
                        <p className="text-sm text-destructive/90 mb-2">
                          <span className="font-medium">Motivo:</span> {plate.rejection_reason}
                        </p>
                      )}
                      <p className="text-sm text-destructive/80">
                        Puedes eliminarla y volver a solicitarla después de verificar los datos con la empresa.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LicensePlateManager;
