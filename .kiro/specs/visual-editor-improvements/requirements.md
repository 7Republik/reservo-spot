# Requirements Document - Mejoras del Editor Visual de Plazas

## Introduction

Este documento define los requisitos para mejorar significativamente la experiencia de usuario del Editor Visual de Plazas en RESERVEO. El editor actual presenta limitaciones en usabilidad, visualización y control que dificultan la gestión eficiente de plazas de parking. Las mejoras propuestas transformarán el editor en una herramienta profesional con controles intuitivos, feedback visual claro y funcionalidades avanzadas de diseño.

## Glossary

- **Editor Visual**: Interfaz administrativa para posicionar plazas de parking sobre planos de planta
- **Plaza**: Espacio de estacionamiento individual representado como botón en el plano
- **Modo Dibujo**: Estado del editor que permite crear nuevas plazas haciendo clic en el plano
- **Atributos de Plaza**: Características especiales (accesible, cargador eléctrico, compacta)
- **Plano de Planta**: Imagen de fondo que representa el layout físico del parking
- **Herramienta Mano**: Control para desplazar el plano sin interactuar con plazas
- **Leyenda**: Guía visual que explica colores y símbolos de las plazas
- **Panel de Estadísticas**: Resumen de plazas creadas y atributos asignados
- **Indicador de Modo Edición**: Feedback visual que muestra que el editor está activo
- **Límite de Plazas**: Número máximo de plazas que se pueden crear en un grupo
- **Preview Fantasma**: Visualización temporal de una plaza antes de crearla
- **Bloqueo de Área**: Estado que determina si el área del plano responde a scroll o a zoom/pan

## Requirements

### Requirement 1: Visualización Mejorada de Plazas

**User Story:** Como administrador, quiero que las plazas se visualicen de forma clara y profesional, para identificar rápidamente sus atributos sin sobrecargar la interfaz.

#### Acceptance Criteria

1. WHEN THE System renderiza una plaza en el plano, THE System SHALL mostrar únicamente el número de plaza centrado dentro del botón sin texto adicional ni iconos
2. WHEN THE System determina el tamaño de fuente para el número de plaza, THE System SHALL ajustar automáticamente el tamaño de fuente para que el número quepa completamente dentro del botón
3. WHEN THE System aplica color a una plaza con un solo atributo, THE System SHALL colorear el botón completo según la leyenda definida para ese atributo
4. WHEN THE System aplica color a una plaza con múltiples atributos, THE System SHALL dividir el botón en secciones iguales mostrando los colores correspondientes a cada atributo
5. IF THE Plaza tiene dos atributos, THEN THE System SHALL dividir el botón verticalmente en dos mitades con los colores respectivos
6. IF THE Plaza tiene tres atributos, THEN THE System SHALL dividir el botón en tres secciones con los colores respectivos

### Requirement 2: Sistema de Ayuda Contextual

**User Story:** Como administrador nuevo, quiero tener una guía clara de cómo usar el editor visual, para poder crear y gestionar plazas sin confusión.

#### Acceptance Criteria

1. WHEN THE Admin accede al Editor Visual por primera vez, THE System SHALL mostrar un panel de ayuda con instrucciones básicas de uso
2. THE System SHALL proporcionar un botón de ayuda visible en todo momento que permita consultar las instrucciones
3. WHEN THE System muestra la ayuda, THE System SHALL incluir explicaciones sobre modo dibujo, movimiento de plazas, edición de atributos y controles de navegación
4. THE System SHALL mostrar tooltips informativos al pasar el cursor sobre controles principales del editor
5. WHEN THE Admin activa el modo dibujo por primera vez, THE System SHALL mostrar una notificación explicando cómo crear plazas

### Requirement 3: Movimiento y Edición de Plazas Independientes

**User Story:** Como administrador, quiero poder mover plazas existentes arrastrándolas y editar sus atributos de forma independiente, para ajustar el layout sin recrear plazas.

#### Acceptance Criteria

1. WHEN THE Admin hace clic y mantiene presionado sobre una plaza existente WHILE modo dibujo está desactivado AND herramienta mano está desactivada, THE System SHALL iniciar modo arrastre de plaza
2. WHEN THE Admin arrastra una plaza, THE System SHALL mostrar la plaza siguiendo el cursor con feedback visual claro de que está siendo movida
3. WHEN THE Admin arrastra una plaza, THE System SHALL mostrar una sombra o indicador en la posición original
4. WHEN THE Admin suelta una plaza en nueva posición, THE System SHALL guardar automáticamente la nueva posición en la base de datos
5. WHEN THE Admin hace clic simple en una plaza WHILE no está en modo arrastre, THE System SHALL abrir el diálogo de edición de atributos
6. THE System SHALL diferenciar visualmente entre el estado de arrastre activo y el estado normal de la plaza
7. WHEN THE Arrastre de plaza falla al guardar, THE System SHALL revertir la plaza a su posición original y mostrar mensaje de error

