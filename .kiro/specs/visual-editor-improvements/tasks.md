# Implementation Plan - Mejoras del Editor Visual de Plazas

## Task Overview

Este plan de implementación transforma el Editor Visual en una herramienta profesional mediante tareas incrementales que construyen sobre la funcionalidad existente. Cada tarea es independiente pero se integra con las anteriores para crear una experiencia cohesiva.

---

## Phase 1: Fundamentos y Estructura

### 1. Preparar Base de Datos y Tipos

Actualizar el esquema de base de datos y tipos TypeScript para soportar las nuevas funcionalidades.

- Crear migración para agregar columna `button_size` a `parking_groups` con constraint 12-64px
- Actualizar tipos en `src/types/admin/parking-spots.types.ts` para incluir `EditorTools`, `EditorStats`, `GhostPreview`, `DragState`, `CanvasState`
- Regenerar tipos de Supabase con `supabase gen types typescript --linked`
- _Requirements: 5.6, 5.7, 7.1_

### 2. Crear Componente de Restricción Móvil

Implementar mensaje informativo para dispositivos móviles.

- Crear `src/components/admin/visual-editor/MobileRestrictionMessage.tsx`
- Detectar ancho de pantalla < 768px
- Mostrar mensaje amigable con icono de monitor/tablet
- Incluir botón para volver al panel admin
- Agregar lógica condicional en `VisualEditorTab` para mostrar mensaje o editor
- _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

---

## Phase 2: Panel Lateral y Estadísticas

### 3. Crear Panel de Estadísticas

Implementar panel que muestra resumen en tiempo real de plazas creadas.

- Crear `src/components/admin/visual-editor/StatsPanel.tsx`
- Implementar función `calculateStats` para contar plazas y atributos
- Mostrar contador "X / Y plazas" con badge
- Mostrar barra de progreso con porcentaje
- Mostrar desglose de atributos (♿ accesibles, 🔌 cargadores, 📏 compactas)
- Agregar alerta visual cuando se alcance 90% del límite
- Agregar alerta destructiva cuando se alcance 100%
- _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

### 4. Crear Panel de Leyenda

Implementar leyenda visual de colores y atributos.

- Crear `src/components/admin/visual-editor/LegendPanel.tsx`
- Definir colores para cada atributo (azul: accesible, verde: cargador, amarillo: compacta, primary: estándar)
- Mostrar ejemplos visuales de plazas con un atributo
- Mostrar ejemplo de plaza con múltiples atributos (colores divididos)
- Agregar hover effect para resaltar plazas correspondientes en el plano
- _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

### 5. Crear Panel Lateral Completo

Integrar todos los paneles en un sidebar organizado.

- Crear `src/components/admin/visual-editor/EditorSidebar.tsx`
- Organizar en secciones: Estadísticas, Herramientas, Leyenda
- Implementar layout con scroll interno si es necesario
- Posicionar a la derecha del canvas con ancho fijo (320px)
- Aplicar estilos consistentes con el resto de la aplicación
- _Requirements: 10.1, 10.2, 10.4, 10.5_

---

## Phase 3: Controles y Herramientas

### 6. Implementar Slider de Tamaño con Preview en Tiempo Real

Crear control deslizante para ajustar tamaño de plazas desde 12px hasta 64px.

- Agregar slider en `EditorSidebar` con rango 12-64px, step 4px
- Mostrar valor actual en px junto al slider
- Actualizar estado local `spotButtonSize` inmediatamente al mover slider
- Implementar debounce (300ms) para guardar en base de datos
- Actualizar todas las plazas existentes en el plano en tiempo real
- Actualizar preview fantasma si modo dibujo está activo
- Cargar tamaño guardado al seleccionar grupo diferente
- _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

### 7. Implementar Sistema de Bloqueo/Desbloqueo de Canvas

Crear toggle para controlar comportamiento de scroll vs zoom.

