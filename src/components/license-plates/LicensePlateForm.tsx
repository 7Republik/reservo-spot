import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LicensePlateFormProps {
  activePlatesCount: number;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  newPlate: string;
  setNewPlate: (plate: string) => void;
  requestedElectric: boolean;
  setRequestedElectric: (requested: boolean) => void;
  requestedDisability: boolean;
  setRequestedDisability: (requested: boolean) => void;
  onAddPlate: () => void;
}

export const LicensePlateForm = ({
  activePlatesCount,
  isFormOpen,
  setIsFormOpen,
  newPlate,
  setNewPlate,
  requestedElectric,
  setRequestedElectric,
  requestedDisability,
  setRequestedDisability,
  onAddPlate,
}: LicensePlateFormProps) => {
  return (
    <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
      <Card className="p-4">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Añadir Matrícula</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {activePlatesCount} activas
              </Badge>
              <ChevronDown className={cn(
                "h-5 w-5 transition-transform duration-200",
                isFormOpen && "transform rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="plate" className="text-sm">Nueva Matrícula</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Input
                  id="plate"
                  placeholder="1234ABC"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="flex-1"
                />
                <Button 
                  onClick={onAddPlate} 
                  disabled={!newPlate.trim()}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                La matrícula debe ser aprobada por un administrador antes de poder usarse
              </p>
            </div>

            <div className="space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Permisos especiales (opcional)</p>
              <p className="text-xs text-muted-foreground">
                Marca las opciones que apliquen a este vehículo. El administrador revisará tu solicitud.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start sm:items-center space-x-2">
                  <Checkbox 
                    id="electric" 
                    checked={requestedElectric}
                    onCheckedChange={(checked) => setRequestedElectric(checked as boolean)}
                    className="mt-1 sm:mt-0"
                  />
                  <Label 
                    htmlFor="electric" 
                    className="text-sm font-normal cursor-pointer flex flex-col sm:flex-row sm:items-center gap-1"
                  >
                    <span>⚡ Mi vehículo es eléctrico</span>
                    <span className="text-xs text-muted-foreground">(para acceso a plazas con cargador)</span>
                  </Label>
                </div>
                
                <div className="flex items-start sm:items-center space-x-2">
                  <Checkbox 
                    id="disability" 
                    checked={requestedDisability}
                    onCheckedChange={(checked) => setRequestedDisability(checked as boolean)}
                    className="mt-1 sm:mt-0"
                  />
                  <Label 
                    htmlFor="disability" 
                    className="text-sm font-normal cursor-pointer flex flex-col sm:flex-row sm:items-center gap-1"
                  >
                    <span>♿ Tengo permiso de movilidad reducida</span>
                    <span className="text-xs text-muted-foreground">(para acceso a plazas PMR)</span>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
