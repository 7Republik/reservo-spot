# Diseño Técnico - Modo Offline

## Resumen

Este documento describe el diseño técnico para implementar soporte de modo offline en RESERVEO. La solución se basa en una arquitectura modular que utiliza hooks personalizados de React, IndexedDB para almacenamiento local, y un sistema de detección de conectividad robusto. El diseño prioriza la experiencia del usuario con feedback visual claro y manejo gracioso de estados de conexión intermitente.

## Contexto Actual del Sistema (Noviembre 2024)

**Funcionalidades Implementadas Recientemente**:
- ✅ **Sistema de Check-in/Check-out**: Control de asistencia con validación de horarios
- ✅ **Estados de reserva**: `active`, `cancelled`, `completed` (después de check-out)
- ✅ **Sistema de amonestaciones**: Tracking de infracciones con bloqueo temporal
- ✅ **Validación de usuarios bloqueados**: Previene check-in y reservas de usuarios bloqueados
- ✅ **Componente WarningCounter**: Visualización de amonestaciones en perfil

**Impacto en Modo Offline**:
- Las reservas `completed` no deben aparecer en el calendario offline
- El sistema de check-in/check-out requiere conexión (no se implementará offline)
- La validación de usuarios bloqueados debe considerarse en el cache
- El contador de amonestaciones puede mostrarse desde cache

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
  retryCount: number;          // Número de reintentos actuales
  consecutiveFailures: number; // Fallos consecutivos de conectividad
}

export const useOfflineMode = (): UseOfflineModeReturn
```

**Implementación**:
- Usa `navigator.onLine` como indicador inicial
- Escucha eventos `online` y `offline` del navegador
- Valida conectividad real con ping a Supabase cada 30s
- Implementa debounce de 5s para evitar parpadeos en conexiones intermitentes
- Usa exponential backoff para reintentos (1s, 2s, 4s, 8s, 16s, 30s max)
- Realiza 2 reintentos automáticos antes de entrar en modo offline
- Requiere 3 fallos consecutivos de conectividad para confirmar estado offline
- Valida conectividad con servidor antes de salir del modo offline

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

// Lógica de reintentos con validación de servidor
const validateServerConnectivity = async () => {
  let consecutiveFailures = 0;
  const maxFailures = 3;
  
  while (consecutiveFailures < maxFailures) {
    const isConnected = await detectConnection();
    if (isConnected) {
      return true;
    }
    consecutiveFailures++;
    await delay(getNextDelay(consecutiveFailures));
  }
  
  return false; // Entrar en modo offline después de 3 fallos
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
const MAX_RETRIES = 2; // Reintentar 2 veces antes de fallar
const MAX_CONSECUTIVE_FAILURES = 3; // 3 fallos consecutivos para entrar en offline

const getNextDelay = (failureCount: number) => {
  const baseDelay = delays[Math.min(failureCount, delays.length - 1)];
  const jitter = Math.random() * 1000; // 0-1s de variación
  return baseDelay + jitter;
}

// Lógica de reintentos para requests
const retryRequest = async (requestFn: () => Promise<any>, maxRetries = MAX_RETRIES) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await delay(getNextDelay(attempt));
      }
    }
  }
  
  throw lastError; // Falló después de todos los reintentos
}
```

### 4. Componente: DisabledControlTooltip

**Ubicación**: `src/components/DisabledControlTooltip.tsx`

**Responsabilidades**:
- Mostrar tooltip explicativo en controles deshabilitados
- Indicar que se requiere conexión a internet
- Proporcionar feedback visual claro

**Props**:
```typescript
interface DisabledControlTooltipProps {
  children: React.ReactNode;
  isDisabled: boolean;
  message?: string;
}
```

**Uso**:
```tsx
<DisabledControlTooltip 
  isDisabled={!isOnline}
  message="Requiere conexión a internet"
>
  <Button 
    disabled={!isOnline}
    onClick={handleReserve}
  >
    Reservar
  </Button>
</DisabledControlTooltip>
```

**Decisión de Diseño**: Este componente cumple con el Requisito 5.4, proporcionando tooltips explicativos que ayudan al usuario a entender por qué ciertos controles están deshabilitados.

### 5. Componente: OfflineIndicator

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
- **Detalles expandidos**: Modal con información de última sincronización y estado de conectividad
- **Conexión intermitente (<5s)**: No muestra indicador para evitar parpadeos molestos

