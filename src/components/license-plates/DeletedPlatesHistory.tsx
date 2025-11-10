import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LicensePlate } from "@/hooks/useLicensePlateManager";

interface DeletedPlatesHistoryProps {
  deletedPlates: LicensePlate[];
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
}

export const DeletedPlatesHistory = ({ 
  deletedPlates, 
  isHistoryOpen, 
  setIsHistoryOpen 
}: DeletedPlatesHistoryProps) => {
  if (deletedPlates.length === 0) return null;

  return (
    <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="mt-4">
      <Card className="p-3">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Historial de matrículas eliminadas
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-muted">
                {deletedPlates.length}
              </Badge>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200 text-muted-foreground",
                isHistoryOpen && "transform rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3">
          <div className="space-y-2">
            {deletedPlates.map((plate) => (
              <div 
                key={plate.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-muted/30 rounded border border-muted text-xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-sm">
                    {plate.plate_number}
                  </span>
                  {plate.is_approved && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      Era aprobada
                    </Badge>
                  )}
                  {plate.approved_electric && (
                    <span className="text-[10px]">⚡</span>
                  )}
                  {plate.approved_disability && (
                    <span className="text-[10px]">♿</span>
                  )}
                </div>
                
                <span className="text-muted-foreground whitespace-nowrap">
                  Eliminada: {new Date(plate.deleted_at!).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Estas matrículas ya no están activas y están disponibles para otros usuarios
          </p>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
