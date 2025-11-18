import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ParkingSquare, CreditCard, Settings, AlertTriangle, ClipboardCheck, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LicensePlatesTab } from "@/components/admin/license-plates/LicensePlatesTab";
import { ParkingSpotsTab } from "@/components/admin/parking-spots/ParkingSpotsTab";
import { UsersTab } from "@/components/admin/users/UsersTab";
import { ConfigurationTab } from "@/components/admin/configuration/ConfigurationTab";
import { IncidentList } from "@/components/admin/incidents/IncidentList";
import { IncidentDetails } from "@/components/admin/incidents/IncidentDetails";
import { CheckinReportPanel } from "@/components/admin/reports/CheckinReportPanel";
import { CheckinHistoryPanel } from "@/components/admin/reports/CheckinHistoryPanel";
import { AdminWaitlistPanel } from "@/components/admin/waitlist/AdminWaitlistPanel";
import { CheckInStats } from "@/components/admin/check-in-stats";
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
  const [checkinReportView, setCheckinReportView] = useState<"infractions" | "history" | "stats">("infractions");
  const [configurationView, setConfigurationView] = useState<"groups" | "visual-editor" | "settings" | "checkin-config">("groups");

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
    
    // Lazy load data based on tab
    if (value === "users" || value === "spots" || value === "groups") {
      // Siempre recargar grupos cuando se accede a estas pestañas para reflejar cambios
      parkingGroupsHook.loadParkingGroups(true);
    }

    if (value === "users") {
      loadUserGroupAssignments();
    }

    // SIEMPRE recargar incidentes al cambiar a la pestaña (forzar recarga)
    if (value === "incidents") {
      loadIncidents("all", true); // forceReload = true
      loadPendingIncidentsCount();
    }

    setLoadedTabs(prev => new Set([...prev, value]));
  };

  const handleIncidentUpdate = () => {
    // Forzar recarga completa después de actualizar un incidente
    loadIncidents("all", true);
    loadPendingIncidentsCount();
  };

  const handleCloseIncidentDetails = () => {
    setSelectedIncidentId(null);
  };

  const handleOpenVisualEditor = () => {
    setActiveTab("groups");
    setConfigurationView("visual-editor");
  };

  // Load pending incidents count on mount
  useEffect(() => {
    loadPendingIncidentsCount();
    
    // Actualizar contador periódicamente (cada 30 segundos)
    const interval = setInterval(() => {
      loadPendingIncidentsCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plates" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <div className="w-full overflow-x-auto pb-2 -mb-2">
          <TabsList className="inline-flex w-auto min-w-full bg-card/95 backdrop-blur-sm p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="plates"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all whitespace-nowrap flex-shrink-0"
            >
              <CreditCard className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Matrículas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all whitespace-nowrap flex-shrink-0"
            >
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="spots"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all whitespace-nowrap flex-shrink-0"
            >
              <ParkingSquare className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Plazas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="incidents" 
              className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all whitespace-nowrap flex-shrink-0"
            >
              <AlertTriangle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Incidentes</span>
              {pendingIncidentsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-1 sm:ml-2 h-5 min-w-5 px-1.5 text-xs absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0"
                >
                  {pendingIncidentsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="waitlist"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all whitespace-nowrap flex-shrink-0"
            >
              <ListOrdered className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Lista Espera</span>
            </TabsTrigger>
            <TabsTrigger 
              value="checkin-reports"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all whitespace-nowrap flex-shrink-0"
            >
              <ClipboardCheck className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger 
              value="groups"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all whitespace-nowrap flex-shrink-0"
            >
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
          <ParkingSpotsTab 
            parkingGroups={parkingGroupsHook.parkingGroups}
            onOpenVisualEditor={handleOpenVisualEditor}
          />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <IncidentList onSelectIncident={setSelectedIncidentId} />
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <AdminWaitlistPanel />
        </TabsContent>

        <TabsContent value="checkin-reports" className="space-y-4">
          <div className="space-y-4">
            <Tabs value={checkinReportView} onValueChange={(v) => setCheckinReportView(v as "infractions" | "history" | "stats")}>
              <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-card">
                <TabsTrigger 
                  value="infractions"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Infracciones del Día
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Histórico
                </TabsTrigger>
                <TabsTrigger 
                  value="stats"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Estadísticas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="infractions" className="mt-4">
                <CheckinReportPanel />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <CheckinHistoryPanel />
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <CheckInStats />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <ConfigurationTab 
            parkingGroups={parkingGroupsHook.parkingGroups}
            initialView={configurationView}
            onViewChange={setConfigurationView}
          />
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
