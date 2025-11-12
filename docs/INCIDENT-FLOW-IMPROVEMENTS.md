# Mejoras al Flujo de Reporte de Incidencias

## Cambios Implementados

### 1. Mejora de UX - Modal en lugar de vista completa

**Problema anterior:**
- Al reportar una incidencia, el formulario aparecía debajo del calendario
- No era intuitivo ni seguía patrones modernos de UX
- El usuario perdía contexto del calendario

**Solución implementada:**
- El flujo de incidencias ahora se muestra en un **Dialog modal de pantalla completa**
- Se superpone al calendario manteniendo el contexto
- Sigue el patrón de diseño Typeform con pasos progresivos
- Mejor experiencia móvil y desktop

**Archivos modificados:**
- `src/components/ReservationDetailsModal.tsx` - Envuelve IncidentReportFlow en Dialog
- `src/components/incidents/IncidentReportFlow.tsx` - Adaptado para funcionar dentro de modal
- `src/hooks/useParkingCalendar.ts` - Incluye userId en detalles de reserva

### 2. Mejora de Lógica - Búsqueda expandida de plazas

**Problema anterior:**
- La función `find_available_spot_for_incident` solo buscaba en grupos asignados al usuario
- Si no había plazas libres en esos grupos, fallaba aunque hubiera plazas en otros grupos
- No utilizaba plazas reservadas como último recurso

**Solución implementada:**
Nueva lógica de búsqueda con 5 niveles de prioridad:

1. **Prioridad 1**: Grupos generales asignados al usuario (sin reservar)
2. **Prioridad 2**: Grupos de reserva de incidentes asignados al usuario (sin reservar)
3. **Prioridad 3**: CUALQUIER grupo general NO asignado al usuario (sin reservar)
4. **Prioridad 4**: CUALQUIER grupo de reserva de incidentes NO asignado (sin reservar)
5. **Prioridad 5 (ÚLTIMO RECURSO)**: CUALQUIER plaza reservada (excepto del mismo usuario)

**Archivo creado:**
- `supabase/migrations/20251112212041_improve_incident_spot_search.sql`

## Aplicar la Migración SQL

⚠️ **IMPORTANTE**: La migración SQL debe aplicarse manualmente.

### Opción 1: Dashboard de Supabase (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/sql/new
2. Copia el contenido de `supabase/migrations/20251112212041_improve_incident_spot_search.sql`
3. Pégalo en el editor SQL
4. Haz clic en "Run"

### Opción 2: CLI de Supabase

```bash
# Conectar a la base de datos remota
supabase db remote psql

# Dentro de psql, ejecutar:
\i supabase/migrations/20251112212041_improve_incident_spot_search.sql

# O copiar y pegar el contenido del archivo
```

### Verificar que la migración se aplicó correctamente

```sql
-- Verificar que la función existe
SELECT proname, pg_get_function_identity_arguments(oid) 
FROM pg_proc 
WHERE proname = 'find_available_spot_for_incident';

-- Debería retornar:
-- find_available_spot_for_incident | _user_id uuid, _date date, _original_spot_id uuid
```

## Probar los Cambios

### Test 1: UX del Modal

1. Inicia sesión en la aplicación
2. Ve al calendario y haz clic en una reserva de hoy
3. Haz clic en "Reportar Incidencia"
4. **Verificar**: El formulario aparece en un modal superpuesto, no debajo del calendario
5. **Verificar**: Puedes ver los pasos de progreso en la parte superior
6. **Verificar**: El modal es responsive (prueba en móvil)

### Test 2: Búsqueda Expandida de Plazas

**Escenario A: Plazas disponibles en grupos no asignados**

1. Crea un usuario con acceso solo a "Grupo A"
2. Reserva todas las plazas de "Grupo A" para mañana
3. Deja plazas libres en "Grupo B" (al que el usuario NO tiene acceso)
4. Reporta una incidencia para mañana
5. **Verificar**: El sistema asigna una plaza del "Grupo B" (Prioridad 3)

**Escenario B: Solo plazas reservadas disponibles**

1. Reserva TODAS las plazas de TODOS los grupos para mañana
2. Reporta una incidencia para mañana
3. **Verificar**: El sistema asigna una plaza reservada de otro usuario (Prioridad 5)
4. **Verificar**: El otro usuario recibe notificación de que su reserva fue reasignada

**Escenario C: Grupos de reserva de incidentes**

1. Marca un grupo como "is_incident_reserve = true"
2. Reporta una incidencia cuando no hay plazas en grupos normales
3. **Verificar**: El sistema usa el grupo de reserva (Prioridad 2 o 4)

## Beneficios

### UX
- ✅ Flujo más intuitivo y moderno
- ✅ Mejor experiencia móvil
- ✅ Mantiene contexto del calendario
- ✅ Sigue patrones de diseño establecidos (Typeform)

### Lógica de Negocio
- ✅ Maximiza la probabilidad de encontrar una plaza alternativa
- ✅ Utiliza TODOS los recursos disponibles antes de fallar
- ✅ Prioriza correctamente (grupos asignados → otros grupos → reservadas)
- ✅ Evita dejar usuarios sin plaza cuando hay alternativas

## Notas Técnicas

### Cambios en TypeScript

**ReservationDetailsModal.tsx:**
- Añadido `userId` a la interfaz de props de reserva
- Envuelto `IncidentReportFlow` en `Dialog` con clase `max-w-4xl h-[90vh]`

**IncidentReportFlow.tsx:**
- Cambiado contenedor de `min-h-screen` a `flex flex-col h-full`
- Añadido `overflow-y-auto` al contenedor de pasos para scroll interno

**useParkingCalendar.ts:**
- Añadido `user_id` a la query de `loadReservationDetails`
- Incluido `userId` en el objeto `selectedReservationDetails`

### Cambios en SQL

**find_available_spot_for_incident:**
- Expandida de 2 niveles de prioridad a 5
- Añadida búsqueda en grupos no asignados (Prioridades 3 y 4)
- Añadida búsqueda en plazas reservadas como último recurso (Prioridad 5)
- Mejorados comentarios y documentación

## Próximos Pasos Sugeridos

1. **Notificaciones**: Cuando se reasigna una plaza reservada (Prioridad 5), notificar al usuario afectado
2. **Analytics**: Trackear cuántas veces se usa cada nivel de prioridad
3. **Admin Dashboard**: Mostrar estadísticas de reasignaciones por prioridad
4. **Configuración**: Permitir a admins deshabilitar Prioridad 5 si no quieren reasignar plazas reservadas

## Rollback

Si necesitas revertir los cambios:

### Frontend (Git)
```bash
git revert HEAD  # Si ya hiciste commit
# O restaurar archivos específicos
git checkout HEAD~1 -- src/components/ReservationDetailsModal.tsx
git checkout HEAD~1 -- src/components/incidents/IncidentReportFlow.tsx
git checkout HEAD~1 -- src/hooks/useParkingCalendar.ts
```

### Backend (SQL)
```sql
-- Restaurar función original (solo 2 niveles de prioridad)
-- Ver: supabase/migrations/20251111234017_add_incident_reporting_features.sql
-- Copiar y ejecutar la versión original de find_available_spot_for_incident
```
