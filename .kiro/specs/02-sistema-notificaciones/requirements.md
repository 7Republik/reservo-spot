# Requirements Document - 02 Sistema de Notificaciones

## Introduction

Este documento define los requisitos para el sistema de notificaciones de RESERVEO. El sistema permitirá a los usuarios recibir alertas críticas tanto dentro de la aplicación (in-app) como por email, manteniendo un equilibrio entre mantener informados a los usuarios y evitar la sobrecarga de notificaciones. El sistema está diseñado con arquitectura multi-tenant ready para facilitar la futura migración a multi-tenancy sin necesidad de refactorización.

## Glossary

- **Sistema de Notificaciones**: Conjunto de componentes que gestionan la creación, almacenamiento, visualización y envío de notificaciones a usuarios
- **Notificación In-App**: Mensaje mostrado dentro de la aplicación web cuando el usuario está autenticado
- **Notificación por Email**: Mensaje enviado al correo electrónico del usuario
- **Notificación Crítica**: Notificación que requiere acción inmediata del usuario o le impide continuar con el flujo normal
- **Organization**: Entidad que representa una empresa/tenant en el sistema (preparado para multi-tenancy)
- **Preferencias de Notificación**: Configuración del usuario sobre qué tipos de notificaciones desea recibir por email
- **NotificationBell**: Componente visual (campana) en el header que muestra el contador de notificaciones no leídas
- **Resend**: Servicio de envío de emails transaccionales utilizado por el sistema
- **Edge Function**: Función serverless de Supabase que ejecuta código backend
- **Real-time Subscription**: Conexión WebSocket que permite recibir actualizaciones en tiempo real
- **Polling**: Técnica de consulta periódica al servidor para obtener nuevos datos

## Requirements

### Requirement 1: Estructura Base de Datos

**User Story:** Como desarrollador, necesito una estructura de base de datos robusta y escalable para almacenar notificaciones, de manera que el sistema pueda crecer a multi-tenancy sin refactorización mayor.

#### Acceptance Criteria

1. WHEN se crea la tabla organizations, THE Sistema SHALL almacenar información de organizaciones con campos id, name, slug, created_at
2. WHEN se inserta la organización por defecto, THE Sistema SHALL crear un registro con id fijo '00000000-0000-0000-0000-000000000001' y slug 'default'
3. WHEN se crea la tabla notifications, THE Sistema SHALL incluir campos organization_id, user_id, type, title, message, priority, category, reference_id, action_url, data, is_read, read_at, email_sent, email_sent_at, created_at
4. WHEN se define el campo priority, THE Sistema SHALL restringir valores a 'low', 'medium', 'high', 'urgent'
5. WHEN se define el campo category, THE Sistema SHALL restringir valores a 'reservation', 'waitlist', 'warning', 'incident', 'system'
6. WHEN se crea la tabla notification_preferences, THE Sistema SHALL incluir campos user_id, organization_id, email_enabled, y switches individuales por tipo de notificación
7. WHEN se crean índices, THE Sistema SHALL crear índice compuesto en notifications(organization_id, user_id, is_read, priority DESC, created_at DESC)
8. WHEN se crea índice único, THE Sistema SHALL prevenir notificaciones duplicadas con índice en (organization_id, user_id, type, reference_id) WHERE is_read = false

### Requirement 2: Políticas de Seguridad (RLS)

**User Story:** Como usuario, necesito que mis notificaciones sean privadas y solo yo pueda verlas, de manera que se proteja mi información personal.

#### Acceptance Criteria

1. WHEN se habilita RLS en notifications, THE Sistema SHALL denegar acceso anónimo con política que retorna false
2. WHEN un usuario autenticado consulta notificaciones, THE Sistema SHALL mostrar solo notificaciones donde user_id coincide con auth.uid() y organization_id coincide con la organización del usuario
3. WHEN un usuario marca notificación como leída, THE Sistema SHALL permitir UPDATE solo si user_id coincide con auth.uid() y solo puede cambiar is_read a true y read_at
4. WHEN un admin consulta notificaciones, THE Sistema SHALL permitir ver todas las notificaciones de su organización si is_admin(auth.uid()) retorna true
5. WHEN se intenta INSERT en notifications, THE Sistema SHALL denegar a usuarios normales y permitir solo a funciones SECURITY DEFINER
6. WHEN se habilita RLS en notification_preferences, THE Sistema SHALL permitir a usuarios gestionar solo sus propias preferencias
7. WHEN se habilita RLS en organizations, THE Sistema SHALL permitir a usuarios ver solo su organización

