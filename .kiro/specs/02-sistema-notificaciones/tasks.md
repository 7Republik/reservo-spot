# Implementation Plan - 02 Sistema de Notificaciones

- [x] 1. Configurar estructura base de base de datos
  - Crear migración para tabla organizations con organización por defecto
  - Crear tabla notifications con todos los campos (organization_id, priority, category, etc.)
  - Crear tabla notification_preferences con switches por tipo
  - Crear índices optimizados (compuesto, unique, cleanup)
  - Aplicar políticas RLS en todas las tablas
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 19.1, 19.2, 19.3_

- [x] 2. Implementar funciones SQL de utilidad
  - Crear función get_user_organization() que retorna org del usuario o default
  - Crear función create_notification() con deduplicación automática
  - Crear función should_send_email() que verifica preferencias
  - Crear función mark_notification_as_read() con validación de propietario
  - Crear función mark_all_notifications_as_read() para usuario
  - Crear función get_unread_count() para contador
  - Crear función cleanup_old_notifications() para limpieza automática
  - Todas las funciones deben ser SECURITY DEFINER con SET search_path = public
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 18.1_

- [x] 3. Implementar triggers para notificaciones de waitlist
  - Crear trigger on_waitlist_offer_created que llama create_notification()
  - Trigger debe verificar should_send_email() antes de llamar Edge Function
  - Incluir datos de plaza (spot_number, group_name) en notification.data
  - Configurar action_url para navegación directa a oferta
  - Manejar errores sin bloquear operación principal
  - _Requirements: 4.1, 4.2, 4.3, 14.1, 14.7_

- [x] 4. Implementar triggers para notificaciones de amonestaciones y bloqueos
  - Crear trigger on_user_warning_created para amonestaciones
  - Crear trigger on_user_block_created para bloqueos temporales
  - Crear trigger on_user_block_expired para fin de bloqueo
  - Configurar priority 'high' para warnings y 'urgent' para blocks
  - Incluir detalles de infracción en notification.data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 14.2, 14.3_

- [x] 5. Implementar triggers para notificaciones de reservas
  - Crear trigger on_reservation_cancelled_by_admin
  - Detectar cuando admin cancela (status = 'cancelled' y cancelled_by IS NOT NULL)
  - Incluir motivo de cancelación en notification.message
  - Configurar priority 'high' y category 'reservation'
  - _Requirements: 6.1, 6.2, 14.4_

- [x] 6. Implementar triggers para notificaciones de incidentes
  - Crear trigger on_incident_reassignment cuando se asigna nueva plaza
  - Incluir número de plaza antigua y nueva en notification.data
  - Configurar priority 'high' y category 'incident'
  - Crear notificación de confirmación cuando se reporta incidente (priority 'low')
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 14.5_

- [x] 7. Implementar triggers para notificaciones de matrículas
  - Crear trigger on_license_plate_approved (priority 'medium')
  - Crear trigger on_license_plate_rejected (priority 'high')
  - Incluir motivo de rechazo en notification.message
  - Configurar email solo para rechazos
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 14.6_

- [x] 8. Configurar Resend para envío de emails
  - Crear cuenta en Resend (free tier 3,000 emails/mes)
  - Verificar dominio personalizado (noreply@reserveo.com)
  - Obtener API key y guardar en variables de entorno
  - Configurar RESEND_API_KEY en Supabase Edge Functions
  - Probar envío de email de prueba
  - _Requirements: 10.10_

- [x] 9. Crear Edge Function send-notification
  - Crear función en supabase/functions/send-notification/index.ts
  - Validar parámetros de entrada (notification_id, user_id, type)
  - Obtener datos del usuario (email, full_name) desde profiles
  - Obtener datos de notificación desde tabla notifications
  - Verificar should_send_email() antes de enviar
  - Generar email HTML según tipo de notificación
  - Enviar email con Resend API
  - Actualizar email_sent y email_sent_at en notifications
  - Implementar retry con exponential backoff (3 intentos)
  - Registrar errores en logs sin romper flujo
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [x] 10. Crear templates de email HTML
  - Template para oferta de waitlist con countdown y botones Aceptar/Rechazar
  - Template para amonestación con detalles de infracción
  - Template para bloqueo temporal con duración y fecha de fin
  - Template para cancelación de reserva con motivo
  - Template para reasignación de plaza con mapa
  - Template para rechazo de matrícula con motivo
  - Todos los templates deben ser responsive (móvil y desktop)
  - Incluir footer con enlace a preferencias y unsubscribe
  - Usar colores de marca de Reserveo
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_

- [x] 11. Crear tipos TypeScript para notificaciones
  - Regenerar tipos de Supabase con nuevas tablas
  - Crear interfaces en src/types/notifications.ts
  - Definir NotificationPriority, NotificationCategory
  - Definir constante NOTIFICATION_TYPES con todos los tipos
  - Definir PRIORITY_CONFIG con colores e iconos
  - Exportar tipos desde index
  - _Requirements: Todos_

- [x] 12. Implementar hook useNotifications
  - Crear hook en src/hooks/useNotifications.ts
  - Usar React Query para cache (staleTime: 30s)
  - Query getNotifications() ordenado por priority DESC, created_at DESC
  - Calcular unreadCount desde notifications
  - Implementar real-time subscription solo para priority 'urgent'
  - Implementar polling cada 30s para notificaciones no urgentes
  - Mutation markAsRead() que llama función SQL
  - Mutation markAllAsRead() que llama función SQL
  - Mostrar toast cuando llega notificación urgente
  - Limpiar subscriptions y timers en unmount
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 18.3, 18.4_

