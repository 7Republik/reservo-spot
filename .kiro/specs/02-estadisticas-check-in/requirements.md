# 02 - Dashboard de Estadísticas de Check-in

## Contexto

Los administradores necesitan analizar el comportamiento de los usuarios al hacer reservas, especialmente para detectar patrones de "carrera" cuando se desbloquean las plazas a cierta hora (por defecto 10:00 AM).

**Caso de uso real:** Algunos usuarios configuran alarmas y reservan en los primeros 5 minutos, consiguiendo siempre las mejores plazas. El admin quiere ver estas estadísticas para:
- Cotillear y saber quién es más rápido
- Reportar a RRHH sobre uso de la aplicación
- Tomar decisiones sobre horarios de desbloqueo
- Detectar posibles patrones sospechosos

## Objetivo

Crear un dashboard de estadísticas dentro de **Admin Panel → Check-in** que muestre:
1. Actividad de reservas por hora del día
2. Heatmap de actividad (día x hora)
3. Top usuarios más rápidos
4. Métricas clave (stats cards)
5. Exportación a CSV para reportes

## Ubicación

**Ruta:** `/admin/check-in` (nueva pestaña "Estadísticas")

**Estructura de pestañas:**
- Reservas (existente)
- **Estadísticas** (nueva) ← Aquí va el dashboard

## Requisitos Funcionales

### 1. Filtros (Header)

**Componentes:**
- Select de Grupo de Parking (incluir "Todos los grupos")
- Date Range Picker (rangos predefinidos + custom)
- Botones de exportación CSV

**Rangos predefinidos:**
- Últimos 7 días
- Últimos 30 días
- Este mes
- Mes anterior
- Personalizado (date picker)

**Filtros aplicables:**
- Por grupo de parking
- Por rango de fechas
- Ambos combinados

### 2. Stats Cards (4 métricas clave)

**Card 1: Total de Reservas**
- Icono: 🎯 (Target)
- Valor: Número total de reservas en el periodo
- Subtítulo: "Reservas totales"

**Card 2: Tiempo Promedio**
- Icono: ⚡ (Zap)
- Valor: Tiempo promedio de primera reserva después de desbloqueo
- Formato: "3.5 min" o "45 seg"
- Subtítulo: "Tiempo promedio"

**Card 3: Hora Pico**
- Icono: 🔥 (Flame)
- Valor: Hora con más reservas
- Formato: "10:03 AM"
- Subtítulo: "Hora pico del día"

**Card 4: Usuario Más Rápido**
- Icono: 👤 (User)
- Valor: Nombre del usuario más rápido
- Subtítulo: "Usuario más rápido"

### 3. Gráfica de Actividad por Hora

**Tipo:** Bar Chart (shadcn/ui)

**Configuración:**
- Eje X: Horas del día (00:00 - 23:00)
- Eje Y: Número de reservas
- Colores: Usar `--primary` del branding
- Tooltip: Mostrar hora y cantidad
- Grid: Horizontal (sin vertical)
- Responsive: Scroll horizontal en móvil

**Datos:**
- Agregación por hora del día
- Filtrado por grupo y rango de fechas
- Mostrar todas las horas (0-23) aunque no tengan datos

### 4. Heatmap de Actividad

**Tipo:** Custom component con Recharts

**Configuración:**
- Filas: Horas del día (00:00 - 23:00)
- Columnas: Días de la semana (Lun - Dom)
- Colores: Gradiente del branding (primary)
  - Más claro: Poca actividad (hsl(12 69% 85%))
  - Medio: Actividad moderada (hsl(12 69% 64%))
  - Más oscuro: Alta actividad (hsl(12 69% 48%))

**Escala de colores:**
- 0 reservas: Gris claro (--muted)
- 1-5 reservas: Primary claro (hsl(12 69% 85%))
- 6-15 reservas: Primary medio (hsl(12 69% 64%))
- 16-30 reservas: Primary (hsl(12 69% 48%))
- 31+ reservas: Primary oscuro (hsl(12 69% 38%))

**Interactividad:**
- Tooltip al hover: "Lunes 10:00 - 45 reservas"
- Click: Filtrar tabla por ese día/hora (opcional)

**Responsive:**
- Desktop/Tablet: Mostrar completo
- Móvil: Mostrar mensaje "Esta visualización solo está disponible en tablet y PC"

### 5. Tabla de Top Usuarios Rápidos

**Tipo:** Table (shadcn/ui)

**Columnas:**
1. Usuario (nombre completo)
2. Reservas Rápidas (número)
3. Total Reservas (número)
4. % Rápidas (porcentaje con badge)
5. Hora Promedio (HH:MM)

**Definición de "Reserva Rápida":**
- Configurable en `reservation_settings`
- Por defecto: Primeros 5 minutos después de desbloqueo
- Campo: `fast_reservation_threshold_minutes` (integer)

