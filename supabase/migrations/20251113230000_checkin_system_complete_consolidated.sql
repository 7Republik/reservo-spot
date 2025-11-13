-- =====================================================
-- RESERVEO - SISTEMA DE CHECK-IN/CHECK-OUT COMPLETO
-- =====================================================
-- Migración Consolidada: Sistema completo de check-in/check-out
-- Fecha: 2025-11-13
-- Versión: 1.0.0
-- =====================================================
-- 
-- DESCRIPCIÓN:
-- Este archivo documenta el sistema completo de check-in/check-out
-- implementado en RESERVEO. El sistema permite a los usuarios indicar
-- cuándo están usando una plaza reservada (check-in) y cuándo la liberan
-- (check-out), permitiendo la reutilización de plazas el mismo día.
--
-- CARACTERÍSTICAS PRINCIPALES:
-- - Check-in/check-out simple desde la sección "Hoy"
-- - Detección automática de infracciones
-- - Generación automática de amonestaciones y bloqueos
-- - Configuración global y por grupo de parking
-- - Sistema de notificaciones de recordatorio
-- - Reporting completo para administradores
-- - Histórico para análisis y estadísticas
--
-- COMPONENTES:
-- 1. Schema de Base de Datos (5 tablas nuevas + extensiones)
-- 2. Funciones de Negocio (8 funciones principales)
-- 3. Trabajos Programados (5 jobs de pg_cron)
-- 4. Políticas de Seguridad (RLS en todas las tablas)
-- 5. Índices de Optimización (11 índices)
-- 6. Triggers de Auditoría (3 triggers)
--
-- REQUISITOS:
-- - PostgreSQL 14+
-- - Extensión pg_cron habilitada
-- - Tablas existentes: reservations, parking_spots, parking_groups,
--   user_warnings, auth.users, profiles
--
-- NOTAS DE IMPLEMENTACIÓN:
-- Este archivo es una DOCUMENTACIÓN CONSOLIDADA del sistema.
-- Las migraciones reales ya fueron aplicadas en archivos separados:
-- - 20251113211001_create_checkin_system_schema.sql
-- - 20251113211326_add_checkin_database_functions.sql
-- - 20251113211628_add_checkin_database_functions.sql (actualización)
-- - 20251113212344_setup_checkin_cron_jobs.sql
-- - 20251113212555_add_checkin_reminder_job.sql
-- - 20251113220214_add_user_block_validation_to_reservations.sql
-- - 20251113221059_add_checkin_notification_system.sql
--
-- NO EJECUTAR ESTE ARCHIVO DIRECTAMENTE - Solo para referencia
-- =====================================================


-- =====================================================
-- PARTE 1: SCHEMA DE BASE DE DATOS
-- =====================================================

-- =====================================================
-- 1.1 TABLA: checkin_settings (Configuración Global)
-- =====================================================
-- Tabla singleton para configuración global del sistema
-- Solo puede existir un registro con ID fijo
-- 
-- Columnas principales:
-- - system_enabled: Activa/desactiva el sistema globalmente
-- - default_checkin_window_hours: Ventana de tiempo para check-in (1-24h)
-- - grace_period_minutes: Periodo de gracia después de la ventana (0-120min)
-- - checkin_infraction_threshold: Infracciones de check-in para amonestación (1-20)
-- - checkout_infraction_threshold: Infracciones de check-out para amonestación (1-20)
-- - temporary_block_days: Duración del bloqueo temporal (1-90 días)
-- - send_checkin_reminders: Activa/desactiva notificaciones de recordatorio
--
-- Valores por defecto:
-- - system_enabled: FALSE (desactivado por seguridad)
-- - default_checkin_window_hours: 24 (todo el día)
-- - grace_period_minutes: 60 (1 hora de gracia)
-- - checkin_infraction_threshold: 3
-- - checkout_infraction_threshold: 3
-- - temporary_block_days: 7
-- - send_checkin_reminders: TRUE
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 1.2 TABLA: parking_group_checkin_config
-- =====================================================
-- Configuración de check-in específica por grupo de parking
-- Permite personalizar la ventana de check-in por grupo
--
-- Columnas principales:
-- - group_id: Referencia al grupo de parking (UNIQUE)
-- - enabled: Activa/desactiva check-in para este grupo
-- - use_custom_config: Si usa configuración personalizada o global
-- - custom_checkin_window_hours: Ventana personalizada (1-24h, nullable)
--
-- Comportamiento:
-- - Si enabled = FALSE, no se requiere check-in en este grupo
-- - Si use_custom_config = FALSE, usa default_checkin_window_hours
-- - Si use_custom_config = TRUE, usa custom_checkin_window_hours
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql


-- =====================================================
-- 1.3 TABLA: reservation_checkins
-- =====================================================
-- Registros de check-in y check-out de reservas
-- Un registro por reserva (UNIQUE constraint en reservation_id)
--
-- Columnas principales:
-- - reservation_id: Referencia a la reserva (UNIQUE)
-- - user_id: Usuario que realiza el check-in
-- - spot_id: Plaza reservada
-- - group_id: Grupo de la plaza
-- - checkin_at: Timestamp de check-in (NULL = no realizado)
-- - checkout_at: Timestamp de check-out (NULL = no realizado)
-- - is_continuous_reservation: Indica reserva de múltiples días consecutivos
-- - continuous_start_date: Fecha de inicio de reserva continua
-- - continuous_end_date: Fecha de fin de reserva continua
--
-- Validaciones:
-- - checkout_at debe ser NULL o posterior a checkin_at
-- - Si is_continuous_reservation = TRUE, debe tener fechas de inicio/fin
-- - Si is_continuous_reservation = FALSE, fechas deben ser NULL
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 1.4 TABLA: checkin_infractions
-- =====================================================
-- Registro de infracciones de check-in y check-out
-- Se crea automáticamente cuando se detecta una infracción
--
-- Columnas principales:
-- - user_id: Usuario que cometió la infracción
-- - reservation_id: Reserva asociada
-- - spot_id: Plaza asociada
-- - group_id: Grupo asociado
-- - infraction_type: 'checkin' o 'checkout'
-- - infraction_date: Fecha de la infracción
-- - detected_at: Timestamp de detección
-- - expected_checkin_window_end: Hora límite de la ventana
-- - grace_period_end: Hora límite del periodo de gracia
-- - warning_generated: Si ya se generó amonestación (FALSE por defecto)
-- - warning_id: Referencia a la amonestación generada
--
-- Flujo:
-- 1. Sistema detecta infracción (job cada 15 min)
-- 2. Crea registro con warning_generated = FALSE
-- 3. Job de amonestaciones cuenta infracciones pendientes
-- 4. Al alcanzar umbral, genera amonestación y marca warning_generated = TRUE
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql


