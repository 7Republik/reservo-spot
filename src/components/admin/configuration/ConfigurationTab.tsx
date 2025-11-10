import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupsTab } from "@/components/admin/groups/GroupsTab";
import { VisualEditorTab } from "@/components/admin/visual-editor/VisualEditorTab";
import type { ParkingGroup } from "@/types/admin";

interface ConfigurationTabProps {
  parkingGroups: ParkingGroup[];
}

export const ConfigurationTab = ({ parkingGroups }: ConfigurationTabProps) => {
  return (
    <Tabs defaultValue="groups-list" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="groups-list">Grupos de Parking</TabsTrigger>
        <TabsTrigger value="visual-editor">Editor Visual</TabsTrigger>
      </TabsList>

      <TabsContent value="groups-list">
        <GroupsTab />
      </TabsContent>

      <TabsContent value="visual-editor">
        <VisualEditorTab parkingGroups={parkingGroups} />
      </TabsContent>
    </Tabs>
  );
};
