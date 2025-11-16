# ✅ K6 Setup Completo - RESERVEO

## Resumen

Se ha configurado completamente K6 Load Testing para el proyecto RESERVEO. Todo está listo para empezar a hacer pruebas de rendimiento.

## 📦 Archivos Creados

### Documentación
- ✅ `K6-QUICK-START.md` - Guía rápida (5 minutos)
- ✅ `docs/K6-LOAD-TESTING-GUIDE.md` - Guía completa (todo lo que necesitas saber)
- ✅ `docs/K6-BEST-PRACTICES.md` - Mejores prácticas y tips avanzados

### Tests
- ✅ `tests/k6/smoke-test.js` - Prueba rápida (1 min, 2 VUs)
- ✅ `tests/k6/load-test.js` - Carga normal (10 min, 50-100 VUs)
- ✅ `tests/k6/stress-test.js` - Carga extrema (25 min, 100-400 VUs)
- ✅ `tests/k6/spike-test.js` - Picos súbitos (10 min, 50-500 VUs)
- ✅ `tests/k6/advanced-example.js` - Ejemplo avanzado con múltiples escenarios

### Utilidades
- ✅ `tests/k6/utils/config.js` - Configuración compartida
- ✅ `tests/k6/utils/helpers.js` - Funciones helper reutilizables
- ✅ `tests/k6/README.md` - Documentación de tests

### Scripts
- ✅ `scripts/run-k6-tests.sh` - Script para ejecutar tests fácilmente
- ✅ Scripts npm en `package.json`

### Configuración
- ✅ `.env.k6.example` - Template de variables de entorno
- ✅ `.gitignore` actualizado (excluye `.env.k6`)
- ✅ `README.md` actualizado con sección de K6

## 🚀 Próximos Pasos

### 1. Instalar K6 (2 minutos)

```bash
brew install k6
k6 version
```

### 2. Configurar Variables (1 minuto)

```bash
cp .env.k6.example .env.k6
nano .env.k6
```

Añadir tu `SUPABASE_ANON_KEY` desde:
https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/settings/api

### 3. Ejecutar Primer Test (2 minutos)

```bash
npm run test:k6:smoke
```

## 📊 Tests Disponibles

| Test | Comando | Duración | VUs | Propósito |
|------|---------|----------|-----|-----------|
| Smoke | `npm run test:k6:smoke` | 1 min | 2 | Validar que funciona |
| Load | `npm run test:k6:load` | 10 min | 50-100 | Carga normal |
| Stress | `npm run test:k6:stress` | 25 min | 100-400 | Encontrar límites |
| Spike | `npm run test:k6:spike` | 10 min | 50-500 | Picos súbitos |

## 🎯 Workflow Recomendado

```
1. Smoke Test (después de cada cambio)
   ↓
2. Load Test (antes de releases)
   ↓
3. Stress Test (antes de eventos importantes)
   ↓
4. Spike Test (antes de lanzamientos)
```

## 📚 Documentación

### Para Empezar
1. **Quick Start:** `K6-QUICK-START.md` (5 minutos)
2. **Ejecutar primer test:** `npm run test:k6:smoke`
3. **Interpretar resultados:** Ver sección en Quick Start

### Para Profundizar
1. **Guía Completa:** `docs/K6-LOAD-TESTING-GUIDE.md`
   - Conceptos fundamentales
   - Tipos de tests explicados
   - Tests específicos para RESERVEO
   - Troubleshooting

2. **Best Practices:** `docs/K6-BEST-PRACTICES.md`
   - Principios fundamentales
   - Organización de tests
   - Métricas y monitoreo
   - Escenarios avanzados
   - Integración CI/CD

3. **Tests README:** `tests/k6/README.md`
   - Descripción de cada test
   - Cómo ejecutarlos
   - Interpretar resultados

## 🛠️ Comandos Útiles

