# Implementation Plan - Mejoras del Editor Visual de Plazas

## Task Overview

Este plan de implementación transforma el Editor Visual en una herramienta profesional mediante tareas incrementales que construyen sobre la funcionalidad existente. Cada tarea es independiente pero se integra con las anteriores para crear una experiencia cohesiva.

**Total de Tareas**: 29 (24 core + 5 opcionales)
**Tareas Core**: 1-24 (implementación de funcionalidades)
**Tareas Opcionales**: 25-29 (testing y documentación, marcadas con *)

## Resumen Ejecutivo

El editor visual actual es funcional pero básico. Este plan lo transforma en una herramienta profesional con:

1. **Modularización** (Tareas 2-5): Separar componentes para mejor mantenibilidad
2. **Visualización Mejorada** (Tareas 10-12): Sistema de colores por atributos
3. **Controles Avanzados** (Tareas 6-9): Slider, herramienta mano, bloqueo de canvas
4. **Interactividad** (Tareas 13-15): Preview fantasma, drag & drop de plazas
5. **Validaciones** (Tarea 16): Límite de plazas con feedback claro
6. **UX Profesional** (Tareas 17-21): Indicadores visuales, ayuda contextual
7. **Optimización** (Tareas 22-24): Performance y gestión de estado

**Dependencias Críticas**:
- Tarea 1 debe completarse PRIMERO (migración DB) - el código actual falla silenciosamente
- Tareas 2-5 deben completarse antes de tareas complejas (modularización necesaria)
- Tarea 10 debe completarse antes de tarea 12 (lógica de colores antes de aplicarla)
- Tarea 24 debe completarse antes de tareas que usen nuevos estados (hook refactorizado)

**Enfoque Recomendado**:
1. Empezar con Phase 1 (fundamentos) - especialmente tarea 1
2. Continuar con Phase 2 (modularización) - reducir complejidad del componente principal
3. Implementar Phase 4 (visualización) - mejora visual inmediata
4. Agregar Phases 3, 5, 6 (controles e interactividad) - funcionalidades avanzadas
5. Finalizar con Phases 7, 8 (UX y optimización) - pulido final
6. Testing y documentación (Phase 9, 10) solo si se solicita explícitamente

**Estado Actual del Código:**
- ✅ Componente `VisualEditorTab` básico implementado (240 líneas)
- ✅ Hook `useVisualEditor` con funcionalidad básica (crear, editar, eliminar plazas)
- ✅ Modo dibujo básico funcional con toggle button
- ✅ Selector de tamaño de botón (16-64px) con Select - necesita cambiar a Slider
- ✅ Zoom/pan con react-zoom-pan-pinch ya integrado
- ✅ Componente `SpotAttributesDialog` para editar atributos
- ❌ NO existe columna `button_size` en `parking_groups` (el hook la usa pero falla silenciosamente)
- ❌ NO hay componentes modulares (VisualEditorTab tiene 240 líneas, necesita refactorización)
- ❌ NO hay panel lateral con estadísticas, leyenda ni herramientas
- ❌ NO hay sistema de colores por atributos (usa rings azul/verde/amarillo)
- ❌ NO hay herramienta mano ni bloqueo de canvas
- ❌ NO hay preview fantasma ni drag & drop de plazas
- ❌ NO hay restricción para móviles
- ❌ NO hay sistema de ayuda contextual

**Prioridades de Implementación:**
1. **Crítico**: Migración de DB (tarea 1) - el código actual falla al guardar button_size
2. **Alto**: Modularización (tareas 2-5) - componente muy grande
3. **Alto**: Sistema de colores (tareas 10-12) - mejora visual importante
4. **Medio**: Controles avanzados (tareas 6-9, 13-15) - UX profesional
5. **Bajo**: Testing y documentación (tareas 25-29) - opcional

---

## Phase 1: Fundamentos y Estructura

