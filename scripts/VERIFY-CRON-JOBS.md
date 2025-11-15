# Verificación de Cron Jobs - Sistema de Lista de Espera

## Objetivo
Verificar que los cron jobs del sistema de lista de espera están configurados correctamente y funcionando.

## Cron Jobs Configurados

### 1. expire-waitlist-offers
- **Frecuencia**: Cada 5 minutos
- **Función**: `public.cron_expire_waitlist_offers()`
- **Propósito**: Expirar ofertas que no han sido respondidas en el tiempo límite

### 2. cleanup-expired-waitlist-entries
- **Frecuencia**: Diario a las 00:00 UTC
- **Función**: `public.cron_cleanup_expired_waitlist_entries()`
- **Propósito**: Limpiar entradas de lista de espera obsoletas

### 3. send-waitlist-reminders (FUTURO)
- **Frecuencia**: Cada 15 minutos
- **Función**: `public.cron_send_waitlist_reminders()`
- **Estado**: Preparado pero comentado (pendiente implementación de Edge Function)

## Verificación

### 1. Verificar que pg_cron está habilitado

```sql
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'pg_cron';
```

**Resultado esperado:**
```
 extname | extversion 
---------+------------
 pg_cron | 1.6
```

### 2. Verificar que los cron jobs están configurados

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname LIKE '%waitlist%'
ORDER BY jobname;
```

**Resultado esperado:**
```
 jobid |            jobname             |  schedule   |                        command                         | active 
-------+--------------------------------+-------------+--------------------------------------------------------+--------
     1 | cleanup-expired-waitlist-...   | 0 0 * * *   | SELECT public.cron_cleanup_expired_waitlist_entries()  | t
     2 | expire-waitlist-offers         | */5 * * * * | SELECT public.cron_expire_waitlist_offers()            | t
```

### 3. Verificar historial de ejecuciones de pg_cron

```sql
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time AS duration
FROM cron.job_run_details
WHERE command LIKE '%waitlist%'
ORDER BY start_time DESC
LIMIT 10;
```

**Resultado esperado:**
- Debe mostrar ejecuciones recientes
- `status` debe ser 'succeeded' para ejecuciones exitosas
- `return_message` debe estar vacío o mostrar el resultado

### 4. Verificar logs de aplicación

```sql
SELECT 
  id,
  job_name,
  execution_status,
  records_affected,
  error_message,
  execution_time_ms,
  created_at
FROM public.waitlist_cron_logs
ORDER BY created_at DESC
LIMIT 20;
```

**Resultado esperado:**
- Debe mostrar logs de ejecuciones
- `execution_status` debe ser 'success' en ejecuciones normales
- `records_affected` muestra cuántos registros se procesaron
- `execution_time_ms` muestra el tiempo de ejecución

### 5. Verificar tabla de logs existe

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'waitlist_cron_logs'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
    table_name      |   column_name    |     data_type      
--------------------+------------------+--------------------
 waitlist_cron_logs | id               | uuid
 waitlist_cron_logs | job_name         | text
 waitlist_cron_logs | execution_status | text
 waitlist_cron_logs | records_affected | integer
 waitlist_cron_logs | error_message    | text
 waitlist_cron_logs | execution_time_ms| integer
 waitlist_cron_logs | created_at       | timestamp with...
```

## Gestión de Cron Jobs

### Desactivar un cron job temporalmente

```sql
SELECT cron.unschedule('expire-waitlist-offers');
```

### Reactivar un cron job

```sql
SELECT cron.schedule(
  'expire-waitlist-offers',
  '*/5 * * * *',
  $$SELECT public.cron_expire_waitlist_offers()$$
);
```

### Cambiar la frecuencia de un cron job

```sql
-- Primero desactivar
SELECT cron.unschedule('expire-waitlist-offers');

-- Luego crear con nueva frecuencia (ejemplo: cada 10 minutos)
SELECT cron.schedule(
  'expire-waitlist-offers',
  '*/10 * * * *',
  $$SELECT public.cron_expire_waitlist_offers()$$
);
```

### Ejecutar manualmente un cron job (para testing)

```sql
-- Expirar ofertas
SELECT public.cron_expire_waitlist_offers();

-- Limpiar entradas
SELECT public.cron_cleanup_expired_waitlist_entries();
```

## Monitoreo

### Ver estadísticas de ejecución

```sql
SELECT 
  job_name,
  execution_status,
  COUNT(*) as total_executions,
  AVG(execution_time_ms) as avg_time_ms,
  MAX(execution_time_ms) as max_time_ms,
  SUM(records_affected) as total_records_affected
FROM public.waitlist_cron_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY job_name, execution_status
ORDER BY job_name, execution_status;
```

### Ver errores recientes

```sql
SELECT 
  job_name,
  error_message,
  execution_time_ms,
  created_at
FROM public.waitlist_cron_logs
WHERE execution_status = 'error'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Ver última ejecución de cada job

```sql
SELECT DISTINCT ON (job_name)
  job_name,
  execution_status,
  records_affected,
  execution_time_ms,
  created_at
FROM public.waitlist_cron_logs
ORDER BY job_name, created_at DESC;
```

## Troubleshooting

### Problema: Los cron jobs no se ejecutan

**Verificar:**
1. pg_cron está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Los jobs están activos: `SELECT * FROM cron.job WHERE active = true;`
3. No hay errores en los logs: `SELECT * FROM cron.job_run_details WHERE status = 'failed';`

### Problema: Los cron jobs fallan con errores

**Verificar:**
1. Las funciones existen: `SELECT proname FROM pg_proc WHERE proname LIKE '%waitlist%';`
2. Los permisos son correctos: Las funciones deben ser SECURITY DEFINER
3. Ver logs de error: `SELECT * FROM public.waitlist_cron_logs WHERE execution_status = 'error';`

### Problema: Los cron jobs se ejecutan pero no procesan registros

**Verificar:**
1. Hay datos para procesar:
   ```sql
   -- Ofertas expiradas
   SELECT COUNT(*) FROM waitlist_offers 
   WHERE status = 'pending' AND expires_at < NOW();
   
   -- Entradas obsoletas
   SELECT COUNT(*) FROM waitlist_entries 
   WHERE reservation_date < CURRENT_DATE;
   ```

2. Las funciones funcionan manualmente:
   ```sql
   SELECT public.expire_waitlist_offers();
   SELECT public.cleanup_expired_waitlist_entries();
   ```

## Notas Importantes

1. **Zona horaria**: Los cron jobs se ejecutan en UTC. Ajustar horarios según necesidad.

2. **Frecuencia**: 
   - Expirar ofertas cada 5 minutos es adecuado para tiempo de respuesta de 30-120 minutos
   - Si se reduce el tiempo de aceptación, considerar aumentar frecuencia

3. **Limpieza de logs**: Considerar limpiar logs antiguos periódicamente:
   ```sql
   DELETE FROM public.waitlist_cron_logs 
   WHERE created_at < NOW() - INTERVAL '90 days';
   ```

4. **Monitoreo**: Configurar alertas si:
   - Un cron job falla 3 veces consecutivas
   - El tiempo de ejecución supera 30 segundos
   - No hay ejecuciones en 1 hora (para jobs de 5 minutos)

## Referencias

- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- Diseño del sistema: `.kiro/specs/01-sistema-lista-espera/design.md`
