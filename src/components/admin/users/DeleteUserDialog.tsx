import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserWithRole } from "@/types/admin";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  onConfirm: (userId: string, password: string) => Promise<boolean>;
}

export const DeleteUserDialog = ({ open, onOpenChange, user, onConfirm }: DeleteUserDialogProps) => {
  const [deletePassword, setDeletePassword] = useState("");

  const handleConfirm = async () => {
    if (!user) return;
    const success = await onConfirm(user.id, deletePassword);
    if (success) {
      setDeletePassword("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            ⚠️ BORRADO PERMANENTE ⚠️
          </DialogTitle>
          <DialogDescription className="text-destructive font-semibold">
            ESTA ACCIÓN ES IRREVERSIBLE
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">
            Se eliminará permanentemente:
          </p>
          <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
            <li>Cuenta de usuario</li>
            <li>Todas las matrículas</li>
            <li>Historial de reservas</li>
            <li>Reportes de incidentes</li>
            <li>Asignaciones de grupos</li>
            <li>Roles y permisos</li>
          </ul>
          <div className="bg-destructive/10 p-4 rounded-md border border-destructive">
            <p className="text-sm font-semibold text-destructive mb-2">
              Ingresa la contraseña de confirmación:
            </p>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Contraseña de confirmación"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Contraseña: 12345678
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setDeletePassword("");
            }}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={deletePassword !== "12345678"}
          >
            BORRAR PERMANENTEMENTE
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
