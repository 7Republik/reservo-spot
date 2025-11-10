import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserWithRole } from "@/types/admin";

interface DeactivateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  onConfirm: (userId: string) => Promise<boolean>;
}

export const DeactivateUserDialog = ({ open, onOpenChange, user, onConfirm }: DeactivateUserDialogProps) => {
  const handleConfirm = async () => {
    if (!user) return;
    const success = await onConfirm(user.id);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar de Baja Usuario</DialogTitle>
          <DialogDescription>
            El usuario será dado de baja manteniendo todo su historial.
            Sus matrículas serán liberadas para otros usuarios.
            Si lo reactivas, deberá solicitar sus matrículas de nuevo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
          >
            Dar de Baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