### Requirement 4: Control de Zoom y Scroll Mejorado

**User Story:** Como administrador, quiero controlar cuándo el área del plano hace zoom y cuándo hace scroll, para navegar cómodamente sin comportamientos inesperados que interrumpan mi flujo de trabajo.

#### Acceptance Criteria

1. WHEN THE Admin mueve el scroll del ratón sobre el área del plano WHILE el área no está bloqueada, THE System SHALL realizar scroll de página normal permitiendo navegar verticalmente por la interfaz
2. THE System SHALL proporcionar un botón toggle de bloqueo/desbloqueo claramente visible para activar el modo interactivo del plano
3. WHEN THE Área del plano está bloqueada AND el Admin usa scroll sobre el plano, THE System SHALL hacer zoom in/out del plano en lugar de scroll de página
4. WHEN THE Área del plano está bloqueada, THE System SHALL permitir pan/arrastre del plano con clic y arrastre
5. THE System SHALL mostrar un indicador visual claro del estado actual (bloqueado para interacción vs desbloqueado para scroll normal)
6. WHEN THE Admin mueve el cursor fuera del área del plano hacia los márgenes, THE System SHALL permitir scroll de página normal independientemente del estado de bloqueo
7. THE System SHALL recordar el estado de bloqueo durante la sesión del usuario en el editor
8. WHEN THE Admin presiona tecla Escape, THE System SHALL desbloquear el área del plano automáticamente

### Requirement 5: Control de Tamaño de Plaza con Preview en Tiempo Real

**User Story:** Como administrador, quiero ajustar el tamaño de las plazas con un control deslizante (slider) y ver el resultado en tiempo real, para encontrar el tamaño óptimo visualmente mientras dibujo.

#### Acceptance Criteria

1. THE System SHALL proporcionar un control deslizante (slider) para ajustar el tamaño de plaza desde 12px hasta 64px
2. WHEN THE Admin ajusta el slider de tamaño, THE System SHALL actualizar inmediatamente el tamaño de todas las plazas existentes en el plano
3. WHEN THE Admin ajusta el slider WHILE modo dibujo está activo, THE System SHALL actualizar el tamaño del preview fantasma en tiempo real
4. THE System SHALL mostrar el valor numérico actual del tamaño (en px) junto al slider de forma clara
5. WHEN THE Admin cambia el tamaño, THE System SHALL ajustar automáticamente el tamaño de fuente del número de plaza para mantener legibilidad
6. THE System SHALL guardar la preferencia de tamaño para el grupo de parking actual en la base de datos
7. WHEN THE Admin selecciona un grupo diferente, THE System SHALL cargar el tamaño de plaza guardado para ese grupo

### Requirement 6: Herramienta de Mano para Navegación

**User Story:** Como administrador, quiero usar una herramienta de mano para moverme por el plano sin afectar las plazas, para navegar cómodamente en planos grandes.

#### Acceptance Criteria

1. THE System SHALL proporcionar un botón de herramienta mano en la barra de controles del editor
2. WHEN THE Herramienta mano está activa, THE System SHALL cambiar el cursor a un icono de mano
3. WHEN THE Admin hace clic y arrastra con herramienta mano activa, THE System SHALL desplazar el plano sin interactuar con plazas
4. WHEN THE Herramienta mano está activa, THE System SHALL deshabilitar temporalmente la creación y selección de plazas
5. THE System SHALL permitir desactivar la herramienta mano haciendo clic nuevamente en el botón o presionando tecla Escape
6. THE System SHALL mantener la herramienta mano activa hasta que el Admin la desactive explícitamente

### Requirement 7: Validación de Límite de Plazas

**User Story:** Como administrador, quiero que el sistema me impida crear más plazas del límite establecido, para mantener la coherencia con la capacidad del grupo.

#### Acceptance Criteria

1. WHEN THE Admin intenta crear una plaza AND el número de plazas creadas es igual al límite del grupo, THE System SHALL mostrar un mensaje de error indicando que se alcanzó el límite
2. THE System SHALL deshabilitar el modo dibujo automáticamente cuando se alcance el límite de plazas
3. WHEN THE Límite de plazas se alcanza, THE System SHALL mostrar una notificación clara con el número máximo permitido
4. THE System SHALL permitir editar y mover plazas existentes incluso cuando se alcance el límite
5. WHEN THE Admin elimina una plaza, THE System SHALL reactivar el modo dibujo si estaba deshabilitado por límite

### Requirement 8: Panel de Estadísticas y Resumen

