# Optimización de Índices - Supabase

**Fecha:** 2025-11-16  
**Proyecto:** RESERVEO (rlrzcfnhhvrvrxzfifeh)

## Resumen Ejecutivo

✅ **11 índices añadidos** en foreign keys críticos  
📊 **Impacto esperado:** Mejora 20-50% en queries con JOINs  
⚠️ **31 índices no usados** - Mantenidos por precaución

---

## Índices Añadidos

### High Priority (5 índices)

**1. incident_reports.reservation_id**
```sql
CREATE INDEX idx_incident_reports_reservation_id 
ON public.incident_reports(reservation_id);
```
**Razón:** Usado en flujo de incidentes para buscar reserva original

**2. incident_reports.reassigned_spot_id**
```sql
CREATE INDEX idx_incident_reports_reassigned_spot_id 
ON public.incident_reports(reassigned_spot_id);
```
**Razón:** Usado en reasignación de plazas por incidentes

**3. incident_reports.original_spot_id**
```sql
CREATE INDEX idx_incident_reports_original_spot_id 
ON public.incident_reports(original_spot_id);
```
**Razón:** Usado para consultar incidentes por plaza original

**4. reservation_checkins.spot_id**
```sql
CREATE INDEX idx_reservation_checkins_spot_id 
ON public.reservation_checkins(spot_id);
```
**Razón:** Usado en estadísticas de check-in por plaza

**5. waitlist_offers.spot_id**
```sql
CREATE INDEX idx_waitlist_offers_spot_id 
ON public.waitlist_offers(spot_id);
```
**Razón:** Usado en procesamiento de waitlist por plaza

---

### Medium Priority (6 índices)

**6. checkin_infractions.reservation_id**
```sql
CREATE INDEX idx_checkin_infractions_reservation_id 
ON public.checkin_infractions(reservation_id);
```
**Razón:** Usado en detección de infracciones

**7. checkin_infractions.spot_id**
```sql
CREATE INDEX idx_checkin_infractions_spot_id 
ON public.checkin_infractions(spot_id);
```
**Razón:** Usado en queries de infracciones por plaza

**8. checkin_infractions.group_id**
```sql
CREATE INDEX idx_checkin_infractions_group_id 
ON public.checkin_infractions(group_id);
```
**Razón:** Usado en estadísticas de grupo

**9. waitlist_logs.entry_id**
```sql
CREATE INDEX idx_waitlist_logs_entry_id 
ON public.waitlist_logs(entry_id);
```
**Razón:** Usado en auditoría de waitlist

**10. waitlist_logs.offer_id**
```sql
CREATE INDEX idx_waitlist_logs_offer_id 
ON public.waitlist_logs(offer_id);
```
**Razón:** Usado en auditoría de ofertas

**11. blocked_dates.group_id**
```sql
CREATE INDEX idx_blocked_dates_group_id 
ON public.blocked_dates(group_id);
```
**Razón:** Usado en validación de fechas bloqueadas por grupo

---

## Foreign Keys NO Indexados (Intencional)

### Campos de Auditoría (11 foreign keys)

Estos NO se indexaron porque solo se usan para auditoría y raramente aparecen en WHERE clauses:

1. `blocked_dates.created_by` - Solo para saber quién bloqueó
2. `profiles.blocked_by` - Solo para auditoría
3. `profiles.deactivated_by` - Solo para auditoría
4. `license_plates.approved_by` - Solo para auditoría
5. `parking_groups.deactivated_by` - Solo para auditoría
6. `incident_reports.confirmed_by` - Solo para auditoría
7. `incident_reports.reassigned_reservation_id` - Raramente consultado
8. `user_warnings.issued_by` - Solo para auditoría
9. `user_blocks.warning_id` - Raramente consultado
10. `checkin_infractions.warning_id` - Raramente consultado

**Razón:** Indexar campos de auditoría:
- ❌ Ralentiza INSERTs/UPDATEs
- ❌ Ocupa espacio innecesario
- ❌ Nunca se usan en WHERE clauses
- ✅ Se pueden añadir después si cambian los patrones de consulta

---

## Índices No Usados (31 índices)

### Decisión: Mantener por Ahora

**Razón:** Precaución - Pueden usarse en el futuro cuando:
- Haya más datos
- Se implementen features pendientes
- Cambien los patrones de consulta

### Categorías de Índices No Usados

**1. Features No Implementadas (2 índices)**
- `idx_license_plates_electric_expires` - Feature de vehículos eléctricos
- `idx_license_plates_disability_expires` - Feature de discapacidad

