# Plan de Implementación - Modo Offline

## Tareas de Implementación

- [ ] 1. Configurar infraestructura de almacenamiento offline
  - Crear servicio `OfflineStorageService` con IndexedDB para gestionar cache local
  - Implementar métodos de inicialización, lectura, escritura y limpieza de datos
  - Configurar estructura de base de datos con object stores para datos cacheados y metadatos de sincronización
  - Implementar lógica de TTL (7 días) y límites de tamaño (10 MB usuarios, 5 MB admins)
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 2. Implementar servicio de monitoreo de conexión
  - Crear `ConnectionMonitorService` para detectar cambios de conectividad
  - Implementar verificación de conexión con ping a Supabase cada 30 segundos
  - Configurar lógica de exponential backoff para reintentos (1s, 2s, 4s, 8s, 16s, 30s max)
  - Implementar sistema de eventos para notificar cambios de estado
  - Agregar debounce de 5 segundos para evitar parpadeos en conexiones intermitentes
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 3. Crear hook personalizado useOfflineMode
  - Implementar hook `useOfflineMode` que integre `ConnectionMonitorService`
  - Exponer estado de conexión (`isOnline`, `isOffline`) y última sincronización
  - Gestionar lifecycle del monitor (iniciar/detener con useEffect)
  - Implementar función de verificación manual de conexión
  - _Requisitos: 3.1, 3.2, 8.4_

- [ ] 4. Desarrollar componente indicador de estado offline
  - Crear componente `OfflineIndicator` con diseño visual claro (rojo offline, verde online)
  - Implementar posicionamiento fijo en la parte superior de la pantalla
  - Agregar animaciones suaves de transición entre estados
  - Configurar auto-ocultación después de 3 segundos cuando vuelve la conexión
  - Implementar modal de detalles expandido con información de última sincronización
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Integrar indicador offline en el layout principal
  - Agregar `OfflineIndicator` al layout principal de la aplicación
  - Asegurar que sea visible en todas las páginas (dashboard, admin, selección de plazas)
  - Configurar z-index apropiado para que esté siempre visible
  - _Requisitos: 2.1, 2.2_

- [ ] 6. Modificar useParkingCalendar para soporte offline
  - Integrar `useOfflineMode` hook en `useParkingCalendar`
  - Implementar carga de reservas desde cache cuando offline
  - Cachear reservas automáticamente cuando se cargan online
  - Bloquear operaciones de creación de reservas cuando offline con mensaje claro
  - Bloquear operaciones de cancelación de reservas cuando offline con mensaje claro
  - Implementar fallback a cache si falla la carga online
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7. Modificar useSpotSelection para soporte offline
  - Integrar `useOfflineMode` hook en `useSpotSelection`
  - Implementar carga de plazas desde cache cuando offline
  - Cachear datos de plazas automáticamente cuando se cargan online
  - Bloquear selección de plazas cuando offline con mensaje apropiado
  - Mostrar datos cacheados de disponibilidad de plazas
  - _Requisitos: 1.1, 1.2, 4.2, 5.1, 7.1_

- [ ] 8. Modificar useLicensePlateManager para soporte offline
  - Integrar `useOfflineMode` hook en `useLicensePlateManager`
  - Implementar carga de placas desde cache cuando offline
  - Cachear placas automáticamente cuando se cargan online
  - Bloquear registro de nuevas placas cuando offline
  - Bloquear eliminación de placas cuando offline
  - _Requisitos: 1.1, 4.3, 5.3, 7.1_

- [ ] 9. Modificar useGroupSelection para soporte offline
  - Integrar `useOfflineMode` hook en `useGroupSelection`
  - Implementar carga de grupos desde cache cuando offline
  - Cachear información de grupos automáticamente cuando se carga online
  - _Requisitos: 1.1, 4.5_

- [ ] 10. Actualizar hooks de administración para soporte offline
  - Modificar hooks en `src/hooks/admin/` para integrar `useOfflineMode`
  - Implementar cache separado con prefijo `admin_` y límite de 5 MB
  - Bloquear todas las operaciones de escritura (crear, actualizar, eliminar) cuando offline
  - Implementar carga desde cache para vistas de solo lectura
  - Mostrar advertencia en panel admin cuando está offline sobre funcionalidad limitada
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11. Implementar sistema de mensajes de error consistente
  - Crear constantes con mensajes de error específicos para cada operación offline
  - Implementar tooltips en controles deshabilitados explicando que requieren conexión
  - Asegurar que todos los mensajes incluyan el estado de conectividad actual
  - Configurar duración y estilo apropiado para toasts de error offline
  - _Requisitos: 5.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12. Implementar lógica de re-habilitación de controles
  - Configurar listeners para detectar cuando vuelve la conexión
  - Re-habilitar automáticamente todos los controles de escritura en menos de 2 segundos
  - Actualizar estado de botones y formularios reactivamente
  - _Requisitos: 5.5_

- [ ] 13. Agregar indicadores de última sincronización
  - Mostrar timestamp de última sincronización exitosa en vistas de datos cacheados
  - Implementar formato de fecha relativo ("hace 5 minutos")
  - Agregar indicador visual cuando se muestran datos desde cache
  - _Requisitos: 1.5, 2.5_

- [ ] 14. Implementar limpieza automática de cache
  - Configurar limpieza de datos expirados al iniciar la aplicación
  - Implementar limpieza cuando se alcanza el límite de almacenamiento (FIFO)
  - Limpiar cache completamente al cerrar sesión del usuario
  - _Requisitos: 6.5_

- [ ] 15. Crear tests unitarios para servicios offline
  - Escribir tests para `OfflineStorageService` (guardar, recuperar, expirar, limpiar)
  - Escribir tests para `ConnectionMonitorService` (detectar cambios, reintentos, eventos)
  - Escribir tests para `useOfflineMode` hook (estados, transiciones, debounce)
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Crear tests de integración para flujos offline
  - Test de flujo completo: online → offline → navegación → intento de reserva → error
  - Test de cache expiration: datos antiguos → offline → mensaje apropiado
  - Test de reconexión: offline → online → re-habilitación de controles
  - Test de fallback: error de servidor → carga desde cache → warning
  - _Requisitos: Todos los requisitos de funcionalidad_

- [ ] 17. Crear tests E2E para escenarios de usuario
  - Test: Usuario en parking sin conexión puede ver sus reservas
  - Test: Usuario offline no puede crear nuevas reservas
  - Test: Indicador aparece/desaparece correctamente
  - Test: Admin offline tiene funcionalidad limitada
  - _Requisitos: 1.1, 1.2, 2.1, 5.1, 9.4_

- [ ] 18. Optimizar rendimiento del sistema de cache
  - Implementar lazy loading de IndexedDB
  - Configurar batch operations para escrituras múltiples
  - Optimizar selectividad de cache (solo mes actual + 7 días)
  - Medir y optimizar tiempos de carga desde cache (<2s)
  - _Requisitos: 1.3, 6.4_

- [ ] 19. Documentar API y patrones de uso
  - Crear documentación de API para `OfflineStorageService`
  - Documentar patrones de integración para nuevos hooks
  - Crear guía de troubleshooting para problemas comunes
  - Documentar estrategia de cache y límites de almacenamiento
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_
