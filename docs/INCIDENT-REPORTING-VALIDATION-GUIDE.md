# Guía de Validación - Sistema de Reporte de Incidentes

## Resumen

Esta guía proporciona un plan exhaustivo de validación manual para el sistema de reporte de incidentes de parking. Como el proyecto no tiene framework de testing configurado, esta validación se realizará manualmente siguiendo los escenarios descritos.

## Estado de Implementación

✅ **Todas las tareas de implementación completadas (1-17)**
🔍 **Tarea 18: Validación y Testing** (en progreso)

---

## 18.1 - Flujo Completo de Usuario (Report → Reassign → Confirm)

### Objetivo
Verificar que el flujo completo de reporte de incidentes funciona correctamente desde la perspectiva del usuario.

### Pre-requisitos
- Usuario con reserva activa para hoy
- Al menos 2 grupos de parking configurados (uno general, uno incident_reserve)
- Plazas disponibles en ambos grupos
- Matrícula aprobada registrada en el sistema

### Escenario 1: Flujo exitoso con plaza disponible en grupo general

**Pasos:**
1. Iniciar sesión como usuario con reserva activa
2. Abrir el modal de detalles de reserva
3. Hacer clic en "Reportar Incidente"
4. **Paso 1 - Verificación de ubicación:**
   - Verificar que se muestra el número de plaza reservada
   - Verificar que se muestra el nombre del grupo
   - Hacer clic en "Sí, estoy en la plaza correcta"

5. **Paso 2 - Captura de evidencia:**
   - Subir una foto (< 10MB, formato JPG/PNG)
   - Verificar que se muestra la vista previa
   - Ingresar matrícula del vehículo infractor
   - Hacer clic en "Enviar reporte"


6. **Paso 3 - Reasignación de plaza:**
   - Verificar que se muestra mensaje de éxito
   - Verificar que se muestra nueva plaza asignada
   - Verificar que el número de plaza es diferente al original
   - Verificar que pertenece a un grupo general (no incident_reserve)
   - Hacer clic en "Ir a mi nueva plaza"

**Validaciones en Base de Datos:**
```sql
-- Verificar que se creó el incidente
SELECT * FROM incident_reports 
WHERE reporter_id = '[USER_ID]' 
ORDER BY created_at DESC LIMIT 1;

-- Verificar que se asignó plaza de grupo general (no incident_reserve)
SELECT ps.spot_number, pg.name, pg.is_incident_reserve
FROM incident_reports ir
JOIN parking_spots ps ON ir.reassigned_spot_id = ps.id
JOIN parking_groups pg ON ps.group_id = pg.id
WHERE ir.id = '[INCIDENT_ID]';
-- Resultado esperado: is_incident_reserve = FALSE

-- Verificar que se creó la nueva reserva
SELECT * FROM reservations 
WHERE id = (
  SELECT reassigned_reservation_id 
  FROM incident_reports 
  WHERE id = '[INCIDENT_ID]'
);

-- Verificar que la foto se subió
SELECT photo_url FROM incident_reports WHERE id = '[INCIDENT_ID]';
-- Resultado esperado: URL no nula

-- Verificar que se identificó al usuario infractor
SELECT offending_user_id, offending_license_plate 
FROM incident_reports 
WHERE id = '[INCIDENT_ID]';
-- Resultado esperado: offending_user_id no nulo si la matrícula existe
```

**Resultado Esperado:**
- ✅ Incidente creado con status 'pending'
- ✅ Plaza reasignada de grupo general (is_incident_reserve = false)
- ✅ Nueva reserva creada y activa
- ✅ Foto subida correctamente a Storage
- ✅ Usuario infractor identificado (si matrícula existe)

---

### Escenario 2: Flujo con plaza disponible solo en grupo incident_reserve

**Pre-requisitos adicionales:**
- Todas las plazas de grupos generales ocupadas
- Al menos una plaza disponible en grupo incident_reserve

**Pasos:**
1-5. Seguir los mismos pasos del Escenario 1

6. **Paso 3 - Reasignación de plaza:**
   - Verificar que se asignó plaza de grupo incident_reserve

