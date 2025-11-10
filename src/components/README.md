# Guía de Componentes - Reserveo

Esta guía define las convenciones, mejores prácticas y arquitectura para crear y mantener componentes en el proyecto Reserveo.

## 📋 Tabla de Contenidos

- [Principios Fundamentales](#principios-fundamentales)
- [Cuándo Modularizar](#cuándo-modularizar)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Tokens Semánticos CSS](#tokens-semánticos-css)
- [Convenciones de Componentes](#convenciones-de-componentes)
- [Anatomía de un Componente](#anatomía-de-un-componente)
- [Guía para Crear Nuevos Componentes](#guía-para-crear-nuevos-componentes)
- [Mejores Prácticas](#mejores-prácticas)
- [Ejemplos](#ejemplos)

---

## Principios Fundamentales

### 1. **Modularidad sobre Monolitos**
Los componentes deben ser pequeños, enfocados y reutilizables. Un archivo de componente no debe exceder las **200 líneas**.

### 2. **Separación de Responsabilidades**
- **UI Components**: Solo presentación visual
- **Feature Components**: Lógica de negocio + presentación
- **Custom Hooks**: Lógica reutilizable sin UI
- **Types**: Interfaces y tipos compartidos

### 3. **Design System First**
Todos los componentes DEBEN usar tokens semánticos CSS del sistema de diseño. **Nunca** usar colores directos como `text-white`, `bg-blue-500`, etc.

---

## Cuándo Modularizar

### ⚠️ Límite Crítico: 200 Líneas

Cuando un componente alcanza o supera las **200 líneas**, es obligatorio modularizarlo. Señales de que necesitas refactorizar:

#### 🚨 Indicadores de Modularización Necesaria

1. **Tamaño del Archivo**
   - ✅ Componente saludable: < 200 líneas
   - ⚠️ Revisar: 150-200 líneas
   - 🚨 Modularizar YA: > 200 líneas

2. **Complejidad del Estado**
   - Más de 5 estados locales (`useState`)
   - Lógica compleja de negocio mezclada con UI
   - Múltiples `useEffect` interdependientes

3. **Renderizado Condicional Complejo**
   - Múltiples niveles de ternarios anidados
   - Muchas ramas de `if/else` en el JSX
   - Lógica de visibilidad compleja

4. **Repetición de Código**
   - Bloques de JSX similares repetidos 3+ veces
   - Lógica duplicada en diferentes secciones

### 📊 Estrategias de Modularización

#### Opción 1: Extracción de Sub-Componentes
```
ComponentePadre.tsx (400 líneas) 
  → ComponentePadre.tsx (80 líneas)
  → Seccion1.tsx (120 líneas)
  → Seccion2.tsx (100 líneas)
  → Seccion3.tsx (100 líneas)
```

#### Opción 2: Extracción de Lógica + Componentes
```
ComponenteComplejo.tsx (500 líneas)
  → ComponenteComplejo.tsx (150 líneas) - Orquestador
  → useComponenteLogic.ts (150 líneas) - Lógica
  → SubComponente1.tsx (100 líneas)
  → SubComponente2.tsx (100 líneas)
```

#### Opción 3: Feature-Based (Recomendado para features grandes)
```
src/components/mi-feature/
  ├── MiFeature.tsx (80 líneas) - Orquestador principal
  ├── hooks/
  │   └── useMiFeature.ts - Lógica de negocio
  ├── components/
  │   ├── FeatureHeader.tsx
  │   ├── FeatureContent.tsx
  │   └── FeatureFooter.tsx
  └── types.ts - Interfaces específicas
```

---

## Estructura de Carpetas

### Estructura Actual del Proyecto

```
src/components/
├── ui/                          # Componentes base de shadcn/ui (NO MODIFICAR)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
├── admin/                       # Panel de administración
│   ├── configuration/           # Tab de configuración
│   │   └── ConfigurationTab.tsx
│   ├── groups/                  # Gestión de grupos de parking
│   │   ├── GroupCard.tsx
│   │   ├── GroupFormDialog.tsx
│   │   └── ...
│   ├── license-plates/          # Gestión de matrículas
│   │   ├── LicensePlatesTab.tsx
│   │   ├── ApprovalDialog.tsx
│   │   └── ...
│   ├── parking-spots/           # Gestión de plazas
│   │   └── ParkingSpotsTab.tsx
│   ├── users/                   # Gestión de usuarios
│   │   ├── UsersTab.tsx
│   │   ├── UserCard.tsx
│   │   └── ...
│   ├── visual-editor/           # Editor visual de plazas
│   │   ├── VisualEditorTab.tsx
│   │   └── SpotAttributesDialog.tsx
│   └── skeletons/
│       └── AdminSkeletons.tsx
│
├── calendar/                    # Sistema de calendario
│   ├── CalendarGrid.tsx
│   ├── DateCell.tsx
│   ├── MonthNavigation.tsx
│   └── CalendarLegend.tsx
│
├── dashboard/                   # Dashboard principal del usuario
│   ├── DashboardHeader.tsx
│   └── UserStatusGuard.tsx
│
├── group-selector/              # Selector de grupos de parking
│   ├── GroupCard.tsx
│   └── QuickReserveButtons.tsx
│
├── license-plates/              # Gestión de matrículas del usuario
│   ├── LicensePlateForm.tsx
│   ├── LicensePlateCard.tsx
│   └── DeletedPlatesHistory.tsx
│
├── spot-selection/              # Selección de plaza en mapa
│   ├── InteractiveMap.tsx
│   ├── SpotsList.tsx
│   ├── MapLegend.tsx
│   └── ZoomControls.tsx
│
├── AdminPanel.tsx               # Orquestador del panel admin
├── GroupSelectorModal.tsx       # Modal de selección de grupo
├── LicensePlateManager.tsx      # Gestor de matrículas
├── NavLink.tsx                  # Componente de navegación
├── ParkingCalendar.tsx          # Calendario de reservas
└── ReservationDetailsModal.tsx  # Modal de detalles de reserva
```

### Convención de Carpetas por Feature

#### Para Features Pequeñas (< 3 archivos)
```
src/components/
└── MiFeature.tsx
```

#### Para Features Medianas (3-5 archivos)
```
src/components/mi-feature/
├── MiFeatureComponent.tsx
├── SubComponent1.tsx
└── SubComponent2.tsx
```

#### Para Features Grandes (> 5 archivos) - Recomendado
```
src/components/mi-feature/
├── MiFeature.tsx                 # Orquestador principal
├── components/                   # Sub-componentes
│   ├── FeatureHeader.tsx
│   ├── FeatureContent.tsx
│   └── FeatureFooter.tsx
├── dialogs/                      # Diálogos/modales específicos
│   ├── CreateDialog.tsx
│   └── EditDialog.tsx
└── types.ts (opcional)           # Tipos específicos si son muchos
```

**Nota**: La lógica de negocio va en `src/hooks/`, NO en la carpeta del componente.

---

## Tokens Semánticos CSS

### ⚠️ Regla Crítica: NUNCA Colores Directos

**❌ PROHIBIDO:**
```tsx
// NO HACER ESTO
<div className="bg-blue-500 text-white border-gray-300">
<Button className="bg-red-600 hover:bg-red-700">
<span className="text-black dark:text-white">
```

**✅ CORRECTO:**
```tsx
// SÍ HACER ESTO
<div className="bg-primary text-primary-foreground border-border">
<Button variant="destructive">
<span className="text-foreground">
```

### Tokens Disponibles (index.css)

#### Colores Base
```css
--background         /* Fondo principal */
--foreground         /* Texto sobre background */
--card              /* Fondo de tarjetas */
--card-foreground   /* Texto sobre card */
--popover           /* Fondo de popovers */
--popover-foreground /* Texto sobre popover */
```

#### Colores de Marca
```css
--primary           /* Color principal de la marca */
--primary-foreground /* Texto sobre primary */
--secondary         /* Color secundario */
--secondary-foreground /* Texto sobre secondary */
--accent            /* Color de acento */
--accent-foreground /* Texto sobre accent */
```

#### Estados y Feedback
```css
--destructive       /* Acciones destructivas (eliminar, etc.) */
--destructive-foreground
--muted             /* Fondos apagados/deshabilitados */
--muted-foreground  /* Texto apagado */
```

#### Elementos de UI
```css
--border            /* Bordes generales */
--input             /* Fondos de inputs */
--ring              /* Anillos de foco */
--radius            /* Radio de bordes (border-radius) */
```

#### Gráficos (Recharts)
```css
--chart-1           /* Primera serie de datos */
--chart-2           /* Segunda serie de datos */
--chart-3           /* Tercera serie de datos */
--chart-4           /* Cuarta serie de datos */
--chart-5           /* Quinta serie de datos */
```

### Cómo Usar Tokens en Tailwind

```tsx
// Fondos y textos
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="bg-primary text-primary-foreground">

// Bordes
<div className="border border-border">
<div className="border-input">

// Estados
<button className="hover:bg-accent hover:text-accent-foreground">
<div className="text-muted-foreground">

// Botones con variantes (automáticamente usan tokens)
<Button variant="default">      {/* usa primary */}
<Button variant="destructive">  {/* usa destructive */}
<Button variant="outline">      {/* usa border */}
<Button variant="secondary">    {/* usa secondary */}
<Button variant="ghost">        {/* usa accent on hover */}
```

### Agregar Nuevos Tokens

Si necesitas un nuevo color temático:

1. **Agregar en `index.css`:**
```css
:root {
  --mi-nuevo-token: 220 90% 50%;
  --mi-nuevo-token-foreground: 0 0% 100%;
}

.dark {
  --mi-nuevo-token: 220 80% 40%;
  --mi-nuevo-token-foreground: 0 0% 100%;
}
```

2. **Agregar en `tailwind.config.ts`:**
```ts
extend: {
  colors: {
    miNuevoToken: {
      DEFAULT: "hsl(var(--mi-nuevo-token))",
      foreground: "hsl(var(--mi-nuevo-token-foreground))",
    },
  },
}
```

3. **Usar en componentes:**
```tsx
<div className="bg-miNuevoToken text-miNuevoToken-foreground">
```

---

## Convenciones de Componentes

### Nomenclatura

#### Archivos
- **PascalCase**: `MiComponente.tsx`
- **Descriptivo**: `UserCard.tsx` (no `Card.tsx`)
- **Específico**: `ApprovalDialog.tsx` (no `Dialog.tsx`)

#### Componentes
```tsx
// ✅ Correcto
export const UserProfileCard = () => { ... }
export function CreateGroupDialog() { ... }

// ❌ Incorrecto
export const card = () => { ... }
export default function dialog() { ... }
```

#### Props Interfaces
```tsx
// ✅ Correcto - mismo nombre del componente + Props
interface UserCardProps {
  user: User;
  onEdit: () => void;
}

export const UserCard = ({ user, onEdit }: UserCardProps) => { ... }
```

### Imports Organizados

```tsx
// 1. React y librerías externas
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// 2. Componentes UI
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// 3. Componentes personalizados
import { UserCard } from "./UserCard";
import { ApprovalDialog } from "./ApprovalDialog";

// 4. Hooks personalizados
import { useUserManagement } from "@/hooks/admin/useUserManagement";

// 5. Tipos e interfaces
import type { User, UserStatus } from "@/types/admin/users.types";

// 6. Utils y helpers
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
```

### Exportaciones

```tsx
// ✅ Named exports (preferido)
export const UserCard = () => { ... }
export const ApprovalDialog = () => { ... }

// ❌ Default exports (evitar)
export default UserCard;
```

---

## Anatomía de un Componente

### Componente Simple (< 100 líneas)

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MiComponenteProps {
  titulo: string;
  onAction: () => void;
  className?: string;
}

/**
 * Descripción breve del componente
 * 
 * @param titulo - Título a mostrar
 * @param onAction - Callback cuando se ejecuta la acción
 */
export const MiComponente = ({ 
  titulo, 
  onAction,
  className 
}: MiComponenteProps) => {
  const [estado, setEstado] = useState(false);

  const handleClick = () => {
    setEstado(!estado);
    onAction();
  };

  return (
    <Card className={cn("p-4", className)}>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          variant={estado ? "default" : "outline"}
          onClick={handleClick}
        >
          {estado ? "Activo" : "Inactivo"}
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Componente con Lógica Compleja (Usa Custom Hook)

```tsx
import { Button } from "@/components/ui/button";
import { useFeatureLogic } from "@/hooks/useFeatureLogic";
import { FeatureCard } from "./components/FeatureCard";
import { FeatureDialog } from "./components/FeatureDialog";

interface FeatureComponentProps {
  groupId: string;
}

/**
 * Componente principal de la feature
 * La lógica está en useFeatureLogic hook
 */
export const FeatureComponent = ({ groupId }: FeatureComponentProps) => {
  const {
    items,
    loading,
    dialogOpen,
    selectedItem,
    handleCreate,
    handleEdit,
    handleDelete,
    openDialog,
    closeDialog,
  } = useFeatureLogic(groupId);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mi Feature</h2>
        <Button onClick={() => openDialog()}>
          Crear Nuevo
        </Button>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <FeatureCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <FeatureDialog
        open={dialogOpen}
        onClose={closeDialog}
        item={selectedItem}
        onSave={selectedItem ? handleEdit : handleCreate}
      />
    </div>
  );
};
```

---

## Guía para Crear Nuevos Componentes

### Checklist Pre-Creación

Antes de crear un componente, pregúntate:

1. **¿Es reutilizable?**
   - ✅ Sí → Crear componente independiente
   - ❌ No, es específico → Puede ser parte del componente padre

2. **¿Tiene lógica de negocio compleja?**
   - ✅ Sí → Crear hook personalizado + componente
   - ❌ No → Solo componente

3. **¿Es parte de una feature existente?**
   - ✅ Sí → Ponerlo en la carpeta de esa feature
   - ❌ No → Crear nueva carpeta si es feature grande

4. **¿Requiere tipos específicos?**
   - ✅ Muchos tipos → Crear archivo `types.ts`
   - ❌ Pocos tipos → Inline en el componente

### Paso a Paso: Crear Feature Nueva

#### 1. Planificar Estructura
```
Ejemplo: Sistema de Notificaciones
Componentes necesarios:
- NotificationCenter.tsx (orquestador)
- NotificationList.tsx
- NotificationCard.tsx
- NotificationSettingsDialog.tsx

Hook:
- useNotifications.ts

Tipos:
- Muchos → crear types.ts
```

#### 2. Crear Carpeta y Archivos

```bash
# Feature grande (>5 archivos)
src/components/notifications/
├── NotificationCenter.tsx
├── components/
│   ├── NotificationList.tsx
│   ├── NotificationCard.tsx
│   └── NotificationBadge.tsx
├── dialogs/
│   └── NotificationSettingsDialog.tsx
└── types.ts

src/hooks/
└── useNotifications.ts
```

#### 3. Implementar en Orden

1. **Tipos primero** (`types.ts`)
2. **Hook de lógica** (`useNotifications.ts`)
3. **Componentes de menor a mayor** (hojas → raíz)
   - `NotificationCard.tsx`
   - `NotificationList.tsx`
   - `NotificationCenter.tsx`

#### 4. Integrar con Sistema de Diseño

Asegurarse de:
- ✅ Usar tokens semánticos
- ✅ Usar componentes UI existentes
- ✅ Seguir patrones de spacing consistentes
- ✅ Responsive design (mobile-first)

---

## Mejores Prácticas

### 1. Composición sobre Configuración

**❌ Evitar:**
```tsx
<UserCard 
  showAvatar={true}
  showBio={true}
  showActions={true}
  avatarSize="large"
  bioMaxLength={100}
/>
```

**✅ Preferir:**
```tsx
<UserCard>
  <UserAvatar size="large" />
  <UserBio maxLength={100} />
  <UserActions />
</UserCard>
```

### 2. Props Específicas sobre Genéricas

**❌ Evitar:**
```tsx
interface CardProps {
  data: any;
  config: any;
}
```

**✅ Preferir:**
```tsx
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
  isEditable: boolean;
}
```

### 3. Early Returns para Casos Edge

```tsx
export const DataComponent = ({ data, loading }: Props) => {
  // Early returns primero
  if (loading) return <Skeleton />;
  if (!data) return <EmptyState />;
  if (data.length === 0) return <NoResults />;

  // Lógica principal al final
  return (
    <div>
      {data.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
};
```

### 4. Usar `cn()` para ClassNames Condicionales

```tsx
import { cn } from "@/lib/utils";

// ✅ Correcto
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "opacity-50 cursor-not-allowed",
  className // prop className siempre al final
)} />

// ❌ Evitar
<div className={`base ${isActive ? 'active' : ''} ${className}`} />
```

### 5. Handlers de Eventos con Prefijo `handle`

```tsx
const handleClick = () => { ... }
const handleSubmit = () => { ... }
const handleChange = (value: string) => { ... }

// Callbacks en props con prefijo `on`
interface Props {
  onClick: () => void;
  onSubmit: (data: FormData) => void;
  onChange: (value: string) => void;
}
```

### 6. Evitar Lógica en JSX

**❌ Evitar:**
```tsx
return (
  <div>
    {users.filter(u => u.active).map(u => (
      <UserCard 
        key={u.id}
        name={u.firstName + ' ' + u.lastName}
        status={u.status === 'premium' ? 'Pro' : 'Free'}
      />
    ))}
  </div>
);
```

**✅ Preferir:**
```tsx
const activeUsers = users.filter(u => u.active);

const getFullName = (user: User) => `${user.firstName} ${user.lastName}`;
const getDisplayStatus = (status: string) => status === 'premium' ? 'Pro' : 'Free';

return (
  <div>
    {activeUsers.map(user => (
      <UserCard 
        key={user.id}
        name={getFullName(user)}
        status={getDisplayStatus(user.status)}
      />
    ))}
  </div>
);
```

### 7. TypeScript Estricto

```tsx
// ✅ Tipos explícitos
interface Props {
  userId: string;
  onDelete: (id: string) => void;
  metadata?: Record<string, unknown>;
}

// ❌ Evitar any
interface Props {
  data: any; // NO
  callback: any; // NO
}
```

### 8. Accesibilidad (a11y)

```tsx
// Siempre incluir:
<Button aria-label="Eliminar usuario">
  <TrashIcon />
</Button>

<img src={avatar} alt={`Avatar de ${userName}`} />

<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

---

## Ejemplos

### Ejemplo 1: Componente Simple

**UserBadge.tsx**
```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserBadgeProps {
  status: "active" | "blocked" | "deactivated";
  className?: string;
}

const statusConfig = {
  active: { variant: "default" as const, label: "Activo" },
  blocked: { variant: "destructive" as const, label: "Bloqueado" },
  deactivated: { variant: "secondary" as const, label: "Desactivado" },
};

export const UserBadge = ({ status, className }: UserBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn("text-xs", className)}
    >
      {config.label}
    </Badge>
  );
};
```

### Ejemplo 2: Componente con Sub-Componentes

**UserProfileCard.tsx**
```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserBadge } from "./UserBadge";
import type { User } from "@/types/admin/users.types";

interface UserProfileCardProps {
  user: User;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export const UserProfileCard = ({ user, onEdit, onDelete }: UserProfileCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <UserBadge status={user.status} />
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">{user.bio}</p>
      </CardContent>

      <CardFooter className="gap-2">
        <Button 
          variant="outline" 
          onClick={() => onEdit(user.id)}
        >
          Editar
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => onDelete(user.id)}
        >
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
};
```

### Ejemplo 3: Feature Completa (Modularizada)

**src/components/mi-feature/MiFeature.tsx**
```tsx
import { useFeatureLogic } from "@/hooks/useFeatureLogic";
import { FeatureHeader } from "./components/FeatureHeader";
import { FeatureList } from "./components/FeatureList";
import { CreateDialog } from "./dialogs/CreateDialog";

export const MiFeature = () => {
  const {
    items,
    loading,
    dialogOpen,
    handleCreate,
    handleEdit,
    handleDelete,
    openDialog,
    closeDialog,
  } = useFeatureLogic();

  return (
    <div className="space-y-6">
      <FeatureHeader onCreateClick={openDialog} />
      
      <FeatureList
        items={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSubmit={handleCreate}
      />
    </div>
  );
};
```

---

## Recursos Adicionales

- **Hooks**: Ver `/src/hooks/admin/README.md` para patrones de hooks
- **Tipos**: Ver `/src/types/admin/` para convenciones de tipos
- **Design System**: Ver `index.css` y `tailwind.config.ts`
- **shadcn/ui**: [https://ui.shadcn.com/](https://ui.shadcn.com/)

---

## Troubleshooting

### "Mi componente es muy grande (>300 líneas)"
→ Revisa la sección [Cuándo Modularizar](#cuándo-modularizar) y extrae sub-componentes o lógica a hooks.

### "No sé qué token CSS usar"
→ Revisa la sección [Tokens Semánticos CSS](#tokens-semánticos-css) o inspecciona componentes similares existentes.

### "¿Dónde pongo mi nuevo componente?"
→ Revisa [Estructura de Carpetas](#estructura-de-carpetas) y sigue el patrón feature-based.

### "¿Necesito crear un hook?"
→ Si tu componente tiene >50 líneas de lógica de negocio, probablemente sí.

---

**Última actualización**: 2025-11-10  
**Mantenido por**: Equipo Reserveo
