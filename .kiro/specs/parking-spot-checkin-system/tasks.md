# Implementation Plan

- [x] 1. Crear schema de base de datos para check-in/check-out
  - Crear tabla `reservation_checkins` con campos para check-in, check-out y reservas continuas
  - Crear tabla `checkin_infractions` para registrar infracciones de check-in y check-out
  - Crear tabla `checkin_settings` (singleton) para configuración global del sistema
  - Crear tabla `parking_group_checkin_config` para configuración por grupo
  - Crear tabla `user_blocks` para bloqueos temporales automáticos
  - Extender tabla `user_warnings` con columnas para amonestaciones automáticas
  - Crear índices para optimizar consultas de check-ins, infracciones y bloqueos
  - Aplicar políticas RLS para todas las tablas nuevas
  - _Requirements: 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.2_

- [x] 2. Implementar funciones de base de datos para check-in/check-out
- [x] 2.1 Crear función `perform_checkin()`
  - Validar que la reserva existe y pertenece al usuario
  - Verificar que el sistema y el grupo tienen check-in habilitado
  - Calcular ventana de check-in y periodo de gracia según configuración
  - Registrar check-in con timestamp
  - Detectar si el check-in es tardío y registrar infracción si aplica
  - Retornar resultado con éxito y flag de tardío
  - _Requirements: 1.1, 1.2, 1.3, 4.3, 5.4, 6.1_

- [x] 2.2 Crear función `perform_checkout()`
  - Validar que existe check-in activo para la reserva
  - Registrar checkout con timestamp
  - Marcar la plaza como disponible para el día actual
  - Retornar resultado con éxito
  - _Requirements: 2.1, 2.2, 2.3, 18.1, 18.2_

- [x] 2.3 Crear función `detect_checkin_infractions()`
  - Buscar reservas activas del día sin check-in
  - Calcular ventana de check-in y periodo de gracia por grupo
  - Registrar infracciones para reservas que superaron el periodo de gracia
  - Excluir grupos con check-in desactivado
  - Retornar cantidad de infracciones detectadas
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 12.3_

- [ ] 2.4 Crear función `detect_checkout_infractions()`
  - Buscar check-ins de días anteriores sin checkout
  - Excluir reservas continuas que aún están activas
  - Registrar infracciones de checkout
  - Retornar cantidad de infracciones detectadas
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 2.5 Crear función `generate_automatic_warnings()`
  - Contar infracciones pendientes por usuario y tipo
  - Generar amonestación automática al alcanzar umbral configurado
  - Crear bloqueo temporal según duración configurada
  - Cancelar reservas futuras durante el periodo de bloqueo
  - Marcar infracciones como procesadas
  - Retornar cantidad de amonestaciones generadas
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.2, 10.3, 10.4_

- [ ] 2.6 Crear funciones auxiliares
  - `is_user_blocked_by_checkin()` para verificar bloqueos activos
  - `get_available_spots_with_checkout()` para incluir plazas liberadas por checkout
  - `send_checkin_reminders()` para enviar notificaciones de recordatorio
  - _Requirements: 10.4, 15.1, 18.2_

- [x] 3. Configurar trabajos programados (pg_cron)
- [x] 3.1 Crear job de reset diario (00:00)
  - Ejecutar `detect_checkout_infractions()` para el día anterior
  - Actualizar estado de check-ins finalizados
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3.2 Crear job de detección de infracciones (cada 15 min)
  - Ejecutar `detect_checkin_infractions()` periódicamente
  - _Requirements: 6.1, 6.2_

- [x] 3.3 Crear job de generación de amonestaciones (cada hora)
  - Ejecutar `generate_automatic_warnings()` para procesar infracciones acumuladas
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 3.4 Crear job de expiración de bloqueos (cada hora)
  - Desactivar bloqueos que han expirado
  - _Requirements: 10.5_

- [x] 3.5 Crear job de recordatorios de check-in (cada 30 min)
  - Enviar notificaciones a usuarios con reservas activas sin check-in
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 4. Crear tipos TypeScript para el sistema de check-in
  - Definir interfaces para `CheckinSettings`, `ParkingGroupCheckinConfig`, `ReservationCheckin`
  - Definir interfaces para `CheckinInfraction`, `UserBlock`, `ReservationWithCheckin`
  - Definir interfaces para reporting: `CheckinReportItem`, `CheckinHistoryItem`, `CheckinStats`
  - Definir enums y tipos para errores: `CheckinErrorCode`, `CheckinError`
  - Exportar todos los tipos desde `src/types/checkin.types.ts`
  - _Requirements: Todos (soporte de tipos)_