- [x] 1. Preparar Base de Datos y Tipos
  - Crear migración para agregar columna `button_size` a `parking_groups` con constraint 12-64px y default 32
  - Actualizar tipos en `src/types/admin/parking-spots.types.ts` para incluir `EditorTools`, `EditorStats`, `GhostPreview`, `DragState`, `CanvasState`
  - Regenerar tipos de Supabase con `supabase gen types typescript --linked`
  - _Requirements: 5.6, 5.7, 7.1_

- [x] 2. Crear Componente de Restricción Móvil
  - Crear `src/components/admin/visual-editor/MobileRestrictionMessage.tsx`
  - Detectar ancho de pantalla < 768px usando hook personalizado o media query
  - Mostrar mensaje amigable con icono de monitor/tablet (usar lucide-react)
  - Incluir botón para volver al panel admin (usar react-router navigate)
  - Agregar lógica condicional en `VisualEditorTab` para mostrar mensaje o editor según tamaño de pantalla
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

---

## Phase 2: Panel Lateral y Estadísticas

- [x] 3. Crear Panel de Estadísticas
  - Crear `src/components/admin/visual-editor/StatsPanel.tsx`
  - Implementar función `calculateStats` para contar plazas y atributos
  - Mostrar contador "X / Y plazas" con badge
  - Mostrar barra de progreso con porcentaje
  - Mostrar desglose de atributos (♿ accesibles, 🔌 cargadores, 📏 compactas)
  - Agregar alerta visual cuando se alcance 90% del límite
  - Agregar alerta destructiva cuando se alcance 100%
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 4. Crear Panel de Leyenda
  - Crear `src/components/admin/visual-editor/LegendPanel.tsx`
  - Definir colores para cada atributo (azul: accesible, verde: cargador, amarillo: compacta, primary: estándar)
  - Mostrar ejemplos visuales de plazas con un atributo
  - Mostrar ejemplo de plaza con múltiples atributos (colores divididos)
  - Agregar hover effect para resaltar plazas correspondientes en el plano
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 5. Crear Panel Lateral Completo
  - Crear `src/components/admin/visual-editor/EditorSidebar.tsx`
  - Organizar en secciones: Estadísticas, Herramientas, Leyenda
  - Implementar layout con scroll interno si es necesario
  - Posicionar a la derecha del canvas con ancho fijo (320px)
  - Aplicar estilos consistentes con el resto de la aplicación
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

---

## Phase 3: Controles y Herramientas

- [x] 6. Implementar Slider de Tamaño con Preview en Tiempo Real
  - Reemplazar Select por Slider de shadcn/ui en `EditorSidebar` con rango 12-64px, step 4px
  - Mostrar valor actual en px junto al slider con Label
  - El estado `spotButtonSize` ya se actualiza inmediatamente (mantener comportamiento)
  - Implementar debounce (300ms) en `updateButtonSize` del hook para reducir llamadas a DB
  - Las plazas ya se actualizan en tiempo real (mantener comportamiento actual)
  - El preview fantasma se implementará en tarea posterior
  - El tamaño ya se carga al seleccionar grupo (mantener comportamiento)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 7. Implementar Sistema de Bloqueo/Desbloqueo de Canvas
  - Agregar estado `isCanvasLocked` al hook `useVisualEditor`
  - Crear botón toggle en `EditorSidebar` con icono de candado
  - Mostrar indicador visual claro del estado (bloqueado/desbloqueado)
  - Implementar lógica: desbloqueado = scroll normal, bloqueado = zoom con scroll
  - Permitir pan/arrastre del plano cuando está bloqueado
  - Guardar estado en sessionStorage para persistir durante sesión
  - Agregar listener para tecla Escape que desbloquea automáticamente
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 8. Implementar Herramienta Mano
  - Agregar estado `isHandToolActive` al hook `useVisualEditor`
  - Crear botón toggle en `EditorSidebar` con icono de mano
  - Cambiar cursor a `cursor-grab` cuando está activa
  - Deshabilitar creación y selección de plazas cuando está activa
  - Permitir desactivar con clic en botón o tecla Escape
  - Mantener activa hasta desactivación explícita
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 9. Implementar Toggle de Modo Dibujo Mejorado
  - Mover botón actual de `VisualEditorTab` a `EditorSidebar` en sección Herramientas
  - Ya tiene estilo destacado cuando activo (variant="default") - mantener
  - Deshabilitar automáticamente cuando se alcance límite de plazas (coordinar con tarea 16)
  - Mostrar notificación la primera vez que se activa usando localStorage key "visual-editor-first-draw"
  - Agregar Tooltip de shadcn/ui con texto explicativo
  - _Requirements: 2.5, 7.2, 7.3_

