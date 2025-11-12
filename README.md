# RESERVEO

Sistema corporativo de reserva de plazas de aparcamiento que permite a los empleados reservar plazas con antelación a través de un calendario interactivo y una interfaz de mapa visual.

## Características Principales

### Gestión de Reservas
- **Reservas de Plazas**: Los empleados pueden reservar plazas de aparcamiento para fechas específicas dentro de una ventana de reserva configurable
- **Selección Interactiva**: Interfaz de mapa visual para seleccionar plazas con disponibilidad en tiempo real
- **Sistema Multi-Grupo**: Plazas organizadas en grupos (ej: "Planta -1", "Zona Norte") con control de acceso por usuario
- **Fechas Bloqueadas**: Los administradores pueden bloquear fechas específicas globalmente o por grupo

### Gestión de Matrículas
- **Registro de Vehículos**: Los usuarios registran matrículas de vehículos que requieren aprobación del administrador
- **Validación**: Solo usuarios con matrículas aprobadas pueden realizar reservas
- **Historial**: Seguimiento de matrículas eliminadas y cambios

### Reporte de Incidentes ⭐ NUEVO
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

### Panel de Administración
- **Gestión de Usuarios**: Bloquear, desactivar, o eliminar usuarios con cancelación automática de reservas
- **Gestión de Grupos**: Crear y configurar grupos de aparcamiento con atributos especiales
- **Gestión de Plazas**: Administrar plazas individuales con atributos (accesible, cargador eléctrico, compacta)
- **Editor Visual**: Editor drag-and-drop para posicionar plazas en planos de planta
- **Aprobación de Matrículas**: Revisar y aprobar/rechazar solicitudes de registro de matrículas
- **Gestión de Incidentes**: Revisar, confirmar o desestimar reportes de incidentes
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
- **13 tablas principales**: profiles, user_roles, parking_groups, parking_spots, reservations, license_plates, user_group_assignments, blocked_dates, reservation_settings, reservation_cancellation_log, incident_reports, user_warnings
- **15+ funciones SQL**: Validación, lógica de negocio, y operaciones de datos
- **6 triggers**: Creación automática de perfiles, cancelación de reservas, actualizaciones de timestamps
- **40+ políticas RLS**: Seguridad a nivel de fila en todas las tablas sensibles
- **2 buckets de Storage**: `floor-plans` para mapas de aparcamiento, `incident-photos` para evidencia de incidentes

## Comandos Útiles

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo (puerto 8080)
npm run build        # Build de producción
npm run build:dev    # Build de desarrollo
npm run lint         # Linter de código
npm run preview      # Preview del build de producción
```

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

- Los usuarios deben tener una matrícula aprobada para realizar reservas
- Las reservas solo se pueden hacer dentro de la ventana de reserva anticipada configurada
- Bloquear o desactivar un usuario cancela automáticamente todas sus reservas futuras
- Eliminar un usuario de un grupo cancela sus reservas en ese grupo
- Desaprobar una matrícula cancela todas las reservas futuras del usuario
- Cada plaza solo puede tener una reserva activa por fecha
- Las plazas pueden tener atributos: accesible (PMR), cargador eléctrico, tamaño compacto
- Los incidentes confirmados emiten amonestaciones y cancelan la reserva del infractor

## Documentación Adicional

- **Arquitectura de Base de Datos**: `docs/supabase-database-architecture.md`
- **Gestión Externa de Supabase**: `docs/supabase-external-management.md`
- **Implementación de Reporte de Incidentes**: `docs/INCIDENT-REPORTING-IMPLEMENTATION-SUMMARY.md`
- **Guía de Validación de Incidentes**: `docs/INCIDENT-REPORTING-VALIDATION-GUIDE.md`
- **Configuración de Fotos de Incidentes**: `docs/incident-photos-setup-complete.md`

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
