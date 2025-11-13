import { useState, useEffect } from "react";
import { AlertTriangle, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useIncidentManagement } from "@/hooks/admin/useIncidentManagement";
import type { IncidentReportWithDetails, IncidentStatus } from "@/types/incidents";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface IncidentListProps {
  onSelectIncident: (incidentId: string) => void;
}

export const IncidentList = ({ onSelectIncident }: IncidentListProps) => {
  const { incidents, loading, loadIncidents, getUserWarningCount } = useIncidentManagement();
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [warningCounts, setWarningCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Forzar recarga al cambiar el filtro de estado
    loadIncidents(statusFilter, true);
  }, [statusFilter]);

  // Load warning counts for offending users
  useEffect(() => {
    const loadWarningCounts = async () => {
      const counts: Record<string, number> = {};
      for (const incident of incidents) {
        if (incident.offending_user_id && !counts[incident.offending_user_id]) {
          const count = await getUserWarningCount(incident.offending_user_id);
          counts[incident.offending_user_id] = count;
        }
      }
      setWarningCounts(counts);
    };

    if (incidents.length > 0) {
      loadWarningCounts();
    }
  }, [incidents]);

  // Filter incidents by search query
  const filteredIncidents = incidents.filter((incident) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const reporterName = incident.reporter?.full_name?.toLowerCase() || '';
    const offendingUserName = incident.offending_user?.full_name?.toLowerCase() || '';
    const licensePlate = incident.offending_license_plate?.toLowerCase() || '';
    
    return (
      reporterName.includes(query) ||
      offendingUserName.includes(query) ||
      licensePlate.includes(query)
    );
  });

  const getStatusBadgeInternal = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Confirmado</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Desestimado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Gestión de Incidentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando incidentes...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Gestión de Incidentes
        </CardTitle>
        <CardDescription>
          Revisa y gestiona los reportes de incidentes de plazas ocupadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-48">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={statusFilter} 
              onValueChange={(value: string) => {
                loadIncidents(value as IncidentStatus | 'all');
                setStatusFilter(value as IncidentStatus | 'all');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="dismissed">Desestimados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Incident List */}
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No se encontraron incidentes con ese criterio' : 'No hay incidentes registrados'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                warningCount={incident.offending_user_id ? warningCounts[incident.offending_user_id] || 0 : 0}
                onSelect={() => onSelectIncident(incident.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface IncidentCardProps {
  incident: IncidentReportWithDetails;
  warningCount: number;
  onSelect: () => void;
}

const IncidentCard = ({ incident, warningCount, onSelect }: IncidentCardProps) => {
  const isPending = incident.status === 'pending';
  
  return (
    <div
      onClick={onSelect}
      className={`
        p-4 rounded-lg border cursor-pointer transition-colors
        ${isPending 
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30' 
          : 'border-border bg-card hover:bg-accent'
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            {isPending && (
              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                Pendiente
              </Badge>
            )}
            {!isPending && (
              <Badge variant={incident.status === 'confirmed' ? 'default' : 'secondary'}>
                {incident.status === 'confirmed' ? 'Confirmado' : 'Desestimado'}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {format(new Date(incident.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
            </span>
          </div>

          {/* Reporter */}
          <div className="text-sm">
            <span className="text-muted-foreground">Reportado por: </span>
            <span className="font-medium text-foreground">{incident.reporter?.full_name || 'Usuario desconocido'}</span>
          </div>

          {/* Original Spot */}
          {incident.original_spot && (
            <div className="text-sm">
              <span className="text-muted-foreground">Plaza original: </span>
              <span className="font-medium text-foreground">
                {incident.original_spot.spot_number} ({incident.original_spot.group_name})
              </span>
            </div>
          )}

          {/* Offending User */}
          <div className="text-sm">
            <span className="text-muted-foreground">Infractor: </span>
            {incident.offending_user ? (
              <span className="font-medium text-foreground">
                {incident.offending_user.full_name}
                {warningCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {warningCount} {warningCount === 1 ? 'amonestación' : 'amonestaciones'}
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground italic">No identificado</span>
            )}
          </div>

          {/* License Plate */}
          {incident.offending_license_plate && (
            <div className="text-sm">
              <span className="text-muted-foreground">Matrícula: </span>
              <span className="font-mono font-medium text-foreground">{incident.offending_license_plate}</span>
            </div>
          )}

          {/* Reassigned Spot */}
          {incident.reassigned_spot && (
            <div className="text-sm">
              <span className="text-muted-foreground">Plaza reasignada: </span>
              <span className="font-medium text-foreground">
                {incident.reassigned_spot.spot_number} ({incident.reassigned_spot.group_name})
              </span>
            </div>
          )}
        </div>

        {/* Status Badge (mobile) */}
        <div className="sm:hidden">
          {getStatusBadge(incident.status)}
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
    case 'confirmed':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Confirmado</Badge>;
    case 'dismissed':
      return <Badge variant="secondary">Desestimado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
