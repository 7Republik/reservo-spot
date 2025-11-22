# Diseño Técnico - Modo Offline Mejorado

## Resumen

Este diseño implementa un sistema de modo offline **simple, robusto y funcional** para RESERVEO. A diferencia de la implementación anterior, este enfoque prioriza:

1. **Precarga proactiva** - Cachear datos críticos automáticamente
2. **Simplicidad** - Un hook, un servicio, código mínimo
3. **Robustez** - Sin errores técnicos, siempre datos o vacío
4. **Acciones offline** - Check-in/out/cancelación con sincronización posterior

**Objetivo:** <500 líneas de código total, experiencia sin errores.

## Arquitectura Simplificada

```
┌─────────────────────────────────────────┐
│         Componentes de Usuario          │
│  (Dashboard, Perfil, Calendario, etc)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         useOfflineMode Hook             │
│  - Estado: isOnline, lastSync           │
│  - Acciones: preload, sync, queue       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         OfflineCache Service            │
│  - IndexedDB wrapper simple             │
│  - get(), set(), clear()                │
└─────────────────────────────────────────┘
```

**Principio clave:** Mantenerlo simple. Un hook gestiona todo el estado, un servicio gestiona el almacenamiento.

## Componentes Principales

### 1. Hook: useOfflineMode

**Ubicación:** `src/hooks/useOfflineMode.ts`

**Responsabilidad única:** Gestionar TODO el estado offline de la aplicación.


**API Pública:**

```typescript
interface UseOfflineModeReturn {
  // Estado
  isOnline: boolean;
  lastSync: Date | null;
  pendingActions: number;
  
  // Funciones
  preloadData: () => Promise<void>;
  queueAction: (action: OfflineAction) => void;
  syncPendingActions: () => Promise<void>;
}

interface OfflineAction {
  type: 'checkin' | 'checkout' | 'cancel_reservation';
  data: any;
  timestamp: number;
}

export const useOfflineMode = (): UseOfflineModeReturn
```

**Implementación simplificada:**

```typescript
export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingActions, setPendingActions] = useState(0);
  
  // Detectar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setTimeout(() => {
        setIsOnline(true);
        syncPendingActions();
      }, 5000); // Debounce 5s
    };
    
    const handleOffline = () => {
      setTimeout(() => setIsOnline(false), 5000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Precargar datos al montar
  useEffect(() => {
    if (isOnline) {
      preloadData();
    }
  }, [isOnline]);
  
  const preloadData = async () => {
    // Implementación en siguiente sección
  };
  
  const queueAction = (action: OfflineAction) => {
    // Implementación en siguiente sección
  };
  
  const syncPendingActions = async () => {
    // Implementación en siguiente sección
  };
  
  return { isOnline, lastSync, pendingActions, preloadData, queueAction, syncPendingActions };
};
```


### 2. Servicio: OfflineCache

**Ubicación:** `src/lib/offlineCache.ts`

**Responsabilidad única:** Wrapper simple de IndexedDB.

**API Pública:**

```typescript
class OfflineCache {
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    // Abrir IndexedDB
  }
  
  async set(key: string, data: any): Promise<void> {
    // Guardar en IndexedDB
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Obtener de IndexedDB, retornar null si no existe
  }
  
  async clear(): Promise<void> {
    // Limpiar todo
  }
  
  async remove(key: string): Promise<void> {
    // Eliminar entrada específica
  }
}

export const offlineCache = new OfflineCache();
```

**Implementación:**

```typescript
class OfflineCache {
  private dbName = 'reserveo_offline';
  private storeName = 'cache';
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }
  
  async set(key: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineCache = new OfflineCache();
```

**Total:** ~80 líneas de código.


## Precarga de Datos

### Estrategia de Precarga

**Cuándo:** Al iniciar sesión y al abrir la app.

**Qué precargar:**
1. Perfil del usuario
2. Matrículas aprobadas
3. Grupos de parking
4. Reserva del día actual
5. Reservas próximos 7 días
6. Mapas de grupos con reservas activas

