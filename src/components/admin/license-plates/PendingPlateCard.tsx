import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { LicensePlate } from "@/types/admin";

interface PendingPlateCardProps {
  plate: LicensePlate;
  onApprove: (plate: LicensePlate) => void;
  onReject: (plateId: string) => void;
}

export const PendingPlateCard = ({ plate, onApprove, onReject }: PendingPlateCardProps) => {
  return (
    <Card key={plate.id} className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-lg">
              {plate.plate_number}
            </div>
            <div>
              <p className="font-medium">{plate.profiles.full_name || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{plate.profiles.email}</p>
            </div>
          </div>
        </div>

        {(plate.requested_electric || plate.requested_disability) && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium mb-2">Permisos solicitados:</p>
            <div className="space-y-2">
              {plate.requested_electric && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    ⚡ Vehículo eléctrico
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    (Solicita acceso a plazas con cargador)
                  </span>
                </div>
              )}
              {plate.requested_disability && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    ♿ Movilidad reducida
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    (Solicita acceso a plazas PMR)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="default"
            onClick={() => onApprove(plate)}
            className="bg-success hover:bg-success/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Aprobar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(plate.id)}
          >
            <X className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
        </div>
      </div>
    </Card>
  );
};