**Decisión de Diseño**: El debounce de 5 segundos previene que el indicador aparezca y desaparezca rápidamente durante conexiones inestables, mejorando la experiencia del usuario según el Requisito 10.1.

### 6. Hooks Mejorados con Soporte Offline

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
        .eq("user_id", userId)
        .eq("status", "active") // IMPORTANTE: Solo cachear reservas activas
        .gte("reservation_date", format(start, "yyyy-MM-dd"))
        .lte("reservation_date", format(end, "yyyy-MM-dd"));
      
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
      toast.error(ERROR_MESSAGES.OFFLINE_CREATE.title, {
        description: ERROR_MESSAGES.OFFLINE_CREATE.description
      });
      return;
    }
    // ... resto de la lógica
  };
  
  // Deshabilitar botones cuando offline
  const isReserveDisabled = !isOnline;
  
  const handleCancel = async (reservationId: string) => {
    if (!isOnline) {
      toast.error(ERROR_MESSAGES.OFFLINE_DELETE.title, {
        description: ERROR_MESSAGES.OFFLINE_DELETE.description
      });
      return;
    }
    // ... resto de la lógica
  };
  
  // Deshabilitar botones de cancelación cuando offline
  const isCancelDisabled = !isOnline;
  
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
- Límite de 5 MB para datos admin (Requisito 9.5)
- Bloqueo de todas las operaciones de escritura offline (Requisito 9.3)
- Advertencia al acceder al panel admin offline (Requisito 9.4)

**Ejemplo - useUserManagement**:
```typescript
export const useUserManagement = () => {
  const { isOnline } = useOfflineMode();
  const storage = new OfflineStorageService();
  
  const loadUsers = async () => {
    const cacheKey = 'admin_users';
    
    if (!isOnline) {
      const cached = await storage.get(cacheKey);
      if (cached) {
        setUsers(cached);
        // Mostrar advertencia (Requisito 9.4)
        toast.warning(ERROR_MESSAGES.ADMIN_LIMITED.title, {
          description: ERROR_MESSAGES.ADMIN_LIMITED.description
        });
        return;
      }
      toast.error("No hay datos de usuarios en caché");
      return;
    }
    
    // Modo online: cargar y cachear
    const { data, error } = await supabase
      .from("profiles")
      .select("*");
    
    if (error) throw error;
    
    setUsers(data);
    await storage.set(cacheKey, data, { 
      dataType: 'admin_users',
      userId: 'admin' 
    });
  };
  
  const blockUser = async (userId: string) => {
    if (!isOnline) {
      toast.error(ERROR_MESSAGES.ADMIN_LIMITED.title, {
        description: "No puedes bloquear usuarios sin conexión"
      });
      return;
    }
    // ... resto de la lógica
  };
  
  return {
    users,
    loadUsers,
    blockUser,
    isOnline,
    canModify: isOnline // Indicador para deshabilitar controles
  };
};
```

**Decisión de Diseño**: Los hooks admin mantienen la misma estructura que los hooks de usuario pero con límites de cache más restrictivos (5 MB vs 10 MB) y advertencias específicas para funcionalidad limitada, cumpliendo con los Requisitos 9.1-9.5.

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
// Reservas (solo status='active')
interface CachedReservation {
  id: string;
  user_id: string;
  spot_id: string;
  reservation_date: string;
  status: 'active'; // Solo cachear reservas activas
  created_at: string;
  cancelled_at?: string | null; // No relevante para cache (solo active)
}