**Validaciones en Base de Datos:**
```sql
-- Verificar que se asignó plaza de grupo incident_reserve
SELECT ps.spot_number, pg.name, pg.is_incident_reserve
FROM incident_reports ir
JOIN parking_spots ps ON ir.reassigned_spot_id = ps.id
JOIN parking_groups pg ON ps.group_id = pg.id
WHERE ir.id = '[INCIDENT_ID]';
-- Resultado esperado: is_incident_reserve = TRUE
```

**Resultado Esperado:**
- ✅ Plaza reasignada de grupo incident_reserve (is_incident_reserve = true)
- ✅ Prioridad respetada: solo se usa incident_reserve cuando no hay plazas generales

---

### Escenario 3: Sin plazas disponibles

**Pre-requisitos adicionales:**
- Todas las plazas ocupadas (generales e incident_reserve)

**Pasos:**
1-5. Seguir los mismos pasos del Escenario 1

6. **Paso 3 - Mensaje de error:**
   - Verificar mensaje: "No hay plazas disponibles en este momento"
   - Verificar que se muestra información de contacto administrativo
   - Verificar que el incidente se registró de todos modos

**Validaciones en Base de Datos:**
```sql
-- Verificar que se creó el incidente sin reasignación
SELECT reassigned_spot_id, reassigned_reservation_id 
FROM incident_reports 
WHERE id = '[INCIDENT_ID]';
-- Resultado esperado: ambos campos NULL

-- Verificar que el status es pending
SELECT status FROM incident_reports WHERE id = '[INCIDENT_ID]';
-- Resultado esperado: 'pending'
```

**Resultado Esperado:**
- ✅ Incidente registrado sin reasignación
- ✅ Mensaje claro al usuario
- ✅ reassigned_spot_id y reassigned_reservation_id son NULL

---

### Escenario 4: Matrícula no encontrada en sistema

**Pasos:**
1-4. Seguir los mismos pasos del Escenario 1
5. Ingresar matrícula que NO existe en el sistema
6. Continuar con el flujo

**Validaciones en Base de Datos:**
```sql
-- Verificar que el incidente se creó sin identificar infractor
SELECT offending_user_id, offending_license_plate 
FROM incident_reports 
WHERE id = '[INCIDENT_ID]';
-- Resultado esperado: offending_user_id = NULL, offending_license_plate tiene valor
```

**Resultado Esperado:**
- ✅ Incidente creado correctamente
- ✅ offending_license_plate almacenada
- ✅ offending_user_id es NULL (admin puede identificar manualmente)

---

### Escenario 5: Validación de foto

**Pruebas a realizar:**

**5.1 Foto válida (JPG, < 10MB):**
- ✅ Se acepta y sube correctamente
- ✅ Vista previa se muestra

**5.2 Foto muy grande (> 10MB):**
- ✅ Se muestra error de validación
- ✅ No se permite continuar

**5.3 Formato inválido (PDF, TXT):**
- ✅ Se muestra error de validación
- ✅ No se permite continuar

**5.4 Fallo en subida (simular desconexión):**
- ✅ Se muestra mensaje de error
- ✅ Incidente se registra sin foto
- ✅ photo_url es NULL

---

## 18.2 - Gestión de Incidentes por Admin

### Objetivo
Verificar que los administradores pueden gestionar incidentes correctamente.

### Pre-requisitos
- Usuario con rol admin
- Al menos 3 incidentes creados (pending, confirmed, dismissed)

### Escenario 1: Listar y filtrar incidentes

**Pasos:**
1. Iniciar sesión como admin
2. Navegar a "Incidentes" en el panel admin
3. Verificar que se muestra la lista de incidentes

**Validaciones UI:**
- ✅ Se muestran todos los incidentes
- ✅ Información visible: reportador, fecha, status, usuario infractor
- ✅ Incidentes pending destacados visualmente

**Filtros:**
1. Filtrar por "Pending"
   - ✅ Solo se muestran incidentes pending
2. Filtrar por "Confirmed"
   - ✅ Solo se muestran incidentes confirmed
3. Filtrar por "Dismissed"
   - ✅ Solo se muestran incidentes dismissed
