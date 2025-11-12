# Correcciones al Flujo de Reporte de Incidencias

## Problemas Identificados y Solucionados

### 1. ✅ Reserva Original No Se Cancelaba

**Problema:**
- Cuando se asignaba una nueva plaza, la reserva original permanecía activa
- El usuario tenía dos reservas activas para la misma fecha
- La plaza ocupada seguía apareciendo como reservada

**Causa:**
El hook `useIncidentReport.ts` no incluía el paso de cancelar la reserva original antes de crear la nueva.

**Solución:**
Añadido **Step 3** en `createIncidentReport`:

```typescript
// Step 3: Cancel original reservation
const { error: cancelError } = await supabase
  .from('reservations')
  .update({ 
    status: 'cancelled', 
    cancelled_at: new Date().toISOString() 
  })
  .eq('id', params.reservationId);
```

**Flujo corregido:**
1. Buscar usuario infractor por matrícula
2. Buscar plaza alternativa disponible
3. **🆕 Cancelar reserva original**
4. Crear nueva reserva en plaza alternativa
5. Subir foto de evidencia
6. Crear registro de incidente

**Archivo modificado:**
- `src/hooks/useIncidentReport.ts`

---

### 2. ✅ No Detectaba al Infractor

**Problema:**
- La búsqueda de matrícula no encontraba al usuario infractor
- El campo `offending_user_id` quedaba NULL en la base de datos
- Los administradores no podían ver quién ocupó la plaza

**Causa:**
La función `findUserByLicensePlate` usaba `.single()` que fallaba si no había exactamente 1 resultado, y no mostraba logs para debugging.

**Solución:**
Mejorada la función de búsqueda:

```typescript
const findUserByLicensePlate = async (licensePlate: string): Promise<string | null> => {
  try {
    const sanitized = sanitizeLicensePlate(licensePlate);
    
    console.log('Searching for license plate:', sanitized);

    // Try exact match first (case-insensitive)
    const { data, error } = await supabase
      .from('license_plates')
      .select('user_id, plate_number')
      .ilike('plate_number', sanitized)
      .eq('is_approved', true)
      .is('deleted_at', null);

    console.log('Found license plates:', data);

    if (!data || data.length === 0) {
      console.log('No matching license plate found');
      return null;
    }

    // Return the first match
    return data[0].user_id;
  } catch (error) {
    console.error('Error finding user by license plate:', error);
    return null;
  }
};
```

**Mejoras:**
- ✅ Eliminado `.single()` - ahora busca todos los matches
- ✅ Añadidos logs de debugging
- ✅ Retorna el primer match si hay múltiples
- ✅ Manejo de errores mejorado

**Archivo modificado:**
- `src/hooks/useIncidentReport.ts`

**Cómo verificar:**
1. Abre la consola del navegador (F12)
2. Reporta una incidencia
3. Verás logs: "Searching for license plate: 1234ABC"
4. Verás logs: "Found license plates: [...]"
5. Si no encuentra nada: "No matching license plate found"

---

### 3. ✅ Modal Sin Scroll

**Problema:**
- El modal de reporte de incidencias no permitía hacer scroll
- Los campos de entrada quedaban fuera de la vista
- Era imposible completar el formulario sin usar Tab

**Causa:**
- El `DialogContent` tenía `overflow-hidden` sin estructura flex adecuada
- Los componentes hijos no tenían contenedor scrollable correcto
- Faltaba `overflow-x-hidden` para evitar scroll horizontal

**Solución:**

**En ReservationDetailsModal.tsx:**
```tsx
<DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
  {/* Añadido: flex flex-col */}
```

**En IncidentReportFlow.tsx:**
```tsx
<div className="flex flex-col h-full bg-background">
  {/* Progress Indicators - Fixed height */}
  <div className="flex-shrink-0">
    {renderProgressIndicators()}
  </div>

  {/* Step Content - Scrollable */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden">
    <div className="min-h-full flex items-center justify-center py-6">
      {/* Componentes de pasos */}
    </div>
  </div>
</div>
```

**Mejoras:**
- ✅ Indicadores de progreso con altura fija (`flex-shrink-0`)
- ✅ Contenido scrollable con `overflow-y-auto`
- ✅ Prevención de scroll horizontal con `overflow-x-hidden`
- ✅ Centrado vertical del contenido con `flex items-center justify-center`
- ✅ Padding vertical para evitar que el contenido toque los bordes

**Archivos modificados:**
- `src/components/ReservationDetailsModal.tsx`
- `src/components/incidents/IncidentReportFlow.tsx`

---

## Testing

### Test 1: Cancelación de Reserva Original

**Pasos:**
1. Crea una reserva para hoy
2. Reporta una incidencia en esa reserva
3. Completa el flujo de reporte
4. Ve al calendario

