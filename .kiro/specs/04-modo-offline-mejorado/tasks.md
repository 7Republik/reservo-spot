# Plan de Implementación - Modo Offline Mejorado

## Fase 0: Limpieza de Implementación Anterior (Crítico) ✅

- [x] 0. Eliminar archivos de implementación offline anterior y referencias
  - **Hooks a eliminar:**
    - `src/hooks/useOfflineMode.ts`
    - `src/hooks/useOfflineMode.example.ts`
    - `src/hooks/useOfflineSync.ts`
    - `src/hooks/useOfflineCleanup.ts`
    - `src/hooks/useConnectionMonitor.ts`
  - **Servicios a eliminar:**
    - `src/lib/offlineStorage.ts`
    - `src/lib/offlineStorage.utils.ts`
    - `src/lib/offlineStorage.example.ts`
    - `src/lib/offlineStorage.performance.example.ts`
    - `src/lib/offlineStorage.performance.md`
    - `src/lib/offlineErrorMessages.ts`
    - `src/lib/offlineErrorMessages.example.ts`
    - `src/lib/ConnectionMonitorService.ts`
    - `src/lib/__tests__/offlineStorage.cleanup.test.ts`
  - **Componentes a eliminar:**
    - `src/components/OfflineIndicator.tsx`
    - `src/components/OfflineIndicator.example.tsx`
  - **Limpieza de código:**
    - Buscar y eliminar imports de archivos offline en todos los componentes
    - Buscar y eliminar código relacionado con offline en hooks existentes
    - Buscar referencias a `useOfflineMode`, `useOfflineSync`, `OfflineIndicator` y eliminarlas
    - Verificar que no queden referencias a la implementación anterior
  - _Nota: Esta tarea limpia completamente el código anterior para empezar desde cero con la nueva implementación simplificada_

## Fase 1: Infraestructura Base (Crítico)

- [x] 1. Crear servicio OfflineCache con fallback
  - Implementar clase `OfflineCache` en `src/lib/offlineCache.ts`
  - Añadir soporte para IndexedDB con fallback a Map (modo incógnito)
  - Implementar métodos: `init()`, `set()`, `get()`, `clear()`, `remove()`
  - Añadir verificación de tamaño y limpieza automática cuando alcanza 10MB
  - Implementar método `getSize()` para estimar uso de almacenamiento
  - Implementar método `cleanOldData()` para eliminar datos antiguos
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_
  - _Soluciona: Problema 3 (IndexedDB lleno), Problema 7 (Modo incógnito)_

- [x] 2. Crear hook useOfflineMode base
  - Implementar hook `useOfflineMode` en `src/hooks/useOfflineMode.ts`
  - Detectar estado de conexión con `navigator.onLine` y eventos
  - Implementar debounce de 5 segundos para cambios de conexión
  - Exponer estado: `isOnline`, `lastSync`, `pendingActions`, `preloadStatus`
  - Exponer funciones: `preloadData()`, `queueAction()`, `syncPendingActions()`
  - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 3. Implementar precarga inteligente con cargas independientes
  - Implementar función `preloadData()` en useOfflineMode
  - Cargar datos independientemente con `Promise.allSettled()`
  - Precargar: perfil, matrículas, grupos, reserva del día, reservas próximos 7 días
  - Precargar mapas solo de grupos con reservas activas
  - Guardar estado de precarga: qué se cargó exitosamente y qué falló
  - Mostrar feedback al usuario según resultado (success/partial/error)
  - Implementar flag `preloadInProgress` para evitar duplicados
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  - _Soluciona: Problema 1 (Precarga parcial), Problema 4 (Precarga interrumpida)_

## Fase 2: Acciones Offline y Sincronización (Crítico)

