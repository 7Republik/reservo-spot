# Requirements Document

## Introduction

Este documento define los requisitos para el sistema de check-in/check-out de plazas de parking en RESERVEO. El sistema permite a los usuarios indicar cuándo están usando una plaza reservada (check-in) y cuándo la liberan (check-out), permitiendo que plazas liberadas vuelvan a estar disponibles el mismo día. Incluye un sistema de amonestaciones automáticas configurable para usuarios que no cumplen con los check-ins/check-outs, y un panel de reporting para administradores.

## Glossary

- **Sistema**: RESERVEO - Sistema de gestión de reservas de parking
- **Usuario**: Empleado que realiza reservas de plazas de parking
- **Administrador**: Usuario con rol 'admin' que gestiona la configuración del sistema
- **Check-in**: Acción del usuario indicando que está ocupando la plaza reservada
- **Check-out**: Acción del usuario indicando que libera la plaza reservada
- **Infracción de Check-in**: Cuando un usuario no realiza check-in dentro de la ventana de tiempo configurada
- **Infracción de Check-out**: Cuando un usuario no realiza check-out al finalizar su estancia
- **Ventana de Check-in**: Periodo de tiempo durante el cual el usuario puede realizar check-in sin penalización
- **Periodo de Gracia**: Tiempo adicional después de la ventana de check-in antes de registrar una infracción
- **Grupo de Parking**: Zona o planta de parking con configuración independiente
- **Reserva Continua**: Reserva de la misma plaza en días consecutivos
- **Amonestación Automática**: Advertencia generada automáticamente al alcanzar el umbral de infracciones
- **Bloqueo Temporal**: Suspensión de la capacidad de reservar durante un periodo configurado

## Requirements

### Requirement 1: Check-in de Plaza Reservada

**User Story:** Como usuario con una reserva activa, quiero indicar que estoy usando mi plaza reservada, para que el sistema registre mi ocupación y evite infracciones.

#### Acceptance Criteria

1. WHEN el Usuario tiene una reserva activa para el día actual, THE Sistema SHALL mostrar un botón de check-in prominente en la sección "Hoy"
2. WHEN el Usuario realiza check-in, THE Sistema SHALL registrar la fecha y hora exacta del check-in en la base de datos
3. WHEN el Usuario realiza check-in, THE Sistema SHALL mostrar confirmación visual de check-in completado
4. WHILE el Usuario tiene una reserva continua de múltiples días consecutivos, THE Sistema SHALL requerir check-in solo el primer día
5. WHEN el Usuario intenta hacer check-in fuera de su reserva activa, THE Sistema SHALL mostrar un mensaje de error indicando que no tiene reserva activa

### Requirement 2: Check-out de Plaza Reservada

**User Story:** Como usuario que ha terminado de usar mi plaza, quiero indicar que la libero, para que otros usuarios puedan reservarla ese mismo día.

#### Acceptance Criteria

1. WHEN el Usuario ha realizado check-in, THE Sistema SHALL mostrar un botón de check-out prominente en la sección "Hoy"
2. WHEN el Usuario realiza check-out, THE Sistema SHALL registrar la fecha y hora exacta del check-out
3. WHEN el Usuario realiza check-out, THE Sistema SHALL marcar la plaza como disponible para reservas ese mismo día
4. WHEN el Usuario realiza check-out, THE Sistema SHALL mostrar confirmación visual de check-out completado
5. WHILE el Usuario tiene una reserva continua de múltiples días, THE Sistema SHALL permitir check-out solo cuando finalice la estancia completa
6. WHEN el Usuario realiza check-out en una reserva continua, THE Sistema SHALL considerar la estancia completa como una única sesión para efectos de infracciones

### Requirement 3: Liberación Automática Diaria

**User Story:** Como administrador del sistema, quiero que todas las plazas se liberen automáticamente al cambiar de día, para que el sistema se reinicie diariamente sin intervención manual.

#### Acceptance Criteria

1. WHEN el reloj del sistema alcanza las 00:00 horas, THE Sistema SHALL marcar todas las reservas del día anterior como finalizadas
2. WHEN se inicia un nuevo día, THE Sistema SHALL restablecer el estado de check-in de todas las plazas
3. WHEN se inicia un nuevo día, THE Sistema SHALL mantener las reservas continuas activas sin requerir nuevo check-in
4. WHEN se inicia un nuevo día, THE Sistema SHALL registrar en el histórico el estado final del día anterior

### Requirement 4: Configuración de Ventana de Check-in por Grupo