-- =====================================================
-- 1.5 TABLA: user_blocks
-- =====================================================
-- Bloqueos temporales de usuarios por infracciones
-- Se crea automáticamente al generar amonestación
--
-- Columnas principales:
-- - user_id: Usuario bloqueado
-- - block_type: 'manual', 'automatic_checkin', 'automatic_checkout'
-- - reason: Descripción del motivo del bloqueo
-- - blocked_at: Timestamp de inicio del bloqueo
-- - blocked_until: Timestamp de fin del bloqueo
-- - warning_id: Referencia a la amonestación que causó el bloqueo
-- - is_active: Si el bloqueo está activo (TRUE por defecto)
-- - unblocked_at: Timestamp de desbloqueo (NULL si aún activo)
--
-- Comportamiento:
-- - Al crear bloqueo, se cancelan todas las reservas futuras del usuario
-- - Job cada hora desactiva bloqueos expirados (blocked_until <= NOW())
-- - Función is_user_blocked_by_checkin() verifica bloqueos activos
-- - Validación de reservas verifica bloqueos antes de permitir reservar
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 1.6 EXTENSIÓN: user_warnings
-- =====================================================
-- Se añaden columnas a la tabla existente user_warnings
-- para soportar amonestaciones automáticas
--
-- Columnas añadidas:
-- - warning_type: 'manual', 'automatic_checkin', 'automatic_checkout'
-- - infraction_count: Número de infracciones que causaron la amonestación
-- - auto_generated: Si fue generada automáticamente (FALSE por defecto)
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 1.7 EXTENSIÓN: profiles
-- =====================================================
-- Se añade columna a la tabla existente profiles
-- para preferencias de notificaciones
--
-- Columna añadida:
-- - checkin_reminders_enabled: Si el usuario desea recibir recordatorios (TRUE por defecto)
--
-- Implementado en: 20251113221059_add_checkin_notification_system.sql

-- =====================================================
-- 1.8 TABLA: checkin_notifications
-- =====================================================
-- Registro de notificaciones de check-in enviadas
-- Sirve como auditoría y evita notificaciones duplicadas
--
-- Columnas principales:
-- - user_id: Usuario que recibió la notificación
-- - reservation_id: Reserva asociada
-- - notification_type: 'checkin_reminder', 'late_checkin_warning', 'infraction_notice'
-- - subject: Asunto de la notificación
-- - message: Contenido de la notificación
-- - spot_number: Plaza asociada
-- - group_name: Grupo asociado
-- - minutes_remaining: Minutos restantes hasta el fin del periodo de gracia
-- - sent_at: Timestamp de envío
-- - delivery_status: 'sent', 'failed', 'pending'
--
-- Implementado en: 20251113221059_add_checkin_notification_system.sql


-- =====================================================
-- PARTE 2: FUNCIONES DE NEGOCIO
-- =====================================================

-- =====================================================
-- 2.1 FUNCIÓN: perform_checkin(reservation_id, user_id)
-- =====================================================
-- Registra el check-in de un usuario para su reserva activa
--
-- Parámetros:
-- - p_reservation_id: UUID de la reserva
-- - p_user_id: UUID del usuario
--
-- Retorna: JSON con estructura:
-- {
--   "success": boolean,
--   "error": string (código de error),
--   "message": string (mensaje descriptivo),
--   "checkin_at": timestamp,
--   "was_late": boolean
-- }
--
-- Validaciones:
-- 1. Reserva existe y pertenece al usuario
-- 2. Reserva es para el día actual y está activa
-- 3. Sistema de check-in está habilitado globalmente
-- 4. Check-in está habilitado para el grupo
-- 5. No existe check-in previo para esta reserva
--
-- Comportamiento:
-- - Calcula ventana de check-in según configuración (global o grupo)
-- - Calcula periodo de gracia
-- - Determina si el check-in es tardío (NOW() > grace_end)
-- - Crea o actualiza registro en reservation_checkins
-- - Si es tardío, registra infracción automáticamente
--
-- Códigos de error:
-- - NO_ACTIVE_RESERVATION: No hay reserva válida para hoy
-- - SYSTEM_DISABLED: Sistema desactivado globalmente
-- - GROUP_DISABLED: Check-in desactivado para este grupo
-- - ALREADY_CHECKED_IN: Ya existe check-in para esta reserva
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql


-- =====================================================
-- 2.2 FUNCIÓN: perform_checkout(reservation_id, user_id)
-- =====================================================
-- Registra el check-out de un usuario
--
-- Parámetros:
-- - p_reservation_id: UUID de la reserva
-- - p_user_id: UUID del usuario
--
-- Retorna: JSON con estructura:
-- {
--   "success": boolean,
--   "error": string (código de error),
--   "message": string (mensaje descriptivo),
--   "checkout_at": timestamp,
--   "checkin_at": timestamp,
--   "duration_minutes": number
-- }
--
-- Validaciones:
-- 1. Existe check-in activo para esta reserva
-- 2. Check-in pertenece al usuario
-- 3. No existe checkout previo
--
-- Comportamiento:
-- - Actualiza checkout_at en reservation_checkins
-- - Calcula duración de la estancia
-- - La plaza queda disponible automáticamente para reservas del mismo día
--   (mediante función get_available_spots_with_checkout)
--
-- Códigos de error:
-- - NO_CHECKIN_FOUND: No hay check-in activo para esta reserva
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql

