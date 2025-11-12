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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { IncidentReportWithDetails } from "@/types/incidents";

interface IncidentActionsProps {
  incident: IncidentReportWithDetails;
  onConfirm: (notes?: string) => Promise<boolean>;
  onDismiss: (reason?: string) => Promise<boolean>;
  disabled?: boolean;
}

/**
 * IncidentActions Component
 * 
 * Provides action buttons for confirming or dismissing parking incident reports.
 * Includes confirmation dialogs with warning previews and reason inputs.
 * 
 * Features:
 * - Confirm incident button with warning preview dialog
 * - Dismiss incident button with reason input dialog
 * - Disabled state for resolved incidents
 * - Loading states during operations
 * - Warning preview showing consequences (warning issued, reservation cancelled)
 * - Mobile-responsive layout
 * 
 * @param {IncidentReportWithDetails} incident - The incident to act upon
 * @param {Function} onConfirm - Callback to confirm incident (issues warning, cancels reservation)
 * @param {Function} onDismiss - Callback to dismiss incident
 * @param {boolean} disabled - Whether actions are disabled
 */
export const IncidentActions = ({
  incident,
  onConfirm,
  onDismiss,
  disabled = false,
}: IncidentActionsProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [dismissReason, setDismissReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const isResolved = incident.status !== 'pending';

  const handleConfirm = async () => {
    setIsConfirming(true);
    const success = await onConfirm();
    setIsConfirming(false);
    
    if (success) {
      setShowConfirmDialog(false);
    }
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    const success = await onDismiss(dismissReason.trim() || undefined);
    setIsDismissing(false);
    
    if (success) {
      setShowDismissDialog(false);
      setDismissReason("");
    }
  };

  if (isResolved) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground text-center">
          Este incidente ya ha sido {incident.status === 'confirmed' ? 'confirmado' : 'desestimado'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            className="flex-1 bg-success hover:bg-success/90"
            onClick={() => setShowConfirmDialog(true)}
            disabled={disabled || isConfirming || isDismissing}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar Incidente
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowDismissDialog(true)}
            disabled={disabled || isConfirming || isDismissing}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Desestimar Incidente
          </Button>
        </div>

        {incident.offending_user && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-900 dark:text-yellow-100">
                <p className="font-semibold mb-1">Al confirmar este incidente:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Se emitirá una amonestación a <strong>{incident.offending_user.full_name}</strong></li>
                  <li>Se cancelará su reserva para esta fecha</li>
                  <li>El usuario será notificado de la acción</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar incidente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Estás a punto de confirmar este incidente reportado por{" "}
                  <strong>{incident.reporter.full_name}</strong>.
                </p>
                
                {incident.offending_user ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                      Acciones que se realizarán:
                    </p>
                    <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                      <li>✓ Se emitirá una amonestación a <strong>{incident.offending_user.full_name}</strong></li>
                      <li>✓ Se cancelará su reserva de la plaza {incident.original_spot?.spot_number}</li>
                      <li>✓ El usuario recibirá una notificación</li>
                      <li>✓ El incidente quedará marcado como confirmado</li>
                    </ul>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No se pudo identificar al usuario infractor. El incidente se marcará como confirmado
                      pero no se emitirán amonestaciones.
                    </p>
                  </div>
                )}
                
                <p className="text-sm font-medium">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isConfirming}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              className="bg-success hover:bg-success/90"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? "Confirmando..." : "Sí, Confirmar Incidente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dismiss Dialog */}
      <Dialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desestimar Incidente</DialogTitle>
            <DialogDescription>
              El incidente será marcado como desestimado. No se emitirán amonestaciones
              ni se cancelarán reservas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="dismiss-reason">
                Motivo de la desestimación (opcional)
              </Label>
              <Textarea
                id="dismiss-reason"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Ej: Falsa alarma, error del usuario, evidencia insuficiente..."
                rows={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este motivo se guardará en las notas del administrador
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDismissDialog(false);
                setDismissReason("");
              }}
              disabled={isDismissing}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleDismiss}
              disabled={isDismissing}
            >
              {isDismissing ? "Desestimando..." : "Desestimar Incidente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