4. Filtrar por "All"
   - ✅ Se muestran todos los incidentes

**Búsqueda:**
1. Buscar por nombre de usuario
   - ✅ Resultados filtrados correctamente
2. Buscar por matrícula
   - ✅ Resultados filtrados correctamente

**Ordenamiento:**
- ✅ Incidentes ordenados por fecha (más recientes primero)

---

### Escenario 2: Ver detalles de incidente

**Pasos:**
1. Hacer clic en un incidente de la lista
2. Verificar que se abre el panel de detalles

**Validaciones UI:**
- ✅ Información del reportador (nombre, email)
- ✅ Plaza original (número, grupo)
- ✅ Plaza reasignada (número, grupo) si aplica
- ✅ Usuario infractor (nombre, email) si identificado
- ✅ Matrícula del infractor
- ✅ Foto de evidencia (con opción de ver tamaño completo)
- ✅ Timestamps (created_at, confirmed_at si aplica)
- ✅ Campo de notas admin (editable)
- ✅ Historial de amonestaciones del infractor (si aplica)

---

### Escenario 3: Confirmar incidente

**Pre-requisitos:**
- Incidente con status 'pending'
- Usuario infractor identificado
- Usuario infractor tiene reserva activa para esa fecha

**Pasos:**
1. Abrir detalles de incidente pending
2. Hacer clic en "Confirmar Incidente"
3. Verificar diálogo de confirmación
4. Confirmar acción

**Validaciones en Base de Datos:**
```sql
-- Verificar que el status cambió a confirmed
SELECT status, confirmed_by, confirmed_at 
FROM incident_reports 
WHERE id = '[INCIDENT_ID]';
-- Resultado esperado: status = 'confirmed', confirmed_by y confirmed_at no nulos

-- Verificar que se emitió amonestación
SELECT * FROM user_warnings 
WHERE incident_id = '[INCIDENT_ID]';
-- Resultado esperado: 1 registro

-- Verificar que se canceló la reserva del infractor
SELECT status FROM reservations 
WHERE user_id = '[OFFENDING_USER_ID]'
  AND reservation_date = '[INCIDENT_DATE]'
  AND spot_id = '[ORIGINAL_SPOT_ID]';
-- Resultado esperado: status = 'cancelled'

-- Verificar log de cancelación
SELECT * FROM reservation_cancellation_log 
WHERE reservation_id IN (
  SELECT id FROM reservations 
  WHERE user_id = '[OFFENDING_USER_ID]'
    AND reservation_date = '[INCIDENT_DATE]'
);
-- Resultado esperado: 1 registro con triggered_by = 'admin_incident_confirmation'
```

**Validaciones UI:**
- ✅ Toast de éxito: "Incidente confirmado. Amonestación emitida y reserva cancelada."
- ✅ Status del incidente actualizado a 'confirmed'
- ✅ Botones de acción deshabilitados

**Resultado Esperado:**
- ✅ Status = 'confirmed'
- ✅ Amonestación creada en user_warnings
- ✅ Reserva del infractor cancelada
- ✅ Log de cancelación creado

---

### Escenario 4: Confirmar incidente sin usuario identificado

**Pre-requisitos:**
- Incidente con status 'pending'
- offending_user_id es NULL

**Pasos:**
1. Confirmar incidente

**Validaciones:**
- ✅ Status cambia a 'confirmed'
- ✅ NO se emite amonestación
- ✅ NO se cancela ninguna reserva
- ✅ Toast: "Incidente confirmado"

---

### Escenario 5: Desestimar incidente

**Pre-requisitos:**
- Incidente con status 'pending'

**Pasos:**
1. Abrir detalles de incidente
2. Hacer clic en "Desestimar Incidente"
3. Ingresar razón (opcional)
4. Confirmar