- [x] 13. Crear componente NotificationItem
  - Crear componente en src/components/notifications/NotificationItem.tsx
  - Mostrar icono según priority (usando PRIORITY_CONFIG)
  - Mostrar título y mensaje
  - Aplicar estilos según is_read (opacidad reducida si leída)
  - Hacer click marca como leída y navega a action_url si existe
  - Mostrar timestamp relativo (hace 5 min, hace 1 hora, etc.)
  - Usar colores de borde según priority
  - _Requirements: 11.5, 11.6_

- [x] 14. Crear componente NotificationBell
  - Crear componente en src/components/notifications/NotificationBell.tsx
  - Usar icono Bell de lucide-react
  - Mostrar Badge con unreadCount (máximo "9+")
  - Implementar DropdownMenu con lista de notificaciones
  - Ordenar notificaciones por priority y fecha
  - Incluir botón "Marcar todas como leídas" en header del dropdown
  - Mostrar mensaje "No tienes notificaciones" si lista vacía
  - Limitar altura del dropdown (max-h-96) con scroll
  - Usar NotificationItem para cada notificación
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.7, 11.8_

- [x] 15. Integrar NotificationBell en Header
  - Importar NotificationBell en componente Header/Navbar
  - Posicionar junto a otros iconos de usuario
  - Usar Suspense con fallback de icono simple
  - Lazy load del componente para optimización
  - Solo mostrar si usuario está autenticado
  - _Requirements: 11.1_

- [x] 16. Crear hook useNotificationPreferences
  - Crear hook en src/hooks/useNotificationPreferences.ts
  - Query getPreferences() que obtiene preferencias del usuario
  - Crear preferencias con defaults si no existen
  - Mutation updatePreferences() para guardar cambios
  - Invalidar cache después de actualizar
  - Mostrar toast de confirmación al guardar
  - _Requirements: 9.1, 9.4_

- [x] 17. Crear componente NotificationPreferences
  - Crear componente en src/components/profile/NotificationPreferences.tsx
  - Sección "Notificaciones por Email" con master switch
  - Deshabilitar switches individuales si email_enabled = false
  - Agrupar switches por categoría (Críticas, Importantes, Informativas)
  - Incluir descripción de cada tipo de notificación
  - Mostrar aviso: "Las notificaciones in-app no se pueden desactivar"
  - Guardar cambios automáticamente al cambiar switch
  - _Requirements: 9.2, 9.3, 9.5, 9.6, 9.7, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 18. Integrar NotificationPreferences en página de perfil
  - Añadir sección de preferencias en Profile page
  - Usar tabs o accordion para organizar secciones
  - Posicionar después de información personal
  - _Requirements: 13.1_

- [x] 19. Configurar cron job de limpieza
  - Crear cron job en Supabase que ejecuta cleanup_old_notifications()
  - Configurar ejecución diaria a las 02:00 AM
  - Verificar que pg_cron está habilitado
  - Registrar resultado en logs
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 20. Crear función de recordatorio de ofertas waitlist
  - Crear función SQL send_waitlist_reminders() para cron
  - Buscar ofertas que expiran en 15 minutos y no tienen recordatorio
  - Crear notificación de recordatorio con priority 'urgent'
  - Llamar Edge Function para enviar email de recordatorio
  - Marcar oferta como "reminder_sent" para evitar duplicados
  - _Requirements: 4.3_

- [x] 21. Configurar cron job de recordatorios waitlist
  - Crear cron job que ejecuta send_waitlist_reminders() cada 5 minutos
  - Verificar que no se solapa con otros cron jobs
  - _Requirements: 4.3_

- [ ]* 22. Escribir tests unitarios para funciones SQL
  - Test para create_notification() con deduplicación
  - Test para should_send_email() con diferentes preferencias
  - Test para mark_notification_as_read() con validación
  - Test para get_user_organization() con y sin org en profiles
  - Test para cleanup_old_notifications() con diferentes fechas
  - Usar pgTAP o similar
  - _Requirements: Todos_

- [ ]* 23. Escribir tests de integración
  - Test de flujo completo: trigger → notificación → email
  - Test de preferencias: email_enabled = false no envía email
  - Test de deduplicación: no crear notificaciones duplicadas
  - Test de real-time: subscription recibe notificaciones urgentes
  - Test de polling: actualiza notificaciones cada 30s
  - _Requirements: Todos_

- [ ]* 24. Escribir tests E2E con Playwright
  - Test de usuario viendo notificaciones en NotificationBell
  - Test de marcar notificación como leída
  - Test de marcar todas como leídas
  - Test de actualizar preferencias de email
  - Test de navegación desde notificación a action_url
  - _Requirements: Todos_

- [ ] 25. Configurar monitoreo y alertas
  - Crear query para detectar tasa de error de emails > 5%
  - Crear query para detectar notificaciones urgentes no leídas > 7 días
  - Configurar alertas en Supabase Dashboard
  - Documentar métricas importantes a trackear
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 26. Documentar sistema de notificaciones
  - Actualizar README con sección de notificaciones
  - Documentar tipos de notificaciones y cuándo se envían
  - Documentar configuración de Resend
  - Documentar variables de entorno necesarias
  - Crear guía de troubleshooting para emails no recibidos
  - Documentar cómo añadir nuevos tipos de notificaciones
  - _Requirements: Todos_

- [ ] 27. Realizar pruebas de carga
  - Test con 100 notificaciones creadas simultáneamente
  - Test de envío de 50 emails en batch
  - Verificar performance de queries con índices
  - Verificar que real-time subscriptions no degradan performance
  - Ajustar configuración si es necesario
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_
