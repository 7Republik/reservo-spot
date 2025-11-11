# 🗄️ Arquitectura de Base de Datos - RESERVEO

**Proyecto Supabase ID**: `pevpefnemqvyygkrcwir`  
**Última actualización**: 2025-11-11  
**Versión del esquema**: 18 migraciones aplicadas

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Esquema de Tablas](#esquema-de-tablas)
3. [Funciones y Stored Procedures](#funciones-y-stored-procedures)
4. [Triggers Automáticos](#triggers-automáticos)
5. [Políticas RLS (Row Level Security)](#políticas-rls)
6. [Índices y Optimizaciones](#índices-y-optimizaciones)
7. [Storage Buckets](#storage-buckets)
8. [Flujos de Negocio](#flujos-de-negocio)

---

## 🎯 Resumen Ejecutivo

RESERVEO utiliza PostgreSQL (vía Supabase) con un esquema robusto que implementa:

- **11 tablas principales** para gestión completa de parking corporativo
- **15+ funciones SQL** para lógica de negocio compleja
- **6 triggers automáticos** para mantener integridad y auditoría
- **40+ políticas RLS** para seguridad granular a nivel de fila
- **Soft deletes** para auditoría y recuperación de datos
- **Cancelación automática** de reservas en cascada

### Características Clave

✅ **Multi-tenant**: Grupos de parking con acceso controlado  
✅ **Gestión de permisos**: Matrículas con aprobación administrativa  
✅ **Reservas inteligentes**: Validación automática de disponibilidad  
✅ **Auditoría completa**: Logs de cancelaciones y cambios  
✅ **Seguridad robusta**: RLS en todas las tablas sensibles  
✅ **Soft delete**: Recuperación de datos eliminados  

---

## 📊 Esquema de Tablas

### 1. **`profiles`** - Perfiles de Usuario

**Propósito**: Extensión de `auth.users` con información adicional del usuario.

**Columnas**:
```sql
id UUID PRIMARY KEY                    -- FK a auth.users(id)
email TEXT NOT NULL                    -- Email del usuario
full_name TEXT                         -- Nombre completo
phone TEXT                             -- Teléfono (opcional)
is_blocked BOOLEAN DEFAULT FALSE       -- Usuario bloqueado temporalmente
is_deactivated BOOLEAN DEFAULT FALSE   -- Usuario dado de baja
blocked_reason TEXT                    -- Motivo del bloqueo
blocked_at TIMESTAMPTZ                 -- Fecha de bloqueo
blocked_by UUID                        -- Admin que bloqueó
deactivated_at TIMESTAMPTZ             -- Fecha de baja
deactivated_by UUID                    -- Admin que dio de baja
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Relaciones**:
- 1:1 con `auth.users` (Supabase Auth)
- 1:N con `reservations`
- 1:N con `license_plates`
- 1:N con `user_roles`

**Índices**:
- `idx_profiles_is_blocked` en `is_blocked`
- `idx_profiles_is_deactivated` en `is_deactivated`

**Triggers**:
- `update_profiles_updated_at` - Actualiza `updated_at` automáticamente
- `on_user_blocked_or_deactivated` - Cancela reservas futuras

---

### 2. **`user_roles`** - Roles de Usuario

**Propósito**: Gestión de roles y permisos (separado de profiles por seguridad).

**Columnas**:
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL                  -- FK a auth.users(id)
role app_role NOT NULL DEFAULT 'general'
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, role)
```

**Enum `app_role`**:
- `general` - Usuario estándar (prioridad 1)
- `visitor` - Visitante temporal (prioridad 2)
- `preferred` - Usuario preferente (prioridad 3)
- `director` - Director/gerente (prioridad 4)
- `admin` - Administrador total (prioridad 5)

**Índices**:
- `idx_user_roles_user_id` en `user_id`

---

### 3. **`parking_groups`** - Grupos de Parking

**Propósito**: Organización de plazas en grupos (ej: "Planta -1", "Zona Norte").

**Columnas**:
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL UNIQUE              -- Nombre del grupo
description TEXT                       -- Descripción
capacity INTEGER NOT NULL DEFAULT 0    -- Número total de plazas
floor_plan_url TEXT                    -- URL del plano (Storage)
is_active BOOLEAN DEFAULT TRUE         -- Grupo activo
deactivated_at TIMESTAMPTZ             -- Fecha de baja (soft delete)
deactivated_by UUID                    -- Admin que dio de baja
deactivation_reason TEXT               -- Motivo de baja
scheduled_deactivation_date DATE       -- Desactivación programada
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Relaciones**:
- 1:N con `parking_spots`
- N:M con `profiles` (vía `user_group_assignments`)

**Índices**:
- `idx_parking_groups_scheduled_deactivation` en `scheduled_deactivation_date`

**Triggers**:
- `update_parking_groups_updated_at` - Actualiza `updated_at`

---

### 4. **`parking_spots`** - Plazas de Aparcamiento

**Propósito**: Plazas individuales con atributos y posición visual.

**Columnas**:
```sql
id UUID PRIMARY KEY
spot_number TEXT NOT NULL UNIQUE       -- Número de plaza (ej: "A-101")
group_id UUID                          -- FK a parking_groups(id)
spot_type app_role NOT NULL DEFAULT 'general'
is_active BOOLEAN DEFAULT TRUE
position_x NUMERIC(5,2)                -- Posición X en plano (0-100%)
position_y NUMERIC(5,2)                -- Posición Y en plano (0-100%)
visual_size TEXT DEFAULT 'medium'      -- 'small', 'medium', 'large'
is_accessible BOOLEAN DEFAULT FALSE    -- Plaza PMR
has_charger BOOLEAN DEFAULT FALSE      -- Cargador eléctrico
is_compact BOOLEAN DEFAULT FALSE       -- Plaza reducida
notes TEXT                             -- Notas adicionales
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Relaciones**:
- N:1 con `parking_groups`
- 1:N con `reservations`

**Índices**:
- `idx_parking_spots_group_id` en `group_id`

**Triggers**:
- `update_parking_spots_updated_at` - Actualiza `updated_at`

---

### 5. **`reservations`** - Reservas de Plazas

**Propósito**: Registro de reservas de plazas por usuario y fecha.

**Columnas**:
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL                  -- FK a auth.users(id)
spot_id UUID NOT NULL                  -- FK a parking_spots(id)
reservation_date DATE NOT NULL         -- Fecha de la reserva
license_plate TEXT                     -- Matrícula usada
status TEXT NOT NULL DEFAULT 'active'  -- 'active', 'cancelled', 'completed'
created_at TIMESTAMPTZ DEFAULT NOW()
cancelled_at TIMESTAMPTZ
UNIQUE(spot_id, reservation_date, status)
```

**Relaciones**:
- N:1 con `profiles` (user_id)
- N:1 con `parking_spots` (spot_id)
- 1:N con `incident_reports`

**Índices**:
- `idx_reservations_user_id` en `user_id`
- `idx_reservations_spot_id` en `spot_id`
- `idx_reservations_date` en `reservation_date`
- `idx_reservations_status` en `status`

**Constraint**:
- Solo una reserva activa por plaza y fecha

---

### 6. **`license_plates`** - Matrículas de Vehículos

**Propósito**: Gestión de matrículas con aprobación administrativa.

**Columnas**:
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL                  -- FK a auth.users(id)
plate_number TEXT NOT NULL             -- Matrícula
vehicle_type TEXT                      -- Tipo de vehículo
is_approved BOOLEAN DEFAULT FALSE      -- Aprobada por admin
requested_at TIMESTAMPTZ DEFAULT NOW()
approved_at TIMESTAMPTZ
approved_by UUID                       -- Admin que aprobó
deleted_at TIMESTAMPTZ                 -- Soft delete
deleted_by_user BOOLEAN DEFAULT FALSE  -- Eliminada por usuario
```

**Relaciones**:
- N:1 con `profiles` (user_id)

**Índices**:
- `idx_license_plates_user_id` en `user_id`
- `idx_license_plates_approved` en `is_approved`
- `idx_license_plates_deleted_at` en `deleted_at`
- `idx_unique_active_plate` UNIQUE en `plate_number` WHERE `is_approved = TRUE AND deleted_at IS NULL`

**Triggers**:
- `on_license_plate_removed` - Cancela reservas futuras al desaprobar

---

### 7. **`user_group_assignments`** - Asignación Usuarios ↔ Grupos

**Propósito**: Relación N:M entre usuarios y grupos de parking.

**Columnas**:
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL                  -- FK a auth.users(id)
group_id UUID NOT NULL                 -- FK a parking_groups(id)
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, group_id)
```

**Índices**:
- `idx_user_group_assignments_user` en `user_id`
- `idx_user_group_assignments_group` en `group_id`

**Triggers**:
- `on_user_group_assignment_deleted` - Cancela reservas futuras al quitar acceso

---

### 8. **`blocked_dates`** - Fechas Bloqueadas

**Propósito**: Días específicos donde no se permiten reservas.

**Columnas**:
```sql
id UUID PRIMARY KEY
blocked_date DATE NOT NULL             -- Fecha bloqueada
reason TEXT NOT NULL DEFAULT 'Fuerza Mayor'
group_id UUID                          -- NULL = bloqueo global
created_by UUID NOT NULL               -- Admin que bloqueó
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(blocked_date, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'))
```

**Índices**:
- `idx_blocked_dates_date` en `blocked_date`
- `idx_blocked_dates_unique` UNIQUE en `(blocked_date, group_id)`

---

### 9. **`reservation_settings`** - Configuración Global

**Propósito**: Configuración del sistema de reservas (singleton - solo 1 registro).

**Columnas**:
```sql
id UUID PRIMARY KEY                    -- Siempre '00000000-0000-0000-0000-000000000001'
advance_reservation_days INTEGER NOT NULL DEFAULT 7
cancellation_deadline_hours INTEGER
daily_refresh_hour INTEGER NOT NULL DEFAULT 10
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Constraint**:
- Solo puede existir 1 registro (id fijo)

**Triggers**:
- `update_reservation_settings_updated_at` - Actualiza `updated_at`

---

### 10. **`reservation_cancellation_log`** - Auditoría de Cancelaciones

**Propósito**: Log de auditoría para cancelaciones automáticas.

**Columnas**:
```sql
id UUID PRIMARY KEY
reservation_id UUID NOT NULL
user_id UUID NOT NULL
cancelled_at TIMESTAMPTZ DEFAULT NOW()
cancellation_reason TEXT NOT NULL
triggered_by TEXT NOT NULL             -- 'group_removal', 'plate_removal', 'user_blocked'
metadata JSONB                         -- Datos adicionales
```

**Índices**:
- `idx_cancellation_log_user_id` en `user_id`
- `idx_cancellation_log_reservation_id` en `reservation_id`
- `idx_cancellation_log_cancelled_at` en `cancelled_at DESC`

---

### 11. **`incident_reports`** - Reportes de Incidentes

**Propósito**: Reportes de problemas relacionados con reservas.

**Columnas**:
```sql
id UUID PRIMARY KEY
reservation_id UUID NOT NULL           -- FK a reservations(id)
reporter_id UUID NOT NULL              -- FK a auth.users(id)
description TEXT NOT NULL
status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'resolved', 'dismissed'
created_at TIMESTAMPTZ DEFAULT NOW()
resolved_at TIMESTAMPTZ
```

---

## 🔧 Funciones y Stored Procedures

### Funciones de Validación de Roles

#### `is_admin(_user_id UUID) → BOOLEAN`
Verifica si un usuario tiene rol de administrador.

```sql
SELECT is_admin(auth.uid());
```

#### `has_role(_user_id UUID, _role app_role) → BOOLEAN`
Verifica si un usuario tiene un rol específico.

```sql
SELECT has_role(auth.uid(), 'director');
```

#### `get_user_role_priority(_user_id UUID) → INTEGER`
Devuelve la prioridad del rol más alto del usuario (1-5).

```sql
SELECT get_user_role_priority(auth.uid());
-- admin=5, director=4, preferred=3, visitor=2, general=1
```

#### `is_user_active(_user_id UUID) → BOOLEAN`
Verifica si un usuario está activo (no bloqueado ni desactivado).

```sql
SELECT is_user_active(auth.uid());
```

---

### Funciones de Validación de Reservas

#### `validate_parking_spot_reservation(_user_id UUID, _spot_id UUID, _reservation_date DATE)`
**Retorna**: `TABLE(is_valid BOOLEAN, error_code TEXT, error_message TEXT)`

Valida si un usuario puede reservar una plaza específica en una fecha.

**Validaciones que realiza**:
1. ✅ Fecha dentro del rango permitido (configuración)
2. ✅ Fecha no bloqueada (global o por grupo)
3. ✅ Plaza existe y está activa
4. ✅ Grupo no programado para desactivación
5. ✅ Plaza no reservada ya
6. ✅ Usuario tiene matrícula aprobada
7. ✅ Plaza accesible requiere permiso PMR
8. ✅ Plaza con cargador requiere permiso eléctrico
9. ⚠️ Advertencia si plaza es compacta
10. ✅ Usuario tiene acceso al grupo

**Ejemplo de uso**:
```sql
SELECT * FROM validate_parking_spot_reservation(
  'user-uuid',
  'spot-uuid',
  '2025-01-15'
);
```

**Códigos de error**:
- `DATE_TOO_EARLY` - Fecha aún no disponible
- `DATE_TOO_FAR` - Fecha fuera del rango
- `DATE_BLOCKED` - Día bloqueado
- `SPOT_NOT_AVAILABLE` - Plaza no disponible
- `GROUP_SCHEDULED_DEACTIVATION` - Grupo se desactivará
- `SPOT_ALREADY_RESERVED` - Plaza ya reservada
- `NO_APPROVED_PLATE` - Sin matrícula aprobada
- `REQUIRES_DISABILITY_PERMIT` - Requiere permiso PMR
- `REQUIRES_ELECTRIC_PERMIT` - Requiere permiso eléctrico
- `COMPACT_SPOT_WARNING` - Advertencia plaza compacta
- `NO_GROUP_ACCESS` - Sin acceso al grupo

---

### Funciones de Configuración

#### `get_reservable_date_range()`
**Retorna**: `TABLE(min_date DATE, max_date DATE)`

Calcula el rango de fechas en las que se pueden hacer reservas según configuración.

```sql
SELECT * FROM get_reservable_date_range();
-- min_date: 2025-01-11
-- max_date: 2025-01-18 (si advance_reservation_days = 7)
```

**Lógica**:
- Usa `advance_reservation_days` y `daily_refresh_hour` de `reservation_settings`
- Si aún no es la hora de refresh, usa el día anterior como referencia
- Calcula ventana deslizante de N días

---

### Funciones de Gestión de Usuarios

#### `deactivate_user(_user_id UUID, _admin_id UUID)`
Da de baja un usuario (soft delete).

**Acciones**:
1. Marca usuario como desactivado
2. Desaprueba todas sus matrículas
3. Cancela reservas futuras (vía trigger)

```sql
SELECT deactivate_user('user-uuid', 'admin-uuid');
```

#### `reactivate_user(_user_id UUID, _admin_id UUID)`
Reactiva un usuario desactivado.

```sql
SELECT reactivate_user('user-uuid', 'admin-uuid');
```

#### `permanently_delete_user(_user_id UUID, _admin_id UUID, _password_confirmation TEXT)`
**⚠️ PELIGROSO**: Elimina completamente un usuario y todos sus datos.

**Requiere**: Contraseña de confirmación

**Elimina en orden**:
1. Asignaciones de grupos
2. Reportes de incidentes
3. Reservas
4. Matrículas
5. Roles
6. Perfil
7. Usuario de auth

```sql
SELECT permanently_delete_user('user-uuid', 'admin-uuid', '12345678');
```

---

### Funciones de Gestión de Grupos

#### `deactivate_parking_group(_group_id UUID, _admin_id UUID, _reason TEXT)`
Da de baja un grupo de parking (soft delete).

**Acciones**:
1. Marca grupo como inactivo
2. Desactiva todas las plazas del grupo
3. Cancela todas las reservas futuras

```sql
SELECT deactivate_parking_group('group-uuid', 'admin-uuid', 'Obras de mantenimiento');
```

---

### Funciones de Gestión de Fechas Bloqueadas

#### `cancel_reservations_for_blocked_date(_blocked_date DATE, _admin_id UUID) → INTEGER`
Cancela todas las reservas activas de un día específico.

**Retorna**: Número de reservas canceladas

```sql
SELECT cancel_reservations_for_blocked_date('2025-01-15', 'admin-uuid');
-- Retorna: 12 (reservas canceladas)
```

---

### Funciones de Cancelación de Reservas

#### `cancel_user_reservations_in_group(_user_id UUID, _group_id UUID) → INTEGER`
Cancela todas las reservas futuras de un usuario en un grupo específico.

```sql
SELECT cancel_user_reservations_in_group('user-uuid', 'group-uuid');
```

#### `cancel_all_user_future_reservations(_user_id UUID) → INTEGER`
Cancela todas las reservas futuras de un usuario.

```sql
SELECT cancel_all_user_future_reservations('user-uuid');
```

---

### Funciones de Consulta

#### `get_available_spots_by_group(_group_id UUID, _date DATE)`
**Retorna**: Lista de plazas disponibles en un grupo para una fecha.

```sql
SELECT * FROM get_available_spots_by_group('group-uuid', '2025-01-15');
```

**Retorna**:
- `spot_id` - ID de la plaza
- `spot_number` - Número de plaza
- `is_accessible` - Es PMR
- `has_charger` - Tiene cargador
- `is_compact` - Es compacta
- `position_x` - Posición X
- `position_y` - Posición Y

---

### Funciones Auxiliares (Pendientes de Implementación)

Estas funciones están referenciadas pero no implementadas aún:

#### `has_valid_disability_permit(_plate_id UUID) → BOOLEAN`
Verifica si una matrícula tiene permiso PMR vigente.

#### `has_valid_electric_permit(_plate_id UUID) → BOOLEAN`
Verifica si una matrícula tiene permiso de vehículo eléctrico vigente.

**Nota**: Actualmente estas funciones no existen. Deberían implementarse o eliminarse las validaciones que las usan.

---

## ⚡ Triggers Automáticos

### 1. `on_auth_user_created` (auth.users)
**Evento**: AFTER INSERT  
**Función**: `handle_new_user()`

**Propósito**: Crear automáticamente perfil y rol cuando se registra un usuario.

**Acciones**:
1. Crea registro en `profiles` con email y nombre
2. Asigna rol por defecto `'general'` en `user_roles`

```sql
-- Se ejecuta automáticamente al hacer signup
-- No requiere intervención manual
```

---

### 2. `update_profiles_updated_at` (profiles)
**Evento**: BEFORE UPDATE  
**Función**: `update_updated_at_column()`

**Propósito**: Actualizar automáticamente `updated_at` al modificar perfil.

---

### 3. `update_parking_spots_updated_at` (parking_spots)
**Evento**: BEFORE UPDATE  
**Función**: `update_updated_at_column()`

**Propósito**: Actualizar automáticamente `updated_at` al modificar plaza.

---

### 4. `update_parking_groups_updated_at` (parking_groups)
**Evento**: BEFORE UPDATE  
**Función**: `update_updated_at_column()`

**Propósito**: Actualizar automáticamente `updated_at` al modificar grupo.

---

### 5. `on_user_group_assignment_deleted` (user_group_assignments)
**Evento**: AFTER DELETE  
**Función**: `trigger_cancel_reservations_on_group_removal()`

**Propósito**: Cancelar automáticamente reservas futuras cuando se quita acceso a un grupo.

**Flujo**:
```
Usuario removido del grupo
    ↓
Trigger se ejecuta
    ↓
Llama a cancel_user_reservations_in_group()
    ↓
Cancela todas las reservas futuras del usuario en ese grupo
    ↓
Log en NOTICE para auditoría
```

**Ejemplo**:
```sql
-- Admin quita acceso de usuario al grupo "Planta -1"
DELETE FROM user_group_assignments 
WHERE user_id = 'user-uuid' AND group_id = 'planta-1-uuid';

-- Trigger automáticamente cancela sus 3 reservas futuras en Planta -1
-- NOTICE: Usuario xxx removido del grupo yyy: 3 reservas futuras canceladas
```

---

### 6. `on_license_plate_removed` (license_plates)
**Evento**: AFTER UPDATE  
**Función**: `trigger_cancel_reservations_on_plate_removal()`

**Propósito**: Cancelar reservas futuras cuando se desaprueba o elimina una matrícula.

**Condiciones de activación**:
- `is_approved` cambia de TRUE → FALSE (desaprobación)
- `deleted_at` cambia de NULL → valor (soft delete)

**Flujo**:
```
Matrícula desaprobada o eliminada
    ↓
Trigger detecta cambio
    ↓
Llama a cancel_all_user_future_reservations()
    ↓
Cancela TODAS las reservas futuras del usuario
    ↓
Log en NOTICE para auditoría
```

**Ejemplo**:
```sql
-- Admin desaprueba matrícula
UPDATE license_plates 
SET is_approved = FALSE 
WHERE id = 'plate-uuid';

-- Trigger automáticamente cancela todas las reservas futuras del usuario
-- NOTICE: Matrícula ABC123 del usuario xxx: 5 reservas futuras canceladas
```

---

### 7. `on_user_blocked_or_deactivated` (profiles)
**Evento**: AFTER UPDATE  
**Función**: `trigger_cancel_reservations_on_user_status_change()`

**Propósito**: Cancelar reservas futuras cuando se bloquea o desactiva un usuario.

**Condiciones de activación**:
- `is_blocked` cambia de FALSE → TRUE
- `is_deactivated` cambia de FALSE → TRUE

**Flujo**:
```
Usuario bloqueado o desactivado
    ↓
Trigger detecta cambio
    ↓
Llama a cancel_all_user_future_reservations()
    ↓
Cancela TODAS las reservas futuras
    ↓
Log en NOTICE para auditoría
```

**Ejemplo**:
```sql
-- Admin bloquea usuario
UPDATE profiles 
SET is_blocked = TRUE, blocked_reason = 'Uso indebido' 
WHERE id = 'user-uuid';

-- Trigger automáticamente cancela todas sus reservas futuras
-- NOTICE: Usuario xxx bloqueado/desactivado: 8 reservas futuras canceladas
```

---

## 🔒 Políticas RLS (Row Level Security)

### Principios de Seguridad

1. **Todas las tablas sensibles tienen RLS habilitado**
2. **Usuarios anónimos (no autenticados) tienen acceso denegado explícitamente**
3. **Usuarios solo ven/modifican sus propios datos**
4. **Administradores tienen acceso completo**
5. **Políticas separadas para SELECT, INSERT, UPDATE, DELETE**

---

### Políticas por Tabla

#### `profiles`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view their own profile | SELECT | authenticated | `auth.uid() = id` |
| Users can update their own profile | UPDATE | authenticated | `auth.uid() = id` |
| Admins can view all profiles | SELECT | authenticated | `is_admin(auth.uid())` |
| Deny unauthenticated access | SELECT | anon | `false` |

---

#### `user_roles`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view their own roles | SELECT | authenticated | `auth.uid() = user_id` |
| Admins can view all roles | SELECT | authenticated | `is_admin(auth.uid())` |
| Admins can insert roles | INSERT | authenticated | `is_admin(auth.uid())` |
| Admins can update roles | UPDATE | authenticated | `is_admin(auth.uid())` |
| Admins can delete roles | DELETE | authenticated | `is_admin(auth.uid())` |

---

#### `parking_groups`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view active groups | SELECT | authenticated | `is_active = TRUE` |
| Admins can manage groups | ALL | authenticated | `is_admin(auth.uid())` |

---

#### `parking_spots`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view spots from assigned groups | SELECT | authenticated | Plaza en grupo asignado o "General" |
| Admins can manage spots | ALL | authenticated | `is_admin(auth.uid())` |

---

#### `reservations`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view own reservations | SELECT | authenticated | `auth.uid() = user_id` |
| Users can create reservations | INSERT | authenticated | `auth.uid() = user_id AND is_user_active()` |
| Users can cancel own reservations | UPDATE | authenticated | `auth.uid() = user_id AND status = 'active' AND is_user_active()` |
| Admins can view all reservations | SELECT | authenticated | `is_admin(auth.uid())` |
| Admins can manage all reservations | ALL | authenticated | `is_admin(auth.uid())` |
| Deny unauthenticated access | SELECT | anon | `false` |

---

#### `license_plates`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view own plates | SELECT | authenticated | `auth.uid() = user_id` |
| Users can insert own plates | INSERT | authenticated | `auth.uid() = user_id AND is_approved = FALSE AND is_user_active()` |
| Users can soft delete own plates | UPDATE | authenticated | `auth.uid() = user_id AND is_user_active()` |
| Admins can view all plates | SELECT | authenticated | `is_admin(auth.uid())` |
| Admins can update plates | UPDATE | authenticated | `is_admin(auth.uid())` |
| Admins can delete plates | DELETE | authenticated | `is_admin(auth.uid())` |
| Deny unauthenticated access | SELECT | anon | `false` |

---

#### `user_group_assignments`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view own assignments | SELECT | authenticated | `auth.uid() = user_id` |
| Admins can manage assignments | ALL | authenticated | `is_admin(auth.uid())` |

---

#### `blocked_dates`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view blocked dates | SELECT | authenticated | `true` |
| Admins can manage blocked dates | ALL | authenticated | `is_admin(auth.uid())` |

---

#### `reservation_settings`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Everyone can read settings | SELECT | authenticated | `true` |
| Admins can update settings | UPDATE | authenticated | `is_admin(auth.uid())` |

---

#### `reservation_cancellation_log`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view own history | SELECT | authenticated | `auth.uid() = user_id` |
| Admins can view all logs | SELECT | authenticated | `is_admin(auth.uid())` |
| Deny unauthenticated access | SELECT | anon | `false` |

---

#### `incident_reports`

| Política | Operación | Rol | Condición |
|----------|-----------|-----|-----------|
| Users can view own reports | SELECT | authenticated | `auth.uid() = reporter_id` |
| Users can create reports | INSERT | authenticated | `auth.uid() = reporter_id AND is_user_active()` |
| Admins can view all reports | SELECT | authenticated | `is_admin(auth.uid())` |
| Admins can update reports | UPDATE | authenticated | `is_admin(auth.uid())` |
| Deny unauthenticated access | SELECT | anon | `false` |

---

## 📈 Índices y Optimizaciones

### Índices de Performance

**profiles**:
- `idx_profiles_is_blocked` en `is_blocked`
- `idx_profiles_is_deactivated` en `is_deactivated`

**user_roles**:
- `idx_user_roles_user_id` en `user_id`

**parking_groups**:
- `idx_parking_groups_scheduled_deactivation` en `scheduled_deactivation_date` WHERE programado

**parking_spots**:
- `idx_parking_spots_group_id` en `group_id`

**reservations**:
- `idx_reservations_user_id` en `user_id`
- `idx_reservations_spot_id` en `spot_id`
- `idx_reservations_date` en `reservation_date`
- `idx_reservations_status` en `status`

**license_plates**:
- `idx_license_plates_user_id` en `user_id`
- `idx_license_plates_approved` en `is_approved`
- `idx_license_plates_deleted_at` en `deleted_at` WHERE eliminada
- `idx_unique_active_plate` UNIQUE en `plate_number` WHERE aprobada y no eliminada

**user_group_assignments**:
- `idx_user_group_assignments_user` en `user_id`
- `idx_user_group_assignments_group` en `group_id`

**blocked_dates**:
- `idx_blocked_dates_date` en `blocked_date`
- `idx_blocked_dates_unique` UNIQUE en `(blocked_date, group_id)`

**reservation_cancellation_log**:
- `idx_cancellation_log_user_id` en `user_id`
- `idx_cancellation_log_reservation_id` en `reservation_id`
- `idx_cancellation_log_cancelled_at` en `cancelled_at DESC`

---

### Constraints Únicos

1. **`profiles.id`** - PK, único por diseño (FK a auth.users)
2. **`parking_spots.spot_number`** - Número de plaza único
3. **`parking_groups.name`** - Nombre de grupo único
4. **`license_plates.plate_number`** - Matrícula única (solo si aprobada y no eliminada)
5. **`reservations(spot_id, reservation_date, status)`** - Una reserva activa por plaza/día
6. **`user_group_assignments(user_id, group_id)`** - Usuario solo una vez por grupo
7. **`user_roles(user_id, role)`** - Usuario solo una vez por rol
8. **`blocked_dates(blocked_date, group_id)`** - Día bloqueado una vez por grupo

---

## 💾 Storage Buckets

### `floor-plans`

**Propósito**: Almacenar imágenes de planos de parking.

**Configuración**:
- **Público**: Sí (lectura pública)
- **Tamaño máximo**: Configurado en Supabase Dashboard
- **Formatos permitidos**: Imágenes (PNG, JPG, SVG)

**Políticas**:
- ✅ **Admins can upload** - Solo admins pueden subir
- ✅ **Admins can update** - Solo admins pueden actualizar
- ✅ **Admins can delete** - Solo admins pueden eliminar
- ✅ **Anyone can view** - Lectura pública

**Uso**:
```typescript
// Subir plano
const { data, error } = await supabase.storage
  .from('floor-plans')
  .upload('planta-1.png', file);

// Obtener URL pública
const { data: publicURL } = supabase.storage
  .from('floor-plans')
  .getPublicUrl('planta-1.png');

// Guardar en parking_groups
UPDATE parking_groups 
SET floor_plan_url = publicURL 
WHERE id = 'group-uuid';
```

---

## 🔄 Flujos de Negocio

### Flujo 1: Registro de Usuario

```
1. Usuario hace signup en frontend
   ↓
2. Supabase Auth crea registro en auth.users
   ↓
3. Trigger on_auth_user_created se ejecuta
   ↓
4. Se crea perfil en profiles
   ↓
5. Se asigna rol 'general' en user_roles
   ↓
6. Usuario puede hacer login
```

**Tablas afectadas**: `auth.users`, `profiles`, `user_roles`

---

### Flujo 2: Solicitud de Matrícula

```
1. Usuario registra matrícula en frontend
   ↓
2. INSERT en license_plates con is_approved = FALSE
   ↓
3. Admin ve matrícula pendiente en panel admin
   ↓
4. Admin aprueba o rechaza
   ↓
5a. Si aprueba: is_approved = TRUE, approved_at = NOW()
5b. Si rechaza: DELETE o mantiene con is_approved = FALSE
   ↓
6. Usuario puede usar matrícula aprobada para reservar
```

**Tablas afectadas**: `license_plates`

---

### Flujo 3: Crear Reserva

```
1. Usuario selecciona fecha y grupo en calendario
   ↓
2. Frontend llama a validate_parking_spot_reservation()
   ↓
3. Función valida 10 condiciones
   ↓
4a. Si válido: Frontend hace INSERT en reservations
4b. Si inválido: Muestra error al usuario
   ↓
5. RLS verifica que user_id = auth.uid() y usuario activo
   ↓
6. Constraint verifica que plaza no esté reservada
   ↓
7. Reserva creada con status = 'active'
```

**Tablas afectadas**: `reservations`, `parking_spots`, `license_plates`, `blocked_dates`, `reservation_settings`

---

### Flujo 4: Cancelar Reserva (Usuario)

```
1. Usuario cancela su reserva en frontend
   ↓
2. UPDATE reservations SET status = 'cancelled', cancelled_at = NOW()
   ↓
3. RLS verifica que user_id = auth.uid()
   ↓
4. Reserva marcada como cancelada
```

**Tablas afectadas**: `reservations`

---

### Flujo 5: Quitar Acceso a Grupo (Admin)

```
1. Admin quita usuario de grupo en panel admin
   ↓
2. DELETE FROM user_group_assignments
   ↓
3. Trigger on_user_group_assignment_deleted se ejecuta
   ↓
4. Llama a cancel_user_reservations_in_group()
   ↓
5. UPDATE reservations SET status = 'cancelled' (reservas futuras en ese grupo)
   ↓
6. Log en NOTICE con número de reservas canceladas
```

**Tablas afectadas**: `user_group_assignments`, `reservations`

---

### Flujo 6: Desaprobar Matrícula (Admin)

```
1. Admin desaprueba matrícula en panel admin
   ↓
2. UPDATE license_plates SET is_approved = FALSE
   ↓
3. Trigger on_license_plate_removed se ejecuta
   ↓
4. Llama a cancel_all_user_future_reservations()
   ↓
5. UPDATE reservations SET status = 'cancelled' (TODAS las reservas futuras)
   ↓
6. Log en NOTICE con número de reservas canceladas
```

**Tablas afectadas**: `license_plates`, `reservations`

---

### Flujo 7: Bloquear Usuario (Admin)

```
1. Admin bloquea usuario en panel admin
   ↓
2. UPDATE profiles SET is_blocked = TRUE, blocked_reason = '...'
   ↓
3. Trigger on_user_blocked_or_deactivated se ejecuta
   ↓
4. Llama a cancel_all_user_future_reservations()
   ↓
5. UPDATE reservations SET status = 'cancelled' (TODAS las reservas futuras)
   ↓
6. Usuario no puede crear nuevas reservas (RLS + is_user_active())
   ↓
7. Log en NOTICE con número de reservas canceladas
```

**Tablas afectadas**: `profiles`, `reservations`

---

### Flujo 8: Bloquear Fecha (Admin)

```
1. Admin bloquea fecha en panel admin
   ↓
2. INSERT INTO blocked_dates (blocked_date, reason, group_id)
   ↓
3. Admin llama a cancel_reservations_for_blocked_date()
   ↓
4. UPDATE reservations SET status = 'cancelled' (reservas de ese día)
   ↓
5. Función retorna número de reservas canceladas
   ↓
6. Usuarios no pueden reservar ese día (validación en validate_parking_spot_reservation)
```

**Tablas afectadas**: `blocked_dates`, `reservations`

---

### Flujo 9: Desactivar Grupo (Admin)

```
1. Admin desactiva grupo en panel admin
   ↓
2. Llama a deactivate_parking_group(group_id, admin_id, reason)
   ↓
3. UPDATE parking_groups SET is_active = FALSE, deactivated_at = NOW()
   ↓
4. UPDATE parking_spots SET is_active = FALSE (todas las plazas del grupo)
   ↓
5. UPDATE reservations SET status = 'cancelled' (reservas futuras del grupo)
   ↓
6. Grupo y plazas no visibles para usuarios
```

**Tablas afectadas**: `parking_groups`, `parking_spots`, `reservations`

---

### Flujo 10: Eliminar Usuario Permanentemente (Admin)

```
1. Admin elimina usuario en panel admin
   ↓
2. Llama a permanently_delete_user(user_id, admin_id, password)
   ↓
3. Verifica contraseña de confirmación
   ↓
4. DELETE en orden:
   - user_group_assignments
   - incident_reports
   - reservations
   - license_plates
   - user_roles
   - profiles
   - auth.users
   ↓
5. Usuario completamente eliminado (hard delete)
```

**Tablas afectadas**: TODAS las relacionadas con el usuario

---

## 🚨 Consideraciones Importantes

### 1. Funciones Faltantes

Las siguientes funciones están referenciadas pero NO implementadas:
- `has_valid_disability_permit(_plate_id UUID)`
- `has_valid_electric_permit(_plate_id UUID)`

**Impacto**: Las validaciones de plazas accesibles y con cargador fallarán.

**Solución recomendada**:
- Implementar las funciones
- O eliminar las validaciones de `validate_parking_spot_reservation()`

---

### 2. Soft Delete vs Hard Delete

**Soft Delete** (recomendado):
- `license_plates` - Usa `deleted_at`
- `parking_groups` - Usa `deactivated_at`
- `profiles` - Usa `is_deactivated`

**Hard Delete** (peligroso):
- `permanently_delete_user()` - Elimina completamente

**Ventajas del Soft Delete**:
- ✅ Auditoría completa
- ✅ Recuperación de datos
- ✅ Análisis histórico
- ✅ Cumplimiento GDPR (con anonimización)

---

### 3. Cancelación en Cascada

Los triggers automáticos cancelan reservas en estos casos:
1. ✅ Usuario removido de grupo
2. ✅ Matrícula desaprobada o eliminada
3. ✅ Usuario bloqueado o desactivado
4. ✅ Grupo desactivado
5. ✅ Fecha bloqueada (manual)

**Importante**: Las cancelaciones son automáticas e irreversibles.

---

### 4. Ventana de Reserva Deslizante

La configuración `advance_reservation_days` y `daily_refresh_hour` crean una ventana deslizante:

**Ejemplo** (advance_reservation_days = 7, daily_refresh_hour = 10):
- **Antes de las 10:00**: Puedes reservar desde ayer hasta dentro de 7 días
- **Después de las 10:00**: Puedes reservar desde hoy hasta dentro de 7 días

**Ventaja**: Evita que usuarios reserven con demasiada anticipación.

---

### 5. Seguridad RLS

**Todas las tablas sensibles tienen RLS habilitado**.

**Regla de oro**: 
- Usuarios anónimos → Acceso denegado explícitamente
- Usuarios autenticados → Solo sus datos
- Administradores → Acceso completo

**Verificación**:
```sql
-- Ver políticas de una tabla
\dp public.reservations

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 📊 Estadísticas del Esquema

- **Tablas**: 11
- **Funciones**: 15+
- **Triggers**: 7
- **Políticas RLS**: 40+
- **Índices**: 20+
- **Storage Buckets**: 1
- **Migraciones**: 18

---

## 🔗 Referencias

- **Dashboard**: https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir
- **Documentación Supabase**: https://supabase.com/docs
- **Guía de Gestión Externa**: `docs/supabase-external-management.md`
- **README de Hooks Admin**: `src/hooks/admin/README.md`
- **README de Componentes**: `src/components/README.md`

---

**Documento creado**: 2025-11-11  
**Autor**: Análisis automático del esquema de Supabase  
**Proyecto**: RESERVEO - Sistema de Gestión de Aparcamiento Corporativo

