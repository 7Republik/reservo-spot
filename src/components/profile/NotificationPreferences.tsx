import { useState } from "react";
import { Loader2, Bell, BellOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/profile";

interface NotificationPreferencesProps {
  profile: UserProfile;
  onUpdate: (checkinRemindersEnabled: boolean) => Promise<void>;
  isLoading: boolean;
}

/**
 * NotificationPreferences Component
 * 
 * Permite al usuario configurar sus preferencias de notificaciones
 * de check-in.
 * 
 * Features:
 * - Toggle para activar/desactivar recordatorios de check-in
 * - Feedback visual del estado actual
 * - Loading state durante actualización
 * - Accesible con ARIA labels
 * 
 * Requirements: 15.4, 15.5
 */
export const NotificationPreferences = ({ 
  profile, 
  onUpdate, 
  isLoading 
}: NotificationPreferencesProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await onUpdate(checked);
    } finally {
      setIsUpdating(false);
    }
  };

  const isDisabled = isLoading || isUpdating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
          {profile.checkin_reminders_enabled ? (
            <Bell className="h-5 w-5" aria-hidden="true" />
          ) : (
            <BellOff className="h-5 w-5" aria-hidden="true" />
          )}
          Preferencias de Notificaciones
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Configura cómo quieres recibir recordatorios sobre tus reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Checkin Reminders Toggle */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
          <div className="flex-1 space-y-1">
            <Label 
              htmlFor="checkin-reminders" 
              className="text-sm sm:text-base font-medium cursor-pointer"
            >
              Recordatorios de Check-in
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Recibe recordatorios cuando tengas una reserva activa sin check-in.
              Te ayudará a evitar infracciones por olvido.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isUpdating && (
              <Loader2 
                className="h-4 w-4 animate-spin text-muted-foreground" 
                aria-hidden="true" 
              />
            )}
            <Switch
              id="checkin-reminders"
              checked={profile.checkin_reminders_enabled}
              onCheckedChange={handleToggle}
              disabled={isDisabled}
              aria-label="Activar o desactivar recordatorios de check-in"
              aria-describedby="checkin-reminders-description"
            />
          </div>
        </div>

        {/* Status Message */}
        <div 
          id="checkin-reminders-description"
          className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 rounded-md"
          role="status"
          aria-live="polite"
        >
          {profile.checkin_reminders_enabled ? (
            <>
              <span className="font-medium text-foreground">✓ Recordatorios activados:</span>
              {" "}Recibirás notificaciones cuando tengas una reserva activa sin check-in.
              Los recordatorios se envían cada 30 minutos durante el horario de oficina.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">✗ Recordatorios desactivados:</span>
              {" "}No recibirás notificaciones de recordatorio. Recuerda hacer check-in
              manualmente para evitar infracciones.
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
          <p className="font-medium">Información adicional:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Los recordatorios solo se envían durante el horario de oficina (6:00 - 22:00)</li>
            <li>No recibirás más de un recordatorio cada 2 horas por reserva</li>
            <li>Puedes cambiar esta preferencia en cualquier momento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
