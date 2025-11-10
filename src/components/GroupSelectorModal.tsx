import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, Users, CheckCircle2 } from "lucide-react";

interface GroupSelectorModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  userGroups: string[];
  onGroupSelected: (groupId: string, groupName: string) => void;
  onCancel: () => void;
}

interface GroupWithAvailability {
  id: string;
  name: string;
  description: string | null;
  totalSpots: number;
  occupiedSpots: number;
  availableSpots: number;
  occupancyRate: number;
}

const GroupSelectorModal = ({
  isOpen,
  selectedDate,
  userGroups,
  onGroupSelected,
  onCancel,
}: GroupSelectorModalProps) => {
  const [groups, setGroups] = useState<GroupWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && selectedDate && userGroups.length > 0) {
      loadGroupsWithAvailability();
    }
  }, [isOpen, selectedDate, userGroups]);

  const loadGroupsWithAvailability = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate!, "yyyy-MM-dd");

      const groupsData: GroupWithAvailability[] = [];

      for (const groupId of userGroups) {
        // Get group info
        const { data: group, error: groupError } = await supabase
          .from("parking_groups")
          .select("id, name, description")
          .eq("id", groupId)
          .eq("is_active", true)
          .single();

        if (groupError || !group) continue;

        // Get total active spots
        const { data: spots, error: spotsError } = await supabase
          .from("parking_spots")
          .select("id")
          .eq("group_id", groupId)
          .eq("is_active", true);

        if (spotsError) continue;

        const totalSpots = spots?.length || 0;

        // Get occupied spots for the date
        const { data: reservations, error: reservationsError } = await supabase
          .from("reservations")
          .select("spot_id")
          .eq("reservation_date", dateStr)
          .eq("status", "active")
          .in("spot_id", spots?.map(s => s.id) || []);

        if (reservationsError) continue;

        const occupiedSpots = reservations?.length || 0;
        const availableSpots = totalSpots - occupiedSpots;
        const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

        groupsData.push({
          id: group.id,
          name: group.name,
          description: group.description,
          totalSpots,
          occupiedSpots,
          availableSpots,
          occupancyRate,
        });
      }

      setGroups(groupsData);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Error al cargar los grupos");
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-red-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return "bg-red-500";
    if (rate >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 py-4">
            {groups.map((group) => {
              const isAvailable = group.availableSpots > 0;
              
              return (
                <Card
                  key={group.id}
                  className={`p-4 transition-all duration-200 ${
                    isAvailable
                      ? "cursor-pointer hover:shadow-lg hover:border-primary hover:scale-[1.02]"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => isAvailable && onGroupSelected(group.id, group.name)}
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
                  </div>
                </Card>
              );
            })}
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
