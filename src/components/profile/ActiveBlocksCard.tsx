import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Ban, 
  AlertTriangle, 
  Calendar, 
  Clock,
  ExternalLink,
  Info
} from "lucide-react";
import { UserBlockWithWarning, InfractionCounts } from "@/types/profile";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActiveBlocksCardProps {
  blocks: UserBlockWithWarning[];
  infractionCounts: InfractionCounts | null;
  isLoading: boolean;
  onWarningClick?: (warningId: string) => void;
}

/**
 * Component to display active user blocks and current infraction counts
 * 
 * Features:
 * - Shows all active blocks with details
 * - Displays block type, reason, and expiration date
 * - Links to the warning that caused the block
 * - Shows current infraction counts (pending warnings)
 * - Visual indicators for block severity
 * - Responsive design
 */
export const ActiveBlocksCard = ({
  blocks,
  infractionCounts,
  isLoading,
  onWarningClick
}: ActiveBlocksCardProps) => {
  
  /**
   * Get badge variant based on block type
   */
  const getBlockTypeBadge = (blockType: string) => {
    switch (blockType) {
      case 'manual':
        return { variant: 'destructive' as const, label: 'Manual' };
      case 'automatic_checkin':
        return { variant: 'destructive' as const, label: 'Check-in Automático' };
      case 'automatic_checkout':
        return { variant: 'destructive' as const, label: 'Check-out Automático' };
      default:
        return { variant: 'secondary' as const, label: blockType };
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  /**
   * Get time remaining until block expires
   */
  const getTimeRemaining = (blockedUntil: string) => {
    try {
      return formatDistanceToNow(new Date(blockedUntil), { 
        addSuffix: true,
        locale: es 
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Ban className="h-4 w-4 sm:h-5 sm:w-5" />
            Bloqueos Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Ban className="h-4 w-4 sm:h-5 sm:w-5" />
          Bloqueos Activos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Blocks */}
        {blocks.length > 0 ? (
          <div className="space-y-4">
            {blocks.map((block) => {
              const typeBadge = getBlockTypeBadge(block.block_type);
              
              return (
                <Alert key={block.id} variant="destructive" className="border-2">
                  <Ban className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    {/* Block Type Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant={typeBadge.variant}>
                        {typeBadge.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ID: {block.id.slice(0, 8)}
                      </span>
                    </div>

                    {/* Reason */}
                    <div>
                      <p className="font-semibold text-sm">Razón:</p>
                      <p className="text-sm">{block.reason}</p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Bloqueado desde:</p>
                          <p className="text-muted-foreground">
                            {formatDate(block.blocked_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Expira:</p>
                          <p className="text-muted-foreground">
                            {formatDate(block.blocked_until)}
                          </p>
                          <p className="text-xs font-semibold mt-1">
                            {getTimeRemaining(block.blocked_until)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Link to Warning */}
                    {block.warning_id && block.warning && onWarningClick && (
                      <div className="pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => onWarningClick(block.warning_id!)}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Ver amonestación relacionada
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No tienes bloqueos activos en este momento.
            </AlertDescription>
          </Alert>
        )}

        {/* Infraction Counts */}
        {infractionCounts && infractionCounts.total_infractions > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h4 className="text-sm font-semibold">Infracciones Pendientes</h4>
            </div>
            <Alert variant="default" className="bg-warning/10 border-warning/50">
              <AlertDescription className="space-y-2">
                <p className="text-sm">
                  Tienes infracciones pendientes que aún no han generado una amonestación:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span>Check-in:</span>
                    <Badge variant="outline" className="ml-2">
                      {infractionCounts.checkin_infractions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span>Check-out:</span>
                    <Badge variant="outline" className="ml-2">
                      {infractionCounts.checkout_infractions}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Las infracciones se convierten en amonestaciones automáticas al alcanzar el umbral configurado.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
