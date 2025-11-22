# Especificación de Requisitos - Modo Offline Mejorado

## Introducción

Esta especificación define un sistema de modo offline **simplificado y funcional** para RESERVEO. A diferencia de la implementación anterior, este diseño se enfoca en **precarga inteligente de datos críticos** y **acciones offline con sincronización posterior**. El objetivo es que el usuario pueda realizar sus tareas esenciales (ver reserva, hacer check-in/out, ver perfil) sin conexión, con una experiencia fluida y sin errores.

## Glosario

- **Aplicación**: Sistema web RESERVEO de reservas de parking
- **Usuario**: Empleado autenticado usando la Aplicación
- **Modo Offline**: Estado cuando la Aplicación no tiene conexión a internet
- **Precarga**: Proceso de cachear datos críticos al iniciar sesión o al cargar la app
- **Cache Inteligente**: Sistema que prioriza datos del día actual y próximos 7 días
- **Acción Pendiente**: Operación realizada offline que se sincronizará cuando haya conexión
- **Reserva Activa**: Reserva del día actual que el usuario necesita ver
- **Datos Estáticos**: Información que no cambia frecuentemente (perfil, matrículas, grupos)
- **Sincronización**: Proceso de enviar acciones pendientes al servidor cuando hay conexión

## Requisitos

### Requisito 1: Precarga Inteligente de Datos

**User Story:** Como usuario, quiero que la app precargue automáticamente los datos que necesitaré, para que estén disponibles cuando pierda conexión en el parking.

#### Criterios de Aceptación

1. CUANDO el Usuario inicia sesión exitosamente, LA Aplicación DEBERÁ precargar automáticamente TODOS los Datos Estáticos del usuario en segundo plano
2. LA precarga DEBERÁ incluir: perfil completo, matrículas aprobadas, grupos de parking, reserva del día actual, reservas de próximos 7 días, y mapas de grupos con reservas
3. LA precarga de mapas DEBERÁ incluir solo los grupos donde el usuario tiene reservas activas
4. LA precarga DEBERÁ completarse en menos de 15 segundos sin bloquear la UI
5. SI la precarga falla parcialmente, LA Aplicación DEBERÁ reintentar solo los datos que fallaron
6. LA Aplicación DEBERÁ mostrar indicador discreto de "Preparando datos offline..." durante la precarga
7. CUANDO la precarga se completa, LA Aplicación DEBERÁ registrar timestamp de última sincronización
8. LA precarga DEBERÁ ejecutarse también cuando el usuario abre la app (no solo al login)

### Requisito 2: Visualización de Reserva del Día con Ubicación

**User Story:** Como usuario llegando al parking, quiero ver mi reserva del día y su ubicación en el mapa, incluso sin conexión, para encontrar mi plaza fácilmente.

#### Criterios de Aceptación

1. CUANDO el Usuario abre el dashboard sin conexión, LA Aplicación DEBERÁ mostrar la Reserva Activa del día desde el Cache
2. LA Reserva Activa DEBERÁ incluir número de plaza, grupo de parking, fecha y estado de check-in
3. CUANDO el Usuario hace clic en "Ver ubicación" sin conexión, LA Aplicación DEBERÁ mostrar el mapa del grupo desde el Cache
4. EL mapa DEBERÁ mostrar la plaza reservada resaltada, incluso offline
5. SI el mapa del grupo no está en Cache, LA Aplicación DEBERÁ mostrar mensaje: "Mapa no disponible offline"
6. SI no hay Reserva Activa en el Cache, LA Aplicación DEBERÁ mostrar mensaje "No tienes reserva para hoy"
7. LA Aplicación DEBERÁ mostrar la Reserva Activa en menos de 1 segundo desde el Cache
8. LA Aplicación DEBERÁ indicar visualmente que los datos son del Cache con timestamp de última actualización

### Requisito 3: Check-in, Check-out y Cancelación Offline

**User Story:** Como usuario en el parking sin conexión, quiero poder hacer check-in, check-out y cancelar mi reserva, para gestionar mi plaza aunque no haya internet.

#### Criterios de Aceptación

