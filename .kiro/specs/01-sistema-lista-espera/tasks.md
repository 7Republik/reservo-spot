# Implementation Plan - Sistema de Lista de Espera

- [ ] 1. Configurar estructura base de base de datos
  - Crear migración para tablas nuevas (waitlist_entries, waitlist_offers, waitlist_logs, waitlist_penalties, notifications)
  - Extender tabla reservation_settings con campos de lista de espera
  - Crear índices para optimización de queries
  - Aplicar políticas RLS en todas las tablas nuevas
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 2. Implementar funciones SQL de validación y utilidades
  - Crear función `get_waitlist_settings()` para obtener configuración
  - Crear función `check_user_waitlist_limit()` para validar límite de listas simultáneas
  - Crear función `check_user_penalty_status()` para verificar si usuario está bloqueado
  - Crear función `calculate_waitlist_position()` para calcular posición en cola
  - Crear función `get_next_in_waitlist()` para obtener siguiente usuario (con/sin prioridad por roles)
  - _Requirements: 2.2, 2.3, 2.4, 3.3, 3.4, 11.1, 11.2_

- [ ] 3. Implementar función de registro en lista de espera
  - Crear función SQL `register_in_waitlist(user_id, group_id, date)` con validaciones completas
  - Validar que lista de espera está habilitada globalmente
  - Validar que usuario tiene matrícula aprobada
  - Validar que usuario tiene acceso al grupo
  - Validar que no excede límite de listas simultáneas
  - Validar que usuario no está bloqueado por penalización
  - Crear entrada en waitlist_entries con status 'active'
  - Registrar acción en waitlist_logs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1_

- [ ] 4. Implementar función de procesamiento de lista de espera
  - Crear función SQL `process_waitlist_for_spot(spot_id, date)` como SECURITY DEFINER
  - Obtener grupo del spot
  - Buscar usuarios en lista de espera para ese grupo y fecha
  - Ordenar por prioridad (si habilitada) y timestamp
  - Verificar que primer usuario sigue activo y con matrícula aprobada
  - Si no es válido, buscar siguiente recursivamente
  - Llamar a create_waitlist_offer() si encuentra usuario válido
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5. Implementar función de creación de oferta
  - Crear función SQL `create_waitlist_offer(entry_id, spot_id)` como SECURITY DEFINER
  - Obtener configuración de tiempo de aceptación
  - Calcular expires_at = NOW() + acceptance_time_minutes
  - Insertar registro en waitlist_offers con status 'pending'
  - Actualizar waitlist_entry status a 'offer_pending'
  - Registrar en waitlist_logs (offer_created)
  - Retornar offer_id para notificaciones
  - _Requirements: 5.5, 5.6, 14.2_

- [ ] 6. Implementar trigger de cancelación de reserva
  - Crear trigger `on_reservation_cancelled` en tabla reservations
  - Detectar cuando status cambia a 'cancelled'
  - Llamar a process_waitlist_for_spot() con spot_id y date
  - Manejar errores y registrar en logs
  - _Requirements: 5.1_

- [ ] 7. Implementar función de aceptación de oferta
  - Crear función SQL `accept_waitlist_offer(offer_id, user_id)` como SECURITY DEFINER
  - Validar que oferta existe y no ha expirado
  - Validar que usuario es el destinatario
  - Verificar que plaza sigue disponible (no hay reserva activa)
  - Crear reserva confirmada en tabla reservations
  - Actualizar waitlist_offer status a 'accepted' y responded_at
  - Eliminar todas las waitlist_entries del usuario (sale de todas las listas)
  - Registrar en waitlist_logs (offer_accepted)
  - Retornar reservation_id
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 14.3_

- [ ] 8. Implementar función de rechazo de oferta
  - Crear función SQL `reject_waitlist_offer(offer_id, user_id)` como SECURITY DEFINER
  - Validar que oferta existe y usuario es destinatario
  - Actualizar waitlist_offer status a 'rejected' y responded_at
  - Actualizar waitlist_entry status de vuelta a 'active'
  - Si penalización habilitada, incrementar rejection_count en waitlist_penalties
  - Llamar a process_waitlist_for_spot() para buscar siguiente usuario
  - Registrar en waitlist_logs (offer_rejected)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 14.3_

