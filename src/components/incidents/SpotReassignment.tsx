import { CheckCircle2, MapPin, Navigation, AlertCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SpotReassignmentProps {
  success: boolean;
  reassignedSpotNumber: string | null;
  groupName: string | null;
  positionX: number | null;
  positionY: number | null;
  incidentId?: string;
  onComplete: () => void;
}

export const SpotReassignment = ({
  success,
  reassignedSpotNumber,
  groupName,
  positionX,
  positionY,
  incidentId,
  onComplete,
}: SpotReassignmentProps) => {
  // Success scenario - spot was reassigned
  if (success && reassignedSpotNumber && groupName) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Card className="bg-card border-border">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-foreground text-xl">
                  Nueva Plaza Asignada
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Tu incidente ha sido reportado
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* New Spot Details */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tu nueva plaza
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    Plaza {reassignedSpotNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {groupName}
                  </p>
                </div>
              </div>

              {/* Mini Map - Show if position data available */}
              {positionX !== null && positionY !== null && (
                <div className="mt-4 bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Navigation className="h-4 w-4" />
                    <span>Ubicación en el mapa</span>
                  </div>
                  <div className="relative h-32 bg-background rounded border border-border overflow-hidden">
                    {/* Simple visual representation */}
                    <div
                      className="absolute h-3 w-3 bg-primary rounded-full animate-pulse"
                      style={{
                        left: `${Math.min(Math.max(positionX, 5), 95)}%`,
                        top: `${Math.min(Math.max(positionY, 5), 95)}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        Plaza marcada en el plano
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Incident Reference */}
            {incidentId && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Referencia del incidente
                </p>
                <p className="text-sm font-mono text-foreground mt-1">
                  {incidentId.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Info Message */}
            <Alert className="bg-muted/50 border-border">
              <AlertDescription className="text-sm text-muted-foreground">
                El equipo administrativo revisará tu reporte y tomará las medidas necesarias.
                Recibirás una notificación con la resolución.
              </AlertDescription>
            </Alert>

            {/* Action Button */}
            <Button
              onClick={onComplete}
              className="w-full h-12 text-base"
              size="lg"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Ir a mi nueva plaza
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No spots available scenario
  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Card className="bg-card border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-foreground text-xl">
                No Hay Plazas Disponibles
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Tu incidente ha sido reportado
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Incident Reference */}
          {incidentId && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Referencia del incidente
              </p>
              <p className="text-sm font-mono text-foreground mt-1">
                {incidentId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          {/* Main Message */}
          <Alert className="bg-destructive/5 border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm text-foreground">
              Lo sentimos, no hay plazas disponibles en este momento para asignarte
              una alternativa. Tu incidente ha sido registrado con prioridad alta.
            </AlertDescription>
          </Alert>

          {/* Next Steps */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              ¿Qué hacer ahora?
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  El equipo administrativo ha sido notificado y te contactará lo antes posible
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Puedes esperar en la zona de aparcamiento o contactar directamente con administración
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Contacto de Administración
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a
                  href="tel:+34900000000"
                  className="text-primary hover:underline"
                >
                  +34 900 000 000
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a
                  href="mailto:parking@empresa.com"
                  className="text-primary hover:underline"
                >
                  parking@empresa.com
                </a>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onComplete}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
