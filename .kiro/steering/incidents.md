---
inclusion: manual
---

# RESERVEO - Incident Reporting System

## Siempre háblame en español

## Overview

Sistema completo de reporte de incidentes cuando un usuario encuentra su plaza ocupada por otro vehículo.

**Estado:** ✅ Implementado y funcional (2025-11-12)

## Flujo del Usuario

### 1. Detección del Incidente
- Usuario llega a su plaza reservada
- Encuentra la plaza ocupada por otro vehículo
- Hace clic en "Reportar Incidente" desde el calendario

### 2. Confirmación de Ubicación
- Sistema muestra mapa con la plaza reservada
- Usuario confirma: "Sí, estoy en la plaza correcta"
- Opción alternativa: "No, mostrar direcciones"

### 3. Captura de Evidencia
- **Foto:** Captura con cámara o sube desde galería
- **Validación:** JPEG/PNG/HEIC, máx 10MB
- **Compresión:** Automática si > 500KB
- **Matrícula:** Introduce matrícula del vehículo ocupante (4-15 caracteres)

### 4. Reasignación Automática
- Sistema busca plaza disponible con prioridad:
  1. Grupos generales (is_incident_reserve = false)
  2. Grupos de reserva para incidentes (is_incident_reserve = true)
- Crea nueva reserva automáticamente
- Muestra ubicación de la nueva plaza en mapa

### 5. Resultado
- **Plaza encontrada:** Usuario ve su nueva plaza asignada
- **Sin plazas:** Mensaje con contacto de administración

## Arquitectura de Base de Datos

### Tabla: incident_reports

```sql
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  offending_license_plate TEXT NOT NULL,
  offending_user_id UUID REFERENCES auth.users(id),
  original_spot_id UUID NOT NULL REFERENCES parking_spots(id),
  reassigned_spot_id UUID REFERENCES parking_spots(id),
  reassigned_reservation_id UUID REFERENCES reservations(id),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  admin_notes TEXT
);
```

**Estados:**
- `pending` - Pendiente de revisión
- `confirmed` - Confirmado por admin (emite advertencia)
- `dismissed` - Descartado por admin

### Tabla: user_warnings

```sql
CREATE TABLE user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  incident_report_id UUID REFERENCES incident_reports(id),
  warning_type TEXT NOT NULL DEFAULT 'parking_violation',
  description TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Función: find_available_spot_for_incident

```sql
CREATE OR REPLACE FUNCTION find_available_spot_for_incident(
  _user_id UUID,
  _date DATE,
  _original_spot_id UUID
)
RETURNS TABLE (
  spot_id UUID,
  spot_number TEXT,
  group_name TEXT,
  position_x NUMERIC,
  position_y NUMERIC
)
```

**Lógica de prioridad:**
1. Busca en grupos generales primero
2. Si no hay, busca en grupos de reserva para incidentes
3. Excluye la plaza original
4. Verifica acceso del usuario al grupo
5. Verifica que la plaza no esté reservada

## Storage: incident-photos

**Bucket:** `incident-photos`
- **Público:** NO (requiere autenticación)
- **Estructura:** `{user_id}/{incident_id}.jpg`
- **Límite:** 10 MB por archivo
- **Tipos:** JPEG, PNG, HEIC, HEIF

**RLS Policies:**
- Usuarios suben/ven solo sus fotos
- Admins ven/borran todas las fotos
- Usuarios borran sus fotos < 24h

## Componentes Frontend

### User Flow Components

**Ubicación:** `src/components/incidents/`

1. **IncidentReportFlow.tsx** - Orquestador principal
   - Maneja el flujo multi-paso
   - Estados: location → evidence → reassignment → complete
   - Integra todos los sub-componentes

2. **LocationConfirmation.tsx** - Paso 1
   - Muestra mapa con plaza reservada
   - Botones: "Sí, estoy aquí" / "No, mostrar direcciones"
   - Opción de cancelar

3. **EvidenceCapture.tsx** - Paso 2
   - Captura de foto (cámara o galería)
   - Input de matrícula con validación
   - Preview de foto antes de enviar

4. **SpotReassignment.tsx** - Paso 3
   - Muestra nueva plaza asignada en mapa
   - Información de ubicación
   - Botón "Ir a mi nueva plaza"

### Admin Components

**Ubicación:** `src/components/admin/incidents/`

1. **IncidentList.tsx** - Lista de incidentes
   - Filtros por estado (pending/confirmed/dismissed)
   - Badge de advertencias del usuario infractor
   - Click para ver detalles

2. **IncidentDetails.tsx** - Detalles del incidente
   - Foto de evidencia
   - Información del reportero
   - Información del infractor (si se identificó)
   - Historial de advertencias
   - Notas del admin

3. **IncidentActions.tsx** - Acciones del admin
   - Botón "Confirmar" (emite advertencia)
   - Botón "Descartar"
   - Confirmación antes de acciones

## Hooks

### useIncidentReport.ts

**Funciones principales:**
```typescript
const {
  isLoading,
  findUserByLicensePlate,      // Busca usuario por matrícula
  findAvailableSpot,            // Busca plaza disponible
  createReassignedReservation,  // Crea nueva reserva
  createIncidentReport,         // Crea reporte completo
  cancelIncidentReport,         // Cancela y limpia foto
} = useIncidentReport();
```

### useIncidentManagement.ts (Admin)

**Funciones principales:**
```typescript
const {
  incidents,
  loading,
  loadIncidents,           // Carga lista de incidentes
  confirmIncident,         // Confirma y emite advertencia
  dismissIncident,         // Descarta incidente
  getUserWarningCount,     // Obtiene total de advertencias
} = useIncidentManagement();
```

## Helpers: incidentHelpers.ts

**Ubicación:** `src/lib/incidentHelpers.ts`

```typescript
// Compresión de imágenes
compressImage(file, maxSizeKB, maxWidth, maxHeight): Promise<File>