### Requirement 3: Funciones de Utilidad

**User Story:** Como desarrollador, necesito funciones SQL reutilizables para operaciones comunes de notificaciones, de manera que el código sea mantenible y consistente.

#### Acceptance Criteria

1. WHEN se llama get_user_organization(user_id), THE Sistema SHALL retornar el organization_id del usuario desde profiles o el ID de organización por defecto si no existe
2. WHEN se llama create_notification(), THE Sistema SHALL insertar notificación con validación de campos requeridos y retornar notification_id
3. WHEN se llama mark_notification_as_read(notification_id, user_id), THE Sistema SHALL actualizar is_read a true y read_at a NOW() solo si el usuario es propietario
4. WHEN se llama mark_all_notifications_as_read(user_id), THE Sistema SHALL actualizar todas las notificaciones no leídas del usuario
5. WHEN se llama get_unread_count(user_id), THE Sistema SHALL retornar el número de notificaciones no leídas del usuario
6. WHEN se llama cleanup_old_notifications(), THE Sistema SHALL eliminar notificaciones con created_at mayor a 30 días
7. WHEN se llama should_send_email(user_id, notification_type), THE Sistema SHALL verificar preferencias del usuario y retornar boolean

### Requirement 4: Notificaciones de Waitlist

**User Story:** Como usuario en lista de espera, necesito recibir notificaciones cuando hay una plaza disponible, de manera que pueda aceptarla antes de que expire.

#### Acceptance Criteria

1. WHEN se crea una oferta de waitlist, THE Sistema SHALL crear notificación in-app con priority 'urgent' y category 'waitlist'
2. WHEN se crea oferta de waitlist Y email_waitlist_offers está habilitado, THE Sistema SHALL llamar Edge Function para enviar email
3. WHEN quedan 15 minutos para expirar oferta, THE Sistema SHALL crear notificación de recordatorio con priority 'urgent'
4. WHEN se acepta una oferta, THE Sistema SHALL crear notificación de confirmación con priority 'medium'
5. WHEN expira una oferta sin respuesta, THE Sistema SHALL crear notificación informativa con priority 'medium'
6. WHEN se rechaza una oferta, THE Sistema SHALL crear notificación de confirmación con priority 'low'
7. WHEN se registra en waitlist, THE Sistema SHALL crear notificación de confirmación con priority 'low'

### Requirement 5: Notificaciones de Amonestaciones y Bloqueos

**User Story:** Como usuario, necesito ser notificado inmediatamente cuando recibo una amonestación o bloqueo, de manera que entienda las consecuencias y pueda corregir mi comportamiento.

#### Acceptance Criteria

1. WHEN se crea una amonestación, THE Sistema SHALL crear notificación in-app con priority 'high' y category 'warning'
2. WHEN se crea amonestación Y email_warnings está habilitado, THE Sistema SHALL enviar email con detalles de la infracción
3. WHEN se crea un bloqueo temporal, THE Sistema SHALL crear notificación in-app con priority 'urgent' y category 'warning'
4. WHEN se crea bloqueo Y email_blocks está habilitado, THE Sistema SHALL enviar email con duración del bloqueo y fecha de fin
5. WHEN expira un bloqueo, THE Sistema SHALL crear notificación informativa con priority 'medium'
6. WHEN se visualiza una amonestación por primera vez, THE Sistema SHALL actualizar viewed_at en user_warnings

### Requirement 6: Notificaciones de Reservas

**User Story:** Como usuario, necesito ser notificado cuando mi reserva es cancelada por un administrador, de manera que pueda hacer planes alternativos.

#### Acceptance Criteria

1. WHEN admin cancela una reserva, THE Sistema SHALL crear notificación in-app con priority 'high' y category 'reservation'
2. WHEN admin cancela reserva Y email_reservation_cancelled está habilitado, THE Sistema SHALL enviar email con motivo de cancelación
3. WHEN se confirma una reserva desde waitlist, THE Sistema SHALL crear notificación con priority 'medium'
4. WHEN faltan 2 horas para check-in, THE Sistema SHALL crear recordatorio con priority 'medium'
5. WHEN se completa check-in exitoso, THE Sistema SHALL crear notificación de confirmación con priority 'low'

### Requirement 7: Notificaciones de Incidentes

**User Story:** Como usuario que reporta un incidente, necesito ser notificado cuando me reasignan una plaza, de manera que sepa dónde estacionar.

