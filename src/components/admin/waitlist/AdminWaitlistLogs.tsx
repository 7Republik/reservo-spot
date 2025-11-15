import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WaitlistLog {
  id: string;
  user_id: string | null;
  entry_id: string | null;
  offer_id: string | null;
  action: string;
  details: any;
  created_at: string;
  user_email?: string;
}

const ACTION_LABELS: Record<string, string> = {
  entry_created: "Entrada Creada",
  entry_cancelled: "Entrada Cancelada",
  offer_created: "Oferta Creada",
  offer_accepted: "Oferta Aceptada",
  offer_rejected: "Oferta Rechazada",
  offer_expired: "Oferta Expirada",
  penalty_applied: "Penalización Aplicada",
  cleanup_executed: "Limpieza Ejecutada",
};

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  entry_created: "default",
  entry_cancelled: "secondary",
  offer_created: "default",
  offer_accepted: "default",
  offer_rejected: "destructive",
  offer_expired: "destructive",
  penalty_applied: "destructive",
  cleanup_executed: "secondary",
};

export const AdminWaitlistLogs = () => {
  const [logs, setLogs] = useState<WaitlistLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);

      // Construir query de logs
      let query = supabase
        .from("waitlist_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Aplicar filtros
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (dateFrom) {
        query = query.gte("created_at", new Date(dateFrom).toISOString());
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data: logsData, error: logsError } = await query;

      if (logsError) throw logsError;

      // Obtener emails de usuarios únicos
      const userIds = [...new Set(logsData?.map(log => log.user_id).filter(Boolean) || [])];
      
      let userEmails: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          userEmails = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.email;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Combinar datos
      let processedLogs = (logsData || []).map((log) => ({
        ...log,
        user_email: log.user_id ? (userEmails[log.user_id] || "Usuario eliminado") : "Sistema",
      }));

      // Filtrar por email si es necesario
      if (searchEmail) {
        processedLogs = processedLogs.filter((log) =>
          log.user_email.toLowerCase().includes(searchEmail.toLowerCase())
        );
      }

      setLogs(processedLogs);
    } catch (error: any) {
      console.error("Error loading waitlist logs:", error);
      toast.error("Error al cargar los logs");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ["Fecha", "Usuario", "Acción", "Detalles"];
      const rows = logs.map((log) => [
        format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es }),
        log.user_email || "N/A",
        ACTION_LABELS[log.action] || log.action,
        JSON.stringify(log.details || {}),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `waitlist_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Logs exportados correctamente");
    } catch (error: any) {
      console.error("Error exporting logs:", error);
      toast.error("Error al exportar los logs");
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, dateFrom, dateTo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Auditoría</CardTitle>
        <CardDescription>
          Historial completo de operaciones de lista de espera (últimos 100 registros)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="action-filter">Acción</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger id="action-filter">
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="entry_created">Entrada Creada</SelectItem>
                <SelectItem value="entry_cancelled">Entrada Cancelada</SelectItem>
                <SelectItem value="offer_created">Oferta Creada</SelectItem>
                <SelectItem value="offer_accepted">Oferta Aceptada</SelectItem>
                <SelectItem value="offer_rejected">Oferta Rechazada</SelectItem>
                <SelectItem value="offer_expired">Oferta Expirada</SelectItem>
                <SelectItem value="penalty_applied">Penalización Aplicada</SelectItem>
                <SelectItem value="cleanup_executed">Limpieza Ejecutada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-email">Buscar por Email</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-email"
                placeholder="email@ejemplo.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-from">Desde</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-to">Hasta</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Tabla de logs */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Cargando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No se encontraron logs con los filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell>{log.user_email}</TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[log.action] || "default"}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {log.details && (
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {logs.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Mostrando {logs.length} registros (máximo 100)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
