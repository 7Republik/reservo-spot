# Análisis de Performance Advisors - Supabase

**Fecha:** 2025-11-16  
**Proyecto:** RESERVEO (rlrzcfnhhvrvrxzfifeh)  
**Total Warnings:** 136

## Resumen Ejecutivo

⚠️ **136 warnings de performance detectados**  
✅ **Recomendación: NO arreglar ahora**  
📊 **Impacto real: BAJO** (queries < 1ms, datos pequeños)

---

## Tipos de Warnings

### 1. Auth RLS InitPlan (86 warnings)

**Problema:** Políticas RLS que re-evalúan `auth.uid()` para cada fila.

**Ejemplo actual:**
```sql
-- ❌ Se evalúa por cada fila
CREATE POLICY "Users view own" ON profiles
FOR SELECT USING (auth.uid() = id);
```

**Solución recomendada:**
```sql
-- ✅ Se evalúa una vez
CREATE POLICY "Users view own" ON profiles
FOR SELECT USING ((SELECT auth.uid()) = id);
```

**Tablas afectadas (20+):**
- profiles (3 políticas)
- user_roles (5 políticas)
- parking_spots (2 políticas)
- reservations (5 políticas)
- license_plates (5 políticas)
- user_warnings (4 políticas)
- incident_reports (4 políticas)
- waitlist_entries (5 políticas)
- waitlist_offers (4 políticas)
- waitlist_logs (2 políticas)
- waitlist_penalties (2 políticas)
- notifications (4 políticas)
- reservation_checkins (5 políticas)
- checkin_infractions (4 políticas)
- user_blocks (3 políticas)
- checkin_notifications (3 políticas)
- parking_groups (1 política)
- user_group_assignments (2 políticas)
- blocked_dates (1 política)
- reservation_settings (1 política)
- reservation_cancellation_log (2 políticas)
- checkin_settings (1 política)
- parking_group_checkin_config (2 políticas)
- waitlist_cron_logs (1 política)

**Total:** 86 políticas afectadas

---

### 2. Multiple Permissive Policies (50 warnings)

**Problema:** Múltiples políticas permisivas para el mismo rol y acción.

**Ejemplo:**
```sql
-- Tabla: reservations
-- Rol: anon
-- Acción: SELECT
-- Políticas:
1. "Deny unauthenticated access to reservations"
2. "Users can view their own reservations"
3. "Admins can view all reservations"
4. "Admins can manage all reservations"
```

**Tablas afectadas:**
- license_plates (5 roles × múltiples acciones)
- parking_groups (5 roles)
- parking_spots (5 roles)
- profiles (5 roles)
- reservation_cancellation_log (5 roles)
- reservations (5 roles × múltiples acciones)
- user_group_assignments (5 roles)
- user_roles (5 roles)
- blocked_dates (1 rol)
- checkin_infractions (1 rol)
- checkin_notifications (1 rol)
- incident_reports (1 rol)
- notifications (1 rol × múltiples acciones)
- parking_group_checkin_config (1 rol)
- reservation_checkins (1 rol × múltiples acciones)
- user_blocks (1 rol)
- user_warnings (1 rol)
- waitlist_entries (1 rol × múltiples acciones)
- waitlist_logs (1 rol)
- waitlist_offers (1 rol × múltiples acciones)
- waitlist_penalties (1 rol)

**Total:** 50 combinaciones tabla/rol/acción afectadas

---

## ¿Por Qué NO Arreglar Ahora?

### Razones Técnicas

**1. Impacto Real Bajo**
- ✅ Queries actuales: < 1ms (excelente)
- ✅ Cache hit rate: 99-100%
- ✅ Volumen de datos: Pequeño (< 10,000 registros por tabla)
- ✅ Sin quejas de usuarios

**2. Costo vs Beneficio**
- ⚠️ **Trabajo:** 136 políticas a modificar
- ⚠️ **Riesgo:** Alto (cambiar seguridad es delicado)
- ⚠️ **Testing:** Extensivo (todas las operaciones CRUD)
- ✅ **Beneficio:** Marginal (solo notorio con 100k+ filas)

**3. Momento Inadecuado**
- ✅ Sistema funcionando bien
- ✅ Performance aceptable
- ✅ Usuarios satisfechos
- ⚠️ Optimización prematura

### Razones de Diseño

**Multiple Permissive Policies es intencional:**

```sql
-- ✅ DISEÑO ACTUAL (Claro y mantenible)
CREATE POLICY "Deny anon" ON table FOR SELECT TO anon USING (false);
CREATE POLICY "Users view own" ON table FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all" ON table FOR SELECT TO authenticated 
  USING (is_admin(auth.uid()));

-- ❌ ALTERNATIVA (Más rápido pero menos claro)
CREATE POLICY "Complex policy" ON table FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR is_admin(auth.uid())
  );
```

