import { useOfflineMode } from '@/hooks/useOfflineMode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const OfflinePreloadStatus = () => {
  const { preloadStatus, preloadResults, isOnline } = useOfflineMode();

  if (!preloadResults) {
    return null;
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = () => {
    switch (preloadStatus) {
      case 'loading':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Cargando...</Badge>;
      case 'complete':
        return <Badge variant="default" className="bg-green-600">Completo</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-600">Parcial</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Estado de Precarga Offline</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {isOnline ? 'Conectado' : 'Sin conexión'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Perfil</span>
            {getStatusIcon(preloadResults.profile)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Matrículas</span>
            {getStatusIcon(preloadResults.plates)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Grupos</span>
            {getStatusIcon(preloadResults.groups)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Reserva del día</span>
            {getStatusIcon(preloadResults.todayReservation)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Reservas próximas</span>
            {getStatusIcon(preloadResults.upcomingReservations)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Mapas de plazas</span>
            {getStatusIcon(preloadResults.maps)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