#### Acceptance Criteria

1. WHEN se reasigna plaza por incidente, THE Sistema SHALL crear notificación in-app con priority 'high' y category 'incident'
2. WHEN se reasigna plaza Y email_incident_reassignment está habilitado, THE Sistema SHALL enviar email con número de nueva plaza
3. WHEN admin confirma un incidente, THE Sistema SHALL notificar al usuario afectado con priority 'high'
4. WHEN se reporta un incidente, THE Sistema SHALL crear notificación de confirmación con priority 'low'

### Requirement 8: Notificaciones de Matrículas

**User Story:** Como usuario, necesito saber el estado de mi solicitud de matrícula, de manera que pueda corregir errores si es rechazada.

#### Acceptance Criteria

1. WHEN se aprueba una matrícula, THE Sistema SHALL crear notificación in-app con priority 'medium' y category 'system'
2. WHEN se rechaza una matrícula, THE Sistema SHALL crear notificación in-app con priority 'high'
3. WHEN se rechaza matrícula Y email_license_plate_rejected está habilitado, THE Sistema SHALL enviar email con motivo de rechazo
4. WHEN se elimina una matrícula aprobada, THE Sistema SHALL crear notificación con priority 'high'

### Requirement 9: Preferencias de Usuario

**User Story:** Como usuario, necesito poder controlar qué notificaciones por email recibo, de manera que cumpla con GDPR y respete mis preferencias de comunicación.

#### Acceptance Criteria

1. WHEN un usuario se registra, THE Sistema SHALL crear registro en notification_preferences con valores por defecto (email_enabled = true)
2. WHEN usuario desactiva email_enabled, THE Sistema SHALL dejar de enviar TODOS los emails pero mantener notificaciones in-app
3. WHEN usuario desactiva un tipo específico, THE Sistema SHALL respetar preferencia y no enviar emails de ese tipo
4. WHEN se verifica si enviar email, THE Sistema SHALL consultar should_send_email() que valida email_enabled Y el switch específico
5. WHEN usuario actualiza preferencias, THE Sistema SHALL validar que al menos notificaciones in-app permanecen activas
6. WHEN se muestra UI de preferencias, THE Sistema SHALL explicar claramente que notificaciones in-app no se pueden desactivar
7. WHEN se muestra UI de preferencias, THE Sistema SHALL agrupar por categoría (Críticas, Importantes, Informativas)

### Requirement 10: Edge Function de Envío de Emails

**User Story:** Como sistema, necesito enviar emails transaccionales de forma confiable, de manera que los usuarios reciban notificaciones críticas en su correo.

#### Acceptance Criteria

1. WHEN se llama Edge Function send-notification, THE Sistema SHALL validar parámetros requeridos (user_id, notification_type, template_data)
2. WHEN se validan preferencias, THE Sistema SHALL verificar should_send_email() antes de enviar
3. WHEN se obtienen datos del usuario, THE Sistema SHALL consultar email y nombre desde profiles
4. WHEN se genera email HTML, THE Sistema SHALL usar template específico según notification_type
5. WHEN se envía email con Resend, THE Sistema SHALL usar from 'Reserveo <noreply@reserveo.com>' y subject personalizado
6. WHEN envío es exitoso, THE Sistema SHALL actualizar email_sent = true y email_sent_at en notifications
7. WHEN envío falla, THE Sistema SHALL registrar error en logs y retornar error sin actualizar email_sent
8. WHEN se envía email de oferta waitlist, THE Sistema SHALL incluir botones de Aceptar y Rechazar con enlaces directos
9. WHEN se envía email de recordatorio, THE Sistema SHALL incluir countdown visual del tiempo restante
10. WHEN se configura Resend, THE Sistema SHALL usar API key desde variable de entorno RESEND_API_KEY

### Requirement 11: Componente NotificationBell

**User Story:** Como usuario, necesito ver un indicador visual de notificaciones no leídas en el header, de manera que sepa cuándo tengo notificaciones pendientes.

#### Acceptance Criteria