-- =====================================================
-- 2.3 FUNCIÓN: detect_checkin_infractions()
-- =====================================================
-- Detecta reservas sin check-in que superaron el periodo de gracia
--
-- Parámetros: Ninguno
--
-- Retorna: INTEGER (cantidad de infracciones detectadas)
--
-- Comportamiento:
-- 1. Verifica que el sistema esté habilitado
-- 2. Busca reservas activas del día sin check-in
-- 3. Para cada reserva:
--    - Obtiene configuración del grupo
--    - Si el grupo tiene check-in desactivado, salta
--    - Calcula ventana de check-in y periodo de gracia
--    - Si NOW() > grace_end, registra infracción
-- 4. Evita duplicados (verifica que no exista infracción previa)
--
-- Ejecutado por: Job 'checkin-infraction-detection' cada 15 minutos
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql


-- =====================================================
-- 2.4 FUNCIÓN: detect_checkout_infractions()
-- =====================================================
-- Detecta check-ins de días anteriores sin checkout
--
-- Parámetros: Ninguno
--
-- Retorna: INTEGER (cantidad de infracciones detectadas)
--
-- Comportamiento:
-- 1. Verifica que el sistema esté habilitado
-- 2. Busca check-ins con:
--    - checkin_at IS NOT NULL
--    - checkout_at IS NULL
--    - reservation_date < CURRENT_DATE
-- 3. Excluye reservas continuas que aún están activas
--    (continuous_end_date >= CURRENT_DATE)
-- 4. Registra infracción de tipo 'checkout'
-- 5. Evita duplicados
--
-- Ejecutado por: Job 'checkin-daily-reset' a las 00:00
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql

-- =====================================================
-- 2.5 FUNCIÓN: generate_automatic_warnings()
-- =====================================================
-- Genera amonestaciones automáticas al alcanzar umbral de infracciones
--
-- Parámetros: Ninguno
--
-- Retorna: INTEGER (cantidad de amonestaciones generadas)
--
-- Comportamiento:
-- 1. Verifica que el sistema esté habilitado
-- 2. Cuenta infracciones pendientes por usuario y tipo
-- 3. Para infracciones de check-in:
--    - Si COUNT >= checkin_infraction_threshold:
--      a. Crea amonestación automática
--      b. Marca infracciones como procesadas (warning_generated = TRUE)
--      c. Crea bloqueo temporal (temporary_block_days)
--      d. Cancela reservas futuras durante el bloqueo
-- 4. Repite proceso para infracciones de check-out
--
-- Ejecutado por: Job 'checkin-warning-generation' cada hora
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql

-- =====================================================
-- 2.6 FUNCIÓN: is_user_blocked_by_checkin(user_id)
-- =====================================================
-- Verifica si un usuario tiene un bloqueo activo
--
-- Parámetros:
-- - p_user_id: UUID del usuario
--
-- Retorna: BOOLEAN (TRUE si está bloqueado)
--
-- Comportamiento:
-- - Busca en user_blocks:
--   - user_id = p_user_id
--   - is_active = TRUE
--   - blocked_until > NOW()
--   - block_type IN ('automatic_checkin', 'automatic_checkout')
--
-- Usado por:
-- - Validación de reservas (validate_parking_spot_reservation)
-- - Frontend para mostrar estado de bloqueo
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql


-- =====================================================
-- 2.7 FUNCIÓN: get_available_spots_with_checkout(group_id, date)
-- =====================================================
-- Obtiene plazas disponibles incluyendo las liberadas por checkout
--
-- Parámetros:
-- - p_group_id: UUID del grupo (NULL para todos los grupos)
-- - p_date: DATE de la reserva
--
-- Retorna: TABLE (spot_id, spot_number, is_early_checkout)
--
-- Comportamiento:
-- - Busca plazas activas del grupo
-- - Incluye plazas sin reserva activa
-- - Incluye plazas con checkout realizado el mismo día (p_date = CURRENT_DATE)
-- - Marca plazas liberadas con is_early_checkout = TRUE
--
-- Usado por:
-- - Frontend para mostrar plazas disponibles
-- - Lógica de selección de plazas
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql

-- =====================================================
-- 2.8 FUNCIÓN: send_checkin_reminders()
-- =====================================================
-- Envía recordatorios de check-in a usuarios con reservas activas
--
-- Parámetros: Ninguno
--
-- Retorna: TABLE (notification_id, user_id, user_email, user_name, 
--                 spot_number, group_name, reservation_date, 
--                 minutes_remaining, notification_sent)
--
-- Comportamiento:
-- 1. Verifica que sistema y recordatorios estén habilitados
-- 2. Busca reservas activas del día sin check-in
-- 3. Filtra por:
--    - Grupo tiene check-in habilitado
--    - Aún no pasó el periodo de gracia
--    - Ya estamos dentro de la ventana de check-in
--    - Usuario tiene recordatorios habilitados (checkin_reminders_enabled = TRUE)
--    - No se envió notificación en las últimas 2 horas (evitar spam)
-- 4. Para cada reserva:
--    - Calcula minutos restantes
--    - Construye mensaje de notificación
--    - Registra en checkin_notifications
--    - Retorna información de la notificación
--
-- Ejecutado por: Job 'checkin-reminder-notifications' cada 30 min (6:00-22:00)
--
-- Implementado en: 20251113221059_add_checkin_notification_system.sql

-- =====================================================
-- 2.9 FUNCIÓN: get_user_checkin_notifications(user_id, limit)
-- =====================================================
-- Obtiene notificaciones de check-in de un usuario
--
-- Parámetros:
-- - p_user_id: UUID del usuario (NULL = usuario autenticado)
-- - p_limit: INTEGER (cantidad máxima de notificaciones, default 50)
--
-- Retorna: TABLE (id, notification_type, subject, message, 
--                 spot_number, group_name, minutes_remaining, sent_at)
--
-- Implementado en: 20251113221059_add_checkin_notification_system.sql


