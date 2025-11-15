# Waitlist Components

Componentes del sistema de lista de espera de RESERVEO.

## Componentes Disponibles

### WaitlistRegistration

Componente para registrarse en la lista de espera cuando no hay plazas disponibles.

**Ubicación:** `src/components/waitlist/WaitlistRegistration.tsx`

**Props:**
```typescript
interface WaitlistRegistrationProps {
  date: Date;                      // Fecha para la reserva
  availableGroups: ParkingGroup[]; // Grupos disponibles para el usuario
  onSuccess?: () => void;          // Callback al registrarse exitosamente
  onCancel?: () => void;           // Callback al cancelar
}
```

**Características:**
- ✅ Selección de grupos específicos o todos
- ✅ Validación de límite de listas simultáneas
- ✅ Muestra posición estimada después de registrarse
- ✅ Detecta si usuario está bloqueado por penalización
- ✅ Maneja estados de loading y error
- ✅ Información sobre cómo funciona el sistema

**Cuándo usar:**
- Usuario intenta reservar y no hay plazas disponibles
- Sistema de lista de espera está habilitado
- Usuario tiene acceso a al menos un grupo de parking

**Ejemplo de uso:**
```tsx
import { WaitlistRegistration } from '@/components/waitlist/WaitlistRegistration';

const MyComponent = () => {
  const userGroups = [
    { id: '1', name: 'Planta -1', location: 'Edificio Principal' },
    { id: '2', name: 'Planta -2', location: 'Edificio Principal' }
  ];

  return (
    <WaitlistRegistration
      date={new Date('2025-11-20')}
      availableGroups={userGroups}
      onSuccess={() => navigate('/waitlist')}
      onCancel={() => navigate('/calendar')}
    />
  );
};
```

**Requirements:** 3.1, 3.2, 3.3, 3.8

---

### WaitlistDashboard

Dashboard para ver y gestionar las listas de espera activas del usuario.

**Ubicación:** `src/components/waitlist/WaitlistDashboard.tsx`

**Props:**
```typescript
// No requiere props - componente auto-contenido
```

**Características:**
- ✅ Lista todas las entradas activas del usuario
- ✅ Muestra posición en cola para cada entrada
- ✅ Muestra cuántas personas hay delante
- ✅ Permite cancelar registro voluntariamente
- ✅ Actualización en tiempo real de posiciones (cada 30 segundos)
- ✅ Suscripción real-time a cambios vía Supabase
- ✅ Estado vacío cuando no hay entradas activas
- ✅ Diálogo de confirmación antes de cancelar
- ✅ Badge especial cuando usuario es el primero
- ✅ Badge de "oferta pendiente" (no se puede cancelar)

**Cuándo usar:**
- Página dedicada de gestión de listas de espera
- Dashboard del usuario
- Sección dentro del perfil

**Ejemplo de uso:**
```tsx
import { WaitlistDashboard } from '@/components/waitlist/WaitlistDashboard';

const WaitlistPage = () => {
  return (
    <div className="container mx-auto py-8">
      <WaitlistDashboard />
    </div>
  );
};
```

**Características en detalle:**

1. **Posición en Cola**: Muestra la posición del usuario (ej: "#3")
2. **Personas Delante**: Badge mostrando cuántas personas están delante
3. **Primero en Cola**: Badge especial verde cuando el usuario es el primero
4. **Oferta Pendiente**: Badge ámbar cuando hay una oferta pendiente (no se puede cancelar)
5. **Actualización Automática**: Las posiciones se actualizan cada 30 segundos
6. **Real-time**: Suscripción a cambios en la base de datos para actualizaciones instantáneas
7. **Cancelación**: Botón para cancelar registro con diálogo de confirmación
8. **Estado Vacío**: Mensaje amigable cuando no hay listas activas

**Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

---

### WaitlistOfferNotification

Componente modal para mostrar y responder a ofertas de plazas de parking.

**Ubicación:** `src/components/waitlist/WaitlistOfferNotification.tsx`

**Props:**
```typescript
interface WaitlistOfferNotificationProps {
  offer: WaitlistOfferWithDetails;  // Oferta con detalles completos
  open: boolean;                     // Controla visibilidad del diálogo
  onOpenChange: (open: boolean) => void; // Callback al cambiar estado
}
```

**Características:**
- ✅ Countdown visual con niveles de urgencia codificados por color
- ✅ Detalles de la plaza (número, grupo, fecha)
- ✅ Badges de características (accesible, cargador, compacta)
- ✅ Botones de Aceptar y Rechazar
- ✅ Botones deshabilitados automáticamente cuando expira
- ✅ Pantalla de confirmación después de acción
- ✅ Auto-cierre 2 segundos después de acción exitosa
- ✅ Actualización del countdown cada segundo
- ✅ Manejo de estados de loading

