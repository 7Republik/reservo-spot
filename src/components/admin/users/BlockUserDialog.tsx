import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserWithRole } from "@/types/admin";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  onConfirm: (userId: string, reason: string) => Promise<boolean>;
}

export const BlockUserDialog = ({ open, onOpenChange, user, onConfirm }: BlockUserDialogProps) => {
  const [blockReason, setBlockReason] = useState("");

  const handleConfirm = async () => {
    if (!user) return;
    const success = await onConfirm(user.id, blockReason);
    if (success) {
      setBlockReason("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear Usuario</DialogTitle>
          <DialogDescription>
            El usuario no podrá acceder al sistema hasta que lo desbloquees.
            Se le mostrará el motivo del bloqueo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Motivo del bloqueo (visible para el usuario)</Label>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ej: Incumplimiento de normas, comportamiento inadecuado..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={!blockReason.trim()}
          >
            Bloquear Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
