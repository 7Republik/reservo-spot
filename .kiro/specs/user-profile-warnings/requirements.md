# Requirements Document

## Introduction

Este documento define los requisitos para implementar un sistema completo de perfil de usuario que incluye la visualización de amonestaciones, notificaciones de alertas, edición de datos personales y un contador de amonestaciones. El sistema permitirá a los usuarios gestionar su información personal y estar informados sobre su estado disciplinario dentro del sistema de reservas de estacionamiento.

## Glossary

- **User_Profile_System**: Sistema que permite a los usuarios ver y editar su información personal
- **Warning_Notification_System**: Sistema que notifica a los usuarios sobre nuevas amonestaciones
- **Warning_Display_Component**: Componente que muestra el historial de amonestaciones del usuario
- **Profile_Editor**: Interfaz para editar datos personales del usuario
- **Warning_Counter**: Indicador visual del número total de amonestaciones
- **Alert_Badge**: Indicador visual de notificaciones pendientes
- **User_Warning_Record**: Registro individual de una amonestación en la tabla user_warnings
- **Profile_Data**: Información personal del usuario almacenada en la tabla profiles

## Requirements

### Requirement 1

**User Story:** Como usuario del sistema, quiero ver un indicador visual de alertas pendientes en la interfaz principal, para estar informado cuando tengo amonestaciones nuevas que revisar

#### Acceptance Criteria

1. WHEN THE User_Profile_System carga la interfaz principal, THE System SHALL mostrar un Alert_Badge visible en el área de navegación o header
2. WHILE el usuario tiene User_Warning_Records sin revisar, THE Alert_Badge SHALL mostrar el número de amonestaciones pendientes
3. WHEN el usuario hace clic en el Alert_Badge, THE System SHALL navegar a la sección de amonestaciones
4. WHEN el usuario no tiene amonestaciones pendientes, THE Alert_Badge SHALL ocultarse o mostrar estado sin alertas
5. THE Alert_Badge SHALL actualizarse en tiempo real cuando se emitan nuevas amonestaciones

### Requirement 2

**User Story:** Como usuario del sistema, quiero acceder a una página de perfil personal, para gestionar mi información y ver mi estado en el sistema

#### Acceptance Criteria

1. WHEN el usuario hace clic en su avatar o nombre de usuario, THE System SHALL mostrar un menú con opción "Mi Perfil"
2. WHEN el usuario selecciona "Mi Perfil", THE System SHALL navegar a la página de perfil de usuario
3. THE Profile_Editor SHALL mostrar los datos actuales del usuario (full_name, email, phone)
4. THE Profile_Editor SHALL incluir una sección visible de Warning_Counter mostrando el total de amonestaciones
5. THE Profile_Editor SHALL organizar la información en secciones claramente diferenciadas (Datos Personales, Amonestaciones, Estadísticas)

### Requirement 3

**User Story:** Como usuario del sistema, quiero editar mis datos personales (nombre completo y teléfono), para mantener mi información actualizada

#### Acceptance Criteria

1. WHEN el usuario está en la página de perfil, THE Profile_Editor SHALL mostrar campos editables para full_name y phone
2. WHEN el usuario modifica un campo, THE System SHALL validar el formato antes de permitir guardar
3. WHEN el usuario hace clic en "Guardar cambios", THE System SHALL actualizar la tabla profiles con los nuevos datos
4. WHEN la actualización es exitosa, THE System SHALL mostrar un mensaje de confirmación mediante toast notification
5. IF la actualización falla, THEN THE System SHALL mostrar un mensaje de error específico
6. THE Profile_Editor SHALL deshabilitar la edición del campo email (solo lectura)

### Requirement 4

**User Story:** Como usuario del sistema, quiero ver un listado completo de mis amonestaciones, para entender las razones y fechas de cada una

#### Acceptance Criteria

1. WHEN el usuario accede a la sección de amonestaciones, THE Warning_Display_Component SHALL consultar la tabla user_warnings filtrando por user_id
2. THE Warning_Display_Component SHALL mostrar cada User_Warning_Record con: fecha (issued_at), razón (reason), notas (notes), y nombre del administrador que la emitió (issued_by)
3. THE Warning_Display_Component SHALL ordenar las amonestaciones de más reciente a más antigua
4. WHEN no existen amonestaciones, THE System SHALL mostrar un mensaje positivo indicando "Sin amonestaciones"
5. THE Warning_Display_Component SHALL incluir paginación si existen más de 10 amonestaciones

