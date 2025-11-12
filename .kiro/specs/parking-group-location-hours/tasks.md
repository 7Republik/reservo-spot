# Implementation Plan

- [ ] 1. Crear schema de base de datos para ubicaciones y horarios
  - Crear migración para tabla `parking_group_locations`
  - Definir columnas para dirección normalizada (street_address, city, state_province, postal_code, country)
  - Definir columnas para coordenadas (latitude, longitude)
  - Definir columna para indicaciones especiales (special_instructions, max 1000 chars)
  - Definir columnas para horarios (is_24_7, operating_hours JSONB)
  - Añadir constraints de validación (coordenadas, longitud de texto, horarios)
  - Crear índices en group_id y coordenadas
  - Crear trigger para updated_at
  - _Requirements: 1.1, 1.4, 2.2, 2.3, 3.3, 4.2_

- [ ] 2. Configurar políticas RLS para tabla de ubicaciones
  - Crear política para que usuarios autenticados vean ubicaciones de grupos activos
  - Crear política para que solo admins puedan crear/modificar ubicaciones
  - Crear política para denegar acceso anónimo
  - Habilitar RLS en la tabla
  - _Requirements: 5.1, 5.2, 5.3, 6.1_

- [ ] 3. Definir tipos TypeScript para ubicaciones y horarios
  - Crear tipos en `src/types/admin/parking-groups.types.ts`
  - Definir tipo `DayOfWeek` para días de la semana
  - Definir interfaz `DaySchedule` para horario de un día
  - Definir tipo `WeeklySchedule` para horarios semanales
  - Definir interfaz `ParkingGroupLocation` para ubicación completa
  - Definir interfaz `ParkingGroupLocationFormData` para formularios
  - Definir interfaz `ParkingGroupWithLocation` para vista de usuario
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 4. Crear hook admin para gestión de ubicaciones
  - Crear archivo `src/hooks/admin/useParkingGroupLocations.ts`
  - Implementar función `loadLocations` con patrón de caché
  - Implementar función `getLocationByGroupId` para obtener ubicación por grupo
  - Implementar función `createLocation` para crear nueva ubicación
  - Implementar función `updateLocation` para actualizar ubicación existente
  - Implementar función `deleteLocation` para eliminar ubicación
  - Añadir manejo de errores con toast notifications
  - Invalidar caché después de mutaciones (forceReload=true)
  - _Requirements: 1.2, 2.2, 3.2, 4.2, 6.2_

- [ ] 5. Crear componente editor de horarios semanales
  - Crear archivo `src/components/admin/groups/WeeklyScheduleEditor.tsx`
  - Implementar lista de 7 días con inputs de hora (formato 24h)
  - Añadir checkbox "Cerrado" por cada día
  - Implementar validación: hora apertura < hora cierre
  - Añadir botón "Copiar a todos los días"
  - Deshabilitar inputs cuando día está marcado como cerrado
  - Añadir feedback visual para horarios inválidos
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Crear formulario de ubicación para admin
  - Crear archivo `src/components/admin/groups/GroupLocationForm.tsx`
  - Implementar campos de dirección normalizada (calle, ciudad, provincia, CP, país)
  - Añadir textarea para indicaciones específicas con contador de caracteres (max 1000)
  - Implementar toggle para modo 24/7
  - Integrar componente `WeeklyScheduleEditor` (visible solo si no es 24/7)
  - Añadir validación con Zod: calle y ciudad obligatorias
  - Implementar handlers para guardar y cancelar
  - Añadir estados de loading durante guardado
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 4.1, 4.2, 6.1, 6.2_

- [ ] 7. Integrar formulario de ubicación en panel de administración
  - Modificar `src/components/admin/groups/GroupCard.tsx`
  - Añadir badge "📍 Ubicación" si el grupo tiene ubicación configurada
  - Añadir badge "🕐 Horarios" si tiene horarios configurados
  - Añadir botón "Configurar ubicación" en menú de acciones
  - Crear diálogo modal para mostrar `GroupLocationForm`
  - Conectar con hook `useParkingGroupLocations`
  - Recargar datos después de guardar ubicación
  - _Requirements: 1.3, 5.4, 6.2_

- [ ] 8. Crear hook para obtener grupos con ubicación (usuarios)
  - Crear archivo `src/hooks/useGroupsWithLocations.ts`
  - Implementar query que une `parking_groups` con `parking_group_locations`
  - Filtrar solo grupos activos con ubicación configurada
  - Ordenar por nombre de grupo
  - Implementar función `loadGroupsWithLocations`
  - Añadir estado de loading
  - _Requirements: 5.1, 5.2, 6.4_

