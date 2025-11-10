import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ParkingGroup } from "@/types/admin";

interface BlockDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingGroups: ParkingGroup[];
  onConfirm: (date: Date, reason: string, groupId: string | null) => Promise<boolean>;
}

export const BlockDateDialog = ({
  open,
  onOpenChange,
  parkingGroups,
  onConfirm,
}: BlockDateDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("Fuerza Mayor");
  const [scope, setScope] = useState<"global" | "group">("global");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedDate(undefined);
      setReason("Fuerza Mayor");
      setScope("global");
      setSelectedGroupId(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedDate) return;

    const groupId = scope === "group" ? selectedGroupId : null;

    setSubmitting(true);
    const success = await onConfirm(selectedDate, reason, groupId);
    setSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear Día para Reservas</DialogTitle>
          <DialogDescription>
            Selecciona una fecha y motivo para bloquear reservas. Las reservas existentes en ese día se cancelarán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Fecha a Bloquear</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              locale={es}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label>Ámbito del Bloqueo</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as "global" | "group")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="global" id="scope-global" />
                <Label htmlFor="scope-global" className="font-normal">
                  🌍 Global (todos los grupos)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="scope-group" />
                <Label htmlFor="scope-group" className="font-normal">
                  📍 Grupo específico
                </Label>
              </div>
            </RadioGroup>
          </div>

          {scope === "group" && (
            <div className="space-y-2">
              <Label>Seleccionar Grupo</Label>
              <Select value={selectedGroupId || ""} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {parkingGroups.filter(g => g.is_active).map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="blockReason">Motivo del Bloqueo</Label>
            <Input
              id="blockReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ej: Fuerza Mayor, Festivo, etc."
            />
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedDate || !reason.trim() || (scope === "group" && !selectedGroupId) || submitting}
          >
            {submitting ? "Bloqueando..." : "Bloquear Día"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
