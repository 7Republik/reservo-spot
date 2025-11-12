import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ParkingSquare, CreditCard, Settings, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LicensePlatesTab } from "@/components/admin/license-plates/LicensePlatesTab";
import { ParkingSpotsTab } from "@/components/admin/parking-spots/ParkingSpotsTab";
import { UsersTab } from "@/components/admin/users/UsersTab";
import { ConfigurationTab } from "@/components/admin/configuration/ConfigurationTab";
import { IncidentList } from "@/components/admin/incidents/IncidentList";
import { IncidentDetails } from "@/components/admin/incidents/IncidentDetails";
import { useParkingGroups } from "@/hooks/admin/useParkingGroups";
import { useIncidentManagement } from "@/hooks/admin/useIncidentManagement";

const AdminPanel = () => {
  const parkingGroupsHook = useParkingGroups();
  const { loadIncidents } = useIncidentManagement();
  const [userGroupAssignments, setUserGroupAssignments] = useState<Record<string, string[]>>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["plates"]));
  const [activeTab, setActiveTab] = useState("plates");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [pendingIncidentsCount, setPendingIncidentsCount] = useState(0);

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

  const loadPendingIncidentsCount = async () => {
    try {
      const { count, error } = await supabase
        .from("incident_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      setPendingIncidentsCount(count || 0);
    } catch (error: any) {
      console.error("Error loading pending incidents count:", error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (loadedTabs.has(value)) return;

    // Lazy load data based on tab
    if (value === "users" || value === "spots" || value === "groups") {
      if (!loadedTabs.has("groups")) {
        parkingGroupsHook.loadParkingGroups();
      }
    }

    if (value === "users") {
      loadUserGroupAssignments();
    }

    if (value === "incidents") {
      loadIncidents("all");
    }

    setLoadedTabs(prev => new Set([...prev, value]));
  };

  const handleIncidentUpdate = () => {
    loadIncidents("all");
    loadPendingIncidentsCount();
  };

  const handleCloseIncidentDetails = () => {
    setSelectedIncidentId(null);
  };

  // Load pending incidents count on mount
  useEffect(() => {
    loadPendingIncidentsCount();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plates" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="incidents" className="relative">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Incidentes
            {pendingIncidentsCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-2 h-5 min-w-5 px-1.5 text-xs"
              >
                {pendingIncidentsCount}
              </Badge>
            )}
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

        <TabsContent value="incidents" className="space-y-4">
          <IncidentList onSelectIncident={setSelectedIncidentId} />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <ConfigurationTab parkingGroups={parkingGroupsHook.parkingGroups} />
        </TabsContent>
      </Tabs>

      {/* Incident Details Dialog */}
      <Dialog open={!!selectedIncidentId} onOpenChange={(open) => !open && handleCloseIncidentDetails()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedIncidentId && (
            <IncidentDetails
              incidentId={selectedIncidentId}
              onClose={handleCloseIncidentDetails}
              onUpdate={handleIncidentUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