- [x] 5. Implementar hook useCheckin para operaciones de usuario
  - Crear función `checkin()` que llama a `perform_checkin` RPC
  - Crear función `checkout()` que llama a `perform_checkout` RPC
  - Manejar estados de loading y error
  - Mostrar toast de confirmación o error según resultado
  - Invalidar queries de React Query después de operaciones exitosas
  - Manejar caso especial de check-in tardío con warning toast
  - _Requirements: 1.2, 1.3, 2.2, 2.3_

- [x] 6. Crear componente TodayCheckinCard para sección "Hoy"
  - Mostrar información de la reserva activa del usuario
  - Mostrar botón "Llegué" cuando no hay check-in
  - Mostrar hora de check-in y botón "Me voy" después de check-in
  - Implementar animaciones de confirmación al hacer check-in/check-out
  - Manejar estados de loading durante operaciones
  - Mostrar mensaje cuando no hay reserva activa
  - Integrar con hook `useCheckin`
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 7. Integrar TodayCheckinCard en la sección "Hoy" existente
  - Añadir TodayCheckinCard al componente TodaySection
  - Cargar reserva activa del usuario con check-in incluido
  - Posicionar el card de forma prominente y accesible
  - Asegurar responsive design para móvil y desktop
  - _Requirements: 16.1, 16.2_

- [x] 8. Implementar hook useCheckinSettings para configuración global
  - Crear función `loadSettings()` con caché
  - Crear función `updateSettings()` para actualizar configuración
  - Manejar estados de loading y error
  - Invalidar caché después de actualizaciones
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 17.4_

- [x] 9. Crear componente AdminCheckinConfigTab para configuración global
  - Toggle para activar/desactivar sistema globalmente
  - Input para configurar periodo de gracia (0-120 minutos)
  - Inputs para umbrales de amonestación (check-in y check-out, 1-20)
  - Input para duración de bloqueo temporal (1-90 días)
  - Toggle para activar/desactivar notificaciones de recordatorio
  - Validación en tiempo real de valores dentro de rangos permitidos
  - Botón de guardar con confirmación
  - Integrar con hook `useCheckinSettings`
  - _Requirements: 11.1, 11.2, 5.2, 8.2, 8.3, 10.2, 15.4, 17.1, 17.2, 17.4_

- [x] 10. Añadir AdminCheckinConfigTab al panel de configuración admin
  - Crear nueva pestaña "Check-in/Check-out" en el panel de configuración
  - Integrar AdminCheckinConfigTab en la estructura existente
  - Asegurar que solo admins pueden acceder
  - _Requirements: 17.1, 17.2_

- [x] 11. Implementar hook useGroupCheckinConfig para configuración por grupo
  - Crear función `loadGroupConfig()` para obtener configuración de un grupo
  - Crear función `updateGroupConfig()` para actualizar configuración
  - Manejar configuración personalizada vs global
  - Manejar estados de loading y error
  - _Requirements: 4.1, 4.2, 4.3, 12.1, 12.2_

- [x] 12. Crear componente GroupCheckinConfigSection
  - Toggle para activar/desactivar check-in en el grupo
  - Toggle para usar configuración personalizada o global
  - Input para ventana de check-in personalizada (1-24 horas)
  - Indicador visual de configuración activa (global vs personalizada)
  - Validación de valores
  - Integrar con hook `useGroupCheckinConfig`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 12.1, 12.2, 12.3, 17.3_

- [x] 13. Integrar GroupCheckinConfigSection en gestión de grupos
  - Añadir sección de configuración de check-in al editar grupo
  - Mostrar configuración actual del grupo
  - Permitir edición solo a admins
  - _Requirements: 4.1, 12.1, 17.3_

- [x] 14. Implementar hook useCheckinReports para reporting
  - Crear función `loadTodayInfractions()` para obtener infracciones del día
  - Crear función `loadCheckinHistory()` para histórico completo
  - Implementar filtros por grupo, fecha, usuario, tipo
  - Crear función `exportToCSV()` para exportar datos
  - Calcular estadísticas de cumplimiento
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 15. Crear componente CheckinReportPanel para infracciones del día
  - Tabla de reservas sin check-in del día actual
  - Tabla de reservas sin check-out del día actual
  - Filtros por grupo, usuario
  - Botón de exportar a CSV
  - Mostrar estadísticas de cumplimiento del día
  - Actualización automática cada minuto
  - Integrar con hook `useCheckinReports`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 16. Crear componente CheckinHistoryPanel para histórico completo
  - Tabla paginada con histórico de check-ins y check-outs
  - Filtros avanzados (usuario, grupo, plaza, rango de fechas)
  - Mostrar duración de estancia calculada
  - Indicador de reservas continuas
  - Estadísticas por usuario y por grupo
  - Gráficos de tendencias de cumplimiento
  - Botón de exportar a CSV
  - Integrar con hook `useCheckinReports`
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 17. Añadir paneles de reporting al área de administración
  - Crear nueva sección "Reportes de Check-in" en el menú admin
  - Integrar CheckinReportPanel y CheckinHistoryPanel
  - Añadir navegación entre vista de infracciones e histórico
  - Asegurar que solo admins pueden acceder
  - _Requirements: 13.1, 14.1_

