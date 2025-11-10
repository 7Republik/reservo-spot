import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ParkingGroup } from "@/types/admin";

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup: ParkingGroup | null;
  onCreate: (
    name: string,
    description: string,
    capacity: number,
    floorPlanFile: File | null
  ) => Promise<boolean>;
  onUpdate: (
    groupId: string,
    name: string,
    capacity: number,
    floorPlanFile: File | null,
    currentFloorPlanUrl: string | null
  ) => Promise<boolean>;
}

export const GroupFormDialog = ({
  open,
  onOpenChange,
  editingGroup,
  onCreate,
  onUpdate,
}: GroupFormDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("0");
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name);
      setDescription(editingGroup.description || "");
      setCapacity(editingGroup.capacity.toString());
    } else {
      setName("");
      setDescription("");
      setCapacity("0");
      setFloorPlanFile(null);
    }
  }, [editingGroup, open]);

  const handleSave = async () => {
    setUploading(true);
    
    let success;
    if (editingGroup) {
      success = await onUpdate(
        editingGroup.id,
        name,
        parseInt(capacity) || 0,
        floorPlanFile,
        editingGroup.floor_plan_url
      );
    } else {
      success = await onCreate(
        name,
        description,
        parseInt(capacity) || 0,
        floorPlanFile
      );
    }
    
    setUploading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? "Editar Grupo" : "Crear Grupo de Parking"}
          </DialogTitle>
          <DialogDescription>
            {editingGroup 
              ? "Modifica los datos del grupo"
              : "Define un nuevo grupo de plazas de parking"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nombre del Grupo</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Planta -1, Zona A, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupDescription">Descripción</Label>
            <Textarea
              id="groupDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional del grupo"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupCapacity">Capacidad (plazas)</Label>
            <Input
              id="groupCapacity"
              type="number"
              min="0"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="floorPlan">Plano de Planta (Imagen)</Label>
            <Input
              id="floorPlan"
              type="file"
              accept="image/*"
              onChange={(e) => setFloorPlanFile(e.target.files?.[0] || null)}
            />
            {editingGroup?.floor_plan_url && !floorPlanFile && (
              <p className="text-xs text-muted-foreground">
                Ya hay un plano subido. Sube otro para reemplazarlo.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={uploading}>
            {uploading ? "Guardando..." : editingGroup ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
