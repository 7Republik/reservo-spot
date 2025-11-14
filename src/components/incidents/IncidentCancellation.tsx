import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IncidentCancellationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasUploadedPhoto: boolean;
  onConfirmDiscard: () => void;
  isViewLocationAction?: boolean;
}

/**
 * Confirmation dialog for canceling an incident report
 * Shows a warning if a photo has been uploaded
 * Handles cleanup of uploaded photos on discard
 */
export const IncidentCancellation = ({
  open,
  onOpenChange,
  hasUploadedPhoto,
  onConfirmDiscard,
  isViewLocationAction = false,
}: IncidentCancellationProps) => {
  /**
   * Handles the discard confirmation
   * Calls the parent's discard logic which will clean up uploaded photos
   */
  const handleConfirmDiscard = () => {
    onConfirmDiscard();
    onOpenChange(false);
  };

  /**
   * Handles the cancel action (continue with incident report)
   */
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isViewLocationAction ? 'Ver Ubicación de Plaza' : 'Cancelar Reporte de Incidente'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isViewLocationAction 
              ? '¿Quieres abandonar el reporte y ver la ubicación de tu plaza?'
              : '¿Estás seguro de que quieres cancelar este reporte?'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning if photo has been uploaded */}
          {hasUploadedPhoto && (
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm text-foreground">
                Has capturado una foto. Si cancelas, se perderá toda la información
                recopilada y tendrás que empezar de nuevo.
              </AlertDescription>
            </Alert>
          )}

          {/* Information about what will be lost */}
          <div className="space-y-2">
            <p className="text-sm text-foreground font-medium">
              Se perderá la siguiente información:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {hasUploadedPhoto && <li>Foto capturada del incidente</li>}
              <li>Matrícula introducida</li>
              <li>Progreso del reporte</li>
            </ul>
          </div>

          {/* Confirmation message */}
          <p className="text-sm text-muted-foreground">
            {isViewLocationAction
              ? 'Si continúas, se cancelará el reporte de incidente y se te mostrará la ubicación de tu plaza reservada en el mapa.'
              : 'Si cancelas ahora, no se creará ningún reporte de incidente y no se te asignará una plaza alternativa.'
            }
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            {isViewLocationAction ? 'Volver al reporte' : 'Continuar con el reporte'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDiscard}
            className="w-full sm:w-auto"
          >
            {isViewLocationAction ? 'Sí, ver ubicación' : 'Sí, cancelar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
