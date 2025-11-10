import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import type { ParkingSpot } from "@/types/admin";

interface SpotAttributesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spot: ParkingSpot | null;
  onSave: (
    spotNumber: string,
    isAccessible: boolean,
    hasCharger: boolean,
    isCompact: boolean
  ) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

export const SpotAttributesDialog = ({
  open,
  onOpenChange,
  spot,
  onSave,
  onDelete,
}: SpotAttributesDialogProps) => {
  const [spotNumber, setSpotNumber] = useState("");
  const [isAccessible, setIsAccessible] = useState(false);
  const [hasCharger, setHasCharger] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (spot) {
      setSpotNumber(spot.spot_number);
      setIsAccessible(spot.is_accessible);
      setHasCharger(spot.has_charger);
      setIsCompact(spot.is_compact);
    }
  }, [spot, open]);

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(spotNumber, isAccessible, hasCharger, isCompact);
    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    const success = await onDelete();
    setSaving(false);
  };

  if (!spot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Atributos de Plaza</DialogTitle>
          <DialogDescription>
            Configura el número y características especiales de la plaza
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="spotNumber">Número de Plaza</Label>
            <Input
              id="spotNumber"
              value={spotNumber}
              onChange={(e) => setSpotNumber(e.target.value)}
              placeholder="ej: A-1, B-12, etc."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessible"
                checked={isAccessible}
                onCheckedChange={(checked) => setIsAccessible(checked as boolean)}
              />
              <Label htmlFor="accessible" className="font-normal">
                ♿ Plaza Accesible (PMR)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="charger"
                checked={hasCharger}
                onCheckedChange={(checked) => setHasCharger(checked as boolean)}
              />
              <Label htmlFor="charger" className="font-normal">
                🔌 Con Cargador Eléctrico
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="compact"
                checked={isCompact}
                onCheckedChange={(checked) => setIsCompact(checked as boolean)}
              />
              <Label htmlFor="compact" className="font-normal">
                📏 Plaza Reducida
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={saving}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
