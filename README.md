# RESERVEO

Sistema corporativo de reserva de plazas de aparcamiento que permite a los empleados reservar plazas con antelación a través de un calendario interactivo y una interfaz de mapa visual.

## Características Principales

### Gestión de Reservas
- **Reservas de Plazas**: Los empleados pueden reservar plazas de aparcamiento para fechas específicas dentro de una ventana de reserva configurable
- **Selección Interactiva**: Interfaz de mapa visual para seleccionar plazas con disponibilidad en tiempo real
- **Sistema Multi-Grupo**: Plazas organizadas en grupos (ej: "Planta -1", "Zona Norte") con control de acceso por usuario
- **Fechas Bloqueadas**: Los administradores pueden bloquear fechas específicas globalmente o por grupo

### Sistema de Check-in/Check-out ✅ IMPLEMENTADO
Sistema completo de validación de presencia física en el aparcamiento.

#### Funcionalidades de Usuario
- **Check-in al Llegar**: Botón "Llegué" en la sección "Hoy" del dashboard
- **Check-out al Salir**: Botón "Me voy" después de hacer check-in
- **Liberación Anticipada**: Las plazas con check-out anticipado quedan disponibles inmediatamente
- **Notificaciones**: Recordatorios automáticos para hacer check-in

#### Gestión Administrativa
- **Configuración Global**: 
  - Activar/desactivar sistema globalmente
  - Configurar periodo de gracia (0-120 minutos)
  - Configurar umbrales de amonestación
  - Configurar duración de bloqueos temporales
- **Configuración por Grupo**: 
  - Activar/desactivar check-in por grupo
  - Ventana de check-in personalizada (1-24 horas)
- **Reportes en Tiempo Real**:
  - Infracciones del día (sin check-in, sin check-out)
  - Histórico completo con filtros avanzados
  - Estadísticas de cumplimiento
  - Exportación a CSV
- **Dashboard de Estadísticas**:
  - Métricas clave (total reservas, tiempo promedio, hora pico, usuario más rápido)
  - Gráfico de actividad por hora
  - Heatmap de actividad (día x hora)
  - Tabla de top usuarios con check-in rápido
  - Filtros por grupo y rango de fechas
  - Exportación a CSV
- **Sistema de Amonestaciones Automáticas**:
  - Detección automática de infracciones
  - Generación de amonestaciones al alcanzar umbral
  - Bloqueos temporales automáticos
  - Cancelación de reservas futuras durante bloqueo

#### Características Técnicas
- **Trabajos Programados**: 
  - Reset diario a las 00:00
  - Detección de infracciones cada 15 minutos
  - Generación de amonestaciones cada hora
  - Recordatorios cada 30 minutos
- **Validaciones**: Verificación de bloqueos antes de permitir reservas
- **Integración**: Sistema completamente integrado con reservas y amonestaciones
- **Visualización**: Gráficos interactivos con Recharts y shadcn/ui Chart

### Lista de Espera (Waitlist) ✅ IMPLEMENTADO
Sistema completo de lista de espera para cuando no hay plazas disponibles.

#### Funcionalidades de Usuario
- **Registro en Lista**: Registrarse cuando no hay plazas disponibles
- **Múltiples Grupos**: Registrarse en varios grupos simultáneamente
- **Dashboard de Listas**: Ver todas las listas activas con posición en cola
- **Ofertas de Plaza**: Recibir ofertas cuando se libera una plaza
- **Aceptar/Rechazar**: Responder a ofertas con tiempo límite
- **Notificaciones**: Alertas en tiempo real de nuevas ofertas

#### Gestión Administrativa
- **Configuración Global**:
  - Activar/desactivar lista de espera
  - Tiempo de aceptación de ofertas (30-1440 minutos)
  - Límite de listas simultáneas (1-10)
  - Prioridad por roles (activar/desactivar)
  - Sistema de penalización (activar/desactivar)
  - Umbral de penalización (2-10 rechazos/expiraciones)
  - Duración de bloqueo (1-30 días)
- **Estadísticas en Tiempo Real**:
  - Usuarios en listas activas
  - Ofertas pendientes
  - Tasa de aceptación/rechazo
  - Gráficos de tendencias
- **Gestión de Listas**:
  - Ver listas por grupo y fecha
  - Eliminar entradas manualmente
  - Exportar logs a CSV
- **Auditoría Completa**: Logs de todas las acciones del sistema

