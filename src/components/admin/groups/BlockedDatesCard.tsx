import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BlockDateDialog } from "./BlockDateDialog";
import type { BlockedDate, ParkingGroup } from "@/types/admin";

interface BlockedDatesCardProps {
  blockedDates: BlockedDate[];
  parkingGroups: ParkingGroup[];
  onUnblockDate: (dateId: string) => void;
  onBlockDate: (date: Date, reason: string, groupId: string | null) => Promise<boolean>;
}

export const BlockedDatesCard = ({
  blockedDates,
  parkingGroups,
  onUnblockDate,
  onBlockDate,
}: BlockedDatesCardProps) => {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Días Bloqueados
              </CardTitle>
              <CardDescription>
                Días donde no se permiten reservas (global o por grupo)
              </CardDescription>
            </div>
            <Button onClick={() => setBlockDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Bloquear Día
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay días bloqueados
            </p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map(date => {
                const groupName = date.group_id ? (date as any).parking_groups?.name : null;
                return (
                  <div 
                    key={date.id}
                    className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {format(new Date(date.blocked_date), 'dd/MM/yyyy', { locale: es })}
                        </p>
                        {groupName ? (
                          <Badge variant="outline" className="text-xs">
                            📍 {groupName}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            🌍 Global
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{date.reason}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onUnblockDate(date.id)}
                    >
                      Desbloquear
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BlockDateDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        parkingGroups={parkingGroups}
        onConfirm={onBlockDate}
      />
    </>
  );
};