- Agregar estado `isCanvasLocked` al hook `useVisualEditor`
- Crear botón toggle en `EditorSidebar` con icono de candado
- Mostrar indicador visual claro del estado (bloqueado/desbloqueado)
- Implementar lógica: desbloqueado = scroll normal, bloqueado = zoom con scroll
- Permitir pan/arrastre del plano cuando está bloqueado
- Guardar estado en sessionStorage para persistir durante sesión
- Agregar listener para tecla Escape que desbloquea automáticamente
- _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

### 8. Implementar Herramienta Mano

Crear herramienta para navegar por el plano sin interactuar con plazas.

- Agregar estado `isHandToolActive` al hook `useVisualEditor`
- Crear botón toggle en `EditorSidebar` con icono de mano
- Cambiar cursor a `cursor-grab` cuando está activa
- Deshabilitar creación y selección de plazas cuando está activa
- Permitir desactivar con clic en botón o tecla Escape
- Mantener activa hasta desactivación explícita
- _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

### 9. Implementar Toggle de Modo Dibujo Mejorado

Mejorar el botón de modo dibujo con feedback visual claro.

- Mover botón a `EditorSidebar` en sección Herramientas
- Aplicar estilo destacado cuando está activo (variant="default")
- Deshabilitar automáticamente cuando se alcance límite de plazas
- Mostrar notificación la primera vez que se activa (usar localStorage para tracking)
- Agregar tooltip explicativo
- _Requirements: 2.5, 7.2, 7.3_

---

## Phase 4: Visualización de Plazas

### 10. Implementar Lógica de Colores para Atributos

Crear sistema de colores que refleje los atributos de cada plaza.

- Crear función `getSpotColors(spot: ParkingSpot): string[]` en utils
- Mapear atributos a colores: accesible=azul, cargador=verde, compacta=amarillo, estándar=primary
- Crear función `getSpotBackground(colors: string[]): string` que genera CSS
- Un atributo: color sólido
- Dos atributos: `linear-gradient(90deg, color1 50%, color2 50%)`
- Tres atributos: `linear-gradient(90deg, color1 33.33%, color2 33.33% 66.66%, color3 66.66%)`
- _Requirements: 1.3, 1.4, 1.5, 1.6_

### 11. Implementar Ajuste Automático de Fuente

Crear lógica para ajustar tamaño de fuente según tamaño de botón y longitud de número.

- Crear función `getFontSize(spotNumber: string, buttonSize: number): number`
- Tamaño base: 40% del tamaño del botón
- Reducir a 80% si número tiene más de 4 caracteres
- Reducir a 60% si número tiene más de 6 caracteres
- Aplicar en componente `DraggableSpot`
- _Requirements: 1.2, 5.5_

### 12. Refactorizar Componente de Plaza con Nuevos Estilos

Actualizar renderizado de plazas para usar nuevo sistema de colores.

- Crear `src/components/admin/visual-editor/DraggableSpot.tsx` (separar del componente principal)
- Aplicar colores usando `getSpotBackground(getSpotColors(spot))`
- Mostrar solo número de plaza, sin iconos ni texto adicional
- Centrar número vertical y horizontalmente
- Aplicar tamaño de fuente dinámico con `getFontSize`
- Mantener hover effects y transiciones suaves
- _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

---

## Phase 5: Interactividad Avanzada

### 13. Implementar Preview Fantasma en Modo Dibujo

Mostrar preview de plaza antes de crearla.

- Agregar estado `ghostPosition: { x: number; y: number } | null` al hook
- Capturar movimiento del mouse sobre el plano cuando modo dibujo está activo
- Calcular posición relativa (porcentaje) del cursor
- Renderizar div fantasma con estilos: `bg-primary/30`, `border-2 border-primary border-dashed`, `animate-pulse`
- Usar tamaño actual del slider
- Ocultar cuando modo dibujo está desactivado
- Agregar `pointer-events-none` para no interferir con clics
- _Requirements: 13.1, 13.2, 13.5_