#### Características Técnicas
- **Procesamiento Automático**: 
  - Detección de cancelaciones
  - Creación automática de ofertas
  - Expiración de ofertas
  - Limpieza de entradas antiguas
- **Sistema de Prioridad**: Orden por rol (si activado) y timestamp
- **Penalizaciones**: Bloqueos temporales por rechazos/expiraciones excesivas
- **Trabajos Programados**:
  - Expiración de ofertas cada 5 minutos
  - Limpieza diaria a las 00:00
  - Recordatorios cada 15 minutos

### Gestión de Matrículas
- **Registro de Vehículos**: Los usuarios registran matrículas de vehículos que requieren aprobación del administrador
- **Validación**: Solo usuarios con matrículas aprobadas pueden realizar reservas
- **Historial**: Seguimiento de matrículas eliminadas y cambios

### Reporte de Incidentes ✅ IMPLEMENTADO
Sistema completo para reportar y gestionar incidentes cuando una plaza reservada está ocupada por otro vehículo.

#### Flujo de Usuario
1. **Verificación de Ubicación**: Confirma que el usuario está en la plaza correcta
2. **Captura de Evidencia**: 
   - Captura de foto desde la cámara del móvil o carga de imagen
   - Ingreso de matrícula del vehículo infractor
   - Compresión automática de imágenes (< 500KB)
3. **Reasignación Automática**: 
   - Búsqueda automática de plaza alternativa disponible
   - Prioridad: grupos generales → grupos de reserva para incidentes
   - Creación inmediata de nueva reserva
4. **Registro del Incidente**: Almacenamiento completo con foto, matrícula, y detalles

#### Gestión Administrativa
- **Lista de Incidentes**: Vista filtrable por estado (pendiente, confirmado, desestimado)
- **Detalles Completos**: Visualización de toda la información del incidente incluyendo foto de evidencia
- **Acciones Administrativas**:
  - **Confirmar Incidente**: Emite amonestación al infractor y cancela su reserva
  - **Desestimar Incidente**: Cierra el caso sin acciones disciplinarias
  - **Notas Administrativas**: Añadir comentarios y observaciones
- **Sistema de Amonestaciones**: Seguimiento de infracciones por usuario con historial completo
- **Grupos de Reserva para Incidentes**: Grupos especiales designados como última opción para reasignaciones

#### Características Técnicas
- **Almacenamiento Seguro**: Bucket de Supabase Storage con políticas RLS
- **Optimización de Imágenes**: Compresión automática antes de subida
- **Búsqueda Inteligente**: Función SQL que implementa lógica de prioridad para encontrar plazas
- **Transacciones Atómicas**: Confirmación de incidentes con garantía de consistencia
- **Interfaz Móvil**: Diseño responsive optimizado para uso en el aparcamiento

### Perfil de Usuario y Amonestaciones ✅ IMPLEMENTADO
Sistema completo de gestión de perfil y visualización de amonestaciones.

#### Perfil Personal
- **Edición de Datos**: Actualizar nombre completo y teléfono
- **Estadísticas**: Ver total de reservas, matrículas, amonestaciones y antigüedad
- **Contador de Amonestaciones**: Indicador visual con código de colores (verde/amarillo/rojo)
- **Notificaciones**: Badge en header con contador de amonestaciones no vistas

#### Sistema de Amonestaciones
- **Lista Completa**: Ver todas las amonestaciones con detalles
- **Filtros**: Filtrar por vistas/no vistas
- **Detalles de Incidentes**: Enlace directo al incidente relacionado
- **Notificaciones en Tiempo Real**: Alertas cuando se recibe nueva amonestación
- **Marcar como Vistas**: Marcar todas las amonestaciones como vistas

#### Bloqueos Activos
- **Visualización**: Ver bloqueos temporales activos
- **Detalles**: Tipo de bloqueo, razón y fecha de expiración
- **Contador de Infracciones**: Ver infracciones acumuladas

### Modo Offline ✅ IMPLEMENTADO
Soporte completo para uso sin conexión a internet.

#### Funcionalidades
- **Indicador Visual**: Banner claro mostrando estado de conexión
- **Cache Inteligente**: Almacenamiento local de datos críticos (7 días TTL)
- **Lectura Offline**: Ver reservas, plazas y grupos desde cache
- **Bloqueo de Escritura**: Deshabilitar operaciones de modificación cuando offline
- **Tooltips Informativos**: Explicación clara en controles deshabilitados
- **Reconexión Automática**: Detección y sincronización al recuperar conexión