- [ ] 18. Modificar lógica de disponibilidad de plazas
  - Actualizar función `get_available_spots_by_group()` para incluir plazas con checkout
  - Añadir flag `is_early_checkout` en resultados
  - Mostrar indicador visual en plazas liberadas anticipadamente
  - Actualizar componente de selección de plazas para mostrar plazas liberadas
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 19. Implementar validación de bloqueos en reservas
  - Modificar función de validación de reservas para verificar bloqueos activos
  - Usar `is_user_blocked_by_checkin()` antes de permitir reserva
  - Mostrar mensaje claro al usuario bloqueado con fecha de fin de bloqueo
  - Prevenir creación de reservas durante periodo de bloqueo
  - _Requirements: 10.3, 10.4_

- [x] 20. Actualizar perfil de usuario para mostrar bloqueos activos
  - Añadir sección de bloqueos activos en página de perfil
  - Mostrar tipo de bloqueo, razón y fecha de expiración
  - Mostrar contador de infracciones actuales
  - Enlazar a amonestación que causó el bloqueo
  - _Requirements: 10.2, 10.3, 10.4_

- [x] 21. Crear sistema de notificaciones de recordatorio
- [x] 21.1 Implementar función `send_checkin_reminders()`
  - Buscar usuarios con reservas activas sin check-in
  - Calcular tiempo restante hasta fin de ventana de check-in
  - Enviar notificación con información de plaza y tiempo límite
  - Respetar preferencias de notificaciones del usuario
  - _Requirements: 15.1, 15.2, 15.3, 15.5_

- [x] 21.2 Integrar con sistema de notificaciones existente
  - Usar infraestructura de notificaciones de RESERVEO
  - Configurar plantilla de notificación de recordatorio
  - Añadir preferencia de notificaciones de check-in en perfil de usuario
  - _Requirements: 15.1, 15.4, 15.5_

- [x] 22. Crear migración de base de datos completa
  - Consolidar todas las tablas, funciones, índices y políticas RLS
  - Insertar registro inicial en `checkin_settings` con valores por defecto
  - Configurar trabajos de pg_cron
  - Añadir comentarios SQL para documentación
  - Probar migración en entorno local
  - _Requirements: Todos_

- [x] 23. Regenerar tipos TypeScript de Supabase
  - Ejecutar `supabase gen types typescript --linked`
  - Verificar que todos los tipos nuevos están disponibles
  - Actualizar imports en componentes y hooks
  - _Requirements: Todos (soporte de tipos)_

- [ ]* 24. Crear documentación de usuario
  - Guía de uso del sistema de check-in/check-out para usuarios
  - Guía de configuración para administradores
  - FAQ sobre infracciones y amonestaciones
  - _Requirements: Todos_

- [ ]* 25. Testing del sistema completo
- [ ]* 25.1 Tests unitarios de funciones de base de datos
  - Test `perform_checkin()` con casos normales y tardíos
  - Test `perform_checkout()` con casos válidos e inválidos
  - Test `detect_checkin_infractions()` con diferentes configuraciones
  - Test `detect_checkout_infractions()` con reservas continuas
  - Test `generate_automatic_warnings()` con diferentes umbrales
  - _Requirements: Todos_

- [ ]* 25.2 Tests de componentes React
  - Test TodayCheckinCard con diferentes estados
  - Test AdminCheckinConfigTab con validaciones
  - Test GroupCheckinConfigSection con configuración personalizada
  - Test CheckinReportPanel con datos de prueba
  - Test CheckinHistoryPanel con filtros
  - _Requirements: Todos_

- [ ]* 25.3 Tests de integración
  - Test flujo completo de check-in/check-out
  - Test detección automática de infracciones
  - Test generación de amonestaciones y bloqueos
  - Test configuración global y por grupo
  - Test liberación de plazas por checkout
  - _Requirements: Todos_