**Validaciones en Base de Datos:**
```sql
-- Verificar que el status cambió a dismissed
SELECT status, admin_notes 
FROM incident_reports 
WHERE id = '[INCIDENT_ID]';
-- Resultado esperado: status = 'dismissed', admin_notes con razón

-- Verificar que NO se emitió amonestación
SELECT COUNT(*) FROM user_warnings 
WHERE incident_id = '[INCIDENT_ID]';
-- Resultado esperado: 0

-- Verificar que las reservas NO se cancelaron
SELECT status FROM reservations 
WHERE user_id = '[OFFENDING_USER_ID]'
  AND reservation_date = '[INCIDENT_DATE]';
-- Resultado esperado: status = 'active' (sin cambios)
```

**Resultado Esperado:**
- ✅ Status = 'dismissed'
- ✅ Razón guardada en admin_notes
- ✅ NO se emiten amonestaciones
- ✅ NO se cancelan reservas

---

### Escenario 6: Agregar/editar notas admin

**Pasos:**
1. Abrir detalles de incidente
2. Editar campo de notas admin
3. Guardar cambios

**Validaciones:**
- ✅ Toast de éxito: "Notas actualizadas"
- ✅ Notas guardadas en base de datos
- ✅ Notas visibles al recargar

---

### Escenario 7: Ver historial de amonestaciones

**Pre-requisitos:**
- Usuario infractor con múltiples amonestaciones

**Pasos:**
1. Abrir incidente con usuario infractor identificado
2. Verificar sección de historial de amonestaciones

**Validaciones:**
- ✅ Se muestra contador de amonestaciones
- ✅ Se muestra lista de amonestaciones previas
- ✅ Cada amonestación muestra: fecha, razón, incidente relacionado

---

## 18.3 - Responsividad Móvil

### Objetivo
Verificar que la interfaz funciona correctamente en dispositivos móviles.

### Dispositivos de Prueba
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad)

### Escenario 1: Captura de cámara en móvil

**Pasos:**
1. Abrir flujo de reporte en dispositivo móvil
2. Llegar al paso de captura de evidencia
3. Hacer clic en "Capturar foto"

**Validaciones:**
- ✅ Se abre la cámara nativa del dispositivo
- ✅ Atributo `capture="environment"` usa cámara trasera
- ✅ Foto capturada se muestra en vista previa
- ✅ Opción de retomar foto funciona

---

### Escenario 2: Botones touch-friendly

**Validaciones en todos los pasos:**
- ✅ Botones tienen tamaño mínimo 44x44px
- ✅ Espaciado adecuado entre botones
- ✅ Feedback visual al tocar (hover/active states)
- ✅ No hay elementos demasiado pequeños para tocar

---

### Escenario 3: Layout adaptativo

**Validaciones:**

**Pantalla pequeña (< 640px):**
- ✅ Indicadores de progreso se adaptan (solo números, sin texto)
- ✅ Formularios ocupan ancho completo
- ✅ Imágenes se redimensionan correctamente
- ✅ Texto legible sin zoom
- ✅ No hay scroll horizontal

**Pantalla mediana (640px - 1024px):**
- ✅ Layout se adapta correctamente
- ✅ Indicadores de progreso muestran texto

**Pantalla grande (> 1024px):**
- ✅ Contenido centrado con max-width
- ✅ Espaciado apropiado

---

### Escenario 4: Inputs móviles

**Validaciones:**
- ✅ Input de matrícula muestra teclado apropiado
- ✅ Input de file acepta fotos de galería
- ✅ Textarea de notas funciona correctamente
- ✅ Selects y dropdowns son fáciles de usar

---

## 18.4 - Escenarios de Error

### Objetivo
Verificar que el sistema maneja errores correctamente.

### Escenario 1: Error de red durante subida de foto

**Simulación:**
1. Desconectar internet antes de enviar reporte
2. Intentar enviar reporte con foto

**Validaciones:**
- ✅ Se muestra mensaje de error claro
- ✅ Opción de reintentar
- ✅ Incidente se registra sin foto si falla después de 3 intentos
- ✅ No se pierde el progreso del formulario

---

### Escenario 2: Modificación concurrente de incidente

**Simulación:**
1. Admin A abre incidente
2. Admin B confirma el mismo incidente
3. Admin A intenta confirmar

**Validaciones:**
- ✅ Se detecta el conflicto
- ✅ Mensaje: "Este incidente ha sido modificado por otro administrador"
- ✅ Se recargan los detalles actualizados
- ✅ No se permite acción duplicada