- [ ] 9. Implementar función de expiración de ofertas
  - Crear función SQL `expire_waitlist_offers()` para llamar desde cron
  - Buscar ofertas con expires_at < NOW() y status = 'pending'
  - Para cada oferta expirada:
    - Actualizar status a 'expired' y responded_at
    - Actualizar entry status a 'active'
    - Si penalización habilitada, incrementar no_response_count
    - Verificar si alcanza threshold de penalización
    - Si alcanza threshold, bloquear usuario temporalmente
    - Llamar a process_waitlist_for_spot() para siguiente usuario
    - Registrar en waitlist_logs (offer_expired)
  - Retornar número de ofertas expiradas
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 11.2, 11.3, 14.3_

- [ ] 10. Implementar función de limpieza automática
  - Crear función SQL `cleanup_expired_waitlist_entries()` para llamar desde cron
  - Eliminar entradas con reservation_date < CURRENT_DATE
  - Eliminar entradas de usuarios bloqueados o desactivados
  - Eliminar entradas de usuarios sin matrícula aprobada
  - Eliminar entradas de usuarios sin acceso al grupo
  - Registrar en waitlist_logs (cleanup_executed) con detalles
  - Retornar número total de entradas eliminadas
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 14.4_

- [ ] 11. Configurar cron jobs en Supabase
  - Configurar cron job para expire_waitlist_offers() cada 5 minutos
  - Configurar cron job para cleanup_expired_waitlist_entries() diario a las 00:00
  - Configurar cron job para send_waitlist_reminders() cada 15 minutos
  - Verificar que pg_cron está habilitado en Supabase
  - Crear tabla de logs de ejecución de cron jobs
  - _Requirements: 8.1, 9.1, 12.1_

- [ ] 12. Implementar Edge Function de notificaciones
  - Crear Edge Function `send-waitlist-notification` en TypeScript
  - Recibir parámetros: offerId, userId, spotNumber, groupName, date, expiresAt
  - Obtener datos del usuario (email, nombre)
  - Generar email HTML con detalles de oferta y enlaces de aceptar/rechazar
  - Enviar email usando servicio de email (Resend, SendGrid, etc.)
  - Crear notificación in-app en tabla notifications
  - Programar recordatorios (mitad de tiempo y 15 min antes)
  - Manejar errores y reintentos
  - _Requirements: 5.6, 5.7, 13.1, 13.2, 13.3_

- [ ] 13. Implementar Edge Function de recordatorios
  - Crear Edge Function `send-waitlist-reminder` en TypeScript
  - Recibir parámetros: offerId, userId, timeRemaining
  - Obtener datos de la oferta y usuario
  - Generar email de recordatorio según urgencia (halfway o final)
  - Enviar email con enlace directo a aceptar/rechazar
  - Actualizar notificación in-app con urgencia
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 14. Crear tipos TypeScript para lista de espera
  - Regenerar tipos de Supabase con nuevas tablas
  - Crear interfaces para WaitlistEntry, WaitlistOffer, WaitlistLog, WaitlistPenalty
  - Crear tipos para configuración de lista de espera
  - Crear tipos para notificaciones
  - Exportar desde `src/types/waitlist.ts`
  - _Requirements: Todos_

- [ ] 15. Implementar hook useWaitlistSettings
  - Crear hook `useWaitlistSettings()` en `src/hooks/useWaitlistSettings.ts`
  - Obtener configuración de reservation_settings
  - Cachear configuración con React Query
  - Función para actualizar configuración (solo admin)
  - Invalidar cache al actualizar
  - _Requirements: 1.1, 2.1_

- [ ] 16. Implementar hook useWaitlist para usuarios
  - Crear hook `useWaitlist()` en `src/hooks/useWaitlist.ts`
  - Función `registerInWaitlist(groupIds, date)` para registrarse
  - Función `cancelWaitlistEntry(entryId)` para cancelar registro
  - Función `getUserWaitlistEntries()` para obtener entradas activas
  - Función `acceptOffer(offerId)` para aceptar oferta
  - Función `rejectOffer(offerId)` para rechazar oferta
  - Manejar errores y mostrar toasts
  - Invalidar queries después de mutaciones
  - _Requirements: 3.1, 3.2, 4.6, 6.1, 7.1_

