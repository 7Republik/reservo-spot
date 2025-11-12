# 🚨 CORRECCIÓN URGENTE - RLS Policy

## Problema Crítico

El sistema está roto porque la política RLS (Row Level Security) de la tabla `reservations` no permite que los usuarios cancelen sus propias reservas.

**Error que aparece:**
```
Error cancelling original reservation: {
  code: '42501', 
  message: 'new row violates row-level security policy for table "reservations"'
}
```

## Solución Inmediata

### Opción 1: Dashboard de Supabase (Recomendado - 2 minutos)

1. **Abre el SQL Editor:**
   https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/sql/new

2. **Copia y pega este código:**

```sql
-- Eliminar política existente
DROP POLICY IF EXISTS "Users can cancel their own reservations" ON public.reservations;

-- Crear política corregida
CREATE POLICY "Users can cancel their own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

3. **Haz clic en "Run"**

4. **Verifica que funcionó:**

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reservations'
  AND cmd = 'UPDATE';
```

Deberías ver:
- `qual`: `(auth.uid() = user_id)`
- `with_check`: `(auth.uid() = user_id)`

### Opción 2: CLI de Supabase

```bash
# Conectar a la base de datos
supabase db remote psql

# Dentro de psql, ejecutar:
DROP POLICY IF EXISTS "Users can cancel their own reservations" ON public.reservations;

CREATE POLICY "Users can cancel their own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

# Salir
\q
```

## ¿Por Qué Pasó Esto?

La política RLS existente tenía un `WITH CHECK` incorrecto o faltante. El `WITH CHECK` valida las filas DESPUÉS de la actualización, y si no coincide con el usuario, rechaza la operación.

**Política incorrecta:**
```sql
-- Sin WITH CHECK o con WITH CHECK incorrecto
USING (auth.uid() = user_id)
-- Falta: WITH CHECK (auth.uid() = user_id)
```

**Política correcta:**
```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)  -- ✅ Esto permite la actualización
```

## Verificar que Funciona

Después de aplicar la corrección:

1. **Refresca la aplicación** (F5 en el navegador)

2. **Intenta reportar una incidencia:**
   - Haz clic en una reserva de hoy
   - Presiona "Reportar Incidencia"
   - Completa el flujo

3. **Verifica en consola del navegador:**
   - NO debería aparecer el error `42501`
   - Debería aparecer: "Incidente reportado y nueva plaza asignada"

4. **Verifica en el calendario:**
   - La reserva original NO aparece
   - La nueva reserva SÍ aparece

## Otros Cambios Aplicados

Además de la corrección RLS, también se arreglaron:

### 1. Warning de Accesibilidad

**Antes:**
```tsx
<DialogContent className="...">
  <IncidentReportFlow ... />
</DialogContent>
```

**Después:**
```tsx
<DialogContent className="..." aria-describedby="incident-report-description">
  <DialogTitle className="sr-only">Reportar Incidencia</DialogTitle>
  <DialogDescription id="incident-report-description" className="sr-only">
    Formulario para reportar una incidencia en tu plaza de parking reservada
  </DialogDescription>
  <IncidentReportFlow ... />
</DialogContent>
```

**Resultado:** Los lectores de pantalla ahora pueden anunciar correctamente el propósito del modal.

## Archivos Modificados

1. **`supabase/migrations/20251112213615_fix_reservations_update_policy.sql`** (nueva migración)
2. **`src/components/ReservationDetailsModal.tsx`** (añadido DialogTitle y DialogDescription)
3. **`scripts/apply-rls-fix.sql`** (script de ayuda)

## Timeline de Corrección

1. ✅ **Identificado el problema:** Error RLS 42501
2. ✅ **Creada migración:** `20251112213615_fix_reservations_update_policy.sql`
3. ✅ **Corregido warning de accesibilidad:** DialogTitle añadido
4. ⏳ **Pendiente:** Aplicar migración SQL (TÚ debes hacerlo)
5. ⏳ **Pendiente:** Verificar que funciona

## Próximos Pasos

1. **AHORA:** Aplica la corrección SQL (Opción 1 o 2 arriba)
2. **Después:** Refresca la app y prueba reportar una incidencia
3. **Verifica:** Que no aparezca el error 42501
4. **Confirma:** Que la reserva original se cancela correctamente

## Troubleshooting

### Error persiste después de aplicar la corrección

**Verifica que el usuario está autenticado:**
```sql
SELECT auth.uid();
```
Debería retornar un UUID, no NULL.

**Verifica que la política se aplicó:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'reservations' 
  AND cmd = 'UPDATE';
```

**Verifica que la reserva pertenece al usuario:**
```sql
SELECT id, user_id, status 
FROM reservations 
WHERE id = 'TU_RESERVATION_ID';
```

### La app sigue sin funcionar

1. Limpia la caché del navegador (Ctrl+Shift+Delete)
2. Cierra y abre el navegador
3. Verifica que no hay errores en la consola (F12)
4. Intenta con otro usuario

## Contacto de Emergencia

Si después de aplicar la corrección el problema persiste:

1. Revisa los logs de Supabase: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/logs/explorer
2. Verifica las políticas RLS: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/auth/policies
3. Comparte el error completo de la consola del navegador

## Resumen

**Problema:** Política RLS sin `WITH CHECK` correcto  
**Solución:** Añadir `WITH CHECK (auth.uid() = user_id)`  
**Tiempo:** 2 minutos  
**Impacto:** CRÍTICO - Sin esto, el reporte de incidencias NO funciona  

**¡Aplica la corrección AHORA!**
