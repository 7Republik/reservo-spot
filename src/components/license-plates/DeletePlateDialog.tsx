import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LicensePlate } from "@/hooks/useLicensePlateManager";

interface DeletePlateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plateToDelete: LicensePlate | null;
  onConfirmDelete: (plate: LicensePlate) => void;
}

export const DeletePlateDialog = ({ 
  isOpen, 
  onClose, 
  plateToDelete, 
  onConfirmDelete 
}: DeletePlateDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            ⚠️ ¿Eliminar matrícula aprobada?
          </DialogTitle>
          <DialogDescription>
            Esta acción eliminará la matrícula <span className="font-bold">{plateToDelete?.plate_number}</span> de tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="font-medium">Al eliminar esta matrícula:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm">
            <li>La matrícula quedará disponible para otros usuarios</li>
            <li>No podrás hacer nuevas reservas hasta que tengas otra matrícula aprobada</li>
            <li>Tu historial de reservas anteriores se mantendrá</li>
            <li>La matrícula aparecerá en tu historial de eliminadas</li>
          </ul>
          <p className="text-muted-foreground text-xs">
            Podrás volver a solicitar esta u otra matrícula en cualquier momento.
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              if (plateToDelete) {
                onConfirmDelete(plateToDelete);
              }
            }}
            className="w-full sm:w-auto"
          >
            Eliminar Matrícula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