-- =====================================================
-- PARTE 3: TRABAJOS PROGRAMADOS (pg_cron)
-- =====================================================

-- =====================================================
-- 3.1 JOB: checkin-daily-reset (00:00 diario)
-- =====================================================
-- Ejecuta tareas de reset diario
--
-- Horario: 0 0 * * * (todos los días a las 00:00)
--
-- Tareas:
-- 1. Ejecuta detect_checkout_infractions() para detectar
--    check-ins del día anterior sin checkout
-- 2. Actualiza estado de check-ins finalizados
--    (marca updated_at para check-ins de días anteriores)
--
-- Implementado en: 20251113212344_setup_checkin_cron_jobs.sql

-- =====================================================
-- 3.2 JOB: checkin-infraction-detection (cada 15 min)
-- =====================================================
-- Detecta infracciones de check-in periódicamente
--
-- Horario: */15 * * * * (cada 15 minutos)
--
-- Tareas:
-- 1. Ejecuta detect_checkin_infractions()
--
-- Implementado en: 20251113212344_setup_checkin_cron_jobs.sql

-- =====================================================
-- 3.3 JOB: checkin-warning-generation (cada hora)
-- =====================================================
-- Genera amonestaciones automáticas
--
-- Horario: 0 * * * * (cada hora en el minuto 0)
--
-- Tareas:
-- 1. Ejecuta generate_automatic_warnings()
--
-- Implementado en: 20251113212344_setup_checkin_cron_jobs.sql

-- =====================================================
-- 3.4 JOB: checkin-block-expiration (cada hora)
-- =====================================================
-- Desactiva bloqueos expirados
--
-- Horario: 0 * * * * (cada hora en el minuto 0)
--
-- Tareas:
-- 1. Actualiza user_blocks:
--    - SET is_active = FALSE, unblocked_at = NOW()
--    - WHERE is_active = TRUE AND blocked_until <= NOW()
--
-- Implementado en: 20251113212344_setup_checkin_cron_jobs.sql

-- =====================================================
-- 3.5 JOB: checkin-reminder-notifications (cada 30 min)
-- =====================================================
-- Envía recordatorios de check-in
--
-- Horario: */30 6-22 * * * (cada 30 min entre 6:00 y 22:00)
--
-- Tareas:
-- 1. Ejecuta send_checkin_reminders()
--
-- Implementado en: 20251113212555_add_checkin_reminder_job.sql
--              y: 20251113221059_add_checkin_notification_system.sql


-- =====================================================
-- PARTE 4: ÍNDICES DE OPTIMIZACIÓN
-- =====================================================

-- =====================================================
-- 4.1 ÍNDICES: reservation_checkins
-- =====================================================
-- idx_checkins_user_date: Búsquedas por usuario y fecha
-- idx_checkins_group_date: Búsquedas por grupo y fecha
-- idx_checkins_pending: Check-ins pendientes (checkin_at IS NULL)
-- idx_checkins_reservation: Búsquedas por reserva
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 4.2 ÍNDICES: checkin_infractions
-- =====================================================
-- idx_infractions_user: Búsquedas por usuario y fecha
-- idx_infractions_pending_warning: Infracciones sin amonestación
-- idx_infractions_type_date: Búsquedas por tipo y fecha
-- idx_infractions_date: Búsquedas por fecha
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 4.3 ÍNDICES: user_blocks
-- =====================================================
-- idx_user_blocks_active: Bloqueos activos por usuario
-- idx_user_blocks_expiry: Bloqueos por fecha de expiración
-- idx_user_blocks_user: Búsquedas por usuario y fecha de expiración
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 4.4 ÍNDICES: parking_group_checkin_config
-- =====================================================
-- idx_group_checkin_config_group: Búsquedas por grupo
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 4.5 ÍNDICES: checkin_notifications
-- =====================================================
-- idx_checkin_notifications_user: Notificaciones por usuario
-- idx_checkin_notifications_reservation: Notificaciones por reserva
-- idx_checkin_notifications_type_date: Notificaciones por tipo y fecha
--
-- Implementado en: 20251113221059_add_checkin_notification_system.sql


-- =====================================================
-- PARTE 5: POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- =====================================================
-- 5.1 RLS: checkin_settings
-- =====================================================
-- Políticas:
-- 1. Deny anon access (anónimos no pueden acceder)
-- 2. Authenticated users can view (usuarios autenticados pueden ver)
-- 3. Only admins can update (solo admins pueden actualizar)
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 5.2 RLS: parking_group_checkin_config
-- =====================================================
-- Políticas:
-- 1. Deny anon access (anónimos no pueden acceder)
-- 2. Users can view group config (usuarios ven config de sus grupos)
-- 3. Only admins can manage (solo admins pueden crear/actualizar/eliminar)
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 5.3 RLS: reservation_checkins
-- =====================================================
-- Políticas:
-- 1. Deny anon access (anónimos no pueden acceder)
-- 2. Users can view own checkins (usuarios ven sus check-ins)
-- 3. Users can create own checkins (usuarios crean sus check-ins)
-- 4. Users can update own checkins (usuarios actualizan sus check-ins)
-- 5. Admins can view all (admins ven todos los check-ins)
-- 6. Admins can manage all (admins gestionan todos los check-ins)
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 5.4 RLS: checkin_infractions
-- =====================================================
-- Políticas:
-- 1. Deny anon access (anónimos no pueden acceder)
-- 2. Users can view own infractions (usuarios ven sus infracciones)
-- 3. Admins can view all (admins ven todas las infracciones)
-- 4. Only admins can create (solo admins/sistema crean infracciones)
-- 5. Only admins can update (solo admins actualizan infracciones)
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 5.5 RLS: user_blocks
-- =====================================================
-- Políticas:
-- 1. Deny anon access (anónimos no pueden acceder)
-- 2. Users can view own blocks (usuarios ven sus bloqueos)
-- 3. Admins can view all (admins ven todos los bloqueos)
-- 4. Only admins can manage (solo admins crean/actualizan bloqueos)
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 5.6 RLS: checkin_notifications
-- =====================================================
-- Políticas:
-- 1. Deny anon access (anónimos no pueden acceder)
-- 2. Users view own notifications (usuarios ven sus notificaciones)
-- 3. Admins view all (admins ven todas las notificaciones)
-- 4. System creates notifications (solo sistema/admins crean notificaciones)
--
-- Implementado en: 20251113221059_add_checkin_notification_system.sql


