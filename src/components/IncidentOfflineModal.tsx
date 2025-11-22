import { AlertCircle, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface IncidentOfflineModalProps {
  open: boolean;
  onClose: () => void;
}

export const IncidentOfflineModal = ({ open, onClose }: IncidentOfflineModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar incidente sin conexión</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conexión requerida</AlertTitle>
            <AlertDescription>
              Para reasignarte una plaza en tiempo real, necesitamos conexión a internet.
            </AlertDescription>
          </Alert>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex gap-2 items-start">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  💡 Consejo
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Toma una foto ahora asegurándote de que se vea claramente la matrícula del vehículo intruso.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Cuando recuperes conexión, podrás reportar el incidente usando la foto de tu galería.
          </p>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
