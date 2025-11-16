# K6 Quick Start - RESERVEO

Guía rápida para empezar con K6 en 5 minutos.

## 1. Instalar K6 (2 minutos)

```bash
# macOS
brew install k6

# Verificar instalación
k6 version
```

**Salida esperada:**
```
k6 v0.xx.x (go1.xx.x, darwin/arm64)
```

## 2. Configurar Variables (1 minuto)

```bash
# Copiar template
cp .env.k6.example .env.k6

# Editar archivo
nano .env.k6
```

**Añadir tu SUPABASE_ANON_KEY:**
```bash
SUPABASE_URL=https://rlrzcfnhhvrvrxzfifeh.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # Tu key aquí
```

**Obtener tu ANON_KEY:**
1. Ve a: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/settings/api
2. Copia "anon public" key
3. Pégala en `.env.k6`

## 3. Ejecutar Primer Test (2 minutos)

```bash
# Opción 1: Usando npm script (recomendado)
npm run test:k6:smoke

# Opción 2: Usando script directo
./scripts/run-k6-tests.sh smoke

# Opción 3: Comando K6 directo
export $(cat .env.k6 | xargs) && k6 run tests/k6/smoke-test.js
```

## 4. Interpretar Resultados

### ✅ Test Exitoso

```
✓ checks.........................: 100.00% ✓ 120       ✗ 0
✓ http_req_duration..............: avg=250ms   p(95)=400ms
✓ http_req_failed................: 0.00%   ✓ 0         ✗ 120
  http_reqs......................: 120     2/s
```

**Significado:**
- ✅ Todas las validaciones pasaron (100%)
- ✅ Tiempo de respuesta promedio: 250ms
- ✅ 95% de requests < 400ms
- ✅ 0% de errores
- ✅ 2 requests por segundo

### ⚠️ Advertencias

```
✓ checks.........................: 95.00%  ✓ 114       ✗ 6
  http_req_duration..............: avg=800ms   p(95)=1.2s
  http_req_failed................: 5.00%   ✓ 6         ✗ 114
```

**Significado:**
- ⚠️ Algunas validaciones fallaron (95%)
- ⚠️ Respuestas más lentas (800ms promedio)
- ⚠️ 5% de errores (6 de 120 requests)

### ❌ Test Fallido

```
✗ checks.........................: 60.00%  ✓ 72        ✗ 48
✗ http_req_duration..............: avg=5s      p(95)=10s
✗ http_req_failed................: 40.00%  ✓ 48        ✗ 72
```

**Significado:**
- ❌ Muchas validaciones fallaron (60%)
- ❌ Respuestas muy lentas (5s promedio)
- ❌ 40% de errores (sistema colapsado)

## 5. Próximos Tests

### Tests Básicos

#### Smoke Test (Ya ejecutado)
```bash
npm run test:k6:smoke
```
- Duración: 1 minuto
- VUs: 2 usuarios
- Propósito: Validar que funciona

#### Load Test
```bash
npm run test:k6:load
```
- Duración: 10 minutos
- VUs: 50-100 usuarios
- Propósito: Carga normal

#### Stress Test
```bash
npm run test:k6:stress
```
- Duración: 25 minutos
- VUs: 100-400 usuarios
- Propósito: Encontrar límites

#### Spike Test
```bash
npm run test:k6:spike
```
- Duración: 10 minutos
- VUs: 50 → 500 → 50 usuarios
- Propósito: Picos súbitos

### Tests de Funcionalidades Nuevas ⭐

#### Check-in Test
```bash
npm run test:k6:checkin
```
- Duración: 15 minutos
- VUs: 200 usuarios (pico matutino)
- Propósito: Validar check-in/check-out

#### Waitlist Test
```bash
npm run test:k6:waitlist
```
- Duración: 10 minutos
- VUs: 50 usuarios
- Propósito: Validar lista de espera

#### Check-in Stats Test
```bash
npm run test:k6:checkin-stats
```
- Duración: 5 minutos
- VUs: 20 admins
- Propósito: Validar dashboard de estadísticas

## Comandos Útiles

```bash
# Ver ayuda del script
./scripts/run-k6-tests.sh help

# Ejecutar todos los tests
npm run test:k6 all

# Ver opciones de K6
k6 run --help

# Guardar resultados en JSON
export $(cat .env.k6 | xargs) && k6 run --out json=results.json tests/k6/smoke-test.js
```

## Troubleshooting

### ❌ "k6: command not found"
```bash
# Instalar K6
brew install k6
```

### ❌ "SUPABASE_ANON_KEY is undefined"
```bash
# Verificar que .env.k6 existe y tiene la key
cat .env.k6

# Exportar variables manualmente
export SUPABASE_ANON_KEY="tu_key_aqui"
```

### ❌ "connection refused"
```bash
# Verificar conectividad con Supabase
curl https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/

# Debería retornar: {"message":"The server is running"}
```

### ❌ "permission denied: ./scripts/run-k6-tests.sh"
```bash
# Dar permisos de ejecución
chmod +x scripts/run-k6-tests.sh
```

## Recursos

- **Guía completa:** `docs/K6-LOAD-TESTING-GUIDE.md`
- **Tests disponibles:** `tests/k6/README.md`
- **Documentación K6:** https://grafana.com/docs/k6/latest/

## Checklist de Setup

- [ ] K6 instalado (`k6 version`)
- [ ] Archivo `.env.k6` creado
- [ ] `SUPABASE_ANON_KEY` configurada
- [ ] Smoke test ejecutado exitosamente
- [ ] Resultados interpretados correctamente

¡Listo! Ya puedes empezar a hacer pruebas de rendimiento 🚀