**User Story:** Como administrador, quiero configurar la ventana de tiempo para check-in por cada grupo de parking, para adaptar las reglas a las necesidades de cada zona.

#### Acceptance Criteria

1. WHEN el Administrador accede a la configuración de un grupo de parking, THE Sistema SHALL mostrar opciones para configurar la ventana de check-in
2. WHEN el Administrador configura la ventana de check-in, THE Sistema SHALL permitir valores desde 1 hora hasta 24 horas (todo el día)
3. WHEN el Administrador guarda la configuración, THE Sistema SHALL aplicar la ventana de check-in solo a las reservas de ese grupo
4. WHERE un grupo no tiene configuración específica, THE Sistema SHALL usar la configuración global por defecto
5. WHEN el Administrador modifica la configuración, THE Sistema SHALL aplicar los cambios a partir del día siguiente

### Requirement 5: Periodo de Gracia Configurable

**User Story:** Como administrador, quiero configurar un periodo de gracia después de la ventana de check-in, para dar margen a usuarios con retrasos menores antes de registrar una infracción.

#### Acceptance Criteria

1. WHEN el Administrador accede a la configuración global, THE Sistema SHALL mostrar opción para configurar el periodo de gracia
2. WHEN el Administrador configura el periodo de gracia, THE Sistema SHALL permitir valores desde 0 hasta 120 minutos
3. WHEN finaliza la ventana de check-in y el periodo de gracia sin check-in, THE Sistema SHALL registrar una infracción de check-in
4. WHEN el Usuario realiza check-in durante el periodo de gracia, THE Sistema SHALL aceptar el check-in sin registrar infracción
5. WHEN el Administrador establece periodo de gracia en 0 minutos, THE Sistema SHALL registrar infracción inmediatamente al finalizar la ventana de check-in

### Requirement 6: Detección de Infracciones de Check-in

**User Story:** Como sistema, quiero detectar automáticamente cuando un usuario no realiza check-in dentro del tiempo permitido, para registrar la infracción y aplicar las políticas configuradas.

#### Acceptance Criteria

1. WHEN finaliza la ventana de check-in más el periodo de gracia sin check-in, THE Sistema SHALL registrar una infracción de check-in para ese usuario
2. WHEN se registra una infracción de check-in, THE Sistema SHALL incrementar el contador de infracciones de check-in del usuario
3. WHEN se registra una infracción de check-in, THE Sistema SHALL almacenar la fecha, hora, plaza y grupo asociados
4. WHILE el Usuario tiene una reserva continua sin check-in, THE Sistema SHALL registrar solo una infracción para toda la estancia
5. WHEN el Usuario cancela su reserva antes de la ventana de check-in, THE Sistema SHALL no registrar infracción

### Requirement 7: Detección de Infracciones de Check-out

**User Story:** Como sistema, quiero detectar automáticamente cuando un usuario no realiza check-out al finalizar su estancia, para registrar la infracción y aplicar las políticas configuradas.

#### Acceptance Criteria

1. WHEN finaliza el día y el Usuario realizó check-in pero no check-out, THE Sistema SHALL registrar una infracción de check-out
2. WHEN se registra una infracción de check-out, THE Sistema SHALL incrementar el contador de infracciones de check-out del usuario
3. WHEN se registra una infracción de check-out, THE Sistema SHALL almacenar la fecha, hora, plaza y grupo asociados
4. WHILE el Usuario tiene una reserva continua, THE Sistema SHALL registrar infracción de check-out solo si no hace check-out al finalizar la estancia completa
5. WHEN el Usuario realiza check-out antes de finalizar el día, THE Sistema SHALL no registrar infracción de check-out

### Requirement 8: Configuración de Umbrales de Amonestación

**User Story:** Como administrador, quiero configurar cuántas infracciones de cada tipo generan una amonestación automática, para establecer las políticas de cumplimiento del sistema.

#### Acceptance Criteria

1. WHEN el Administrador accede a la configuración global, THE Sistema SHALL mostrar opciones para configurar umbrales de amonestación
2. WHEN el Administrador configura el umbral de infracciones de check-in, THE Sistema SHALL permitir valores desde 1 hasta 20 infracciones
3. WHEN el Administrador configura el umbral de infracciones de check-out, THE Sistema SHALL permitir valores desde 1 hasta 20 infracciones
4. WHEN el Administrador guarda la configuración, THE Sistema SHALL aplicar los umbrales a todos los usuarios del sistema
5. WHEN el Administrador modifica los umbrales, THE Sistema SHALL aplicar los nuevos valores sin afectar amonestaciones ya emitidas