- [ ] 17. Implementar hook useWaitlistOffers
  - Crear hook `useWaitlistOffers()` en `src/hooks/useWaitlistOffers.ts`
  - Función `getPendingOffers()` para obtener ofertas pendientes del usuario
  - Suscripción real-time a cambios en waitlist_offers
  - Calcular tiempo restante para cada oferta
  - Función `getOfferDetails(offerId)` para detalles completos
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 18. Implementar hook useNotifications
  - Crear hook `useNotifications()` en `src/hooks/useNotifications.ts`
  - Función `getUnreadNotifications()` para obtener no leídas
  - Función `markAsRead(notificationId)` para marcar como leída
  - Función `markAllAsRead()` para marcar todas
  - Suscripción real-time a nuevas notificaciones
  - Contador de notificaciones no leídas
  - _Requirements: 13.1, 13.5_

- [ ] 19. Crear componente WaitlistRegistration
  - Crear componente en `src/components/waitlist/WaitlistRegistration.tsx`
  - Mostrar cuando no hay plazas disponibles y waitlist está habilitada
  - Permitir seleccionar grupos específicos o "todos mis grupos"
  - Validar límite de listas simultáneas antes de enviar
  - Mostrar posición estimada después de registrarse
  - Manejar estados de loading y error
  - Mostrar mensaje si usuario está bloqueado
  - _Requirements: 3.1, 3.2, 3.3, 3.8_

- [ ] 20. Crear componente WaitlistDashboard
  - Crear componente en `src/components/waitlist/WaitlistDashboard.tsx`
  - Listar todas las entradas activas del usuario
  - Mostrar posición en cola para cada entrada
  - Mostrar cuántas personas hay delante
  - Botón para cancelar registro voluntariamente
  - Actualizar posiciones en tiempo real
  - Mostrar mensaje si no hay entradas activas
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 21. Crear componente WaitlistOfferNotification
  - Crear componente en `src/components/waitlist/WaitlistOfferNotification.tsx`
  - Mostrar detalles de la plaza ofrecida (número, grupo, fecha)
  - Countdown visual del tiempo restante
  - Botones de "Aceptar" y "Rechazar"
  - Deshabilitar botones si oferta expiró
  - Mostrar confirmación al aceptar
  - Mostrar confirmación al rechazar
  - Cerrar automáticamente después de acción
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 8.8_

- [ ] 22. Crear componente NotificationBell
  - Crear componente en `src/components/notifications/NotificationBell.tsx`
  - Icono de campana con badge de contador
  - Dropdown con lista de notificaciones
  - Marcar como leída al hacer click
  - Botón de "Marcar todas como leídas"
  - Actualización en tiempo real del contador
  - Integrar en header de la aplicación
  - _Requirements: 13.1, 13.5_

- [ ] 23. Integrar lista de espera en flujo de reserva
  - Modificar componente de reserva existente
  - Detectar cuando no hay plazas disponibles
  - Mostrar WaitlistRegistration en lugar de mensaje de error
  - Verificar que waitlist_enabled está activo
  - Mantener flujo normal si lista de espera deshabilitada
  - _Requirements: 3.1, 15.1_

- [ ] 24. Crear página de gestión de lista de espera de usuario
  - Crear página en `src/pages/WaitlistPage.tsx`
  - Mostrar WaitlistDashboard
  - Mostrar ofertas pendientes destacadas
  - Mostrar historial de ofertas (aceptadas/rechazadas/expiradas)
  - Añadir ruta en React Router
  - Añadir enlace en menú de navegación
  - _Requirements: 4.1, 6.1_

- [ ] 25. Implementar hook useAdminWaitlist
  - Crear hook `useAdminWaitlist()` en `src/hooks/admin/useAdminWaitlist.ts`
  - Función `getWaitlistStats()` para estadísticas globales
  - Función `getWaitlistByGroup(groupId, date)` para ver lista específica
  - Función `removeWaitlistEntry(entryId)` para eliminar manualmente
  - Función `getWaitlistLogs(filters)` para auditoría
  - Función `exportWaitlistLogs(filters)` para exportar CSV
  - Cachear datos con patrón useRef
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 14.5_