-- =====================================================
-- PARTE 6: TRIGGERS DE AUDITORÍA
-- =====================================================

-- =====================================================
-- 6.1 TRIGGER: update_checkin_settings_updated_at
-- =====================================================
-- Actualiza automáticamente updated_at en checkin_settings
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 6.2 TRIGGER: update_group_checkin_config_updated_at
-- =====================================================
-- Actualiza automáticamente updated_at en parking_group_checkin_config
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- 6.3 TRIGGER: update_reservation_checkins_updated_at
-- =====================================================
-- Actualiza automáticamente updated_at en reservation_checkins
--
-- Implementado en: 20251113211001_create_checkin_system_schema.sql

-- =====================================================
-- PARTE 7: PERMISOS DE FUNCIONES
-- =====================================================

-- =====================================================
-- 7.1 FUNCIONES PÚBLICAS (authenticated)
-- =====================================================
-- Funciones que pueden ser ejecutadas por usuarios autenticados:
-- - perform_checkin(reservation_id, user_id)
-- - perform_checkout(reservation_id, user_id)
-- - is_user_blocked_by_checkin(user_id)
-- - get_available_spots_with_checkout(group_id, date)
-- - get_user_checkin_notifications(user_id, limit)
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql
--              y: 20251113221059_add_checkin_notification_system.sql

-- =====================================================
-- 7.2 FUNCIONES ADMINISTRATIVAS (service_role)
-- =====================================================
-- Funciones que solo pueden ser ejecutadas por pg_cron (service_role):
-- - detect_checkin_infractions()
-- - detect_checkout_infractions()
-- - generate_automatic_warnings()
-- - send_checkin_reminders()
--
-- Implementado en: 20251113211628_add_checkin_database_functions.sql
--              y: 20251113221059_add_checkin_notification_system.sql


-- =====================================================
-- PARTE 8: INTEGRACIÓN CON SISTEMA EXISTENTE
-- =====================================================

-- =====================================================
-- 8.1 VALIDACIÓN DE RESERVAS
-- =====================================================
-- La función validate_parking_spot_reservation() fue actualizada
-- para verificar bloqueos activos antes de permitir reservas
--
-- Validación añadida:
-- - Verifica si el usuario tiene bloqueos activos (is_user_blocked_by_checkin)
-- - Si está bloqueado, retorna error con fecha de fin del bloqueo
-- - Código de error: 'USER_BLOCKED'
--
-- Implementado en: 20251113220214_add_user_block_validation_to_reservations.sql

-- =====================================================
-- PARTE 9: FLUJO COMPLETO DEL SISTEMA
-- =====================================================

-- =====================================================
-- 9.1 FLUJO DE CHECK-IN
-- =====================================================
-- 1. Usuario accede a la sección "Hoy" en el frontend
-- 2. Frontend carga reserva activa del día con check-in incluido
-- 3. Si no hay check-in, muestra botón "Llegué"
-- 4. Usuario hace clic en "Llegué"
-- 5. Frontend llama a perform_checkin(reservation_id, user_id)
-- 6. Función valida:
--    - Reserva existe y es del usuario
--    - Sistema y grupo tienen check-in habilitado
--    - No existe check-in previo
-- 7. Función calcula si es tardío (NOW() > grace_end)
-- 8. Función registra check-in en reservation_checkins
-- 9. Si es tardío, registra infracción en checkin_infractions
-- 10. Función retorna resultado con flag was_late
-- 11. Frontend muestra confirmación (warning si fue tardío)
-- 12. Frontend actualiza UI mostrando hora de check-in y botón "Me voy"

-- =====================================================
-- 9.2 FLUJO DE CHECK-OUT
-- =====================================================
-- 1. Usuario con check-in activo ve botón "Me voy"
-- 2. Usuario hace clic en "Me voy"
-- 3. Frontend llama a perform_checkout(reservation_id, user_id)
-- 4. Función valida que existe check-in activo
-- 5. Función registra checkout_at en reservation_checkins
-- 6. Función calcula duración de la estancia
-- 7. Plaza queda disponible para reservas del mismo día
-- 8. Frontend muestra confirmación
-- 9. Frontend actualiza UI

-- =====================================================
-- 9.3 FLUJO DE DETECCIÓN DE INFRACCIONES
-- =====================================================
-- 1. Job 'checkin-infraction-detection' se ejecuta cada 15 minutos
-- 2. Llama a detect_checkin_infractions()
-- 3. Función busca reservas activas sin check-in
-- 4. Para cada reserva:
--    - Calcula ventana de check-in y periodo de gracia
--    - Si NOW() > grace_end, registra infracción
-- 5. Job 'checkin-daily-reset' se ejecuta a las 00:00
-- 6. Llama a detect_checkout_infractions()
-- 7. Función busca check-ins de días anteriores sin checkout
-- 8. Registra infracciones de checkout


-- =====================================================
-- 9.4 FLUJO DE GENERACIÓN DE AMONESTACIONES
-- =====================================================
-- 1. Job 'checkin-warning-generation' se ejecuta cada hora
-- 2. Llama a generate_automatic_warnings()
-- 3. Función cuenta infracciones pendientes por usuario y tipo
-- 4. Para usuarios con COUNT >= threshold:
--    a. Crea amonestación en user_warnings
--    b. Marca infracciones como procesadas (warning_generated = TRUE)
--    c. Crea bloqueo temporal en user_blocks
--    d. Cancela reservas futuras del usuario
-- 5. Job 'checkin-block-expiration' se ejecuta cada hora
-- 6. Desactiva bloqueos expirados (blocked_until <= NOW())