### 14. Implementar Drag & Drop para Mover Plazas

Permitir arrastrar plazas existentes a nuevas posiciones.

- Agregar estado `dragState: DragState` al hook
- Implementar `handleMouseDown` en `DraggableSpot` (solo si no está en modo dibujo ni herramienta mano)
- Implementar `handleMouseMove` para actualizar posición durante arrastre
- Mostrar sombra o indicador en posición original
- Aplicar estilo visual diferente durante arrastre (opacity, scale)
- Implementar `handleMouseUp` para guardar nueva posición en base de datos
- Si fallo al guardar, revertir a posición original y mostrar error
- _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

### 15. Separar Edición de Atributos del Movimiento

Asegurar que clic simple abre diálogo de edición, no inicia arrastre.

- Implementar lógica de detección: si mouse se mueve > 5px = drag, si no = click
- Usar timer de 150ms para diferenciar click de drag start
- Abrir `SpotAttributesDialog` solo en click simple
- Prevenir apertura de diálogo durante o después de drag
- _Requirements: 3.5_

### 16. Implementar Validación de Límite de Plazas

Prevenir creación de plazas cuando se alcance el límite.

- Verificar `spots.length >= selectedGroup.max_spots` antes de crear plaza
- Mostrar toast error con mensaje claro del límite
- Deshabilitar modo dibujo automáticamente
- Mostrar alerta en `StatsPanel` cuando se alcance límite
- Reactivar modo dibujo cuando se elimine una plaza
- _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

---

## Phase 6: Feedback Visual y UX

### 17. Implementar Indicador de Modo Edición (Magic Border)

Crear borde animado alrededor del canvas cuando modo dibujo está activo.

- Crear clase CSS `.editor-canvas-active` con pseudo-elemento `::before`
- Implementar animación de gradiente con keyframes `@keyframes magic-border`
- Usar color primary de RESERVEO
- Aplicar animación sutil (3s linear infinite)
- Agregar/remover clase según estado de `isDrawingMode`
- Asegurar que no afecte el layout (position absolute, inset -2px)
- _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

### 18. Implementar Animación de Confirmación al Crear Plaza

Mostrar feedback visual cuando se crea una plaza exitosamente.

- Agregar animación de "pop" a la plaza recién creada
- Usar keyframes: scale(0) → scale(1.2) → scale(1)
- Duración: 300ms con easing ease-out
- Aplicar solo a la última plaza creada
- _Requirements: 13.3_

### 19. Mejorar Mensajes de Error

Implementar mensajes de error específicos y útiles.

- Error al crear plaza: mostrar razón específica (límite, sin grupo, etc.)
- Error al mover plaza: mostrar mensaje y revertir posición
- Error al guardar tamaño: mostrar mensaje pero mantener cambio visual
- Error al cargar plano: mostrar mensaje con sugerencia de subir imagen
- Usar toast.error con mensajes claros y accionables
- _Requirements: 13.4_

---

## Phase 7: Sistema de Ayuda

### 20. Crear Diálogo de Ayuda Contextual

Implementar sistema de ayuda completo con instrucciones.

- Crear `src/components/admin/visual-editor/HelpDialog.tsx`
- Definir secciones de ayuda: Modo Dibujo, Mover Plazas, Editar Atributos, Navegación
- Incluir iconos, títulos, descripciones y tips para cada sección
- Agregar botón de ayuda en header del editor (icono de interrogación)
- Implementar tracking de primera visita con localStorage
- Mostrar automáticamente en primera visita
- _Requirements: 2.1, 2.2, 2.3_

### 21. Implementar Tooltips en Controles

Agregar tooltips informativos a todos los controles principales.

- Tooltip en botón modo dibujo: "Activa para crear plazas haciendo clic en el plano"
- Tooltip en herramienta mano: "Navega por el plano sin interactuar con plazas"
- Tooltip en bloqueo canvas: "Bloquea para hacer zoom con scroll"
- Tooltip en slider tamaño: "Ajusta el tamaño de los botones de plaza"
- Tooltip en controles de zoom: "Zoom in/out/reset"
- Usar componente `Tooltip` de shadcn/ui
- _Requirements: 2.4_