- [x] 4. Implementar cola de acciones pendientes
  - Implementar función `queueAction()` en useOfflineMode
  - Definir interface `OfflineAction` con tipos: checkin, checkout, cancel_reservation
  - Guardar acciones en IndexedDB con ID único y timestamp
  - Actualizar contador de acciones pendientes
  - Sincronizar automáticamente si hay conexión
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Implementar sincronización con validación de conflictos
  - Implementar función `syncPendingActions()` en useOfflineMode
  - Validar que cada acción sigue siendo válida antes de ejecutar
  - Para check-in/out: verificar que reserva sigue activa
  - Para cancelación: verificar que reserva no está ya cancelada
  - Separar acciones fallidas de acciones con conflictos
  - Mostrar feedback específico al usuario por cada tipo de resultado
  - Recargar datos frescos después de sincronización exitosa
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_
  - _Soluciona: Problema 2 (Conflictos de sincronización)_

- [x] 6. Añadir timestamps y validación de antigüedad
  - Modificar `set()` para guardar datos con timestamp
  - Crear función `loadFromCache()` que valida antigüedad (max 7 días)
  - Mostrar advertencia al usuario si datos tienen más de 24 horas
  - Incluir timestamp en formato relativo ("hace 2 horas")
  - _Requisitos: 1.5, 2.5_
  - _Soluciona: Problema 5 (Datos obsoletos)_

## Fase 3: Componentes UI (Crítico)

- [x] 7. Crear componente OfflineIndicator
  - Crear `src/components/OfflineIndicator.tsx`
  - Mostrar banner rojo cuando offline, verde cuando online
  - Auto-ocultar banner verde después de 3 segundos
  - Mostrar timestamp de última sincronización
  - Mostrar contador de acciones pendientes si hay
  - Posicionar fijo en top sin obstruir contenido
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Crear pantalla de bloqueo para panel admin
  - Crear `src/components/AdminBlockScreen.tsx`
  - Mostrar icono grande de "Sin conexión"
  - Incluir mensaje: "Panel admin no disponible offline"
  - Añadir botón "Volver al Dashboard"
  - Mostrar botón "Acceder al Panel Admin" cuando se restaura conexión
  - Integrar en router para rutas `/admin/*`
  - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 9. Crear modal informativo para incidentes
  - Crear `src/components/IncidentOfflineModal.tsx`
  - Mostrar mensaje: "Para reasignarte plaza necesitamos conexión"
  - Incluir tip destacado: "💡 Toma foto ahora de la matrícula"
  - Añadir instrucción: "Reporta cuando tengas conexión usando foto de galería"
  - Botón "Entendido" para cerrar
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 10. Integrar OfflineIndicator en layout principal
  - Añadir `<OfflineIndicator />` en `src/App.tsx` o layout principal
  - Asegurar que sea visible en todas las páginas
  - Configurar z-index apropiado (z-50)
  - _Requisitos: 7.1, 7.2_

## Fase 4: Integración en Hooks Existentes (Importante)

- [x] 11. Modificar useParkingCalendar para modo offline
  - Integrar `useOfflineMode` hook
  - Implementar carga desde cache cuando offline
  - Implementar fallback a cache si falla carga online
  - Cachear datos automáticamente cuando se cargan online
  - Bloquear creación de reservas cuando offline con mensaje claro
  - Permitir cancelación offline con `queueAction()`
  - Siempre retornar array, nunca null o undefined
  - _Requisitos: 1.1, 1.2, 1.3, 3.3, 6.1, 8.1_

- [x] 12. Modificar useUserProfile para modo offline
  - Integrar `useOfflineMode` hook
  - Cargar perfil desde cache cuando offline
  - Cachear perfil automáticamente cuando se carga online
  - Deshabilitar formulario de edición cuando offline
  - Mostrar tooltip en botones deshabilitados
  - _Requisitos: 5.1, 5.2, 5.3, 8.3_

- [x] 13. Modificar useLicensePlateManager para modo offline
  - Integrar `useOfflineMode` hook
  - Cargar matrículas desde cache cuando offline
  - Cachear matrículas automáticamente cuando se cargan online
  - Deshabilitar botones de añadir/eliminar cuando offline
  - Mostrar tooltip explicativo en botones deshabilitados
  - _Requisitos: 5.1, 5.2, 8.4_

