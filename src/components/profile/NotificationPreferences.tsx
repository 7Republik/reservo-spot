import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Mail, Bell } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export const NotificationPreferences = () => {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de Notificaciones</CardTitle>
          <CardDescription>Cargando preferencias...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  const handleToggle = (field: string, value: boolean) => {
    updatePreferences({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferencias de Notificaciones
        </CardTitle>
        <CardDescription>
          Configura cómo quieres recibir notificaciones del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aviso sobre notificaciones in-app */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Las notificaciones dentro de la aplicación siempre están activas y no se pueden desactivar.
            Aquí solo puedes configurar las notificaciones por email.
          </AlertDescription>
        </Alert>

        {/* Master switch */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="email_enabled" className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notificaciones por Email
              </Label>
              <p className="text-sm text-muted-foreground">
                Activar o desactivar todos los emails
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
            />
          </div>
        </div>

        {/* Notificaciones críticas */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Notificaciones Críticas</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Recomendamos mantener estas notificaciones activas
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="email_waitlist_offers" className="text-sm font-medium">
                  Ofertas de Lista de Espera
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cuando hay una plaza disponible para ti (expira en minutos)
                </p>
              </div>
              <Switch
                id="email_waitlist_offers"
                checked={preferences.email_waitlist_offers}
                disabled={!preferences.email_enabled}
                onCheckedChange={(checked) => handleToggle('email_waitlist_offers', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="email_blocks" className="text-sm font-medium">
                  Bloqueos Temporales
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cuando tu cuenta es bloqueada temporalmente
                </p>
              </div>
              <Switch
                id="email_blocks"
                checked={preferences.email_blocks}
                disabled={!preferences.email_enabled}
                onCheckedChange={(checked) => handleToggle('email_blocks', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="email_warnings" className="text-sm font-medium">
                  Amonestaciones
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cuando recibes una amonestación
                </p>
              </div>
              <Switch
                id="email_warnings"
                checked={preferences.email_warnings}
                disabled={!preferences.email_enabled}
                onCheckedChange={(checked) => handleToggle('email_warnings', checked)}
              />
            </div>
          </div>
        </div>

        {/* Notificaciones importantes */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Notificaciones Importantes</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="email_reservation_cancelled" className="text-sm font-medium">
                  Reservas Canceladas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cuando un administrador cancela tu reserva
                </p>
              </div>
              <Switch
                id="email_reservation_cancelled"
                checked={preferences.email_reservation_cancelled}
                disabled={!preferences.email_enabled}
                onCheckedChange={(checked) => handleToggle('email_reservation_cancelled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="email_incident_reassignment" className="text-sm font-medium">
                  Reasignación de Plaza
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cuando se te asigna una nueva plaza por un incidente
                </p>
              </div>
              <Switch
                id="email_incident_reassignment"
                checked={preferences.email_incident_reassignment}
                disabled={!preferences.email_enabled}
                onCheckedChange={(checked) => handleToggle('email_incident_reassignment', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="email_license_plate_rejected" className="text-sm font-medium">
                  Matrículas Rechazadas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cuando tu solicitud de matrícula es rechazada
                </p>
              </div>
              <Switch
                id="email_license_plate_rejected"
                checked={preferences.email_license_plate_rejected}
                disabled={!preferences.email_enabled}
                onCheckedChange={(checked) => handleToggle('email_license_plate_rejected', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