1. CUANDO el Usuario hace check-in sin conexión, LA Aplicación DEBERÁ guardar la hora actual como Acción Pendiente
2. CUANDO el Usuario hace check-out sin conexión, LA Aplicación DEBERÁ guardar la hora actual como Acción Pendiente
3. CUANDO el Usuario cancela una reserva sin conexión, LA Aplicación DEBERÁ guardar la cancelación como Acción Pendiente
4. LA Aplicación DEBERÁ mostrar visualmente que las acciones están pendientes de sincronización con badge naranja
5. CUANDO se restaura la conexión, LA Aplicación DEBERÁ sincronizar automáticamente las Acciones Pendientes en menos de 5 segundos
6. SI la sincronización falla, LA Aplicación DEBERÁ reintentar hasta 3 veces con intervalos de 10 segundos
7. LA cancelación offline DEBERÁ mostrar la reserva como "Cancelación pendiente" hasta que se sincronice

### Requisito 4: Reporte de Incidentes Offline

**User Story:** Como usuario que encuentra su plaza ocupada sin conexión, quiero saber cómo proceder y qué hacer cuando recupere la conexión.

#### Criterios de Aceptación

1. CUANDO el Usuario intenta reportar un incidente sin conexión, LA Aplicación DEBERÁ mostrar pantalla informativa
2. LA pantalla informativa DEBERÁ explicar: "Para reasignarte una plaza en tiempo real, necesitamos conexión a internet"
3. LA pantalla DEBERÁ incluir tip destacado: "💡 Consejo: Toma una foto ahora asegurándote de que se vea la matrícula del vehículo intruso"
4. LA pantalla DEBERÁ incluir instrucción: "Cuando recuperes conexión, podrás reportar el incidente usando la foto de tu galería"
5. LA pantalla DEBERÁ incluir botón "Entendido" que cierre el modal
6. LA Aplicación NO DEBERÁ permitir iniciar el flujo de reporte de incidente sin conexión

### Requisito 5: Acceso a Datos Personales Offline

**User Story:** Como usuario, quiero acceder a mi perfil y matrículas sin conexión, para consultar mi información personal en cualquier momento.

#### Criterios de Aceptación

1. CUANDO el Usuario navega a su perfil sin conexión, LA Aplicación DEBERÁ mostrar nombre, email y teléfono desde el Cache
2. CUANDO el Usuario navega a matrículas sin conexión, LA Aplicación DEBERÁ mostrar todas sus matrículas aprobadas desde el Cache
3. LA Aplicación DEBERÁ deshabilitar botones de edición de perfil cuando esté offline
4. LA Aplicación DEBERÁ deshabilitar botones de añadir/eliminar matrículas cuando esté offline
5. LA Aplicación DEBERÁ mostrar tooltip explicativo en botones deshabilitados: "Requiere conexión a internet"

### Requisito 5: Navegación Fluida entre Secciones

**User Story:** Como usuario, quiero navegar entre todas las secciones de la app sin errores, incluso sin conexión, para acceder a la información que necesito.

#### Criterios de Aceptación

1. CUANDO el Usuario navega entre Dashboard, Perfil y Calendario sin conexión, LA Aplicación NO DEBERÁ mostrar errores de carga
2. LA Aplicación DEBERÁ cargar datos desde el Cache en menos de 1 segundo para cada sección
3. SI una sección no tiene datos en Cache, LA Aplicación DEBERÁ mostrar mensaje claro: "Datos no disponibles offline" en lugar de error técnico
4. LA Aplicación DEBERÁ mantener el estado de navegación sin recargar la página
5. LA Aplicación DEBERÁ mostrar indicador de "Modo Offline" en todas las secciones disponibles
6. CUANDO el Usuario cambia de pestaña (Dashboard → Perfil → Calendario), LA Aplicación DEBERÁ cargar datos del Cache sin intentar fetch al servidor
7. LA Aplicación NO DEBERÁ mostrar errores de "Cannot fetch" o "Network error" al cambiar de pestaña offline
8. SI el Usuario intenta acceder a una sección no disponible offline (Admin, Waitlist, Incidentes), LA Aplicación DEBERÁ mostrar pantalla de bloqueo con mensaje específico

### Requisito 6: Funciones Disponibles y No Disponibles Offline

**User Story:** Como usuario, quiero saber claramente qué puedo y qué no puedo hacer offline, para no intentar acciones que no funcionarán.

#### Criterios de Aceptación

1. LAS SIGUIENTES funciones DEBERÁN estar disponibles offline:
   - Ver dashboard con reserva del día
   - Hacer check-in (se sincroniza después)
   - Hacer check-out (se sincroniza después)
   - Cancelar reserva (se sincroniza después)
   - Ver perfil personal (nombre, email, teléfono)
   - Ver matrículas aprobadas
   - Ver calendario de reservas (próximos 7 días)
   - Ver ubicación de plaza en mapa (desde cache)
   - Navegar entre estas secciones

