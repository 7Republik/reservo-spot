# K6 Best Practices - RESERVEO

Guía de mejores prácticas y tips avanzados para pruebas de rendimiento con K6.

## Principios Fundamentales

### 1. Empezar Pequeño, Escalar Gradualmente

```javascript
// ✅ CORRECTO: Progresión gradual
Smoke (2 VUs) → Load (50 VUs) → Stress (200 VUs) → Spike (500 VUs)

// ❌ INCORRECTO: Saltar directamente a stress
Smoke (2 VUs) → Stress (500 VUs)
```

**Por qué:** Detectar problemas temprano es más barato que descubrirlos bajo carga extrema.

### 2. Simular Comportamiento Real de Usuarios

```javascript
// ✅ CORRECTO: Simula usuario real
export default function() {
  // Ver dashboard
  http.get('/api/dashboard');
  sleep(2); // Usuario lee información
  
  // Buscar plazas
  http.get('/api/spots');
  sleep(3); // Usuario decide
  
  // Crear reserva
  http.post('/api/reservations', payload);
  sleep(1);
}

// ❌ INCORRECTO: Bombardeo sin sentido
export default function() {
  http.get('/api/dashboard');
  http.get('/api/spots');
  http.post('/api/reservations', payload);
  // Sin sleep = no realista
}
```

**Por qué:** Los usuarios reales no hacen requests instantáneos. El sleep simula "tiempo de pensar".

### 3. Validar Respuestas, No Solo Enviar Requests

```javascript
// ✅ CORRECTO: Valida respuestas
const res = http.get('/api/spots');
check(res, {
  'status is 200': (r) => r.status === 200,
  'has spots': (r) => JSON.parse(r.body).length > 0,
  'response time OK': (r) => r.timings.duration < 500,
});

// ❌ INCORRECTO: Solo envía requests
http.get('/api/spots');
```

**Por qué:** Un status 200 no significa que la respuesta sea correcta. Valida el contenido.

## Organización de Tests

### Estructura de Archivos

```
tests/k6/
├── smoke-test.js           # Test básico
├── load-test.js            # Test de carga
├── stress-test.js          # Test de estrés
├── spike-test.js           # Test de picos
├── advanced-example.js     # Ejemplo avanzado
├── utils/
│   ├── config.js          # Configuración compartida
│   └── helpers.js         # Funciones helper
└── README.md              # Documentación
```

### Reutilización de Código

```javascript
// ✅ CORRECTO: Usar configuración compartida
import { supabaseHeaders, endpoints } from './utils/config.js';
import { checkSuccessfulResponse } from './utils/helpers.js';

export default function() {
  const res = http.get(endpoints.profiles, { headers: supabaseHeaders });
  checkSuccessfulResponse(res, 'profiles');
}

// ❌ INCORRECTO: Duplicar código en cada test
export default function() {
  const headers = {
    'apikey': 'eyJhbGci...',
    'Authorization': 'Bearer eyJhbGci...',
  };
  const res = http.get('https://xxx.supabase.co/rest/v1/profiles', { headers });
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

## Configuración de Tests

### Thresholds Apropiados

```javascript
// ✅ CORRECTO: Thresholds realistas según tipo de test
export const options = {
  // Smoke test: Estricto
  thresholds: {
    http_req_duration: ['p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  
  // Load test: Moderado
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  
  // Stress test: Permisivo
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

// ❌ INCORRECTO: Mismo threshold para todos
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<100'], // Demasiado estricto
  },
};
```

### Stages Bien Diseñados

```javascript
// ✅ CORRECTO: Ramp-up, plateau, ramp-down
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp-up gradual
    { duration: '5m', target: 100 },  // Mantener carga
    { duration: '2m', target: 0 },    // Ramp-down gradual
  ],
};

// ❌ INCORRECTO: Cambios bruscos
export const options = {
  stages: [
    { duration: '10s', target: 100 }, // Demasiado rápido
    { duration: '1m', target: 500 },  // Salto muy grande
    { duration: '10s', target: 0 },   // Ramp-down muy rápido
  ],
};
```

## Métricas y Monitoreo

### Métricas Personalizadas

```javascript
import { Counter, Trend, Rate } from 'k6/metrics';

