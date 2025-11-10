import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ParkingGroup } from "@/types/admin";

interface ScheduleDeactivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ParkingGroup | null;
  onConfirm: (groupId: string, scheduledDate: Date) => Promise<boolean>;
}

export const ScheduleDeactivationDialog = ({
  open,
  onOpenChange,
  group,
  onConfirm,
}: ScheduleDeactivationDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedDate(undefined);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!group || !selectedDate) return;

    setSubmitting(true);
    const success = await onConfirm(group.id, selectedDate);
    setSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Programar Desactivación: {group.name}
          </DialogTitle>
          <DialogDescription>
            Las reservas dejarán de estar disponibles a partir de la fecha seleccionada.
            Los usuarios no podrán reservar en este grupo desde ese día en adelante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Fecha de Desactivación</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              locale={es}
              className="rounded-md border"
            />
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                Desactivación programada para: {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || submitting}
          >
            {submitting ? "Programando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
