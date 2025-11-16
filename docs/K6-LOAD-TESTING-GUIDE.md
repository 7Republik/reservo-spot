# Guía Completa de K6 Load Testing para RESERVEO

## ¿Qué es K6?

**K6** es una herramienta open-source de pruebas de rendimiento desarrollada por Grafana Labs. Te permite:

- ✅ Probar el rendimiento de tu aplicación bajo diferentes cargas
- ✅ Detectar problemas de rendimiento antes de producción
- ✅ Validar que tu sistema cumple con los objetivos de rendimiento (SLOs)
- ✅ Encontrar el límite de capacidad de tu sistema
- ✅ Escribir tests en JavaScript (fácil de aprender)

**¿Por qué K6 y no otras herramientas?**
- Más simple que JMeter
- Más potente que wrk
- Escrito en Go (muy eficiente)
- Sintaxis JavaScript (familiar para desarrolladores web)
- Integración con CI/CD
- Resultados claros y visuales

---

## Instalación

### macOS (tu sistema actual)

```bash
# Usando Homebrew (recomendado)
brew install k6

# Verificar instalación
k6 version
```

### Alternativa: Docker

```bash
# Pull de la imagen
docker pull grafana/k6

# Ejecutar test
docker run --rm -v $(pwd):/scripts grafana/k6 run /scripts/test.js
```

---

## Conceptos Fundamentales

### 1. Virtual Users (VUs)

Los **VUs** son usuarios virtuales que ejecutan tu script simultáneamente.

```javascript
export const options = {
  vus: 10,        // 10 usuarios virtuales
  duration: '30s' // Durante 30 segundos
};
```

### 2. Iterations

Una **iteración** es una ejecución completa de tu función `default`.

```javascript
export default function() {
  // Esto es 1 iteración
  http.get('https://api.example.com/users');
}
```

### 3. Stages

Los **stages** definen cómo cambia la carga durante el test.

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up a 10 VUs
    { duration: '1m', target: 10 },   // Mantener 10 VUs
    { duration: '30s', target: 0 },   // Ramp-down a 0 VUs
  ]
};
```

### 4. Checks

Los **checks** validan que las respuestas son correctas.

```javascript
import { check } from 'k6';

check(res, {
  'status is 200': (r) => r.status === 200,
  'response time < 500ms': (r) => r.timings.duration < 500,
});
```

### 5. Thresholds

Los **thresholds** definen criterios de éxito/fallo del test.

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% de requests < 500ms
    http_req_failed: ['rate<0.01'],   // Menos de 1% de errores
  }
};
```

---

## Tipos de Tests

### 1. Smoke Test (Prueba de Humo)

**Propósito:** Verificar que el script funciona y el sistema responde con carga mínima.

**Cuándo:** Después de cada cambio de código, antes de tests más grandes.

**Configuración:**
- VUs: 1-5
- Duración: 30 segundos - 2 minutos

```javascript
// smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 2,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% < 1s
    http_req_failed: ['rate<0.01'],    // < 1% errores
  }
};

export default function() {
  const res = http.get('https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/profiles');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

### 2. Load Test (Prueba de Carga)

**Propósito:** Verificar rendimiento bajo carga normal/esperada.

**Cuándo:** Regularmente, para validar que el sistema mantiene el rendimiento.

**Configuración:**
- VUs: Carga promedio esperada
- Duración: 5-60 minutos

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 100 },  // Ramp-up a 100 usuarios
    { duration: '10m', target: 100 }, // Mantener 100 usuarios
    { duration: '5m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],
    http_req_failed: ['rate<0.01'],
  }
};

export default function() {
  const res = http.get('https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/reservations');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### 3. Stress Test (Prueba de Estrés)

**Propósito:** Encontrar los límites del sistema bajo carga extrema.

**Cuándo:** Antes de eventos importantes o cambios de infraestructura.

**Configuración:**
- VUs: Por encima de la carga normal
- Duración: 5-60 minutos

```javascript
// stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp-up a 100
    { duration: '5m', target: 100 },  // Mantener 100
    { duration: '2m', target: 200 },  // Incrementar a 200
    { duration: '5m', target: 200 },  // Mantener 200
    { duration: '2m', target: 300 },  // Incrementar a 300
    { duration: '5m', target: 300 },  // Mantener 300
    { duration: '10m', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'],
  }
};