// Contadores para diferentes tipos de requests
const profilesCounter = new Counter('profiles_requests');
const spotsCounter = new Counter('spots_requests');

// Tendencias para tiempos de respuesta específicos
const dbQueryTime = new Trend('db_query_duration');

// Tasas de éxito/fallo
const successRate = new Rate('successful_requests');

export default function() {
  const res = http.get('/api/profiles');
  
  profilesCounter.add(1);
  dbQueryTime.add(res.timings.duration);
  successRate.add(res.status === 200);
}
```

### Tags para Filtrar Resultados

```javascript
// Usar tags para identificar requests
export default function() {
  http.get('/api/profiles', {
    tags: { name: 'list_profiles', type: 'read' }
  });
  
  http.post('/api/reservations', payload, {
    tags: { name: 'create_reservation', type: 'write' }
  });
}

// Luego filtrar en thresholds
export const options = {
  thresholds: {
    'http_req_duration{type:read}': ['p(95)<300'],
    'http_req_duration{type:write}': ['p(95)<800'],
  },
};
```

## Escenarios Avanzados

### Múltiples Escenarios Simultáneos

```javascript
export const options = {
  scenarios: {
    // Usuarios leyendo (mayoría)
    readers: {
      executor: 'constant-vus',
      vus: 80,
      duration: '5m',
      exec: 'readData',
    },
    
    // Usuarios escribiendo (minoría)
    writers: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      exec: 'writeData',
    },
  },
};

export function readData() {
  http.get('/api/spots');
  sleep(1);
}

export function writeData() {
  http.post('/api/reservations', payload);
  sleep(3);
}
```

### Ramping Arrival Rate (Requests por Segundo)

```javascript
// Útil para APIs que deben manejar X requests/segundo
export const options = {
  scenarios: {
    api_load: {
      executor: 'ramping-arrival-rate',
      startRate: 10,  // 10 requests/segundo al inicio
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '1m', target: 50 },   // Ramp-up a 50 req/s
        { duration: '3m', target: 50 },   // Mantener 50 req/s
        { duration: '1m', target: 100 },  // Incrementar a 100 req/s
        { duration: '2m', target: 100 },  // Mantener 100 req/s
      ],
    },
  },
};
```

## Manejo de Datos

### Datos Dinámicos

```javascript
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Cargar datos desde CSV
const csvData = new SharedArray('users', function() {
  return papaparse.parse(open('./data/users.csv'), { header: true }).data;
});

export default function() {
  // Usar datos diferentes por VU
  const user = csvData[__VU % csvData.length];
  
  http.post('/api/login', JSON.stringify({
    email: user.email,
    password: user.password,
  }));
}
```

### Generación de Datos Aleatorios

```javascript
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export default function() {
  const payload = JSON.stringify({
    name: `User ${randomString(8)}`,
    age: randomIntBetween(18, 65),
    email: `user-${__VU}-${__ITER}@example.com`,
  });
  
  http.post('/api/users', payload);
}
```

## Debugging y Troubleshooting

### Logging Condicional

```javascript
import { check } from 'k6';

export default function() {
  const res = http.get('/api/spots');
  
  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  // Solo loggear si falla
  if (!passed) {
    console.error(`❌ Request failed: ${res.status}`);
    console.error(`Response: ${res.body}`);
  }
}
```

### Modo Debug

```javascript
// Ejecutar con --http-debug para ver todos los requests
// k6 run --http-debug tests/k6/smoke-test.js

// O usar console.log estratégicamente
export default function() {
  if (__ITER === 0) {
    console.log(`VU ${__VU} starting...`);
  }
  
  const res = http.get('/api/spots');
  
  if (__VU === 1 && __ITER < 3) {
    console.log(`Response time: ${res.timings.duration}ms`);
  }
}
```

## Integración CI/CD

### GitHub Actions

```yaml
name: K6 Performance Tests

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Diario a las 2 AM

