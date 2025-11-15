# Dashboard de Estadísticas de Check-in

Dashboard completo para analizar el comportamiento de los usuarios al hacer reservas de parking.

## Componentes

### `CheckInStats`
Componente principal que orquesta todo el dashboard.

**Características:**
- Filtros por grupo y rango de fechas
- 4 métricas clave (stats cards)
- Gráfica de actividad por hora
- Heatmap de actividad (día x hora)
- Tabla de top usuarios más rápidos
- Exportación CSV (2 versiones)

### `StatsFilters`
Filtros del dashboard con date picker y selectores.

**Props:**
- `filters`: Filtros actuales
- `onFiltersChange`: Callback al cambiar filtros
- `onExportTopUsers`: Callback para exportar top usuarios
- `onExportAllReservations`: Callback para exportar todas las reservas
- `isExporting`: Estado de exportación

### `StatsCards`
4 tarjetas con métricas clave.

**Métricas:**
1. Total de reservas
2. Tiempo promedio desde desbloqueo
3. Hora pico del día
4. Usuario más rápido

### `ActivityByHourChart`
Gráfica de barras con actividad por hora del día (0-23).

**Tecnología:** Recharts + shadcn/ui Chart

### `ActivityHeatmap`
Heatmap que muestra la distribución de reservas por día de la semana y hora.

**Colores:** Gradiente del branding (primary) de claro a oscuro según intensidad.

**Responsive:** Solo visible en tablet/desktop (≥768px).

### `MobileHeatmapPlaceholder`
Mensaje amigable para móviles indicando que el heatmap solo está disponible en tablet/PC.

### `TopUsersTable`
Tabla ordenable con los usuarios que reservan más rápido.

**Características:**
- Ordenamiento por cualquier columna
- Badge "Power User" 🔥 para usuarios con >70% de reservas rápidas
- Expandible (Top 10 por defecto, hasta 20)
- Responsive con scroll horizontal

## Hook

### `useCheckInStats`
Hook personalizado para gestionar los datos del dashboard.

**Funciones:**
- `loadStats(filters, forceReload)`: Carga todas las estadísticas
- `exportTopUsers(options)`: Exporta CSV de top usuarios
- `exportAllReservations(options)`: Exporta CSV de todas las reservas
- `invalidateCache()`: Invalida el cache

**Patrón:** Cache con `useRef` para evitar re-fetches innecesarios.

## Funciones SQL

### `get_avg_reservation_time`
Calcula el tiempo promedio de reserva después del desbloqueo.

### `get_peak_hour`
Obtiene la hora con más reservas.

### `get_fastest_user`
Obtiene el usuario más rápido en reservar.

### `get_activity_by_hour`
Obtiene el número de reservas por hora del día.

### `get_heatmap_data`
Obtiene datos para el heatmap (día x hora).

### `get_top_fast_users`
Obtiene el ranking de usuarios más rápidos.

## Configuración

### Umbral de "Reserva Rápida"
Configurable en `reservation_settings.fast_reservation_threshold_minutes`.

**Por defecto:** 5 minutos

**Rango válido:** 1-60 minutos

## Uso

```tsx
import { CheckInStats } from '@/components/admin/check-in-stats';

function AdminPanel() {
  return (
    <div>
      <CheckInStats />
    </div>
  );
}
```

## Responsive

- **Desktop (>1024px):** Layout completo en 2 columnas
- **Tablet (768-1024px):** Layout en 1 columna, heatmap visible
- **Móvil (<768px):** Layout en 1 columna, heatmap oculto con mensaje

## Exportación CSV

### Top Usuarios
Columnas: Usuario, Email, Reservas Rápidas, Total Reservas, Porcentaje, Hora Promedio

### Todas las Reservas
Columnas: Fecha Reserva, Hora Reserva, Usuario, Email, Grupo, Plaza, Tiempo desde Desbloqueo

## Colores

Usa los colores del branding definidos en `src/index.css`:

- **Primary:** `hsl(12 69% 48%)` - Color principal
- **Charts:** Variables `--chart-1` a `--chart-5`
- **Heatmap:** Gradiente de primary (20% → 100%)

## Performance

- Cache de datos (5 minutos)
- Lazy loading de gráficas
- Debounce en filtros (500ms)
- Skeleton loaders

## Accesibilidad

- Todas las gráficas con `aria-label`
- Tooltips accesibles por teclado
- Contraste WCAG AA
- Navegación por teclado en tabla