```bash
# Ejecutar tests individuales
npm run test:k6:smoke
npm run test:k6:load
npm run test:k6:stress
npm run test:k6:spike

# Usando script directo
./scripts/run-k6-tests.sh smoke
./scripts/run-k6-tests.sh load

# Ver ayuda
./scripts/run-k6-tests.sh help

# Comando K6 directo (con más opciones)
export $(cat .env.k6 | xargs) && k6 run tests/k6/smoke-test.js

# Guardar resultados en JSON
export $(cat .env.k6 | xargs) && k6 run --out json=results.json tests/k6/load-test.js
```

## ✅ Checklist de Setup

- [ ] K6 instalado (`k6 version`)
- [ ] Archivo `.env.k6` creado
- [ ] `SUPABASE_ANON_KEY` configurada
- [ ] Smoke test ejecutado exitosamente
- [ ] Resultados interpretados correctamente
- [ ] Documentación leída

## 🎓 Conceptos Clave

### Virtual Users (VUs)
Usuarios virtuales que ejecutan tu script simultáneamente.

### Stages
Definen cómo cambia la carga durante el test (ramp-up, plateau, ramp-down).

### Checks
Validaciones que verifican que las respuestas son correctas.

### Thresholds
Criterios de éxito/fallo del test (ej: 95% de requests < 500ms).

### Métricas Principales
- `http_req_duration`: Tiempo de respuesta
- `http_req_failed`: % de requests fallidos
- `checks`: % de validaciones exitosas
- `http_reqs`: Requests por segundo

## 🔍 Interpretar Resultados

### ✅ Test Exitoso
```
✓ checks: 100.00%
✓ http_req_duration: avg=250ms p(95)=400ms
✓ http_req_failed: 0.00%
```

### ⚠️ Advertencias
```
checks: 95.00%
http_req_duration: avg=800ms p(95)=1.2s
http_req_failed: 5.00%
```

### ❌ Test Fallido
```
✗ checks: 60.00%
✗ http_req_duration: avg=5s p(95)=10s
✗ http_req_failed: 40.00%
```

## 🚨 Troubleshooting

### "k6: command not found"
```bash
brew install k6
```

### "SUPABASE_ANON_KEY is undefined"
```bash
# Verificar .env.k6
cat .env.k6

# Exportar manualmente
export SUPABASE_ANON_KEY="tu_key_aqui"
```

### "connection refused"
```bash
# Verificar conectividad
curl https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/
```

## 📈 Próximas Mejoras

### Fase 1: Básico (Completado ✅)
- [x] Instalar K6
- [x] Crear tests básicos
- [x] Documentación completa

### Fase 2: Intermedio (Próxima semana)
- [ ] Ejecutar load test regularmente
- [ ] Documentar métricas baseline
- [ ] Crear tests de autenticación

### Fase 3: Avanzado (Siguiente sprint)
- [ ] Tests de escritura (POST/PUT)
- [ ] Múltiples escenarios simultáneos
- [ ] Integración con CI/CD

### Fase 4: Producción (Ongoing)
- [ ] Monitoreo continuo
- [ ] Alertas automáticas
- [ ] Comparación histórica de resultados

## 🎉 ¡Listo para Empezar!

Todo está configurado. Ahora puedes:

1. **Instalar K6:** `brew install k6`
2. **Configurar .env.k6:** Copiar template y añadir tu ANON_KEY
3. **Ejecutar primer test:** `npm run test:k6:smoke`
4. **Leer documentación:** Empezar con `K6-QUICK-START.md`

## 📞 Recursos

- **Documentación K6:** https://grafana.com/docs/k6/latest/
- **Ejemplos:** https://github.com/grafana/k6/tree/master/examples
- **Community:** https://community.grafana.com/c/grafana-k6/
- **Supabase + K6:** https://github.com/supabase/benchmarks

---

**Creado:** 2025-11-16  
**Proyecto:** RESERVEO  
**Stack:** K6 + Supabase + React

¡Feliz testing! 🚀
