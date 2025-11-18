import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Building2 } from "lucide-react";
import { useGroupSelection } from "@/hooks/useGroupSelection";
import GroupCard from "@/components/group-selector/GroupCard";
import { CachedDataIndicator } from "./CachedDataIndicator";

interface GroupSelectorModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  userGroups: string[];
  userId: string;
  onGroupSelected: (groupId: string, groupName: string) => void;
  onQuickReserve: (groupId: string, groupName: string, spotId: string, spotNumber: string, type: 'last' | 'random') => void;
  onJoinWaitlist?: (groupId: string, groupName: string) => void;
  onCancel: () => void;
}

/**
 * Group selector modal component
 * 
 * Displays available parking groups with real-time availability metrics
 * and provides quick reservation options.
 */

const GroupSelectorModal = ({
  isOpen,
  selectedDate,
  userGroups,
  userId,
  onGroupSelected,
  onQuickReserve,
  onJoinWaitlist,
  onCancel,
}: GroupSelectorModalProps) => {
  const { groups, loading, getOccupancyColor, isOnline, lastSyncTime } = useGroupSelection(
    isOpen,
    selectedDate,
    userGroups,
    userId
  );

  if (!selectedDate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Selecciona un grupo de parking
          </DialogTitle>
          <DialogDescription>
            Elige el grupo donde deseas reservar para el{" "}
            <span className="font-semibold capitalize">
              {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de datos cacheados */}
        <CachedDataIndicator 
          lastSyncTime={lastSyncTime} 
          isOnline={isOnline}
          className="mb-2"
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 py-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onGroupSelected={onGroupSelected}
                onQuickReserve={onQuickReserve}
                onJoinWaitlist={onJoinWaitlist}
                getOccupancyColor={getOccupancyColor}
              />
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay grupos disponibles para esta fecha
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupSelectorModal;
