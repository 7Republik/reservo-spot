import { History, Zap, MapPin } from "lucide-react";
import { GroupWithAvailability } from "@/hooks/useGroupSelection";

interface QuickReserveButtonsProps {
  group: GroupWithAvailability;
  onGroupSelected: (groupId: string, groupName: string) => void;
  onQuickReserve: (groupId: string, groupName: string, spotId: string, spotNumber: string, type: 'last' | 'random') => void;
}

/**
 * Quick reservation action buttons
 * 
 * Provides three options:
 * - Reserve last used spot (if available)
 * - Reserve random available spot
 * - Choose spot on map
 */
const QuickReserveButtons = ({ group, onGroupSelected, onQuickReserve }: QuickReserveButtonsProps) => {
  return (
    <div className="space-y-2 pt-2 border-t border-gray-200">
      <p className="text-xs font-medium text-muted-foreground">
        Reserva rápida:
      </p>
      
      <div className="flex flex-col gap-2">
        {/* Reserve last used spot button */}
        {group.lastUsedSpot?.isAvailableNow && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickReserve(
                group.id, 
                group.name, 
                group.lastUsedSpot!.id, 
                group.lastUsedSpot!.spotNumber,
                'last'
              );
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-blue-900">
                Reservar mi última plaza
              </p>
              <p className="text-xs text-blue-700">
                Plaza {group.lastUsedSpot.spotNumber}
              </p>
            </div>
          </button>
        )}
        
        {/* Reserve random spot button */}
        {group.randomAvailableSpot && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickReserve(
                group.id, 
                group.name, 
                group.randomAvailableSpot!.id, 
                group.randomAvailableSpot!.spotNumber,
                'random'
              );
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-green-900">
                Reservar plaza aleatoria
              </p>
              <p className="text-xs text-green-700">
                Asignación automática
              </p>
            </div>
          </button>
        )}
        
        {/* Choose on map button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGroupSelected(group.id, group.name);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors text-left"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900">
              Elegir en el mapa
            </p>
            <p className="text-xs text-gray-700">
              Ver plano y seleccionar
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickReserveButtons;
