# Diseño Técnico - Modo Offline

## Resumen

Este documento describe el diseño técnico para implementar soporte de modo offline en RESERVEO. La solución se basa en una arquitectura modular que utiliza hooks personalizados de React, IndexedDB para almacenamiento local, y un sistema de detección de conectividad robusto. El diseño prioriza la experiencia del usuario con feedback visual claro y manejo gracioso de estados de conexión intermitente.

## Arquitectura General

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     Capa de Presentación                     │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │ OfflineIndicator │  │   Componentes de Usuario        │ │
│  │   Component      │  │  (Calendar, SpotSelection, etc) │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Capa de Lógica                          │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │ useOfflineMode   │  │   Hooks Existentes con          │ │
│  │     Hook         │  │   Soporte Offline               │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Capa de Servicios                         │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │OfflineStorage    │  │  ConnectionMonitor              │ │
│  │   Service        │  │      Service                    │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Capa de Almacenamiento                      │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │   IndexedDB      │  │      Supabase Client            │ │
│  │  (Cache Local)   │  │    (Servidor Remoto)            │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Modo Online**: 
   - Peticiones → Supabase → Respuesta → Cache en IndexedDB → UI
   
2. **Modo Offline**: 
   - Peticiones → IndexedDB → Respuesta desde Cache → UI
   - Acciones de escritura → Bloqueadas con mensaje de error

3. **Transición Online→Offline**:
   - Detector de conexión → Actualiza estado → UI muestra indicador → Hooks usan cache

4. **Transición Offline→Online**:
   - Detector de conexión → Valida servidor → Actualiza estado → UI oculta indicador

## Componentes Principales

### 1. Hook: useOfflineMode

**Ubicación**: `src/hooks/useOfflineMode.ts`

**Responsabilidades**:
- Detectar estado de conectividad en tiempo real
- Proporcionar API consistente para componentes
- Gestionar transiciones entre estados
- Implementar lógica de reintentos

**API Pública**:
```typescript
interface UseOfflineModeReturn {
  isOnline: boolean;           // Estado actual de conexión
  isOffline: boolean;          // Inverso de isOnline (conveniencia)
  lastSyncTime: Date | null;   // Última sincronización exitosa
  checkConnection: () => Promise<boolean>; // Verificación manual
}

export const useOfflineMode = (): UseOfflineModeReturn
```

**Implementación**:
- Usa `navigator.onLine` como indicador inicial
- Escucha eventos `online` y `offline` del navegador
- Valida conectividad real con ping a Supabase cada 30s
- Implementa debounce de 5s para evitar parpadeos
- Usa exponential backoff para reintentos (1s, 2s, 4s, 8s, 16s, 30s max)

**Lógica de Detección**:
```typescript
// Pseudo-código
const detectConnection = async () => {
  if (!navigator.onLine) return false;
  
  try {
    const response = await fetch(SUPABASE_URL + '/rest/v1/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### 2. Servicio: OfflineStorageService

**Ubicación**: `src/lib/offlineStorage.ts`

**Responsabilidades**:
- Gestionar IndexedDB para almacenamiento local
- Implementar estrategias de cache (TTL, límites de tamaño)
- Proporcionar API simple para lectura/escritura
- Limpiar datos expirados automáticamente

**Estructura de IndexedDB**:
```typescript
// Base de datos: reserveo_offline_cache
// Versión: 1

// Object Store: cached_data
interface CachedData {
  key: string;              // Identificador único (ej: "reservations_user123_2025-01")
  data: any;                // Datos serializados
  timestamp: number;        // Timestamp de guardado
  expiresAt: number;        // Timestamp de expiración
  dataType: string;         // Tipo de datos (reservations, spots, plates, etc)
  userId: string;           // Usuario propietario
  metadata?: Record<string, any>; // Metadatos adicionales
}

