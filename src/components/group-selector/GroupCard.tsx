import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2 } from "lucide-react";
import { GroupWithAvailability } from "@/hooks/useGroupSelection";
import QuickReserveButtons from "./QuickReserveButtons";

interface GroupCardProps {
  group: GroupWithAvailability;
  onGroupSelected: (groupId: string, groupName: string) => void;
  onQuickReserve: (groupId: string, groupName: string, spotId: string, spotNumber: string, type: 'last' | 'random') => void;
  getOccupancyColor: (rate: number) => string;
}

/**
 * Card component displaying parking group information and quick reservation options
 * 
 * Shows group availability, occupancy metrics, and provides quick reservation buttons
 * for last used spot, random spot, or map selection.
 */
const GroupCard = ({ group, onGroupSelected, onQuickReserve, getOccupancyColor }: GroupCardProps) => {
  const isAvailable = group.availableSpots > 0;
  
  return (
    <Card
      className={`p-4 transition-all duration-200 ${
        isAvailable
          ? "hover:shadow-lg hover:border-primary"
          : "opacity-60"
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-base text-foreground">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
          </div>
        </div>

        {/* Availability badge */}
        {isAvailable ? (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {group.availableSpots} disponibles
          </Badge>
        ) : (
          <Badge variant="destructive">
            Completo
          </Badge>
        )}

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              Ocupación
            </span>
            <span className={`font-bold ${getOccupancyColor(group.occupancyRate)}`}>
              {Math.round(group.occupancyRate)}%
            </span>
          </div>
          <Progress 
            value={group.occupancyRate} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {group.occupiedSpots}/{group.totalSpots} ocupadas
          </p>
        </div>

        {/* Quick reservation buttons */}
        {isAvailable && (
          <QuickReserveButtons
            group={group}
            onGroupSelected={onGroupSelected}
            onQuickReserve={onQuickReserve}
          />
        )}
      </div>
    </Card>
  );
};

export default GroupCard;