### Requirement 9: Generación Automática de Amonestaciones

**User Story:** Como sistema, quiero generar amonestaciones automáticamente cuando un usuario alcanza el umbral de infracciones, para aplicar las políticas sin intervención manual.

#### Acceptance Criteria

1. WHEN el contador de infracciones de check-in del Usuario alcanza el umbral configurado, THE Sistema SHALL generar una amonestación automática
2. WHEN el contador de infracciones de check-out del Usuario alcanza el umbral configurado, THE Sistema SHALL generar una amonestación automática
3. WHEN se genera una amonestación automática, THE Sistema SHALL incluir el tipo de infracción, cantidad acumulada y fecha de emisión
4. WHEN se genera una amonestación automática, THE Sistema SHALL restablecer el contador de infracciones de ese tipo a cero
5. WHEN se genera una amonestación automática, THE Sistema SHALL notificar al usuario mediante el sistema de notificaciones existente

### Requirement 10: Bloqueo Temporal por Amonestación

**User Story:** Como administrador, quiero que las amonestaciones automáticas bloqueen temporalmente al usuario, para aplicar consecuencias por incumplimiento reiterado.

#### Acceptance Criteria

1. WHEN el Administrador configura la duración del bloqueo temporal, THE Sistema SHALL permitir valores desde 1 hasta 90 días
2. WHEN se genera una amonestación automática, THE Sistema SHALL bloquear al usuario durante el periodo configurado
3. WHEN se bloquea al usuario, THE Sistema SHALL cancelar todas sus reservas futuras durante el periodo de bloqueo
4. WHEN se bloquea al usuario, THE Sistema SHALL impedir crear nuevas reservas durante el periodo de bloqueo
5. WHEN finaliza el periodo de bloqueo, THE Sistema SHALL restaurar automáticamente la capacidad de reservar del usuario

### Requirement 11: Activación/Desactivación del Sistema de Check-in

**User Story:** Como administrador, quiero poder activar o desactivar el sistema de check-in/check-out, para tener control sobre cuándo se aplican estas políticas.

#### Acceptance Criteria

1. WHEN el Administrador accede a la configuración global, THE Sistema SHALL mostrar un interruptor para activar/desactivar el sistema de check-in
2. WHEN el sistema de check-in está desactivado, THE Sistema SHALL ocultar los botones de check-in/check-out a los usuarios
3. WHEN el sistema de check-in está desactivado, THE Sistema SHALL no registrar infracciones ni generar amonestaciones
4. WHEN el Administrador activa el sistema, THE Sistema SHALL comenzar a aplicar las políticas a partir del día siguiente
5. WHEN el Administrador desactiva el sistema, THE Sistema SHALL mantener el histórico de infracciones y amonestaciones previas

### Requirement 12: Activación/Desactivación por Grupo de Parking

**User Story:** Como administrador, quiero activar o desactivar el sistema de check-in por grupo de parking, para aplicar políticas diferentes según la zona.

#### Acceptance Criteria

1. WHEN el Administrador accede a la configuración de un grupo, THE Sistema SHALL mostrar un interruptor para activar/desactivar check-in en ese grupo
2. WHEN el check-in está desactivado en un grupo, THE Sistema SHALL no requerir check-in/check-out para reservas de ese grupo
3. WHEN el check-in está desactivado en un grupo, THE Sistema SHALL no registrar infracciones para reservas de ese grupo
4. WHERE un grupo tiene check-in desactivado, THE Sistema SHALL mantener el sistema activo en otros grupos según su configuración
5. WHEN el Administrador cambia la configuración de un grupo, THE Sistema SHALL aplicar los cambios a partir del día siguiente

### Requirement 13: Panel de Reporting de Infracciones

**User Story:** Como administrador, quiero ver un reporte de usuarios que no han realizado check-in o check-out, para monitorear el cumplimiento y tomar decisiones.

#### Acceptance Criteria

1. WHEN el Administrador accede al panel de reporting, THE Sistema SHALL mostrar lista de reservas sin check-in del día actual
2. WHEN el Administrador accede al panel de reporting, THE Sistema SHALL mostrar lista de reservas sin check-out del día actual
3. WHEN el Administrador visualiza el reporte, THE Sistema SHALL mostrar nombre de usuario, plaza, grupo y hora de la reserva
4. WHEN el Administrador filtra el reporte, THE Sistema SHALL permitir filtrar por grupo de parking, fecha y tipo de infracción
5. WHEN el Administrador exporta el reporte, THE Sistema SHALL generar un archivo CSV con los datos filtrados