**Badge de "Power User":**
- Mostrar 🔥 si % Rápidas > 70%
- Color: Usar `--primary`

**Ordenamiento:**
- Por defecto: Por % Rápidas (descendente)
- Permitir ordenar por cualquier columna

**Límite:**
- Mostrar Top 10 por defecto
- Botón "Ver más" para expandir a Top 20

### 6. Exportación CSV

**Botón 1: "Exportar Top Usuarios"**
- Formato: CSV
- Contenido: Tabla de top usuarios
- Nombre archivo: `top-usuarios-rapidos-{fecha}.csv`

**Columnas CSV:**
```csv
Usuario,Email,Reservas Rápidas,Total Reservas,Porcentaje,Hora Promedio
Juan Pérez,juan@empresa.com,45,50,90%,10:02
María García,maria@empresa.com,38,60,63%,10:05
```

**Botón 2: "Exportar Todas las Reservas"**
- Formato: CSV
- Contenido: Todas las reservas del periodo filtrado
- Nombre archivo: `reservas-{fecha-inicio}-{fecha-fin}.csv`

**Columnas CSV:**
```csv
Fecha Reserva,Hora Reserva,Usuario,Email,Grupo,Plaza,Tiempo desde Desbloqueo
2025-11-15,10:02:34,Juan Pérez,juan@empresa.com,Planta -1,A-15,2min 34seg
2025-11-15,10:05:12,María García,maria@empresa.com,Planta -1,B-23,5min 12seg
```

## Requisitos No Funcionales

### Responsive Design

**Desktop (>1024px):**
- Layout completo en 2 columnas
- Stats cards en fila de 4
- Gráficas lado a lado
- Tabla completa

**Tablet (768px - 1024px):**
- Layout en 1 columna
- Stats cards en grid 2x2
- Gráficas apiladas
- Tabla con scroll horizontal
- Heatmap visible

**Móvil (<768px):**
- Layout en 1 columna
- Stats cards en grid 2x2
- Gráficas apiladas con scroll horizontal
- Tabla con scroll horizontal
- **Heatmap oculto** con mensaje:
  ```
  📱 Esta visualización solo está disponible en tablet y PC
  ```

### Performance

- Cachear datos de estadísticas (5 minutos)
- Lazy loading de gráficas
- Debounce en filtros (500ms)
- Skeleton loaders mientras carga

### Accesibilidad

- Todas las gráficas con `aria-label`
- Tooltips accesibles por teclado
- Contraste de colores WCAG AA
- Navegación por teclado en tabla

## Queries SQL Necesarias

### 1. Stats Generales

```sql
-- Total de reservas
SELECT COUNT(*) as total_reservations
FROM reservations
WHERE created_at >= :start_date 
  AND created_at <= :end_date
  AND (:group_id IS NULL OR parking_spot_id IN (
    SELECT id FROM parking_spots WHERE group_id = :group_id
  ));

-- Tiempo promedio de primera reserva
-- (Asumiendo que el desbloqueo es a las 10:00)
SELECT AVG(
  EXTRACT(EPOCH FROM (created_at - DATE_TRUNC('day', created_at) - INTERVAL '10 hours'))
) / 60 as avg_minutes
FROM reservations
WHERE created_at >= :start_date 
  AND created_at <= :end_date
  AND EXTRACT(HOUR FROM created_at) >= 10
  AND EXTRACT(HOUR FROM created_at) < 12;

-- Hora pico
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as count
FROM reservations
WHERE created_at >= :start_date 
  AND created_at <= :end_date
GROUP BY hour
ORDER BY count DESC
LIMIT 1;

-- Usuario más rápido
SELECT 
  p.full_name,
  MIN(EXTRACT(EPOCH FROM (r.created_at - DATE_TRUNC('day', r.created_at) - INTERVAL '10 hours'))) / 60 as fastest_minutes
FROM reservations r
JOIN profiles p ON p.id = r.user_id
WHERE r.created_at >= :start_date 
  AND r.created_at <= :end_date
  AND EXTRACT(HOUR FROM r.created_at) = 10
GROUP BY r.user_id, p.full_name
ORDER BY fastest_minutes ASC
LIMIT 1;
```

### 2. Actividad por Hora

```sql
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as reservations
FROM reservations
WHERE created_at >= :start_date 
  AND created_at <= :end_date
  AND (:group_id IS NULL OR parking_spot_id IN (
    SELECT id FROM parking_spots WHERE group_id = :group_id
  ))
GROUP BY hour
ORDER BY hour;
```

### 3. Heatmap (Día x Hora)

