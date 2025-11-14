import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check, Clock, Trash2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LicensePlate } from "@/hooks/useLicensePlateManager";
import { DisabledControlTooltip } from "@/components/DisabledControlTooltip";

interface LicensePlateCardProps {
  plate: LicensePlate;
  onDelete: (plate: LicensePlate) => void;
  isOnline: boolean;
}

export const LicensePlateCard = ({ plate, onDelete, isOnline }: LicensePlateCardProps) => {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Matrícula europea */}
          <div className="flex items-center border-2 border-black rounded overflow-hidden shadow-md flex-shrink-0">
            <div className="bg-[#003399] flex flex-col items-center justify-center px-1 py-1 sm:px-1.5 sm:py-1.5 md:px-2 md:py-2 text-white">
              <div className="text-xs sm:text-sm leading-none mb-0.5" style={{ color: '#FFD700' }}>★</div>
              <div className="text-[0.6rem] sm:text-xs font-bold leading-none">E</div>
            </div>
            <div className="bg-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2">
              <div className="font-mono font-bold text-lg sm:text-xl md:text-2xl text-black tracking-wider whitespace-nowrap">
                {plate.plate_number}
              </div>
            </div>
          </div>
          
          {/* Estado y badges */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {/* Badge principal */}
              {plate.rejected_at ? (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <X className="h-3 w-3" />
                  Rechazada
                </Badge>
              ) : plate.is_approved ? (
                <Badge variant="default" className="bg-success text-success-foreground gap-1 text-xs">
                  <Check className="h-3 w-3" />
                  Aprobada
                </Badge>
              ) : (
                <Badge variant="outline" className="border-warning text-warning gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  Pendiente
                </Badge>
              )}
              
              {/* Badges de permisos especiales */}
              {plate.approved_electric && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "gap-1 text-xs",
                    plate.electric_expires_at && new Date(plate.electric_expires_at) < new Date()
                      ? 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800'
                      : 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800'
                  )}
                >
                  ⚡
                  {plate.electric_expires_at && new Date(plate.electric_expires_at) < new Date() && ' EXPIRADO'}
                </Badge>
              )}
              
              {plate.approved_disability && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "gap-1 text-xs",
                    plate.disability_expires_at && new Date(plate.disability_expires_at) < new Date()
                      ? 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800'
                      : 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800'
                  )}
                >
                  ♿
                  {plate.disability_expires_at && new Date(plate.disability_expires_at) < new Date() && ' EXPIRADO'}
                </Badge>
              )}
            </div>
            
            {/* Fechas de expiración */}
            {plate.approved_electric && plate.electric_expires_at && (
              <span className="text-xs text-muted-foreground">
                ⚡ {new Date(plate.electric_expires_at) > new Date() 
                  ? `Válido hasta: ${new Date(plate.electric_expires_at).toLocaleDateString()}`
                  : '⚠️ Expirado'}
              </span>
            )}
            
            {plate.approved_disability && plate.disability_expires_at && (
              <span className="text-xs text-muted-foreground">
                ♿ {new Date(plate.disability_expires_at) > new Date() 
                  ? `Válido hasta: ${new Date(plate.disability_expires_at).toLocaleDateString()}`
                  : '⚠️ Expirado'}
              </span>
            )}
            
            {/* Fecha de aprobación/rechazo */}
            {plate.approved_at && (
              <p className="text-xs text-muted-foreground">
                Aprobada el {new Date(plate.approved_at).toLocaleDateString()}
              </p>
            )}
            {plate.rejected_at && (
              <p className="text-xs text-muted-foreground">
                Rechazada el {new Date(plate.rejected_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        {/* Botón eliminar */}
        <DisabledControlTooltip
          isDisabled={!isOnline}
          message="Requiere conexión a internet"
        >
          <Button
            size="sm"
            variant={plate.is_approved ? "destructive" : "outline"}
            onClick={() => onDelete(plate)}
            disabled={!isOnline}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Eliminar</span>
          </Button>
        </DisabledControlTooltip>
      </div>
      
      {/* Mensaje de rechazo */}
      {plate.rejected_at && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive mb-1">
              Matrícula rechazada
            </p>
            {plate.rejection_reason && (
              <p className="text-sm text-destructive/90 mb-2">
                <span className="font-medium">Motivo:</span> {plate.rejection_reason}
              </p>
            )}
            <p className="text-xs sm:text-sm text-destructive/80">
              Puedes eliminarla y volver a solicitarla después de verificar los datos con la empresa.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
