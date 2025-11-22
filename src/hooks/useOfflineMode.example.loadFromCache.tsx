/**
 * Ejemplo de uso de loadFromCache() con validación de antigüedad
 * 
 * Este ejemplo muestra cómo usar la nueva función loadFromCache()
 * que valida la antigüedad de los datos y muestra advertencias al usuario
 */

import { useEffect, useState } from 'react';
import { offlineCache } from '@/lib/offlineCache';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  email: string;
}

export const ExampleLoadFromCache = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<{
    timestamp: Date | null;
    isStale: boolean;
    relativeTime: string;
  } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    try {
      // Usar loadFromCache() en lugar de get()
      const result = await offlineCache.loadFromCache<Profile>('profile');

      if (!result.data) {
        toast.error('No hay datos de perfil en cache');
        setLoading(false);
        return;
      }

      // Guardar datos
      setProfile(result.data);
      setCacheInfo({
        timestamp: result.timestamp,
        isStale: result.isStale,
        relativeTime: result.relativeTime,
      });

      // Mostrar advertencia si los datos están obsoletos (más de 24 horas)
      if (result.isStale) {
        toast.warning(
          `Mostrando datos en cache de ${result.relativeTime}. Conéctate para actualizar.`,
          {
            duration: 5000,
          }
        );
      } else {
        // Mostrar info discreta si los datos son recientes
        console.log(`Datos cargados del cache (${result.relativeTime})`);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      toast.error('Error al cargar datos del cache');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!profile) {
    return <div>No hay datos disponibles</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Perfil</h2>
        <p>Nombre: {profile.name}</p>
        <p>Email: {profile.email}</p>
      </div>

      {cacheInfo && (
        <div className="bg-muted p-3 rounded text-sm">
          <p className="font-medium mb-1">Información del cache:</p>
          <p>Última actualización: {cacheInfo.relativeTime}</p>
          {cacheInfo.timestamp && (
            <p className="text-muted-foreground">
              {cacheInfo.timestamp.toLocaleString('es-ES')}
            </p>
          )}
          {cacheInfo.isStale && (
            <p className="text-yellow-600 dark:text-yellow-500 mt-2">
              ⚠️ Datos obsoletos (más de 24 horas)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Ejemplo de uso en un hook personalizado
 */
export const useProfileWithCache = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadProfile = async () => {
    setLoading(true);

    const result = await offlineCache.loadFromCache<Profile>('profile');

    if (result.data) {
      setProfile(result.data);
      setIsStale(result.isStale);
      setLastUpdate(result.relativeTime);

      // Advertencia automática si datos obsoletos
      if (result.isStale) {
        toast.warning(
          `Datos de ${result.relativeTime}. Conéctate para actualizar.`
        );
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    isStale,
    lastUpdate,
    reload: loadProfile,
  };
};

/**
 * Ejemplo de uso en componente de calendario
 */
export const ExampleCalendarWithCache = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [cacheAge, setCacheAge] = useState<string>('');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const result = await offlineCache.loadFromCache<any[]>('upcoming_reservations');

    if (result.data) {
      setReservations(result.data);
      setCacheAge(result.relativeTime);

      // Mostrar advertencia si datos muy antiguos
      if (result.ageInHours > 24) {
        toast.warning(
          `Mostrando reservas de ${result.relativeTime}`,
          {
            description: 'Conéctate a internet para ver datos actualizados',
            duration: 5000,
          }
        );
      }
    } else {
      toast.error('No hay reservas en cache');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mis Reservas</h2>
        {cacheAge && (
          <span className="text-sm text-muted-foreground">
            Actualizado {cacheAge}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="bg-card p-3 rounded border">
            <p>Plaza: {reservation.spot_number}</p>
            <p>Fecha: {reservation.reservation_date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
