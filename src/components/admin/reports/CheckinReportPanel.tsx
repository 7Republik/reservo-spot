import { useState, useEffect } from "react";
import { AlertCircle, Download, RefreshCw, Filter, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCheckinReports } from "@/hooks/admin/useCheckinReports";
import { useParkingGroups } from "@/hooks/admin/useParkingGroups";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CheckinReportItem } from "@/types/checkin.types";

export const CheckinReportPanel = () => {
  const { todayInfractions, stats, loading, loadTodayInfractions, calculateStats, exportToCSV } = useCheckinReports();
  const { parkingGroups: groups, loadParkingGroups: loadGroups } = useParkingGroups();
  
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'checkin' | 'checkout'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    loadGroups();
    loadTodayInfractions();
    calculateStats();
  }, []);

  // Auto-refresh cada minuto
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadTodayInfractions({ 
        groupId: groupFilter !== 'all' ? groupFilter : undefined,
        infractionType: typeFilter !== 'all' ? typeFilter : undefined
      });
      calculateStats();
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, groupFilter, typeFilter]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    loadTodayInfractions({
      groupId: groupFilter !== 'all' ? groupFilter : undefined,
      infractionType: typeFilter !== 'all' ? typeFilter : undefined
    });
  }, [groupFilter, typeFilter]);

  const handleRefresh = () => {
    loadTodayInfractions({
      groupId: groupFilter !== 'all' ? groupFilter : undefined,
      infractionType: typeFilter !== 'all' ? typeFilter : undefined
    });
    calculateStats();
  };

  const handleExport = () => {
    exportToCSV(todayInfractions, 'infracciones-checkin');
  };

  // Separar infracciones por tipo
  const checkinInfractions = todayInfractions.filter(i => i.infraction_type === 'checkin');
  const checkoutInfractions = todayInfractions.filter(i => i.infraction_type === 'checkout');

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Infracciones del Día</h2>
          <p className="text-sm text-muted-foreground">
            Monitoreo en tiempo real de cumplimiento de check-in/check-out
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={todayInfractions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Infracciones</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_infractions}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sin Check-in</p>
                  <p className="text-2xl font-bold text-foreground">{stats.checkin_infractions}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sin Check-out</p>
                  <p className="text-2xl font-bold text-foreground">{stats.checkout_infractions}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cumplimiento</p>
                  <p className="text-2xl font-bold text-foreground">{stats.compliance_rate.toFixed(1)}%</p>
                </div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  stats.compliance_rate >= 90 ? 'bg-green-500' :
                  stats.compliance_rate >= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  <span className="text-white text-xs font-bold">
                    {stats.compliance_rate >= 90 ? '✓' : '!'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Grupo de Parking
              </label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Tipo de Infracción
              </label>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="checkin">Sin Check-in</SelectItem>
                  <SelectItem value="checkout">Sin Check-out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm text-foreground">
                  Actualización automática (1 min)
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Infracciones de Check-in */}
      {(typeFilter === 'all' || typeFilter === 'checkin') && (
        <InfractionTable
          title="Reservas sin Check-in"
          description="Usuarios que no han realizado check-in dentro del tiempo permitido"
          infractions={checkinInfractions}
          type="checkin"
          loading={loading}
        />
      )}

      {/* Tabla de Infracciones de Check-out */}
      {(typeFilter === 'all' || typeFilter === 'checkout') && (
        <InfractionTable
          title="Reservas sin Check-out"
          description="Usuarios que no han realizado check-out al finalizar su estancia"
          infractions={checkoutInfractions}
          type="checkout"
          loading={loading}
        />
      )}
    </div>
  );
};

interface InfractionTableProps {
  title: string;
  description: string;
  infractions: CheckinReportItem[];
  type: 'checkin' | 'checkout';
  loading: boolean;
}

const InfractionTable = ({ title, description, infractions, type, loading }: InfractionTableProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando infracciones...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={type === 'checkin' ? 'default' : 'secondary'} className="text-base px-3 py-1">
            {infractions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {infractions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p>No hay infracciones de {type === 'checkin' ? 'check-in' : 'check-out'} hoy</p>
              <p className="text-sm">¡Excelente cumplimiento!</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Plaza</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Detectado</TableHead>
                  {type === 'checkin' && <TableHead>Ventana Esperada</TableHead>}
                  {type === 'checkin' && <TableHead>Fin Gracia</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {infractions.map((infraction, index) => (
                  <TableRow key={`${infraction.user_id}-${index}`}>
                    <TableCell className="font-medium">{infraction.user_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{infraction.spot_number}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{infraction.group_name}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(infraction.detected_at), "HH:mm", { locale: es })}
                    </TableCell>
                    {type === 'checkin' && infraction.expected_window_end && (
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(infraction.expected_window_end), "HH:mm", { locale: es })}
                      </TableCell>
                    )}
                    {type === 'checkin' && infraction.grace_period_end && (
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(infraction.grace_period_end), "HH:mm", { locale: es })}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