jobs:
  k6-tests:
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
      
      - name: Run Load Test
        if: github.ref == 'refs/heads/main'
        env:
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: k6 run tests/k6/load-test.js
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: |
            *.json
            *.html
```

### Fallar el Build si Thresholds Fallan

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

// K6 retorna exit code 1 si algún threshold falla
// Esto hace que el CI/CD falle automáticamente
```

## Optimización de Tests

### Reducir Overhead de K6

```javascript
// ✅ CORRECTO: Minimizar operaciones en cada iteración
export default function() {
  http.get('/api/spots');
  sleep(1);
}

// ❌ INCORRECTO: Operaciones pesadas en cada iteración
export default function() {
  const data = JSON.parse(open('./large-file.json')); // Leer archivo cada vez
  http.post('/api/data', JSON.stringify(data));
}
```

### Usar SharedArray para Datos Grandes

```javascript
import { SharedArray } from 'k6/data';

// ✅ CORRECTO: Cargar una vez, compartir entre VUs
const data = new SharedArray('large-data', function() {
  return JSON.parse(open('./large-file.json'));
});

export default function() {
  const item = data[__VU % data.length];
  http.post('/api/data', JSON.stringify(item));
}
```

## Checklist de Pre-Ejecución

Antes de ejecutar tests importantes:

- [ ] Variables de entorno configuradas
- [ ] Smoke test ejecutado y pasando
- [ ] Thresholds apropiados para el tipo de test
- [ ] Sleep times realistas (1-3 segundos)
- [ ] Checks validando respuestas correctas
- [ ] Tags para identificar requests
- [ ] Logs solo para errores (no en cada iteración)
- [ ] Confirmación de que NO es producción (si es test destructivo)

## Errores Comunes a Evitar

### 1. No Usar Sleep

```javascript
// ❌ MAL: Bombardea el servidor
export default function() {
  http.get('/api/spots');
  http.get('/api/reservations');
  http.get('/api/profiles');
}

// ✅ BIEN: Simula usuario real
export default function() {
  http.get('/api/spots');
  sleep(1);
  http.get('/api/reservations');
  sleep(2);
  http.get('/api/profiles');
  sleep(1);
}
```

### 2. Thresholds Demasiado Estrictos

```javascript
// ❌ MAL: Imposible de cumplir
thresholds: {
  http_req_duration: ['p(99)<50'], // 50ms es muy poco
}

// ✅ BIEN: Realista
thresholds: {
  http_req_duration: ['p(95)<500'], // 500ms es razonable
}
```

### 3. No Validar Respuestas

```javascript
// ❌ MAL: Solo envía requests
http.get('/api/spots');

// ✅ BIEN: Valida respuestas
const res = http.get('/api/spots');
check(res, {
  'status is 200': (r) => r.status === 200,
  'has data': (r) => r.body.length > 0,
});
```

### 4. Hardcodear Valores

```javascript
// ❌ MAL: Hardcoded
const url = 'https://xxx.supabase.co/rest/v1/profiles';

// ✅ BIEN: Usar variables de entorno
const url = `${__ENV.SUPABASE_URL}/rest/v1/profiles`;
```

## Recursos Adicionales

- **Documentación oficial:** https://grafana.com/docs/k6/latest/
- **Ejemplos:** https://github.com/grafana/k6/tree/master/examples
- **Community:** https://community.grafana.com/c/grafana-k6/
- **Extensions:** https://k6.io/docs/extensions/

## Conclusión

**Principios clave:**
1. Empezar pequeño, escalar gradualmente
2. Simular comportamiento real de usuarios
3. Validar respuestas, no solo enviar requests
4. Usar thresholds apropiados
5. Organizar código de forma reutilizable
6. Monitorear métricas relevantes
7. Integrar en CI/CD

¡Sigue estas prácticas y tendrás tests de rendimiento confiables y mantenibles! 🚀
