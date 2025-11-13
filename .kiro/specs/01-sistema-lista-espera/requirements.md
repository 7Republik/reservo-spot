# Requirements Document - Sistema de Lista de Espera

## Introduction

Este documento define los requisitos para implementar un sistema de lista de espera en RESERVEO que permita a los usuarios registrarse cuando no hay plazas disponibles y ser notificados automáticamente cuando se libere una plaza, con un tiempo limitado para aceptar la reserva.

## Glossary

- **Sistema**: RESERVEO - Sistema de reservas de parking corporativo
- **Usuario**: Empleado autenticado que puede hacer reservas
- **Admin**: Usuario con rol de administrador
- **Lista_Espera**: Cola FIFO de usuarios esperando plaza en un grupo específico
- **Entrada_Lista**: Registro individual de un usuario en una lista de espera
- **Oferta_Reserva**: Notificación enviada a un usuario cuando hay plaza disponible
- **Tiempo_Aceptacion**: Ventana de tiempo para que el usuario acepte una oferta
- **Grupo_Parking**: Zona de parking (ej: "Planta -1", "Zona Norte")
- **Plaza_Parking**: Espacio individual de estacionamiento
- **Reserva_Confirmada**: Reserva aceptada y activa en el sistema

## Requirements

### Requirement 1: Configuración Global del Sistema

**User Story:** Como administrador, quiero poder habilitar/deshabilitar el sistema de lista de espera globalmente, para controlar cuándo está disponible esta funcionalidad.

#### Acceptance Criteria

1. WHEN el Admin accede a la configuración del sistema, THE Sistema SHALL mostrar un toggle para habilitar/deshabilitar la lista de espera
2. WHEN el Admin deshabilita la lista de espera, THE Sistema SHALL ocultar todas las opciones de lista de espera para los usuarios
3. WHEN el Admin deshabilita la lista de espera, THE Sistema SHALL mantener las entradas existentes pero no procesarlas
4. WHERE la lista de espera está habilitada, THE Sistema SHALL permitir a los usuarios registrarse en listas de espera
5. THE Sistema SHALL guardar el estado de habilitación en la tabla reservation_settings

### Requirement 2: Configuración de Parámetros por Admin

**User Story:** Como administrador, quiero configurar los parámetros del sistema de lista de espera (tiempo de aceptación, límites, prioridades), para adaptar el sistema a las necesidades de mi organización.

#### Acceptance Criteria

1. WHEN el Admin accede a configuración de lista de espera, THE Sistema SHALL mostrar un formulario con todos los parámetros configurables
2. THE Sistema SHALL permitir configurar el tiempo de aceptación entre 30 minutos y 24 horas
3. THE Sistema SHALL permitir configurar el máximo de listas simultáneas por usuario entre 1 y 10
4. THE Sistema SHALL permitir habilitar/deshabilitar prioridad por roles en lista de espera
5. THE Sistema SHALL permitir habilitar/deshabilitar penalización por no responder
6. THE Sistema SHALL validar que el tiempo de aceptación sea un número positivo
7. THE Sistema SHALL guardar todos los parámetros en la tabla reservation_settings

### Requirement 3: Registro en Lista de Espera

**User Story:** Como usuario, quiero registrarme en la lista de espera cuando no hay plazas disponibles, para tener la oportunidad de conseguir una plaza si se libera.

#### Acceptance Criteria

1. WHEN el Usuario intenta reservar y no hay plazas disponibles, THE Sistema SHALL mostrar la opción de entrar en lista de espera
2. WHERE la lista de espera está habilitada, THE Sistema SHALL permitir al usuario elegir grupos específicos o todos sus grupos asignados
3. WHEN el Usuario se registra en lista de espera, THE Sistema SHALL verificar que no exceda el límite de listas simultáneas
4. WHEN el Usuario se registra en lista de espera, THE Sistema SHALL crear una Entrada_Lista con timestamp actual
5. THE Sistema SHALL verificar que el usuario tenga matrícula aprobada antes de permitir registro en lista de espera
6. THE Sistema SHALL verificar que el usuario tenga acceso al Grupo_Parking antes de permitir registro
7. WHEN el Usuario ya está en lista de espera para ese grupo y fecha, THE Sistema SHALL mostrar mensaje informativo
8. THE Sistema SHALL mostrar la posición estimada del usuario en la cola

### Requirement 4: Visualización de Estado de Lista de Espera

**User Story:** Como usuario, quiero ver mi posición en las listas de espera y poder gestionar mis registros, para tener control sobre mis solicitudes pendientes.

#### Acceptance Criteria

1. WHEN el Usuario accede a su dashboard, THE Sistema SHALL mostrar todas sus entradas activas en listas de espera
2. THE Sistema SHALL mostrar la posición actual del usuario en cada lista
3. THE Sistema SHALL mostrar cuántas personas hay delante en la cola
4. THE Sistema SHALL mostrar la fecha y grupo de parking de cada entrada
5. THE Sistema SHALL permitir al usuario cancelar su registro en lista de espera voluntariamente
6. WHEN el Usuario cancela su registro, THE Sistema SHALL eliminar la Entrada_Lista y actualizar posiciones