- [ ] 9. Crear hook para navegación a ubicaciones
  - Crear archivo `src/hooks/useLocationNavigation.ts`
  - Implementar función `detectPlatform` (iOS, Android, Desktop)
  - Implementar función `generateNavigationUrl` para Google Maps, Apple Maps y Waze
  - Implementar función `openNavigation` que abre la app apropiada
  - Manejar errores de apertura de navegación
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Crear componente botón de navegación
  - Crear archivo `src/components/locations/NavigationButton.tsx`
  - Implementar botón principal "Cómo llegar"
  - Detectar plataforma automáticamente
  - En móvil: mostrar menú desplegable con opciones (Google Maps, Apple Maps, Waze)
  - En desktop: abrir Google Maps en navegador
  - Usar hook `useLocationNavigation`
  - Añadir iconos apropiados por plataforma
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Crear componente tarjeta de ubicación
  - Crear archivo `src/components/locations/LocationCard.tsx`
  - Mostrar nombre y descripción del grupo
  - Formatear y mostrar dirección completa
  - Mostrar indicaciones específicas si existen
  - Mostrar horarios semanales o badge "Abierto 24/7"
  - Integrar componente `NavigationButton`
  - Hacer tarjeta expandible/colapsable
  - Añadir estilos responsive
  - _Requirements: 5.1, 5.2, 5.3, 6.1_

- [ ] 12. Crear página de ubicaciones para usuarios
  - Crear archivo `src/pages/Locations.tsx`
  - Usar hook `useGroupsWithLocations` para cargar datos
  - Mostrar skeleton loader mientras carga
  - Renderizar lista de `LocationCard` para cada grupo
  - Mostrar mensaje si no hay grupos con ubicación
  - Añadir título y descripción de la página
  - Implementar layout responsive (mobile: stack, desktop: grid)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 13. Añadir ruta de ubicaciones al router
  - Modificar archivo de rutas de la aplicación
  - Añadir ruta `/locations` que renderiza `LocationsPage`
  - Configurar ruta como protegida (requiere autenticación)
  - _Requirements: 5.1_

- [ ] 14. Añadir enlace a ubicaciones en navegación principal
  - Modificar componente de navegación principal
  - Añadir item "Ubicaciones" con icono de mapa (📍)
  - Enlazar a ruta `/locations`
  - Posicionar en menú principal junto a Dashboard y Reservas
  - _Requirements: 5.1_

- [ ] 15. Aplicar migración y regenerar tipos
  - Ejecutar `supabase db push` para aplicar migración
  - Ejecutar `supabase gen types typescript --linked > src/integrations/supabase/types.ts`
  - Verificar que no hay errores de TypeScript
  - _Requirements: 1.4, 2.3_

- [ ]* 16. Testing y validación
- [ ]* 16.1 Probar creación de ubicación desde admin panel
  - Crear grupo de parking
  - Configurar ubicación con todos los campos
  - Verificar guardado en base de datos
  - _Requirements: 1.2, 2.2, 6.1_

- [ ]* 16.2 Probar edición de ubicación existente
  - Editar ubicación de grupo existente
  - Cambiar horarios de semanal a 24/7 y viceversa
  - Verificar actualización correcta
  - _Requirements: 3.2, 4.2, 6.2_

- [ ]* 16.3 Probar validaciones de formulario
  - Intentar guardar sin calle (debe fallar)
  - Intentar guardar sin ciudad (debe fallar)
  - Intentar indicaciones > 1000 caracteres (debe fallar)
  - Intentar horario apertura > cierre (debe fallar)
  - _Requirements: 1.2, 2.2, 3.2_

- [ ]* 16.4 Probar página de ubicaciones como usuario
  - Acceder a /locations
  - Verificar que solo aparecen grupos con ubicación
  - Verificar formato de dirección y horarios
  - _Requirements: 5.1, 5.2, 5.3, 6.4_

- [ ]* 16.5 Probar navegación en diferentes dispositivos
  - Probar botón "Cómo llegar" en iOS (debe abrir Apple Maps)
  - Probar en Android (debe abrir Google Maps)
  - Probar en desktop (debe abrir Google Maps en navegador)
  - Verificar que coordenadas son correctas
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
