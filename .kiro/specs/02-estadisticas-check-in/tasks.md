# 02 - Dashboard de Estadísticas de Check-in - Tareas

## Estado: 🟡 Pendiente

---

## Fase 1: Setup y Migración de Base de Datos

### ✅ Tarea 1.1: Migración - Campo de umbral rápido
**Archivo:** `supabase/migrations/20251115113541_add_fast_reservation_threshold.sql`

**Descripción:**
- Añadir campo `fast_reservation_threshold_minutes` a `reservation_settings`
- Valor por defecto: 5 minutos
- Comentario descriptivo

**Criterios:**
- [x] Migración creada
- [x] Campo añadido con default correcto
- [x] Comentario SQL añadido
- [x] Migración aplicada con `supabase db push`
- [x] Tipos regenerados

---

## Fase 2: Tipos TypeScript

### ✅ Tarea 2.1: Definir tipos de estadísticas
**Archivo:** `src/types/admin/check-in-stats.ts`

**Descripción:**
Crear interfaces para:
- `CheckInStatsFilters` (grupo, fechas)
- `StatsCardData` (métricas clave)
- `ActivityByHourData` (datos del bar chart)
- `HeatmapData` (datos del heatmap)
- `TopUserData` (datos de usuarios rápidos)
- `ExportData` (datos para CSV)

**Criterios:**
- [x] Archivo creado
- [x] Todas las interfaces definidas
- [x] Tipos exportados correctamente
- [x] Documentación JSDoc en interfaces complejas

---

## Fase 3: Queries y Hook de Datos

### ✅ Tarea 3.1: Hook de estadísticas
**Archivo:** `src/hooks/admin/useCheckInStats.ts`

**Descripción:**
Crear hook con:
- `loadStats(filters)` - Cargar todas las estadísticas
- `exportTopUsers()` - Exportar CSV de top usuarios
- `exportAllReservations()` - Exportar CSV de todas las reservas
- Cache con `useRef` (patrón admin)
- Loading states
- Error handling

**Queries SQL:**
1. Stats generales (4 métricas)
2. Actividad por hora
3. Heatmap (día x hora)
4. Top usuarios rápidos

**Criterios:**
- [x] Hook creado con todas las funciones
- [x] Queries SQL implementadas (funciones en migración 20251115113834)
- [x] Cache funcionando correctamente
- [x] Loading y error states
- [x] Toast notifications en errores
- [x] Exportación CSV funcional

---

## Fase 4: Componentes UI

### ✅ Tarea 4.1: Instalar componente Chart de shadcn
**Comando:** `npx shadcn@latest add chart`

**Criterios:**
- [ ] Componente instalado
- [ ] CSS variables de charts añadidas
- [ ] Verificar que funciona con ejemplo básico

---

### ✅ Tarea 4.2: Componente de Filtros
**Archivo:** `src/components/admin/check-in-stats/StatsFilters.tsx`

**Descripción:**
Crear filtros con:
- Select de grupo (incluir "Todos")
- Date range picker (rangos predefinidos)
- 2 botones de exportación CSV

**Criterios:**
- [ ] Componente creado
- [ ] Select de grupos funcional
- [ ] Date picker con rangos predefinidos
- [ ] Botones de exportación
- [ ] Responsive (stack en móvil)
- [ ] Debounce en cambios (500ms)

---

### ✅ Tarea 4.3: Stats Cards
**Archivo:** `src/components/admin/check-in-stats/StatsCards.tsx`

**Descripción:**
4 cards con métricas:
1. Total reservas (🎯)
2. Tiempo promedio (⚡)
3. Hora pico (🔥)
4. Usuario más rápido (👤)

**Criterios:**
- [ ] Componente creado
- [ ] 4 cards con iconos correctos
- [ ] Formato de datos correcto
- [ ] Responsive (grid 2x2 en móvil, 4 en desktop)
- [ ] Skeleton loader
- [ ] Colores del branding

---

### ✅ Tarea 4.4: Bar Chart de Actividad por Hora
**Archivo:** `src/components/admin/check-in-stats/ActivityByHourChart.tsx`

**Descripción:**
Gráfica de barras con:
- Eje X: Horas (00-23)
- Eje Y: Número de reservas
- Tooltip personalizado
- Grid horizontal

**Criterios:**
- [ ] Componente creado con shadcn Chart
- [ ] Datos mapeados correctamente
- [ ] Tooltip funcional
- [ ] Colores del branding (--primary)
- [ ] Responsive (scroll horizontal en móvil)
- [ ] Skeleton loader
- [ ] Título y descripción

---

### ✅ Tarea 4.5: Heatmap de Actividad
**Archivo:** `src/components/admin/check-in-stats/ActivityHeatmap.tsx`

**Descripción:**
Heatmap custom con:
- Filas: Horas (00-23)
- Columnas: Días (Lun-Dom)
- Gradiente de colores del branding
- Tooltip al hover

