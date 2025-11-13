import { useEffect, useState } from "react";
import { useParkingGroups } from "@/hooks/admin/useParkingGroups";
import { useReservationSettings } from "@/hooks/admin/useReservationSettings";
import { useBlockedDates } from "@/hooks/admin/useBlockedDates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { GroupCard } from "./GroupCard";
import { GroupFormDialog } from "./GroupFormDialog";
import { DeactivateGroupDialog } from "./DeactivateGroupDialog";
import { ScheduleDeactivationDialog } from "./ScheduleDeactivationDialog";
import { ReservationSettingsCard } from "./ReservationSettingsCard";
import { BlockedDatesCard } from "./BlockedDatesCard";
import { GroupsTabSkeleton } from "../skeletons/AdminSkeletons";
import type { ParkingGroup } from "@/types/admin";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export const GroupsTab = () => {
  const parkingGroupsHook = useParkingGroups();
  const settingsHook = useReservationSettings();
  const blockedDatesHook = useBlockedDates();
  
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ParkingGroup | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [groupToDeactivate, setGroupToDeactivate] = useState<ParkingGroup | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [groupToSchedule, setGroupToSchedule] = useState<ParkingGroup | null>(null);
  const [showDeactivatedGroups, setShowDeactivatedGroups] = useState(false);

  useEffect(() => {
    // Forzar recarga cada vez que se monta el componente
    parkingGroupsHook.loadParkingGroups(true);
    settingsHook.loadSettings(true);
    blockedDatesHook.loadBlockedDates(true);
  }, []);

  const openCreateDialog = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const openEditDialog = (group: ParkingGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const activeGroups = parkingGroupsHook.parkingGroups.filter(g => !g.deactivated_at);
  const deactivatedGroups = parkingGroupsHook.parkingGroups.filter(g => g.deactivated_at);

  const isLoading = parkingGroupsHook.loading || settingsHook.loading || blockedDatesHook.loading;

  if (isLoading) {
    return <GroupsTabSkeleton />;
  }

  return (
    <>
      <ReservationSettingsCard 
        settings={settingsHook.settings}
        onUpdateSettings={settingsHook.updateSettings}
        onSave={settingsHook.saveSettings}
      />

      <BlockedDatesCard 
        blockedDates={blockedDatesHook.blockedDates}
        parkingGroups={parkingGroupsHook.parkingGroups}
        onUnblockDate={blockedDatesHook.unblockDate}
        onBlockDate={blockedDatesHook.blockDate}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Grupos de Parking</CardTitle>
            <CardDescription>
              Gestiona las zonas y grupos de plazas
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Grupo
          </Button>
        </CardHeader>
        <CardContent>
          {activeGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay grupos de parking activos</p>
              <p className="text-sm mt-2">Crea tu primer grupo para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onEdit={openEditDialog}
                  onToggleActive={parkingGroupsHook.toggleGroupActive}
                  onDeactivate={(g) => {
                    setGroupToDeactivate(g);
                    setDeactivateDialogOpen(true);
                  }}
                  onSchedule={(g) => {
                    setGroupToSchedule(g);
                    setScheduleDialogOpen(true);
                  }}
                  onCancelSchedule={parkingGroupsHook.cancelScheduledDeactivation}
                />
              ))}
            </div>
          )}

          {deactivatedGroups.length > 0 && (
            <Collapsible
              open={showDeactivatedGroups}
              onOpenChange={setShowDeactivatedGroups}
              className="mt-6"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full">
                  <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showDeactivatedGroups ? 'rotate-180' : ''}`} />
                  Grupos Dados de Baja ({deactivatedGroups.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deactivatedGroups.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onEdit={openEditDialog}
                      onToggleActive={parkingGroupsHook.toggleGroupActive}
                      onDeactivate={() => {}}
                      onSchedule={() => {}}
                      onCancelSchedule={() => {}}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      <GroupFormDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        editingGroup={editingGroup}
        onCreate={parkingGroupsHook.createGroup}
        onUpdate={parkingGroupsHook.updateGroup}
      />

      <DeactivateGroupDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        group={groupToDeactivate}
        onConfirm={parkingGroupsHook.deactivateGroup}
      />

      <ScheduleDeactivationDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        group={groupToSchedule}
        onConfirm={parkingGroupsHook.scheduleDeactivation}
      />
    </>
  );
};