1. WHEN se renderiza NotificationBell, THE Sistema SHALL mostrar icono de campana en el header
2. WHEN hay notificaciones no leídas, THE Sistema SHALL mostrar badge con número de notificaciones
3. WHEN usuario hace click en campana, THE Sistema SHALL abrir dropdown con lista de notificaciones
4. WHEN se muestra lista de notificaciones, THE Sistema SHALL ordenar por priority DESC y created_at DESC
5. WHEN se muestra notificación, THE Sistema SHALL usar icono y color según priority (urgent=rojo, high=naranja, medium=azul, low=gris)
6. WHEN usuario hace click en notificación, THE Sistema SHALL marcar como leída y navegar a action_url si existe
7. WHEN se muestra dropdown, THE Sistema SHALL incluir botón "Marcar todas como leídas"
8. WHEN no hay notificaciones, THE Sistema SHALL mostrar mensaje "No tienes notificaciones"
9. WHEN se actualiza contador, THE Sistema SHALL usar polling cada 30 segundos para notificaciones no urgentes
10. WHEN hay notificación urgente nueva, THE Sistema SHALL usar real-time subscription para actualización inmediata

### Requirement 12: Hook useNotifications

**User Story:** Como desarrollador, necesito un hook reutilizable para gestionar notificaciones, de manera que la lógica esté centralizada y sea fácil de mantener.

#### Acceptance Criteria

1. WHEN se llama useNotifications(), THE Sistema SHALL retornar objeto con notifications, unreadCount, loading, error
2. WHEN se llama getNotifications(), THE Sistema SHALL consultar notificaciones del usuario ordenadas por prioridad y fecha
3. WHEN se llama markAsRead(notificationId), THE Sistema SHALL actualizar notificación y invalidar cache
4. WHEN se llama markAllAsRead(), THE Sistema SHALL actualizar todas las notificaciones no leídas
5. WHEN se suscribe a real-time, THE Sistema SHALL escuchar solo notificaciones con priority 'urgent'
6. WHEN se usa polling, THE Sistema SHALL consultar cada 30 segundos para notificaciones no urgentes
7. WHEN componente se desmonta, THE Sistema SHALL limpiar subscripciones y timers
8. WHEN se detecta nueva notificación urgente, THE Sistema SHALL mostrar toast notification
9. WHEN se usa React Query, THE Sistema SHALL configurar staleTime de 30 segundos para cache

### Requirement 13: Página de Preferencias

**User Story:** Como usuario, necesito una interfaz para gestionar mis preferencias de notificaciones, de manera que pueda controlar qué emails recibo.

#### Acceptance Criteria

1. WHEN se accede a página de preferencias, THE Sistema SHALL mostrar sección de "Notificaciones por Email"
2. WHEN se muestra master switch, THE Sistema SHALL permitir desactivar todos los emails con un toggle
3. WHEN email_enabled está desactivado, THE Sistema SHALL deshabilitar todos los switches individuales
4. WHEN se muestran switches individuales, THE Sistema SHALL agrupar por categoría (Críticas, Importantes, Informativas)
5. WHEN se actualiza preferencia, THE Sistema SHALL guardar inmediatamente y mostrar toast de confirmación
6. WHEN se muestra UI, THE Sistema SHALL incluir descripción de cada tipo de notificación
7. WHEN se muestra aviso legal, THE Sistema SHALL indicar que notificaciones in-app no se pueden desactivar

### Requirement 14: Triggers Automáticos

**User Story:** Como sistema, necesito crear notificaciones automáticamente cuando ocurren eventos relevantes, de manera que los usuarios estén siempre informados.

#### Acceptance Criteria

1. WHEN se crea waitlist_offer, THE Sistema SHALL ejecutar trigger que llama create_notification() y send-notification Edge Function
2. WHEN se crea user_warning, THE Sistema SHALL ejecutar trigger que crea notificación y envía email si está habilitado
3. WHEN se crea user_block, THE Sistema SHALL ejecutar trigger que crea notificación urgente y envía email
4. WHEN se actualiza reservation status a 'cancelled' por admin, THE Sistema SHALL ejecutar trigger que notifica al usuario
5. WHEN se crea incident_report con reassignment, THE Sistema SHALL ejecutar trigger que notifica nueva plaza
6. WHEN se actualiza license_plate status, THE Sistema SHALL ejecutar trigger que notifica al usuario
7. WHEN trigger falla, THE Sistema SHALL registrar error en logs sin bloquear operación principal

### Requirement 15: Limpieza Automática

**User Story:** Como administrador del sistema, necesito que las notificaciones antiguas se eliminen automáticamente, de manera que la base de datos no crezca indefinidamente.

#### Acceptance Criteria

