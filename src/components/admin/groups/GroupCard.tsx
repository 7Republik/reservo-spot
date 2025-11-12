import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ParkingGroup } from "@/types/admin";

interface GroupCardProps {
  group: ParkingGroup;
  onEdit: (group: ParkingGroup) => void;
  onToggleActive: (groupId: string, isActive: boolean) => void;
  onDeactivate: (group: ParkingGroup) => void;
  onSchedule: (group: ParkingGroup) => void;
  onCancelSchedule: (groupId: string) => void;
}

export const GroupCard = ({
  group,
  onEdit,
  onToggleActive,
  onDeactivate,
  onSchedule,
  onCancelSchedule,
}: GroupCardProps) => {
  return (
    <Card className={cn(
      "relative overflow-hidden",
      !group.is_active && "opacity-50"
    )}>
      {group.scheduled_deactivation_date && (
        <Badge 
          variant="outline" 
          className="absolute top-2 right-2 z-10 bg-yellow-50 text-yellow-700 border-yellow-300"
        >
          🕒 {format(new Date(group.scheduled_deactivation_date), 'dd/MM/yyyy')}
        </Badge>
      )}
      
      {group.floor_plan_url && (
        <div className="h-32 bg-muted overflow-hidden">
          <img
            src={group.floor_plan_url}
            alt={`Plano de ${group.name}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{group.name}</CardTitle>
              {group.is_incident_reserve && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reserva para Incidencias</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {group.description || "Sin descripción"}
            </CardDescription>
          </div>
          <Badge variant={group.is_active ? "default" : "secondary"}>
            {group.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Capacidad:</span>
          <span className="font-semibold">{group.capacity} plazas</span>
        </div>

        {group.is_incident_reserve && (
          <div className="flex items-center gap-2 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded p-2">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>Grupo reservado para reasignación de incidencias</span>
          </div>
        )}

        {group.deactivated_at ? (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            <p className="font-medium">Grupo dado de baja</p>
            <p className="mt-1">{group.deactivation_reason}</p>
            <p className="mt-1 text-muted-foreground">
              {format(new Date(group.deactivated_at), 'dd/MM/yyyy')}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(group)}
            >
              Editar
            </Button>
            
            {group.is_active && (
              <>
                {group.scheduled_deactivation_date ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCancelSchedule(group.id)}
                  >
                    ❌ Cancelar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSchedule(group)}
                  >
                    🕒 Programar
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant={group.is_active ? "secondary" : "default"}
                  onClick={() => onToggleActive(group.id, group.is_active)}
                >
                  {group.is_active ? "Pausar" : "Reanudar"}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => onDeactivate(group)}
                >
                  🗑️ Dar de Baja
                </Button>
              </>
            )}
            
            {!group.is_active && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onToggleActive(group.id, group.is_active)}
              >
                Reactivar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