**Niveles de Urgencia:**
- **Normal** (>30 min): Colores azul/primary
- **Warning** (15-30 min): Colores naranja
- **Critical** (<15 min): Colores rojo/destructive
- **Expired**: Estado deshabilitado con mensaje de error

**Cuándo usar:**
- Usuario recibe notificación de oferta de plaza
- Mostrar ofertas pendientes en dashboard
- Notificaciones push o in-app

**Ejemplo de uso:**
```tsx
import { WaitlistOfferNotification } from '@/components/waitlist/WaitlistOfferNotification';
import { useWaitlistOffers } from '@/hooks/useWaitlistOffers';

const MyComponent = () => {
  const { pendingOffers } = useWaitlistOffers();
  const [selectedOffer, setSelectedOffer] = useState(null);

  return (
    <>
      {pendingOffers.map(offer => (
        <button
          key={offer.id}
          onClick={() => setSelectedOffer(offer)}
        >
          Ver Oferta - Plaza {offer.parking_spot?.spot_number}
        </button>
      ))}

      {selectedOffer && (
        <WaitlistOfferNotification
          offer={selectedOffer}
          open={!!selectedOffer}
          onOpenChange={(open) => !open && setSelectedOffer(null)}
        />
      )}
    </>
  );
};
```

**Características en detalle:**

1. **Countdown Timer**: Actualización en tiempo real cada segundo con formato legible
2. **Urgencia Visual**: Cambio de colores según tiempo restante (verde → naranja → rojo)
3. **Detalles Completos**: Número de plaza, grupo, fecha formateada en español
4. **Características**: Badges para plaza accesible, con cargador, o compacta
5. **Confirmación**: Pantalla de éxito/rechazo con iconos y mensajes claros
6. **Auto-cierre**: Cierra automáticamente después de expirar o completar acción
7. **Accesibilidad**: Aria-labels, focus management, keyboard navigation

**Flujo de Interacción:**

```
Usuario recibe oferta
  ↓
Modal se abre automáticamente
  ↓
Ve countdown y detalles
  ↓
Usuario decide:
  ├─ Acepta → Crea reserva → Confirmación → Auto-cierre
  ├─ Rechaza → Mantiene en lista → Confirmación → Auto-cierre
  └─ Expira → Botones deshabilitados → Mensaje de expiración
```

**Requirements:** 6.1, 6.2, 6.3, 7.1, 7.2, 8.8

---

## Hooks Relacionados

### useWaitlist

Hook principal para operaciones de lista de espera.

**Ubicación:** `src/hooks/useWaitlist.ts`

**Funciones:**
- `registerInWaitlist(groupIds, date)` - Registrarse en lista de espera
- `cancelWaitlistEntry(entryId)` - Cancelar registro
- `getUserWaitlistEntries()` - Obtener entradas activas
- `acceptOffer(offerId)` - Aceptar oferta
- `rejectOffer(offerId)` - Rechazar oferta

### useWaitlistSettings

Hook para configuración del sistema de lista de espera.

**Ubicación:** `src/hooks/useWaitlistSettings.ts`

**Funciones:**
- `loadSettings()` - Cargar configuración
- `saveSettings(updates)` - Guardar configuración (admin)
- `updateSettings(updates)` - Actualizar estado local

### useWaitlistOffers

Hook para gestionar ofertas de plazas.

**Ubicación:** `src/hooks/useWaitlistOffers.ts`

**Funciones:**
- `getPendingOffers()` - Obtener ofertas pendientes
- `getOfferDetails(offerId)` - Detalles de oferta
- Suscripción real-time a cambios

## Tipos TypeScript

Todos los tipos están definidos en `src/types/waitlist.ts`:

```typescript
// Tipos principales
WaitlistEntry
WaitlistOffer
WaitlistLog
WaitlistPenalty
Notification

// Tipos con relaciones
WaitlistEntryWithDetails
WaitlistOfferWithDetails

// Configuración
WaitlistSettings
WaitlistSettingsUpdate

// UI/Component types
WaitlistRegistrationData
WaitlistOfferNotificationData
WaitlistDashboardData
```

## Flujo de Usuario

### 1. Registro en Lista de Espera