-- =====================================================
-- 9.5 FLUJO DE NOTIFICACIONES
-- =====================================================
-- 1. Job 'checkin-reminder-notifications' se ejecuta cada 30 min (6:00-22:00)
-- 2. Llama a send_checkin_reminders()
-- 3. Función busca reservas activas sin check-in
-- 4. Filtra por:
--    - Usuario tiene recordatorios habilitados
--    - No se envió notificación en las últimas 2 horas
-- 5. Para cada reserva:
--    - Calcula minutos restantes
--    - Construye mensaje de notificación
--    - Registra en checkin_notifications
-- 6. Sistema de notificaciones externo (futuro) envía emails/push

-- =====================================================
-- PARTE 10: COMANDOS DE VERIFICACIÓN
-- =====================================================

-- =====================================================
-- 10.1 VERIFICAR CONFIGURACIÓN
-- =====================================================
-- Ver configuración global:
-- SELECT * FROM public.checkin_settings;

-- Ver configuración de grupos:
-- SELECT * FROM public.parking_group_checkin_config;

-- Ver jobs programados:
-- SELECT * FROM cron.job WHERE jobname LIKE 'checkin-%';

-- =====================================================
-- 10.2 VERIFICAR DATOS
-- =====================================================
-- Ver check-ins de hoy:
-- SELECT * FROM public.reservation_checkins 
-- WHERE created_at::DATE = CURRENT_DATE;

-- Ver infracciones pendientes:
-- SELECT * FROM public.checkin_infractions 
-- WHERE warning_generated = FALSE;

-- Ver bloqueos activos:
-- SELECT * FROM public.user_blocks 
-- WHERE is_active = TRUE AND blocked_until > NOW();

-- Ver notificaciones enviadas hoy:
-- SELECT * FROM public.checkin_notifications 
-- WHERE sent_at::DATE = CURRENT_DATE;

-- =====================================================
-- 10.3 TESTING MANUAL
-- =====================================================
-- Simular check-in:
-- SELECT public.perform_checkin('reservation-uuid', 'user-uuid');

-- Simular check-out:
-- SELECT public.perform_checkout('reservation-uuid', 'user-uuid');

-- Detectar infracciones manualmente:
-- SELECT public.detect_checkin_infractions();
-- SELECT public.detect_checkout_infractions();

-- Generar amonestaciones manualmente:
-- SELECT public.generate_automatic_warnings();

-- Enviar recordatorios manualmente:
-- SELECT * FROM public.send_checkin_reminders();

-- Verificar si usuario está bloqueado:
-- SELECT public.is_user_blocked_by_checkin('user-uuid');

-- Ver plazas disponibles con checkout:
-- SELECT * FROM public.get_available_spots_with_checkout('group-uuid', CURRENT_DATE);


-- =====================================================
-- PARTE 11: CONFIGURACIÓN INICIAL RECOMENDADA
-- =====================================================

-- =====================================================
-- 11.1 ACTIVAR SISTEMA (PRODUCCIÓN)
-- =====================================================
-- IMPORTANTE: El sistema está desactivado por defecto
-- Para activarlo en producción:

-- UPDATE public.checkin_settings 
-- SET 
--   system_enabled = TRUE,
--   default_checkin_window_hours = 24,  -- Todo el día
--   grace_period_minutes = 60,          -- 1 hora de gracia
--   checkin_infraction_threshold = 3,   -- 3 infracciones de check-in
--   checkout_infraction_threshold = 3,  -- 3 infracciones de check-out
--   temporary_block_days = 7,           -- 7 días de bloqueo
--   send_checkin_reminders = TRUE       -- Enviar recordatorios
-- WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- =====================================================
-- 11.2 CONFIGURAR GRUPOS ESPECÍFICOS
-- =====================================================
-- Ejemplo: Grupo con ventana de check-in de 2 horas

-- INSERT INTO public.parking_group_checkin_config (
--   group_id,
--   enabled,
--   use_custom_config,
--   custom_checkin_window_hours
-- ) VALUES (
--   'group-uuid-here',
--   TRUE,
--   TRUE,
--   2  -- 2 horas de ventana
-- )
-- ON CONFLICT (group_id) DO UPDATE
-- SET 
--   enabled = EXCLUDED.enabled,
--   use_custom_config = EXCLUDED.use_custom_config,
--   custom_checkin_window_hours = EXCLUDED.custom_checkin_window_hours;

-- =====================================================
-- 11.3 DESACTIVAR CHECK-IN PARA UN GRUPO
-- =====================================================
-- Ejemplo: Desactivar check-in para grupo "Visitantes"

-- INSERT INTO public.parking_group_checkin_config (
--   group_id,
--   enabled
-- ) VALUES (
--   'visitors-group-uuid',
--   FALSE
-- )
-- ON CONFLICT (group_id) DO UPDATE
-- SET enabled = FALSE;

-- =====================================================
-- PARTE 12: MANTENIMIENTO Y TROUBLESHOOTING
-- =====================================================

-- =====================================================
-- 12.1 LIMPIAR INFRACCIONES ANTIGUAS
-- =====================================================
-- Eliminar infracciones de hace más de 90 días:
-- DELETE FROM public.checkin_infractions 
-- WHERE infraction_date < CURRENT_DATE - INTERVAL '90 days';

-- =====================================================
-- 12.2 LIMPIAR NOTIFICACIONES ANTIGUAS
-- =====================================================
-- Eliminar notificaciones de hace más de 30 días:
-- DELETE FROM public.checkin_notifications 
-- WHERE sent_at < NOW() - INTERVAL '30 days';

-- =====================================================
-- 12.3 RESETEAR INFRACCIONES DE UN USUARIO
-- =====================================================
-- Marcar todas las infracciones como procesadas:
-- UPDATE public.checkin_infractions 
-- SET warning_generated = TRUE 
-- WHERE user_id = 'user-uuid' AND warning_generated = FALSE;

-- =====================================================
-- 12.4 DESBLOQUEAR USUARIO MANUALMENTE
-- =====================================================
-- Desactivar bloqueo activo:
-- UPDATE public.user_blocks 
-- SET is_active = FALSE, unblocked_at = NOW() 
-- WHERE user_id = 'user-uuid' AND is_active = TRUE;