// Estado de usuario (para validación offline)
interface CachedUserStatus {
  user_id: string;
  is_blocked: boolean;
  is_deactivated: boolean;
  warning_count: number;
  blocked_until?: string | null;
  last_updated: string;
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

## Manejo de Conexiones Intermitentes

### Estrategia para Conexiones Inestables

**Problema**: En áreas de parking, la conectividad puede ser intermitente con pérdidas breves de señal que no justifican mostrar el indicador offline.

**Solución**: Implementar un sistema de detección inteligente que diferencia entre:
- **Pérdida breve (<5s)**: No mostrar indicador, mantener estado online
- **Pérdida prolongada (≥5s)**: Mostrar indicador, entrar en modo offline

**Implementación**:

```typescript
class ConnectionMonitor {
  private offlineTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 5000; // 5 segundos
  
  handleOfflineEvent() {
    // No entrar en modo offline inmediatamente
    this.offlineTimer = setTimeout(() => {
      this.enterOfflineMode();
    }, this.DEBOUNCE_DELAY);
  }
  
  handleOnlineEvent() {
    // Cancelar timer si vuelve la conexión
    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
      this.offlineTimer = null;
    }
    
    // Validar conectividad real con servidor antes de confirmar
    this.validateServerConnectivity().then(isConnected => {
      if (isConnected) {
        this.exitOfflineMode();
      }
    });
  }
}
```

**Validación de Servidor**:

Según el Requisito 3.5, si el navegador reporta "online" pero el servidor no responde, mantener modo offline:

```typescript
async validateServerConnectivity(): Promise<boolean> {
  let failures = 0;
  const MAX_FAILURES = 3; // Requisito 10.5
  
  while (failures < MAX_FAILURES) {
    try {
      const response = await fetch(SUPABASE_URL + '/rest/v1/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        return true; // Servidor responde correctamente
      }
    } catch (error) {
      failures++;
      if (failures < MAX_FAILURES) {
        await delay(getNextDelay(failures));
      }
    }
  }
  
  return false; // 3 fallos consecutivos = offline
}
```

**Decisión de Diseño**: Esta estrategia cumple con los Requisitos 10.1, 10.3, 10.4 y 10.5, proporcionando una experiencia fluida que no interrumpe al usuario con notificaciones innecesarias durante conexiones inestables temporales.

### Sincronización al Recuperar Conexión

Según el Requisito 3.3, cuando se recupera la conexión, el sistema debe intentar una operación de sincronización dentro de 3 segundos:

```typescript
async handleConnectionRestored() {
  // Validar que realmente hay conexión al servidor
  const isConnected = await this.validateServerConnectivity();
  
  if (!isConnected) {
    return; // Mantener modo offline
  }
  
  // Conexión confirmada - iniciar sincronización
  setTimeout(async () => {
    try {
      // Refrescar datos críticos desde el servidor
      await this.syncCriticalData();
      
      // Re-habilitar controles (Requisito 5.5)
      this.enableControls();
      
      // Notificar al usuario
      toast.success("Conexión restaurada", {
        description: "Datos sincronizados correctamente"
      });
    } catch (error) {
      console.error("Sync failed:", error);
      toast.warning("Conexión restaurada", {
        description: "Algunos datos pueden no estar actualizados"
      });
    }
  }, 3000); // Máximo 3 segundos según Requisito 3.3
}

async syncCriticalData() {
  // Sincronizar datos en orden de prioridad
  await Promise.allSettled([
    this.syncReservations(),
    this.syncLicensePlates(),
    this.syncParkingGroups()
  ]);
}
```

**Decisión de Diseño**: La sincronización se realiza en segundo plano sin bloquear la UI, priorizando datos críticos (reservas, placas) sobre datos secundarios. Esto cumple con el Requisito 3.3 mientras mantiene la aplicación responsive.

## Manejo de Errores

### Estrategia de Fallback

```typescript
// Patrón general para todas las operaciones de lectura
const loadData = async () => {
  const cacheKey = generateCacheKey();
  
  try {
    if (!isOnline) {
      // Offline: solo cache
      const cached = await loadFromCache(cacheKey);
      if (!cached) {
        toast.error("No hay datos disponibles offline", {
          description: "Conéctate a internet para cargar los datos"
        });
        throw new Error("No cached data available");
      }
      return cached;
    }
    
    // Online: intentar servidor con reintentos automáticos
    const data = await retryRequest(
      () => loadFromServer(),
      MAX_RETRIES // 2 reintentos según Requisito 10.2
    );
    await saveToCache(cacheKey, data);
    return data;
    
  } catch (error) {
    // Error en servidor después de reintentos: fallback a cache
    console.error("Server error after retries, falling back to cache:", error);
    const cached = await loadFromCache(cacheKey);
    
    if (cached) {
      toast.warning("Mostrando datos en caché", {
        description: "No se pudo conectar al servidor"
      });
      return cached;
    }
    
    // Sin cache disponible
    toast.error("No hay datos disponibles", {
      description: "Conéctate a internet para cargar los datos"
    });
    throw error;
  }
};
```

**Decisión de Diseño**: La estrategia de fallback implementa reintentos automáticos (Requisito 10.2) antes de recurrir al cache, maximizando las posibilidades de obtener datos frescos del servidor mientras mantiene una experiencia fluida para el usuario.

### Mensajes de Error Específicos

```typescript
const ERROR_MESSAGES = {
  OFFLINE_CREATE: {
    title: "No puedes crear reservas sin conexión",
    description: "Conéctate a internet para reservar plazas",
    status: "offline" // Incluye estado de conectividad (Requisito 7.5)
  },
  OFFLINE_UPDATE: {
    title: "No puedes modificar reservas sin conexión",
    description: "Conéctate a internet para editar",
    status: "offline"
  },
  OFFLINE_DELETE: {
    title: "No puedes cancelar reservas sin conexión",
    description: "Conéctate a internet para cancelar",
    status: "offline"
  },
  OFFLINE_LICENSE_PLATE: {
    title: "No puedes gestionar placas sin conexión",
    description: "Conéctate a internet para añadir o eliminar placas",
    status: "offline"
  },
  NO_CACHE: {
    title: "No hay datos disponibles offline",
    description: "Conéctate a internet para cargar los datos",
    status: "offline"
  },
  CACHE_EXPIRED: {
    title: "Los datos en caché han expirado",
    description: "Conéctate a internet para actualizar",
    status: "offline"
  },
  ADMIN_LIMITED: {
    title: "Funcionalidad limitada sin conexión",
    description: "Solo puedes ver datos. Conéctate para realizar cambios.",
    status: "offline"
  }
};

// Tiempo de respuesta para mensajes de error: <500ms (Requisitos 7.1, 7.2, 7.3)
const SHOW_ERROR_TIMEOUT = 500;
```

**Decisión de Diseño**: Todos los mensajes de error incluyen el estado de conectividad actual (Requisito 7.5) y se muestran en menos de 500ms (Requisitos 7.1-7.3) para proporcionar feedback inmediato al usuario.

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

3. **Debouncing y Timing**:
   - Eventos de conexión: 5s (Requisito 10.1 - evitar parpadeos)
   - Verificaciones de servidor: 30s (Requisito 3.4)
   - Limpieza de cache: al iniciar app
   - Actualización de indicador: <1s (Requisitos 2.1, 3.2)
   - Carga desde cache: <2s (Requisitos 1.3, 5.5)
   - Mensajes de error: <500ms (Requisitos 7.1-7.3)

4. **Selective Caching**:
   - Solo cachear datos del mes actual + 7 días (Requisito 6.4)
   - No cachear imágenes de floor plans (demasiado grandes)
   - Priorizar datos críticos (reservas, placas, grupos)
   - Límite total: 10 MB usuarios, 5 MB admins (Requisitos 6.5, 9.5)

**Decisión de Diseño**: Los tiempos de respuesta están optimizados según los requisitos específicos para garantizar una experiencia fluida. El debounce de 5s previene parpadeos molestos mientras que las operaciones críticas responden en menos de 2 segundos.

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
   - 100% de vistas de solo lectura funcionan offline (Requisitos 4.1-4.5)
   - 0% de operaciones de escritura permitidas offline (Requisitos 5.1-5.3)
   - Detección de conexión en <1s (Requisitos 2.1, 3.2)
   - 2 reintentos automáticos antes de fallar (Requisito 10.2)
   - 3 fallos consecutivos para entrar en modo offline (Requisito 10.5)

2. **Rendimiento**:
   - Carga desde cache en <2s (Requisitos 1.3, 5.5)
   - Mensajes de error en <500ms (Requisitos 7.1-7.3)
   - Tamaño de cache <10 MB para usuarios, <5 MB para admins (Requisitos 6.5, 9.5)
   - Sin impacto en rendimiento online
   - Verificación de servidor cada 30s (Requisito 3.4)

3. **UX**:
   - Indicador visible en <1s al perder conexión (Requisito 2.1)
   - Indicador se oculta automáticamente en 3s al reconectar (diseño)
   - Mensajes de error claros y accionables (Requisitos 7.4, 7.5)
   - Sin parpadeos en conexiones intermitentes <5s (Requisito 10.1)
   - Tooltips explicativos en controles deshabilitados (Requisito 5.4)
   - Controles re-habilitados en <2s al reconectar (Requisito 5.5)

4. **Modularidad**:
   - Hook dedicado para detección offline (Requisito 8.1)
   - Servicio dedicado para cache (Requisito 8.2)
   - Componente standalone para indicador (Requisito 8.3)
   - API consistente y reutilizable (Requisitos 8.4, 8.5)

## Resumen de Decisiones de Diseño Clave

### 1. Detección de Conexión Inteligente
**Decisión**: Implementar debounce de 5 segundos + validación de servidor + 3 fallos consecutivos.

**Razón**: Previene parpadeos molestos en conexiones inestables (Requisito 10.1) mientras asegura que el modo offline solo se activa cuando realmente no hay conectividad (Requisitos 3.5, 10.5).

**Trade-off**: Puede haber un retraso de hasta 5 segundos antes de mostrar el indicador offline, pero esto mejora significativamente la experiencia del usuario en áreas con señal intermitente.

### 2. Reintentos Automáticos
**Decisión**: 2 reintentos con exponential backoff antes de fallar.

**Razón**: Maximiza las posibilidades de éxito en conexiones inestables (Requisito 10.2) sin bloquear la UI por demasiado tiempo.

**Trade-off**: Las operaciones pueden tardar más en fallar, pero aumenta la tasa de éxito en condiciones de red subóptimas.

### 3. Cache Selectivo
**Decisión**: Solo cachear datos del mes actual + 7 días, máximo 10 MB usuarios / 5 MB admins.

**Razón**: Balance entre disponibilidad offline y uso de almacenamiento (Requisitos 6.4, 6.5, 9.5). Los usuarios raramente necesitan datos más antiguos en el parking.

**Trade-off**: Datos históricos no disponibles offline, pero esto es aceptable dado el caso de uso principal (verificar reserva actual).

### 4. Sin Sync Queue (Decisión Arquitectónica)
**Decisión**: Bloquear todas las operaciones de escritura offline en lugar de implementar un sistema de cola de sincronización.

**Nota**: Aunque el glosario de requisitos menciona "Sync Queue", el análisis de los requisitos específicos (5.1-5.3) indica que todas las operaciones de escritura deben estar deshabilitadas offline, no encoladas.

**Razón**: Simplifica la implementación y evita conflictos de datos (Requisitos 5.1-5.3). El caso de uso principal es consulta, no modificación. Los usuarios están en el parking para verificar su reserva existente, no para crear nuevas.

**Trade-off**: Los usuarios no pueden crear reservas offline, pero esto es preferible a crear conflictos de datos o reservas duplicadas. La alternativa (sync queue) añadiría complejidad significativa sin beneficio real para el caso de uso principal.

### 8. Sistema de Check-in/Check-out No Disponible Offline
**Decisión**: El sistema de check-in/check-out requiere conexión a internet y no estará disponible offline.

**Razón**: 
- El check-in/check-out requiere validación en tiempo real (horarios, infracciones, bloqueos)
- Las penalizaciones y amonestaciones deben registrarse inmediatamente
- El sistema de notificaciones depende de conectividad
- Los cron jobs de validación automática requieren servidor

**Implementación**: 
- Los botones de check-in/check-out se deshabilitarán cuando offline
- Se mostrará tooltip explicativo: "Requiere conexión para validar horarios"
- El componente `TodayCheckinCard` detectará el estado offline y mostrará mensaje apropiado

**Trade-off**: Los usuarios no podrán hacer check-in/check-out sin conexión, pero esto es aceptable ya que:
1. El check-in debe hacerse al llegar (normalmente hay conexión)
2. Las validaciones de horario requieren timestamp preciso del servidor
3. Las infracciones deben registrarse inmediatamente para ser justas

### 5. Sincronización Proactiva
**Decisión**: Sincronizar datos críticos automáticamente al recuperar conexión (dentro de 3s).

**Razón**: Asegura que los usuarios tengan datos frescos lo antes posible (Requisito 3.3) sin requerir acción manual.

**Trade-off**: Consume ancho de banda al reconectar, pero mejora la experiencia del usuario.

### 6. Tooltips en Controles Deshabilitados
**Decisión**: Componente wrapper para mostrar tooltips explicativos.

**Razón**: Proporciona feedback claro sobre por qué los controles están deshabilitados (Requisito 5.4), mejorando la comprensión del usuario.

**Trade-off**: Requiere envolver componentes existentes, pero el beneficio en UX lo justifica.

### 7. Arquitectura Modular
**Decisión**: Separar en hook, servicios y componentes independientes.

**Razón**: Facilita mantenimiento, testing y reutilización (Requisito 8). Permite evolucionar cada parte independientemente.

**Trade-off**: Más archivos y complejidad inicial, pero mejor mantenibilidad a largo plazo.

## Referencias

- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Network Information API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Offline First Design Patterns](https://offlinefirst.org/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [React Query Offline Support](https://tanstack.com/query/latest/docs/react/guides/offline)
