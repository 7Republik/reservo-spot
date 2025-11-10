import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import type { ReservationSettings } from "@/types/admin";

interface ReservationSettingsCardProps {
  settings: ReservationSettings;
  onUpdateSettings: (updates: Partial<ReservationSettings>) => void;
  onSave: (settings: ReservationSettings) => Promise<boolean>;
}

export const ReservationSettingsCard = ({
  settings,
  onUpdateSettings,
  onSave,
}: ReservationSettingsCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Reservas
        </CardTitle>
        <CardDescription>
          Configura las reglas globales del sistema de reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Días de antelación permitidos</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="90"
                value={settings.advance_reservation_days}
                onChange={(e) => onUpdateSettings({
                  advance_reservation_days: parseInt(e.target.value) || 7
                })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">días naturales</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Los usuarios podrán reservar hasta {settings.advance_reservation_days} días por adelantado
            </p>
          </div>

          <div className="space-y-2">
            <Label>Hora de actualización diaria</Label>
            <div className="flex items-center gap-2">
              <Select
                value={settings.daily_refresh_hour.toString()}
                onValueChange={(value) => onUpdateSettings({
                  daily_refresh_hour: parseInt(value)
                })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
            <p className="text-xs text-muted-foreground">
              La ventana de reserva se actualiza a las {settings.daily_refresh_hour}:00
            </p>
          </div>
        </div>

        <Button onClick={() => onSave(settings)}>
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
};