### Requirement 5

**User Story:** Como usuario del sistema, quiero ver un contador visual de mis amonestaciones totales, para estar consciente de mi estado disciplinario

#### Acceptance Criteria

1. WHEN el User_Profile_System carga el perfil, THE System SHALL ejecutar la función get_user_warning_count(user_id) para obtener el total
2. THE Warning_Counter SHALL mostrar el número total de amonestaciones de forma prominente
3. WHEN el contador es 0, THE Warning_Counter SHALL mostrar un indicador visual positivo (color verde o ícono de check)
4. WHEN el contador es 1-2, THE Warning_Counter SHALL mostrar un indicador visual de advertencia (color amarillo)
5. WHEN el contador es 3 o más, THE Warning_Counter SHALL mostrar un indicador visual crítico (color rojo)

### Requirement 6

**User Story:** Como usuario del sistema, quiero recibir notificaciones visuales cuando recibo una nueva amonestación, para estar informado inmediatamente

#### Acceptance Criteria

1. WHEN se crea un nuevo User_Warning_Record para el usuario, THE Warning_Notification_System SHALL detectar el cambio mediante Supabase realtime
2. WHEN se detecta una nueva amonestación, THE System SHALL mostrar una toast notification con el mensaje "Nueva amonestación recibida"
3. THE Warning_Notification_System SHALL actualizar el Alert_Badge incrementando el contador
4. THE Warning_Notification_System SHALL actualizar el Warning_Counter en la página de perfil si está abierta
5. THE toast notification SHALL incluir un botón "Ver detalles" que navegue a la sección de amonestaciones

### Requirement 7

**User Story:** Como usuario del sistema, quiero ver información relacionada con cada amonestación (incidente asociado), para entender el contexto completo

#### Acceptance Criteria

1. WHEN el Warning_Display_Component muestra un User_Warning_Record, THE System SHALL incluir un enlace al incident_id asociado
2. WHEN el usuario hace clic en el enlace del incidente, THE System SHALL mostrar los detalles completos del incident_report
3. THE System SHALL mostrar: fecha del incidente, parking spot afectado, descripción, y foto si existe
4. THE System SHALL indicar claramente la relación entre la amonestación y el incidente
5. IF el incidente fue eliminado, THEN THE System SHALL mostrar "Incidente no disponible"

### Requirement 8

**User Story:** Como usuario del sistema, quiero que mi página de perfil sea responsive y accesible, para poder accederla desde cualquier dispositivo

#### Acceptance Criteria

1. THE Profile_Editor SHALL adaptarse a pantallas móviles (320px+), tablets (768px+) y desktop (1024px+)
2. THE Warning_Display_Component SHALL usar un diseño de tarjetas apiladas en móvil y grid en desktop
3. THE System SHALL cumplir con WCAG 2.1 AA para contraste de colores y navegación por teclado
4. THE Profile_Editor SHALL incluir aria-labels apropiados en todos los campos de formulario
5. THE Warning_Counter SHALL ser legible en modo claro y oscuro

### Requirement 9

**User Story:** Como usuario del sistema, quiero ver estadísticas adicionales en mi perfil, para entender mi uso del sistema

#### Acceptance Criteria

1. THE Profile_Editor SHALL mostrar el número total de reservas realizadas por el usuario
2. THE Profile_Editor SHALL mostrar el número de reservas activas (futuras)
3. THE Profile_Editor SHALL mostrar la fecha de la última reserva
4. THE Profile_Editor SHALL mostrar el número de matrículas registradas y aprobadas
5. THE System SHALL consultar estas estadísticas mediante queries optimizadas a las tablas correspondientes

### Requirement 10

**User Story:** Como usuario del sistema, quiero poder marcar amonestaciones como "revisadas", para diferenciar entre alertas nuevas y ya vistas

#### Acceptance Criteria

1. WHEN el usuario visualiza la lista de amonestaciones, THE System SHALL marcar automáticamente las amonestaciones como vistas
2. THE System SHALL añadir una columna viewed_at (TIMESTAMP) a la tabla user_warnings mediante migración
3. WHEN el usuario abre la sección de amonestaciones, THE System SHALL actualizar viewed_at con la fecha actual para amonestaciones no vistas
4. THE Alert_Badge SHALL contar solo amonestaciones donde viewed_at IS NULL
5. THE Warning_Display_Component SHALL diferenciar visualmente entre amonestaciones vistas y no vistas
