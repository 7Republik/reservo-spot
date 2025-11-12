import { MapPin, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationVerificationProps {
  spotNumber: string;
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LocationVerification = ({
  spotNumber,
  groupName,
  onConfirm,
  onCancel,
}: LocationVerificationProps) => {
  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Card className="bg-card border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-xl">
              Verificar Ubicación
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription className="text-muted-foreground">
            Confirma que estás en tu plaza reservada
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Reserved Spot Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Tu plaza reservada
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  Plaza {spotNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {groupName}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <div className="space-y-4">
            <p className="text-center text-foreground font-medium">
              ¿Estás en la plaza correcta?
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onConfirm}
                className="w-full h-12 text-base"
                size="lg"
              >
                Sí, estoy en la plaza correcta
              </Button>

              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full h-12 text-base"
                size="lg"
              >
                <Navigation className="h-4 w-4 mr-2" />
                No, mostrar indicaciones
              </Button>
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-center text-muted-foreground">
            Si tu plaza está ocupada, confirma tu ubicación para reportar el incidente
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