-- =====================================================
-- 12.5 VERIFICAR SALUD DEL SISTEMA
-- =====================================================
-- Estadísticas de hoy:
-- SELECT 
--   (SELECT COUNT(*) FROM public.reservation_checkins WHERE created_at::DATE = CURRENT_DATE) as checkins_today,
--   (SELECT COUNT(*) FROM public.reservation_checkins WHERE checkout_at::DATE = CURRENT_DATE) as checkouts_today,
--   (SELECT COUNT(*) FROM public.checkin_infractions WHERE infraction_date = CURRENT_DATE) as infractions_today,
--   (SELECT COUNT(*) FROM public.user_blocks WHERE is_active = TRUE) as active_blocks,
--   (SELECT COUNT(*) FROM public.checkin_notifications WHERE sent_at::DATE = CURRENT_DATE) as notifications_today;


-- =====================================================
-- PARTE 13: ROLLBACK Y CLEANUP
-- =====================================================

-- =====================================================
-- 13.1 DESACTIVAR SISTEMA TEMPORALMENTE
-- =====================================================
-- Para desactivar sin eliminar datos:
-- UPDATE public.checkin_settings 
-- SET system_enabled = FALSE 
-- WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- =====================================================
-- 13.2 ELIMINAR JOBS (ROLLBACK PARCIAL)
-- =====================================================
-- Para eliminar todos los jobs programados:
-- SELECT cron.unschedule('checkin-daily-reset');
-- SELECT cron.unschedule('checkin-infraction-detection');
-- SELECT cron.unschedule('checkin-warning-generation');
-- SELECT cron.unschedule('checkin-block-expiration');
-- SELECT cron.unschedule('checkin-reminder-notifications');

-- =====================================================
-- 13.3 ELIMINAR FUNCIONES (ROLLBACK PARCIAL)
-- =====================================================
-- Para eliminar todas las funciones:
-- DROP FUNCTION IF EXISTS public.perform_checkin(UUID, UUID);
-- DROP FUNCTION IF EXISTS public.perform_checkout(UUID, UUID);
-- DROP FUNCTION IF EXISTS public.detect_checkin_infractions();
-- DROP FUNCTION IF EXISTS public.detect_checkout_infractions();
-- DROP FUNCTION IF EXISTS public.generate_automatic_warnings();
-- DROP FUNCTION IF EXISTS public.is_user_blocked_by_checkin(UUID);
-- DROP FUNCTION IF EXISTS public.get_available_spots_with_checkout(UUID, DATE);
-- DROP FUNCTION IF EXISTS public.send_checkin_reminders();
-- DROP FUNCTION IF EXISTS public.get_user_checkin_notifications(UUID, INTEGER);

-- =====================================================
-- 13.4 ELIMINAR TABLAS (ROLLBACK COMPLETO)
-- =====================================================
-- ADVERTENCIA: Esto eliminará todos los datos del sistema
-- Para eliminar todas las tablas:
-- DROP TABLE IF EXISTS public.checkin_notifications CASCADE;
-- DROP TABLE IF EXISTS public.user_blocks CASCADE;
-- DROP TABLE IF EXISTS public.checkin_infractions CASCADE;
-- DROP TABLE IF EXISTS public.reservation_checkins CASCADE;
-- DROP TABLE IF EXISTS public.parking_group_checkin_config CASCADE;
-- DROP TABLE IF EXISTS public.checkin_settings CASCADE;

-- Para eliminar columnas añadidas:
-- ALTER TABLE public.user_warnings DROP COLUMN IF EXISTS warning_type;
-- ALTER TABLE public.user_warnings DROP COLUMN IF EXISTS infraction_count;
-- ALTER TABLE public.user_warnings DROP COLUMN IF EXISTS auto_generated;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS checkin_reminders_enabled;

-- =====================================================
-- PARTE 14: MÉTRICAS Y MONITOREO
-- =====================================================

-- =====================================================
-- 14.1 MÉTRICAS CLAVE
-- =====================================================
-- Tasa de cumplimiento de check-in (últimos 30 días):
-- SELECT 
--   COUNT(DISTINCT rc.reservation_id) * 100.0 / COUNT(DISTINCT r.id) as compliance_rate
-- FROM public.reservations r
-- LEFT JOIN public.reservation_checkins rc ON r.id = rc.reservation_id
-- WHERE r.reservation_date >= CURRENT_DATE - INTERVAL '30 days'
--   AND r.reservation_date < CURRENT_DATE
--   AND r.status = 'active';

-- Tasa de cumplimiento de check-out (últimos 30 días):
-- SELECT 
--   COUNT(DISTINCT CASE WHEN rc.checkout_at IS NOT NULL THEN rc.id END) * 100.0 / 
--   COUNT(DISTINCT rc.id) as checkout_compliance_rate
-- FROM public.reservation_checkins rc
-- JOIN public.reservations r ON rc.reservation_id = r.id
-- WHERE r.reservation_date >= CURRENT_DATE - INTERVAL '30 days'
--   AND r.reservation_date < CURRENT_DATE
--   AND rc.checkin_at IS NOT NULL;

-- Infracciones por tipo (últimos 30 días):
-- SELECT 
--   infraction_type,
--   COUNT(*) as total_infractions,
--   COUNT(DISTINCT user_id) as unique_users
-- FROM public.checkin_infractions
-- WHERE infraction_date >= CURRENT_DATE - INTERVAL '30 days'
-- GROUP BY infraction_type;

-- Usuarios con más infracciones (últimos 30 días):
-- SELECT 
--   p.full_name,
--   COUNT(*) as total_infractions,
--   SUM(CASE WHEN ci.infraction_type = 'checkin' THEN 1 ELSE 0 END) as checkin_infractions,
--   SUM(CASE WHEN ci.infraction_type = 'checkout' THEN 1 ELSE 0 END) as checkout_infractions
-- FROM public.checkin_infractions ci
-- JOIN public.profiles p ON ci.user_id = p.id
-- WHERE ci.infraction_date >= CURRENT_DATE - INTERVAL '30 days'
-- GROUP BY p.id, p.full_name
-- ORDER BY total_infractions DESC
-- LIMIT 10;