1. WHEN se ejecuta cron job de limpieza, THE Sistema SHALL eliminar notificaciones con created_at mayor a 30 días
2. WHEN se ejecuta limpieza, THE Sistema SHALL mantener notificaciones no leídas independientemente de la fecha
3. WHEN se ejecuta limpieza, THE Sistema SHALL registrar número de notificaciones eliminadas en logs
4. WHEN se configura cron job, THE Sistema SHALL ejecutar limpieza diariamente a las 02:00 AM
5. WHEN se ejecuta limpieza, THE Sistema SHALL usar DELETE con LIMIT para evitar bloqueos largos

### Requirement 16: Monitoreo y Logs

**User Story:** Como administrador del sistema, necesito monitorear el funcionamiento del sistema de notificaciones, de manera que pueda detectar y resolver problemas rápidamente.

#### Acceptance Criteria

1. WHEN se envía email, THE Sistema SHALL registrar en logs el resultado (success/failure) con timestamp
2. WHEN falla envío de email, THE Sistema SHALL registrar error completo con stack trace
3. WHEN se crea notificación, THE Sistema SHALL registrar tipo, prioridad y usuario en logs
4. WHEN se ejecuta limpieza, THE Sistema SHALL registrar número de registros eliminados
5. WHEN se detecta tasa de error mayor a 5%, THE Sistema SHALL generar alerta
6. WHEN se consulta dashboard de Supabase, THE Sistema SHALL mostrar métricas de notificaciones enviadas por día

### Requirement 17: Templates de Email

**User Story:** Como usuario, necesito recibir emails profesionales y bien formateados, de manera que la comunicación sea clara y la marca sea consistente.

#### Acceptance Criteria

1. WHEN se genera email de oferta waitlist, THE Sistema SHALL incluir logo de Reserveo, título claro, detalles de plaza, countdown, y botones de acción
2. WHEN se genera email de amonestación, THE Sistema SHALL incluir detalles de infracción, fecha, y enlace a perfil
3. WHEN se genera email de bloqueo, THE Sistema SHALL incluir duración, fecha de fin, y motivo
4. WHEN se genera email de cancelación, THE Sistema SHALL incluir detalles de reserva cancelada y motivo
5. WHEN se genera email de reasignación, THE Sistema SHALL incluir número de plaza antigua y nueva con mapa
6. WHEN se genera cualquier email, THE Sistema SHALL incluir footer con enlace a preferencias y unsubscribe
7. WHEN se usa diseño responsive, THE Sistema SHALL verse correctamente en móvil y desktop
8. WHEN se incluyen botones, THE Sistema SHALL usar colores de marca y estados hover

### Requirement 18: Performance y Escalabilidad

**User Story:** Como sistema, necesito manejar eficientemente grandes volúmenes de notificaciones, de manera que el rendimiento no se degrade con el crecimiento.

#### Acceptance Criteria

1. WHEN se consultan notificaciones, THE Sistema SHALL usar índice compuesto para queries rápidos (< 50ms)
2. WHEN hay 1000+ notificaciones por usuario, THE Sistema SHALL implementar paginación con límite de 50 por página
3. WHEN se usan subscripciones real-time, THE Sistema SHALL limitar a notificaciones urgentes para reducir conexiones
4. WHEN se usa polling, THE Sistema SHALL implementar debounce para evitar queries excesivos
5. WHEN se envían emails en batch, THE Sistema SHALL procesar máximo 100 emails por invocación de Edge Function
6. WHEN se detecta rate limit de Resend, THE Sistema SHALL implementar retry con exponential backoff
7. WHEN se crean notificaciones masivas, THE Sistema SHALL usar INSERT batch en lugar de múltiples INSERTs

### Requirement 19: Preparación Multi-Tenant

**User Story:** Como desarrollador, necesito que el sistema esté preparado para multi-tenancy, de manera que la migración futura sea simple y sin downtime.

#### Acceptance Criteria

1. WHEN se crea cualquier notificación, THE Sistema SHALL incluir organization_id automáticamente
2. WHEN se consultan notificaciones, THE Sistema SHALL filtrar por organization_id del usuario
3. WHEN no existe organization_id en profiles, THE Sistema SHALL usar organización por defecto
4. WHEN se migra a multi-tenant, THE Sistema SHALL solo necesitar actualizar get_user_organization() sin cambiar tablas
5. WHEN se usan RLS policies, THE Sistema SHALL usar COALESCE para funcionar con y sin multi-tenancy
6. WHEN se crean preferencias, THE Sistema SHALL incluir organization_id para aislar configuraciones
