import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { LicensePlate } from "@/types/admin";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plate: LicensePlate | null;
  onConfirm: (plateId: string, approveElectric: boolean, approveDisability: boolean) => Promise<void>;
}

export const ApprovalDialog = ({ 
  open, 
  onOpenChange, 
  plate, 
  onConfirm 
}: ApprovalDialogProps) => {
  const [approveElectric, setApproveElectric] = useState(false);
  const [approveDisability, setApproveDisability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!plate) return;
    
    try {
      setIsSubmitting(true);
      await onConfirm(plate.id, approveElectric, approveDisability);
      onOpenChange(false);
      // Reset state
      setApproveElectric(false);
      setApproveDisability(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update checkboxes when plate changes
  if (open && plate) {
    if (approveElectric !== plate.requested_electric || approveDisability !== plate.requested_disability) {
      setApproveElectric(plate.requested_electric);
      setApproveDisability(plate.requested_disability);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprobar Matrícula</DialogTitle>
          <DialogDescription>
            Selecciona qué permisos especiales deseas conceder para la matrícula{" "}
            <strong>{plate?.plate_number}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {plate?.requested_electric && (
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
          
          {plate?.requested_disability && (
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
          
          {!plate?.requested_electric && !plate?.requested_disability && (
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
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="bg-success hover:bg-success/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Aprobando..." : "Aprobar Matrícula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