#### Características Técnicas
- **IndexedDB**: Almacenamiento local con límites (10 MB usuarios, 5 MB admins)
- **Monitoreo de Conexión**: Verificación cada 30 segundos con exponential backoff
- **Debounce**: 5 segundos para evitar parpadeos en conexiones intermitentes
- **Reintentos Automáticos**: 2 reintentos para requests fallidos
- **Limpieza Automática**: Eliminación de datos expirados y al cerrar sesión

### Rediseño Visual Dashboard "Hoy" ✅ IMPLEMENTADO
Mejoras visuales significativas en la sección principal del dashboard.

#### Mejoras Visuales
- **Glassmorphism**: Efectos de vidrio esmerilado en cards
- **Gradientes Animados**: Botones con efectos de brillo y gradientes
- **Iconos Animados**: Animaciones sutiles (pulse, bounce, draw)
- **Texto con Gradiente**: Títulos y números destacados con gradientes
- **Transiciones Suaves**: Animaciones fluidas entre estados

#### Optimizaciones
- **Mobile First**: Diseño responsive optimizado para móvil
- **Performance**: Lazy loading de efectos visuales
- **Detección de Conexión**: Simplificación de efectos en conexiones lentas
- **Accesibilidad**: Soporte para `prefers-reduced-motion`
- **Dark Mode**: Adaptación completa a modo oscuro

### Editor Visual Mejorado ✅ IMPLEMENTADO
Editor profesional de plazas con funcionalidades avanzadas.

#### Nuevas Funcionalidades
- **Sistema de Colores por Atributos**: Colores visuales para accesible, cargador, compacta
- **Slider de Tamaño**: Control preciso del tamaño de botones (12-64px)
- **Herramienta Mano**: Navegación sin interactuar con plazas
- **Bloqueo de Canvas**: Alternar entre scroll normal y zoom con scroll
- **Preview Fantasma**: Vista previa al crear plazas
- **Drag & Drop**: Mover plazas arrastrando
- **Panel de Estadísticas**: Contador de plazas y progreso visual
- **Panel de Leyenda**: Explicación de colores y atributos
- **Restricción Móvil**: Mensaje amigable en dispositivos pequeños
- **Sistema de Ayuda**: Diálogo contextual con instrucciones

#### Mejoras de UX
- **Validación de Límites**: Prevención de exceder capacidad del grupo
- **Animaciones de Confirmación**: Feedback visual al crear plazas
- **Tooltips**: Ayuda contextual en todos los controles
- **Indicador de Modo Edición**: Border animado cuando modo dibujo activo
- **Ajuste Automático de Fuente**: Tamaño de texto adaptativo según número de plaza

### Panel de Administración
- **Gestión de Usuarios**: Bloquear, desactivar, o eliminar usuarios con cancelación automática de reservas
- **Gestión de Grupos**: Crear y configurar grupos de aparcamiento con atributos especiales
- **Gestión de Plazas**: Administrar plazas individuales con atributos (accesible, cargador eléctrico, compacta)
- **Editor Visual**: Editor drag-and-drop profesional para posicionar plazas en planos de planta
- **Aprobación de Matrículas**: Revisar y aprobar/rechazar solicitudes de registro de matrículas
- **Gestión de Incidentes**: Revisar, confirmar o desestimar reportes de incidentes
- **Gestión de Check-in**: Configuración global y por grupo, reportes en tiempo real
- **Gestión de Lista de Espera**: Configuración, estadísticas y auditoría completa
- **Configuración del Sistema**: Ajustes globales de reservas y comportamiento del sistema

### Sistema de Roles
Control de acceso basado en 5 niveles de roles con prioridad:

1. **General** (Prioridad 1) - Empleado estándar
2. **Visitante** (Prioridad 2) - Visitante temporal
3. **Preferente** (Prioridad 3) - Empleado preferente
4. **Director** (Prioridad 4) - Nivel de dirección
5. **Admin** (Prioridad 5) - Acceso completo al sistema

## Desarrollo Local