2. LAS SIGUIENTES funciones NO DEBERÁN estar disponibles offline:
   - Panel Admin completo (todas las rutas `/admin/*`)
   - Crear nuevas reservas
   - Modificar reservas existentes
   - Editar perfil
   - Añadir/eliminar matrículas
   - Reportar incidentes (requiere reasignación en tiempo real)
   - Gestionar lista de espera
   - Ver notificaciones nuevas

3. CUANDO el Usuario intenta acceder a una función no disponible offline, LA Aplicación DEBERÁ mostrar mensaje específico: "[Función] no disponible offline"
4. LA Aplicación DEBERÁ deshabilitar visualmente (gris, cursor not-allowed) todos los botones de funciones no disponibles
5. LA Aplicación DEBERÁ ocultar completamente las opciones de menú de funciones no disponibles offline (Admin, Waitlist)

### Requisito 7: Indicador de Estado de Conexión

**User Story:** Como usuario, quiero ver claramente cuándo estoy offline, para entender qué funciones están disponibles.

#### Criterios de Aceptación

1. CUANDO la Aplicación pierde conexión, DEBERÁ mostrar banner de "Sin conexión" en menos de 2 segundos
2. EL banner DEBERÁ ser visible en todas las páginas sin obstruir contenido importante
3. CUANDO la Aplicación recupera conexión, DEBERÁ ocultar el banner y mostrar mensaje "Conectado" por 3 segundos
4. EL banner DEBERÁ mostrar timestamp de última sincronización exitosa
5. SI hay Acciones Pendientes, EL banner DEBERÁ mostrar contador: "2 acciones pendientes de sincronizar"

### Requisito 8: Bloqueo de Acciones que Requieren Conexión

**User Story:** Como usuario, quiero que la app me impida realizar acciones que requieren internet, para evitar perder mi trabajo o crear conflictos de datos.

#### Criterios de Aceptación

1. CUANDO el Usuario intenta crear una reserva sin conexión, LA Aplicación DEBERÁ mostrar error: "No puedes reservar sin conexión"
2. CUANDO el Usuario intenta modificar una reserva sin conexión, LA Aplicación DEBERÁ mostrar error: "No puedes modificar reservas sin conexión"
3. CUANDO el Usuario intenta editar su perfil sin conexión, LA Aplicación DEBERÁ deshabilitar el formulario
4. CUANDO el Usuario intenta añadir una matrícula sin conexión, LA Aplicación DEBERÁ deshabilitar el botón
5. CUANDO el Usuario intenta reportar un incidente sin conexión, LA Aplicación DEBERÁ mostrar pantalla informativa con tip de foto
6. CUANDO un Usuario admin intenta acceder al panel admin sin conexión, LA Aplicación DEBERÁ mostrar pantalla completa: "Panel admin no disponible offline"
7. LA pantalla de bloqueo del panel admin DEBERÁ incluir mensaje: "El panel de administración requiere conexión a internet para funcionar correctamente"
8. TODOS los mensajes de error DEBERÁN incluir sugerencia: "Conéctate a internet para realizar esta acción"

### Requisito 9: Sincronización Automática al Reconectar

**User Story:** Como usuario, quiero que mis acciones offline se sincronicen automáticamente cuando vuelva la conexión, sin tener que hacer nada manualmente.

#### Criterios de Aceptación

1. CUANDO la Aplicación detecta conexión restaurada, DEBERÁ iniciar sincronización automáticamente en menos de 5 segundos
2. LA sincronización DEBERÁ procesar Acciones Pendientes en orden cronológico
3. SI una Acción Pendiente falla, LA Aplicación DEBERÁ mostrar notificación específica al usuario
4. CUANDO todas las Acciones Pendientes se sincronizan exitosamente, LA Aplicación DEBERÁ mostrar mensaje: "Datos sincronizados"
5. LA Aplicación DEBERÁ actualizar el Cache con datos frescos del servidor después de sincronizar

### Requisito 10: Gestión Inteligente del Cache

**User Story:** Como usuario, quiero que la app gestione automáticamente el almacenamiento local, para no tener que preocuparme por espacio o datos obsoletos.

#### Criterios de Aceptación