```sql
SELECT 
  EXTRACT(DOW FROM created_at) as day_of_week, -- 0=Sunday, 6=Saturday
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as count
FROM reservations
WHERE created_at >= :start_date 
  AND created_at <= :end_date
  AND (:group_id IS NULL OR parking_spot_id IN (
    SELECT id FROM parking_spots WHERE group_id = :group_id
  ))
GROUP BY day_of_week, hour
ORDER BY day_of_week, hour;
```

### 4. Top Usuarios Rápidos

```sql
WITH fast_threshold AS (
  SELECT COALESCE(fast_reservation_threshold_minutes, 5) as threshold
  FROM reservation_settings
  LIMIT 1
),
unlock_time AS (
  SELECT COALESCE(
    EXTRACT(HOUR FROM unlock_time), 
    10
  ) as hour
  FROM reservation_settings
  LIMIT 1
),
user_stats AS (
  SELECT 
    r.user_id,
    p.full_name,
    p.email,
    COUNT(*) as total_reservations,
    COUNT(*) FILTER (
      WHERE EXTRACT(HOUR FROM r.created_at) = (SELECT hour FROM unlock_time)
        AND EXTRACT(MINUTE FROM r.created_at) <= (SELECT threshold FROM fast_threshold)
    ) as fast_reservations,
    AVG(
      EXTRACT(EPOCH FROM (
        r.created_at - DATE_TRUNC('day', r.created_at) - 
        INTERVAL '1 hour' * (SELECT hour FROM unlock_time)
      ))
    ) FILTER (
      WHERE EXTRACT(HOUR FROM r.created_at) = (SELECT hour FROM unlock_time)
    ) / 60 as avg_minutes
  FROM reservations r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.created_at >= :start_date 
    AND r.created_at <= :end_date
    AND (:group_id IS NULL OR r.parking_spot_id IN (
      SELECT id FROM parking_spots WHERE group_id = :group_id
    ))
  GROUP BY r.user_id, p.full_name, p.email
  HAVING COUNT(*) > 0
)
SELECT 
  full_name,
  email,
  fast_reservations,
  total_reservations,
  ROUND((fast_reservations::numeric / total_reservations * 100), 1) as percentage,
  ROUND(avg_minutes, 1) as avg_minutes
FROM user_stats
ORDER BY percentage DESC, fast_reservations DESC
LIMIT 20;
```

## Migración de Base de Datos

### Añadir campo a `reservation_settings`

```sql
ALTER TABLE reservation_settings
ADD COLUMN IF NOT EXISTS fast_reservation_threshold_minutes INTEGER DEFAULT 5;

COMMENT ON COLUMN reservation_settings.fast_reservation_threshold_minutes IS 
'Umbral en minutos para considerar una reserva como "rápida" después del desbloqueo';
```

## Componentes a Crear

### Estructura de Archivos

```
src/
├── components/
│   └── admin/
│       └── check-in-stats/
│           ├── CheckInStats.tsx              # Componente principal
│           ├── StatsFilters.tsx              # Filtros (grupo, fecha, export)
│           ├── StatsCards.tsx                # 4 cards de métricas
│           ├── ActivityByHourChart.tsx       # Bar chart
│           ├── ActivityHeatmap.tsx           # Heatmap custom
│           ├── TopUsersTable.tsx             # Tabla de top usuarios
│           └── MobileHeatmapPlaceholder.tsx  # Mensaje para móvil
├── hooks/
│   └── admin/
│       └── useCheckInStats.ts                # Hook para datos
└── types/
    └── admin/
        └── check-in-stats.ts                 # Tipos TypeScript
```

## Tecnologías

- **Charts:** shadcn/ui Chart components (Recharts)
- **Tables:** shadcn/ui Table
- **Filters:** shadcn/ui Select, Date Picker
- **Export:** papaparse o custom CSV generator
- **Icons:** lucide-react
- **Colores:** CSS variables del branding

## Criterios de Aceptación

- [ ] Dashboard visible en Admin Panel → Check-in → Estadísticas
- [ ] Filtros funcionan correctamente (grupo + fecha)
- [ ] Stats cards muestran datos correctos
- [ ] Bar chart muestra actividad por hora
- [ ] Heatmap muestra actividad por día/hora (solo tablet/PC)
- [ ] Tabla muestra top 10 usuarios rápidos
- [ ] Badge 🔥 aparece en usuarios con >70% rápidas
- [ ] Exportar CSV de top usuarios funciona
- [ ] Exportar CSV de todas las reservas funciona
- [ ] Responsive en móvil, tablet y desktop
- [ ] Mensaje de heatmap en móvil
- [ ] Loading states con skeletons
- [ ] Colores del branding aplicados correctamente

## Notas Técnicas

- Usar `useRef` para cachear datos (patrón de admin hooks)
- Debounce en filtros para evitar queries excesivas
- Lazy loading de gráficas pesadas
- Memoizar cálculos complejos con `useMemo`
- Exportar CSV en cliente (no servidor)