// Sanitización de matrículas
sanitizeLicensePlate(licensePlate): string

// Validaciones
isValidImageType(file): boolean
isValidFileSize(file, maxSizeMB): boolean

// Storage
uploadIncidentPhoto(file, userId, incidentId): Promise<string>
deleteIncidentPhoto(photoUrl): Promise<void>
```

## Grupos de Reserva para Incidentes

### Campo: is_incident_reserve

**Tabla:** `parking_groups`

```sql
ALTER TABLE parking_groups 
ADD COLUMN is_incident_reserve BOOLEAN DEFAULT FALSE;
```

**Uso:**
- `false` - Grupo normal (prioridad 1 en búsqueda)
- `true` - Grupo de reserva para incidentes (prioridad 2)

**Configuración en Admin:**
- Checkbox en formulario de grupo
- Tooltip explicativo
- Badge visual en lista de grupos

## Flujo de Advertencias

### Cuando Admin Confirma Incidente

1. **Identifica al infractor:**
   - Por matrícula registrada en sistema
   - Si no está registrado, queda como "usuario desconocido"

2. **Emite advertencia:**
   - Crea registro en `user_warnings`
   - Vincula con `incident_report_id`
   - Registra admin que emitió la advertencia

3. **Actualiza estado:**
   - `incident_reports.status` → 'confirmed'
   - `incident_reports.resolved_at` → NOW()
   - `incident_reports.resolved_by` → admin_id

4. **Notificación:**
   - Toast de éxito para admin
   - (Futuro: Email/notificación al infractor)

### Visualización de Advertencias

**En lista de incidentes:**
- Badge con número de advertencias del infractor
- Color según cantidad (amarillo/naranja/rojo)

**En detalles de incidente:**
- Historial completo de advertencias del usuario
- Fecha, tipo, descripción
- Admin que emitió cada advertencia

## Testing y Validación

### Script de Verificación

**Ubicación:** `scripts/verify-incident-system.sql`

Verifica:
- Existencia de tablas
- Políticas RLS
- Funciones SQL
- Triggers
- Índices

### Casos de Prueba

1. **Flujo completo exitoso:**
   - Usuario reporta incidente
   - Sube foto y matrícula
   - Sistema encuentra plaza
   - Crea nueva reserva

2. **Sin plazas disponibles:**
   - Usuario reporta incidente
   - No hay plazas libres
   - Muestra mensaje de contacto

3. **Matrícula no registrada:**
   - Usuario introduce matrícula desconocida
   - Sistema crea reporte sin offending_user_id
   - Admin puede identificar manualmente

4. **Admin confirma incidente:**
   - Admin revisa evidencia
   - Confirma incidente
   - Sistema emite advertencia automática

## Documentación Adicional

- **Guía de Admin:** `docs/ADMIN-INCIDENT-MANAGEMENT-GUIDE.md`
- **Resumen de Implementación:** `docs/INCIDENT-REPORTING-IMPLEMENTATION-SUMMARY.md`
- **Guía de Validación:** `docs/INCIDENT-REPORTING-VALIDATION-GUIDE.md`
- **Setup de Storage:** `docs/incident-photos-setup-complete.md`

## Mejoras Futuras

### Fase 2 (Opcional)
- [ ] Notificaciones push/email al infractor
- [ ] Sistema de sanciones automáticas (3 advertencias = bloqueo temporal)
- [ ] Dashboard de estadísticas de incidentes
- [ ] Exportación de reportes para auditoría
- [ ] Geolocalización para verificar ubicación del reportero
- [ ] Chat entre usuario y admin para aclaraciones