**2. Campos de Estado (6 índices)**
- `idx_profiles_is_blocked`
- `idx_profiles_is_deactivated`
- `idx_parking_groups_incident_reserve`
- `idx_license_plates_deleted_at`
- `idx_parking_groups_scheduled_deactivation`
- `idx_parking_groups_button_size`

**3. Índices de Auditoría (5 índices)**
- `idx_cancellation_log_user_id`
- `idx_cancellation_log_reservation_id`
- `idx_cancellation_log_cancelled_at`
- `idx_incident_reports_offending_license_plate`
- `idx_incident_reports_reporter_id`

**4. Índices de Check-in (7 índices)**
- `idx_checkins_user_date`
- `idx_checkins_group_date`
- `idx_checkins_pending`
- `idx_infractions_user`
- `idx_checkin_notifications_user`
- `idx_user_warnings_viewed_at`
- `idx_blocked_dates_date`

**5. Índices de Waitlist (8 índices)**
- `idx_waitlist_offers_entry`
- `idx_waitlist_logs_user`
- `idx_waitlist_logs_action`
- `idx_waitlist_penalties_blocked`
- `idx_notifications_user_created`
- `idx_waitlist_cron_logs_job_date`
- `idx_waitlist_cron_logs_status`
- `idx_incident_reports_offending_user_id`

---

## Impacto Esperado

### Mejoras de Performance

**Queries que se benefician:**

1. **Incident Reports**
   ```sql
   -- ANTES: Seq Scan en incident_reports
   SELECT * FROM incident_reports WHERE reservation_id = 'xxx';
   
   -- DESPUÉS: Index Scan (20-50% más rápido)
   ```

2. **Check-in Statistics**
   ```sql
   -- ANTES: Seq Scan en reservation_checkins
   SELECT COUNT(*) FROM reservation_checkins WHERE spot_id = 'xxx';
   
   -- DESPUÉS: Index Scan (30-60% más rápido)
   ```

3. **Waitlist Processing**
   ```sql
   -- ANTES: Seq Scan en waitlist_offers
   SELECT * FROM waitlist_offers WHERE spot_id = 'xxx';
   
   -- DESPUÉS: Index Scan (40-70% más rápido)
   ```

### Costo de los Índices

**Espacio adicional:** ~1-2 MB (insignificante)  
**Impacto en writes:** < 5% más lento en INSERTs/UPDATEs (aceptable)  
**Beneficio en reads:** 20-50% más rápido en queries con JOINs

---

## Cuándo Eliminar Índices No Usados

### Indicadores para Limpieza

**Eliminar índices cuando:**
1. ✅ Han pasado 6+ meses sin uso
2. ✅ Estás seguro de que la feature no se implementará
3. ✅ Necesitas liberar espacio (> 100 MB de índices)
4. ✅ Los writes se vuelven lentos (> 100ms)

### Proceso de Eliminación Seguro

```sql
-- 1. Verificar que el índice no se usa
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname = 'idx_name_here'
  AND idx_scan = 0;

-- 2. Si idx_scan = 0 después de 6 meses, eliminar
DROP INDEX IF EXISTS idx_name_here;
```

---

## Monitoreo de Índices

### Verificar Uso de Índices

```sql
-- Ver índices más usados
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- Ver índices nunca usados
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Comandos MCP

```typescript
// Ver advisors de performance
mcp_supabase_get_advisors({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  type: "performance"
})

// Ver uso de índices
mcp_supabase_execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: `
    SELECT 
      indexname,
      idx_scan,
      pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 20
  `
})
```

---

## Próximos Pasos

### Corto Plazo (1-3 meses)
- ✅ Monitorear uso de nuevos índices
- ✅ Verificar mejora en query performance
- ✅ Medir impacto en writes

### Medio Plazo (3-6 meses)
- ⚠️ Revisar índices no usados
- ⚠️ Considerar eliminar índices de features no implementadas
- ⚠️ Añadir índices adicionales si aparecen nuevos patrones

### Largo Plazo (6-12 meses)
- 📊 Limpieza de índices no usados (si > 6 meses sin uso)
- 📊 Optimización de índices compuestos
- 📊 Considerar índices parciales para casos específicos

---

## Referencias

- [PostgreSQL Index Performance](https://www.postgresql.org/docs/current/indexes-intro.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Index Maintenance Best Practices](https://wiki.postgresql.org/wiki/Index_Maintenance)

---

**Documento generado:** 2025-11-16  
**Migración aplicada:** `20251116125242_add_missing_foreign_key_indexes.sql`  
**Estado:** 11 índices añadidos, 31 índices no usados mantenidos ✅
