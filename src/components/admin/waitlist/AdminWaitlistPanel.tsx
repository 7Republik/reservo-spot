import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, List, Settings, FileText } from "lucide-react";
import { AdminWaitlistStats } from "./AdminWaitlistStats";
import { AdminWaitlistTable } from "./AdminWaitlistTable";
import { AdminWaitlistConfig } from "./AdminWaitlistConfig";
import { AdminWaitlistLogs } from "./AdminWaitlistLogs";

export const AdminWaitlistPanel = () => {
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gestión de Lista de Espera</h2>
        <p className="text-muted-foreground mt-1">
          Administra las listas de espera, visualiza estadísticas y configura parámetros del sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card">
          <TabsTrigger 
            value="stats"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger 
            value="lists"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <List className="w-4 h-4 mr-2" />
            Listas Activas
          </TabsTrigger>
          <TabsTrigger 
            value="config"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger 
            value="logs"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileText className="w-4 h-4 mr-2" />
            Logs de Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4 mt-6">
          <AdminWaitlistStats />
        </TabsContent>

        <TabsContent value="lists" className="space-y-4 mt-6">
          <AdminWaitlistTable />
        </TabsContent>

        <TabsContent value="config" className="space-y-4 mt-6">
          <AdminWaitlistConfig />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-6">
          <AdminWaitlistLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