**Implementación en useOfflineMode:**

```typescript
const preloadData = async () => {
  if (!isOnline) return;
  
  try {
    const userId = supabase.auth.getUser().data.user?.id;
    if (!userId) return;
    
    // 1. Perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    await offlineCache.set('profile', profile);
    
    // 2. Matrículas
    const { data: plates } = await supabase
      .from('license_plates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_approved', true);
    await offlineCache.set('plates', plates || []);
    
    // 3. Grupos
    const { data: groups } = await supabase
      .from('parking_groups')
      .select('*')
      .eq('is_active', true);
    await offlineCache.set('groups', groups || []);
    
    // 4. Reserva del día
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: todayReservation } = await supabase
      .from('reservations')
      .select('*, parking_spots(*), parking_groups(*)')
      .eq('user_id', userId)
      .eq('reservation_date', today)
      .eq('status', 'active')
      .single();
    await offlineCache.set('today_reservation', todayReservation);
    
    // 5. Reservas próximos 7 días
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const { data: upcomingReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .gte('reservation_date', today)
      .lte('reservation_date', nextWeek)
      .eq('status', 'active');
    await offlineCache.set('upcoming_reservations', upcomingReservations || []);
    
    // 6. Mapas de grupos con reservas
    if (upcomingReservations && upcomingReservations.length > 0) {
      const groupIds = [...new Set(upcomingReservations.map(r => r.group_id))];
      for (const groupId of groupIds) {
        const { data: spots } = await supabase
          .from('parking_spots')
          .select('*')
          .eq('group_id', groupId)
          .eq('is_active', true);
        await offlineCache.set(`spots_${groupId}`, spots || []);
      }
    }
    
    setLastSync(new Date());
    await offlineCache.set('last_sync', new Date().toISOString());
    
  } catch (error) {
    console.error('Preload failed:', error);
    // No mostrar error al usuario, solo log
  }
};
```

**Total:** ~60 líneas de código.


## Acciones Offline con Sincronización

### Cola de Acciones Pendientes

**Estructura:**

```typescript
interface OfflineAction {
  id: string;
  type: 'checkin' | 'checkout' | 'cancel_reservation';
  data: any;
  timestamp: number;
}
```

**Implementación:**

```typescript
const queueAction = async (action: Omit<OfflineAction, 'id'>) => {
  const actionWithId: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
  };
  
  // Obtener cola actual
  const queue = await offlineCache.get<OfflineAction[]>('action_queue') || [];
  
  // Añadir nueva acción
  queue.push(actionWithId);
  
  // Guardar cola actualizada
  await offlineCache.set('action_queue', queue);
  
  setPendingActions(queue.length);
  
  // Si estamos online, sincronizar inmediatamente
  if (isOnline) {
    await syncPendingActions();
  }
};

const syncPendingActions = async () => {
  if (!isOnline) return;
  
  const queue = await offlineCache.get<OfflineAction[]>('action_queue') || [];
  if (queue.length === 0) return;
  
  const failedActions: OfflineAction[] = [];
  
  for (const action of queue) {
    try {
      switch (action.type) {
        case 'checkin':
          await supabase.rpc('perform_checkin', {
            reservation_id: action.data.reservationId,
            user_id: action.data.userId,
          });
          break;
          
        case 'checkout':
          await supabase.rpc('perform_checkout', {
            reservation_id: action.data.reservationId,
            user_id: action.data.userId,
          });
          break;
          
        case 'cancel_reservation':
          await supabase
            .from('reservations')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', action.data.reservationId);
          break;
      }
    } catch (error) {
      console.error(`Failed to sync action ${action.id}:`, error);
      failedActions.push(action);
    }
  }
  
  // Actualizar cola con acciones fallidas
  await offlineCache.set('action_queue', failedActions);
  setPendingActions(failedActions.length);
  
  if (failedActions.length === 0) {
    toast.success('Datos sincronizados correctamente');
    // Recargar datos frescos
    await preloadData();
  } else {
    toast.warning(`${failedActions.length} acciones no se pudieron sincronizar`);
  }
};
```