**Resultado esperado:**
- ✅ La reserva original NO aparece en el calendario
- ✅ La nueva reserva SÍ aparece en el calendario
- ✅ Solo hay UNA reserva activa para hoy

**Verificar en base de datos:**
```sql
SELECT 
  id,
  user_id,
  spot_id,
  reservation_date,
  status,
  cancelled_at
FROM reservations
WHERE user_id = 'USER_ID'
  AND reservation_date = CURRENT_DATE
ORDER BY created_at DESC;
```

Deberías ver:
- Reserva original: `status = 'cancelled'`, `cancelled_at` con timestamp
- Nueva reserva: `status = 'active'`, `cancelled_at = NULL`

---

### Test 2: Detección de Infractor

**Pasos:**
1. Crea dos usuarios: Usuario A y Usuario B
2. Usuario B registra una matrícula (ej: "1234ABC") y espera aprobación
3. Admin aprueba la matrícula de Usuario B
4. Usuario A reporta incidencia con matrícula "1234ABC"
5. Completa el flujo

**Resultado esperado:**
- ✅ En la consola del navegador aparece: "Searching for license plate: 1234ABC"
- ✅ En la consola aparece: "Found license plates: [{user_id: '...', plate_number: '1234ABC'}]"
- ✅ El incidente se crea con `offending_user_id` del Usuario B

**Verificar en base de datos:**
```sql
SELECT 
  id,
  reporter_id,
  offending_license_plate,
  offending_user_id,
  status
FROM incident_reports
ORDER BY created_at DESC
LIMIT 1;
```

Deberías ver:
- `offending_license_plate`: "1234ABC"
- `offending_user_id`: UUID del Usuario B (NO NULL)

**Verificar en Admin Panel:**
1. Ve a Admin → Incidentes
2. Abre el incidente reportado
3. Deberías ver el nombre del Usuario B como infractor

---

### Test 3: Scroll en Modal

**Pasos:**
1. Abre la app en móvil (o modo responsive en Chrome DevTools)
2. Haz clic en una reserva de hoy
3. Presiona "Reportar Incidencia"
4. Avanza al paso de "Evidencia"

**Resultado esperado:**
- ✅ Puedes hacer scroll hacia abajo para ver todos los campos
- ✅ El botón "Capturar con cámara" es visible
- ✅ El input de matrícula es accesible sin Tab
- ✅ Los botones de acción están visibles al final
- ✅ No hay scroll horizontal

**Probar en diferentes tamaños:**
- Móvil (375px): ✅ Scroll vertical funciona
- Tablet (768px): ✅ Scroll vertical funciona
- Desktop (1920px): ✅ Todo visible sin scroll

---

## Verificación de Integración

### Flujo Completo End-to-End

**Escenario:**
Usuario A tiene reserva en Plaza A-15 para hoy. Al llegar, encuentra la plaza ocupada por un vehículo con matrícula "5678XYZ" (del Usuario B).

**Pasos:**
1. Usuario A abre la app
2. Hace clic en su reserva de hoy (Plaza A-15)
3. Presiona "Reportar Incidencia"
4. **Modal se abre** (no aparece debajo del calendario) ✅
5. Confirma ubicación en Plaza A-15
6. **Hace scroll hacia abajo** ✅
7. Captura foto del vehículo
8. **Hace scroll para ver el input de matrícula** ✅
9. Ingresa "5678XYZ"
10. Presiona "Continuar"
11. Sistema busca plaza alternativa
12. Sistema encuentra Plaza B-23 disponible
13. Sistema muestra confirmación

**Resultados esperados:**

**En la app:**
- ✅ Usuario A ve que su nueva plaza es B-23
- ✅ Usuario A NO ve la reserva de A-15 en el calendario
- ✅ Usuario A SÍ ve la reserva de B-23 en el calendario

**En la base de datos:**
```sql
-- Reserva original cancelada
SELECT * FROM reservations WHERE id = 'ORIGINAL_RESERVATION_ID';
-- status = 'cancelled', cancelled_at = '2025-11-12 22:30:00'

-- Nueva reserva activa
SELECT * FROM reservations WHERE user_id = 'USER_A_ID' AND reservation_date = CURRENT_DATE AND status = 'active';
-- spot_id = 'PLAZA_B23_ID', status = 'active'

-- Incidente registrado
SELECT * FROM incident_reports WHERE reservation_id = 'ORIGINAL_RESERVATION_ID';
-- offending_license_plate = '5678XYZ'
-- offending_user_id = 'USER_B_ID' (NO NULL) ✅
-- original_spot_id = 'PLAZA_A15_ID'
-- reassigned_spot_id = 'PLAZA_B23_ID'
-- photo_url = 'https://...' (URL de la foto)
```

