# Sistema de Iconografía Consistente - RESERVEO

## Descripción

Sistema centralizado para gestionar iconos en toda la aplicación con configuración estandarizada de:
- Stroke width (2px)
- Colores semánticos
- Tamaños responsive
- Accesibilidad (aria-hidden)

## Uso

### Importar

```typescript
import { getIconProps, ICON_SIZES, ICON_COLORS } from "@/lib/iconConfig";
import { Calendar, MapPin, AlertCircle } from "lucide-react";
```

### Tamaños Disponibles

```typescript
// Tamaños fijos
"sm"   // 16px - Iconos pequeños
"md"   // 20px - Móvil (default)
"lg"   // 24px - Desktop
"xl"   // 32px - Iconos grandes
"2xl"  // 48px - Iconos hero

// Tamaño responsive (20px móvil, 24px desktop)
"responsive"
```

### Colores Semánticos

```typescript
"success"    // Verde - Éxito, confirmación
"error"      // Rojo - Error, peligro
"warning"    // Naranja - Advertencia
"info"       // Azul - Información
"primary"    // Color primario de la marca
"muted"      // Color apagado
"foreground" // Color de texto principal
```

### Ejemplos de Uso

#### Icono básico con tamaño y color

```tsx
<Calendar {...getIconProps("md", "primary")} />
```

#### Icono responsive

```tsx
<MapPin {...getIconProps("responsive", "info")} />
```

#### Icono con clases adicionales

```tsx
<AlertCircle {...getIconProps("lg", "error", "animate-pulse")} />
```

#### Icono en AnimatedIcon

```tsx
<AnimatedIcon
  icon={<CheckCircle2 {...getIconProps("lg", "success")} />}
  animation="pulse"
  size="lg"
  duration={2000}
/>
```

#### Icono en botón

```tsx
<GradientButton
  icon={<MapPin {...getIconProps("md", "info")} />}
  iconPosition="left"
>
  Ver Ubicación
</GradientButton>
```

## Props Generadas

Todos los iconos reciben automáticamente:

```typescript
{
  strokeWidth: 2,
  "aria-hidden": "true",
  className: "w-5 h-5 text-primary" // Ejemplo
}
```

## Componentes Actualizados

Los siguientes componentes ya usan el sistema:

- ✅ `TodayReservationCard` - Calendar, MapPin, AlertCircle
- ✅ `TodayCheckinCard` - Clock, CheckCircle2, LogOut, WifiOff
- ✅ `TodaySection` - Calendar
- ✅ `DashboardHeader` - User, Bell, LogOut, Loader2
- ✅ `AlertBadge` - Bell

## Beneficios

1. **Consistencia**: Todos los iconos tienen el mismo stroke-width (2px)
2. **Accesibilidad**: aria-hidden automático en iconos decorativos
3. **Responsive**: Tamaños adaptativos móvil/desktop
4. **Semántica**: Colores con significado claro
5. **Mantenibilidad**: Cambios centralizados

## Migración de Iconos Existentes

### Antes

```tsx
<Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
```

### Después

```tsx
<Calendar {...getIconProps("responsive", "primary")} />
```

## Notas

- Todos los iconos son de **Lucide React**
- El stroke-width de 2px es el estándar de la aplicación
- Los iconos decorativos siempre tienen `aria-hidden="true"`
- Los tamaños responsive usan `w-5 h-5 md:w-6 md:h-6` (20px móvil, 24px desktop)