**Total:** ~60 líneas de código.


## Integración en Componentes

### Patrón de Uso en Hooks Existentes

**Ejemplo: useParkingCalendar**

```typescript
export const useParkingCalendar = (userId: string) => {
  const { isOnline } = useOfflineMode();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadReservations = async () => {
    try {
      if (!isOnline) {
        // Cargar desde cache
        const cached = await offlineCache.get('upcoming_reservations');
        setReservations(cached || []);
        setLoading(false);
        return;
      }
      
      // Cargar desde servidor
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (error) throw error;
      
      setReservations(data || []);
      await offlineCache.set('upcoming_reservations', data || []);
      
    } catch (error) {
      // Si falla online, intentar cache
      const cached = await offlineCache.get('upcoming_reservations');
      if (cached) {
        setReservations(cached);
        toast.warning('Mostrando datos en caché');
      } else {
        setReservations([]);
        toast.error('No hay datos disponibles');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return { reservations, loading, isOnline };
};
```

**Reglas simples:**
1. Si offline → cargar desde cache
2. Si online → cargar desde servidor y cachear
3. Si falla online → fallback a cache
4. Siempre retornar array/objeto, nunca null

**Total por hook:** ~15 líneas de código offline.


### Check-in Offline

**Ejemplo: TodayCheckinCard**

```typescript
export const TodayCheckinCard = () => {
  const { isOnline, queueAction } = useOfflineMode();
  const [reservation, setReservation] = useState(null);
  const [pendingCheckin, setPendingCheckin] = useState(false);
  
  const handleCheckin = async () => {
    if (!isOnline) {
      // Guardar acción offline
      await queueAction({
        type: 'checkin',
        data: {
          reservationId: reservation.id,
          userId: reservation.user_id,
        },
        timestamp: Date.now(),
      });
      
      setPendingCheckin(true);
      toast.success('Check-in guardado. Se sincronizará cuando tengas conexión.');
      return;
    }
    
    // Check-in online normal
    await supabase.rpc('perform_checkin', {
      reservation_id: reservation.id,
      user_id: reservation.user_id,
    });
    
    toast.success('Check-in realizado');
  };
  
  return (
    <Card>
      <Button onClick={handleCheckin}>
        {pendingCheckin ? 'Check-in pendiente ⏳' : 'Ya llegué'}
      </Button>
      {!isOnline && (
        <p className="text-sm text-muted-foreground">
          Se sincronizará cuando tengas conexión
        </p>
      )}
    </Card>
  );
};
```

**Total:** ~10 líneas de código offline.


## Componentes UI

### OfflineIndicator

**Ubicación:** `src/components/OfflineIndicator.tsx`

**Diseño:**

```typescript
export const OfflineIndicator = () => {
  const { isOnline, lastSync, pendingActions } = useOfflineMode();
  const [show, setShow] = useState(!isOnline);
  
  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Auto-ocultar después de 3s cuando vuelve conexión
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);
  
  if (!show) return null;
  
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm",
      isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
    )}>
      {isOnline ? (
        <span>✓ Conectado</span>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <span>⚠️ Sin conexión</span>
          {lastSync && (
            <span className="text-xs opacity-80">
              Última sincronización: {formatDistanceToNow(lastSync, { locale: es })}
            </span>
          )}
          {pendingActions > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
              {pendingActions} acciones pendientes
            </span>
          )}
        </div>
      )}
    </div>
  );
};
```

**Total:** ~30 líneas de código.


### AdminBlockScreen

**Ubicación:** `src/components/AdminBlockScreen.tsx`

**Diseño:**

```typescript
export const AdminBlockScreen = () => {
  const { isOnline } = useOfflineMode();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        <WifiOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">
          Panel Admin no disponible offline
        </h2>
        <p className="text-muted-foreground mb-6">
          El panel de administración requiere conexión a internet para funcionar correctamente.
        </p>
        
        {isOnline ? (
          <Button onClick={() => navigate('/admin')}>
            Reconectado - Acceder al Panel Admin
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        )}
      </Card>
    </div>
  );
};
```