```
Usuario intenta reservar
  ↓
No hay plazas disponibles
  ↓
Sistema verifica waitlist_enabled
  ↓
Muestra WaitlistRegistration
  ↓
Usuario selecciona grupos
  ↓
Sistema valida límites
  ↓
Registro exitoso
  ↓
Muestra posición en cola
```

### 2. Recepción de Oferta

```
Plaza se libera
  ↓
Sistema busca primer usuario en cola
  ↓
Crea oferta con tiempo de expiración
  ↓
Envía email + notificación in-app
  ↓
Usuario ve WaitlistOfferNotification
  ↓
Usuario acepta o rechaza
  ↓
Si acepta: crea reserva y sale de todas las listas
Si rechaza: pasa al siguiente en cola
```

### 3. Gestión de Listas

```
Usuario accede a WaitlistDashboard
  ↓
Ve todas sus entradas activas
  ↓
Ve posición en cada cola
  ↓
Puede cancelar registros
  ↓
Actualización en tiempo real
```

## Validaciones

### Antes de Registrarse

1. ✅ Lista de espera habilitada globalmente
2. ✅ Usuario tiene matrícula aprobada
3. ✅ Usuario tiene acceso al grupo
4. ✅ No excede límite de listas simultáneas
5. ✅ Usuario no está bloqueado por penalización

### Antes de Aceptar Oferta

1. ✅ Oferta existe y no ha expirado
2. ✅ Usuario es el destinatario
3. ✅ Plaza sigue disponible
4. ✅ Usuario cumple requisitos de reserva

## Estados de Error

### Usuario Bloqueado

```tsx
<Alert variant="destructive">
  Estás bloqueado temporalmente de la lista de espera
  por no responder a ofertas anteriores.
  Podrás volver a registrarte después del [fecha]
</Alert>
```

### Límite Excedido

```tsx
<Alert variant="destructive">
  Has alcanzado el límite de listas de espera simultáneas.
  Cancela algunas listas existentes para registrarte en nuevas.
</Alert>
```

### Oferta Expirada

```tsx
<Alert variant="destructive">
  Esta oferta ha expirado.
  La plaza se ha ofrecido al siguiente usuario en la cola.
</Alert>
```

## Integración con Flujo de Reserva

### Opción 1: Reemplazo Directo

Cuando no hay plazas, reemplazar el selector de plazas con WaitlistRegistration:

```tsx
{availableSpots.length === 0 && settings.waitlist_enabled ? (
  <WaitlistRegistration
    date={selectedDate}
    availableGroups={userGroups}
    onSuccess={() => navigate('/waitlist')}
  />
) : (
  <SpotSelection spots={availableSpots} />
)}
```

### Opción 2: Modal

Mostrar en un modal o dialog:

```tsx
<Dialog open={showWaitlist}>
  <DialogContent>
    <WaitlistRegistration
      date={selectedDate}
      availableGroups={userGroups}
      onSuccess={() => setShowWaitlist(false)}
      onCancel={() => setShowWaitlist(false)}
    />
  </DialogContent>
</Dialog>
```

### Opción 3: Página Dedicada

Navegar a una página específica:

```tsx
// En el router
<Route path="/waitlist/register" element={<WaitlistRegistrationPage />} />

// Al detectar no disponibilidad
navigate('/waitlist/register', {
  state: { date: selectedDate, groups: userGroups }
});
```

## Testing

### Unit Tests (Pendiente)

```typescript
describe('WaitlistRegistration', () => {
  it('should show all available groups', () => {});
  it('should validate simultaneous limit', () => {});
  it('should show blocked message if user is penalized', () => {});
  it('should disable submit if no groups selected', () => {});
  it('should call onSuccess after successful registration', () => {});
});
```

### Integration Tests (Pendiente)

```typescript
describe('Waitlist Flow', () => {
  it('should register user in multiple groups', () => {});
  it('should prevent registration if limit exceeded', () => {});
  it('should show position after registration', () => {});
});
```

## Próximos Pasos

1. ✅ Implementar WaitlistRegistration
2. ✅ Implementar WaitlistDashboard
3. ✅ Implementar WaitlistOfferNotification
4. ⏳ Integrar en flujo de reserva existente
5. ⏳ Crear componente NotificationBell
6. ⏳ Añadir tests unitarios
7. ⏳ Añadir tests de integración

## Referencias

- **Spec:** `.kiro/specs/01-sistema-lista-espera/`
- **Design:** `.kiro/specs/01-sistema-lista-espera/design.md`
- **Requirements:** `.kiro/specs/01-sistema-lista-espera/requirements.md`
- **Tasks:** `.kiro/specs/01-sistema-lista-espera/tasks.md`