### Requirement 5: Liberación de Plaza y Notificación

**User Story:** Como sistema, necesito detectar cuando se libera una plaza y notificar al primer usuario en lista de espera, para automatizar el proceso de asignación.

#### Acceptance Criteria

1. WHEN una Reserva_Confirmada es cancelada, THE Sistema SHALL verificar si hay usuarios en lista de espera para ese grupo y fecha
2. WHEN se detecta una plaza libre con lista de espera activa, THE Sistema SHALL buscar el primer usuario en la cola
3. WHERE prioridad por roles está habilitada, THE Sistema SHALL ordenar la lista por prioridad de rol y luego por timestamp
4. WHERE prioridad por roles está deshabilitada, THE Sistema SHALL ordenar la lista solo por timestamp
5. WHEN se identifica el siguiente usuario, THE Sistema SHALL crear una Oferta_Reserva con tiempo de expiración
6. THE Sistema SHALL enviar notificación por email al usuario
7. THE Sistema SHALL crear notificación in-app para el usuario
8. THE Sistema SHALL marcar la Entrada_Lista como "oferta_pendiente"

### Requirement 6: Aceptación de Oferta de Reserva

**User Story:** Como usuario, quiero poder aceptar una oferta de reserva cuando me notifiquen, para confirmar que quiero esa plaza.

#### Acceptance Criteria

1. WHEN el Usuario recibe una Oferta_Reserva, THE Sistema SHALL mostrar un botón de "Aceptar" en la notificación
2. WHEN el Usuario accede a la notificación, THE Sistema SHALL mostrar detalles de la plaza ofrecida
3. THE Sistema SHALL mostrar el tiempo restante para aceptar la oferta
4. WHEN el Usuario acepta la oferta, THE Sistema SHALL crear una Reserva_Confirmada
5. WHEN el Usuario acepta la oferta, THE Sistema SHALL eliminar al usuario de todas sus listas de espera activas
6. WHEN el Usuario acepta la oferta, THE Sistema SHALL marcar la Oferta_Reserva como "aceptada"
7. WHEN el Usuario acepta la oferta, THE Sistema SHALL enviar confirmación por email
8. IF el tiempo de aceptación ha expirado, THEN THE Sistema SHALL mostrar mensaje de oferta expirada

### Requirement 7: Rechazo de Oferta de Reserva

**User Story:** Como usuario, quiero poder rechazar una oferta de reserva si no me conviene, para que pase al siguiente en la lista.

#### Acceptance Criteria

1. WHEN el Usuario recibe una Oferta_Reserva, THE Sistema SHALL mostrar un botón de "Rechazar"
2. WHEN el Usuario rechaza la oferta, THE Sistema SHALL marcar la Oferta_Reserva como "rechazada"
3. WHEN el Usuario rechaza la oferta, THE Sistema SHALL mantener al usuario en la lista de espera
4. WHEN el Usuario rechaza la oferta, THE Sistema SHALL buscar el siguiente usuario en la cola
5. THE Sistema SHALL registrar el rechazo en logs de auditoría
6. WHERE penalización está habilitada, THE Sistema SHALL incrementar contador de rechazos del usuario

### Requirement 8: Expiración de Oferta por Tiempo

**User Story:** Como sistema, necesito manejar automáticamente las ofertas no respondidas dentro del tiempo límite, para mantener el flujo de asignación.

#### Acceptance Criteria

1. WHEN el Tiempo_Aceptacion expira sin respuesta, THE Sistema SHALL marcar la Oferta_Reserva como "expirada"
2. WHEN una oferta expira, THE Sistema SHALL buscar el siguiente usuario en la lista de espera
3. WHEN una oferta expira, THE Sistema SHALL mantener al usuario en la lista de espera
4. WHERE penalización está habilitada, THE Sistema SHALL incrementar contador de no_respuestas del usuario
5. THE Sistema SHALL enviar notificación al usuario informando que la oferta expiró
6. IF no hay más usuarios en lista de espera, THEN THE Sistema SHALL liberar la plaza para reserva normal

### Requirement 9: Recordatorios de Oferta Pendiente

**User Story:** Como usuario, quiero recibir recordatorios sobre ofertas pendientes, para no perder la oportunidad por no ver la notificación a tiempo.

#### Acceptance Criteria

1. WHEN una Oferta_Reserva está activa, THE Sistema SHALL enviar recordatorio a mitad del tiempo disponible
2. WHEN quedan 15 minutos para expirar, THE Sistema SHALL enviar recordatorio final
3. THE Sistema SHALL enviar recordatorios por email y notificación in-app
4. THE Sistema SHALL incluir enlace directo para aceptar/rechazar en los recordatorios
5. WHEN el Usuario acepta o rechaza, THE Sistema SHALL cancelar recordatorios pendientes