**User Story:** Como administrador, quiero ver un resumen en tiempo real de las plazas creadas y sus atributos, para tener control total sobre la distribución del parking.

#### Acceptance Criteria

1. THE System SHALL mostrar un panel de estadísticas visible que incluya el total de plazas creadas versus el límite
2. THE System SHALL mostrar el número de plazas con cada atributo (accesibles, con cargador, compactas)
3. WHEN THE Admin crea, edita o elimina una plaza, THE System SHALL actualizar las estadísticas inmediatamente
4. THE System SHALL mostrar el porcentaje de plazas creadas respecto al total permitido
5. THE System SHALL resaltar visualmente cuando se esté cerca del límite (por ejemplo, al 90%)
6. THE System SHALL mostrar cuántas plazas quedan por crear del total disponible

### Requirement 9: Indicador Visual de Modo Edición Activo

**User Story:** Como administrador, quiero tener un feedback visual claro cuando el modo edición está activo, para saber en todo momento que estoy en modo de trabajo.

#### Acceptance Criteria

1. WHEN THE Modo dibujo está activo, THE System SHALL mostrar un borde animado sutil alrededor del contenedor del plano
2. THE System SHALL usar el color de marca de RESERVEO para el indicador de modo edición
3. THE System SHALL aplicar una animación sutil tipo "magic border" que no distraiga pero sea claramente visible
4. WHEN THE Admin desactiva el modo dibujo, THE System SHALL remover inmediatamente el indicador visual
5. THE System SHALL mantener el indicador visible durante toda la sesión de edición sin parpadeos

### Requirement 10: Optimización de Layout y Controles Profesionales

**User Story:** Como administrador, quiero una interfaz organizada con controles profesionales similares a software de diseño, para trabajar eficientemente.

#### Acceptance Criteria

1. THE System SHALL organizar los controles del editor en un panel lateral derecho o desplegable
2. THE System SHALL agrupar controles relacionados en secciones claramente identificadas
3. THE System SHALL proporcionar controles de zoom, pan y herramientas similares a software profesional de edición
4. THE System SHALL optimizar el uso del espacio disponible maximizando el área del plano
5. THE System SHALL mantener los controles accesibles sin obstruir la vista del plano

### Requirement 11: Restricción de Dispositivos Móviles

**User Story:** Como administrador, quiero recibir un mensaje claro si intento usar el editor desde móvil, para entender que necesito una pantalla más grande.

#### Acceptance Criteria

1. WHEN THE Admin accede al Editor Visual desde un dispositivo móvil, THE System SHALL detectar el tamaño de pantalla
2. IF THE Ancho de pantalla es menor a 768px (tablet), THEN THE System SHALL mostrar un mensaje informativo en lugar del editor
3. THE System SHALL explicar que el Editor Visual requiere pantalla de tablet o PC para funcionar correctamente
4. THE System SHALL sugerir al Admin acceder desde un dispositivo con pantalla más grande
5. THE System SHALL permitir al Admin navegar a otras secciones del panel administrativo desde el mensaje

### Requirement 12: Leyenda Visual de Atributos

**User Story:** Como administrador, quiero ver una leyenda clara de los colores y símbolos usados en el editor, para entender rápidamente qué representa cada color.

#### Acceptance Criteria

1. THE System SHALL mostrar una leyenda visible con los colores asignados a cada atributo de plaza
2. THE System SHALL incluir en la leyenda: plazas accesibles (PMR), plazas con cargador eléctrico, plazas compactas y plazas estándar
3. WHEN THE Admin pasa el cursor sobre un elemento de la leyenda, THE System SHALL resaltar las plazas correspondientes en el plano
4. THE System SHALL mostrar en la leyenda cómo se visualizan plazas con múltiples atributos (colores divididos)
5. THE System SHALL posicionar la leyenda de forma que no obstruya el área de trabajo del plano

### Requirement 13: Feedback Visual Durante Creación de Plaza

**User Story:** Como administrador, quiero ver feedback visual inmediato cuando estoy creando una plaza, para confirmar que el sistema está respondiendo a mis acciones.

#### Acceptance Criteria

1. WHEN THE Modo dibujo está activo AND el Admin mueve el cursor sobre el plano, THE System SHALL mostrar un preview fantasma de la plaza en la posición del cursor
2. THE System SHALL mostrar el preview con el tamaño actual configurado en el control deslizante
3. WHEN THE Admin hace clic para crear la plaza, THE System SHALL mostrar una animación de confirmación
4. IF THE Creación de plaza falla, THEN THE System SHALL mostrar un mensaje de error específico con la razón del fallo
5. THE System SHALL deshabilitar el preview fantasma cuando el modo dibujo está desactivado