**Criterios:**
- [ ] Componente creado
- [ ] Gradiente de colores correcto (primary claro → oscuro)
- [ ] Tooltip funcional
- [ ] Leyenda de colores
- [ ] Solo visible en tablet/desktop
- [ ] Skeleton loader

---

### ✅ Tarea 4.6: Placeholder de Heatmap para Móvil
**Archivo:** `src/components/admin/check-in-stats/MobileHeatmapPlaceholder.tsx`

**Descripción:**
Mensaje para móvil:
```
📱 Esta visualización solo está disponible en tablet y PC
```

**Criterios:**
- [ ] Componente creado
- [ ] Mensaje claro y amigable
- [ ] Icono apropiado
- [ ] Solo visible en móvil (<768px)
- [ ] Estilo consistente con el diseño

---

### ✅ Tarea 4.7: Tabla de Top Usuarios
**Archivo:** `src/components/admin/check-in-stats/TopUsersTable.tsx`

**Descripción:**
Tabla con:
- Columnas: Usuario, Reservas Rápidas, Total, %, Hora Promedio
- Badge 🔥 si % > 70%
- Ordenamiento por columnas
- Top 10 por defecto, expandible a 20

**Criterios:**
- [ ] Componente creado con shadcn Table
- [ ] Todas las columnas visibles
- [ ] Badge 🔥 funcional
- [ ] Ordenamiento funcional
- [ ] Botón "Ver más" funcional
- [ ] Responsive (scroll horizontal en móvil)
- [ ] Skeleton loader

---

### ✅ Tarea 4.8: Componente Principal
**Archivo:** `src/components/admin/check-in-stats/CheckInStats.tsx`

**Descripción:**
Orquestar todos los componentes:
- Layout responsive
- Gestión de estados
- Integración con hook
- Loading states

**Criterios:**
- [ ] Componente creado
- [ ] Todos los sub-componentes integrados
- [ ] Layout responsive correcto
- [ ] Loading states con skeletons
- [ ] Error handling con mensajes
- [ ] Filtros aplicados correctamente

---

## Fase 5: Integración en Admin Panel

### ✅ Tarea 5.1: Añadir pestaña en Check-in
**Archivo:** `src/pages/AdminCheckIn.tsx` (o similar)

**Descripción:**
- Añadir pestaña "Estadísticas"
- Integrar componente `CheckInStats`
- Mantener pestaña "Reservas" existente

**Criterios:**
- [ ] Pestaña añadida
- [ ] Navegación funcional
- [ ] Componente renderizado correctamente
- [ ] URL actualizada (opcional)

---

## Fase 6: Testing y Refinamiento

### ✅ Tarea 6.1: Testing Manual
**Descripción:**
Probar todos los casos:
- Filtros (grupo, fechas)
- Gráficas con datos reales
- Exportación CSV
- Responsive en móvil/tablet/desktop
- Loading states
- Error states

**Criterios:**
- [ ] Filtros funcionan correctamente
- [ ] Gráficas muestran datos correctos
- [ ] CSV se descarga correctamente
- [ ] Responsive funciona en todos los tamaños
- [ ] Loading states visibles
- [ ] Errores manejados correctamente

---

### ✅ Tarea 6.2: Optimización de Performance
**Descripción:**
- Verificar cache de datos
- Optimizar queries pesadas
- Lazy loading de gráficas
- Memoización de cálculos

**Criterios:**
- [ ] Cache funciona (no re-fetch innecesario)
- [ ] Queries optimizadas
- [ ] Gráficas cargan rápido
- [ ] No hay re-renders innecesarios

---

### ✅ Tarea 6.3: Accesibilidad
**Descripción:**
- Verificar aria-labels
- Navegación por teclado
- Contraste de colores
- Screen reader friendly

**Criterios:**
- [ ] Todas las gráficas tienen aria-label
- [ ] Navegación por teclado funciona
- [ ] Contraste WCAG AA cumplido
- [ ] Tooltips accesibles

---

## Fase 7: Documentación

### ✅ Tarea 7.1: Documentar componentes
**Descripción:**
- JSDoc en componentes principales
- README en carpeta de componentes
- Comentarios en queries complejas

**Criterios:**
- [ ] JSDoc añadido
- [ ] README creado
- [ ] Queries documentadas

---

## Resumen de Progreso

**Total de tareas:** 15
**Completadas:** 0
**En progreso:** 0
**Pendientes:** 15

---

## Notas de Implementación

### Orden Recomendado:
1. Migración y tipos (Fase 1-2)
2. Hook de datos (Fase 3)
3. Componentes UI de menor a mayor complejidad (Fase 4)
4. Integración (Fase 5)
5. Testing y refinamiento (Fase 6)
6. Documentación (Fase 7)

### Dependencias:
- shadcn/ui chart component
- Recharts (ya instalado)
- date-fns (ya instalado)
- papaparse (para CSV) o custom generator

### Tiempo Estimado:
- Fase 1-2: 30 min
- Fase 3: 1-2 horas
- Fase 4: 3-4 horas
- Fase 5: 30 min
- Fase 6: 1 hora
- Fase 7: 30 min

**Total:** ~6-8 horas