- [ ] 26. Crear componente AdminWaitlistStats
  - Crear componente en `src/components/admin/waitlist/AdminWaitlistStats.tsx`
  - Mostrar número total de usuarios en listas activas
  - Mostrar número de ofertas pendientes
  - Mostrar tasa de aceptación de ofertas
  - Mostrar tasa de rechazo y expiración
  - Gráficos de tendencias con recharts
  - Actualizar cada 30 segundos
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7_

- [ ] 27. Crear componente AdminWaitlistTable
  - Crear componente en `src/components/admin/waitlist/AdminWaitlistTable.tsx`
  - Tabla con lista de espera filtrable por grupo y fecha
  - Mostrar usuario, posición, tiempo en espera
  - Botón para eliminar entrada manualmente
  - Confirmación antes de eliminar
  - Paginación si hay muchas entradas
  - Exportar a CSV
  - _Requirements: 10.5, 10.6_

- [ ] 28. Crear componente AdminWaitlistConfig
  - Crear componente en `src/components/admin/waitlist/AdminWaitlistConfig.tsx`
  - Toggle para habilitar/deshabilitar lista de espera globalmente
  - Input para tiempo de aceptación (30-1440 minutos)
  - Input para máximo de listas simultáneas (1-10)
  - Toggle para prioridad por roles
  - Toggle para habilitar penalización
  - Input para umbral de penalización (2-10)
  - Input para duración de bloqueo (1-30 días)
  - Validación de todos los campos
  - Guardar configuración con confirmación
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 29. Crear página de admin de lista de espera
  - Crear página en `src/pages/admin/AdminWaitlistPage.tsx`
  - Tabs para: Estadísticas, Listas Activas, Configuración, Logs
  - Tab de Estadísticas: AdminWaitlistStats
  - Tab de Listas Activas: AdminWaitlistTable
  - Tab de Configuración: AdminWaitlistConfig
  - Tab de Logs: Tabla de auditoría con filtros
  - Añadir ruta en React Router (solo admin)
  - Añadir enlace en menú de admin
  - _Requirements: 10.1, 10.5, 10.6, 14.4_

- [ ]* 30. Escribir tests unitarios para funciones SQL
  - Test para register_in_waitlist() con diferentes escenarios
  - Test para process_waitlist_for_spot() con y sin prioridad
  - Test para accept_waitlist_offer() con validaciones
  - Test para reject_waitlist_offer() y siguiente en cola
  - Test para expire_waitlist_offers() con penalización
  - Test para cleanup_expired_waitlist_entries()
  - Usar pgTAP o similar para tests SQL
  - _Requirements: Todos_

- [ ]* 31. Escribir tests de integración
  - Test de flujo completo: registro → oferta → aceptación
  - Test de flujo de rechazo: oferta → rechazo → siguiente usuario
  - Test de flujo de expiración: oferta → timeout → penalización
  - Test de prioridad por roles
  - Test de límite de listas simultáneas
  - Test de limpieza automática
  - _Requirements: Todos_

- [ ]* 32. Escribir tests E2E con Playwright
  - Test de usuario registrándose en lista de espera
  - Test de usuario aceptando oferta
  - Test de usuario rechazando oferta
  - Test de admin viendo estadísticas
  - Test de admin cambiando configuración
  - Test de notificaciones en tiempo real
  - _Requirements: Todos_

- [ ] 33. Configurar monitoreo y alertas
  - Configurar métricas en Supabase Dashboard
  - Alertas para más de 100 usuarios en lista de espera
  - Alertas para tasa de aceptación < 50%
  - Alertas para cron jobs fallando
  - Dashboard de Grafana o similar (opcional)
  - _Requirements: Todos_

- [ ] 34. Documentar sistema de lista de espera
  - Actualizar README con información de lista de espera
  - Documentar configuración de cron jobs
  - Documentar Edge Functions y variables de entorno
  - Crear guía de usuario para lista de espera
  - Crear guía de admin para gestión
  - Documentar troubleshooting común
  - _Requirements: Todos_

- [ ] 35. Realizar pruebas de carga y optimización
  - Test con 1000 usuarios en lista de espera
  - Test de procesamiento de 100 ofertas simultáneas
  - Optimizar queries lentos
  - Ajustar índices si es necesario
  - Verificar que cron jobs no se solapan
  - _Requirements: Todos_