- [x] 14. Modificar TodayCheckinCard para check-in/out offline
  - Integrar `useOfflineMode` hook
  - Permitir check-in offline con `queueAction()`
  - Permitir check-out offline con `queueAction()`
  - Mostrar badge "Pendiente ⏳" cuando acción está en cola
  - Mostrar mensaje: "Se sincronizará cuando tengas conexión"
  - _Requisitos: 3.1, 3.2, 3.3, 3.7, 6.1_

- [x] 15. Modificar SpotMap para visualización offline
  - Integrar `useOfflineMode` hook
  - Cargar plazas del grupo desde cache cuando offline
  - Mostrar badge "Modo offline" en esquina del mapa
  - Resaltar plaza reservada incluso offline
  - Mostrar mensaje "Mapa no disponible offline" si no hay cache
  - Deshabilitar interacción con plazas cuando offline
  - _Requisitos: 2.3, 2.4, 2.5, 6.1_

## Fase 5: Sincronización entre Pestañas (Nice to Have)

- [x] 16. Implementar BroadcastChannel para sincronización
  - Crear canal `BroadcastChannel('reserveo_offline')` en useOfflineMode
  - Emitir evento cuando se añade acción a cola
  - Emitir evento cuando se completa sincronización
  - Emitir evento cuando cambia estado de conexión
  - Escuchar eventos de otras pestañas y actualizar estado
  - Limpiar canal al desmontar hook
  - _Soluciona: Problema 6 (Múltiples pestañas)_

## Fase 6: Manejo de Errores y Edge Cases (Importante)

- [x] 17. Implementar manejo robusto de errores
  - Interceptar todos los errores de fetch en hooks
  - Nunca retornar null o undefined, siempre array/objeto vacío
  - Convertir errores de red en estados manejables (loading, error, empty)
  - Registrar errores en console.error sin mostrarlos al usuario
  - Mostrar mensajes amigables en lugar de errores técnicos
  - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 18. Añadir skeleton loaders para estados de carga
  - Crear skeleton para dashboard (reserva del día)
  - Crear skeleton para calendario
  - Crear skeleton para mapa de plazas
  - Mostrar skeleton mientras carga desde cache
  - _Requisitos: 12.4_

- [x] 19. Implementar limpieza de cache al cerrar sesión
  - Llamar `offlineCache.clear()` en función de logout
  - Limpiar también cola de acciones pendientes
  - Resetear estado de precarga
  - _Requisitos: 10.4_

## Fase 7: Testing y Validación (Opcional)

- [ ]* 20. Crear tests unitarios para OfflineCache
  - Test: guardar y recuperar datos
  - Test: fallback a Map cuando IndexedDB no disponible
  - Test: limpieza automática cuando alcanza límite
  - Test: validación de antigüedad de datos

- [ ]* 21. Crear tests unitarios para useOfflineMode
  - Test: detección de cambios de conexión
  - Test: debounce de 5 segundos
  - Test: precarga de datos
  - Test: cola de acciones pendientes
  - Test: sincronización con validación de conflictos

- [ ]* 22. Crear tests de integración
  - Test: flujo completo de check-in offline
  - Test: flujo completo de cancelación offline
  - Test: sincronización al reconectar
  - Test: navegación entre secciones offline
  - Test: panel admin bloqueado offline

## Fase 8: Optimizaciones (Opcional)

- [x] 23. Optimizar tamaño de cache
  - Comprimir datos antes de guardar en IndexedDB
  - Implementar estrategia LRU para limpieza
  - Monitorear uso de almacenamiento

- [ ]* 24. Añadir métricas y logging
  - Registrar eventos de precarga (éxito/fallo)
  - Registrar eventos de sincronización
  - Registrar uso de cache
  - Enviar métricas a analytics (opcional)