---

## Phase 8: Optimización y Pulido

### 22. Implementar Optimizaciones de Performance

Aplicar técnicas de optimización para renderizado eficiente.

- Memoizar componente `DraggableSpot` con `React.memo`
- Implementar comparación personalizada para evitar re-renders innecesarios
- Aplicar debounce (300ms) al slider de tamaño para reducir actualizaciones de DB
- Lazy load de imagen del plano con `loading="lazy"`
- Agregar `decoding="async"` a imagen del plano
- _Requirements: Performance considerations del diseño_

### 23. Implementar Gestión de Estado de Sesión

Persistir preferencias del usuario durante la sesión.

- Guardar estado de bloqueo canvas en sessionStorage
- Guardar estado de herramienta mano en sessionStorage
- Guardar flag de "ayuda vista" en localStorage
- Restaurar estados al recargar página
- Limpiar sessionStorage al cerrar sesión
- _Requirements: 4.7_

### 24. Refactorizar Hook useVisualEditor

Extender hook existente con nuevas funcionalidades.

- Agregar estados: `isHandToolActive`, `isCanvasLocked`, `ghostPosition`, `dragState`
- Agregar funciones: `updateSpotPosition`, `toggleHandTool`, `toggleCanvasLock`
- Implementar lógica de validación de límite
- Mantener compatibilidad con código existente
- Agregar JSDoc comments completos
- _Requirements: Todos los relacionados con state management_

---

## Phase 9: Testing y Validación

### 25.* Crear Tests Unitarios para Lógica de Colores

Escribir tests para funciones de colores y fuentes.

- Test: `getSpotColors` retorna color primary para plaza estándar
- Test: `getSpotColors` retorna array de 2 colores para plaza con 2 atributos
- Test: `getSpotColors` retorna array de 3 colores para plaza con 3 atributos
- Test: `getSpotBackground` genera CSS correcto para 1, 2 y 3 colores
- Test: `getFontSize` ajusta tamaño según longitud de número
- _Requirements: Testing strategy del diseño_

### 26.* Crear Tests Unitarios para Cálculo de Estadísticas

Escribir tests para función de estadísticas.

- Test: `calculateStats` calcula porcentaje correcto
- Test: `calculateStats` cuenta atributos correctamente
- Test: `calculateStats` maneja array vacío
- Test: `calculateStats` maneja límite alcanzado
- _Requirements: Testing strategy del diseño_

### 27.* Validación Manual Completa

Realizar testing manual exhaustivo de todas las funcionalidades.

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

### 28. Actualizar Documentación

Documentar las nuevas funcionalidades y cambios.

- Actualizar README del proyecto con nuevas features
- Crear guía de usuario para el editor visual mejorado
- Documentar nuevos componentes con JSDoc
- Actualizar steering rules si es necesario
- Crear changelog con todas las mejoras
- _Requirements: N/A (documentación)_

### 29. Preparar Migración y Rollout

Implementar estrategia de migración segura.

- Verificar que migración de DB se ejecutó correctamente
- Confirmar que valores por defecto se aplicaron a grupos existentes
- Realizar backup de datos antes de deployment
- Preparar plan de rollback si hay problemas
- Comunicar cambios a usuarios administradores
- _Requirements: Migration strategy del diseño_

---

## Notes

- **Orden de Implementación**: Las tareas están ordenadas para construir funcionalidad de forma incremental
- **Testing**: Los tests se ejecutan después de implementar la funcionalidad correspondiente
- **Commits**: Hacer commit después de cada tarea completada con mensaje descriptivo
- **Code Review**: Revisar código antes de merge, especialmente en tareas de interactividad
- **Performance**: Monitorear performance después de cada fase, especialmente con 50+ plazas
