# K6 Load Tests - RESERVEO

Tests de rendimiento para validar el comportamiento del sistema bajo diferentes cargas.

## Quick Start

### 1. Instalar K6

```bash
# macOS
brew install k6

# Verificar instalación
k6 version
```

### 2. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.k6.example .env.k6

# Editar y añadir tu SUPABASE_ANON_KEY
nano .env.k6
```

### 3. Ejecutar Tests

```bash
# Smoke test (rápido, 1 minuto)
export $(cat .env.k6 | xargs) && k6 run tests/k6/smoke-test.js

# Load test (medio, 10 minutos)
export $(cat .env.k6 | xargs) && k6 run tests/k6/load-test.js

# Stress test (largo, 25 minutos)
export $(cat .env.k6 | xargs) && k6 run tests/k6/stress-test.js

# Spike test (medio, 10 minutos)
export $(cat .env.k6 | xargs) && k6 run tests/k6/spike-test.js
```

## Tests Disponibles

### Tests Básicos

#### smoke-test.js
- **Propósito:** Validar que el script funciona y el sistema responde
- **VUs:** 2 usuarios
- **Duración:** 1 minuto
- **Cuándo:** Después de cada cambio de código
- **Cubre:** Endpoints básicos + nuevos endpoints (check-in, waitlist, warnings)

#### load-test.js
- **Propósito:** Verificar rendimiento bajo carga normal
- **VUs:** 50-100 usuarios
- **Duración:** 10 minutos
- **Cuándo:** Regularmente, antes de releases

#### stress-test.js
- **Propósito:** Encontrar límites del sistema
- **VUs:** 100-400 usuarios (progresivo)
- **Duración:** 25 minutos
- **Cuándo:** Antes de eventos importantes

#### spike-test.js
- **Propósito:** Validar comportamiento ante picos súbitos
- **VUs:** 50 → 500 → 50 usuarios
- **Duración:** 10 minutos
- **Cuándo:** Antes de lanzamientos

### Tests de Funcionalidades Nuevas

#### checkin-test.js ⭐ NUEVO
- **Propósito:** Validar sistema de check-in/check-out bajo carga
- **VUs:** Ramp-up a 200 usuarios (simula pico matutino 8-9 AM)
- **Duración:** 15 minutos
- **Cuándo:** Antes de releases, después de cambios en check-in
- **Cubre:** 
  - `perform_checkin` - Check-in con validación de ventana
  - `perform_checkout` - Check-out y liberación de plaza
  - Consulta de registros y estado
  - Consulta de infracciones

#### waitlist-test.js ⭐ NUEVO
- **Propósito:** Validar sistema de lista de espera bajo carga
- **VUs:** 50 usuarios simultáneos
- **Duración:** 10 minutos
- **Cuándo:** Antes de releases, después de cambios en waitlist
- **Cubre:**
  - `register_in_waitlist` - Registro con validaciones
  - `process_waitlist_for_spot` - Procesamiento automático
  - `accept_waitlist_offer` - Aceptar oferta y crear reserva
  - `reject_waitlist_offer` - Rechazar oferta y procesar siguiente
  - Consulta de posición y penalizaciones

#### checkin-stats-test.js ⭐ NUEVO
- **Propósito:** Validar dashboard de estadísticas de check-in
- **VUs:** 20 admins consultando simultáneamente
- **Duración:** 5 minutos
- **Cuándo:** Antes de releases, después de cambios en estadísticas
- **Cubre:**
  - `get_checkin_stats` - Métricas generales (30 días)
  - `get_checkin_activity_by_hour` - Actividad por hora
  - `get_checkin_heatmap` - Matriz día x hora (query pesada)
  - `get_top_fast_checkin_users` - Ranking de usuarios

## Interpretar Resultados

### ✅ Test Exitoso
```
✓ checks.........................: 100.00%
✓ http_req_duration..............: avg=250ms p(95)=400ms
✓ http_req_failed................: 0.00%
```

### ⚠️ Advertencias
```
http_req_duration: p(95)=800ms  → Respuestas lentas
http_req_failed: 5.00%          → Algunos errores
```

### ❌ Test Fallido
```
✗ http_req_duration: p(95)=5s   → Muy lento
✗ http_req_failed: 25.00%       → Muchos errores
```

## Métricas Clave

- **http_req_duration:** Tiempo de respuesta (objetivo: p95 < 500ms)
- **http_req_failed:** % de requests fallidos (objetivo: < 1%)
- **checks:** % de validaciones exitosas (objetivo: > 95%)
- **http_reqs:** Requests por segundo (throughput)

## Troubleshooting

### Error: "SUPABASE_ANON_KEY is undefined"
```bash
# Solución: Exportar variables antes de ejecutar
export $(cat .env.k6 | xargs) && k6 run tests/k6/smoke-test.js
```

### Error: "connection refused"
```bash
# Solución: Verificar que Supabase está accesible
curl https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/
```

### Resultados inconsistentes
```bash
# Solución: Ejecutar múltiples veces y promediar
for i in {1..3}; do
  export $(cat .env.k6 | xargs) && k6 run tests/k6/load-test.js
done
```

## Próximos Pasos

1. ✅ Ejecutar smoke test
2. ✅ Validar resultados baseline
3. ✅ Ejecutar load test
4. ✅ Documentar métricas
5. ⏭️ Configurar CI/CD
6. ⏭️ Crear tests de autenticación
7. ⏭️ Crear tests de escritura (POST/PUT)

## Recursos

- **Guía completa:** `docs/K6-LOAD-TESTING-GUIDE.md`
- **Documentación K6:** https://grafana.com/docs/k6/latest/
- **Ejemplos:** https://github.com/grafana/k6/tree/master/examples
