import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, AlertTriangle, FileText, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserWarningWithDetails } from '@/types/profile';

interface WarningCardProps {
  warning: UserWarningWithDetails;
  onClick?: () => void;
}

export const WarningCard = ({ warning, onClick }: WarningCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUnviewed = !warning.viewed_at;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: es });
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        isUnviewed
          ? 'border-destructive border-2 bg-destructive/5'
          : 'border-border'
      }`}
      role="article"
      aria-label={`Amonestación del ${formatDate(warning.issued_at)}`}
    >
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle
              className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                isUnviewed ? 'text-destructive' : 'text-muted-foreground'
              }`}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isUnviewed ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {formatDate(warning.issued_at)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {formatTime(warning.issued_at)}
                </span>
              </div>
            </div>
          </div>
          {isUnviewed && (
            <Badge variant="destructive" className="flex-shrink-0 text-xs" aria-label="Amonestación nueva">
              Nueva
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {/* Reason */}
        <div>
          <h3
            className={`text-sm sm:text-base font-semibold mb-1 ${
              isUnviewed ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {warning.reason}
          </h3>
          {warning.notes && (
            <p className="text-xs sm:text-sm text-muted-foreground">{warning.notes}</p>
          )}
        </div>

        {/* Issuer */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>Emitida por:</span>
          <span className="font-medium">{warning.issuer_name}</span>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsExpanded(!isExpanded);
            onClick?.();
          }}
          className="w-full justify-between min-h-[44px] text-xs sm:text-sm"
          aria-expanded={isExpanded}
          aria-controls={`incident-details-${warning.id}`}
          aria-label={isExpanded ? "Ocultar detalles del incidente" : "Ver detalles del incidente"}
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Detalles del incidente</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          )}
        </Button>

        {/* Incident Details (Expandable) */}
        {isExpanded && (
          <div
            id={`incident-details-${warning.id}`}
            className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200"
            role="region"
            aria-label="Detalles del incidente"
          >
            <Separator />

            {/* Incident Date */}
            <div className="flex items-start gap-2 text-xs sm:text-sm">
              <Calendar
                className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">Fecha del incidente: </span>
                <span className="font-medium break-words">
                  {formatDate(warning.incident_details.created_at)}
                </span>
              </div>
            </div>

            {/* Parking Spot */}
            <div className="flex items-start gap-2 text-xs sm:text-sm">
              <MapPin
                className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">Plaza afectada: </span>
                <span className="font-medium">
                  {warning.incident_details.spot_number || 'N/A'}
                </span>
              </div>
            </div>

            {/* Description */}
            {warning.incident_details.description && (
              <div className="text-xs sm:text-sm">
                <span className="text-muted-foreground block mb-1">
                  Descripción:
                </span>
                <p className="text-foreground bg-muted p-2 sm:p-3 rounded-md break-words">
                  {warning.incident_details.description}
                </p>
              </div>
            )}

            {/* Photo */}
            {warning.incident_details.photo_url && (
              <div className="text-xs sm:text-sm">
                <span className="text-muted-foreground block mb-2">
                  Evidencia fotográfica:
                </span>
                <img
                  src={warning.incident_details.photo_url}
                  alt={`Foto del incidente en la plaza ${warning.incident_details.spot_number || 'desconocida'}`}
                  className="w-full max-w-md rounded-md border border-border"
                  loading="lazy"
                />
              </div>
            )}

            {/* Status */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Estado del incidente:</span>
              <Badge
                variant={
                  warning.incident_details.status === 'resolved'
                    ? 'default'
                    : warning.incident_details.status === 'pending'
                    ? 'secondary'
                    : 'outline'
                }
                className="text-xs"
              >
                {warning.incident_details.status === 'resolved'
                  ? 'Resuelto'
                  : warning.incident_details.status === 'pending'
                  ? 'Pendiente'
                  : warning.incident_details.status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