---

## Phase 4: Visualización de Plazas

- [x] 10. Implementar Lógica de Colores para Atributos
  - Crear archivo `src/lib/spotColors.ts` con funciones de utilidad
  - Crear función `getSpotColors(spot: ParkingSpot): string[]` que retorna array de colores
  - Mapear atributos a colores: accesible=azul (#3b82f6), cargador=verde (#22c55e), compacta=amarillo (#eab308), estándar=primary
  - Crear función `getSpotBackground(colors: string[]): string` que genera CSS
  - Un atributo: color sólido
  - Dos atributos: `linear-gradient(90deg, color1 50%, color2 50%)`
  - Tres atributos: `linear-gradient(90deg, color1 33.33%, color2 33.33% 66.66%, color3 66.66%)`
  - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [x] 11. Implementar Ajuste Automático de Fuente
  - Crear función `getFontSize(spotNumber: string, buttonSize: number): number`
  - Tamaño base: 40% del tamaño del botón
  - Reducir a 80% si número tiene más de 4 caracteres
  - Reducir a 60% si número tiene más de 6 caracteres
  - Aplicar en componente `DraggableSpot`
  - _Requirements: 1.2, 5.5_

- [x] 12. Refactorizar Componente de Plaza con Nuevos Estilos
  - Crear `src/components/admin/visual-editor/DraggableSpot.tsx` extrayendo el botón actual de `VisualEditorTab`
  - Aplicar colores usando `getSpotBackground(getSpotColors(spot))` en lugar de rings
  - Ya muestra solo número de plaza (mantener comportamiento)
  - Ya está centrado (mantener comportamiento)
  - Aplicar tamaño de fuente dinámico con `getFontSize` (crear función en spotColors.ts)
  - Mantener hover effects actuales (scale-110) y agregar transiciones suaves
  - Pasar props necesarias: spot, size, onClick, isDrawingMode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

---

## Phase 5: Interactividad Avanzada

- [x] 13. Implementar Preview Fantasma en Modo Dibujo
  - Agregar estado `ghostPosition: { x: number; y: number } | null` al hook
  - Capturar movimiento del mouse sobre el plano cuando modo dibujo está activo
  - Calcular posición relativa (porcentaje) del cursor
  - Renderizar div fantasma con estilos: `bg-primary/30`, `border-2 border-primary border-dashed`, `animate-pulse`
  - Usar tamaño actual del slider
  - Ocultar cuando modo dibujo está desactivado
  - Agregar `pointer-events-none` para no interferir con clics
  - _Requirements: 13.1, 13.2, 13.5_

- [x] 14. Implementar Drag & Drop para Mover Plazas
  - Agregar estado `dragState: DragState` al hook
  - Implementar `handleMouseDown` en `DraggableSpot` (solo si no está en modo dibujo ni herramienta mano)
  - Implementar `handleMouseMove` para actualizar posición durante arrastre
  - Mostrar sombra o indicador en posición original
  - Aplicar estilo visual diferente durante arrastre (opacity, scale)
  - Implementar `handleMouseUp` para guardar nueva posición en base de datos
  - Si fallo al guardar, revertir a posición original y mostrar error
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

- [x] 15. Separar Edición de Atributos del Movimiento
  - Implementar lógica de detección: si mouse se mueve > 5px = drag, si no = click
  - Usar timer de 150ms para diferenciar click de drag start
  - Abrir `SpotAttributesDialog` solo en click simple
  - Prevenir apertura de diálogo durante o después de drag
  - _Requirements: 3.5_

- [x] 16. Implementar Validación de Límite de Plazas
  - Agregar validación en `createSpot` del hook: verificar `spots.length >= selectedGroup.capacity` antes de crear
  - Mostrar toast error con mensaje claro: "Límite alcanzado: X plazas máximo"
  - Deshabilitar modo dibujo automáticamente cuando se alcance límite
  - Mostrar alerta en `StatsPanel` cuando se alcance límite (usar Alert de shadcn/ui)
  - Reactivar modo dibujo automáticamente cuando se elimine una plaza y haya espacio
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

---

## Phase 6: Feedback Visual y UX

- [x] 17. Implementar Indicador de Modo Edición (Magic Border)
  - Crear clase CSS `.editor-canvas-active` con pseudo-elemento `::before`
  - Implementar animación de gradiente con keyframes `@keyframes magic-border`
  - Usar color primary de RESERVEO
  - Aplicar animación sutil (3s linear infinite)
  - Agregar/remover clase según estado de `isDrawingMode`
  - Asegurar que no afecte el layout (position absolute, inset -2px)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 18. Implementar Animación de Confirmación al Crear Plaza
  - Agregar animación de "pop" a la plaza recién creada
  - Usar keyframes: scale(0) → scale(1.2) → scale(1)
  - Duración: 300ms con easing ease-out
  - Aplicar solo a la última plaza creada
  - _Requirements: 13.3_

- [x] 19. Mejorar Mensajes de Error
  - Error al crear plaza: mostrar razón específica (límite, sin grupo, etc.)
  - Error al mover plaza: mostrar mensaje y revertir posición
  - Error al guardar tamaño: mostrar mensaje pero mantener cambio visual
  - Error al cargar plano: mostrar mensaje con sugerencia de subir imagen
  - Usar toast.error con mensajes claros y accionables
  - _Requirements: 13.4_

---

## Phase 7: Sistema de Ayuda

- [x] 20. Crear Diálogo de Ayuda Contextual
  - Crear `src/components/admin/visual-editor/HelpDialog.tsx`
  - Definir secciones de ayuda: Modo Dibujo, Mover Plazas, Editar Atributos, Navegación
  - Incluir iconos, títulos, descripciones y tips para cada sección
  - Agregar botón de ayuda en header del editor (icono de interrogación)
  - Implementar tracking de primera visita con localStorage
  - Mostrar automáticamente en primera visita
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 21. Implementar Tooltips en Controles
  - Tooltip en botón modo dibujo: "Activa para crear plazas haciendo clic en el plano"
  - Tooltip en herramienta mano: "Navega por el plano sin interactuar con plazas"
  - Tooltip en bloqueo canvas: "Bloquea para hacer zoom con scroll"
  - Tooltip en slider tamaño: "Ajusta el tamaño de los botones de plaza"
  - Tooltip en controles de zoom: "Zoom in/out/reset"
  - Usar componente `Tooltip` de shadcn/ui
  - _Requirements: 2.4_

---

## Phase 8: Optimización y Pulido

- [x] 22. Implementar Optimizaciones de Performance
  - Memoizar componente `DraggableSpot` con `React.memo`
  - Implementar comparación personalizada para evitar re-renders innecesarios
  - Aplicar debounce (300ms) al slider de tamaño para reducir actualizaciones de DB
  - Lazy load de imagen del plano con `loading="lazy"`
  - Agregar `decoding="async"` a imagen del plano
  - _Requirements: Performance considerations del diseño_

- [x] 23. Implementar Gestión de Estado de Sesión
  - Guardar estado de bloqueo canvas en sessionStorage
  - Guardar estado de herramienta mano en sessionStorage
  - Guardar flag de "ayuda vista" en localStorage
  - Restaurar estados al recargar página
  - Limpiar sessionStorage al cerrar sesión
  - _Requirements: 4.7_

- [x] 24. Refactorizar Hook useVisualEditor
  - Agregar estados: `isHandToolActive`, `isCanvasLocked`, `ghostPosition: {x, y} | null`, `dragState`
  - Agregar funciones: `updateSpotPosition(spotId, x, y)`, `toggleHandTool()`, `toggleCanvasLock()`
  - La validación de límite se implementa en tarea 16 (modificar createSpot existente)
  - Mantener todas las funciones existentes sin cambios (compatibilidad)
  - Actualizar JSDoc comments del hook con nuevas funcionalidades
  - _Requirements: Todos los relacionados con state management_

---

## Phase 9: Testing y Validación

- [ ]* 25. Crear Tests Unitarios para Lógica de Colores
  - Test: `getSpotColors` retorna color primary para plaza estándar
  - Test: `getSpotColors` retorna array de 2 colores para plaza con 2 atributos
  - Test: `getSpotColors` retorna array de 3 colores para plaza con 3 atributos
  - Test: `getSpotBackground` genera CSS correcto para 1, 2 y 3 colores
  - Test: `getFontSize` ajusta tamaño según longitud de número
  - _Requirements: Testing strategy del diseño_

- [ ]* 26. Crear Tests Unitarios para Cálculo de Estadísticas
  - Test: `calculateStats` calcula porcentaje correcto
  - Test: `calculateStats` cuenta atributos correctamente
  - Test: `calculateStats` maneja array vacío
  - Test: `calculateStats` maneja límite alcanzado
  - _Requirements: Testing strategy del diseño_

- [ ]* 27. Validación Manual Completa
  - Verificar creación de plaza en modo dibujo
  - Verificar movimiento de plaza con drag & drop
  - Verificar edición de atributos
  - Verificar eliminación de plaza
  - Verificar cambio de tamaño con slider
  - Verificar herramienta mano
  - Verificar bloqueo/desbloqueo de canvas
  - Verificar zoom con scroll (bloqueado)
  - Verificar scroll normal (desbloqueado)
  - Verificar estadísticas en tiempo real
  - Verificar límite de plazas
  - Verificar leyenda
  - Verificar ayuda
  - Verificar en tablet (768px+)
  - Verificar mensaje en móvil (< 768px)
  - Verificar colores de atributos
  - Verificar colores múltiples
  - Verificar preview fantasma
  - _Requirements: Manual testing checklist del diseño_

---

## Phase 10: Documentación y Deployment

- [ ]* 28. Actualizar Documentación
  - Actualizar README del proyecto con nuevas features del editor visual
  - Crear guía de usuario para el editor visual mejorado si se solicita
  - Los componentes ya tienen JSDoc (mantener y actualizar según necesidad)
  - Actualizar steering rules si es necesario
  - Crear changelog con todas las mejoras si se solicita
  - _Requirements: N/A (documentación)_

- [ ]* 29. Preparar Migración y Rollout
  - Verificar que migración de DB se ejecutó correctamente con MCP tools
  - Confirmar que valores por defecto (32px) se aplicaron a grupos existentes
  - El usuario debe realizar backup de datos antes de deployment
  - Preparar plan de rollback: revertir migración si hay problemas
  - El usuario debe comunicar cambios a usuarios administradores
  - _Requirements: Migration strategy del diseño_

---

## Notes

- **Orden de Implementación**: Las tareas están ordenadas para construir funcionalidad de forma incremental
- **Testing**: Los tests marcados con * son opcionales - enfocarse en funcionalidad core primero
- **Commits**: Hacer commit después de cada tarea completada con mensaje descriptivo en formato conventional commits
- **Code Review**: Revisar código antes de merge, especialmente en tareas de interactividad (drag & drop)
- **Performance**: Monitorear performance después de cada fase, especialmente con 50+ plazas
- **Modularización**: Priorizar separación de componentes (tareas 2-5) antes de agregar funcionalidades complejas
- **Base de Datos**: La tarea 1 es CRÍTICA - el código actual intenta usar `button_size` pero la columna no existe
- **Compatibilidad**: Mantener compatibilidad con código existente al refactorizar el hook (tarea 24)