// Object Store: sync_metadata
interface SyncMetadata {
  key: string;              // Identificador único
  lastSync: number;         // Última sincronización exitosa
  syncCount: number;        // Contador de sincronizaciones
}
```

**API Pública**:
```typescript
class OfflineStorageService {
  // Inicializar base de datos
  async init(): Promise<void>
  
  // Guardar datos en cache
  async set(key: string, data: any, options?: CacheOptions): Promise<void>
  
  // Obtener datos del cache
  async get<T>(key: string): Promise<T | null>
  
  // Verificar si existe en cache y no ha expirado
  async has(key: string): Promise<boolean>
  
  // Eliminar entrada específica
  async delete(key: string): Promise<void>
  
  // Limpiar cache expirado
  async cleanup(): Promise<void>
  
  // Limpiar todo el cache
  async clear(): Promise<void>
  
  // Obtener tamaño total del cache
  async getSize(): Promise<number>
  
  // Registrar sincronización exitosa
  async recordSync(key: string): Promise<void>
  
  // Obtener última sincronización
  async getLastSync(key: string): Promise<Date | null>
}

interface CacheOptions {
  ttl?: number;             // Time to live en milisegundos (default: 7 días)
  dataType?: string;        // Tipo de datos
  userId?: string;          // Usuario propietario
  metadata?: Record<string, any>;
}
```

**Estrategia de Cache**:
- TTL por defecto: 7 días
- Límite de tamaño: 10 MB para usuarios, 5 MB para admins
- Limpieza automática al iniciar la app
- Prioridad FIFO cuando se alcanza el límite

### 3. Servicio: ConnectionMonitorService

**Ubicación**: `src/lib/connectionMonitor.ts`

**Responsabilidades**:
- Monitorear conexión continuamente
- Implementar lógica de reintentos inteligente
- Emitir eventos de cambio de estado
- Gestionar timers y cleanup

**API Pública**:
```typescript
class ConnectionMonitorService {
  // Iniciar monitoreo
  start(callback: (isOnline: boolean) => void): void
  
  // Detener monitoreo
  stop(): void
  
  // Verificar conexión inmediatamente
  async check(): Promise<boolean>
  
  // Obtener estado actual
  getStatus(): ConnectionStatus
}

