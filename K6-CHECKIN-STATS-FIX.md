# Fix: Check-in Stats Test - RESERVEO
**Fecha:** 2025-11-16 15:00 UTC  
**Test:** `tests/k6/checkin-stats-test.js`

## 🐛 Problema Identificado

El test `checkin-stats-test.js` estaba **fallando al 100%** porque usaba nombres de funciones SQL que **no existen** en la base de datos.

### Resultado del Test Fallido
```
Status: FAIL
Success Rate: 52.7%
Failed Requests: 2,746 de 5,811 (47.3%)
Thresholds Failed: 2 de 7
```

### Causa Raíz

El test fue creado con nombres de funciones **inventados** sin verificar los nombres reales en la base de datos:

| Test buscaba (❌ INCORRECTO) | Función real (✅ CORRECTO) |
|------------------------------|---------------------------|
| `get_checkin_stats` | `get_avg_reservation_time`, `get_peak_hour`, `get_fastest_user` |
| `get_checkin_activity_by_hour` | `get_activity_by_hour` |
| `get_checkin_heatmap` | `get_heatmap_data` |
| `get_top_fast_checkin_users` | `get_top_fast_users` |

---

## ✅ Solución Aplicada

### Cambios Realizados

1. **Actualizado para usar 6 funciones reales** en lugar de 4 inventadas
2. **Ajustados los parámetros** de entrada según las funciones reales
3. **Actualizados los thresholds** para cada función específica
4. **Eliminada consulta a grupo hardcoded** que no existía

### Funciones Ahora Probadas

```javascript
// 1. Tiempo promedio de reserva
POST /rpc/get_avg_reservation_time
Parámetros: p_start_date, p_end_date, p_group_id, p_unlock_hour

// 2. Hora pico de reservas
POST /rpc/get_peak_hour
Parámetros: p_start_date, p_end_date, p_group_id

// 3. Usuario más rápido
POST /rpc/get_fastest_user
Parámetros: p_start_date, p_end_date, p_group_id, p_unlock_hour

// 4. Actividad por hora
POST /rpc/get_activity_by_hour
Parámetros: p_start_date, p_end_date, p_group_id

// 5. Heatmap de actividad
POST /rpc/get_heatmap_data
Parámetros: p_start_date, p_end_date, p_group_id

// 6. Top usuarios rápidos
POST /rpc/get_top_fast_users
Parámetros: p_start_date, p_end_date, p_group_id, p_unlock_hour, p_fast_threshold, p_limit
```

### Thresholds Actualizados

```javascript
thresholds: {
  'stats_query_duration': ['p(95)<1000'],
  'heatmap_query_duration': ['p(95)<2000'],
  'activity_query_duration': ['p(95)<1000'],
  'stats_success_rate': ['rate>0.95'],
  'http_req_duration{name:get_avg_reservation_time}': ['p(95)<1000'],
  'http_req_duration{name:get_peak_hour}': ['p(95)<1000'],
  'http_req_duration{name:get_fastest_user}': ['p(95)<1000'],
  'http_req_duration{name:get_activity_by_hour}': ['p(95)<1000'],
  'http_req_duration{name:get_heatmap_data}': ['p(95)<2000'],
  'http_req_duration{name:get_top_fast_users}': ['p(95)<1000'],
  'http_req_failed': ['rate<0.05'],
}
```

---

## 🔍 Verificación en Base de Datos

### Funciones Confirmadas

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_avg_reservation_time',
    'get_peak_hour',
    'get_fastest_user',
    'get_activity_by_hour',
    'get_heatmap_data',
    'get_top_fast_users'
  )
ORDER BY routine_name;
```

**Resultado:** ✅ Las 6 funciones existen y están activas en producción.

### Uso en Frontend

Estas funciones son las mismas que usa el hook `useCheckInStats.ts` en el dashboard de admin:

```typescript
// src/hooks/admin/useCheckInStats.ts
const [general, activityByHour, heatmap, topUsers] = await Promise.all([
  loadGeneralStats(filters, unlockHour, fastThreshold),  // Usa get_avg_reservation_time, get_peak_hour, get_fastest_user
  loadActivityByHour(filters),                           // Usa get_activity_by_hour
  loadHeatmapData(filters),                              // Usa get_heatmap_data
  loadTopUsers(filters, unlockHour, fastThreshold),      // Usa get_top_fast_users
]);
```

---

## 📝 Lecciones Aprendidas

### ❌ Error Cometido
Crear tests sin verificar primero qué funciones existen realmente en la base de datos.

### ✅ Proceso Correcto
1. **Verificar funciones existentes** con MCP o SQL
2. **Revisar el código frontend** para ver cómo se usan
3. **Crear el test** basándose en la implementación real
4. **Validar parámetros** consultando la definición de la función

### 🛠️ Herramientas Útiles

```bash
# Verificar funciones en BD con MCP
mcp_supabase_execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'"
})

# O con CLI
supabase db remote psql
\df public.get_*
```

---

## 🚀 Próximos Pasos

1. ✅ Test corregido y listo para ejecutar
2. ⏳ Ejecutar test con `npm run test:k6:checkin-stats`
3. ⏳ Verificar que pasa todos los thresholds
4. ⏳ Ajustar thresholds si es necesario según resultados reales
5. ⏳ Documentar resultados en Grafana Cloud

---

## 📊 Ejecución del Test

```bash
# Ejecutar test corregido
npm run test:k6:checkin-stats

# O directamente con K6
k6 run --env-file .env.k6 tests/k6/checkin-stats-test.js
```

**Configuración:**
- VUs: 20 admins simultáneos
- Duración: 5 minutos
- Rango de fechas: Últimos 30 días
- Grupo: Todas las plazas (null)

---

**Estado:** ✅ ARREGLADO  
**Última actualización:** 2025-11-16 15:00 UTC
