import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ParkingGroup } from "@/types/admin";

interface DeactivateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ParkingGroup | null;
  onConfirm: (groupId: string, reason: string) => Promise<boolean>;
}

export const DeactivateGroupDialog = ({
  open,
  onOpenChange,
  group,
  onConfirm,
}: DeactivateGroupDialogProps) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!group || !reason.trim()) return;

    setSubmitting(true);
    const success = await onConfirm(group.id, reason);
    setSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            ⚠️ Dar de Baja Grupo: {group.name}
          </DialogTitle>
          <DialogDescription>
            Esta acción desactivará permanentemente el grupo y cancelará todas las reservas futuras.
            Los usuarios perderán acceso a este grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deactivationReason">Motivo de la Baja *</Label>
            <Textarea
              id="deactivationReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué se da de baja este grupo..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Este motivo quedará registrado para auditoría.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || submitting}
          >
            {submitting ? "Procesando..." : "Confirmar Baja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