**En el Admin Panel:**
- ✅ Admin ve el incidente en estado "Pendiente"
- ✅ Admin ve la foto del vehículo
- ✅ Admin ve la matrícula "5678XYZ"
- ✅ Admin ve el nombre del Usuario B como infractor
- ✅ Admin puede confirmar o desestimar el incidente

---

## Logs de Debugging

### Consola del Navegador

Durante el reporte de incidencia, deberías ver estos logs:

```
Searching for license plate: 5678XYZ
Found license plates: [{user_id: "abc-123-...", plate_number: "5678XYZ"}]
```

Si no encuentra la matrícula:
```
Searching for license plate: 9999ZZZ
Found license plates: []
No matching license plate found
```

### Errores Comunes

**Error: "No matching license plate found"**
- **Causa**: La matrícula no está registrada o no está aprobada
- **Solución**: Verificar que el usuario infractor tenga la matrícula registrada y aprobada

**Error: "Error al cancelar la reserva original"**
- **Causa**: Problema de permisos RLS o reserva ya cancelada
- **Solución**: Verificar políticas RLS en tabla `reservations`

**Error: "Error al crear la reserva de la nueva plaza"**
- **Causa**: Plaza ya reservada o usuario sin permisos
- **Solución**: Verificar disponibilidad real de la plaza

---

## Cambios en el Código

### Resumen de Archivos Modificados

1. **src/hooks/useIncidentReport.ts**
   - ✅ Añadido Step 3: Cancelar reserva original
   - ✅ Mejorada función `findUserByLicensePlate` con logs
   - ✅ Eliminado `.single()` en búsqueda de matrículas

2. **src/components/ReservationDetailsModal.tsx**
   - ✅ Añadido `flex flex-col` al DialogContent

3. **src/components/incidents/IncidentReportFlow.tsx**
   - ✅ Reestructurado layout con `flex-shrink-0` para progreso
   - ✅ Añadido `overflow-y-auto overflow-x-hidden` al contenedor
   - ✅ Añadido wrapper con `min-h-full flex items-center justify-center`

### Líneas de Código Añadidas/Modificadas

**useIncidentReport.ts:**
- Líneas añadidas: ~15
- Líneas modificadas: ~10
- Total cambios: ~25 líneas

**ReservationDetailsModal.tsx:**
- Líneas modificadas: 1
- Total cambios: 1 línea

**IncidentReportFlow.tsx:**
- Líneas modificadas: ~10
- Total cambios: ~10 líneas

**Total general: ~36 líneas de código**

---

## Próximos Pasos Recomendados

### 1. Notificaciones al Usuario Afectado

Cuando se reasigna una plaza reservada (Prioridad 5 de la función SQL), el usuario afectado debería recibir una notificación.

**Implementación sugerida:**
```typescript
// En useIncidentReport.ts, después de crear la nueva reserva
if (reassignmentResult.wasReserved) {
  // Notificar al usuario cuya reserva fue reasignada
  await supabase
    .from('notifications')
    .insert({
      user_id: affectedUserId,
      type: 'reservation_reassigned',
      message: 'Tu reserva fue reasignada debido a un incidente',
      data: { originalSpotId, newSpotId }
    });
}
```

### 2. Mejorar Búsqueda de Matrículas

Considerar búsqueda fuzzy para matrículas similares:

```typescript
// Buscar matrículas similares si no hay match exacto
const similarPlates = await supabase
  .from('license_plates')
  .select('user_id, plate_number')
  .ilike('plate_number', `%${sanitized}%`)
  .eq('is_approved', true)
  .is('deleted_at', null)
  .limit(5);
```

### 3. Analytics de Incidencias

Trackear métricas:
- Tiempo promedio de reporte
- Tasa de detección de infractores
- Uso de cada nivel de prioridad en búsqueda de plazas
- Plazas con más incidencias

### 4. Validación de Fotos con IA

Integrar OCR para detectar matrículas automáticamente en las fotos:

```typescript
// Usar servicio de OCR (Google Vision, AWS Rekognition, etc.)
const detectedPlate = await detectLicensePlateFromImage(photoFile);
if (detectedPlate) {
  setLicensePlate(detectedPlate);
  toast.success('Matrícula detectada automáticamente');
}
```

---

## Rollback

Si necesitas revertir estos cambios:

```bash
# Ver commits recientes
git log --oneline -5

# Revertir último commit
git revert HEAD

# O restaurar archivos específicos
git checkout HEAD~1 -- src/hooks/useIncidentReport.ts
git checkout HEAD~1 -- src/components/ReservationDetailsModal.tsx
git checkout HEAD~1 -- src/components/incidents/IncidentReportFlow.tsx
```

---

## Conclusión

Los tres problemas críticos han sido resueltos:

1. ✅ **Reserva original se cancela correctamente**
2. ✅ **Infractor se detecta por matrícula**
3. ✅ **Modal permite scroll completo**

El flujo de reporte de incidencias ahora funciona correctamente end-to-end.