interface ConnectionStatus {
  isOnline: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  nextCheckIn: number; // milisegundos
}
```

**Lógica de Reintentos**:
```typescript
// Exponential backoff con jitter
const delays = [1000, 2000, 4000, 8000, 16000, 30000];
const getNextDelay = (failureCount: number) => {
  const baseDelay = delays[Math.min(failureCount, delays.length - 1)];
  const jitter = Math.random() * 1000; // 0-1s de variación
  return baseDelay + jitter;
}
```

### 4. Componente: OfflineIndicator

**Ubicación**: `src/components/OfflineIndicator.tsx`

**Responsabilidades**:
- Mostrar estado de conexión visualmente
- Proporcionar detalles al hacer clic
- Animaciones suaves de transición
- Posicionamiento fijo no intrusivo

**Diseño Visual**:
```
┌─────────────────────────────────────┐
│  🔴 Sin conexión                    │  ← Modo offline (rojo)
│  Última sincronización: hace 5 min │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🟢 Conectado                       │  ← Modo online (verde, auto-oculta en 3s)
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';  // Posición vertical (default: top)
  autoHide?: boolean;            // Auto-ocultar cuando online (default: true)
  autoHideDelay?: number;        // Delay para auto-ocultar (default: 3000ms)
  showDetails?: boolean;         // Mostrar detalles al hacer clic (default: true)
}
```

**Estados Visuales**:
- **Offline**: Barra roja fija en la parte superior, siempre visible
- **Online (transición)**: Barra verde que se auto-oculta después de 3s
- **Detalles expandidos**: Modal con información de última sincronización

### 5. Hooks Mejorados con Soporte Offline

Los hooks existentes se modificarán para soportar modo offline:

#### useParkingCalendar (Modificado)

**Cambios**:
```typescript
export const useParkingCalendar = (userId: string) => {
  const { isOnline, lastSyncTime } = useOfflineMode();
  const storage = new OfflineStorageService();
  
  const loadReservations = async () => {
    const cacheKey = `reservations_${userId}_${format(currentMonth, 'yyyy-MM')}`;
    
    if (!isOnline) {
      // Modo offline: cargar desde cache
      const cached = await storage.get(cacheKey);
      if (cached) {
        setReservations(cached);
        setLoading(false);
        return;
      }
      toast.error("No hay datos en caché para este mes");
      setLoading(false);
      return;
    }
    
    // Modo online: cargar desde Supabase y cachear
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        // ... resto de la query
      
      if (error) throw error;
      
      setReservations(data || []);
      await storage.set(cacheKey, data, { 
        dataType: 'reservations',
        userId 
      });
      await storage.recordSync(cacheKey);
    } catch (error) {
      // Si falla online, intentar cache
      const cached = await storage.get(cacheKey);
      if (cached) {
        setReservations(cached);
        toast.warning("Mostrando datos en caché");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleReserve = async (date: Date) => {
    if (!isOnline) {
      toast.error("No puedes crear reservas sin conexión", {
        description: "Conéctate a internet para reservar plazas"
      });
      return;
    }
    // ... resto de la lógica
  };
  
  const handleCancel = async (reservationId: string) => {
    if (!isOnline) {
      toast.error("No puedes cancelar reservas sin conexión", {
        description: "Conéctate a internet para cancelar"
      });
      return;
    }
    // ... resto de la lógica
  };
  
  return {
    // ... resto del return
    isOnline,
    lastSyncTime
  };
};
```

#### useSpotSelection (Modificado)

**Cambios**:
```typescript
export const useSpotSelection = (state: LocationState | null) => {
  const { isOnline } = useOfflineMode();
  const storage = new OfflineStorageService();
  
  const loadSpotsForGroup = async (groupId: string, date: Date) => {
    const cacheKey = `spots_${groupId}_${format(date, 'yyyy-MM-dd')}`;
    
    if (!isOnline) {
      const cached = await storage.get(cacheKey);
      if (cached) {
        setSpots(cached);
        return;
      }
      toast.error("No hay datos de plazas en caché");
      return;
    }
    
    // Modo online: cargar y cachear
    // ... lógica existente + cache
  };
  
  const handleSpotClick = (spot: SpotWithStatus) => {
    if (!isOnline) {
      toast.error("No puedes seleccionar plazas sin conexión");
      return;
    }
    // ... resto de la lógica
  };
  
  return {
    // ... resto del return
    isOnline
  };
};
```

#### useLicensePlateManager (Modificado)

**Cambios similares**:
- Cargar placas desde cache cuando offline
- Bloquear `handleAddPlate` cuando offline
- Bloquear `handleDeletePlate` cuando offline

#### Hooks Admin (Modificados)

Todos los hooks en `src/hooks/admin/` seguirán el mismo patrón:
- Cache separado con prefijo `admin_`
- Límite de 5 MB para datos admin
- Bloqueo de todas las operaciones de escritura offline

## Modelos de Datos

### Cache Key Patterns

```typescript
// Reservas de usuario
`reservations_${userId}_${yearMonth}`
// Ejemplo: "reservations_abc123_2025-01"

// Plazas de un grupo en una fecha
`spots_${groupId}_${date}`
// Ejemplo: "spots_xyz789_2025-01-15"

// Placas de usuario
`plates_${userId}`
// Ejemplo: "plates_abc123"

// Grupos de parking
`groups_${userId}`
// Ejemplo: "groups_abc123"

// Configuración de reservas
`settings_reservation`
// Ejemplo: "settings_reservation"

// Datos admin - usuarios
`admin_users`
// Ejemplo: "admin_users"

// Datos admin - plazas
`admin_spots`
// Ejemplo: "admin_spots"
```

### Estructura de Datos Cacheados

```typescript
// Reservas
interface CachedReservation {
  id: string;
  user_id: string;
  spot_id: string;
  reservation_date: string;
  status: string;
  created_at: string;
}

// Plazas con estado
interface CachedSpotWithStatus {
  id: string;
  spot_number: string;
  position_x: number | null;
  position_y: number | null;
  is_accessible: boolean;
  has_charger: boolean;
  is_compact: boolean;
  is_active: boolean;
  visual_size: string;
  status: 'available' | 'occupied' | 'user_reserved' | 'inactive';
  group_id: string;
}

// Placas
interface CachedLicensePlate {
  id: string;
  user_id: string;
  plate_number: string;
  is_approved: boolean;
  requested_at: string;
  approved_at: string | null;
  requested_electric: boolean;
  approved_electric: boolean;
  requested_disability: boolean;
  approved_disability: boolean;
}
```

## Manejo de Errores

### Estrategia de Fallback

```typescript
// Patrón general para todas las operaciones de lectura
const loadData = async () => {
  const cacheKey = generateCacheKey();
  
  try {
    if (!isOnline) {
      // Offline: solo cache
      return await loadFromCache(cacheKey);
    }
    
    // Online: intentar servidor
    const data = await loadFromServer();
    await saveToCache(cacheKey, data);
    return data;
    
  } catch (error) {
    // Error en servidor: fallback a cache
    console.error("Server error, falling back to cache:", error);
    const cached = await loadFromCache(cacheKey);
    
    if (cached) {
      toast.warning("Mostrando datos en caché", {
        description: "No se pudo conectar al servidor"
      });
      return cached;
    }
    
    // Sin cache disponible
    toast.error("No hay datos disponibles");
    throw error;
  }
};
```

### Mensajes de Error Específicos

```typescript
const ERROR_MESSAGES = {
  OFFLINE_CREATE: {
    title: "No puedes crear reservas sin conexión",
    description: "Conéctate a internet para reservar plazas"
  },
  OFFLINE_UPDATE: {
    title: "No puedes modificar reservas sin conexión",
    description: "Conéctate a internet para editar"
  },
  OFFLINE_DELETE: {
    title: "No puedes cancelar reservas sin conexión",
    description: "Conéctate a internet para cancelar"
  },
  NO_CACHE: {
    title: "No hay datos disponibles offline",
    description: "Conéctate a internet para cargar los datos"
  },
  CACHE_EXPIRED: {
    title: "Los datos en caché han expirado",
    description: "Conéctate a internet para actualizar"
  }
};
```

## Estrategia de Testing

### Tests Unitarios

**useOfflineMode Hook**:
- Detecta cambios de conexión correctamente
- Implementa debounce de 5s
- Valida conectividad con servidor
- Maneja reintentos con exponential backoff

**OfflineStorageService**:
- Guarda y recupera datos correctamente
- Respeta TTL y expira datos
- Limpia cache cuando alcanza límite
- Calcula tamaño correctamente

**ConnectionMonitorService**:
- Emite eventos de cambio de estado
- Implementa reintentos correctamente
- Limpia timers al detener

### Tests de Integración

**Flujo de Reserva Offline**:
1. Usuario online carga calendario → datos se cachean
2. Usuario pierde conexión → indicador aparece
3. Usuario navega por calendario → datos desde cache
4. Usuario intenta reservar → mensaje de error
5. Usuario recupera conexión → indicador desaparece
6. Usuario reserva exitosamente

**Flujo de Cache Expiration**:
1. Datos cacheados hace 8 días
2. Usuario offline intenta cargar
3. Sistema detecta expiración
4. Muestra mensaje apropiado

### Tests E2E

**Escenario: Parking sin conexión**:
```gherkin
Given el usuario está en el parking sin conexión
When abre la app
Then ve el indicador de offline
And ve sus reservas del mes actual
And puede navegar por el calendario
But no puede crear nuevas reservas
```

## Consideraciones de Rendimiento

### Optimizaciones

1. **Lazy Loading de IndexedDB**:
   - Inicializar solo cuando se necesita
   - Mantener conexión abierta durante sesión

2. **Batch Operations**:
   - Agrupar múltiples escrituras en una transacción
   - Reducir overhead de IndexedDB

3. **Debouncing**:
   - Eventos de conexión: 5s
   - Verificaciones de servidor: 30s
   - Limpieza de cache: al iniciar app

4. **Selective Caching**:
   - Solo cachear datos del mes actual + 7 días
   - No cachear imágenes de floor plans (demasiado grandes)
   - Priorizar datos críticos (reservas, placas)

### Límites de Almacenamiento

```typescript
const STORAGE_LIMITS = {
  USER_DATA: 10 * 1024 * 1024,      // 10 MB
  ADMIN_DATA: 5 * 1024 * 1024,      // 5 MB
  TOTAL: 15 * 1024 * 1024,          // 15 MB
  WARNING_THRESHOLD: 0.8,            // 80% del límite
};
```

## Seguridad

### Consideraciones

1. **Datos Sensibles**:
   - No cachear tokens de autenticación
   - No cachear contraseñas
   - Cachear solo datos ya autorizados por RLS

2. **Validación**:
   - Validar integridad de datos cacheados
   - Verificar timestamps para evitar datos obsoletos
   - Limpiar cache al cerrar sesión

3. **Encriptación**:
   - IndexedDB no está encriptado por defecto
   - Considerar encriptación para datos muy sensibles
   - Confiar en seguridad del dispositivo

## Migración y Rollout

### Fase 1: Infraestructura (Semana 1)
- Implementar `OfflineStorageService`
- Implementar `ConnectionMonitorService`
- Implementar `useOfflineMode` hook
- Tests unitarios

### Fase 2: UI (Semana 2)
- Implementar `OfflineIndicator` component
- Integrar en layout principal
- Tests de componente

### Fase 3: Integración Hooks Usuario (Semana 3)
- Modificar `useParkingCalendar`
- Modificar `useSpotSelection`
- Modificar `useLicensePlateManager`
- Tests de integración

### Fase 4: Integración Hooks Admin (Semana 4)
- Modificar hooks en `src/hooks/admin/`
- Ajustar límites de cache
- Tests de integración

### Fase 5: Testing y Refinamiento (Semana 5)
- Tests E2E completos
- Pruebas de rendimiento
- Ajustes de UX
- Documentación

## Alternativas Consideradas

### Service Workers
**Pros**: Cache automático de assets, soporte PWA
**Contras**: Complejidad adicional, debugging difícil
**Decisión**: No usar en v1, considerar para v2

### LocalStorage
**Pros**: API simple, amplio soporte
**Contras**: Límite de 5-10 MB, síncrono (bloquea UI)
**Decisión**: No usar, IndexedDB es superior

### React Query con persistencia
**Pros**: Integración con TanStack Query existente
**Contras**: Requiere refactorizar todos los hooks
**Decisión**: No usar en v1, considerar para v2

## Métricas de Éxito

1. **Funcionalidad**:
   - 100% de vistas de solo lectura funcionan offline
   - 0% de operaciones de escritura permitidas offline
   - Detección de conexión en <1s

2. **Rendimiento**:
   - Carga desde cache en <2s
   - Tamaño de cache <10 MB para usuarios
   - Sin impacto en rendimiento online

3. **UX**:
   - Indicador visible en <1s al perder conexión
   - Mensajes de error claros y accionables
   - Sin parpadeos en conexiones intermitentes

## Referencias

- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Network Information API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Offline First Design Patterns](https://offlinefirst.org/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
