import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupsTab } from "@/components/admin/groups/GroupsTab";
import { VisualEditorTab } from "@/components/admin/visual-editor/VisualEditorTab";
import { AdminCheckinConfigTab } from "@/components/admin/configuration/AdminCheckinConfigTab";
import type { ParkingGroup } from "@/types/admin";

interface ConfigurationTabProps {
  parkingGroups: ParkingGroup[];
  initialView?: "groups" | "visual-editor" | "settings" | "checkin-config";
  onViewChange?: (view: "groups" | "visual-editor" | "settings" | "checkin-config") => void;
}

export const ConfigurationTab = ({ 
  parkingGroups, 
  initialView = "groups",
  onViewChange 
}: ConfigurationTabProps) => {
  const [activeView, setActiveView] = useState(initialView);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const handleViewChange = (value: string) => {
    const view = value as "groups" | "visual-editor" | "settings" | "checkin-config";
    setActiveView(view);
    onViewChange?.(view);
  };

  return (
    <Tabs value={activeView} onValueChange={handleViewChange} className="w-full">
      <TabsList className="mb-4 bg-card">
        <TabsTrigger 
          value="groups"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Grupos de Parking
        </TabsTrigger>
        <TabsTrigger 
          value="visual-editor"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Editor Visual
        </TabsTrigger>
        <TabsTrigger 
          value="checkin-config"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Check-in/Check-out
        </TabsTrigger>
      </TabsList>

      <TabsContent value="groups">
        <GroupsTab />
      </TabsContent>

      <TabsContent value="visual-editor">
        <VisualEditorTab parkingGroups={parkingGroups} />
      </TabsContent>

      <TabsContent value="checkin-config">
        <AdminCheckinConfigTab />
      </TabsContent>
    </Tabs>
  );
};