1. LA Aplicación DEBERÁ limpiar automáticamente datos del Cache con más de 7 días de antigüedad
2. LA Aplicación DEBERÁ priorizar datos del día actual y próximos 7 días en el Cache
3. SI el Cache alcanza 10 MB, LA Aplicación DEBERÁ eliminar datos más antiguos primero
4. LA Aplicación DEBERÁ limpiar completamente el Cache cuando el usuario cierra sesión
5. LA Aplicación DEBERÁ mostrar advertencia si el Cache está por alcanzar el límite: "Espacio de cache casi lleno"

### Requisito 11: Manejo de Conexiones Intermitentes

**User Story:** Como usuario en áreas con señal inestable, quiero que la app no me moleste con notificaciones constantes de conexión/desconexión.

#### Criterios de Aceptación

1. SI la conexión se pierde por menos de 5 segundos, LA Aplicación NO DEBERÁ mostrar el banner de offline
2. LA Aplicación DEBERÁ esperar 5 segundos de desconexión continua antes de entrar en Modo Offline
3. CUANDO la conexión se restaura, LA Aplicación DEBERÁ validar conectividad real con el servidor antes de salir del Modo Offline
4. LA Aplicación DEBERÁ reintentar requests fallidos 2 veces antes de considerar que está offline
5. LA Aplicación DEBERÁ usar exponential backoff para reintentos: 2s, 5s, 10s

### Requisito 12: Experiencia sin Errores

**User Story:** Como usuario, quiero que la app funcione sin mostrar errores técnicos, para tener una experiencia fluida incluso sin conexión.

#### Criterios de Aceptación

1. LA Aplicación NO DEBERÁ mostrar errores de "Cannot read property", "undefined", "null" o similares cuando esté offline
2. LA Aplicación NO DEBERÁ mostrar toasts de error de red ("Failed to fetch", "Network error") cuando esté offline
3. TODOS los componentes DEBERÁN verificar si hay datos en Cache ANTES de intentar renderizar
4. SI un componente no puede cargar datos del Cache, DEBERÁ mostrar skeleton loader o mensaje amigable: "Datos no disponibles offline"
5. LA Aplicación DEBERÁ interceptar TODOS los errores de fetch y convertirlos en estados manejables (loading, error, empty)
6. CUANDO un hook intenta cargar datos offline, DEBERÁ retornar datos del Cache o array/objeto vacío, NUNCA null o undefined
7. LA Aplicación DEBERÁ registrar errores offline en logs locales para debugging sin mostrarlos al usuario

### Requisito 13: Panel Admin Bloqueado Offline

**User Story:** Como administrador, quiero que el panel admin esté completamente bloqueado offline, para evitar errores y mantener la integridad de los datos del sistema.

#### Criterios de Aceptación

1. CUANDO un Usuario admin intenta acceder a cualquier ruta `/admin/*` sin conexión, LA Aplicación DEBERÁ redirigir a pantalla de bloqueo
2. LA pantalla de bloqueo DEBERÁ mostrar icono grande de "Sin conexión" y mensaje claro
3. LA pantalla de bloqueo DEBERÁ incluir botón "Volver al Dashboard" que redirija a `/dashboard`
4. LA Aplicación NO DEBERÁ cachear ningún dato del panel admin (usuarios, plazas, configuración, estadísticas)
5. LA Aplicación NO DEBERÁ intentar cargar componentes del panel admin cuando esté offline
6. CUANDO la conexión se restaura en la pantalla de bloqueo, LA Aplicación DEBERÁ mostrar botón "Reconectado - Acceder al Panel Admin"

### Requisito 14: Simplicidad de Implementación

**User Story:** Como desarrollador, quiero que el sistema offline sea simple de mantener y extender, para evitar bugs y facilitar mejoras futuras.

#### Criterios de Aceptación

1. LA implementación DEBERÁ usar un único hook `useOfflineMode` para gestionar todo el estado offline
2. LA implementación DEBERÁ usar un único servicio `OfflineCache` para gestionar almacenamiento
3. CADA componente DEBERÁ tener máximo 20 líneas de código relacionado con offline
4. LA lógica de sincronización DEBERÁ estar centralizada en un único lugar
5. LA implementación DEBERÁ tener menos de 500 líneas de código total (excluyendo tests)
6. EL panel admin NO DEBERÁ tener ninguna lógica de offline, solo bloqueo de acceso
