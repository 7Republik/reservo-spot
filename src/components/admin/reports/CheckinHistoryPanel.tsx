import { useEffect, useState } from 'react';
import { useCheckinReports } from '@/hooks/admin/useCheckinReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Filter, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckinTrendCharts } from './CheckinTrendCharts';

interface ParkingGroup {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
}

interface ParkingSpot {
  id: string;
  spot_number: string;
}

export const CheckinHistoryPanel = () => {
  const { checkinHistory, stats, loading, loadCheckinHistory, calculateStats, exportToCSV } = useCheckinReports();
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    groupId: '',
    userId: '',
    spotId: '',
    startDate: '',
    endDate: ''
  });

  // Estados para opciones de filtros
  const [groups, setGroups] = useState<ParkingGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(checkinHistory.length / itemsPerPage);
  const paginatedData = checkinHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Cargar opciones de filtros
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadCheckinHistory();
    calculateStats();
  }, []);

  const loadFilterOptions = async () => {
    setLoadingOptions(true);
    try {
      // Cargar grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from('parking_groups')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Cargar usuarios (solo los que tienen check-ins)
      // Primero obtener los IDs de usuarios con check-ins
      const { data: checkinUsers, error: checkinUsersError } = await supabase
        .from('reservation_checkins')
        .select('user_id');

      if (checkinUsersError) throw checkinUsersError;

      const userIds = [...new Set((checkinUsers || []).map(c => c.user_id))];

      // Luego obtener los perfiles de esos usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Cargar plazas
      const { data: spotsData, error: spotsError } = await supabase
        .from('parking_spots')
        .select('id, spot_number')
        .eq('is_active', true)
        .order('spot_number');

      if (spotsError) throw spotsError;
      setSpots(spotsData || []);
    } catch (err) {
      console.error('Error loading filter options:', err);
      toast.error('Error al cargar opciones de filtros');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleApplyFilters = () => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    loadCheckinHistory(activeFilters);
    calculateStats(activeFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      groupId: '',
      userId: '',
      spotId: '',
      startDate: '',
      endDate: ''
    });
    loadCheckinHistory();
    calculateStats();
    setCurrentPage(1);
  };

  const handleExport = () => {
    exportToCSV(checkinHistory, 'historico-checkins');
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Gráficas de Tendencia */}
      <CheckinTrendCharts checkinHistory={checkinHistory} loading={loading} />

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_checkins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-outs</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_checkouts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cumplimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.compliance_rate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Infracciones</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_infractions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.checkin_infractions} check-in, {stats.checkout_infractions} check-out
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avanzados
          </CardTitle>
          <CardDescription>
            Filtra el histórico por usuario, grupo, plaza o rango de fechas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por Grupo */}
            <div className="space-y-2">
              <Label htmlFor="group-filter">Grupo de Parking</Label>
              <Select
                value={filters.groupId || "all"}
                onValueChange={(value) => setFilters({ ...filters, groupId: value === "all" ? "" : value })}
                disabled={loadingOptions}
              >
                <SelectTrigger id="group-filter">
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

            {/* Filtro por Usuario */}
            <div className="space-y-2">
              <Label htmlFor="user-filter">Usuario</Label>
              <Select
                value={filters.userId || "all"}
                onValueChange={(value) => setFilters({ ...filters, userId: value === "all" ? "" : value })}
                disabled={loadingOptions}
              >
                <SelectTrigger id="user-filter">
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Plaza */}
            <div className="space-y-2">
              <Label htmlFor="spot-filter">Plaza</Label>
              <Select
                value={filters.spotId || "all"}
                onValueChange={(value) => setFilters({ ...filters, spotId: value === "all" ? "" : value })}
                disabled={loadingOptions}
              >
                <SelectTrigger id="spot-filter">
                  <SelectValue placeholder="Todas las plazas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las plazas</SelectItem>
                  {spots.map((spot) => (
                    <SelectItem key={spot.id} value={spot.id}>
                      {spot.spot_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Inicio */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            {/* Fecha Fin */}
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha Fin</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            {/* Botones */}
            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Histórico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Check-ins y Check-outs</CardTitle>
              <CardDescription>
                Mostrando {paginatedData.length} de {checkinHistory.length} registros
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" disabled={checkinHistory.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : checkinHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros de check-ins en el histórico
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Plaza</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.user_name}</TableCell>
                        <TableCell>{item.spot_number}</TableCell>
                        <TableCell>{item.group_name}</TableCell>
                        <TableCell>
                          {formatDateTime(item.checkin_at)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(item.checkout_at)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(item.duration_minutes)}
                        </TableCell>
                        <TableCell>
                          {item.is_continuous ? (
                            <Badge variant="secondary">Continua</Badge>
                          ) : item.checkout_at ? (
                            <Badge variant="default">Completado</Badge>
                          ) : (
                            <Badge variant="outline">En curso</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
