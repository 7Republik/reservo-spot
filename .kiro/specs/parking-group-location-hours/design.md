# Design Document

## Overview

Esta especificación añade funcionalidad de ubicación física y horarios de operación a los grupos de parking en RESERVEO. Los administradores podrán configurar direcciones normalizadas, indicaciones de acceso y horarios semanales para cada grupo. Los usuarios tendrán acceso a una nueva sección dedicada donde podrán consultar esta información y obtener direcciones de navegación para llegar al parking.

**Principios de diseño:**
- Campos opcionales: No bloquear la creación de grupos sin esta información
- Separación de concerns: Nueva sección de UI sin modificar pantallas de reserva existentes
- Mobile-first: Integración con apps de navegación nativas
- Progresivo: Los admins pueden añadir información gradualmente

## Architecture

### Database Layer

**Nueva tabla: `parking_group_locations`**
- Relación 1:1 con `parking_groups`
- Almacena dirección normalizada, coordenadas y horarios
- Campos opcionales para permitir configuración gradual

**Estructura de datos:**
- Dirección normalizada (campos separados)
- Coordenadas geográficas (lat/lng) para navegación
- Indicaciones específicas (texto largo)
- Horarios semanales (JSON o tabla relacionada)
- Flag 24/7

### Application Layer

**Componentes nuevos:**
1. **Admin Panel**: Formulario extendido para configurar ubicación y horarios
2. **User Section**: Nueva página/sección para consultar ubicaciones
3. **Navigation Integration**: Componente para generar enlaces de navegación

**Hooks nuevos:**
1. `useParkingGroupLocations` - CRUD de ubicaciones (admin)
2. `useLocationNavigation` - Generación de enlaces de navegación (user)

### Integration Layer

**Servicios de mapas:**
- Google Maps (web y móvil)
- Apple Maps (iOS)
- Waze (móvil)

## Components and Interfaces

### 1. Database Schema

#### Tabla: parking_group_locations

```sql
CREATE TABLE parking_group_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL UNIQUE REFERENCES parking_groups(id) ON DELETE CASCADE,
  
  -- Dirección normalizada
  street_address TEXT,           -- Calle y número
  city TEXT,                      -- Ciudad
  state_province TEXT,            -- Provincia/Estado
  postal_code TEXT,               -- Código postal
  country TEXT DEFAULT 'España',  -- País
  
  -- Coordenadas para navegación
  latitude DECIMAL(10, 8),        -- Latitud
  longitude DECIMAL(11, 8),       -- Longitud
  
  -- Indicaciones específicas
  special_instructions TEXT,      -- Hasta 1000 caracteres
  
  -- Horarios
  is_24_7 BOOLEAN DEFAULT false,  -- Disponible 24/7
  operating_hours JSONB,          -- Horarios semanales
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_parking_group_locations_group_id ON parking_group_locations(group_id);
CREATE INDEX idx_parking_group_locations_coordinates ON parking_group_locations(latitude, longitude);

-- Trigger para updated_at
CREATE TRIGGER update_parking_group_locations_updated_at
  BEFORE UPDATE ON parking_group_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Estructura de operating_hours (JSONB)

```json
{
  "monday": { "open": "08:00", "close": "20:00", "closed": false },
  "tuesday": { "open": "08:00", "close": "20:00", "closed": false },
  "wednesday": { "open": "08:00", "close": "20:00", "closed": false },
  "thursday": { "open": "08:00", "close": "20:00", "closed": false },
  "friday": { "open": "08:00", "close": "20:00", "closed": false },
  "saturday": { "open": "09:00", "close": "14:00", "closed": false },
  "sunday": { "open": null, "close": null, "closed": true }
}
```

### 2. TypeScript Types

#### src/types/admin/parking-groups.types.ts (extensión)

```typescript
/**
 * Días de la semana para horarios
 */
export type DayOfWeek = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';

/**
 * Horario de un día específico
 */
export interface DaySchedule {
  open: string | null;   // Formato "HH:mm" (24h)
  close: string | null;  // Formato "HH:mm" (24h)
  closed: boolean;       // true si el día está cerrado
}

/**
 * Horarios semanales completos
 */
export type WeeklySchedule = Record<DayOfWeek, DaySchedule>;

/**
 * Ubicación y horarios de un grupo de parking
 */
export interface ParkingGroupLocation {
  id: string;
  group_id: string;
  
  // Dirección
  street_address: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string;
  
  // Coordenadas
  latitude: number | null;
  longitude: number | null;
  
  // Indicaciones
  special_instructions: string | null;
  
