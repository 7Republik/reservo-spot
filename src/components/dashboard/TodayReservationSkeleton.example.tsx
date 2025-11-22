import { useState, useEffect } from 'react';
import { TodayReservationCard } from './TodayReservationCard';
import { TodayReservationSkeleton } from './TodayReservationSkeleton';

/**
 * Ejemplo de uso del skeleton loader para TodayReservationCard
 * 
 * El skeleton se muestra mientras se cargan los datos desde cache o servidor.
 * Una vez cargados los datos, se muestra el componente real.
 */
export const TodayReservationSkeletonExample = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      setLoading(true);
      
      // Simular delay de carga (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Datos de ejemplo
      setReservations([
        {
          id: '1',
          spotNumber: 'A-15',
          groupName: 'Planta -1',
          isAccessible: true,
          hasCharger: false,
          isCompact: false,
        }
      ]);
      
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        Ejemplo: Skeleton Loader para Reserva del Día
      </h2>
      
      {loading ? (
        <TodayReservationSkeleton />
      ) : (
        <TodayReservationCard
          reservations={reservations}
          onViewDetails={(res) => console.log('Ver detalles:', res)}
          onReportIncident={(res) => console.log('Reportar incidente:', res)}
        />
      )}
      
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Uso:</h3>
        <pre className="text-sm overflow-x-auto">
{`{loading ? (
  <TodayReservationSkeleton />
) : (
  <TodayReservationCard
    reservations={reservations}
    onViewDetails={handleViewDetails}
    onReportIncident={handleReportIncident}
  />
)}`}
        </pre>
      </div>
    </div>
  );
};