export default function() {
  const res = http.get('https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/parking_spots');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

### 4. Spike Test (Prueba de Picos)

**Propósito:** Validar comportamiento ante picos súbitos de tráfico.

**Cuándo:** Antes de eventos estacionales o lanzamientos.

**Configuración:**
- VUs: Incremento súbito muy alto
- Duración: Corta (minutos)

```javascript
// spike-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 },   // Carga normal
    { duration: '1m', target: 100 },    // Mantener
    { duration: '10s', target: 1400 },  // SPIKE súbito
    { duration: '3m', target: 1400 },   // Mantener spike
    { duration: '10s', target: 100 },   // Volver a normal
    { duration: '3m', target: 100 },    // Mantener
    { duration: '10s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'],
  }
};

export default function() {
  const res = http.get('https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/reservations');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

### 5. Soak Test (Prueba de Resistencia)

**Propósito:** Detectar problemas de memoria leaks y degradación a largo plazo.

**Cuándo:** Después de cambios importantes, antes de releases.

**Configuración:**
- VUs: 80% de la capacidad máxima
- Duración: Larga (horas)

```javascript
// soak-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 400 },     // Ramp-up
    { duration: '3h55m', target: 400 },  // Mantener 4 horas
    { duration: '5m', target: 0 },       // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],
    http_req_failed: ['rate<0.01'],
  }
};

export default function() {
  const res = http.get('https://rlrzcfnhhvrvrxzfifeh.supabase.co/rest/v1/profiles');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

---

## Tests Específicos para RESERVEO

### Test 1: API de Supabase (Lectura)

```javascript
// tests/k6/supabase-read-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY; // Desde variable de entorno

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  }
};

export default function() {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Test 1: Listar perfiles
  const profiles = http.get(`${SUPABASE_URL}/rest/v1/profiles?select=*`, { headers });
  check(profiles, {
    'profiles status 200': (r) => r.status === 200,
    'profiles response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Listar plazas de parking
  const spots = http.get(`${SUPABASE_URL}/rest/v1/parking_spots?select=*`, { headers });
  check(spots, {
    'spots status 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test 3: Listar reservas
  const reservations = http.get(`${SUPABASE_URL}/rest/v1/reservations?select=*`, { headers });
  check(reservations, {
    'reservations status 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

### Test 2: Autenticación de Usuarios

```javascript
// tests/k6/auth-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'], // 5% de errores permitido (credenciales inválidas)
  }
};

