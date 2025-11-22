# Sistema de Timestamps y Validación de Antigüedad - Offline Cache

## Resumen

El sistema de cache offline ahora incluye validación automática de antigüedad de datos, mostrando advertencias al usuario cuando los datos en cache tienen más de 24 horas.

## Características Implementadas

### 1. Timestamps Automáticos

Todos los datos guardados en el cache incluyen automáticamente un timestamp:

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number; // Timestamp en milisegundos
}
```

### 2. Función `loadFromCache()`

Nueva función que carga datos del cache con información completa sobre su antigüedad:

```typescript
const result = await offlineCache.loadFromCache<Profile>('profile');

// Resultado incluye:
{
  data: Profile | null,           // Los datos o null si no existen
  timestamp: Date | null,          // Fecha de guardado
  isStale: boolean,                // true si > 24 horas
  ageInHours: number,              // Antigüedad en horas
  relativeTime: string             // "hace 2 horas"
}
```

### 3. Validación de Antigüedad

- **Datos recientes (< 24 horas)**: Se cargan normalmente sin advertencias
- **Datos obsoletos (24-168 horas)**: Se cargan pero se muestra advertencia al usuario
- **Datos muy antiguos (> 7 días)**: Se eliminan automáticamente del cache

### 4. Formato Relativo de Timestamps

Los timestamps se formatean automáticamente en español:

- "hace unos segundos"
- "hace 5 minutos"
- "hace 2 horas"
- "hace 3 días"

## Uso en Componentes

### Ejemplo Básico

```typescript
import { offlineCache } from '@/lib/offlineCache';
import { toast } from 'sonner';

const loadProfile = async () => {
  const result = await offlineCache.loadFromCache<Profile>('profile');

  if (!result.data) {
    toast.error('No hay datos de perfil en cache');
    return;
  }

  setProfile(result.data);

  // Mostrar advertencia si datos obsoletos
  if (result.isStale) {
    toast.warning(
      `Mostrando datos de ${result.relativeTime}. Conéctate para actualizar.`,
      { duration: 5000 }
    );
  }
};
```

### Ejemplo con Hook Personalizado

```typescript
export const useProfileWithCache = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadProfile = async () => {
    const result = await offlineCache.loadFromCache<Profile>('profile');

    if (result.data) {
      setProfile(result.data);
      setIsStale(result.isStale);
      setLastUpdate(result.relativeTime);

      if (result.isStale) {
        toast.warning(`Datos de ${result.relativeTime}. Conéctate para actualizar.`);
      }
    }
  };

  return { profile, isStale, lastUpdate, reload: loadProfile };
};
```

### Ejemplo en Calendario

```typescript
const loadReservations = async () => {
  const result = await offlineCache.loadFromCache<Reservation[]>('upcoming_reservations');

  if (result.data) {
    setReservations(result.data);

    // Mostrar info de antigüedad en UI
    if (result.ageInHours > 24) {
      toast.warning(
        `Mostrando reservas de ${result.relativeTime}`,
        {
          description: 'Conéctate a internet para ver datos actualizados',
          duration: 5000,
        }
      );
    }
  }
};
```

## Mostrar Información de Cache en UI

### Badge de Antigüedad

```tsx
{cacheAge && (
  <Badge variant="secondary" className="text-xs">
    Actualizado {cacheAge}
  </Badge>
)}
```

### Card de Información

```tsx
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
```

### Banner de Advertencia

```tsx
{isStale && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Datos desactualizados</AlertTitle>
    <AlertDescription>
      Los datos mostrados son de {lastUpdate}. Conéctate a internet para actualizar.
    </AlertDescription>
  </Alert>
)}
```

## Compatibilidad con Código Existente

La función `get()` existente sigue funcionando sin cambios:

```typescript
// Método antiguo (sigue funcionando)
const profile = await offlineCache.get<Profile>('profile');

// Método nuevo (con validación de antigüedad)
const result = await offlineCache.loadFromCache<Profile>('profile');
const profile = result.data;
```

## Funciones Auxiliares

### `getTimestamp(key: string)`

Obtiene solo el timestamp de un dato sin cargarlo:

```typescript
const timestamp = await offlineCache.getTimestamp('profile');
if (timestamp) {
  console.log(`Datos guardados el: ${timestamp.toLocaleString()}`);
}
```

## Reglas de Negocio

### Límites de Antigüedad

- **24 horas**: Umbral para mostrar advertencia (datos obsoletos)
- **7 días**: Límite máximo, después se eliminan automáticamente

### Limpieza Automática

El sistema limpia automáticamente:

1. **Al guardar nuevos datos**: Si el cache está casi lleno (>10MB)
2. **Al cargar datos**: Si tienen más de 7 días
3. **Manualmente**: Con `cleanOldData()`

### Priorización de Datos

Cuando el cache está lleno, se eliminan primero:

1. Datos más antiguos (> 7 días)
2. Datos menos usados
3. Datos de menor prioridad (mapas antes que perfil)

## Mejores Prácticas

### 1. Siempre Usar `loadFromCache()` para Datos Críticos

```typescript
// ✅ CORRECTO - Valida antigüedad
const result = await offlineCache.loadFromCache('profile');
if (result.isStale) {
  toast.warning(`Datos de ${result.relativeTime}`);
}

// ❌ INCORRECTO - No valida antigüedad
const profile = await offlineCache.get('profile');
```

### 2. Mostrar Timestamp en UI

```typescript
// ✅ CORRECTO - Usuario sabe cuándo se actualizaron los datos
<span className="text-sm text-muted-foreground">
  Actualizado {result.relativeTime}
</span>

// ❌ INCORRECTO - Usuario no sabe si datos están actualizados
<span>Datos cargados</span>
```

### 3. Advertencias Específicas por Tipo de Dato

```typescript
// ✅ CORRECTO - Mensaje específico según tipo de dato
if (result.isStale) {
  if (dataType === 'reservations') {
    toast.warning('Reservas desactualizadas. Conéctate para ver cambios recientes.');
  } else if (dataType === 'profile') {
    toast.warning('Perfil desactualizado. Algunos datos pueden haber cambiado.');
  }
}

// ❌ INCORRECTO - Mensaje genérico
if (result.isStale) {
  toast.warning('Datos antiguos');
}
```

### 4. Recargar Datos Cuando Sea Posible

```typescript
// ✅ CORRECTO - Intenta recargar si hay conexión
const result = await offlineCache.loadFromCache('profile');
if (result.isStale && isOnline) {
  // Recargar datos frescos en background
  preloadData();
}

// ❌ INCORRECTO - Nunca intenta actualizar
const result = await offlineCache.loadFromCache('profile');
setProfile(result.data);
```

## Requisitos Cumplidos

- ✅ **Requisito 1.5**: Datos con timestamp de última actualización
- ✅ **Requisito 2.5**: Advertencia si datos tienen más de 24 horas
- ✅ **Problema 5**: Soluciona problema de datos obsoletos

## Referencias

- Implementación: `src/lib/offlineCache.ts`
- Ejemplos: `src/hooks/useOfflineMode.example.loadFromCache.tsx`
- Tests: `src/lib/__tests__/offlineCache.timestamp.test.ts`
- Diseño: `.kiro/specs/04-modo-offline-mejorado/design.md`