---

### Escenario 3: Matrícula inválida

**Pruebas:**

**3.1 Matrícula vacía:**
- ✅ Validación impide envío
- ✅ Mensaje de error claro

**3.2 Matrícula con caracteres especiales:**
- ✅ Se sanitiza automáticamente (mayúsculas, sin espacios)
- ✅ Se acepta y procesa

**3.3 Matrícula muy larga (> 20 caracteres):**
- ✅ Validación impide envío
- ✅ Mensaje de error

---

### Escenario 4: Sesión expirada

**Simulación:**
1. Iniciar flujo de reporte
2. Esperar a que expire la sesión
3. Intentar enviar reporte

**Validaciones:**
- ✅ Se detecta sesión expirada
- ✅ Mensaje de error apropiado
- ✅ Redirección a login
- ✅ Datos del formulario se pierden (comportamiento esperado)

---

### Escenario 5: Permisos insuficientes

**Simulación:**
1. Usuario sin rol admin intenta acceder a panel de incidentes

**Validaciones:**
- ✅ Acceso denegado
- ✅ Redirección apropiada
- ✅ Mensaje de error claro

---

### Escenario 6: Foto corrupta o inválida

**Pruebas:**

**6.1 Archivo corrupto:**
- ✅ Error de validación
- ✅ Mensaje claro al usuario

**6.2 Archivo muy grande (> 10MB):**
- ✅ Validación impide selección
- ✅ Mensaje: "La foto debe ser menor a 10MB"

**6.3 Formato no soportado:**
- ✅ Validación impide selección
- ✅ Mensaje: "Formato no válido. Use JPG, PNG o HEIC"

---

## Checklist de Validación Completa

### Funcionalidad Core
- [ ] Flujo completo de reporte funciona
- [ ] Prioridad de asignación respetada (general → incident_reserve)
- [ ] Subida de fotos funciona
- [ ] Matching de matrículas funciona
- [ ] Escenario "sin plazas" manejado correctamente

### Admin Panel
- [ ] Lista de incidentes carga correctamente
- [ ] Filtros funcionan (status, búsqueda)
- [ ] Detalles de incidente se muestran completos
- [ ] Confirmar incidente emite amonestación
- [ ] Confirmar incidente cancela reserva infractor
- [ ] Desestimar incidente funciona
- [ ] Notas admin se guardan correctamente
- [ ] Historial de amonestaciones visible

### Responsividad
- [ ] Captura de cámara funciona en móvil
- [ ] Botones son touch-friendly
- [ ] Layout se adapta a diferentes tamaños
- [ ] No hay scroll horizontal
- [ ] Texto legible sin zoom

### Manejo de Errores
- [ ] Error de red manejado correctamente
- [ ] Modificación concurrente detectada
- [ ] Validación de matrícula funciona
- [ ] Sesión expirada manejada
- [ ] Permisos verificados
- [ ] Archivos inválidos rechazados

### Base de Datos
- [ ] Incidentes se crean correctamente
- [ ] Amonestaciones se registran
- [ ] Reservas se cancelan
- [ ] Logs de cancelación se crean
- [ ] RLS policies funcionan correctamente
- [ ] Índices mejoran performance

---

## Notas Finales

Esta guía cubre todos los escenarios críticos del sistema de reporte de incidentes. Se recomienda:

1. **Ejecutar validaciones en orden**: Empezar por flujo básico, luego casos edge
2. **Documentar resultados**: Marcar cada checklist item con ✅ o ❌
3. **Reportar bugs**: Crear issues para cualquier comportamiento inesperado
4. **Validar en múltiples navegadores**: Chrome, Safari, Firefox
5. **Validar en dispositivos reales**: No solo emuladores

**Tiempo estimado de validación completa**: 3-4 horas

**Prioridad de validación**:
1. 🔴 Alta: Escenarios 18.1 (flujo completo) y 18.2 (admin)
2. 🟡 Media: Escenario 18.3 (móvil)
3. 🟢 Baja: Escenario 18.4 (errores edge cases)