  // Horarios
  is_24_7: boolean;
  operating_hours: WeeklySchedule | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Datos para crear/actualizar ubicación
 */
export interface ParkingGroupLocationFormData {
  street_address: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  special_instructions?: string;
  is_24_7: boolean;
  operating_hours?: WeeklySchedule;
}

/**
 * Grupo de parking con ubicación (para vista de usuario)
 */
export interface ParkingGroupWithLocation extends ParkingGroup {
  location: ParkingGroupLocation | null;
}
```

### 3. Admin Components

#### GroupLocationForm.tsx

Formulario para configurar ubicación y horarios en el panel de administración.

**Ubicación:** `src/components/admin/groups/GroupLocationForm.tsx`

**Características:**
- Campos de dirección normalizada
- Textarea para indicaciones específicas (max 1000 chars)
- Toggle para modo 24/7
- Editor de horarios semanales (cuando no es 24/7)
- Validación: al menos calle y ciudad requeridas

**Props:**
```typescript
interface GroupLocationFormProps {
  groupId: string;
  existingLocation: ParkingGroupLocation | null;
  onSave: (data: ParkingGroupLocationFormData) => Promise<boolean>;
  onCancel: () => void;
}
```

#### WeeklyScheduleEditor.tsx

Componente para editar horarios semanales.

**Ubicación:** `src/components/admin/groups/WeeklyScheduleEditor.tsx`

**Características:**
- Lista de 7 días con inputs de hora
- Checkbox "Cerrado" por día
- Validación: hora apertura < hora cierre
- Formato 24 horas
- Botón "Copiar a todos los días"

**Props:**
```typescript
interface WeeklyScheduleEditorProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
  disabled?: boolean;
}
```

#### GroupCard.tsx (modificación)

Añadir indicador visual si el grupo tiene ubicación configurada.

**Cambios:**
- Badge "📍 Ubicación" si tiene location
- Badge "🕐 Horarios" si tiene horarios configurados

### 4. User Components

#### LocationsPage.tsx

Nueva página para que usuarios consulten ubicaciones de parking.

**Ubicación:** `src/pages/Locations.tsx`

**Características:**
- Lista de grupos con ubicación configurada
- Tarjetas expandibles por grupo
- Información de dirección, indicaciones y horarios
- Botón "Cómo llegar" con navegación

**Estructura:**
```typescript
const LocationsPage = () => {
  const { groupsWithLocations, loading } = useParkingGroupLocations();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Ubicaciones de Parking</h1>
      
      {loading ? (
        <LocationsSkeleton />
      ) : (
        <div className="space-y-4">
          {groupsWithLocations.map(group => (
            <LocationCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
};
```

#### LocationCard.tsx

Tarjeta individual para mostrar información de ubicación de un grupo.

**Ubicación:** `src/components/locations/LocationCard.tsx`

**Características:**
- Nombre y descripción del grupo
- Dirección formateada
- Indicaciones específicas (si existen)
- Horarios o badge "24/7"
- Botón "Cómo llegar"

**Props:**
```typescript
interface LocationCardProps {
  group: ParkingGroupWithLocation;
}
```

#### NavigationButton.tsx

Botón para abrir navegación en app de mapas.

**Ubicación:** `src/components/locations/NavigationButton.tsx`

**Características:**
- Detecta plataforma (iOS, Android, Desktop)
- Genera enlace apropiado (Apple Maps, Google Maps, Waze)
- Menú desplegable en móvil para elegir app
- Abre Google Maps en web para desktop

**Props:**
```typescript
interface NavigationButtonProps {
  latitude: number;
  longitude: number;
  address: string;
  groupName: string;
}
```

### 5. Custom Hooks

#### useParkingGroupLocations.ts (Admin)

Hook para gestionar ubicaciones en el panel de administración.

**Ubicación:** `src/hooks/admin/useParkingGroupLocations.ts`

**Funciones:**
```typescript
interface UseParkingGroupLocationsReturn {
  locations: ParkingGroupLocation[];
  loading: boolean;
  
  // CRUD operations
  loadLocations: (forceReload?: boolean) => Promise<void>;
  getLocationByGroupId: (groupId: string) => ParkingGroupLocation | null;
  createLocation: (groupId: string, data: ParkingGroupLocationFormData) => Promise<boolean>;
  updateLocation: (locationId: string, data: ParkingGroupLocationFormData) => Promise<boolean>;
  deleteLocation: (locationId: string) => Promise<boolean>;
}
```

**Patrón de caché:** Similar a `useParkingGroups`

#### useGroupsWithLocations.ts (User)

Hook para obtener grupos con ubicación para usuarios.

**Ubicación:** `src/hooks/useGroupsWithLocations.ts`

**Funciones:**
```typescript
interface UseGroupsWithLocationsReturn {
  groupsWithLocations: ParkingGroupWithLocation[];
  loading: boolean;
  loadGroupsWithLocations: () => Promise<void>;
}
```

**Query:**
```typescript
const { data, error } = await supabase
  .from('parking_groups')
  .select(`
    *,
    location:parking_group_locations(*)
  `)
  .eq('is_active', true)
  .not('parking_group_locations', 'is', null)
  .order('name');
```

#### useLocationNavigation.ts

Hook para generar enlaces de navegación.

**Ubicación:** `src/hooks/useLocationNavigation.ts`

**Funciones:**
```typescript
interface UseLocationNavigationReturn {
  generateNavigationUrl: (
    latitude: number,
    longitude: number,
    address: string,
    app?: 'google' | 'apple' | 'waze'
  ) => string;
  
  openNavigation: (
    latitude: number,
    longitude: number,
    address: string,
    app?: 'google' | 'apple' | 'waze'
  ) => void;
  
  detectPlatform: () => 'ios' | 'android' | 'desktop';
}
```

**Implementación de URLs:**
```typescript
const generateNavigationUrl = (lat, lng, address, app) => {
  const encodedAddress = encodeURIComponent(address);
  
  switch (app) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    case 'apple':
      return `maps://maps.apple.com/?daddr=${lat},${lng}`;
    
    case 'waze':
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    
    default:
      // Auto-detect
      const platform = detectPlatform();
      if (platform === 'ios') return generateNavigationUrl(lat, lng, address, 'apple');
      return generateNavigationUrl(lat, lng, address, 'google');
  }
};
```

## Data Models

### Relaciones

```
parking_groups (1) ←→ (0..1) parking_group_locations
```

**Cascade delete:** Si se elimina un grupo, se elimina su ubicación.

### Validaciones

**Base de datos (CHECK constraints):**
```sql
-- Validar coordenadas
ALTER TABLE parking_group_locations
  ADD CONSTRAINT check_latitude 
  CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE parking_group_locations
  ADD CONSTRAINT check_longitude 
  CHECK (longitude >= -180 AND longitude <= 180);

-- Validar longitud de indicaciones
ALTER TABLE parking_group_locations
  ADD CONSTRAINT check_special_instructions_length
  CHECK (LENGTH(special_instructions) <= 1000);

-- Validar que si no es 24/7, debe tener horarios
ALTER TABLE parking_group_locations
  ADD CONSTRAINT check_operating_hours
  CHECK (is_24_7 = true OR operating_hours IS NOT NULL);
```

**Frontend (Zod):**
```typescript
const locationSchema = z.object({
  street_address: z.string().min(1, "Calle requerida"),
  city: z.string().min(1, "Ciudad requerida"),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default("España"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  special_instructions: z.string().max(1000).optional(),
  is_24_7: z.boolean(),
  operating_hours: z.record(z.object({
    open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable(),
    close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable(),
    closed: z.boolean()
  })).optional()
});
```

## Error Handling

### Errores comunes

1. **Dirección incompleta**
   - Validar calle y ciudad en frontend
   - Mensaje: "Calle y ciudad son obligatorias"

2. **Horarios inválidos**
   - Validar hora apertura < hora cierre
   - Mensaje: "La hora de apertura debe ser anterior a la de cierre"

3. **Coordenadas fuera de rango**
   - Validar en frontend y DB
   - Mensaje: "Coordenadas inválidas"

4. **Indicaciones muy largas**
   - Contador de caracteres en UI
   - Mensaje: "Máximo 1000 caracteres"

5. **Grupo sin ubicación**
   - No mostrar en sección de ubicaciones
   - No error, simplemente filtrar

### Manejo de errores en navegación

```typescript
const openNavigation = (lat, lng, address, app) => {
  try {
    const url = generateNavigationUrl(lat, lng, address, app);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error opening navigation:', error);
    toast.error('No se pudo abrir la navegación');
  }
};
```

## Testing Strategy

### Unit Tests

**Hooks:**
- `useParkingGroupLocations`: CRUD operations
- `useLocationNavigation`: URL generation por plataforma

**Componentes:**
- `WeeklyScheduleEditor`: Validación de horarios
- `NavigationButton`: Detección de plataforma

### Integration Tests

**Flujos admin:**
1. Crear grupo → Añadir ubicación → Verificar en DB
2. Editar ubicación → Cambiar horarios → Verificar actualización
3. Eliminar grupo → Verificar cascade delete de ubicación

**Flujos usuario:**
1. Cargar página de ubicaciones → Verificar solo grupos con ubicación
2. Click "Cómo llegar" → Verificar apertura de app correcta
3. Cambiar entre días → Verificar horarios correctos

### Manual Testing

**Checklist:**
- [ ] Crear ubicación con todos los campos
- [ ] Crear ubicación solo con campos obligatorios
- [ ] Editar ubicación existente
- [ ] Toggle modo 24/7
- [ ] Configurar horarios semanales
- [ ] Validar horarios inválidos (apertura > cierre)
- [ ] Probar navegación en iOS
- [ ] Probar navegación en Android
- [ ] Probar navegación en desktop
- [ ] Verificar contador de caracteres en indicaciones
- [ ] Eliminar grupo y verificar cascade delete

## UI/UX Considerations

### Admin Panel

**Ubicación del formulario:**
- Nueva pestaña "Ubicación" en el diálogo de edición de grupo
- O sección expandible en `GroupCard`

**Flujo:**
1. Admin crea grupo (sin ubicación)
2. Admin edita grupo → Pestaña "Ubicación"
3. Admin completa dirección y horarios
4. Admin guarda → Badge "📍" aparece en tarjeta

### User Section

**Navegación:**
- Nuevo item en menú principal: "Ubicaciones"
- Icono: 📍 o mapa

**Layout:**
- Lista vertical de tarjetas
- Cada tarjeta expandible
- Información clara y escaneable
- Botón "Cómo llegar" prominente

**Responsive:**
- Mobile: Tarjetas full-width, stack vertical
- Desktop: Grid 2 columnas, más espaciado

### Accessibility

- Labels en todos los inputs
- ARIA labels en botones de navegación
- Contraste adecuado en horarios
- Navegación por teclado en editor de horarios
- Screen reader friendly

## Performance Considerations

### Optimizaciones

1. **Lazy loading de ubicaciones**
   - Solo cargar cuando usuario accede a la sección
   - No cargar en pantallas de reserva

2. **Caché de grupos con ubicación**
   - Usar React Query con staleTime de 5 minutos
   - Invalidar solo cuando admin modifica

3. **Índices de base de datos**
   - Índice en `group_id` para joins rápidos
   - Índice en coordenadas para búsquedas geográficas futuras

4. **Minimizar re-renders**
   - Memoizar componentes de horarios
   - useCallback en handlers de formulario

### Métricas

- Tiempo de carga de página de ubicaciones: < 1s
- Tiempo de guardado de ubicación: < 500ms
- Apertura de navegación: < 200ms

## Security Considerations

### RLS Policies

```sql
-- Usuarios autenticados pueden ver ubicaciones de grupos activos
CREATE POLICY "Users view active group locations"
  ON parking_group_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parking_groups
      WHERE id = parking_group_locations.group_id
      AND is_active = true
    )
  );

-- Solo admins pueden crear/modificar ubicaciones
CREATE POLICY "Admins manage locations"
  ON parking_group_locations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Denegar acceso anónimo
CREATE POLICY "Deny anon access"
  ON parking_group_locations FOR SELECT
  TO anon
  USING (false);
```

### Validaciones

- Sanitizar inputs de texto (indicaciones)
- Validar formato de coordenadas
- Limitar longitud de campos
- Prevenir SQL injection (usar Supabase client)

### Privacidad

- No exponer coordenadas exactas si no es necesario
- Permitir admins ocultar ubicaciones específicas
- No loggear direcciones en analytics

## Migration Strategy

### Fase 1: Schema

```sql
-- Crear tabla
CREATE TABLE parking_group_locations (...);

-- Crear índices
CREATE INDEX ...;

-- Crear políticas RLS
CREATE POLICY ...;

-- Habilitar RLS
ALTER TABLE parking_group_locations ENABLE ROW LEVEL SECURITY;
```

### Fase 2: Backend

- Añadir tipos TypeScript
- Crear hooks admin
- Crear hooks user

### Fase 3: Frontend Admin

- Crear componentes de formulario
- Integrar en panel de administración
- Testing

### Fase 4: Frontend User

- Crear página de ubicaciones
- Crear componentes de navegación
- Añadir al menú principal
- Testing

### Fase 5: Deployment

- Aplicar migración a producción
- Regenerar tipos
- Deploy frontend
- Comunicar nueva funcionalidad a admins

## Future Enhancements

### Posibles mejoras futuras

1. **Geocoding automático**
   - Usar API de Google Maps para obtener coordenadas automáticamente
   - Validar direcciones en tiempo real

2. **Mapa interactivo**
   - Mostrar todos los parkings en un mapa
   - Filtrar por distancia

3. **Notificaciones de horarios**
   - Avisar si el parking está cerrado en la fecha seleccionada
   - Sugerir horarios alternativos

4. **Integración con calendario**
   - Añadir evento al calendario con ubicación
   - Recordatorio con tiempo de viaje

5. **Estadísticas de uso**
   - Trackear cuántos usuarios usan "Cómo llegar"
   - Identificar parkings más consultados

6. **Horarios especiales**
   - Horarios diferentes en festivos
   - Cierres temporales

7. **Fotos del parking**
   - Galería de imágenes del exterior
   - Ayudar a identificar el edificio

8. **Instrucciones de acceso**
   - Códigos de acceso
   - Información de barreras
   - Contacto de seguridad