**Uso en Router:**

```typescript
// En App.tsx o router
<Route path="/admin/*" element={
  isOnline ? <AdminLayout /> : <AdminBlockScreen />
} />
```

**Total:** ~20 líneas de código.


### IncidentOfflineModal

**Ubicación:** `src/components/IncidentOfflineModal.tsx`

**Diseño:**

```typescript
export const IncidentOfflineModal = ({ open, onClose }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar incidente sin conexión</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conexión requerida</AlertTitle>
            <AlertDescription>
              Para reasignarte una plaza en tiempo real, necesitamos conexión a internet.
            </AlertDescription>
          </Alert>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex gap-2 items-start">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  💡 Consejo
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Toma una foto ahora asegurándote de que se vea claramente la matrícula del vehículo intruso.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Cuando recuperes conexión, podrás reportar el incidente usando la foto de tu galería.
          </p>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Total:** ~30 líneas de código.


## Visualización de Ubicación Offline

### Mapa de Plaza Offline

**Estrategia:**
- Precargar datos de plazas del grupo con reserva
- Mostrar mapa desde cache
- Resaltar plaza reservada

**Implementación en SpotMap:**

```typescript
export const SpotMap = ({ groupId, spotId }: Props) => {
  const { isOnline } = useOfflineMode();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSpots();
  }, [groupId, isOnline]);
  
  const loadSpots = async () => {
    try {
      if (!isOnline) {
        // Cargar desde cache
        const cached = await offlineCache.get(`spots_${groupId}`);
        if (cached) {
          setSpots(cached);
        } else {
          toast.error('Mapa no disponible offline');
        }
        setLoading(false);
        return;
      }
      
      // Cargar desde servidor
      const { data, error } = await supabase
        .from('parking_spots')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      setSpots(data || []);
      await offlineCache.set(`spots_${groupId}`, data || []);
      
    } catch (error) {
      const cached = await offlineCache.get(`spots_${groupId}`);
      if (cached) {
        setSpots(cached);
        toast.warning('Mostrando mapa en caché');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Skeleton className="h-96" />;
  
  if (spots.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Mapa no disponible offline
      </div>
    );
  }
  
  return (
    <div className="relative">
      {!isOnline && (
        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
          Modo offline
        </div>
      )}
      
      {/* Renderizar mapa con plazas */}
      {spots.map(spot => (
        <SpotButton
          key={spot.id}
          spot={spot}
          isHighlighted={spot.id === spotId}
          disabled={!isOnline}
        />
      ))}
    </div>
  );
};
```

**Total:** ~20 líneas de código offline.


## Manejo de Errores

### Principio: Sin Errores Técnicos

**Reglas:**
1. Nunca retornar `null` o `undefined` - siempre array/objeto vacío
2. Nunca mostrar errores de red al usuario cuando offline
3. Interceptar todos los errores de fetch
4. Mostrar mensajes amigables

**Wrapper de Fetch:**

```typescript
export const safeFetch = async <T>(
  fetchFn: () => Promise<T>,
  cacheKey?: string
): Promise<T | null> => {
  const { isOnline } = useOfflineMode();
  
  try {
    if (!isOnline && cacheKey) {
      // Offline: cargar desde cache
      return await offlineCache.get<T>(cacheKey);
    }
    
    // Online: intentar fetch
    const data = await fetchFn();
    
    // Cachear si hay key
    if (cacheKey) {
      await offlineCache.set(cacheKey, data);
    }
    
    return data;
    
  } catch (error) {
    // Error online: intentar cache
    if (cacheKey) {
      const cached = await offlineCache.get<T>(cacheKey);
      if (cached) {
        toast.warning('Mostrando datos en caché');
        return cached;
      }
    }
    
    // Sin cache: retornar null (no error)
    console.error('Fetch failed:', error);
    return null;
  }
};
```

**Uso:**

```typescript
const loadData = async () => {
  const data = await safeFetch(
    () => supabase.from('table').select('*'),
    'cache_key'
  );
  
  setData(data || []); // Siempre array, nunca null
};
```

**Total:** ~30 líneas de código.


## Resumen de Implementación

### Archivos a Crear/Modificar

**Nuevos archivos (3):**
1. `src/hooks/useOfflineMode.ts` (~100 líneas)
2. `src/lib/offlineCache.ts` (~80 líneas)
3. `src/components/OfflineIndicator.tsx` (~30 líneas)
4. `src/components/AdminBlockScreen.tsx` (~20 líneas)
5. `src/components/IncidentOfflineModal.tsx` (~30 líneas)

**Modificar archivos existentes (~15 líneas cada uno):**
- `src/hooks/useParkingCalendar.ts`
- `src/hooks/useUserProfile.ts`
- `src/hooks/useLicensePlateManager.ts`
- `src/components/dashboard/TodayCheckinCard.tsx`
- `src/components/spot-selection/SpotMap.tsx`
- `src/App.tsx` (añadir OfflineIndicator y AdminBlockScreen)

**Total estimado:** ~400 líneas de código

### Ventajas de Este Diseño

✅ **Simple:** Un hook, un servicio, código mínimo
✅ **Robusto:** Sin errores técnicos, siempre datos o vacío
✅ **Funcional:** Check-in/out/cancelación offline con sincronización
✅ **Claro:** Mensajes específicos para cada función bloqueada
✅ **Mantenible:** Fácil de entender y extender

### Diferencias con Implementación Anterior

| Aspecto | Anterior | Nueva |
|---------|----------|-------|
| Líneas de código | ~2000 | ~400 |
| Servicios | 3 | 1 |
| Hooks | 2 | 1 |
| Precarga | Reactiva | Proactiva |
| Check-in offline | ❌ | ✅ |
| Cancelación offline | ❌ | ✅ |
| Panel admin | Cache 5MB | Bloqueado |
| Manejo errores | Parcial | Completo |


## Análisis de Puntos Frágiles y Soluciones

### 1. Problema: Precarga Puede Fallar Parcialmente

**Escenario:** Usuario tiene mala conexión, algunos datos se cargan pero otros no.

**Riesgo:** App queda en estado inconsistente.

**Solución:**

```typescript
const preloadData = async () => {
  const results = {
    profile: false,
    plates: false,
    groups: false,
    todayReservation: false,
    upcomingReservations: false,
    maps: false,
  };
  
  // Intentar cada carga independientemente
  try {
    const profile = await supabase.from('profiles').select('*').eq('id', userId).single();
    await offlineCache.set('profile', profile.data);
    results.profile = true;
  } catch (e) {
    console.error('Profile preload failed:', e);
  }
  
  try {
    const plates = await supabase.from('license_plates').select('*').eq('user_id', userId);
    await offlineCache.set('plates', plates.data || []);
    results.plates = true;
  } catch (e) {
    console.error('Plates preload failed:', e);
  }
  
  // ... resto de cargas independientes
  
  // Guardar qué se cargó exitosamente
  await offlineCache.set('preload_status', results);
  
  // Mostrar feedback al usuario
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  if (successCount === totalCount) {
    toast.success('Datos preparados para modo offline');
  } else if (successCount > 0) {
    toast.warning(`${successCount}/${totalCount} datos preparados. Algunos pueden no estar disponibles offline.`);
  } else {
    toast.error('No se pudieron preparar datos offline. Necesitarás conexión.');
  }
};
```

**Beneficio:** Usuario sabe exactamente qué funcionará offline.


### 2. Problema: Sincronización Puede Crear Conflictos

**Escenario:** Usuario hace check-in offline a las 9:00, pero su reserva fue cancelada por admin a las 8:50.

**Riesgo:** Sincronización falla o crea datos inconsistentes.

**Solución:**

```typescript
const syncPendingActions = async () => {
  const queue = await offlineCache.get<OfflineAction[]>('action_queue') || [];
  const failedActions: OfflineAction[] = [];
  const conflictActions: OfflineAction[] = [];
  
  for (const action of queue) {
    try {
      // Validar que la acción sigue siendo válida
      if (action.type === 'checkin' || action.type === 'checkout') {
        const { data: reservation } = await supabase
          .from('reservations')
          .select('status')
          .eq('id', action.data.reservationId)
          .single();
        
        if (!reservation || reservation.status !== 'active') {
          conflictActions.push(action);
          toast.error(`No se pudo hacer ${action.type}: la reserva ya no está activa`);
          continue;
        }
      }
      
      if (action.type === 'cancel_reservation') {
        const { data: reservation } = await supabase
          .from('reservations')
          .select('status')
          .eq('id', action.data.reservationId)
          .single();
        
        if (!reservation || reservation.status === 'cancelled') {
          conflictActions.push(action);
          toast.warning('La reserva ya estaba cancelada');
          continue;
        }
      }
      
      // Ejecutar acción si es válida
      await executeAction(action);
      
    } catch (error) {
      console.error(`Failed to sync action ${action.id}:`, error);
      failedActions.push(action);
    }
  }
  
  // Actualizar cola solo con acciones que fallaron (no conflictos)
  await offlineCache.set('action_queue', failedActions);
  setPendingActions(failedActions.length);
  
  // Feedback al usuario
  if (conflictActions.length > 0) {
    toast.warning(`${conflictActions.length} acciones no se pudieron aplicar por cambios en el servidor`);
  }
  
  if (failedActions.length === 0 && conflictActions.length === 0) {
    toast.success('Todas las acciones sincronizadas correctamente');
    await preloadData(); // Recargar datos frescos
  }
};
```

**Beneficio:** Detecta conflictos y los maneja gracefully sin romper la app.


### 3. Problema: IndexedDB Puede Estar Lleno o Bloqueado

**Escenario:** Usuario tiene poco espacio, IndexedDB falla al guardar.

**Riesgo:** Precarga falla silenciosamente, usuario cree que tiene datos offline pero no.

**Solución:**

```typescript
class OfflineCache {
  async set(key: string, data: any): Promise<boolean> {
    try {
      if (!this.db) await this.init();
      
      // Verificar tamaño antes de guardar
      const dataSize = new Blob([JSON.stringify(data)]).size;
      const currentSize = await this.getSize();
      const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
      
      if (currentSize + dataSize > MAX_SIZE) {
        console.warn('Cache full, cleaning old data...');
        await this.cleanOldData();
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data, key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error('Failed to save to cache:', request.error);
          resolve(false); // No rechazar, retornar false
        };
      });
      
    } catch (error) {
      console.error('Cache set error:', error);
      return false; // No romper la app
    }
  }
  
  async cleanOldData(): Promise<void> {
    // Eliminar datos más antiguos primero
    const keys = ['upcoming_reservations', 'spots_*', 'groups'];
    for (const key of keys) {
      try {
        await this.remove(key);
      } catch (e) {
        console.error('Failed to clean:', e);
      }
    }
  }
  
  async getSize(): Promise<number> {
    // Estimar tamaño del cache
    if (!this.db) await this.init();
    
    let totalSize = 0;
    const transaction = this.db!.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const request = store.getAllKeys();
    
    return new Promise((resolve) => {
      request.onsuccess = async () => {
        for (const key of request.result) {
          const data = await this.get(key as string);
          if (data) {
            totalSize += new Blob([JSON.stringify(data)]).size;
          }
        }
        resolve(totalSize);
      };
      request.onerror = () => resolve(0);
    });
  }
}
```

**Beneficio:** Maneja límites de espacio gracefully, limpia datos antiguos automáticamente.


### 4. Problema: Usuario Cambia de Pestaña Durante Precarga

**Escenario:** Usuario inicia sesión, precarga empieza, usuario navega a otra pestaña, precarga se interrumpe.

**Riesgo:** Datos parcialmente cargados, estado inconsistente.

**Solución:**

```typescript
const useOfflineMode = () => {
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'complete' | 'partial'>('idle');
  const preloadInProgress = useRef(false);
  
  const preloadData = async () => {
    // Evitar múltiples precargas simultáneas
    if (preloadInProgress.current) {
      console.log('Preload already in progress');
      return;
    }
    
    preloadInProgress.current = true;
    setPreloadStatus('loading');
    
    try {
      const results = await Promise.allSettled([
        loadProfile(),
        loadPlates(),
        loadGroups(),
        loadTodayReservation(),
        loadUpcomingReservations(),
        loadMaps(),
      ]);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      if (successCount === results.length) {
        setPreloadStatus('complete');
        await offlineCache.set('preload_complete', true);
      } else if (successCount > 0) {
        setPreloadStatus('partial');
        await offlineCache.set('preload_complete', false);
      } else {
        setPreloadStatus('idle');
      }
      
    } finally {
      preloadInProgress.current = false;
    }
  };
  
  // Verificar si ya se precargó al montar
  useEffect(() => {
    const checkPreload = async () => {
      const complete = await offlineCache.get('preload_complete');
      if (complete) {
        setPreloadStatus('complete');
      } else if (isOnline) {
        preloadData();
      }
    };
    checkPreload();
  }, []);
  
  return { 
    isOnline, 
    preloadStatus, 
    preloadData,
    isPreloadComplete: preloadStatus === 'complete'
  };
};
```

**Beneficio:** Precarga se completa aunque usuario navegue, no se duplica, se puede verificar estado.


### 5. Problema: Datos del Cache Pueden Estar Obsoletos

**Escenario:** Usuario precargó datos hace 3 días, vuelve offline, ve datos muy antiguos.

**Riesgo:** Usuario ve información incorrecta (reservas canceladas, plazas cambiadas, etc).

**Solución:**

```typescript
const loadFromCache = async <T>(key: string, maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<T | null> => {
  const cached = await offlineCache.get<{
    data: T;
    timestamp: number;
  }>(key);
  
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  
  if (age > maxAge) {
    console.warn(`Cache for ${key} is too old (${Math.floor(age / 1000 / 60 / 60)} hours)`);
    
    // Mostrar advertencia al usuario
    toast.warning('Los datos pueden estar desactualizados', {
      description: `Última actualización: ${formatDistanceToNow(new Date(cached.timestamp), { locale: es })}`
    });
    
    // Retornar datos pero marcarlos como obsoletos
    return cached.data;
  }
  
  return cached.data;
};

// Modificar set para incluir timestamp
const saveToCache = async <T>(key: string, data: T): Promise<void> => {
  await offlineCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Uso en componentes
const loadReservations = async () => {
  if (!isOnline) {
    const cached = await loadFromCache('upcoming_reservations', 24 * 60 * 60 * 1000); // Max 24h
    if (cached) {
      setReservations(cached);
    } else {
      toast.error('Datos no disponibles o muy antiguos');
      setReservations([]);
    }
    return;
  }
  
  // ... carga online
};
```

**Beneficio:** Usuario sabe si los datos están desactualizados, puede decidir si confiar en ellos.


### 6. Problema: Usuario Tiene Múltiples Pestañas Abiertas

**Escenario:** Usuario tiene 2 pestañas de la app, hace check-in offline en una, la otra no se entera.

**Riesgo:** Estado inconsistente entre pestañas.

**Solución:**

```typescript
// Usar BroadcastChannel para sincronizar entre pestañas
const useOfflineMode = () => {
  const channel = useRef<BroadcastChannel | null>(null);
  
  useEffect(() => {
    // Crear canal de comunicación entre pestañas
    channel.current = new BroadcastChannel('reserveo_offline');
    
    // Escuchar mensajes de otras pestañas
    channel.current.onmessage = (event) => {
      if (event.data.type === 'action_queued') {
        // Otra pestaña añadió una acción
        setPendingActions(prev => prev + 1);
      }
      
      if (event.data.type === 'sync_complete') {
        // Otra pestaña sincronizó
        setPendingActions(0);
        preloadData(); // Recargar datos frescos
      }
      
      if (event.data.type === 'connection_changed') {
        // Otra pestaña detectó cambio de conexión
        setIsOnline(event.data.isOnline);
      }
    };
    
    return () => {
      channel.current?.close();
    };
  }, []);
  
  const queueAction = async (action: OfflineAction) => {
    // ... guardar acción
    
    // Notificar a otras pestañas
    channel.current?.postMessage({
      type: 'action_queued',
      action,
    });
  };
  
  const syncPendingActions = async () => {
    // ... sincronizar
    
    // Notificar a otras pestañas
    channel.current?.postMessage({
      type: 'sync_complete',
    });
  };
  
  // Notificar cambios de conexión
  useEffect(() => {
    channel.current?.postMessage({
      type: 'connection_changed',
      isOnline,
    });
  }, [isOnline]);
};
```

**Beneficio:** Todas las pestañas se mantienen sincronizadas, usuario ve estado consistente.


### 7. Problema: Navegador Puede Bloquear IndexedDB en Modo Incógnito

**Escenario:** Usuario usa modo incógnito, IndexedDB no funciona.

**Riesgo:** App rompe completamente.

**Solución:**

```typescript
class OfflineCache {
  private fallbackStorage: Map<string, any> = new Map();
  private useIndexedDB: boolean = true;
  
  async init(): Promise<void> {
    try {
      // Intentar abrir IndexedDB
      const request = indexedDB.open(this.dbName, 1);
      
      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          this.db = request.result;
          this.useIndexedDB = true;
          resolve(true);
        };
        
        request.onerror = () => {
          console.warn('IndexedDB not available, using fallback storage');
          this.useIndexedDB = false;
          resolve(false);
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
      });
      
    } catch (error) {
      console.warn('IndexedDB failed, using fallback:', error);
      this.useIndexedDB = false;
    }
  }
  
  async set(key: string, data: any): Promise<boolean> {
    if (!this.useIndexedDB) {
      // Fallback a Map en memoria
      this.fallbackStorage.set(key, data);
      return true;
    }
    
    // ... lógica IndexedDB normal
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.useIndexedDB) {
      return this.fallbackStorage.get(key) || null;
    }
    
    // ... lógica IndexedDB normal
  }
}
```

**Beneficio:** App funciona incluso en modo incógnito (datos solo en sesión actual).


## Resumen de Mejoras de Robustez

### Problemas Identificados y Solucionados

| # | Problema | Solución | Líneas Extra |
|---|----------|----------|--------------|
| 1 | Precarga parcial | Cargas independientes + feedback | +30 |
| 2 | Conflictos de sincronización | Validación antes de ejecutar | +40 |
| 3 | IndexedDB lleno | Limpieza automática + verificación | +50 |
| 4 | Precarga interrumpida | Flag de progreso + verificación | +20 |
| 5 | Datos obsoletos | Timestamp + advertencia | +30 |
| 6 | Múltiples pestañas | BroadcastChannel | +40 |
| 7 | Modo incógnito | Fallback a Map | +30 |

**Total líneas extra:** ~240 líneas

**Nuevo total estimado:** ~640 líneas (aún muy por debajo de las 2000 anteriores)

### Beneficios de las Mejoras

✅ **Robustez:** Maneja todos los casos edge sin romper
✅ **Feedback:** Usuario siempre sabe qué está pasando
✅ **Consistencia:** Estado sincronizado entre pestañas
✅ **Compatibilidad:** Funciona incluso en modo incógnito
✅ **Integridad:** Detecta y maneja conflictos de datos

### Prioridad de Implementación

**Fase 1 (Crítico):**
- Problema 1: Precarga parcial
- Problema 3: IndexedDB lleno
- Problema 7: Modo incógnito

**Fase 2 (Importante):**
- Problema 2: Conflictos de sincronización
- Problema 5: Datos obsoletos

**Fase 3 (Nice to have):**
- Problema 4: Precarga interrumpida
- Problema 6: Múltiples pestañas

