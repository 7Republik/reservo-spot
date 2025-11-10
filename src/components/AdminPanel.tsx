import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ParkingSquare, CreditCard, Settings } from "lucide-react";
import { LicensePlatesTab } from "@/components/admin/license-plates/LicensePlatesTab";
import { ParkingSpotsTab } from "@/components/admin/parking-spots/ParkingSpotsTab";
import { UsersTab } from "@/components/admin/users/UsersTab";
import { ConfigurationTab } from "@/components/admin/configuration/ConfigurationTab";
import { useParkingGroups } from "@/hooks/admin/useParkingGroups";

const AdminPanel = () => {
  const parkingGroupsHook = useParkingGroups();
  const [userGroupAssignments, setUserGroupAssignments] = useState<Record<string, string[]>>({});

  useEffect(() => {
    parkingGroupsHook.loadParkingGroups();
    loadUserGroupAssignments();
  }, []);

  const loadUserGroupAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("user_group_assignments")
        .select("user_id, group_id");

      if (error) throw error;

      const assignments: Record<string, string[]> = {};
      data?.forEach(assignment => {
        if (!assignments[assignment.user_id]) {
          assignments[assignment.user_id] = [];
        }
        assignments[assignment.user_id].push(assignment.group_id);
      });

      setUserGroupAssignments(assignments);
    } catch (error: any) {
      console.error("Error loading user group assignments:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plates">
            <CreditCard className="w-4 h-4 mr-2" />
            Matrículas
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="spots">
            <ParkingSquare className="w-4 h-4 mr-2" />
            Plazas
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plates" className="space-y-4">
          <LicensePlatesTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersTab 
            parkingGroups={parkingGroupsHook.parkingGroups}
            userGroupAssignments={userGroupAssignments}
            onReloadAssignments={loadUserGroupAssignments}
          />
        </TabsContent>

        <TabsContent value="spots" className="space-y-4">
          <ParkingSpotsTab parkingGroups={parkingGroupsHook.parkingGroups} />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <ConfigurationTab parkingGroups={parkingGroupsHook.parkingGroups} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