export default function() {
  const payload = JSON.stringify({
    email: `test${__VU}@example.com`, // Email único por VU
    password: 'testpassword123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
  };

  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    payload,
    params
  );

  check(res, {
    'auth response received': (r) => r.status === 200 || r.status === 400,
    'response time OK': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

### Test 3: Crear Reserva (Escritura)

```javascript
// tests/k6/create-reservation-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = 'https://rlrzcfnhhvrvrxzfifeh.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const USER_TOKEN = __ENV.USER_TOKEN; // Token de usuario autenticado

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  }
};

export default function() {
  const payload = JSON.stringify({
    spot_id: 'spot-uuid-here',
    reservation_date: '2025-12-01',
    user_id: 'user-uuid-here',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${USER_TOKEN}`,
    },
  };

  const res = http.post(
    `${SUPABASE_URL}/rest/v1/reservations`,
    payload,
    params
  );

  check(res, {
    'reservation created or conflict': (r) => r.status === 201 || r.status === 409,
    'response time OK': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
```

### Test 4: Frontend (Vite Dev Server)

```javascript
// tests/k6/frontend-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8080';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Frontend puede ser más lento
  }
};

export default function() {
  // Test 1: Página principal
  const home = http.get(BASE_URL);
  check(home, {
    'home status 200': (r) => r.status === 200,
    'home loads fast': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Test 2: Dashboard
  const dashboard = http.get(`${BASE_URL}/dashboard`);
  check(dashboard, {
    'dashboard status 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test 3: Admin panel
  const admin = http.get(`${BASE_URL}/admin`);
  check(admin, {
    'admin accessible': (r) => r.status === 200 || r.status === 401,
  });

  sleep(2);
}
```

---

## Estructura de Proyecto Recomendada

```
reservo-spot/
├── tests/
│   └── k6/
│       ├── smoke-test.js
│       ├── load-test.js
│       ├── stress-test.js
│       ├── spike-test.js
│       ├── soak-test.js
│       ├── supabase-read-test.js
│       ├── auth-test.js
│       ├── create-reservation-test.js
│       ├── frontend-test.js
│       └── utils/
│           ├── config.js
│           └── helpers.js
├── .env.k6              # Variables para K6
└── package.json
```

---

## Configuración de Variables de Entorno

### Crear archivo `.env.k6`

```bash
# .env.k6
SUPABASE_URL=https://rlrzcfnhhvrvrxzfifeh.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
USER_TOKEN=token_de_usuario_autenticado
```

### Añadir a `.gitignore`

```bash
# .gitignore
.env.k6
```

---

## Ejecutar Tests

### Comando Básico

```bash
# Ejecutar test simple
k6 run tests/k6/smoke-test.js

# Con variables de entorno
k6 run --env SUPABASE_ANON_KEY=xxx tests/k6/supabase-read-test.js

# Desde archivo .env
export $(cat .env.k6 | xargs) && k6 run tests/k6/supabase-read-test.js
```

### Opciones Útiles

```bash
# Aumentar VUs desde CLI
k6 run --vus 50 --duration 2m tests/k6/load-test.js

# Guardar resultados en JSON
k6 run --out json=results.json tests/k6/load-test.js

# Modo silencioso (solo errores)
k6 run --quiet tests/k6/smoke-test.js

# Ver métricas en tiempo real
k6 run --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" tests/k6/load-test.js
```

---

## Interpretar Resultados

### Métricas Principales

```
✓ checks.........................: 100.00% ✓ 1234      ✗ 0
  data_received..................: 1.2 MB  20 kB/s
  data_sent......................: 123 kB  2.1 kB/s
  http_req_blocked...............: avg=1.2ms   min=0s   med=1ms   max=10ms  p(90)=2ms   p(95)=3ms
  http_req_connecting............: avg=800µs   min=0s   med=700µs max=5ms   p(90)=1.5ms p(95)=2ms
✓ http_req_duration..............: avg=250ms   min=100ms med=200ms max=1s    p(90)=400ms p(95)=500ms
    { expected_response:true }...: avg=250ms   min=100ms med=200ms max=1s    p(90)=400ms p(95)=500ms
✓ http_req_failed................: 0.00%   ✓ 0         ✗ 1234
  http_req_receiving.............: avg=50ms    min=10ms  med=40ms  max=200ms p(90)=80ms  p(95)=100ms
  http_req_sending...............: avg=10ms    min=1ms   med=8ms   max=50ms  p(90)=15ms  p(95)=20ms
  http_req_tls_handshaking.......: avg=0s      min=0s    med=0s    max=0s    p(90)=0s    p(95)=0s
  http_req_waiting...............: avg=190ms   min=80ms  med=150ms max=800ms p(90)=300ms p(95)=380ms
  http_reqs......................: 1234    20.566667/s
  iteration_duration.............: avg=1.25s   min=1.1s  med=1.2s  max=2s    p(90)=1.4s  p(95)=1.5s
  iterations.....................: 1234    20.566667/s
  vus............................: 20      min=20      max=20
  vus_max........................: 20      min=20      max=20
```

**Qué significan:**

- ✅ **checks**: % de validaciones exitosas (debe ser ~100%)
- ⚠️ **http_req_duration**: Tiempo de respuesta (p95 < 500ms es bueno)
- ❌ **http_req_failed**: % de requests fallidos (debe ser < 1%)
- 📊 **http_reqs**: Requests por segundo (throughput)
- 👥 **vus**: Usuarios virtuales activos

### Señales de Problemas

**🔴 Problema de Rendimiento:**
```
http_req_duration..............: avg=2s p(95)=5s
```
→ Respuestas muy lentas

**🔴 Errores de Servidor:**
```
http_req_failed................: 15.00% ✓ 150 ✗ 850
```
→ Muchos requests fallando

**🔴 Timeouts:**
```
http_req_duration..............: avg=30s max=60s
```
→ Servidor no responde

**🔴 Memory Leak (en Soak Test):**
```
# Inicio del test
http_req_duration: avg=200ms

# Después de 2 horas
http_req_duration: avg=2s
```
→ Degradación progresiva

---

## Mejores Prácticas

### 1. Empezar Pequeño

```bash
# ✅ CORRECTO: Empezar con smoke test
k6 run tests/k6/smoke-test.js

# ❌ INCORRECTO: Empezar con stress test
k6 run tests/k6/stress-test.js
```

### 2. Usar Sleep Entre Requests

```javascript
// ✅ CORRECTO
export default function() {
  http.get('https://api.example.com/users');
  sleep(1); // Simula tiempo de "pensar" del usuario
}

// ❌ INCORRECTO (bombardea el servidor)
export default function() {
  http.get('https://api.example.com/users');
  // Sin sleep = requests infinitos
}
```

### 3. Validar Respuestas

```javascript
// ✅ CORRECTO
const res = http.get('https://api.example.com/users');
check(res, {
  'status is 200': (r) => r.status === 200,
  'has users': (r) => JSON.parse(r.body).length > 0,
});

// ❌ INCORRECTO (no valida nada)
http.get('https://api.example.com/users');
```

### 4. Usar Thresholds

```javascript
// ✅ CORRECTO: Define criterios de éxito
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  }
};

// ❌ INCORRECTO: Sin thresholds, no sabes si pasó o falló
export const options = {
  vus: 10,
  duration: '1m',
};
```

### 5. No Probar en Producción (al principio)

```bash
# ✅ CORRECTO: Probar en staging/dev
k6 run --env BASE_URL=https://staging.reserveo.com tests/k6/load-test.js

# ⚠️ CUIDADO: Solo en producción cuando estés seguro
k6 run --env BASE_URL=https://reserveo.com tests/k6/smoke-test.js
```

---

## Integración con CI/CD

### GitHub Actions

```yaml
# .github/workflows/k6-tests.yml
name: K6 Load Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  k6-smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Smoke Test
        env:
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: k6 run tests/k6/smoke-test.js
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

---

## Troubleshooting

### Error: "connection refused"

```bash
# Problema: El servidor no está corriendo
# Solución: Iniciar el servidor primero
npm run dev

# Luego ejecutar K6
k6 run tests/k6/frontend-test.js
```

### Error: "too many open files"

```bash
# Problema: Límite de archivos abiertos
# Solución (macOS/Linux):
ulimit -n 10000

# Luego ejecutar K6
k6 run tests/k6/stress-test.js
```

### Error: "certificate verify failed"

```javascript
// Problema: Certificado SSL inválido (dev/staging)
// Solución: Deshabilitar verificación SSL (solo dev)
export const options = {
  insecureSkipTLSVerify: true,
};
```

### Resultados Inconsistentes

```bash
# Problema: Resultados varían mucho entre ejecuciones
# Solución: Ejecutar múltiples veces y promediar
for i in {1..5}; do
  k6 run tests/k6/load-test.js
done
```

---

## Próximos Pasos

### Fase 1: Setup Inicial (Esta semana)
1. ✅ Instalar K6
2. ✅ Crear estructura de carpetas
3. ✅ Escribir primer smoke test
4. ✅ Ejecutar y validar resultados

### Fase 2: Tests Básicos (Próxima semana)
1. Crear load test para endpoints principales
2. Configurar variables de entorno
3. Documentar resultados baseline

### Fase 3: Tests Avanzados (Siguiente sprint)
1. Implementar stress test
2. Implementar spike test
3. Configurar CI/CD

### Fase 4: Monitoreo Continuo (Ongoing)
1. Ejecutar tests regularmente
2. Comparar resultados históricos
3. Optimizar según findings

---

## Recursos Adicionales

- **Documentación oficial:** https://grafana.com/docs/k6/latest/
- **Ejemplos:** https://github.com/grafana/k6/tree/master/examples
- **Community:** https://community.grafana.com/c/grafana-k6/
- **Supabase + K6:** https://github.com/supabase/benchmarks

---

## Resumen

**K6 te permite:**
1. ✅ Detectar problemas de rendimiento antes de producción
2. ✅ Validar que tu sistema cumple objetivos de rendimiento
3. ✅ Encontrar límites de capacidad
4. ✅ Prevenir caídas del sistema bajo carga

**Tipos de tests:**
- **Smoke:** Validar que funciona (1-5 VUs, 1-2 min)
- **Load:** Carga normal (50-100 VUs, 5-60 min)
- **Stress:** Carga extrema (100-500 VUs, 5-60 min)
- **Spike:** Picos súbitos (100 → 1000+ VUs, minutos)
- **Soak:** Resistencia (80% capacidad, horas)

**Workflow recomendado:**
1. Smoke test → 2. Load test → 3. Stress test → 4. Spike/Soak tests

**Métricas clave:**
- `http_req_duration` (p95 < 500ms)
- `http_req_failed` (< 1%)
- `checks` (~100%)

¡Ahora estás listo para empezar con K6! 🚀