-- Efectividad de notificaciones (últimos 7 días):
-- SELECT 
--   DATE(cn.sent_at) as notification_date,
--   COUNT(DISTINCT cn.reservation_id) as notifications_sent,
--   COUNT(DISTINCT rc.reservation_id) as checkins_completed
-- FROM public.checkin_notifications cn
-- LEFT JOIN public.reservation_checkins rc ON cn.reservation_id = rc.reservation_id
-- WHERE cn.sent_at >= CURRENT_DATE - INTERVAL '7 days'
--   AND cn.notification_type = 'checkin_reminder'
-- GROUP BY DATE(cn.sent_at)
-- ORDER BY notification_date DESC;


-- =====================================================
-- PARTE 15: DOCUMENTACIÓN DE INTEGRACIÓN FRONTEND
-- =====================================================

-- =====================================================
-- 15.1 COMPONENTES REACT IMPLEMENTADOS
-- =====================================================
-- Componentes principales:
-- - TodayCheckinCard: Card de check-in/check-out en sección "Hoy"
-- - AdminCheckinConfigTab: Panel de configuración global
-- - GroupCheckinConfigSection: Configuración por grupo
-- - CheckinReportPanel: Panel de infracciones del día
-- - CheckinHistoryPanel: Histórico completo
-- - ActiveBlocksCard: Muestra bloqueos activos del usuario
--
-- Ubicación:
-- - src/components/dashboard/TodayCheckinCard.tsx
-- - src/components/admin/configuration/AdminCheckinConfigTab.tsx
-- - src/components/admin/groups/GroupCheckinConfigSection.tsx
-- - src/components/admin/reports/CheckinReportPanel.tsx
-- - src/components/admin/reports/CheckinHistoryPanel.tsx
-- - src/components/profile/ActiveBlocksCard.tsx

-- =====================================================
-- 15.2 HOOKS PERSONALIZADOS
-- =====================================================
-- Hooks implementados:
-- - useCheckin: Operaciones de check-in/check-out para usuarios
-- - useCheckinSettings: Gestión de configuración global (admin)
-- - useGroupCheckinConfig: Configuración por grupo (admin)
-- - useCheckinReports: Reporting de infracciones (admin)
-- - useUserBlocks: Gestión de bloqueos de usuario
--
-- Ubicación:
-- - src/hooks/useCheckin.ts
-- - src/hooks/admin/useCheckinSettings.ts
-- - src/hooks/admin/useGroupCheckinConfig.ts
-- - src/hooks/admin/useCheckinReports.ts
-- - src/hooks/useUserBlocks.ts

-- =====================================================
-- 15.3 TIPOS TYPESCRIPT
-- =====================================================
-- Tipos definidos en:
-- - src/types/checkin.types.ts
--
-- Interfaces principales:
-- - CheckinSettings
-- - ParkingGroupCheckinConfig
-- - ReservationCheckin
-- - CheckinInfraction
-- - UserBlock
-- - ReservationWithCheckin
-- - CheckinReportItem
-- - CheckinHistoryItem
-- - CheckinStats

-- =====================================================
-- 15.4 LLAMADAS RPC DESDE FRONTEND
-- =====================================================
-- Ejemplo de check-in:
-- const { data, error } = await supabase.rpc('perform_checkin', {
--   p_reservation_id: reservationId,
--   p_user_id: userId
-- });

-- Ejemplo de check-out:
-- const { data, error } = await supabase.rpc('perform_checkout', {
--   p_reservation_id: reservationId,
--   p_user_id: userId
-- });

-- Ejemplo de verificar bloqueo:
-- const { data, error } = await supabase.rpc('is_user_blocked_by_checkin', {
--   p_user_id: userId
-- });

-- =====================================================
-- PARTE 16: NOTAS FINALES
-- =====================================================

-- =====================================================
-- 16.1 DEPENDENCIAS
-- =====================================================
-- Este sistema depende de:
-- - PostgreSQL 14+ con extensión pg_cron
-- - Tablas existentes: reservations, parking_spots, parking_groups,
--   user_warnings, auth.users, profiles
-- - Funciones existentes: is_admin(user_id)
-- - Sistema de notificaciones (futuro) para envío de emails/push

-- =====================================================
-- 16.2 LIMITACIONES CONOCIDAS
-- =====================================================
-- 1. Sistema de notificaciones: Actualmente solo registra en BD,
--    falta integración con servicio de envío de emails/push
-- 2. Reservas continuas: Implementación básica, puede requerir
--    mejoras para casos complejos
-- 3. Timezone: Asume que todos los timestamps están en UTC,
--    conversión a timezone local debe hacerse en frontend

-- =====================================================
-- 16.3 MEJORAS FUTURAS
-- =====================================================
-- 1. Integración con sistema de notificaciones externo
-- 2. Dashboard de métricas en tiempo real
-- 3. Exportación de reportes en múltiples formatos (PDF, Excel)
-- 4. Configuración de umbrales por grupo (no solo global)
-- 5. Sistema de apelaciones para infracciones
-- 6. Integración con sistema de control de acceso físico
-- 7. Geofencing para check-in automático
-- 8. QR codes en plazas para check-in rápido

-- =====================================================
-- 16.4 CONTACTO Y SOPORTE
-- =====================================================
-- Para preguntas o problemas con el sistema de check-in:
-- - Revisar documentación en docs/
-- - Verificar logs de pg_cron: SELECT * FROM cron.job_run_details;
-- - Verificar configuración: SELECT * FROM public.checkin_settings;
-- - Contactar al equipo de desarrollo

-- =====================================================
-- FIN DE LA DOCUMENTACIÓN CONSOLIDADA
-- =====================================================
-- Versión: 1.0.0
-- Fecha: 2025-11-13
-- Sistema: RESERVEO - Check-in/Check-out
-- =====================================================