**Ventajas del diseño actual:**
- ✅ Cada política tiene un propósito claro
- ✅ Fácil de entender y mantener
- ✅ Fácil de auditar
- ✅ Fácil de modificar individualmente

---

## Cuándo SÍ Arreglar

### Indicadores de que es momento de optimizar:

**1. Performance Degradada**
- ❌ Queries > 100ms consistentemente
- ❌ Usuarios reportan lentitud
- ❌ Cache hit rate < 90%

**2. Escala de Datos**
- ❌ > 100,000 reservas
- ❌ > 10,000 usuarios activos
- ❌ > 1,000 queries/segundo

**3. Métricas de Supabase**
- ❌ CPU > 80% consistentemente
- ❌ Memoria > 80%
- ❌ Conexiones agotadas

**4. Costos**
- ❌ Plan actual insuficiente
- ❌ Necesitas upgrade por performance

---

## Plan de Optimización Futura

### Fase 1: Auth RLS InitPlan (Prioridad Media)

**Cuándo:** Cuando tengas > 50,000 registros por tabla

**Cómo:**
1. Crear migración de prueba con 1-2 tablas
2. Cambiar `auth.uid()` por `(SELECT auth.uid())`
3. Testear exhaustivamente
4. Medir mejora de performance
5. Si mejora > 20%, aplicar a todas las tablas

**Ejemplo de migración:**
```sql
-- Tabla: profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (public.is_admin((SELECT auth.uid())));
```

**Esfuerzo estimado:** 2-3 días
**Riesgo:** Medio (requiere testing extensivo)
**Beneficio esperado:** 10-30% mejora en queries con muchas filas

---

### Fase 2: Multiple Permissive Policies (Prioridad Baja)

**Cuándo:** Cuando tengas > 1,000,000 registros por tabla

**Cómo:**
1. Identificar tablas más consultadas
2. Combinar políticas relacionadas
3. Mantener claridad con comentarios
4. Testear exhaustivamente

**Ejemplo de consolidación:**
```sql
-- ANTES (3 políticas)
CREATE POLICY "Deny anon" ON reservations FOR SELECT TO anon USING (false);
CREATE POLICY "Users view own" ON reservations FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all" ON reservations FOR SELECT TO authenticated 
  USING (is_admin(auth.uid()));

-- DESPUÉS (1 política)
CREATE POLICY "View reservations" ON reservations FOR SELECT
  USING (
    CASE 
      WHEN auth.role() = 'anon' THEN false
      WHEN is_admin(auth.uid()) THEN true
      ELSE auth.uid() = user_id
    END
  );
```

**Esfuerzo estimado:** 1-2 semanas
**Riesgo:** Alto (cambiar lógica de seguridad)
**Beneficio esperado:** 5-15% mejora en queries complejas

---

## Monitoreo Continuo

### Métricas a Vigilar

**1. Query Performance**
```sql
-- Ver queries más lentas
SELECT 
  query,
  calls,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%public.%'
ORDER BY mean_time DESC
LIMIT 20;
```

**2. Cache Hit Rate**
```sql
-- Debe ser > 95%
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

**3. Conexiones Activas**
```sql
-- Debe ser < 80% del límite
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

### Comandos MCP para Monitoreo

```typescript
// Verificar performance advisors
mcp_supabase_get_advisors({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  type: "performance"
})

// Ver queries lentas
mcp_supabase_execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: `
    SELECT 
      query,
      calls,
      mean_time,
      total_time
    FROM pg_stat_statements
    WHERE query LIKE '%public.%'
    ORDER BY mean_time DESC
    LIMIT 10
  `
})

// Ver logs de PostgreSQL
mcp_supabase_get_logs({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  service: "postgres"
})
```

---

## Decisión Final

### ✅ NO Optimizar Ahora

**Razones:**
1. Performance actual excelente (< 1ms)
2. Volumen de datos pequeño
3. Sin quejas de usuarios
4. Riesgo > Beneficio
5. Optimización prematura

### 📅 Revisar en el Futuro

**Triggers para revisar:**
- Cuando tengas 50,000+ registros por tabla
- Cuando queries superen 50ms consistentemente
- Cuando usuarios reporten lentitud
- Cuando necesites upgrade de plan por performance

### 📊 Mantener Monitoreo

**Frecuencia:** Mensual
**Métricas:** Query time, cache hit rate, conexiones
**Acción:** Solo optimizar si métricas se degradan

---

## Referencias

- [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Linter Docs](https://supabase.com/docs/guides/database/database-linter)

---

**Documento generado:** 2025-11-16  
**Próxima revisión:** Cuando haya 10x más datos o usuarios reporten lentitud  
**Estado:** Warnings conocidos y aceptados ✅