### Requirement 14: Histórico de Check-ins y Check-outs

**User Story:** Como administrador, quiero acceder al histórico completo de check-ins y check-outs, para analizar patrones de uso y generar estadísticas.

#### Acceptance Criteria

1. WHEN el Administrador accede al histórico, THE Sistema SHALL mostrar todos los check-ins y check-outs registrados
2. WHEN el Administrador visualiza el histórico, THE Sistema SHALL mostrar usuario, plaza, grupo, fecha y hora de check-in y check-out
3. WHEN el Administrador filtra el histórico, THE Sistema SHALL permitir filtrar por usuario, grupo, plaza y rango de fechas
4. WHEN el Administrador solicita estadísticas, THE Sistema SHALL calcular tasa de cumplimiento por usuario y por grupo
5. WHEN el Administrador exporta el histórico, THE Sistema SHALL generar un archivo CSV con los datos filtrados

### Requirement 15: Notificaciones de Recordatorio de Check-in

**User Story:** Como usuario con una reserva activa, quiero recibir una notificación recordándome hacer check-in, para evitar olvidar y recibir infracciones.

#### Acceptance Criteria

1. WHEN el Usuario tiene una reserva para el día actual, THE Sistema SHALL enviar una notificación de recordatorio al inicio de la ventana de check-in
2. WHEN se envía la notificación, THE Sistema SHALL incluir la plaza reservada, grupo y hora límite para check-in
3. WHEN el Usuario realiza check-in, THE Sistema SHALL no enviar más recordatorios para esa reserva
4. WHEN el Administrador configura las notificaciones, THE Sistema SHALL permitir activar/desactivar recordatorios de check-in
5. WHERE el Usuario tiene notificaciones desactivadas en su perfil, THE Sistema SHALL respetar su preferencia y no enviar recordatorios

### Requirement 16: Interfaz de Usuario en Sección "Hoy"

**User Story:** Como usuario, quiero una interfaz simple y accesible en la sección "Hoy" para realizar check-in y check-out, para que sea fácil y rápido de usar.

#### Acceptance Criteria

1. WHEN el Usuario accede a la sección "Hoy" con una reserva activa, THE Sistema SHALL mostrar un card destacado con la información de su reserva
2. WHEN el Usuario no ha realizado check-in, THE Sistema SHALL mostrar un botón grande y prominente de "Llegué" o "Check-in"
3. WHEN el Usuario ha realizado check-in, THE Sistema SHALL mostrar la hora de check-in y un botón de "Me voy" o "Check-out"
4. WHEN el Usuario realiza check-in o check-out, THE Sistema SHALL mostrar animación de confirmación y actualizar la interfaz inmediatamente
5. WHEN el Usuario no tiene reserva activa, THE Sistema SHALL mostrar mensaje indicando que no tiene reservas para hoy

### Requirement 17: Menú de Configuración Estructurado

**User Story:** Como administrador, quiero un menú de configuración bien organizado, para gestionar fácilmente todas las opciones del sistema de check-in.

#### Acceptance Criteria

1. WHEN el Administrador accede a la configuración, THE Sistema SHALL mostrar una sección dedicada a "Check-in/Check-out"
2. WHEN el Administrador visualiza la configuración, THE Sistema SHALL agrupar opciones globales separadas de opciones por grupo
3. WHEN el Administrador modifica configuración global, THE Sistema SHALL mostrar claramente qué grupos usan configuración global vs personalizada
4. WHEN el Administrador guarda cambios, THE Sistema SHALL validar que los valores están dentro de los rangos permitidos
5. WHEN el Administrador guarda cambios, THE Sistema SHALL mostrar confirmación y fecha de aplicación de los cambios

### Requirement 18: Plaza Disponible Tras Check-out

**User Story:** Como usuario buscando plaza, quiero ver plazas liberadas por check-out ese mismo día, para poder reservarlas si las necesito.

#### Acceptance Criteria

1. WHEN otro Usuario realiza check-out de una plaza, THE Sistema SHALL marcar la plaza como disponible para el día actual
2. WHEN el Usuario busca plazas disponibles para hoy, THE Sistema SHALL incluir plazas liberadas por check-out
3. WHEN el Usuario reserva una plaza liberada, THE Sistema SHALL permitir la reserva inmediatamente
4. WHEN se muestra una plaza liberada, THE Sistema SHALL indicar visualmente que fue liberada anticipadamente
5. WHEN finaliza el día, THE Sistema SHALL limpiar el estado de "liberada anticipadamente" para el día siguiente