### Requirement 10: Dashboard de Admin para Lista de Espera

**User Story:** Como administrador, quiero ver estadísticas y gestionar las listas de espera, para monitorear el uso del sistema y resolver problemas.

#### Acceptance Criteria

1. WHEN el Admin accede al dashboard de lista de espera, THE Sistema SHALL mostrar número total de usuarios en listas activas
2. THE Sistema SHALL mostrar número de ofertas pendientes de respuesta
3. THE Sistema SHALL mostrar tasa de aceptación de ofertas
4. THE Sistema SHALL mostrar tasa de rechazo y expiración
5. THE Sistema SHALL permitir al Admin ver lista de espera de cada grupo y fecha
6. THE Sistema SHALL permitir al Admin eliminar manualmente una entrada de lista de espera
7. THE Sistema SHALL mostrar gráficos de tendencias de uso de lista de espera

### Requirement 11: Penalización por No Responder

**User Story:** Como administrador, quiero poder penalizar a usuarios que no responden ofertas repetidamente, para incentivar el uso responsable del sistema.

#### Acceptance Criteria

1. WHERE penalización está habilitada, THE Sistema SHALL contar rechazos y no_respuestas por usuario
2. WHEN un usuario alcanza 3 no_respuestas, THE Sistema SHALL bloquear temporalmente su acceso a lista de espera
3. THE Sistema SHALL permitir al Admin configurar el umbral de penalización entre 2 y 10
4. THE Sistema SHALL permitir al Admin configurar la duración del bloqueo temporal entre 1 y 30 días
5. WHEN un usuario está bloqueado temporalmente, THE Sistema SHALL mostrar mensaje explicativo
6. THE Sistema SHALL resetear contadores de penalización cada mes
7. THE Sistema SHALL notificar al usuario cuando esté cerca del límite de penalización

### Requirement 12: Limpieza Automática de Listas Expiradas

**User Story:** Como sistema, necesito limpiar automáticamente entradas de lista de espera obsoletas, para mantener la base de datos optimizada.

#### Acceptance Criteria

1. WHEN una fecha de reserva pasa, THE Sistema SHALL eliminar todas las entradas de lista de espera para esa fecha
2. THE Sistema SHALL ejecutar limpieza automática diariamente a las 00:00
3. WHEN un usuario es bloqueado o desactivado, THE Sistema SHALL eliminar todas sus entradas de lista de espera
4. WHEN una matrícula es desaprobada, THE Sistema SHALL eliminar todas las entradas de lista de espera del usuario
5. WHEN un usuario pierde acceso a un grupo, THE Sistema SHALL eliminar sus entradas de lista de espera para ese grupo

### Requirement 13: Notificaciones Multi-Canal

**User Story:** Como usuario, quiero recibir notificaciones por múltiples canales cuando hay una oferta disponible, para no perder la oportunidad.

#### Acceptance Criteria

1. WHEN se crea una Oferta_Reserva, THE Sistema SHALL enviar email al usuario
2. WHEN se crea una Oferta_Reserva, THE Sistema SHALL crear notificación in-app
3. THE Sistema SHALL incluir enlace directo para aceptar/rechazar en el email
4. THE Sistema SHALL mostrar contador de tiempo restante en notificación in-app
5. THE Sistema SHALL marcar notificaciones como leídas cuando el usuario interactúa
6. THE Sistema SHALL permitir al usuario configurar preferencias de notificación

### Requirement 14: Logs y Auditoría de Lista de Espera

**User Story:** Como administrador, quiero tener logs detallados de todas las operaciones de lista de espera, para auditoría y análisis.

#### Acceptance Criteria

1. WHEN un usuario entra en lista de espera, THE Sistema SHALL registrar el evento en tabla de logs
2. WHEN se crea una oferta, THE Sistema SHALL registrar usuario, grupo, fecha y timestamp
3. WHEN un usuario acepta/rechaza/no responde, THE Sistema SHALL registrar la acción
4. THE Sistema SHALL registrar cambios en configuración de lista de espera por Admin
5. THE Sistema SHALL permitir al Admin exportar logs en formato CSV
6. THE Sistema SHALL retener logs por al menos 12 meses

### Requirement 15: Integración con Sistema de Reservas Existente

**User Story:** Como sistema, necesito integrarme correctamente con el flujo de reservas existente, para mantener consistencia y evitar conflictos.

#### Acceptance Criteria

1. WHEN se crea una Reserva_Confirmada desde lista de espera, THE Sistema SHALL aplicar todas las validaciones existentes
2. THE Sistema SHALL verificar que la plaza sigue disponible antes de confirmar
3. THE Sistema SHALL respetar las políticas RLS existentes
4. THE Sistema SHALL actualizar contadores de disponibilidad en tiempo real
5. WHEN hay conflicto de reserva, THE Sistema SHALL cancelar la oferta y buscar siguiente usuario
6. THE Sistema SHALL mantener integridad referencial con tablas existentes