### Requisitos Previos
- Node.js & npm - [instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Cuenta de Supabase con proyecto configurado

### Configuración

```sh
# Clonar el repositorio
git clone <YOUR_GIT_URL>

# Navegar al directorio del proyecto
cd reserveo

# Instalar dependencias
npm i

# Configurar variables de entorno
# Copiar .env.example a .env y configurar las credenciales de Supabase
cp .env.example .env

# Iniciar servidor de desarrollo (puerto 8080)
npm run dev
```

### Variables de Entorno

Crear un archivo `.env` con las siguientes variables:

```env
VITE_SUPABASE_PROJECT_ID="tu-project-id"
VITE_SUPABASE_URL="https://tu-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="tu-anon-key"
```

## Stack Tecnológico

### Frontend
- **React 18.3** con TypeScript 5.8
- **Vite 5.4** - Build tool
- **React Router DOM 6.30** - Enrutamiento
- **Tailwind CSS 3.4** - Estilos con soporte de temas
- **shadcn/ui** - Componentes UI (Radix UI primitives)
- **React Hook Form 7.61** + **Zod 3.25** - Manejo de formularios y validación
- **TanStack Query 5.83** - Gestión de estado del servidor
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast

### Backend
- **Supabase** - Backend completo
  - PostgreSQL con Row Level Security (RLS)
  - Autenticación
  - Storage para imágenes
  - Funciones SQL personalizadas
  - Triggers automáticos

### Arquitectura de Base de Datos
- **24 tablas principales**: 
  - Core: profiles, user_roles, parking_groups, parking_spots, reservations, license_plates
  - Gestión: user_group_assignments, blocked_dates, reservation_settings, reservation_cancellation_log
  - Incidentes: incident_reports, user_warnings
  - Check-in: reservation_checkins, checkin_infractions, checkin_settings, parking_group_checkin_config, user_blocks
  - Waitlist: waitlist_entries, waitlist_offers, waitlist_logs, waitlist_penalties, notifications
- **40+ funciones SQL**: 
  - Validación y lógica de negocio
  - Check-in/check-out automático
  - Procesamiento de lista de espera
  - Detección de infracciones
  - Generación de amonestaciones
- **15+ triggers**: 
  - Creación automática de perfiles
  - Cancelación de reservas
  - Procesamiento de waitlist
  - Actualizaciones de timestamps
- **60+ políticas RLS**: Seguridad a nivel de fila en todas las tablas sensibles
- **2 buckets de Storage**: `floor-plans` para mapas de aparcamiento, `incident-photos` para evidencia de incidentes
- **10+ trabajos programados (pg_cron)**:
  - Check-in: reset diario, detección de infracciones, generación de amonestaciones, recordatorios
  - Waitlist: expiración de ofertas, limpieza de entradas, recordatorios

## Comandos Útiles

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo (puerto 8080)
npm run build        # Build de producción
npm run build:dev    # Build de desarrollo
npm run lint         # Linter de código
npm run preview      # Preview del build de producción
```

### Pruebas de Rendimiento (K6)

**Tests Básicos:**
```bash
npm run test:k6:smoke   # Smoke test (1 min, 2 VUs)
npm run test:k6:load    # Load test (10 min, 50-100 VUs)
npm run test:k6:stress  # Stress test (25 min, 100-400 VUs)
npm run test:k6:spike   # Spike test (10 min, 50-500 VUs)
```

**Tests de Funcionalidades Nuevas:** ⭐
```bash
npm run test:k6:checkin        # Check-in/Check-out (15 min, 200 VUs)
npm run test:k6:waitlist       # Lista de espera (10 min, 50 VUs)
npm run test:k6:checkin-stats  # Estadísticas (5 min, 20 VUs)
```

**Quick Start:** Ver `K6-QUICK-START.md` para configuración inicial  
**Guía Completa:** Ver `docs/K6-LOAD-TESTING-GUIDE.md` para documentación detallada  
**Actualización 2025-11-16:** Ver `K6-TESTS-UPDATE-2025-11-16.md` para cambios recientes

### Supabase
```bash
supabase status                                                    # Estado de Supabase local
supabase gen types typescript --linked > src/integrations/supabase/types.ts  # Generar tipos TypeScript
supabase migration new migration_name                              # Crear nueva migración
supabase db push                                                   # Aplicar migraciones a remoto
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes React (organización por features)
│   ├── ui/             # Componentes base de shadcn/ui (NO MODIFICAR)
│   ├── admin/          # Componentes del panel de administración
│   ├── incidents/      # Componentes de reporte de incidentes
│   ├── calendar/       # Sistema de calendario
│   ├── dashboard/      # Dashboard de usuario
│   └── ...
├── hooks/              # Custom React hooks
│   └── admin/          # Hooks específicos de admin con patrón de caché
├── integrations/       # Integraciones de servicios externos
│   └── supabase/       # Cliente de Supabase y tipos auto-generados
├── lib/                # Funciones de utilidad
├── pages/              # Componentes de página a nivel de ruta
├── styles/             # Archivos CSS globales
└── types/              # Definiciones de tipos TypeScript
    └── admin/          # Tipos específicos de admin

supabase/
├── config.toml         # Configuración local de Supabase
└── migrations/         # Archivos de migración de base de datos (20 migraciones)

docs/                   # Documentación del proyecto
```

## Reglas de Negocio Clave

### Reservas
- Los usuarios deben tener una matrícula aprobada para realizar reservas
- Las reservas solo se pueden hacer dentro de la ventana de reserva anticipada configurada
- Bloquear o desactivar un usuario cancela automáticamente todas sus reservas futuras
- Eliminar un usuario de un grupo cancela sus reservas en ese grupo
- Desaprobar una matrícula cancela todas las reservas futuras del usuario
- Cada plaza solo puede tener una reserva activa por fecha
- Las plazas pueden tener atributos: accesible (PMR), cargador eléctrico, tamaño compacto
- Los usuarios bloqueados por check-in o waitlist no pueden crear nuevas reservas

### Check-in/Check-out
- El check-in debe realizarse dentro de la ventana configurada (default: 2 horas antes del inicio)
- Existe un periodo de gracia configurable después de la ventana (default: 30 minutos)
- Las infracciones se detectan automáticamente después del periodo de gracia
- Al alcanzar el umbral de infracciones, se genera amonestación automática
- Las amonestaciones automáticas crean bloqueos temporales
- Durante el bloqueo, se cancelan todas las reservas futuras del usuario
- Las plazas con check-out anticipado quedan disponibles inmediatamente

### Lista de Espera
- Los usuarios pueden registrarse en lista de espera cuando no hay plazas disponibles
- Existe un límite configurable de listas simultáneas por usuario (default: 3)
- Las ofertas tienen un tiempo límite de aceptación configurable (default: 60 minutos)
- El orden de procesamiento respeta prioridad por rol (si activado) y timestamp
- Los rechazos y expiraciones de ofertas cuentan para penalización
- Al alcanzar el umbral de penalización, el usuario es bloqueado temporalmente
- Al aceptar una oferta, el usuario sale automáticamente de todas sus listas activas

### Incidentes y Amonestaciones
- Los incidentes confirmados emiten amonestaciones y cancelan la reserva del infractor
- Las amonestaciones quedan registradas permanentemente en el historial del usuario
- Los usuarios pueden ver sus amonestaciones en su perfil
- Las amonestaciones no vistas se notifican con badge en el header
- Los bloqueos activos se muestran en el perfil con fecha de expiración

## Documentación Adicional

### Base de Datos y Backend
- **Arquitectura de Base de Datos**: `docs/supabase-database-architecture.md`
- **Gestión Externa de Supabase**: `docs/supabase-external-management.md`

### Funcionalidades
- **Implementación de Reporte de Incidentes**: `docs/INCIDENT-REPORTING-IMPLEMENTATION-SUMMARY.md`
- **Guía de Validación de Incidentes**: `docs/INCIDENT-REPORTING-VALIDATION-GUIDE.md`
- **Configuración de Fotos de Incidentes**: `docs/incident-photos-setup-complete.md`

### Pruebas de Rendimiento
- **Quick Start K6**: `K6-QUICK-START.md` - Empezar en 5 minutos
- **Guía Completa K6**: `docs/K6-LOAD-TESTING-GUIDE.md` - Documentación detallada
- **Tests Disponibles**: `tests/k6/README.md` - Descripción de tests

## Despliegue

El proyecto está configurado para desplegarse en Vercel. La configuración se encuentra en `vercel.json`.

## Contribución

Este proyecto sigue patrones específicos de organización y estilo. Consulta los archivos de steering en `.kiro/steering/` para guías detalladas sobre:
- Stack técnico y comandos comunes
- Estructura del proyecto y convenciones de nombres
- Desarrollo con Supabase y gestión de migraciones
- Descripción del producto y características

## Licencia

Proyecto privado - Todos los derechos reservados
